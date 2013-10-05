var hpac = require('../lib/hpac');

var ctx1 = hpac.createRequestContext();
var ctx2 = hpac.createRequestContext();

var buffers = [];
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

buffers.push(ctx1.compress(headers[0]));
buffers.push(ctx1.compress(headers[1]));
buffers.push(ctx1.compress(headers[2]));

console.log('Compressed:',   buffers[0]);
console.log('Decompressed:', ctx2.decompress(buffers[0]), "\n");

console.log('Compressed:',   buffers[1]);
console.log('Decompressed:', ctx2.decompress(buffers[1]), "\n");

console.log('Compressed:',   buffers[2]);
console.log('Decompressed:', ctx2.decompress(buffers[2]));