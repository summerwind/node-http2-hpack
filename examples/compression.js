var hpack = require('../lib/hpack');

var ctx1 = hpack.createContext({ huffman: false });
var ctx2 = hpack.createContext({ huffman: false });

var buffer;
var headers = [
  [
    [ ':method', 'GET' ],
    [ ':scheme', 'http' ],
    [ ':path', '/' ],
    [ ':authority', 'www.example.com' ]
  ],
  [
    [ ':method', 'GET' ],
    [ ':scheme', 'http' ],
    [ ':path', '/' ],
    [ ':authority', 'www.example.com' ],
    [ 'cache-control', 'no-cache' ]
  ],
  [
    [ ':method', 'GET' ],
    [ ':scheme', 'https' ],
    [ ':path', '/index.html' ],
    [ ':authority', 'www.example.com' ],
    [ 'custom-key', 'custom-value' ]
  ]
];

buffer = ctx1.compress(headers[0]);
console.log('Compressed:',   buffer);
console.log('Decompressed:', ctx2.decompress(buffer));
console.log('----------');

buffer = ctx1.compress(headers[1]);
console.log('Compressed:',   buffer);
console.log('Decompressed:', ctx2.decompress(buffer));
console.log('----------');

buffer = ctx1.compress(headers[2]);
console.log('Compressed:',   buffer);
console.log('Decompressed:', ctx2.decompress(buffer));

