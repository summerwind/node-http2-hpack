var util = require('util');

// ========================================================
// Constants
// ========================================================
var TYPE_REQUEST  = 0;
var TYPE_RESPONSE = 1;

var REP_INDEXED       = 0;
var REP_LITERAL       = 1;
var REP_LITERAL_INCR  = 2;
var REP_LITERAL_SUBST = 3;
var REP_LITERAL_FIRST = 99;

var REP_INFO = [
  { prefix: 7, mask: 0x80 },
  { prefix: 5, mask: 0x60 },
  { prefix: 5, mask: 0x40 },
  { prefix: 6, mask: 0x00 }
];

var REQUEST_HEADER_TABLE = [
  [ ':scheme',             'http'  ],
  [ ':scheme',             'https' ],
  [ ':host',               ''      ],
  [ ':path',               '/'     ],
  [ ':method',             'GET'   ],
  [ 'accept',              ''      ],
  [ 'accept-charset',      ''      ],
  [ 'accept-encoding',     ''      ],
  [ 'accept-language',     ''      ],
  [ 'cookie',              ''      ],
  [ 'if-modified-since',   ''      ],
  [ 'user-agent',          ''      ],
  [ 'referer',             ''      ],
  [ 'authorization',       ''      ],
  [ 'allow',               ''      ],
  [ 'cache-control',       ''      ],
  [ 'connection',          ''      ],
  [ 'content-length',      ''      ],
  [ 'content-type',        ''      ],
  [ 'date',                ''      ],
  [ 'expect',              ''      ],
  [ 'from',                ''      ],
  [ 'if-match',            ''      ],
  [ 'if-range',            ''      ],
  [ 'if-unmodified-since', ''      ],
  [ 'max-forwards',        ''      ],
  [ 'proxy-authorization', ''      ],
  [ 'range',               ''      ],
  [ 'via',                 ''      ]
];

var RESPONSE_HEADER_TABLE = [
  [ ':status',                     '200' ],
  [ 'age',                         ''    ],
  [ 'cache-control',               ''    ],
  [ 'content-length',              ''    ],
  [ 'content-type',                ''    ],
  [ 'date',                        ''    ],
  [ 'etag',                        ''    ],
  [ 'expires',                     ''    ],
  [ 'last-modified',               ''    ],
  [ 'server',                      ''    ],
  [ 'set-cookie',                  ''    ],
  [ 'vary',                        ''    ],
  [ 'via',                         ''    ],
  [ 'access-control-allow-origin', ''    ],
  [ 'accept-ranges',               ''    ],
  [ 'allow',                       ''    ],
  [ 'connection',                  ''    ],
  [ 'content-disposition',         ''    ],
  [ 'content-encoding',            ''    ],
  [ 'content-language',            ''    ],
  [ 'content-location',            ''    ],
  [ 'content-range',               ''    ],
  [ 'link',                        ''    ],
  [ 'location',                    ''    ],
  [ 'proxy-authenticate',          ''    ],
  [ 'refresh',                     ''    ],
  [ 'retry-after',                 ''    ],
  [ 'strict-transport-security',   ''    ],
  [ 'transfer-encoding',           ''    ],
  [ 'www-authenticate',            ''    ]
];

var DEFAULT_HEADER_TABLE_LIMIT = 4096;


// ========================================================
// Entry Class
// ========================================================
var Entry = function(name, value, index) {
  this.name  = name.toLowerCase();
  this.value = value;
  this.index = (index !== undefined) ? index : null;

  this.size = 32;
  this.size += new Buffer(this.name, 'utf8').length;
  this.size += new Buffer(this.value, 'utf8').length;
};


// ========================================================
// Entry Set Class
// ========================================================
var EntrySet = function(entries) {
  this._entries = entries ? entries : [];
};

EntrySet.prototype.findByNameValue = function findByNameValue(name, value) {
  var result = null;
  this._entries.some(function(entry, index, array) {
    if ((entry.name === name) && (entry.value === value)) {
      result = index;
      return true;
    }
  });

  return result;
};

EntrySet.prototype.findByIndex = function findByIndex(search_index) {
  var result = null;
  this._entries.some(function(entry, index, array) {
    if (entry.index === search_index) {
      result = index;
      return true;
    }
  });

  return result;
};

EntrySet.prototype.search = function search(name, value) {
  var result = {
    index: null, 
    exact_match: false
  };

  this._entries.some(function(entry, index, array) {
    if (entry.name === name) {
      result.index = index;

      if (entry.value === value) {
        result.exact_match = true;
        return true;
      }
    }
  });

  return result;
};

EntrySet.prototype.forEach = function forEach(cb) {
  this._entries.forEach(cb);
};

EntrySet.prototype.get = function get(index) {
  if (index >= this._entries.length) {
    throw new Error('Invalid index: ' + index);
  }
  return this._entries[index];
};

EntrySet.prototype.push = function push(entry) {
  return this._entries.push(entry) - 1;
};

EntrySet.prototype.remove = function remove(index) {
  this._entries.splice(index, 1);
};


