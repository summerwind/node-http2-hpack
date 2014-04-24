var util = require('util');

// ========================================================
// Constants
// ========================================================
var REP_INDEXED       = 0;
var REP_LITERAL_INCR  = 1;
var REP_LITERAL       = 2;
var REP_LITERAL_NEVER = 3;
var REP_CTX_UPDATE    = 4;

var CTX_UPDATE_REFERENCE_EMPTY = 0;
var CTX_UPDATE_TABLE_SIZE      = 1;

var REP_INFO = [
  { prefix: 7, mask: 0x80 },  // REP_INDEXED
  { prefix: 6, mask: 0x40 },  // REP_LITERAL_INCR
  { prefix: 4, mask: 0x00 },  // REP_LITERAL
  { prefix: 4, mask: 0x10 },  // REP_LITERAL_NEVER
  { prefix: 4, mask: 0x20 }   // REP_CTX_UPDATE
];

var STATIC_TABLE_PAIRS = [
  [ ':authority',                  ''            ],
  [ ':method',                     'GET'         ],
  [ ':method',                     'POST'        ],
  [ ':path',                       '/'           ],
  [ ':path',                       '/index.html' ],
  [ ':scheme',                     'http'        ],
  [ ':scheme',                     'https'       ],
  [ ':status',                     '200'         ],
  [ ':status',                     '204'         ],
  [ ':status',                     '206'         ],
  [ ':status',                     '304'         ],
  [ ':status',                     '400'         ],
  [ ':status',                     '404'         ],
  [ ':status',                     '500'         ],
  [ 'accept-charset',              ''            ],
  [ 'accept-encoding',             ''            ],
  [ 'accept-language',             ''            ],
  [ 'accept-ranges',               ''            ],
  [ 'accept',                      ''            ],
  [ 'access-control-allow-origin', ''            ],
  [ 'age',                         ''            ],
  [ 'allow',                       ''            ],
  [ 'authorization',               ''            ],
  [ 'cache-control',               ''            ],
  [ 'content-disposition',         ''            ],
  [ 'content-encoding',            ''            ],
  [ 'content-language',            ''            ],
  [ 'content-length',              ''            ],
  [ 'content-location',            ''            ],
  [ 'content-range',               ''            ],
  [ 'content-type',                ''            ],
  [ 'cookie',                      ''            ],
  [ 'date',                        ''            ],
  [ 'etag',                        ''            ],
  [ 'expect',                      ''            ],
  [ 'expires',                     ''            ],
  [ 'from',                        ''            ],
  [ 'host',                        ''            ],
  [ 'if-match',                    ''            ],
  [ 'if-modified-since',           ''            ],
  [ 'if-none-match',               ''            ],
  [ 'if-range',                    ''            ],
  [ 'if-unmodified-since',         ''            ],
  [ 'last-modified',               ''            ],
  [ 'link',                        ''            ],
  [ 'location',                    ''            ],
  [ 'max-forwards',                ''            ],
  [ 'proxy-authenticate',          ''            ],
  [ 'proxy-authorization',         ''            ],
  [ 'range',                       ''            ],
  [ 'referer',                     ''            ],
  [ 'refresh',                     ''            ],
  [ 'retry-after',                 ''            ],
  [ 'server',                      ''            ],
  [ 'set-cookie',                  ''            ],
  [ 'strict-transport-security',   ''            ],
  [ 'transfer-encoding',           ''            ],
  [ 'user-agent',                  ''            ],
  [ 'vary',                        ''            ],
  [ 'via',                         ''            ],
  [ 'www-authenticate',            ''            ]
];

