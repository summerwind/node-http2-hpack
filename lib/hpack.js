var util = require('util');

// ========================================================
// Constants
// ========================================================
var REP_INDEXED       = 0;
var REP_LITERAL       = 1;
var REP_LITERAL_INCR  = 2;

var REP_INFO = [
  { prefix: 7, mask: 0x80 },
  { prefix: 6, mask: 0x40 },
  { prefix: 6, mask: 0x00 }
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
  [ ':status',                     '500'         ],
  [ ':status',                     '404'         ],
  [ ':status',                     '403'         ],
  [ ':status',                     '400'         ],
  [ ':status',                     '401'         ],
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

var REQUEST_HUFFMAN_TABLE = [
  { code: 0x7ffffba, bit: 27 },
  { code: 0x7ffffbb, bit: 27 },
  { code: 0x7ffffbc, bit: 27 },
  { code: 0x7ffffbd, bit: 27 },
  { code: 0x7ffffbe, bit: 27 },
  { code: 0x7ffffbf, bit: 27 },
  { code: 0x7ffffc0, bit: 27 },
  { code: 0x7ffffc1, bit: 27 },
  { code: 0x7ffffc2, bit: 27 },
  { code: 0x7ffffc3, bit: 27 },
  { code: 0x7ffffc4, bit: 27 },
  { code: 0x7ffffc5, bit: 27 },
  { code: 0x7ffffc6, bit: 27 },
  { code: 0x7ffffc7, bit: 27 },
  { code: 0x7ffffc8, bit: 27 },
  { code: 0x7ffffc9, bit: 27 },
  { code: 0x7ffffca, bit: 27 },
  { code: 0x7ffffcb, bit: 27 },
  { code: 0x7ffffcc, bit: 27 },
  { code: 0x7ffffcd, bit: 27 },
  { code: 0x7ffffce, bit: 27 },
  { code: 0x7ffffcf, bit: 27 },
  { code: 0x7ffffd0, bit: 27 },
  { code: 0x7ffffd1, bit: 27 },
  { code: 0x7ffffd2, bit: 27 },
  { code: 0x7ffffd3, bit: 27 },
  { code: 0x7ffffd4, bit: 27 },
  { code: 0x7ffffd5, bit: 27 },
  { code: 0x7ffffd6, bit: 27 },
  { code: 0x7ffffd7, bit: 27 },
  { code: 0x7ffffd8, bit: 27 },
  { code: 0x7ffffd9, bit: 27 },
  { code: 0xe8,      bit: 8  },
  { code: 0xffc,     bit: 12 },
  { code: 0x3ffa,    bit: 14 },
  { code: 0x7ffc,    bit: 15 },
  { code: 0x7ffd,    bit: 15 },
  { code: 0x24,      bit: 6  },
  { code: 0x6e,      bit: 7  },
  { code: 0x7ffe,    bit: 15 },
  { code: 0x7fa,     bit: 11 },
  { code: 0x7fb,     bit: 11 },
  { code: 0x3fa,     bit: 10 },
  { code: 0x7fc,     bit: 11 },
  { code: 0xe9,      bit: 8  },
  { code: 0x25,      bit: 6  },
  { code: 0x4,       bit: 5  },
  { code: 0x0,       bit: 4  },
  { code: 0x5,       bit: 5  },
  { code: 0x6,       bit: 5  },
  { code: 0x7,       bit: 5  },
  { code: 0x26,      bit: 6  },
  { code: 0x27,      bit: 6  },
  { code: 0x28,      bit: 6  },
  { code: 0x29,      bit: 6  },
  { code: 0x2a,      bit: 6  },
  { code: 0x2b,      bit: 6  },
  { code: 0x2c,      bit: 6  },
  { code: 0x1ec,     bit: 9  },
  { code: 0xea,      bit: 8  },
  { code: 0x3fffe,   bit: 18 },
  { code: 0x2d,      bit: 6  },
  { code: 0x1fffc,   bit: 17 },
  { code: 0x1ed,     bit: 9  },
  { code: 0x3ffb,    bit: 14 },
  { code: 0x6f,      bit: 7  },
  { code: 0xeb,      bit: 8  },
  { code: 0xec,      bit: 8  },
  { code: 0xed,      bit: 8  },
  { code: 0xee,      bit: 8  },
  { code: 0x70,      bit: 7  },
  { code: 0x1ee,     bit: 9  },
  { code: 0x1ef,     bit: 9  },
  { code: 0x1f0,     bit: 9  },
  { code: 0x1f1,     bit: 9  },
  { code: 0x3fb,     bit: 10 },
  { code: 0x1f2,     bit: 9  },
  { code: 0xef,      bit: 8  },
  { code: 0x1f3,     bit: 9  },
  { code: 0x1f4,     bit: 9  },
  { code: 0x1f5,     bit: 9  },
  { code: 0x1f6,     bit: 9  },
  { code: 0x1f7,     bit: 9  },
  { code: 0xf0,      bit: 8  },
  { code: 0xf1,      bit: 8  },
  { code: 0x1f8,     bit: 9  },
  { code: 0x1f9,     bit: 9  },
  { code: 0x1fa,     bit: 9  },
  { code: 0x1fb,     bit: 9  },
  { code: 0x1fc,     bit: 9  },
  { code: 0x3fc,     bit: 10 },
  { code: 0x3ffc,    bit: 14 },
  { code: 0x7ffffda, bit: 27 },
  { code: 0x1ffc,    bit: 13 },
  { code: 0x3ffd,    bit: 14 },
  { code: 0x2e,      bit: 6  },
  { code: 0x7fffe,   bit: 19 },
  { code: 0x8,       bit: 5  },
  { code: 0x2f,      bit: 6  },
  { code: 0x9,       bit: 5  },
  { code: 0x30,      bit: 6  },
  { code: 0x1,       bit: 4  },
  { code: 0x31,      bit: 6  },
  { code: 0x32,      bit: 6  },
  { code: 0x33,      bit: 6  },
  { code: 0xa,       bit: 5  },
  { code: 0x71,      bit: 7  },
  { code: 0x72,      bit: 7  },
  { code: 0xb,       bit: 5  },
  { code: 0x34,      bit: 6  },
  { code: 0xc,       bit: 5  },
  { code: 0xd,       bit: 5  },
  { code: 0xe,       bit: 5  },
  { code: 0xf2,      bit: 8  },
  { code: 0xf,       bit: 5  },
  { code: 0x10,      bit: 5  },
  { code: 0x11,      bit: 5  },
  { code: 0x35,      bit: 6  },
  { code: 0x73,      bit: 7  },
  { code: 0x36,      bit: 6  },
  { code: 0xf3,      bit: 8  },
  { code: 0xf4,      bit: 8  },
  { code: 0xf5,      bit: 8  },
  { code: 0x1fffd,   bit: 17 },
  { code: 0x7fd,     bit: 11 },
  { code: 0x1fffe,   bit: 17 },
  { code: 0xffd,     bit: 12 },
  { code: 0x7ffffdb, bit: 27 },
  { code: 0x7ffffdc, bit: 27 },
  { code: 0x7ffffdd, bit: 27 },
  { code: 0x7ffffde, bit: 27 },
  { code: 0x7ffffdf, bit: 27 },
  { code: 0x7ffffe0, bit: 27 },
  { code: 0x7ffffe1, bit: 27 },
  { code: 0x7ffffe2, bit: 27 },
  { code: 0x7ffffe3, bit: 27 },
  { code: 0x7ffffe4, bit: 27 },
  { code: 0x7ffffe5, bit: 27 },
  { code: 0x7ffffe6, bit: 27 },
  { code: 0x7ffffe7, bit: 27 },
  { code: 0x7ffffe8, bit: 27 },
  { code: 0x7ffffe9, bit: 27 },
  { code: 0x7ffffea, bit: 27 },
  { code: 0x7ffffeb, bit: 27 },
  { code: 0x7ffffec, bit: 27 },
  { code: 0x7ffffed, bit: 27 },
  { code: 0x7ffffee, bit: 27 },
  { code: 0x7ffffef, bit: 27 },
  { code: 0x7fffff0, bit: 27 },
  { code: 0x7fffff1, bit: 27 },
  { code: 0x7fffff2, bit: 27 },
  { code: 0x7fffff3, bit: 27 },
  { code: 0x7fffff4, bit: 27 },
  { code: 0x7fffff5, bit: 27 },
  { code: 0x7fffff6, bit: 27 },
  { code: 0x7fffff7, bit: 27 },
  { code: 0x7fffff8, bit: 27 },
  { code: 0x7fffff9, bit: 27 },
  { code: 0x7fffffa, bit: 27 },
  { code: 0x7fffffb, bit: 27 },
  { code: 0x7fffffc, bit: 27 },
  { code: 0x7fffffd, bit: 27 },
  { code: 0x7fffffe, bit: 27 },
  { code: 0x7ffffff, bit: 27 },
  { code: 0x3ffff80, bit: 26 },
  { code: 0x3ffff81, bit: 26 },
  { code: 0x3ffff82, bit: 26 },
  { code: 0x3ffff83, bit: 26 },
  { code: 0x3ffff84, bit: 26 },
  { code: 0x3ffff85, bit: 26 },
  { code: 0x3ffff86, bit: 26 },
  { code: 0x3ffff87, bit: 26 },
  { code: 0x3ffff88, bit: 26 },
  { code: 0x3ffff89, bit: 26 },
  { code: 0x3ffff8a, bit: 26 },
  { code: 0x3ffff8b, bit: 26 },
  { code: 0x3ffff8c, bit: 26 },
  { code: 0x3ffff8d, bit: 26 },
  { code: 0x3ffff8e, bit: 26 },
  { code: 0x3ffff8f, bit: 26 },
  { code: 0x3ffff90, bit: 26 },
  { code: 0x3ffff91, bit: 26 },
  { code: 0x3ffff92, bit: 26 },
  { code: 0x3ffff93, bit: 26 },
  { code: 0x3ffff94, bit: 26 },
  { code: 0x3ffff95, bit: 26 },
  { code: 0x3ffff96, bit: 26 },
  { code: 0x3ffff97, bit: 26 },
  { code: 0x3ffff98, bit: 26 },
  { code: 0x3ffff99, bit: 26 },
  { code: 0x3ffff9a, bit: 26 },
  { code: 0x3ffff9b, bit: 26 },
  { code: 0x3ffff9c, bit: 26 },
  { code: 0x3ffff9d, bit: 26 },
  { code: 0x3ffff9e, bit: 26 },
  { code: 0x3ffff9f, bit: 26 },
  { code: 0x3ffffa0, bit: 26 },
  { code: 0x3ffffa1, bit: 26 },
  { code: 0x3ffffa2, bit: 26 },
  { code: 0x3ffffa3, bit: 26 },
  { code: 0x3ffffa4, bit: 26 },
  { code: 0x3ffffa5, bit: 26 },
  { code: 0x3ffffa6, bit: 26 },
  { code: 0x3ffffa7, bit: 26 },
  { code: 0x3ffffa8, bit: 26 },
  { code: 0x3ffffa9, bit: 26 },
  { code: 0x3ffffaa, bit: 26 },
  { code: 0x3ffffab, bit: 26 },
  { code: 0x3ffffac, bit: 26 },
  { code: 0x3ffffad, bit: 26 },
  { code: 0x3ffffae, bit: 26 },
  { code: 0x3ffffaf, bit: 26 },
  { code: 0x3ffffb0, bit: 26 },
  { code: 0x3ffffb1, bit: 26 },
  { code: 0x3ffffb2, bit: 26 },
  { code: 0x3ffffb3, bit: 26 },
  { code: 0x3ffffb4, bit: 26 },
  { code: 0x3ffffb5, bit: 26 },
  { code: 0x3ffffb6, bit: 26 },
  { code: 0x3ffffb7, bit: 26 },
  { code: 0x3ffffb8, bit: 26 },
  { code: 0x3ffffb9, bit: 26 },
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
  { code: 0x3ffffda, bit: 26 },
  { code: 0x3ffffdb, bit: 26 },
  { code: 0x3ffffdc, bit: 26 }
];

var RESPONSE_HUFFMAN_TABLE = [
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
  { code: 0x0,       bit: 4  },
  { code: 0xffa,     bit: 12 },
  { code: 0x6a,      bit: 7  },
  { code: 0x1ffa,    bit: 13 },
  { code: 0x3ffc,    bit: 14 },
  { code: 0x1ec,     bit: 9  },
  { code: 0x3f8,     bit: 10 },
  { code: 0x1ffb,    bit: 13 },
  { code: 0x1ed,     bit: 9  },
  { code: 0x1ee,     bit: 9  },
  { code: 0xffb,     bit: 12 },
  { code: 0x7fa,     bit: 11 },
  { code: 0x22,      bit: 6  },
  { code: 0x23,      bit: 6  },
  { code: 0x24,      bit: 6  },
  { code: 0x6b,      bit: 7  },
  { code: 0x1,       bit: 4  },
  { code: 0x2,       bit: 4  },
  { code: 0x3,       bit: 4  },
  { code: 0x8,       bit: 5  },
  { code: 0x9,       bit: 5  },
  { code: 0xa,       bit: 5  },
  { code: 0x25,      bit: 6  },
  { code: 0x26,      bit: 6  },
  { code: 0xb,       bit: 5  },
  { code: 0xc,       bit: 5  },
  { code: 0xd,       bit: 5  },
  { code: 0x1ef,     bit: 9  },
  { code: 0xfffa,    bit: 16 },
  { code: 0x6c,      bit: 7  },
  { code: 0x1ffc,    bit: 13 },
  { code: 0xffc,     bit: 12 },
  { code: 0xfffb,    bit: 16 },
  { code: 0x6d,      bit: 7  },
  { code: 0xea,      bit: 8  },
  { code: 0xeb,      bit: 8  },
  { code: 0xec,      bit: 8  },
  { code: 0xed,      bit: 8  },
  { code: 0xee,      bit: 8  },
  { code: 0x27,      bit: 6  },
  { code: 0x1f0,     bit: 9  },
  { code: 0xef,      bit: 8  },
  { code: 0xf0,      bit: 8  },
  { code: 0x3f9,     bit: 10 },
  { code: 0x1f1,     bit: 9  },
  { code: 0x28,      bit: 6  },
  { code: 0xf1,      bit: 8  },
  { code: 0xf2,      bit: 8  },
  { code: 0x1f2,     bit: 9  },
  { code: 0x3fa,     bit: 10 },
  { code: 0x1f3,     bit: 9  },
  { code: 0x29,      bit: 6  },
  { code: 0xe,       bit: 5  },
  { code: 0x1f4,     bit: 9  },
  { code: 0x1f5,     bit: 9  },
  { code: 0xf3,      bit: 8  },
  { code: 0x3fb,     bit: 10 },
  { code: 0x1f6,     bit: 9  },
  { code: 0x3fc,     bit: 10 },
  { code: 0x7fb,     bit: 11 },
  { code: 0x1ffd,    bit: 13 },
  { code: 0x7fc,     bit: 11 },
  { code: 0x7ffc,    bit: 15 },
  { code: 0x1f7,     bit: 9  },
  { code: 0x1fffe,   bit: 17 },
  { code: 0xf,       bit: 5  },
  { code: 0x6e,      bit: 7  },
  { code: 0x2a,      bit: 6  },
  { code: 0x2b,      bit: 6  },
  { code: 0x10,      bit: 5  },
  { code: 0x6f,      bit: 7  },
  { code: 0x70,      bit: 7  },
  { code: 0x71,      bit: 7  },
  { code: 0x2c,      bit: 6  },
  { code: 0x1f8,     bit: 9  },
  { code: 0x1f9,     bit: 9  },
  { code: 0x72,      bit: 7  },
  { code: 0x2d,      bit: 6  },
  { code: 0x2e,      bit: 6  },
  { code: 0x2f,      bit: 6  },
  { code: 0x30,      bit: 6  },
  { code: 0x1fa,     bit: 9  },
  { code: 0x31,      bit: 6  },
  { code: 0x32,      bit: 6  },
  { code: 0x33,      bit: 6  },
  { code: 0x34,      bit: 6  },
  { code: 0x73,      bit: 7  },
  { code: 0xf4,      bit: 8  },
  { code: 0x74,      bit: 7  },
  { code: 0xf5,      bit: 8  },
  { code: 0x1fb,     bit: 9  },
  { code: 0xfffc,    bit: 16 },
  { code: 0x3ffd,    bit: 14 },
  { code: 0xfffd,    bit: 16 },
  { code: 0xfffe,    bit: 16 },
  { code: 0x1ffffdc, bit: 25 },
  { code: 0x1ffffdd, bit: 25 },
  { code: 0x1ffffde, bit: 25 },
  { code: 0x1ffffdf, bit: 25 },
  { code: 0x1ffffe0, bit: 25 },
  { code: 0x1ffffe1, bit: 25 },
  { code: 0x1ffffe2, bit: 25 },
  { code: 0x1ffffe3, bit: 25 },
  { code: 0x1ffffe4, bit: 25 },
  { code: 0x1ffffe5, bit: 25 },
  { code: 0x1ffffe6, bit: 25 },
  { code: 0x1ffffe7, bit: 25 },
  { code: 0x1ffffe8, bit: 25 },
  { code: 0x1ffffe9, bit: 25 },
  { code: 0x1ffffea, bit: 25 },
  { code: 0x1ffffeb, bit: 25 },
  { code: 0x1ffffec, bit: 25 },
  { code: 0x1ffffed, bit: 25 },
  { code: 0x1ffffee, bit: 25 },
  { code: 0x1ffffef, bit: 25 },
  { code: 0x1fffff0, bit: 25 },
  { code: 0x1fffff1, bit: 25 },
  { code: 0x1fffff2, bit: 25 },
  { code: 0x1fffff3, bit: 25 },
  { code: 0x1fffff4, bit: 25 },
  { code: 0x1fffff5, bit: 25 },
  { code: 0x1fffff6, bit: 25 },
  { code: 0x1fffff7, bit: 25 },
  { code: 0x1fffff8, bit: 25 },
  { code: 0x1fffff9, bit: 25 },
  { code: 0x1fffffa, bit: 25 },
  { code: 0x1fffffb, bit: 25 },
  { code: 0x1fffffc, bit: 25 },
  { code: 0x1fffffd, bit: 25 },
  { code: 0x1fffffe, bit: 25 },
  { code: 0x1ffffff, bit: 25 },
  { code: 0xffff80,  bit: 24 },
  { code: 0xffff81,  bit: 24 },
  { code: 0xffff82,  bit: 24 },
  { code: 0xffff83,  bit: 24 },
  { code: 0xffff84,  bit: 24 },
  { code: 0xffff85,  bit: 24 },
  { code: 0xffff86,  bit: 24 },
  { code: 0xffff87,  bit: 24 },
  { code: 0xffff88,  bit: 24 },
  { code: 0xffff89,  bit: 24 },
  { code: 0xffff8a,  bit: 24 },
  { code: 0xffff8b,  bit: 24 },
  { code: 0xffff8c,  bit: 24 },
  { code: 0xffff8d,  bit: 24 },
  { code: 0xffff8e,  bit: 24 },
  { code: 0xffff8f,  bit: 24 },
  { code: 0xffff90,  bit: 24 },
  { code: 0xffff91,  bit: 24 },
  { code: 0xffff92,  bit: 24 },
  { code: 0xffff93,  bit: 24 },
  { code: 0xffff94,  bit: 24 },
  { code: 0xffff95,  bit: 24 },
  { code: 0xffff96,  bit: 24 },
  { code: 0xffff97,  bit: 24 },
  { code: 0xffff98,  bit: 24 },
  { code: 0xffff99,  bit: 24 },
  { code: 0xffff9a,  bit: 24 },
  { code: 0xffff9b,  bit: 24 },
  { code: 0xffff9c,  bit: 24 },
  { code: 0xffff9d,  bit: 24 },
  { code: 0xffff9e,  bit: 24 },
  { code: 0xffff9f,  bit: 24 },
  { code: 0xffffa0,  bit: 24 },
  { code: 0xffffa1,  bit: 24 },
  { code: 0xffffa2,  bit: 24 },
  { code: 0xffffa3,  bit: 24 },
  { code: 0xffffa4,  bit: 24 },
  { code: 0xffffa5,  bit: 24 },
  { code: 0xffffa6,  bit: 24 },
  { code: 0xffffa7,  bit: 24 },
  { code: 0xffffa8,  bit: 24 },
  { code: 0xffffa9,  bit: 24 },
  { code: 0xffffaa,  bit: 24 },
  { code: 0xffffab,  bit: 24 },
  { code: 0xffffac,  bit: 24 },
  { code: 0xffffad,  bit: 24 },
  { code: 0xffffae,  bit: 24 },
  { code: 0xffffaf,  bit: 24 },
  { code: 0xffffb0,  bit: 24 },
  { code: 0xffffb1,  bit: 24 },
  { code: 0xffffb2,  bit: 24 },
  { code: 0xffffb3,  bit: 24 },
  { code: 0xffffb4,  bit: 24 },
  { code: 0xffffb5,  bit: 24 },
  { code: 0xffffb6,  bit: 24 },
  { code: 0xffffb7,  bit: 24 },
  { code: 0xffffb8,  bit: 24 },
  { code: 0xffffb9,  bit: 24 },
  { code: 0xffffba,  bit: 24 },
  { code: 0xffffbb,  bit: 24 },
  { code: 0xffffbc,  bit: 24 },
  { code: 0xffffbd,  bit: 24 },
  { code: 0xffffbe,  bit: 24 },
  { code: 0xffffbf,  bit: 24 },
  { code: 0xffffc0,  bit: 24 },
  { code: 0xffffc1,  bit: 24 },
  { code: 0xffffc2,  bit: 24 },
  { code: 0xffffc3,  bit: 24 },
  { code: 0xffffc4,  bit: 24 },
  { code: 0xffffc5,  bit: 24 },
  { code: 0xffffc6,  bit: 24 },
  { code: 0xffffc7,  bit: 24 },
  { code: 0xffffc8,  bit: 24 },
  { code: 0xffffc9,  bit: 24 },
  { code: 0xffffca,  bit: 24 },
  { code: 0xffffcb,  bit: 24 },
  { code: 0xffffcc,  bit: 24 },
  { code: 0xffffcd,  bit: 24 },
  { code: 0xffffce,  bit: 24 },
  { code: 0xffffcf,  bit: 24 },
  { code: 0xffffd0,  bit: 24 },
  { code: 0xffffd1,  bit: 24 },
  { code: 0xffffd2,  bit: 24 },
  { code: 0xffffd3,  bit: 24 },
  { code: 0xffffd4,  bit: 24 },
  { code: 0xffffd5,  bit: 24 },
  { code: 0xffffd6,  bit: 24 },
  { code: 0xffffd7,  bit: 24 },
  { code: 0xffffd8,  bit: 24 },
  { code: 0xffffd9,  bit: 24 },
  { code: 0xffffda,  bit: 24 },
  { code: 0xffffdb,  bit: 24 },
  { code: 0xffffdc,  bit: 24 },
  { code: 0xffffdd,  bit: 24 }
];


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
};


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
  var matched_index  = null;
  var matched_entry  = null;

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
function HuffmanTable(type) {
  switch (type) {
    case 'request':
      this._table = REQUEST_HUFFMAN_TABLE;
      this._tree  = HuffmanTable.REQUEST_TREE;
      break;
    case 'response':
      this._table = RESPONSE_HUFFMAN_TABLE;
      this._tree  = HuffmanTable.RESPONSE_TREE;
      break;
    default:
      throw new Error('Unknown encoder type');
  }
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

HuffmanTable.REQUEST_TREE  = HuffmanTable._buildTree(REQUEST_HUFFMAN_TABLE);
HuffmanTable.RESPONSE_TREE = HuffmanTable._buildTree(RESPONSE_HUFFMAN_TABLE);

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
  this._huffman_table = new HuffmanTable(options.type);

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

      if (result.matched_index) {
        // Encode to literal rep with indexed name
        reps.push(self._encodeHeader({
          type:  REP_LITERAL_INCR,
          index: result.matched_index,
          value: value
        }));
      } else {
        // Encode to literal rep with new name
        reps.push(self._encodeHeader({
          type:  REP_LITERAL_INCR,
          name:  name,
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
      if (!('index' in cmd)) {
        for (var i=0, len=this._header_table.length; i<len; i++) {
          var entry = this._header_table.get(i);
          entry.reference = false;
        }
        continue;
      }

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
    } else {
      if ('index' in cmd) {
        var entry = this._header_table.get(cmd.index);
        cmd.name = entry.name;
        if (!('value' in cmd)) {
          cmd.value = entry.value;
        }
      }

      if (cmd.type == REP_LITERAL) {
        headers.push([cmd.name, cmd.value]);
      } else {
        var entry = new Entry(cmd.name, cmd.value);
        entry.reference = true;
        entry.emitted = true;

        evicted = this._header_table.unshift(entry);

        headers.push([entry.name, entry.value]);
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

  var index = ('index' in cmd) ? cmd.index+1 : 0;
  buffers.push(this._encodeInteger(index, rep.prefix));
  buffers[0][0] |= rep.mask;

  if (cmd.type !== REP_INDEXED) {
    if ('name' in cmd) {
      buffers.push(this._encodeString(cmd.name));
    }

    buffers.push(this._encodeString(cmd.value));
  }

  this._debugLog('Command', cmd);

  return Buffer.concat(buffers);
};

Context.prototype._decodeHeader = function _decodeHeader(buffer) {
  var cmd = {};

  cmd.type = this._detectHeaderType(buffer);
  var rep = REP_INFO[cmd.type];

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
    console.log('[HPACK Debug]', '['+label+']', message);
  }
};


// ========================================================
// Exports
// ========================================================
exports.createRequestContext = function createRequestContext(options) {
  options = options || {};
  options.type = 'request';
  return new Context(options);
};

exports.createResponseContext = function createResponseContext(options) {
  options = options || {};
  options.type = 'response';
  return new Context(options);
};