// ========================================================
// Header Table Class
// ========================================================
var HeaderTable = function(entries, limit) {
  EntrySet.call(this, entries);
  this.size = 0;
};

util.inherits(HeaderTable, EntrySet);

HeaderTable.prototype.push = function hpush(entry) {
  this.size += entry.size;
  return this._entries.push(entry) - 1;
};

HeaderTable.prototype.replace = function hreplace(index, entry) {
  if (index >= this._entries.length) {
    throw new Error('Invalid index: ' + index);
  }

  this.size -= this._entries[index].size;
  this.size += entry.size;
  this._entries[index] = entry;
};

HeaderTable.prototype.shift = function hshift() {
  var entry = this._entries.shift();
  this.size -= entry.size;
  return entry;
}

HeaderTable.prototype.unshift = function hunshift(entry) {
  this._entries.unshift(entry);
  this.size += entry.size;
};

HeaderTable.prototype.remove = function hremove(index) {
  this.size -= this._entries[index].size;
  this._entries.splice(index, 1);
};

HeaderTable.prototype.clear = function clear() {
  this._entries = [];
  this.size = 0;
};


// ========================================================
// Context Class
// ========================================================
var Context = function(type, limit) {
  var base_table, self = this;

  this.limit = limit || DEFAULT_HEADER_TABLE_LIMIT;
  this._reference_set = new EntrySet();
  this._header_table  = new HeaderTable();

  switch (type) {
    case TYPE_REQUEST:
      base_table = REQUEST_HEADER_TABLE;
      break;
    case TYPE_RESPONSE:
      base_table = RESPONSE_HEADER_TABLE;
      break;
    default:
      throw new Error('Unknown type');
  }

  base_table.forEach(function(pair){
    self._header_table.push(new Entry(pair[0], pair[1])); 
  });
};

Context.prototype.compress = function compress(headers) {
  var self = this;
  var commands = [], reps = [];

  // Convert headers to entry set
  var entries = this._convertEntrySet(headers);

  // Search entries to be deleted
  this._reference_set.forEach(function(entry){
    if (entries.findByNameValue(entry.name, entry.value) === null) {
      commands.push({ 
        type: REP_INDEXED, 
        index: entry.index
      });
    }
  });

  // Process delete commands
  commands.forEach(function(cmd){
    self._debug('Command', cmd);
    reps.push(self._encodeHeader(cmd));
    self._process(cmd);
  });

  // Search entries to be added or replaced
  entries.forEach(function(entry){
    var cmd;

    // Search from Reference Set
    var index = self._reference_set.findByNameValue(entry.name, entry.value);
    if (index === null) {

      // Search from Header Table
      var result = self._header_table.search(entry.name, entry.value);
      if (result.index == null) {
        // New Entry (No match)
        cmd = { 
          type:  REP_LITERAL_INCR, 
          name:  entry.name,
          value: entry.value
        };
      } else if (!result.exact_match) {
        // New Entry with indexed name (Partial match)
        cmd = { 
          type:  REP_LITERAL_INCR, 
          index: result.index,
          value: entry.value
        };
      } else {
        // Existing entry (Exact match)
        cmd = {
          type:  REP_INDEXED,
          index: result.index
        };
      }

      // Encode header by comnand
      self._debug('Command', cmd);
      reps.push(self._encodeHeader(cmd));
      self._process(cmd);
    }
  });

  self._debug('Representations', reps);
  self._debug('Reference Set', this._reference_set);

  return Buffer.concat(reps);
};

Context.prototype.decompress = function decompress(buffer) {
  buffer._cursor = 0;
  var headers = {};

  while (buffer._cursor < buffer.length) {
    // Decode header to command
    var cmd = this._decodeHeader(buffer);
    this._debug('Command', cmd);
    // Process command
    this._process(cmd);
  }

  // Generate headers from Reference Set
  this._reference_set.forEach(function(entry){
    headers[entry.name] = entry.value;
  })

  this._debug('Reference Set', this._reference_set);
  this._debug('Headers', headers);

  return headers;
};

Context.prototype._process = function _process(cmd) {
  if (cmd.type === REP_INDEXED) {
    var ht_entry = this._header_table.get(cmd.index);
    var ref_index = this._reference_set.findByNameValue(ht_entry.name, ht_entry.value);
    if (ref_index === null) {
      // Add to Reference Set
      var entry = this._header_table.get(cmd.index);
      this._reference_set.push(new Entry(entry.name, entry.value, cmd.index));
    } else {
      // Remove from Reference Set
      this._reference_set.remove(ref_index);
    }
  } else {
    // Build full entry
    if ('index' in cmd) {
      var entry = this._header_table.get(cmd.index);
      cmd.name = entry.name;
      if (!('value' in cmd)) {
        cmd.value = entry.value;
      }
    }

    // Update Header Table
    if (cmd.type !== REP_LITERAL) {
      var entry = new Entry(cmd.name, cmd.value);
      cmd.type = this._evict(cmd);

      switch (cmd.type) {
        case REP_LITERAL_INCR:
          cmd.index = this._header_table.push(entry);
          break;
        case REP_LITERAL_SUBST:
          this._header_table.replace(cmd.subst_index, entry);
          cmd.index = cmd.subst_index;
          break;
        case REP_LITERAL_FIRST:
          this._header_table.unshift(entry);
          cmd.index = 0;
          break;
      }
    };

    this._reference_set.push(new Entry(cmd.name, cmd.value, cmd.index));
  }
};