var HUFFMAN_TABLE = [
  { code: 0x3ffffba, bit: 26 },
  { code: 0x3ffffbb, bit: 26 },
  { code: 0x3ffffbc, bit: 26 },
  { code: 0x3ffffbd, bit: 26 },
  { code: 0x3ffffbe, bit: 26 },
  { code: 0x3ffffbf, bit: 26 },
  { code: 0x3ffffc0, bit: 26 },
  { code: 0x3ffffc1, bit: 26 },
  { code: 0x3ffffc2, bit: 26 },
  { code: 0x3ffffc3, bit: 26 },
  { code: 0x3ffffc4, bit: 26 },
  { code: 0x3ffffc5, bit: 26 },
  { code: 0x3ffffc6, bit: 26 },
  { code: 0x3ffffc7, bit: 26 },
  { code: 0x3ffffc8, bit: 26 },
  { code: 0x3ffffc9, bit: 26 },
  { code: 0x3ffffca, bit: 26 },
  { code: 0x3ffffcb, bit: 26 },
  { code: 0x3ffffcc, bit: 26 },
  { code: 0x3ffffcd, bit: 26 },
  { code: 0x3ffffce, bit: 26 },
  { code: 0x3ffffcf, bit: 26 },
  { code: 0x3ffffd0, bit: 26 },
  { code: 0x3ffffd1, bit: 26 },
  { code: 0x3ffffd2, bit: 26 },
  { code: 0x3ffffd3, bit: 26 },
  { code: 0x3ffffd4, bit: 26 },
  { code: 0x3ffffd5, bit: 26 },
  { code: 0x3ffffd6, bit: 26 },
  { code: 0x3ffffd7, bit: 26 },
  { code: 0x3ffffd8, bit: 26 },
  { code: 0x3ffffd9, bit: 26 },
  { code: 0x6,       bit: 5  },
  { code: 0x1ffc,    bit: 13 },
  { code: 0x1f0,     bit: 9  },
  { code: 0x3ffc,    bit: 14 },
  { code: 0x7ffc,    bit: 15 },
  { code: 0x1e,      bit: 6  },
  { code: 0x64,      bit: 7  },
  { code: 0x1ffd,    bit: 13 },
  { code: 0x3fa,     bit: 10 },
  { code: 0x1f1,     bit: 9  },
  { code: 0x3fb,     bit: 10 },
  { code: 0x3fc,     bit: 10 },
  { code: 0x65,      bit: 7  },
  { code: 0x66,      bit: 7  },
  { code: 0x1f,      bit: 6  },
  { code: 0x7,       bit: 5  },
  { code: 0x0,       bit: 4  },
  { code: 0x1,       bit: 4  },
  { code: 0x2,       bit: 4  },
  { code: 0x8,       bit: 5  },
  { code: 0x20,      bit: 6  },
  { code: 0x21,      bit: 6  },
  { code: 0x22,      bit: 6  },
  { code: 0x23,      bit: 6  },
  { code: 0x24,      bit: 6  },
  { code: 0x25,      bit: 6  },
  { code: 0x26,      bit: 6  },
  { code: 0xec,      bit: 8  },
  { code: 0x1fffc,   bit: 17 },
  { code: 0x27,      bit: 6  },
  { code: 0x7ffd,    bit: 15 },
  { code: 0x3fd,     bit: 10 },
  { code: 0x7ffe,    bit: 15 },
  { code: 0x67,      bit: 7  },
  { code: 0xed,      bit: 8  },
  { code: 0xee,      bit: 8  },
  { code: 0x68,      bit: 7  },
  { code: 0xef,      bit: 8  },
  { code: 0x69,      bit: 7  },
  { code: 0x6a,      bit: 7  },
  { code: 0x1f2,     bit: 9  },
  { code: 0xf0,      bit: 8  },
  { code: 0x1f3,     bit: 9  },
  { code: 0x1f4,     bit: 9  },
  { code: 0x1f5,     bit: 9  },
  { code: 0x6b,      bit: 7  },
  { code: 0x6c,      bit: 7  },
  { code: 0xf1,      bit: 8  },
  { code: 0xf2,      bit: 8  },
  { code: 0x1f6,     bit: 9  },
  { code: 0x1f7,     bit: 9  },
  { code: 0x6d,      bit: 7  },
  { code: 0x28,      bit: 6  },
  { code: 0xf3,      bit: 8  },
  { code: 0x1f8,     bit: 9  },
  { code: 0x1f9,     bit: 9  },
  { code: 0xf4,      bit: 8  },
  { code: 0x1fa,     bit: 9  },
  { code: 0x1fb,     bit: 9  },
  { code: 0x7fc,     bit: 11 },
  { code: 0x3ffffda, bit: 26 },
  { code: 0x7fd,     bit: 11 },
  { code: 0x3ffd,    bit: 14 },
  { code: 0x6e,      bit: 7  },
  { code: 0x3fffe,   bit: 18 },
  { code: 0x9,       bit: 5  },
  { code: 0x6f,      bit: 7  },
  { code: 0xa,       bit: 5  },
  { code: 0x29,      bit: 6  },
  { code: 0xb,       bit: 5  },
  { code: 0x70,      bit: 7  },
  { code: 0x2a,      bit: 6  },
  { code: 0x2b,      bit: 6  },
  { code: 0xc,       bit: 5  },
  { code: 0xf5,      bit: 8  },
  { code: 0xf6,      bit: 8  },
  { code: 0x2c,      bit: 6  },
  { code: 0x2d,      bit: 6  },
  { code: 0x2e,      bit: 6  },
  { code: 0xd,       bit: 5  },
  { code: 0x2f,      bit: 6  },
  { code: 0x1fc,     bit: 9  },
  { code: 0x30,      bit: 6  },
  { code: 0x31,      bit: 6  },
  { code: 0xe,       bit: 5  },
  { code: 0x71,      bit: 7  },
  { code: 0x72,      bit: 7  },
  { code: 0x73,      bit: 7  },
  { code: 0x74,      bit: 7  },
  { code: 0x75,      bit: 7  },
  { code: 0xf7,      bit: 8  },
  { code: 0x1fffd,   bit: 17 },
  { code: 0xffc,     bit: 12 },
  { code: 0x1fffe,   bit: 17 },
  { code: 0xffd,     bit: 12 },
  { code: 0x3ffffdb, bit: 26 },
  { code: 0x3ffffdc, bit: 26 },
  { code: 0x3ffffdd, bit: 26 },
  { code: 0x3ffffde, bit: 26 },
  { code: 0x3ffffdf, bit: 26 },
  { code: 0x3ffffe0, bit: 26 },
  { code: 0x3ffffe1, bit: 26 },
  { code: 0x3ffffe2, bit: 26 },
  { code: 0x3ffffe3, bit: 26 },
  { code: 0x3ffffe4, bit: 26 },
  { code: 0x3ffffe5, bit: 26 },
  { code: 0x3ffffe6, bit: 26 },
  { code: 0x3ffffe7, bit: 26 },
  { code: 0x3ffffe8, bit: 26 },
  { code: 0x3ffffe9, bit: 26 },
  { code: 0x3ffffea, bit: 26 },
  { code: 0x3ffffeb, bit: 26 },
  { code: 0x3ffffec, bit: 26 },
  { code: 0x3ffffed, bit: 26 },
  { code: 0x3ffffee, bit: 26 },
  { code: 0x3ffffef, bit: 26 },
  { code: 0x3fffff0, bit: 26 },
  { code: 0x3fffff1, bit: 26 },
  { code: 0x3fffff2, bit: 26 },
  { code: 0x3fffff3, bit: 26 },
  { code: 0x3fffff4, bit: 26 },
  { code: 0x3fffff5, bit: 26 },
  { code: 0x3fffff6, bit: 26 },
  { code: 0x3fffff7, bit: 26 },
  { code: 0x3fffff8, bit: 26 },
  { code: 0x3fffff9, bit: 26 },
  { code: 0x3fffffa, bit: 26 },
  { code: 0x3fffffb, bit: 26 },
  { code: 0x3fffffc, bit: 26 },
  { code: 0x3fffffd, bit: 26 },
  { code: 0x3fffffe, bit: 26 },
  { code: 0x3ffffff, bit: 26 },
  { code: 0x1ffff80, bit: 25 },
  { code: 0x1ffff81, bit: 25 },
  { code: 0x1ffff82, bit: 25 },
  { code: 0x1ffff83, bit: 25 },
  { code: 0x1ffff84, bit: 25 },
  { code: 0x1ffff85, bit: 25 },
  { code: 0x1ffff86, bit: 25 },
  { code: 0x1ffff87, bit: 25 },
  { code: 0x1ffff88, bit: 25 },
  { code: 0x1ffff89, bit: 25 },
  { code: 0x1ffff8a, bit: 25 },
  { code: 0x1ffff8b, bit: 25 },
  { code: 0x1ffff8c, bit: 25 },
  { code: 0x1ffff8d, bit: 25 },
  { code: 0x1ffff8e, bit: 25 },
  { code: 0x1ffff8f, bit: 25 },
  { code: 0x1ffff90, bit: 25 },
  { code: 0x1ffff91, bit: 25 },
  { code: 0x1ffff92, bit: 25 },
  { code: 0x1ffff93, bit: 25 },
  { code: 0x1ffff94, bit: 25 },
  { code: 0x1ffff95, bit: 25 },
  { code: 0x1ffff96, bit: 25 },
  { code: 0x1ffff97, bit: 25 },
  { code: 0x1ffff98, bit: 25 },
  { code: 0x1ffff99, bit: 25 },
  { code: 0x1ffff9a, bit: 25 },
  { code: 0x1ffff9b, bit: 25 },
  { code: 0x1ffff9c, bit: 25 },
  { code: 0x1ffff9d, bit: 25 },
  { code: 0x1ffff9e, bit: 25 },
  { code: 0x1ffff9f, bit: 25 },
  { code: 0x1ffffa0, bit: 25 },
  { code: 0x1ffffa1, bit: 25 },
  { code: 0x1ffffa2, bit: 25 },
  { code: 0x1ffffa3, bit: 25 },
  { code: 0x1ffffa4, bit: 25 },
  { code: 0x1ffffa5, bit: 25 },
  { code: 0x1ffffa6, bit: 25 },
  { code: 0x1ffffa7, bit: 25 },
  { code: 0x1ffffa8, bit: 25 },
  { code: 0x1ffffa9, bit: 25 },
  { code: 0x1ffffaa, bit: 25 },
  { code: 0x1ffffab, bit: 25 },
  { code: 0x1ffffac, bit: 25 },
  { code: 0x1ffffad, bit: 25 },
  { code: 0x1ffffae, bit: 25 },
  { code: 0x1ffffaf, bit: 25 },
  { code: 0x1ffffb0, bit: 25 },
  { code: 0x1ffffb1, bit: 25 },
  { code: 0x1ffffb2, bit: 25 },
  { code: 0x1ffffb3, bit: 25 },
  { code: 0x1ffffb4, bit: 25 },
  { code: 0x1ffffb5, bit: 25 },
  { code: 0x1ffffb6, bit: 25 },
  { code: 0x1ffffb7, bit: 25 },
  { code: 0x1ffffb8, bit: 25 },
  { code: 0x1ffffb9, bit: 25 },
  { code: 0x1ffffba, bit: 25 },
  { code: 0x1ffffbb, bit: 25 },
  { code: 0x1ffffbc, bit: 25 },
  { code: 0x1ffffbd, bit: 25 },
  { code: 0x1ffffbe, bit: 25 },
  { code: 0x1ffffbf, bit: 25 },
  { code: 0x1ffffc0, bit: 25 },
  { code: 0x1ffffc1, bit: 25 },
  { code: 0x1ffffc2, bit: 25 },
  { code: 0x1ffffc3, bit: 25 },
  { code: 0x1ffffc4, bit: 25 },
  { code: 0x1ffffc5, bit: 25 },
  { code: 0x1ffffc6, bit: 25 },
  { code: 0x1ffffc7, bit: 25 },
  { code: 0x1ffffc8, bit: 25 },
  { code: 0x1ffffc9, bit: 25 },
  { code: 0x1ffffca, bit: 25 },
  { code: 0x1ffffcb, bit: 25 },
  { code: 0x1ffffcc, bit: 25 },
  { code: 0x1ffffcd, bit: 25 },
  { code: 0x1ffffce, bit: 25 },
  { code: 0x1ffffcf, bit: 25 },
  { code: 0x1ffffd0, bit: 25 },
  { code: 0x1ffffd1, bit: 25 },
  { code: 0x1ffffd2, bit: 25 },
  { code: 0x1ffffd3, bit: 25 },
  { code: 0x1ffffd4, bit: 25 },
  { code: 0x1ffffd5, bit: 25 },
  { code: 0x1ffffd6, bit: 25 },
  { code: 0x1ffffd7, bit: 25 },
  { code: 0x1ffffd8, bit: 25 },
  { code: 0x1ffffd9, bit: 25 },
  { code: 0x1ffffda, bit: 25 },
  { code: 0x1ffffdb, bit: 25 },
  { code: 0x1ffffdc, bit: 25 }
];

