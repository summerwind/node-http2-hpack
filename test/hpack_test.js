var expect = require('expect.js');
var hpack = require('../lib/hpack');

describe('HPACK', function(){
  context('Low-Level Representation', function(){
    context('Integer Representation', function(){
      var ctx = hpack.createContext({ huffman: false });

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

  context('Indexed Header Field Representation', function(){
    var ctx;

    beforeEach(function(){
      ctx = hpack.createContext({ huffman: false });
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
  });

  context('Literal Header Field Representation', function(){
    var ctx;

    beforeEach(function(){
      ctx = hpack.createContext({ huffman: false });
    });

    context('Literal Header Field with Incremental Indexing', function(){
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

    context('Literal Header Field without Indexing', function(){
      it('should encode header using indexed name', function(){
        var cmd = { type: 2, index: 3, value: '/' };
        var buffer = ctx._encodeHeader(cmd);

        expect(buffer.length).to.be(3);
        expect(buffer[0]).to.be(0x4);
        expect(buffer[1]).to.be(0x01);
        expect(buffer[2]).to.be(0x2f);
      });

      it('should decode header using indexed name', function(){
        var buffer = new Buffer([0x4, 0x01, 0x2f]);
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
        expect(buffer[0]).to.be(0x0);
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
        var buffer = new Buffer([0x0, 0x05, 0x3a, 0x70, 0x61, 0x74, 0x68, 0x01, 0x2f]);
        buffer._cursor = 0;
        var cmd = ctx._decodeHeader(buffer);

        expect(cmd.type).to.be(2);
        expect(cmd.name).to.be(':path');
        expect(cmd.value).to.be('/');
      });
    });

    context('Literal Header Field never Indexed', function(){
      it('should encode header using indexed name', function(){
        var cmd = { type: 3, index: 3, value: '/' };
        var buffer = ctx._encodeHeader(cmd);

        expect(buffer.length).to.be(3);
        expect(buffer[0]).to.be(0x14);
        expect(buffer[1]).to.be(0x01);
        expect(buffer[2]).to.be(0x2f);
      });

      it('should decode header using indexed name', function(){
        var buffer = new Buffer([0x14, 0x01, 0x2f]);
        buffer._cursor = 0;
        var cmd = ctx._decodeHeader(buffer);

        expect(cmd.type).to.be(3);
        expect(cmd.index).to.be(3);
        expect(cmd.value).to.be('/');
      });

      it('should encode header using new name', function(){
        var cmd = { type: 3, name: ':path', value: '/' };
        var buffer = ctx._encodeHeader(cmd);

        expect(buffer.length).to.be(9);
        expect(buffer[0]).to.be(0x10);
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
        var buffer = new Buffer([0x10, 0x05, 0x3a, 0x70, 0x61, 0x74, 0x68, 0x01, 0x2f]);
        buffer._cursor = 0;
        var cmd = ctx._decodeHeader(buffer);

        expect(cmd.type).to.be(3);
        expect(cmd.name).to.be(':path');
        expect(cmd.value).to.be('/');
      });
    });
  });

  context('Encoding Context Update', function(){
    var ctx;

    beforeEach(function(){
      ctx = hpack.createContext({ huffman: false });
    });

    it('should reset reference set', function(){
      var cmd = { type: 4, update: { type: 0 } };
      var buffer = ctx._encodeHeader(cmd);

      expect(buffer.length).to.be(1);
      expect(buffer[0]).to.be(0x30);
      expect(ctx._header_table.length).to.eql(0);
      expect(ctx._header_table.size).to.eql(0);

      buffer._cursor = 0;
      var decoded_cmd = ctx._decodeHeader(buffer);

      expect(decoded_cmd).to.eql(cmd);
      expect(ctx._header_table.length).to.eql(0);
      expect(ctx._header_table.size).to.eql(0);
    });

    it('should change table size', function(){
      var cmd = { type: 4, update: { type: 1, size: 512 } };
      var buffer = ctx._encodeHeader(cmd);

      expect(buffer.length).to.be(3);
      expect(buffer[0]).to.be(0x2f);
      expect(buffer[1]).to.be(0xf1);
      expect(buffer[2]).to.be(0x3);
      expect(ctx._header_table.length).to.eql(0);
      expect(ctx._header_table.size).to.eql(0);

      buffer._cursor = 0;
      var decoded_cmd = ctx._decodeHeader(buffer);

      expect(decoded_cmd).to.eql(cmd);
      expect(ctx._header_table.length).to.eql(0);
      expect(ctx._header_table.size).to.eql(0);
    });
  });

  context('Header Processsing', function(){
    context('Request examples compression', function(){
      var ctx = hpack.createContext({ huffman: false });

      it('should encode first header', function(){
        var headers = [
          [ ':method', 'GET' ],
          [ ':scheme', 'http' ],
          [ ':path', '/' ],
          [ ':authority', 'www.example.com' ]
        ];

        var encoded_headers = new Buffer([
          0x82, 0x87, 0x86, 0x44, 0x0f, 0x77, 0x77, 0x77,
          0x2e, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65,
          0x2e, 0x63, 0x6f, 0x6d
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(180);
      });

      it('should encode second header', function(){
        var headers = [
          [ ':method', 'GET' ],
          [ ':scheme', 'http' ],
          [ ':path', '/' ],
          [ ':authority', 'www.example.com' ],
          [ 'cache-control', 'no-cache' ]
        ];

        var encoded_headers = new Buffer([
          0x5c, 0x08, 0x6e, 0x6f, 0x2d, 0x63, 0x61, 0x63,
          0x68, 0x65
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(5);
        expect(ctx._header_table.size).to.eql(233);
      });

      it('should encode third header', function(){
        var headers = [
          [ ':method', 'GET' ],
          [ ':scheme', 'https' ],
          [ ':path', '/index.html' ],
          [ ':authority', 'www.example.com' ],
          [ 'custom-key', 'custom-value' ]
        ];

        var encoded_headers = new Buffer([
          0x8c, 0x8b, 0x40, 0x0a, 0x63, 0x75, 0x73, 0x74,
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
      var ctx = hpack.createContext({ huffman: false });

      it('should decode first header', function(){
        var headers = [
          [ ':method', 'GET' ],
          [ ':scheme', 'http' ],
          [ ':path', '/' ],
          [ ':authority', 'www.example.com' ]
        ];

        var encoded_headers = new Buffer([
          0x82, 0x87, 0x86, 0x44, 0x0f, 0x77, 0x77, 0x77,
          0x2e, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65,
          0x2e, 0x63, 0x6f, 0x6d
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(180);
      });

      it('should decode second header', function(){
        var headers = [
          [ 'cache-control', 'no-cache' ],
          [ ':authority', 'www.example.com' ],
          [ ':path', '/' ],
          [ ':scheme', 'http' ],
          [ ':method', 'GET' ]
        ];

        var encoded_headers = new Buffer([
          0x5c, 0x08, 0x6e, 0x6f, 0x2d, 0x63, 0x61, 0x63,
          0x68, 0x65
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(5);
        expect(ctx._header_table.size).to.eql(233);
      });

      it('should decode third header', function(){
        var headers = [
          [ ':scheme', 'https' ],
          [ ':path', '/index.html' ],
          [ 'custom-key', 'custom-value' ],
          [ ':authority', 'www.example.com' ],
          [ ':method', 'GET' ]
        ];

        var encoded_headers = new Buffer([
          0x8c, 0x8b, 0x40, 0x0a, 0x63, 0x75, 0x73, 0x74,
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
      var ctx = hpack.createContext();

      it('should encode first header', function(){
        var headers = [
          [ ':method', 'GET' ],
          [ ':scheme', 'http' ],
          [ ':path', '/' ],
          [ ':authority', 'www.example.com' ]
        ];

        var encoded_headers = new Buffer([
          0x82, 0x87, 0x86, 0x44, 0x8c, 0xe7, 0xcf, 0x9b,
          0xeb, 0xe8, 0x9b, 0x6f, 0xb1, 0x6f, 0xa9, 0xb6,
          0xff
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(180);
      });

      it('should encode second header', function(){
        var headers = [
          [ ':method', 'GET' ],
          [ ':scheme', 'http' ],
          [ ':path', '/' ],
          [ ':authority', 'www.example.com' ],
          [ 'cache-control', 'no-cache' ]
        ];

        var encoded_headers = new Buffer([
          0x5c, 0x86, 0xb9, 0xb9, 0x94, 0x95, 0x56, 0xbf
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(5);
        expect(ctx._header_table.size).to.eql(233);
      });

      it('should encode third header', function(){
        var headers = [
          [ ':method', 'GET' ],
          [ ':scheme', 'https' ],
          [ ':path', '/index.html' ],
          [ ':authority', 'www.example.com' ],
          [ 'custom-key', 'custom-value' ]
        ];

        var encoded_headers = new Buffer([
          0x8c, 0x8b, 0x40, 0x88, 0x57, 0x1c, 0x5c, 0xdb,
          0x73, 0x7b, 0x2f, 0xaf, 0x89, 0x57, 0x1c, 0x5c,
          0xdb, 0x73, 0x72, 0x4d, 0x9c, 0x57, 0x84, 0x86,
          0x87
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(8);
        expect(ctx._header_table.size).to.eql(379);
      });
    });

    context('Request examples with Huffman decompression', function(){
      var ctx = hpack.createContext();

      it('should decode first header', function(){
        var headers = [
          [ ':method', 'GET' ],
          [ ':scheme', 'http' ],
          [ ':path', '/' ],
          [ ':authority', 'www.example.com' ]
        ];

        var encoded_headers = new Buffer([
          0x82, 0x87, 0x86, 0x44, 0x8c, 0xe7, 0xcf, 0x9b,
          0xeb, 0xe8, 0x9b, 0x6f, 0xb1, 0x6f, 0xa9, 0xb6,
          0xff
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(180);
      });

      it('should decode second header', function(){
        var headers = [
          [ 'cache-control', 'no-cache' ],
          [ ':authority', 'www.example.com' ],
          [ ':path', '/' ],
          [ ':scheme', 'http' ],
          [ ':method', 'GET' ]
        ];

        var encoded_headers = new Buffer([
          0x5c, 0x86, 0xb9, 0xb9, 0x94, 0x95, 0x56, 0xbf
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(5);
        expect(ctx._header_table.size).to.eql(233);
      });

      it('should decode third header', function(){
        var headers = [
          [ ':scheme', 'https' ],
          [ ':path', '/index.html' ],
          [ 'custom-key', 'custom-value' ],
          [ ':authority', 'www.example.com' ],
          [ ':method', 'GET' ]
        ];

        var encoded_headers = new Buffer([
          0x8c, 0x8b, 0x40, 0x88, 0x57, 0x1c, 0x5c, 0xdb,
          0x73, 0x7b, 0x2f, 0xaf, 0x89, 0x57, 0x1c, 0x5c,
          0xdb, 0x73, 0x72, 0x4d, 0x9c, 0x57, 0x84, 0x86,
          0x87
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(8);
        expect(ctx._header_table.size).to.eql(379);
      });
    });

    context('Response examples compression', function(){
      var ctx = hpack.createContext({ huffman: false, size: 256 });

      it('should encode first header', function(){
        var headers = [
          [ ':status', '302' ],
          [ 'cache-control', 'private' ],
          [ 'date', 'Mon, 21 Oct 2013 20:13:21 GMT' ],
          [ 'location', 'https://www.example.com' ]
        ];

        var encoded_headers = new Buffer([
          0x48, 0x03, 0x33, 0x30, 0x32, 0x59, 0x07, 0x70,
          0x72, 0x69, 0x76, 0x61, 0x74, 0x65, 0x63, 0x1d,
          0x4d, 0x6f, 0x6e, 0x2c, 0x20, 0x32, 0x31, 0x20,
          0x4f, 0x63, 0x74, 0x20, 0x32, 0x30, 0x31, 0x33,
          0x20, 0x32, 0x30, 0x3a, 0x31, 0x33, 0x3a, 0x32,
          0x31, 0x20, 0x47, 0x4d, 0x54, 0x71, 0x17, 0x68,
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
        var headers = [
          [ ':status', '200' ],
          [ 'cache-control', 'private' ],
          [ 'date', 'Mon, 21 Oct 2013 20:13:21 GMT' ],
          [ 'location', 'https://www.example.com' ]
        ];

        var encoded_headers = new Buffer([
          0x8c
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(222);
      });

      it('should encode third header', function(){
        var headers = [
          [ ':status', '200' ],
          [ 'cache-control', 'private' ],
          [ 'date', 'Mon, 21 Oct 2013 20:13:22 GMT' ],
          [ 'location', 'https://www.example.com' ],
          [ 'content-encoding', 'gzip' ],
          [ 'set-cookie', 'foo=ASDJKHQKBZXOQWEOPIUAXQWEOIU; max-age=3600; version=1' ]
        ];

        var encoded_headers = new Buffer([
          0x84, 0x84, 0x43, 0x1d, 0x4d, 0x6f, 0x6e, 0x2c,
          0x20, 0x32, 0x31, 0x20, 0x4f, 0x63, 0x74, 0x20,
          0x32, 0x30, 0x31, 0x33, 0x20, 0x32, 0x30, 0x3a,
          0x31, 0x33, 0x3a, 0x32, 0x32, 0x20, 0x47, 0x4d,
          0x54, 0x5e, 0x04, 0x67, 0x7a, 0x69, 0x70, 0x84,
          0x84, 0x83, 0x83, 0x7b, 0x38, 0x66, 0x6f, 0x6f,
          0x3d, 0x41, 0x53, 0x44, 0x4a, 0x4b, 0x48, 0x51,
          0x4b, 0x42, 0x5a, 0x58, 0x4f, 0x51, 0x57, 0x45,
          0x4f, 0x50, 0x49, 0x55, 0x41, 0x58, 0x51, 0x57,
          0x45, 0x4f, 0x49, 0x55, 0x3b, 0x20, 0x6d, 0x61,
          0x78, 0x2d, 0x61, 0x67, 0x65, 0x3d, 0x33, 0x36,
          0x30, 0x30, 0x3b, 0x20, 0x76, 0x65, 0x72, 0x73,
          0x69, 0x6f, 0x6e, 0x3d, 0x31
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(3);
        expect(ctx._header_table.size).to.eql(215);
      });
    });

    context('Response examples decompression', function(){
      var ctx = hpack.createContext({ huffman: false, size: 256 });

      it('should decode first header', function(){
        var headers = [
          [ ':status', '302' ],
          [ 'cache-control', 'private' ],
          [ 'date', 'Mon, 21 Oct 2013 20:13:21 GMT' ],
          [ 'location', 'https://www.example.com' ]
        ];

        var encoded_headers = new Buffer([
          0x48, 0x03, 0x33, 0x30, 0x32, 0x59, 0x07, 0x70,
          0x72, 0x69, 0x76, 0x61, 0x74, 0x65, 0x63, 0x1d,
          0x4d, 0x6f, 0x6e, 0x2c, 0x20, 0x32, 0x31, 0x20,
          0x4f, 0x63, 0x74, 0x20, 0x32, 0x30, 0x31, 0x33,
          0x20, 0x32, 0x30, 0x3a, 0x31, 0x33, 0x3a, 0x32,
          0x31, 0x20, 0x47, 0x4d, 0x54, 0x71, 0x17, 0x68,
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
        var headers = [
          [ ':status', '200' ],
          [ 'location', 'https://www.example.com' ],
          [ 'date', 'Mon, 21 Oct 2013 20:13:21 GMT' ],
          [ 'cache-control', 'private' ]
        ];

        var encoded_headers = new Buffer([
          0x84, 0x8c
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(222);
      });

      it('should encode third header', function(){
        var headers = [
          [ 'cache-control', 'private' ],
          [ 'date', 'Mon, 21 Oct 2013 20:13:22 GMT' ],
          [ 'content-encoding', 'gzip' ],
          [ 'location', 'https://www.example.com' ],
          [ ':status', '200' ],
          [ 'set-cookie', 'foo=ASDJKHQKBZXOQWEOPIUAXQWEOIU; max-age=3600; version=1' ]
        ];

        var encoded_headers = new Buffer([
          0x84, 0x84, 0x43, 0x1d, 0x4d, 0x6f, 0x6e, 0x2c,
          0x20, 0x32, 0x31, 0x20, 0x4f, 0x63, 0x74, 0x20,
          0x32, 0x30, 0x31, 0x33, 0x20, 0x32, 0x30, 0x3a,
          0x31, 0x33, 0x3a, 0x32, 0x32, 0x20, 0x47, 0x4d,
          0x54, 0x5e, 0x04, 0x67, 0x7a, 0x69, 0x70, 0x84,
          0x84, 0x83, 0x83, 0x7b, 0x38, 0x66, 0x6f, 0x6f,
          0x3d, 0x41, 0x53, 0x44, 0x4a, 0x4b, 0x48, 0x51,
          0x4b, 0x42, 0x5a, 0x58, 0x4f, 0x51, 0x57, 0x45,
          0x4f, 0x50, 0x49, 0x55, 0x41, 0x58, 0x51, 0x57,
          0x45, 0x4f, 0x49, 0x55, 0x3b, 0x20, 0x6d, 0x61,
          0x78, 0x2d, 0x61, 0x67, 0x65, 0x3d, 0x33, 0x36,
          0x30, 0x30, 0x3b, 0x20, 0x76, 0x65, 0x72, 0x73,
          0x69, 0x6f, 0x6e, 0x3d, 0x31
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(3);
        expect(ctx._header_table.size).to.eql(215);
      });
    });

    context('Response examples with Huffman compression', function(){
      var ctx = hpack.createContext({ size: 256 });

      it('should encode first header', function(){
        var headers = [
          [ ':status', '302' ],
          [ 'cache-control', 'private' ],
          [ 'date', 'Mon, 21 Oct 2013 20:13:21 GMT' ],
          [ 'location', 'https://www.example.com' ]
        ];

        var encoded_headers = new Buffer([
          0x48, 0x82, 0x40, 0x17, 0x59, 0x85, 0xbf, 0x06,
          0x72, 0x4b, 0x97, 0x63, 0x93, 0xd6, 0xdb, 0xb2,
          0x98, 0x84, 0xde, 0x2a, 0x71, 0x88, 0x05, 0x06,
          0x20, 0x98, 0x51, 0x31, 0x09, 0xb5, 0x6b, 0xa3,
          0x71, 0x91, 0xad, 0xce, 0xbf, 0x19, 0x8e, 0x7e,
          0x7c, 0xf9, 0xbe, 0xbe, 0x89, 0xb6, 0xfb, 0x16,
          0xfa, 0x9b, 0x6f
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(222);
      });

      it('should encode second header', function(){
        var headers = [
          [ ':status', '200' ],
          [ 'cache-control', 'private' ],
          [ 'date', 'Mon, 21 Oct 2013 20:13:21 GMT' ],
          [ 'location', 'https://www.example.com' ]
        ];

        var encoded_headers = new Buffer([
          0x8c
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(222);
      });

      it('should encode third header', function(){
        var headers = [
          [ ':status', '200' ],
          [ 'cache-control', 'private' ],
          [ 'date', 'Mon, 21 Oct 2013 20:13:22 GMT' ],
          [ 'location', 'https://www.example.com' ],
          [ 'content-encoding', 'gzip' ],
          [ 'set-cookie', 'foo=ASDJKHQKBZXOQWEOPIUAXQWEOIU; max-age=3600; version=1' ]
        ];

        var encoded_headers = new Buffer([
          0x84, 0x84, 0x43, 0x93, 0xd6, 0xdb, 0xb2, 0x98,
          0x84, 0xde, 0x2a, 0x71, 0x88, 0x05, 0x06, 0x20,
          0x98, 0x51, 0x31, 0x11, 0xb5, 0x6b, 0xa3, 0x5e,
          0x84, 0xab, 0xdd, 0x97, 0xff, 0x84, 0x84, 0x83,
          0x83, 0x7b, 0xb1, 0xe0, 0xd6, 0xcf, 0x9f, 0x6e,
          0x8f, 0x9f, 0xd3, 0xe5, 0xf6, 0xfa, 0x76, 0xfe,
          0xfd, 0x3c, 0x7e, 0xdf, 0x9e, 0xff, 0x1f, 0x2f,
          0x0f, 0x3c, 0xfe, 0x9f, 0x6f, 0xcf, 0x7f, 0x8f,
          0x87, 0x9f, 0x61, 0xad, 0x4f, 0x4c, 0xc9, 0xa9,
          0x73, 0xa2, 0x20, 0x0e, 0xc3, 0x72, 0x5e, 0x18,
          0xb1, 0xb7, 0x4e, 0x3f
        ]);

        var buffer = ctx.compress(headers);
        expect(buffer).to.eql(encoded_headers);
        expect(ctx._header_table.length).to.eql(3);
        expect(ctx._header_table.size).to.eql(215);
      });
    });

    context('Response examples with Huffman decompression', function(){
      var ctx = hpack.createContext({ size: 256 });

      it('should decode first header', function(){
        var headers = [
          [ ':status', '302' ],
          [ 'cache-control', 'private' ],
          [ 'date', 'Mon, 21 Oct 2013 20:13:21 GMT' ],
          [ 'location', 'https://www.example.com' ]
        ];

        var encoded_headers = new Buffer([
          0x48, 0x82, 0x40, 0x17, 0x59, 0x85, 0xbf, 0x06,
          0x72, 0x4b, 0x97, 0x63, 0x93, 0xd6, 0xdb, 0xb2,
          0x98, 0x84, 0xde, 0x2a, 0x71, 0x88, 0x05, 0x06,
          0x20, 0x98, 0x51, 0x31, 0x09, 0xb5, 0x6b, 0xa3,
          0x71, 0x91, 0xad, 0xce, 0xbf, 0x19, 0x8e, 0x7e,
          0x7c, 0xf9, 0xbe, 0xbe, 0x89, 0xb6, 0xfb, 0x16,
          0xfa, 0x9b, 0x6f
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(222);
      });

      it('should encode second header', function(){
        var headers = [
          [ ':status', '200' ],
          [ 'location', 'https://www.example.com' ],
          [ 'date', 'Mon, 21 Oct 2013 20:13:21 GMT' ],
          [ 'cache-control', 'private' ]
        ];

        var encoded_headers = new Buffer([
          0x84, 0x8c
        ]);

        var decoded_headers = ctx.decompress(encoded_headers);
        expect(decoded_headers).to.eql(headers);
        expect(ctx._header_table.length).to.eql(4);
        expect(ctx._header_table.size).to.eql(222);
      });

      it('should encode third header', function(){
        var headers = [
          [ 'cache-control', 'private' ],
          [ 'date', 'Mon, 21 Oct 2013 20:13:22 GMT' ],
          [ 'content-encoding', 'gzip' ],
          [ 'location', 'https://www.example.com' ],
          [ ':status', '200' ],
          [ 'set-cookie', 'foo=ASDJKHQKBZXOQWEOPIUAXQWEOIU; max-age=3600; version=1' ]
        ];

        var encoded_headers = new Buffer([
          0x84, 0x84, 0x43, 0x93, 0xd6, 0xdb, 0xb2, 0x98,
          0x84, 0xde, 0x2a, 0x71, 0x88, 0x05, 0x06, 0x20,
          0x98, 0x51, 0x31, 0x11, 0xb5, 0x6b, 0xa3, 0x5e,
          0x84, 0xab, 0xdd, 0x97, 0xff, 0x84, 0x84, 0x83,
          0x83, 0x7b, 0xb1, 0xe0, 0xd6, 0xcf, 0x9f, 0x6e,
          0x8f, 0x9f, 0xd3, 0xe5, 0xf6, 0xfa, 0x76, 0xfe,
          0xfd, 0x3c, 0x7e, 0xdf, 0x9e, 0xff, 0x1f, 0x2f,
          0x0f, 0x3c, 0xfe, 0x9f, 0x6f, 0xcf, 0x7f, 0x8f,
          0x87, 0x9f, 0x61, 0xad, 0x4f, 0x4c, 0xc9, 0xa9,
          0x73, 0xa2, 0x20, 0x0e, 0xc3, 0x72, 0x5e, 0x18,
          0xb1, 0xb7, 0x4e, 0x3f
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
      var size = 255;
      var ctx = hpack.createContext({ size: size });

      var first_header = [
        [ ':method', 'GET' ],
        [ ':scheme', 'http' ],
        [ ':path', '/' ],
        [ ':authority', 'www.example.com' ]
      ];

      ctx.compress(first_header);
      expect(ctx._header_table.length).to.eql(4);
      expect(ctx._header_table.size).to.eql(180);

      var large_value = '';
      for (var i=0; i<=size; i++) {
        large_value += 'a';
      }

      var second_headers = [
        [ ':path', large_value ]
      ];

      ctx.compress(second_headers);
      expect(ctx._header_table.length).to.eql(0);
      expect(ctx._header_table.size).to.eql(0);
    });

    it('should emit evicted entry while encoding', function(){
      var ctx1 = hpack.createContext({ huffman: false });
      var ctx2 = hpack.createContext({ huffman: false });

      var large_value = '';
      for(i = 0; i < 4096 - 32 - 1; ++i) {
        large_value += '1';
      }

      var headers = [
        [ [ 'x', large_value ] ],
        [ [ 'x', large_value ], [ ':method', 'GET' ] ]
      ];

      ctx2.decompress(ctx1.compress(headers[0]));
      var decoded_headers = ctx2.decompress(ctx1.compress(headers[1]));

      expect(decoded_headers[0][0]).to.be('x');
      expect(decoded_headers[0][1]).to.be(large_value);
    });
  });

  context('Error Handling', function(){
    var ctx = hpack.createContext();

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
