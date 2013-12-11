var expect = require('expect.js');
var hpack = require('../lib/hpack');

describe('HPACK', function(){
  context('Low-Level Representation', function(){
    context('Integer Representation', function(){
      var ctx = hpack.createRequestContext({ huffman: false });

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

      it('should encode 42 using a 8-bit prefix', function(){
        var buffer = ctx._encodeInteger(42, 8);

        expect(buffer.length).to.be(1);
        expect(buffer[0]).to.be(0x2A);
      });

      it('should decode 42 using a 8-bit prefix', function(){
        var buffer = new Buffer([0x2A]);
        buffer._cursor = 0;
        var num = ctx._decodeInteger(buffer, 8);

        expect(num).to.be(42);
      });
    });
  });

  context('Indexed Header Representation', function(){
    var ctx;

    beforeEach(function(){
      ctx = hpack.createRequestContext({ huffman: false });
    });

    it('should encode header', function(){
      var cmd = { type: 0, index: 1 };
      var buffer = ctx._encodeHeader(cmd);

      expect(buffer.length).to.be(1);
      expect(buffer[0]).to.be(0x82);
    });

    it('should decode header', function(){
      var buffer = new Buffer([0x82]);
      buffer._cursor = 0;
      var cmd = ctx._decodeHeader(buffer);

      expect(cmd.type).to.be(0);
      expect(cmd.index).to.be(1);
    });

    it('should reset reference set', function(){
      var cmd = { type: 0, index: 0 };
      var buffer = ctx._encodeHeader(cmd);

      expect(buffer.length).to.be(1);
      expect(buffer[0]).to.be(0x80);
      expect(ctx._header_table.length).to.eql(0);
      expect(ctx._header_table.size).to.eql(0);

      buffer._cursor = 0;
      var decoded_cmd = ctx._decodeHeader(buffer);

      expect(decoded_cmd).to.eql(cmd);
      expect(ctx._header_table.length).to.eql(0);
      expect(ctx._header_table.size).to.eql(0);
    });
  });

  context('Literal Header Representation', function(){
    var ctx;

    beforeEach(function(){
      ctx = hpack.createRequestContext({ huffman: false });
    });

    context('Literal Header without Indexing', function(){
      it('should encode header using indexed name', function(){
        var cmd = { type: 1, index: 3, value: '/' };
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

        expect(cmd.type).to.be(1);
        expect(cmd.index).to.be(3);
        expect(cmd.value).to.be('/');
      });

      it('should encode header using new name', function(){
        var cmd = { type: 1, name: ':path', value: '/' };
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

        expect(cmd.type).to.be(1);
        expect(cmd.name).to.be(':path');
        expect(cmd.value).to.be('/');
      });
    });

    context('Literal Header with Incremental Indexing', function(){
      it('should encode header using indexed name', function(){
        var cmd = { type: 2, index: 3, value: '/' };
        var buffer = ctx._encodeHeader(cmd);

        expect(buffer.length).to.be(3);
        expect(buffer[0]).to.be(0x04);
        expect(buffer[1]).to.be(0x01);
        expect(buffer[2]).to.be(0x2f);
      });

      it('should decode header using indexed name', function(){
        var buffer = new Buffer([0x04, 0x01, 0x2f]);
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
        expect(buffer[0]).to.be(0x00);
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
        var buffer = new Buffer([0x00, 0x05, 0x3a, 0x70, 0x61, 0x74, 0x68, 0x01, 0x2f]);
        buffer._cursor = 0;
        var cmd = ctx._decodeHeader(buffer);

        expect(cmd.type).to.be(2);
        expect(cmd.name).to.be(':path');
        expect(cmd.value).to.be('/');
      });
    });
  });

  context('Header Processsing', function(){
    context('Request examples compression', function(){
      var ctx = hpack.createRequestContext({ huffman: false });

      it('should encode first header', function(){
        var headers = {
          ':method': 'GET',
          ':scheme': 'http',
          ':path': '/',
          ':authority': 'www.example.com'
        };

        var encoded_headers = new Buffer([
          0x82, 0x87, 0x86, 0x04, 0x0f, 0x77, 0x77, 0x77,
          0x2e, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65,
          0x2e, 0x63, 0x6f, 0x6d
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(180);
      });

      it('should encode second header', function(){
        var headers = {
          ':method': 'GET',
          ':scheme': 'http',
          ':path': '/',
          ':authority': 'www.example.com',
          'cache-control': 'no-cache'
        };

        var encoded_headers = new Buffer([
          0x1b, 0x08, 0x6e, 0x6f, 0x2d, 0x63, 0x61, 0x63,
          0x68, 0x65
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(5);
        expect(ctx._header_table.size).to.eql(233);
      });

      it('should encode third header', function(){
        var headers = {
          ':method': 'GET',
          ':scheme': 'https',
          ':path': '/index.html',
          ':authority': 'www.example.com',
          'custom-key': 'custom-value'
        };

        var encoded_headers = new Buffer([
          0x8c, 0x8b, 0x00, 0x0a, 0x63, 0x75, 0x73, 0x74,
          0x6f, 0x6d, 0x2d, 0x6b, 0x65, 0x79, 0x0c, 0x63,
          0x75, 0x73, 0x74, 0x6f, 0x6d, 0x2d, 0x76, 0x61,
          0x6c, 0x75, 0x65, 0x84, 0x86, 0x87
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(8);
        expect(ctx._header_table.size).to.eql(379);
      });
    });

    context('Request examples decompression', function(){
      var ctx = hpack.createRequestContext({ huffman: false });

      it('should decode first header', function(){
        var headers = {
          ':method': 'GET',
          ':scheme': 'http',
          ':path': '/',
          ':authority': 'www.example.com'
        };

        var encoded_headers = new Buffer([
          0x82, 0x87, 0x86, 0x04, 0x0f, 0x77, 0x77, 0x77,
          0x2e, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65,
          0x2e, 0x63, 0x6f, 0x6d
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(180);
      });

      it('should decode second header', function(){
        var headers = {
          ':method': 'GET',
          ':scheme': 'http',
          ':path': '/',
          ':authority': 'www.example.com',
          'cache-control': 'no-cache'
        };

        var encoded_headers = new Buffer([
          0x1b, 0x08, 0x6e, 0x6f, 0x2d, 0x63, 0x61, 0x63,
          0x68, 0x65
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(5);
        expect(ctx._header_table.size).to.eql(233);
      });

      it('should decode third header', function(){
        var headers = {
          ':method': 'GET',
          ':scheme': 'https',
          ':path': '/index.html',
          ':authority': 'www.example.com',
          'custom-key': 'custom-value'
        };

        var encoded_headers = new Buffer([
          0x8c, 0x8b, 0x00, 0x0a, 0x63, 0x75, 0x73, 0x74,
          0x6f, 0x6d, 0x2d, 0x6b, 0x65, 0x79, 0x0c, 0x63,
          0x75, 0x73, 0x74, 0x6f, 0x6d, 0x2d, 0x76, 0x61,
          0x6c, 0x75, 0x65, 0x84, 0x86, 0x87
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(8);
        expect(ctx._header_table.size).to.eql(379);
      });
    });

    context('Request examples with Huffman compression', function(){
      var ctx = hpack.createRequestContext();

      it('should encode first header', function(){
        var headers = {
          ':method': 'GET',
          ':scheme': 'http',
          ':path': '/',
          ':authority': 'www.example.com'
        };

        var encoded_headers = new Buffer([
          0x82, 0x87, 0x86, 0x04, 0x8b, 0xdb, 0x6d, 0x88,
          0x3e, 0x68, 0xd1, 0xcb, 0x12, 0x25, 0xba, 0x7f
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(180);
      });

      it('should encode second header', function(){
        var headers = {
          ':method': 'GET',
          ':scheme': 'http',
          ':path': '/',
          ':authority': 'www.example.com',
          'cache-control': 'no-cache'
        };

        var encoded_headers = new Buffer([
          0x1b, 0x86, 0x63, 0x65, 0x4a, 0x13, 0x98, 0xff
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(5);
        expect(ctx._header_table.size).to.eql(233);
      });

      it('should encode third header', function(){
        var headers = {
          ':method': 'GET',
          ':scheme': 'https',
          ':path': '/index.html',
          ':authority': 'www.example.com',
          'custom-key': 'custom-value'
        };

        var encoded_headers = new Buffer([
          0x8c, 0x8b, 0x00, 0x88, 0x4e, 0xb0, 0x8b, 0x74,
          0x97, 0x90, 0xfa, 0x7f, 0x89, 0x4e, 0xb0, 0x8b,
          0x74, 0x97, 0x9a, 0x17, 0xa8, 0xff, 0x84, 0x86,
          0x87
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(8);
        expect(ctx._header_table.size).to.eql(379);
      });
    });

    context('Request examples with Huffman decompression', function(){
      var ctx = hpack.createRequestContext();

      it('should decode first header', function(){
        var headers = {
          ':method': 'GET',
          ':scheme': 'http',
          ':path': '/',
          ':authority': 'www.example.com'
        };

        var encoded_headers = new Buffer([
          0x82, 0x87, 0x86, 0x04, 0x8b, 0xdb, 0x6d, 0x88,
          0x3e, 0x68, 0xd1, 0xcb, 0x12, 0x25, 0xba, 0x7f
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(180);
      });

      it('should decode second header', function(){
        var headers = {
          ':method': 'GET',
          ':scheme': 'http',
          ':path': '/',
          ':authority': 'www.example.com',
          'cache-control': 'no-cache'
        };

        var encoded_headers = new Buffer([
          0x1b, 0x86, 0x63, 0x65, 0x4a, 0x13, 0x98, 0xff
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(5);
        expect(ctx._header_table.size).to.eql(233);
      });

      it('should decode third header', function(){
        var headers = {
          ':method': 'GET',
          ':scheme': 'https',
          ':path': '/index.html',
          ':authority': 'www.example.com',
          'custom-key': 'custom-value'
        };

        var encoded_headers = new Buffer([
          0x8c, 0x8b, 0x00, 0x88, 0x4e, 0xb0, 0x8b, 0x74,
          0x97, 0x90, 0xfa, 0x7f, 0x89, 0x4e, 0xb0, 0x8b,
          0x74, 0x97, 0x9a, 0x17, 0xa8, 0xff, 0x84, 0x86,
          0x87
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(8);
        expect(ctx._header_table.size).to.eql(379);
      });
    });

    context('Response examples compression', function(){
      var ctx = hpack.createResponseContext({ huffman: false, limit: 256 });

      it('should encode first header', function(){
        var headers = {
          ':status': '302',
          'cache-control': 'private',
          'date': 'Mon, 21 Oct 2013 20:13:21 GMT',
          'location': 'https://www.example.com'
        };

        var encoded_headers = new Buffer([
          0x08, 0x03, 0x33, 0x30, 0x32, 0x18, 0x07, 0x70,
          0x72, 0x69, 0x76, 0x61, 0x74, 0x65, 0x22, 0x1d,
          0x4d, 0x6f, 0x6e, 0x2c, 0x20, 0x32, 0x31, 0x20,
          0x4f, 0x63, 0x74, 0x20, 0x32, 0x30, 0x31, 0x33,
          0x20, 0x32, 0x30, 0x3a, 0x31, 0x33, 0x3a, 0x32,
          0x31, 0x20, 0x47, 0x4d, 0x54, 0x30, 0x17, 0x68,
          0x74, 0x74, 0x70, 0x73, 0x3a, 0x2f, 0x2f, 0x77,
          0x77, 0x77, 0x2e, 0x65, 0x78, 0x61, 0x6d, 0x70,
          0x6c, 0x65, 0x2e, 0x63, 0x6f, 0x6d
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(222);
      });

      it('should encode second header', function(){
        var headers = {
          ':status': '200',
          'cache-control': 'private',
          'date': 'Mon, 21 Oct 2013 20:13:21 GMT',
          'location': 'https://www.example.com'
        };

        var encoded_headers = new Buffer([
          0x8c
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(222);
      });

      it('should encode third header', function(){
        var headers = {
          ':status': '200',
          'cache-control': 'private',
          'date': 'Mon, 21 Oct 2013 20:13:22 GMT',
          'location': 'https://www.example.com',
          'content-encoding': 'gzip',
          'set-cookie': 'foo=ASDJKHQKBZXOQWEOPIUAXQWEOIU; max-age=3600; version=1'
        };

        var encoded_headers = new Buffer([
          0x83, 0x84, 0x84, 0x03, 0x1d, 0x4d, 0x6f, 0x6e,
          0x2c, 0x20, 0x32, 0x31, 0x20, 0x4f, 0x63, 0x74,
          0x20, 0x32, 0x30, 0x31, 0x33, 0x20, 0x32, 0x30,
          0x3a, 0x31, 0x33, 0x3a, 0x32, 0x32, 0x20, 0x47,
          0x4d, 0x54, 0x1d, 0x04, 0x67, 0x7a, 0x69, 0x70,
          0x84, 0x84, 0x83, 0x83, 0x3a, 0x38, 0x66, 0x6f,
          0x6f, 0x3d, 0x41, 0x53, 0x44, 0x4a, 0x4b, 0x48,
          0x51, 0x4b, 0x42, 0x5a, 0x58, 0x4f, 0x51, 0x57,
          0x45, 0x4f, 0x50, 0x49, 0x55, 0x41, 0x58, 0x51,
          0x57, 0x45, 0x4f, 0x49, 0x55, 0x3b, 0x20, 0x6d,
          0x61, 0x78, 0x2d, 0x61, 0x67, 0x65, 0x3d, 0x33,
          0x36, 0x30, 0x30, 0x3b, 0x20, 0x76, 0x65, 0x72,
          0x73, 0x69, 0x6f, 0x6e, 0x3d, 0x31
        ]);

        var buffer = ctx.compress(headers);
        //expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(3);
        expect(ctx._header_table.size).to.eql(215);
      });
    });

    context('Response examples decompression', function(){
      var ctx = hpack.createResponseContext({ huffman: false, limit: 256 });

      it('should decode first header', function(){
        var headers = {
          ':status': '302',
          'cache-control': 'private',
          'date': 'Mon, 21 Oct 2013 20:13:21 GMT',
          'location': 'https://www.example.com'
        };

        var encoded_headers = new Buffer([
          0x08, 0x03, 0x33, 0x30, 0x32, 0x18, 0x07, 0x70,
          0x72, 0x69, 0x76, 0x61, 0x74, 0x65, 0x22, 0x1d,
          0x4d, 0x6f, 0x6e, 0x2c, 0x20, 0x32, 0x31, 0x20,
          0x4f, 0x63, 0x74, 0x20, 0x32, 0x30, 0x31, 0x33,
          0x20, 0x32, 0x30, 0x3a, 0x31, 0x33, 0x3a, 0x32,
          0x31, 0x20, 0x47, 0x4d, 0x54, 0x30, 0x17, 0x68,
          0x74, 0x74, 0x70, 0x73, 0x3a, 0x2f, 0x2f, 0x77,
          0x77, 0x77, 0x2e, 0x65, 0x78, 0x61, 0x6d, 0x70,
          0x6c, 0x65, 0x2e, 0x63, 0x6f, 0x6d
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(222);
      });

      it('should encode second header', function(){
        var headers = {
          ':status': '200',
          'cache-control': 'private',
          'date': 'Mon, 21 Oct 2013 20:13:21 GMT',
          'location': 'https://www.example.com'
        };

        var encoded_headers = new Buffer([
          0x84, 0x8c
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(222);
      });

      it('should encode third header', function(){
        var headers = {
          ':status': '200',
          'cache-control': 'private',
          'date': 'Mon, 21 Oct 2013 20:13:22 GMT',
          'location': 'https://www.example.com',
          'content-encoding': 'gzip',
          'set-cookie': 'foo=ASDJKHQKBZXOQWEOPIUAXQWEOIU; max-age=3600; version=1'
        };

        var encoded_headers = new Buffer([
          0x83, 0x84, 0x84, 0x03, 0x1d, 0x4d, 0x6f, 0x6e,
          0x2c, 0x20, 0x32, 0x31, 0x20, 0x4f, 0x63, 0x74,
          0x20, 0x32, 0x30, 0x31, 0x33, 0x20, 0x32, 0x30,
          0x3a, 0x31, 0x33, 0x3a, 0x32, 0x32, 0x20, 0x47,
          0x4d, 0x54, 0x1d, 0x04, 0x67, 0x7a, 0x69, 0x70,
          0x84, 0x84, 0x83, 0x83, 0x3a, 0x38, 0x66, 0x6f,
          0x6f, 0x3d, 0x41, 0x53, 0x44, 0x4a, 0x4b, 0x48,
          0x51, 0x4b, 0x42, 0x5a, 0x58, 0x4f, 0x51, 0x57,
          0x45, 0x4f, 0x50, 0x49, 0x55, 0x41, 0x58, 0x51,
          0x57, 0x45, 0x4f, 0x49, 0x55, 0x3b, 0x20, 0x6d,
          0x61, 0x78, 0x2d, 0x61, 0x67, 0x65, 0x3d, 0x33,
          0x36, 0x30, 0x30, 0x3b, 0x20, 0x76, 0x65, 0x72,
          0x73, 0x69, 0x6f, 0x6e, 0x3d, 0x31
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(3);
        expect(ctx._header_table.size).to.eql(215);
      });
    });

    context('Response examples with Huffman compression', function(){
      var ctx = hpack.createResponseContext({ limit: 256 });

      it('should encode first header', function(){
        var headers = {
          ':status': '302',
          'cache-control': 'private',
          'date': 'Mon, 21 Oct 2013 20:13:21 GMT',
          'location': 'https://www.example.com'
        };

        var encoded_headers = new Buffer([
          0x08, 0x82, 0x40, 0x9f, 0x18, 0x86, 0xc3, 0x1b,
          0x39, 0xbf, 0x38, 0x7f, 0x22, 0x92, 0xa2, 0xfb,
          0xa2, 0x03, 0x20, 0xf2, 0xab, 0x30, 0x31, 0x24,
          0x01, 0x8b, 0x49, 0x0d, 0x32, 0x09, 0xe8, 0x77,
          0x30, 0x93, 0xe3, 0x9e, 0x78, 0x64, 0xdd, 0x7a,
          0xfd, 0x3d, 0x3d, 0x24, 0x87, 0x47, 0xdb, 0x87,
          0x28, 0x49, 0x55, 0xf6, 0xff
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(222);
      });

      it('should encode second header', function(){
        var headers = {
          ':status': '200',
          'cache-control': 'private',
          'date': 'Mon, 21 Oct 2013 20:13:21 GMT',
          'location': 'https://www.example.com'
        };

        var encoded_headers = new Buffer([
          0x8c
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(222);
      });

      it('should encode third header', function(){
        var headers = {
          ':status': '200',
          'cache-control': 'private',
          'date': 'Mon, 21 Oct 2013 20:13:22 GMT',
          'location': 'https://www.example.com',
          'content-encoding': 'gzip',
          'set-cookie': 'foo=ASDJKHQKBZXOQWEOPIUAXQWEOIU; max-age=3600; version=1'
        };

        var encoded_headers = new Buffer([
          0x83, 0x84, 0x84, 0x03, 0x92, 0xa2, 0xfb, 0xa2,
          0x03, 0x20, 0xf2, 0xab, 0x30, 0x31, 0x24, 0x01,
          0x8b, 0x49, 0x0d, 0x33, 0x09, 0xe8, 0x77, 0x1d,
          0x84, 0xe1, 0xfb, 0xb3, 0x0f, 0x84, 0x84, 0x83,
          0x83, 0x3a, 0xb3, 0xdf, 0x7d, 0xfb, 0x36, 0xd3,
          0xd9, 0xe1, 0xfc, 0xfc, 0x3f, 0xaf, 0xe7, 0xab,
          0xfc, 0xfe, 0xfc, 0xbf, 0xaf, 0x3e, 0xdf, 0x2f,
          0x97, 0x7f, 0xd3, 0x6f, 0xf7, 0xfd, 0x79, 0xf6,
          0xf9, 0x77, 0xfd, 0x3d, 0xe1, 0x6b, 0xfa, 0x46,
          0xfe, 0x10, 0xd8, 0x89, 0x44, 0x7d, 0xe1, 0xce,
          0x18, 0xe5, 0x65, 0xf7, 0x6c, 0x2f
        ]);

        var buffer = ctx.compress(headers);
        //expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(3);
        expect(ctx._header_table.size).to.eql(215);
      });
    });

    context('Response examples with Huffman decompression', function(){
      var ctx = hpack.createResponseContext({ limit: 256 });

      it('should decode first header', function(){
        var headers = {
          ':status': '302',
          'cache-control': 'private',
          'date': 'Mon, 21 Oct 2013 20:13:21 GMT',
          'location': 'https://www.example.com'
        };

        var encoded_headers = new Buffer([
          0x08, 0x82, 0x40, 0x9f, 0x18, 0x86, 0xc3, 0x1b,
          0x39, 0xbf, 0x38, 0x7f, 0x22, 0x92, 0xa2, 0xfb,
          0xa2, 0x03, 0x20, 0xf2, 0xab, 0x30, 0x31, 0x24,
          0x01, 0x8b, 0x49, 0x0d, 0x32, 0x09, 0xe8, 0x77,
          0x30, 0x93, 0xe3, 0x9e, 0x78, 0x64, 0xdd, 0x7a,
          0xfd, 0x3d, 0x3d, 0x24, 0x87, 0x47, 0xdb, 0x87,
          0x28, 0x49, 0x55, 0xf6, 0xff
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(222);
      });

      it('should encode second header', function(){
        var headers = {
          ':status': '200',
          'cache-control': 'private',
          'date': 'Mon, 21 Oct 2013 20:13:21 GMT',
          'location': 'https://www.example.com'
        };

        var encoded_headers = new Buffer([
          0x84, 0x8c
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(222);
      });

      it('should encode third header', function(){
        var headers = {
          ':status': '200',
          'cache-control': 'private',
          'date': 'Mon, 21 Oct 2013 20:13:22 GMT',
          'location': 'https://www.example.com',
          'content-encoding': 'gzip',
          'set-cookie': 'foo=ASDJKHQKBZXOQWEOPIUAXQWEOIU; max-age=3600; version=1'
        };

        var encoded_headers = new Buffer([
          0x83, 0x84, 0x84, 0x03, 0x92, 0xa2, 0xfb, 0xa2,
          0x03, 0x20, 0xf2, 0xab, 0x30, 0x31, 0x24, 0x01,
          0x8b, 0x49, 0x0d, 0x33, 0x09, 0xe8, 0x77, 0x1d,
          0x84, 0xe1, 0xfb, 0xb3, 0x0f, 0x84, 0x84, 0x83,
          0x83, 0x3a, 0xb3, 0xdf, 0x7d, 0xfb, 0x36, 0xd3,
          0xd9, 0xe1, 0xfc, 0xfc, 0x3f, 0xaf, 0xe7, 0xab,
          0xfc, 0xfe, 0xfc, 0xbf, 0xaf, 0x3e, 0xdf, 0x2f,
          0x97, 0x7f, 0xd3, 0x6f, 0xf7, 0xfd, 0x79, 0xf6,
          0xf9, 0x77, 0xfd, 0x3d, 0xe1, 0x6b, 0xfa, 0x46,
          0xfe, 0x10, 0xd8, 0x89, 0x44, 0x7d, 0xe1, 0xce,
          0x18, 0xe5, 0x65, 0xf7, 0x6c, 0x2f
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(3);
        expect(ctx._header_table.size).to.eql(215);
      });
    });
  });

  context('Header Table Management', function(){
    it('should clear all entries when process large header value', function(){
      var limit = 255;
      var ctx = hpack.createRequestContext({ limit: limit });

      var first_header = {
        ':method': 'GET',
        ':scheme': 'http',
        ':path': '/',
        ':authority': 'www.example.com'
      };

      ctx.compress(first_header);
      expect(ctx._header_table.length).to.eql(4);
      expect(ctx._header_table.size).to.eql(180);

      var large_value = '';
      for (var i=0; i<=limit; i++) {
        large_value += 'a';
      }

      var second_headers = {
        ':path': large_value
      };

      ctx.compress(second_headers);
      expect(ctx._header_table.length).to.eql(0);
      expect(ctx._header_table.size).to.eql(0);
    });
  });

  context('Error Handling', function(){
    var ctx = hpack.createRequestContext();

    it('should handle invalid indexed name', function(){
      var encoded_headers = new Buffer([
        0x7f, 0x26, 0x81, 0x0f
      ]);

      expect(function(){
        ctx.decompress(encoded_headers);
      }).to.throwException();
    });
  });
});