Context.prototype._evict = function _evict(cmd) {
  var override_type = cmd.type;
  var evicted = 0;

  var cmd_size = 32;
  cmd_size += new Buffer(cmd.name, 'ascii').length;
  cmd_size += new Buffer(cmd.value, 'utf8').length;

  if (cmd_size > this.limit) {
    this._header_table.clear();
    return REP_LITERAL;
  }

  while ((this._header_table.size + cmd_size) > this.limit) {
    this._header_table.shift();
    evicted++;
  }

  if (cmd.type === REP_LITERAL_SUBST & cmd.subst_index <= evicted) {
    override_type = REP_LITERAL_FIRST;
  }

  return override_type;
};

Context.prototype._convertEntrySet = function _convertEntrySet(headers) {
  var entries = [];
  for (var name in headers) {
    var value = headers[name];
    entries.push(new Entry(name, headers[name]));
  }

  return new EntrySet(entries);
};

Context.prototype._detectHeaderType = function _detectHeaderType(buffer) {
  var rep = null;
  var bytes = buffer[buffer._cursor];

  for (var r=0, len=REP_INFO.length; r<len; r++) {
    if (bytes >= REP_INFO[r].mask) {
      rep = r;
      break;
    }
  }

  if (rep === null) {
    throw new Error('Unkown representations');
  }

  return rep;
};

Context.prototype._encodeHeader = function _encodeHeader(cmd) {
  var buffers = [];
  var rep = REP_INFO[cmd.type];

  var index = ('index' in cmd) ? cmd.index : 0;
  if (cmd.type !== REP_INDEXED && index !== 0) {
    index++;
  }
  buffers.push(this._encodeInteger(index, rep.prefix));
  buffers[0][0] |= rep.mask;

  if (cmd.type !== REP_INDEXED) {
    if ('name' in cmd) {
      buffers.push(this._encodeInteger(cmd.name.length, 0));
      buffers.push(new Buffer(cmd.name, 'utf8'));
    }

    if (cmd.type === REP_LITERAL_SUBST) {
      buffers.push(this._encodeInteger(cmd.subst_index, 0));
    }

    buffers.push(this._encodeInteger(cmd.value.length, 0));
    buffers.push(new Buffer(cmd.value, 'utf8'));
  }

  return Buffer.concat(buffers);
};

Context.prototype._decodeHeader = function _decodeHeader(buffer) {
  var cmd = {};

  cmd.type = this._detectHeaderType(buffer);
  var rep = REP_INFO[cmd.type];

  var index = this._decodeInteger(buffer, rep.prefix);
  if (cmd.type === REP_INDEXED) {
    cmd.index = index;
    return cmd;
  }

  if (index !== 0) {
    cmd.index = index - 1;
  } else {
    var length = this._decodeInteger(buffer, 0);
    cmd.name = buffer.slice(buffer._cursor, buffer._cursor+length).toString('utf8');
    buffer._cursor += length;
  }

  if (cmd.type === REP_LITERAL_SUBST) {
    cmd.subst_index = this._decodeInteger(buffer, 0);
  }

  var length = this._decodeInteger(buffer, 0);
  cmd.value = buffer.slice(buffer._cursor, buffer._cursor+length).toString('utf8');
  buffer._cursor += length;

  return cmd;
};

Context.prototype._encodeInteger = function _encodeInteger(num, prefix) {
  var limit = Math.pow(2, prefix) - 1;
  if (num < limit) {
    return new Buffer([num]);
  }

  var octets = [];
  if (prefix !== 0) {
    octets.push(limit);
  }

  num -= limit;
  while (num >= 128) {
    octets.push(num % 128 | 0x80);
    num = Math.floor(num / 128);
  }
  octets.push(num);

  return new Buffer(octets);
};

Context.prototype._decodeInteger = function _decodeInteger(buffer, prefix) {
  var limit = Math.pow(2, prefix) - 1;
  var multiplier = 1;
  var value = 0;

  if (prefix !== 0) {
    value = buffer[buffer._cursor] & limit;
    buffer._cursor++;
  }

  if (value == limit) {
    do {
      value += (buffer[buffer._cursor] & 0x7F) * multiplier;
      multiplier *= 128;
      buffer._cursor++;
    } while (buffer[buffer._cursor-1] & 0x80);
  }

  return value;
};

Context.prototype._debug = function _debug(label, message) {
  if (process.env.NODE_DEBUG) {
    console.log('[HPAC Debug]', '['+label+']', message);
  } 
}

exports.createRequestContext = function createRequestContext(limit) {
  return new Context(TYPE_REQUEST, limit);
};

exports.createResponseContext = function createResponseContext(limit) {
  return new Context(TYPE_RESPONSE, limit);
};


