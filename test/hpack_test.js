var expect = require('expect.js');
var hpack = require('../lib/hpack');

describe('HPACK', function(){
  context('Low-Level Representation', function(){
    context('Integer Representation', function(){
      var ctx = hpack.createRequestContext();

      it('should encode 10 using a 5-bit prefix', function(){
        var buffer = ctx._encodeInteger(10, 5);

        expect(buffer.length).to.be(1);
        expect(buffer[0]).to.be(0x0a);
      });

      it('should decode 10 using a 5-bit prefix', function(){
        var buffer = new Buffer([0x0a]);
        buffer._cursor = 0;
        var num = ctx._decodeInteger(buffer, 5);

        expect(num).to.be(10);
      });

      it('should encode 10 using a 0-bit prefix', function(){
        var buffer = ctx._encodeInteger(10, 5);

        expect(buffer.length).to.be(1);
        expect(buffer[0]).to.be(0x0a);
      });

      it('should decode 10 using a 0-bit prefix', function(){
        var buffer = new Buffer([0x0a]);
        buffer._cursor = 0;
        var num = ctx._decodeInteger(buffer, 5);

        expect(num).to.be(10);
      });

      it('should encode 1337 using a 5-bit prefix', function(){
        var buffer = ctx._encodeInteger(1337, 5);

        expect(buffer.length).to.be(3);
        expect(buffer[0]).to.be(0x1f);
        expect(buffer[1]).to.be(0x9a);
        expect(buffer[2]).to.be(0x0a);
      });

      it('should decode 1337 using a 5-bit prefix', function(){
        var buffer = new Buffer([0x1f, 0x9a, 0x0a]);
        buffer._cursor = 0;
        var num = ctx._decodeInteger(buffer, 5);

        expect(num).to.be(1337);
      });

      it('should encode 1337 using a 0-bit prefix', function(){
        var buffer = ctx._encodeInteger(1337, 0);

        expect(buffer.length).to.be(2);
        expect(buffer[0]).to.be(0xb9);
        expect(buffer[1]).to.be(0x0a);
      });

      it('should decode 1337 using a 0-bit prefix', function(){
        var buffer = new Buffer([0xb9, 0x0a]);
        buffer._cursor = 0;
        var num = ctx._decodeInteger(buffer, 0);

        expect(num).to.be(1337);
      });
    });
  });

  context('Indexed Header Representation', function(){
    var ctx;

    beforeEach(function(){
      ctx = hpack.createRequestContext();
    });

    it('should encode header', function(){
      var cmd = { type: 0, index: 1 };
      var buffer = ctx._encodeHeader(cmd);

      expect(buffer.length).to.be(1);
      expect(buffer[0]).to.be(0x81);
    });

    it('should decode header', function(){
      var buffer = new Buffer([0x81]);
      buffer._cursor = 0;
      var cmd = ctx._decodeHeader(buffer);

      expect(cmd.type).to.be(0);
      expect(cmd.index).to.be(1);
    });
  });

  context('Literal Header Representation', function(){
    var ctx;

    beforeEach(function(){
      ctx = hpack.createRequestContext();
    });

    context('Literal Header without Indexing', function(){
      it('should encode header using indexed name', function(){
        var cmd = { type: 1, index: 3, value: '/' };
        var buffer = ctx._encodeHeader(cmd);

        expect(buffer.length).to.be(3);
        expect(buffer[0]).to.be(0x64);
        expect(buffer[1]).to.be(0x01);
        expect(buffer[2]).to.be(0x2f);
      });

      it('should decode header using indexed name', function(){
        var buffer = new Buffer([0x64, 0x01, 0x2f]);
        buffer._cursor = 0;
        var cmd = ctx._decodeHeader(buffer);

        expect(cmd.type).to.be(1);
        expect(cmd.index).to.be(3);
        expect(cmd.value).to.be('/');
      });

      it('should encode header using new name', function(){
        var cmd = { type: 1, name: ':path', value: '/' };
        var buffer = ctx._encodeHeader(cmd);

        expect(buffer.length).to.be(9);
        expect(buffer[0]).to.be(0x60);
        expect(buffer[1]).to.be(0x05);
        expect(buffer[2]).to.be(0x3a);
        expect(buffer[3]).to.be(0x70);
        expect(buffer[4]).to.be(0x61);
        expect(buffer[5]).to.be(0x74);
        expect(buffer[6]).to.be(0x68);
        expect(buffer[7]).to.be(0x01);
        expect(buffer[8]).to.be(0x2f);
      });

      it('should decode header using new name', function(){
        var buffer = new Buffer([0x60, 0x05, 0x3a, 0x70, 0x61, 0x74, 0x68, 0x01, 0x2f]);
        buffer._cursor = 0;
        var cmd = ctx._decodeHeader(buffer);

        expect(cmd.type).to.be(1);
        expect(cmd.name).to.be(':path');
        expect(cmd.value).to.be('/');
      });
    });

    context('Literal Header without Incremental Indexing', function(){
      it('should encode header using indexed name', function(){
        var cmd = { type: 2, index: 3, value: '/' };
        var buffer = ctx._encodeHeader(cmd);

        expect(buffer.length).to.be(3);
        expect(buffer[0]).to.be(0x44);
        expect(buffer[1]).to.be(0x01);
        expect(buffer[2]).to.be(0x2f);
      });

      it('should decode header using indexed name', function(){
        var buffer = new Buffer([0x44, 0x01, 0x2f]);
        buffer._cursor = 0;
        var cmd = ctx._decodeHeader(buffer);

        expect(cmd.type).to.be(2);
        expect(cmd.index).to.be(3);
        expect(cmd.value).to.be('/');
      });

      it('should encode header using new name', function(){
        var cmd = { type: 2, name: ':path', value: '/' };
        var buffer = ctx._encodeHeader(cmd);

        expect(buffer.length).to.be(9);
        expect(buffer[0]).to.be(0x40);
        expect(buffer[1]).to.be(0x05);
        expect(buffer[2]).to.be(0x3a);
        expect(buffer[3]).to.be(0x70);
        expect(buffer[4]).to.be(0x61);
        expect(buffer[5]).to.be(0x74);
        expect(buffer[6]).to.be(0x68);
        expect(buffer[7]).to.be(0x01);
        expect(buffer[8]).to.be(0x2f);
      });

      it('should decode header using new name', function(){
        var buffer = new Buffer([0x40, 0x05, 0x3a, 0x70, 0x61, 0x74, 0x68, 0x01, 0x2f]);
        buffer._cursor = 0;
        var cmd = ctx._decodeHeader(buffer);

        expect(cmd.type).to.be(2);
        expect(cmd.name).to.be(':path');
        expect(cmd.value).to.be('/');
      });
    });

    context('Literal Header without Substitution Indexing', function(){
      it('should encode header using indexed name', function(){
        var cmd = { type: 3, index: 3, value: '/', subst_index: 3 };
        var buffer = ctx._encodeHeader(cmd);

        expect(buffer.length).to.be(4);
        expect(buffer[0]).to.be(0x04);
        expect(buffer[1]).to.be(0x03);
        expect(buffer[2]).to.be(0x01);
        expect(buffer[3]).to.be(0x2f);
      });

      it('should decode header using indexed name', function(){
        var buffer = new Buffer([0x04, 0x03, 0x01, 0x2f]);
        buffer._cursor = 0;
        var cmd = ctx._decodeHeader(buffer);

        expect(cmd.type).to.be(3);
        expect(cmd.index).to.be(3);
        expect(cmd.value).to.be('/');
        expect(cmd.subst_index).to.be(3);
      });

      it('should encode header using new name', function(){
        var cmd = { type: 3, name: ':path', value: '/', subst_index: 3 };
        var buffer = ctx._encodeHeader(cmd);

        expect(buffer.length).to.be(10);
        expect(buffer[0]).to.be(0x00);
        expect(buffer[1]).to.be(0x05);
        expect(buffer[2]).to.be(0x3a);
        expect(buffer[3]).to.be(0x70);
        expect(buffer[4]).to.be(0x61);
        expect(buffer[5]).to.be(0x74);
        expect(buffer[6]).to.be(0x68);
        expect(buffer[7]).to.be(0x03);
        expect(buffer[8]).to.be(0x01);
        expect(buffer[9]).to.be(0x2f);
      });

      it('should decode header using new name', function(){
        var buffer = new Buffer([0x00, 0x05, 0x3a, 0x70, 0x61, 0x74, 0x68, 0x03, 0x01, 0x2f]);
        buffer._cursor = 0;
        var cmd = ctx._decodeHeader(buffer);

        expect(cmd.type).to.be(3);
        expect(cmd.name).to.be(':path');
        expect(cmd.value).to.be('/');
        expect(cmd.subst_index).to.be(3);
      });
    });
  });

  context('Header Processsing', function(){
    context('Header Compression', function(){
      var ctx = hpack.createRequestContext();

      it('should encode first header', function(){
        var headers = {
          ':path':       '/my-example/index.html',
          'user-agent':  'my-user-agent',
          'mynewheader': 'first'
        };

        var encoded_headers = new Buffer([
          0x44, 0x16, 0x2f, 0x6d, 0x79, 0x2d, 0x65, 0x78,
          0x61, 0x6d, 0x70, 0x6c, 0x65, 0x2f, 0x69, 0x6e,
          0x64, 0x65, 0x78, 0x2e, 0x68, 0x74, 0x6d, 0x6c,
          0x4c, 0x0d, 0x6d, 0x79, 0x2d, 0x75, 0x73, 0x65,
          0x72, 0x2d, 0x61, 0x67, 0x65, 0x6e, 0x74, 0x40,
          0x0b, 0x6d, 0x79, 0x6e, 0x65, 0x77, 0x68, 0x65,
          0x61, 0x64, 0x65, 0x72, 0x05, 0x66, 0x69, 0x72,
          0x73, 0x74
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
      });

      it('should encode second header', function(){
        var headers = {
          ':path':       '/my-example/resource/script.js',
          'user-agent':  'my-user-agent',
          'mynewheader': 'second'
        }

        var encoded_headers = new Buffer([
          0x5f, 0x00, 0x1e, 0x2f, 0x6d, 0x79, 0x2d, 0x65,
          0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x2f, 0x72,
          0x65, 0x73, 0x6f, 0x75, 0x72, 0x63, 0x65, 0x2f,
          0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x2e, 0x6a,
          0x73, 0x5f, 0x02, 0x06, 0x73, 0x65, 0x63, 0x6f,
          0x6e, 0x64, 0x9e, 0xa0
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
      });

      it('should encode third header', function(){
        var headers = {
          ':path':       '/my-example/resource/script.js',
          'user-agent':  'my-user-agent',
          'mynewheader': 'third'
        }

        var encoded_headers = new Buffer([
          0x5f, 0x04, 0x05, 0x74, 0x68, 0x69, 0x72, 0x64,
          0xa2
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
      });

      it('should encode fourth header', function(){
        var headers = {
          ':path':       '/my-example/resource/script.js',
          'user-agent':  'my-user-agent',
          'mynewheader': 'third'
        }

        var encoded_headers = new Buffer(0);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
      });
    });

    context('Header Compression with eviction', function(){
      var ctx = hpack.createRequestContext(1400);

      it('should encode first header', function(){
        var headers = {
          ':path':       '/my-example/index.html',
          'user-agent':  'my-user-agent',
          'mynewheader': 'first'
        };

        var encoded_headers = new Buffer([
          0x44, 0x16, 0x2f, 0x6d, 0x79, 0x2d, 0x65, 0x78,
          0x61, 0x6d, 0x70, 0x6c, 0x65, 0x2f, 0x69, 0x6e,
          0x64, 0x65, 0x78, 0x2e, 0x68, 0x74, 0x6d, 0x6c,
          0x4c, 0x0d, 0x6d, 0x79, 0x2d, 0x75, 0x73, 0x65,
          0x72, 0x2d, 0x61, 0x67, 0x65, 0x6e, 0x74, 0x40,
          0x0b, 0x6d, 0x79, 0x6e, 0x65, 0x77, 0x68, 0x65,
          0x61, 0x64, 0x65, 0x72, 0x05, 0x66, 0x69, 0x72,
          0x73, 0x74
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
      });

      it('should encode second header', function(){
        var headers = {
          ':path':       '/my-example/resource/script.js',
          'user-agent':  'my-user-agent',
          'mynewheader': 'second'
        }

        var encoded_headers = new Buffer([
          0x5e, 0x1e, 0x2f, 0x6d, 0x79, 0x2d, 0x65, 0x78,
          0x61, 0x6d, 0x70, 0x6c, 0x65, 0x2f, 0x72, 0x65,
          0x73, 0x6f, 0x75, 0x72, 0x63, 0x65, 0x2f, 0x73,
          0x63, 0x72, 0x69, 0x70, 0x74, 0x2e, 0x6a, 0x73,
          0x5e, 0x06, 0x73, 0x65, 0x63, 0x6f, 0x6e, 0x64,
          0x9a, 0x9c
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
      });

      it('should encode third header', function(){
        var headers = {
          ':path':       '/my-example/resource/script.js',
          'user-agent':  'my-user-agent',
          'mynewheader': 'third'
        }

        var encoded_headers = new Buffer([
          0x5f, 0x00, 0x05, 0x74, 0x68, 0x69, 0x72, 0x64,
          0x9d
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
      });

      it('should encode fourth header', function(){
        var headers = {
          ':path':       '/my-example/resource/script.js',
          'user-agent':  'my-user-agent',
          'mynewheader': 'third'
        }

        var encoded_headers = new Buffer(0);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
      }); 
    });

    context('Header Decompression', function(){
      var ctx = hpack.createRequestContext();

      it('should decode first header', function(){
        var headers = {
          ':path':       '/my-example/index.html',
          'user-agent':  'my-user-agent',
          'mynewheader': 'first'
        };

        var encoded_headers = new Buffer([
          0x44, 0x16, 0x2f, 0x6d, 0x79, 0x2d, 0x65, 0x78,
          0x61, 0x6d, 0x70, 0x6c, 0x65, 0x2f, 0x69, 0x6e,
          0x64, 0x65, 0x78, 0x2e, 0x68, 0x74, 0x6d, 0x6c,
          0x4c, 0x0d, 0x6d, 0x79, 0x2d, 0x75, 0x73, 0x65,
          0x72, 0x2d, 0x61, 0x67, 0x65, 0x6e, 0x74, 0x40,
          0x0b, 0x6d, 0x79, 0x6e, 0x65, 0x77, 0x68, 0x65,
          0x61, 0x64, 0x65, 0x72, 0x05, 0x66, 0x69, 0x72,
          0x73, 0x74
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
      });

      it('should decode second header', function(){
        var headers = {
          ':path':       '/my-example/resource/script.js',
          'user-agent':  'my-user-agent',
          'mynewheader': 'second'
        }

        var encoded_headers = new Buffer([
          0x5f, 0x00, 0x1e, 0x2f, 0x6d, 0x79, 0x2d, 0x65,
          0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x2f, 0x72,
          0x65, 0x73, 0x6f, 0x75, 0x72, 0x63, 0x65, 0x2f,
          0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x2e, 0x6a,
          0x73, 0x5f, 0x02, 0x06, 0x73, 0x65, 0x63, 0x6f,
          0x6e, 0x64, 0x9e, 0xa0
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
      });

      it('should decode third header', function(){
        var headers = {
          ':path':       '/my-example/resource/script.js',
          'user-agent':  'my-user-agent',
          'mynewheader': 'third'
        }

        var encoded_headers = new Buffer([
          0x5f, 0x04, 0x05, 0x74, 0x68, 0x69, 0x72, 0x64,
          0xa2
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
      });

      it('should decode fourth header', function(){
        var headers = {
          ':path':       '/my-example/resource/script.js',
          'user-agent':  'my-user-agent',
          'mynewheader': 'third'
        }

        var encoded_headers = new Buffer(0);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
      });
    });

    context('Header Decompression with eviction', function(){
      var ctx = hpack.createRequestContext(1400);

      it('should decode first header', function(){
        var headers = {
          ':path':       '/my-example/index.html',
          'user-agent':  'my-user-agent',
          'mynewheader': 'first'
        };

        var encoded_headers = new Buffer([
          0x44, 0x16, 0x2f, 0x6d, 0x79, 0x2d, 0x65, 0x78,
          0x61, 0x6d, 0x70, 0x6c, 0x65, 0x2f, 0x69, 0x6e,
          0x64, 0x65, 0x78, 0x2e, 0x68, 0x74, 0x6d, 0x6c,
          0x4c, 0x0d, 0x6d, 0x79, 0x2d, 0x75, 0x73, 0x65,
          0x72, 0x2d, 0x61, 0x67, 0x65, 0x6e, 0x74, 0x40,
          0x0b, 0x6d, 0x79, 0x6e, 0x65, 0x77, 0x68, 0x65,
          0x61, 0x64, 0x65, 0x72, 0x05, 0x66, 0x69, 0x72,
          0x73, 0x74
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
      });

      it('should decode second header', function(){
        var headers = {
          ':path':       '/my-example/resource/script.js',
          'user-agent':  'my-user-agent',
          'mynewheader': 'second'
        }

        var encoded_headers = new Buffer([
          0x9d, 0x9f, 0x5e, 0x1e, 0x2f, 0x6d, 0x79, 0x2d,
          0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x2f,
          0x72, 0x65, 0x73, 0x6f, 0x75, 0x72, 0x63, 0x65,
          0x2f, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x2e,
          0x6a, 0x73, 0x5e, 0x06, 0x73, 0x65, 0x63, 0x6f,
          0x6e, 0x64
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
      });

      it('should decode third header', function(){
        var headers = {
          ':path':       '/my-example/resource/script.js',
          'user-agent':  'my-user-agent',
          'mynewheader': 'third'
        }

        var encoded_headers = new Buffer([
          0x9e, 0x5f, 0x00, 0x05, 0x74, 0x68, 0x69, 0x72,
          0x64
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
      });

      it('should decode fourth header', function(){
        var headers = {
          ':path':       '/my-example/resource/script.js',
          'user-agent':  'my-user-agent',
          'mynewheader': 'third'
        }

        var encoded_headers = new Buffer(0);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
      }); 
    });

    context('Header Table Management', function(){
      it('should clear all entries when handle large header', function(){
        var limit = 4097;
        var ctx = hpack.createRequestContext(limit);

        var large_value = '';
        for (var i=0; i<=limit; i++) {
          large_value += 'a';
        }

        var headers = {
          ':path': large_value
        }

        var buffer = ctx.compress(headers);

        expect(ctx._header_table.size, 0);
        expect(ctx._header_table._entries.length, 0);
        expect(buffer[0]).to.be(0x44);
        expect(buffer[1]).to.be(0x82);
        expect(buffer[2]).to.be(0x20);
      });

      it('should prepend entry when entry to be replaced is removed', function(){
        var limit = 1263;
        var ctx = hpack.createRequestContext(limit);

        var encoded_headers = new Buffer([
          0x03, 0x02, 0x46, 0x77, 0x77, 0x77, 0x2e, 0x74,
          0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f,
          0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f,
          0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f,
          0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x2e, 0x6c,
          0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f,
          0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f,
          0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f, 0x6f,
          0x6f, 0x6f, 0x6f, 0x6e, 0x67, 0x2e, 0x63, 0x6f, 
          0x6d
        ]);

        var headers = ctx.decompress(encoded_headers);
        expect(ctx._header_table._entries.length).to.be(28);
        expect(ctx._header_table._entries[0].name).to.be(':host');
      });
    });

    context('Error Handling', function(){
      var ctx = hpack.createRequestContext();

      it('should handle invalid indexed name', function(){
        var encoded_headers = new Buffer([
          0x5f, 0x45, 0x01, 0x61
        ]);

        expect(function(){
          ctx.decompress(encoded_headers);
        }).to.throwException();
      });

      it('should handle invalid substitution index', function(){
        var encoded_headers = new Buffer([
          0x04, 0x63, 0x01, 0x2f
        ]);

        expect(function(){
          ctx.decompress(encoded_headers);
        }).to.throwException();
      });
    });
  });
});
