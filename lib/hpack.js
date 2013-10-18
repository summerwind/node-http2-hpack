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
  [ 'if-none-match',       ''      ],
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

  this.size = 32;
  this.size += new Buffer(this.name, 'utf8').length;
  this.size += new Buffer(this.value, 'utf8').length;

  this.reference = false;
  this.common    = false;
  this.emitted   = false;
};


// ========================================================
// Header Table Class
// ========================================================
var HeaderTable = function(limit) {
  this._entries = [];
  this.size     = 0;
  this.limit    = limit || DEFAULT_HEADER_TABLE_LIMIT;
};

HeaderTable.prototype.length = function length() {
  return this._entries.length;
};

HeaderTable.prototype.forEach = function forEach(cb) {
  this._entries.forEach(cb);
};

HeaderTable.prototype.find = function find(name, value) {
  var matched_index = null;
  var matched_entry = null;

  this._entries.some(function(entry, index, array) {
    if (entry.name === name) {
      matched_index = index;

      if (entry.value === value) {
        matched_entry = entry;
        return true;
      }
    }
  });

  return {
    matched_index: matched_index,
    matched_entry: matched_entry
  };
};

HeaderTable.prototype.get = function get(index) {
  if (index >= this._entries.length) {
    throw new Error('Invalid index: ' + index);
  }
  return this._entries[index];
};

HeaderTable.prototype.push = function push(entry) {
  var inserted_index = null;

  var length = this._entries.length;
  var removed = this._evict(entry);
  if (length == 0 || length != removed.length) {
    inserted_index = this._entries.push(entry) - 1;
    this.size += entry.size;
  }

  return {
    index: inserted_index,
    removed: removed
  };
};

HeaderTable.prototype.replace = function replace(index, entry) {
  if (index >= this._entries.length) {
    throw new Error('Invalid index: ' + index);
  }

  var replaced_index;
  var removed = this._evict(entry);
  index -= removed.length;

  if (index < 0) {
    this.unshift(entry);
    replaced_index = 0;
  } else {
    this.size -= this._entries[index].size;
    this.size += entry.size;
    this._entries[index] = entry;
    replaced_index = index;
  }

  return {
    index: replaced_index,
    removed: removed
  };
};

HeaderTable.prototype.shift = function shift() {
  var entry = this._entries.shift();
  this.size -= entry.size;
  return entry;
}

HeaderTable.prototype.unshift = function unshift(entry) {
  this._entries.unshift(entry);
  this.size += entry.size;
};

HeaderTable.prototype.remove = function remove(index) {
  this.size -= this._entries[index].size;
  this._entries.splice(index, 1);
};

HeaderTable.prototype.clear = function clear() {
  this._entries = [];
  this.size = 0;
};

HeaderTable.prototype._evict = function _evict(entry) {
  var removed = [];

  if (entry.size > this.limit) {
    removed_entries = this._entries;
    this.clear();
    return removed;
  }

  while ((this.size + entry.size) > this.limit) {
    removed.push(this.shift());
  }

  return removed;
};


