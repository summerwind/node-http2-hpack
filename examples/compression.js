var hpack = require('../lib/hpack');

var ctx1 = hpack.createRequestContext();
var ctx2 = hpack.createRequestContext();

var buffer;
var headers = [
  {
    ':path':       '/my-example/index.html',
    'user-agent':  'my-user-agent',
    'mynewheader': 'first'
  },
  {
    ':path':       '/my-example/resource/script.js',
    'user-agent':  'my-user-agent',
    'mynewheader': 'second'
  },
  {
    ':path':       '/my-example/resource/script.js',
    'user-agent':  'my-user-agent',
    'mynewheader': 'third'
  }
];

buffer = ctx1.compress(headers[0]);
console.log('Compressed:',   buffer);
console.log('Decompressed:', ctx2.decompress(buffer), "\n");

buffer = ctx1.compress(headers[1]);
console.log('Compressed:',   buffer);
console.log('Decompressed:', ctx2.decompress(buffer), "\n");

buffer = ctx1.compress(headers[2]);
console.log('Compressed:',   buffer);
console.log('Decompressed:', ctx2.decompress(buffer));
