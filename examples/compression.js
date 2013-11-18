var hpack = require('../lib/hpack');

var ctx1 = hpack.createRequestContext();
var ctx2 = hpack.createRequestContext();

var buffer;
var headers = [
  {
    ':method':    'GET',
    ':scheme':    'http',
    ':path':      '/',
    ':authority': 'www.foo.com'
  },
  {
    ':method':       'GET',
    ':scheme':       'https',
    ':path':         '/',
    ':authority':    'www.bar.com',
    'cache-control': 'no-cache'
  },
  {
    ':method':    'GET',
    ':scheme':    'https',
    ':path':      '/custom-path.css',
    ':authority': 'www.bar.com',
    'custom-key': 'custom-value'
  }
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
