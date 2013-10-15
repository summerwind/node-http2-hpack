var expect = require('expect.js');
var hpack = require('../lib/hpack');

describe('HPACK Story', function(){
  context('Request Story', function(){
    it('should decode all headers', function(){
      var ctx = hpack.createRequestContext();

      var story = require('./request.json');  
      story.forEach(function(s){
        var buffer = new Buffer(s.wire, 'base64');
        var header = ctx.decompress(buffer);

        for (var key in header) {
          expect(header[key]).to.equal(s.header[key]);
        }
      });
    });
  });
});