var DO_NOT_INDEXED = {
  'set-cookie':     true,
  'content-length': true,
  'location':       true,
  'etag':           true,
  ':path':          true
};


// ========================================================
// Entry Class
// ========================================================
function Entry(name, value) {
  this.name  = name.toLowerCase();
  this.value = value;

  this.size = 32;
  this.size += new Buffer(this.name, 'ascii').length;
  this.size += new Buffer(this.value, 'ascii').length;

  this.static    = false;
  this.reference = false;
  this.common    = false;
  this.emitted   = false;
}


// ========================================================
// Header Table Class
// ========================================================
function HeaderTable(limit) {
  var self = this;

  this._entries = [];
  this.length   = 0;
  this.size     = 0;
  this.limit    = limit || HeaderTable.DEFAULT_LIMIT;

  HeaderTable.STATIC_TABLE.forEach(function(entry){
    self._entries.push(entry);
  });
};

HeaderTable.DEFAULT_LIMIT = 4096;

HeaderTable.STATIC_TABLE = STATIC_TABLE_PAIRS.map(function(pair){
  var entry = new Entry(pair[0], pair[1]);
  entry.static = true;
  return entry;
});

HeaderTable.prototype.setLimit = function setLimit(limit) {
  var removed = [];
  while(this.size > limit) {
    removed.push(this.pop());
  }
  this.limit = limit;

  return removed;
};