// ========================================================
// Context Class
// ========================================================
var Context = function(type, limit) {
  var base_table, self = this;
  this._header_table  = new HeaderTable(limit);

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
  var reps = [];

  for(var name in headers) {
    var value = headers[name];

    var result = this._header_table.find(name, value);
    if (result.matched_entry) {
      var entry = result.matched_entry;
      var cmd = {
        type: REP_INDEXED,
        index: result.matched_index
      };

      if (entry.reference) {
        if (entry.common) {
          // Encode to indexed rep
          var rep = this._encodeHeader(cmd);
          reps.push(rep);
          reps.push(rep);
          reps.push(rep);
          reps.push(rep);

          entry.common = false;
          entry.emitted = true;
        } else if(entry.emitted) {
          // Encode to indexed rep
          var rep = this._encodeHeader(cmd);
          reps.push(rep);
          reps.push(rep);          
        } else {
          // Mark as 'common'
          entry.common = true;
        }
      } else {
        // Encode to indexed rep
        reps.push(this._encodeHeader(cmd));
        // Add to referense set
        entry.reference = true;
        // Mark as 'emitted'
        entry.emitted = true;
      }
    } else {
      // Added to header table
      var entry = new Entry(name, value);
      entry.reference = true;
      entry.emitted = true;
      var push_result = this._header_table.push(entry);

      // Encode removed entries to indexed rep
      for (var i=0, len=push_result.removed.length; i<len; i++) {
        if (push_result.removed[i].common) {
          reps.push(this._encodeHeader({
            type:  REP_INDEXED,
            index: i
          }));
        }
      }

      if (result.matched_index) {
        // Encode to literal rep with indexed name
        reps.push(this._encodeHeader({
          type:  REP_LITERAL_INCR,
          index: result.matched_index,
          value: value
        }));
      } else {
        // Encode to literal rep with new name
        reps.push(this._encodeHeader({
          type:  REP_LITERAL_INCR,
          name:  name,
          value: value
        }));
      }
    }
  }

  // Cleaning referense set
  for (var i=0, len=this._header_table.length(); i<len; i++) {
    var entry = this._header_table.get(i);

    // Encode entries to indexed rep
    if (entry.reference && (!entry.emitted && !entry.common)) {
      entry.reference = false;
      reps.push(this._encodeHeader({
        type:  REP_INDEXED,
        index: i
      }));
    }

    // Cleanup
    entry.emitted = false;
    entry.common  = false;    
  }

  return Buffer.concat(reps);
};

Context.prototype.decompress = function decompress(buffer) {
  var headers = {};
  buffer._cursor = 0;

  while (buffer._cursor < buffer.length) {
    var cmd = this._decodeHeader(buffer);

    if (cmd.type == REP_INDEXED) {
      var entry = this._header_table.get(cmd.index);
      if (entry.reference) {
        entry.reference = false;
      } else {
        entry.reference = true;
        entry.emitted = true;
        headers[entry.name] = entry.value;
      }
    } else {
      if ('index' in cmd) {
        var entry = this._header_table.get(cmd.index);
        cmd.name = entry.name;
        if (!('value' in cmd)) {
          cmd.value = entry.value;
        }
      }

      if (cmd.type !== REP_LITERAL) {
        var entry = new Entry(cmd.name, cmd.value);
        entry.reference = true;
        entry.emitted = true;

        switch (cmd.type) {
          case REP_LITERAL_INCR:
            this._header_table.push(entry);
            break;
          case REP_LITERAL_SUBST:
            this._header_table.replace(cmd.subst_index, entry);
            break;
        }

        headers[entry.name] = entry.value;
      }
    }
  }

  this._header_table.forEach(function(entry){
    if (entry.reference && !entry.emitted) {
      headers[entry.name] = entry.value;
    }
    entry.emitted = false;
  });

  return headers;
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
      buffers.push(this._encodeInteger(cmd.name.length, 8));
      buffers.push(new Buffer(cmd.name, 'utf8'));
    }

    if (cmd.type === REP_LITERAL_SUBST) {
      buffers.push(this._encodeInteger(cmd.subst_index, 0));
    }

    buffers.push(this._encodeInteger(cmd.value.length, 8));    
    buffers.push(new Buffer(cmd.value, 'utf8'));
  }

  this._debug('Command', cmd);

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
    var length = this._decodeInteger(buffer, 8);
    cmd.name = buffer.toString('utf8', buffer._cursor, buffer._cursor+length);
    buffer._cursor += length;
  }

  if (cmd.type === REP_LITERAL_SUBST) {
    cmd.subst_index = this._decodeInteger(buffer, 0);
  }

  var length = this._decodeInteger(buffer, 8);
  cmd.value = buffer.toString('utf8', buffer._cursor, buffer._cursor+length);
  buffer._cursor += length;

  this._debug('Command', cmd);

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
    console.log('[HPACK Debug]', '['+label+']', message);
  } 
}


// ========================================================
// Exports
// ========================================================
exports.createRequestContext = function createRequestContext(limit) {
  return new Context(TYPE_REQUEST, limit);
};

exports.createResponseContext = function createResponseContext(limit) {
  return new Context(TYPE_RESPONSE, limit);
};