HeaderTable.prototype.find = function find(name, value) {
  var matched_index = null;
  var matched_entry = null;

  this._entries.some(function(entry, index, array) {
    if (entry.name === name) {
      if (matched_index === null) {
        matched_index = index;
      }

      if (entry.value === value) {
        matched_index = index;
        matched_entry = entry;
        return true;
      }
    }
  });

  return {
    matched_index:  matched_index,
    matched_entry:  matched_entry
  };
};

HeaderTable.prototype.get = function get(index) {
  if (index >= this._entries.length) {
    throw new Error('Invalid index: ' + index);
  }
  return this._entries[index];
};

HeaderTable.prototype.pop = function pop() {
  var entry = this._entries.splice(this.length-1, 1);
  this.length--;
  this.size -= entry[0].size;

  return entry[0];
};

HeaderTable.prototype.unshift = function unshift(entry) {
  var evicted = this._evict(entry);

  if (entry.size <= this.limit) {
    this._entries.unshift(entry);
    this.length++;
    this.size += entry.size;
  }

  return evicted;
};

HeaderTable.prototype.clear = function clear() {
  var removed = [];
  var entries = this._entries.splice(0, this.length);

  for (var i=entries.length-1; i>=0; i--) {
    removed.push({ index: i, entry: entries[i] });
  }

  this.length = 0;
  this.size = 0;

  return removed;
};

HeaderTable.prototype._evict = function _evict(entry) {
  var evicted = [];

  if (entry.size > this.limit) {
    evicted = this.clear();
    return evicted;
  }

  while ((this.size + entry.size) > this.limit) {
    var index = this.length - 1;
    evicted.push({ index: index, entry: this.pop() });
  }

  return evicted;
};


// ========================================================
// Huffman Table Class
// ========================================================
function HuffmanTable() {
  this._table = HUFFMAN_TABLE;
  this._tree  = HuffmanTable.TREE;
}

HuffmanTable._buildTree = function(table) {
  var root = [];

  table.forEach(function(huffman, index){
    var node = root;
    var code = huffman.code;

    for (var bit=huffman.bit-1; bit>=0; bit--) {
      var tree = 0;
      if ((huffman.code >> bit) & 0x01 == 1) {
        tree = 1;
      }

      if (bit === 0) {
        node[tree] = index;
      } else {
        if (node[tree] === undefined) {
          node[tree] = [];
        }
        node = node[tree];
      }
    }
  });

  return root;
};

HuffmanTable.TREE  = HuffmanTable._buildTree(HUFFMAN_TABLE);

HuffmanTable.prototype.encode = function(buffer) {
  var result = [];
  var data = 0;
  var remains = 8;
  var shift;

  for (var i=0, len=buffer.length; i<len; i++) {
    var huffman = this._table[buffer[i]];
    var bit = huffman.bit;

    while (bit > 0) {
      if (remains > bit) {
        shift = remains - bit;
        data += huffman.code << shift;
        remains -= bit;
        bit = 0;
      } else {
        shift = bit - remains;
        data += huffman.code >> shift;
        bit -= remains;
        remains -= remains;
      }

      if (remains === 0) {
        result.push(data);
        data = 0;
        remains = 8;
      }
    }
  }

  if (remains < 8) {
    shift = (this._table[256].bit - remains);
    data += this._table[256].code >> shift;
    result.push(data);
  }

  return new Buffer(result);
};

HuffmanTable.prototype.decode = function(buffer) {
  var str = '';
  var node = this._tree;

  for (var i=0, len=buffer.length; i<len; i++) {
    var data = buffer[i];

    for (var shift=7; shift>=0; shift--) {
      if((data >> shift) & 0x1 === 1) {
        node = node[1];
      } else {
        node = node[0];
      }

      if (typeof node === 'number') {
        str += String.fromCharCode(node);
        node = this._tree;
      }
    }
  }

  return str;
};


// ========================================================
// Context Class
// ========================================================
function Context(options) {
  this.huffman = (options.huffman === false) ? false : true;

  this._header_table  = new HeaderTable(options.size);
  this._huffman_table = new HuffmanTable();

  this._debug = ('HPACK_DEBUG' in process.env);
}

Context.prototype.setSize = function setSize(size) {
  this._header_table.setLimit(size);
};

Context.prototype.compress = function compress(headers) {
  var self = this;
  var reps = [];

  headers.forEach(function(header){
    var name = header[0];
    var value = header[1];

    var result = self._header_table.find(name, value);
    if (result.matched_entry) {
      var entry = result.matched_entry;
      var cmd = {
        type: REP_INDEXED,
        index: result.matched_index
      };

      if (entry.reference) {
        if (entry.common) {
          // Encode to indexed rep
          var rep = self._encodeHeader(cmd);
          reps.push(rep);
          reps.push(rep);
          reps.push(rep);
          reps.push(rep);

          entry.common = false;
          entry.emitted = true;
        } else if(entry.emitted) {
          // Encode to indexed rep
          var rep = self._encodeHeader(cmd);
          reps.push(rep);
          reps.push(rep);
        } else {
          // Mark as 'common'
          entry.common = true;
        }
      } else {
        // Add new entry to header table
        if (entry.static) {
          entry = new Entry(entry.name, entry.value);
          var evicted = self._header_table.unshift(entry);

          // Encode evicted entries to indexed rep
          evicted.forEach(function(result){
            if (result.entry.common) {
              var rep = self._encodeHeader({
                type:  REP_INDEXED,
                index: result.index
              });
              reps.push(rep);
              reps.push(rep);
            }
          });
        }

        // Encode to indexed rep
        reps.push(self._encodeHeader(cmd));
        // Add entry to referense set
        entry.reference = true;
        // Mark as 'emitted'
        entry.emitted = true;
      }
    } else {
      var type;

      if (name in DO_NOT_INDEXED) {
        type = REP_LITERAL;
      } else {
        type = REP_LITERAL_INCR;

        // Added to header table
        var entry = new Entry(name, value);
        entry.reference = true;
        entry.emitted = true;
        var evicted = self._header_table.unshift(entry);

        // Encode evicted entries to indexed rep
        evicted.forEach(function(result){
          if (result.entry.common) {
            var rep = self._encodeHeader({
              type:  REP_INDEXED,
              index: result.index
            });
            reps.push(rep);
            reps.push(rep);
          }
        });
      }

      if (result.matched_index === null) {
        // Encode to literal rep with new name
        reps.push(self._encodeHeader({
          type:  type,
          name:  name,
          value: value
        }));
      } else {
        // Encode to literal rep with indexed name
        reps.push(self._encodeHeader({
          type:  type,
          index: result.matched_index,
          value: value
        }));
      }
    }
  });

  // Cleaning referense set
  for (var i=0, len=this._header_table.length; i<len; i++) {
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
  var headers = [];
  buffer._cursor = 0;

  while (buffer._cursor < buffer.length) {
    var cmd = this._decodeHeader(buffer);
    var evicted = null;

    if (cmd.type == REP_INDEXED) {
      var entry = this._header_table.get(cmd.index);
      if (entry.reference) {
        entry.reference = false;
      } else {
        if (entry.static) {
          entry = new Entry(entry.name, entry.value);
          evicted = this._header_table.unshift(entry);
        }

        entry.reference = true;
        entry.emitted = true;

        headers.push([entry.name, entry.value]);
      }
    } else if (cmd.type == REP_CTX_UPDATE) {
      switch (cmd.update.type) {
        case CTX_UPDATE_REFERENCE_EMPTY:
          for (var i=0, len=this._header_table.length; i<len; i++) {
            var entry = this._header_table.get(i);
            entry.reference = false;
          }
          break;
        case CTX_UPDATE_TABLE_SIZE:
          this.setSize(cmd.update.size);
          break;
      }
      continue;
    } else {
      if ('index' in cmd) {
        var entry = this._header_table.get(cmd.index);
        cmd.name = entry.name;
        if (!('value' in cmd)) {
          cmd.value = entry.value;
        }
      }

      if (cmd.type == REP_LITERAL_INCR) {
        var entry = new Entry(cmd.name, cmd.value);
        entry.reference = true;
        entry.emitted = true;

        evicted = this._header_table.unshift(entry);

        headers.push([entry.name, entry.value]);
      } else {
        headers.push([cmd.name, cmd.value]);
      }
    }
  }

  for (var i=0, len=this._header_table.length; i<len; i++) {
    var entry = this._header_table.get(i);
    if (entry.reference && !entry.emitted) {
      headers.push([entry.name, entry.value]);
    }
    entry.emitted = false;
  }

  return headers;
};

Context.prototype._detectHeaderType = function _detectHeaderType(buffer) {
  var rep = null;
  var bytes = buffer[buffer._cursor];

  var rep_order = [
    REP_INDEXED,
    REP_LITERAL_INCR,
    REP_CTX_UPDATE,
    REP_LITERAL_NEVER,
    REP_LITERAL
  ];

  for (var r=0, len=rep_order.length; r<len; r++) {
    var current = rep_order[r];
    if (bytes >= REP_INFO[current].mask) {
      rep = current;
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

  if (cmd.type === REP_CTX_UPDATE) {
    buffers.push(this._encodeContextUpdate(cmd.update.type, cmd.update.size));
  } else {
    var index = ('index' in cmd) ? cmd.index+1 : 0;
    buffers.push(this._encodeInteger(index, rep.prefix));
    buffers[0][0] |= rep.mask;

    if (cmd.type !== REP_INDEXED) {
      if ('name' in cmd) {
        buffers.push(this._encodeString(cmd.name));
      }
      buffers.push(this._encodeString(cmd.value));
    }
  }

  this._debugLog('Command', cmd);

  return Buffer.concat(buffers);
};

Context.prototype._decodeHeader = function _decodeHeader(buffer) {
  var cmd = {};

  cmd.type = this._detectHeaderType(buffer);
  var rep = REP_INFO[cmd.type];

  if (cmd.type === REP_CTX_UPDATE) {
    cmd.update = this._decodeContextUpdate(buffer);
  } else {
    var index = this._decodeInteger(buffer, rep.prefix);
    if (cmd.type === REP_INDEXED) {
      if (index !== 0) {
        cmd.index = index - 1;
      }
    } else {
      if (index !== 0) {
        cmd.index = index - 1;
      } else {
        cmd.name = this._decodeString(buffer);
      }

      cmd.value = this._decodeString(buffer);
    }
  }

  this._debugLog('Command', cmd);

  return cmd;
};

Context.prototype._encodeInteger = function _encodeInteger(num, prefix) {
  var limit = Math.pow(2, prefix) - 1;

  if (num < limit) {
    return new Buffer([num]);
  }

  var octets = [limit];
  num -= limit;
  while (num >= 128) {
    octets.push(num % 128 | 0x80);
    num >>= 7;
  }
  octets.push(num);

  return new Buffer(octets);
};

Context.prototype._decodeInteger = function _decodeInteger(buffer, prefix) {
  var limit = Math.pow(2, prefix) - 1;
  var shift = 0;
  var value = 0;

  value = buffer[buffer._cursor] & limit;
  buffer._cursor++;

  if (value == limit) {
    do {
      value += (buffer[buffer._cursor] & 0x7F) << shift;
      shift += 7;
      buffer._cursor++;
    } while (buffer[buffer._cursor-1] & 0x80);
  }

  return value;
};

Context.prototype._encodeString = function _encodeString(str) {
  var buffers = [];
  var value = new Buffer(str, 'ascii');

  if (this.huffman) {
    value = this._huffman_table.encode(value);
    buffers.push(this._encodeInteger(value.length, 7));
    buffers[0][0] |= 0x80;
  } else {
    buffers.push(this._encodeInteger(value.length, 7));
  }
  buffers.push(value);

  return Buffer.concat(buffers);
};

Context.prototype._decodeString = function _decodeString(buffer) {
  var str = '';
  var huffman = (buffer[buffer._cursor] & 0x80) ? true : false;
  var length = this._decodeInteger(buffer, 7);

  var value = buffer.slice(buffer._cursor, buffer._cursor+length);
  if (huffman) {
    str = this._huffman_table.decode(value);
  } else {
    str = value.toString('ascii');
  }
  buffer._cursor += length;

  return str;
};

Context.prototype._encodeContextUpdate = function _encodeContextUpdate(type, size) {
  var buffer;

  switch (type) {
    case CTX_UPDATE_REFERENCE_EMPTY:
      buffer = new Buffer([0x30]);
      break;
    case CTX_UPDATE_TABLE_SIZE:
      buffer = this._encodeInteger(size, 4);
      buffer[0] |= 0x20;
      break;
    default:
      throw new Error('Unknown context update type');
  }

  return buffer;
};

Context.prototype._decodeContextUpdate = function _decodeContextUpdate(buffer) {
  var value = buffer[buffer._cursor];
  var update;

  if (value & 0x10) {
    update = {
      type: CTX_UPDATE_REFERENCE_EMPTY
    };
    buffer._cursor += 1;
  } else {
    update = {
      type: CTX_UPDATE_TABLE_SIZE,
      size: this._decodeInteger(buffer, 4)
    };
  }

  return update;
};

Context.prototype._dump = function _dump() {
  var label = 'Header Table';
  var reference_set = [];

  this._debugLog(label, '--------------------');
  for (var i=0; i<this._header_table.length; i++) {
    var entry = this._header_table.get(i);
    message = util.format('[%d] (s=%d) %s: %s', i+1, entry.size, entry.name, entry.value);
    this._debugLog('Header Table', message);

    if (entry.reference) {
      reference_set.push(i+1);
    }
  }
  this._debugLog(label, 'Total size: ' + this._header_table.size);
  this._debugLog(label, '--------------------');
  this._debugLog('Reference Set', reference_set);
};

Context.prototype._debugLog = function _debug(label, message) {
  if (this._debug) {
    console.log('[HPACK DEBUG]', '['+label+']', message);
  }
};


// ========================================================
// Exports
// ========================================================
exports.createContext = function createRequestContext(options) {
  options = options || {};
  return new Context(options);
};
