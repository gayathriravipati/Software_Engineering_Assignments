const request = require('supertest'); // supertest
const Myserver = require('./server'); // Myserver class
const xml2js = require('xml2js');
const bodySizeLimit = 1024 * 1024;

describe('Myserver API', () => {
  let server;

  it('should handle a valid JSON POST request', (done) => {
    server = new Myserver();
    server.start(3005);
    const postData = { key: 'value' };
    request(server.server)
      .post('/')
      .set('Content-Type', 'application/json')
      .send(postData)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, response) => {
        const responseBody = JSON.parse(response.text);
        expect(responseBody).toEqual(postData);
        server.server.close();
        done();
      });
  });

  it('should handle a valid XML POST request', (done) => {
    server = new Myserver();
    server.start(3005);
    const postData = { key: 'value' };
    const xmlBuilder = new xml2js.Builder();
    const xmlData = xmlBuilder.buildObject(postData);
    request(server.server)
      .post('/')
      .set('Content-Type', 'application/xml')
      .send(xmlData)
      .expect('Content-Type', /xml/)
      .expect(200)
      .end((err, response) => {
        xml2js.parseString(response.text, (parseError, result) => {
          if (parseError) {
            done(parseError);
          } else {
            expect(result).toEqual(postData);
            server.server.close();
            done();
          }
        });
      });
  });

  it('should handle a valid text/plain POST request', (done) => {
    server = new Myserver();
    server.start(3005);
    const postData = 'This is plain text data';
    request(server.server)
      .post('/')
      .set('Content-Type', 'text/plain')
      .send(postData)
      .expect('Content-Type', /plain/)
      .expect(200)
      .end((err, response) => {
        expect(response.text).toEqual(postData);
        server.server.close();
        done();
      });
  });

  it('should respond with 400 Bad Request for invalid JSON data with JSON content-type', (done) => {
    const postData = 'This is not a valid JSON data';
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .post('/')
      .set('Content-Type', 'application/json')
      .send(postData)
      .expect(400)
      .expect('Invalid JSON Data')
      .end((err, response) => {
        expect(response.text).toEqual('Invalid JSON Data');
        server.server.close();
        done();
      });
  });

  it('should respond with 400 Bad Request for invalid plain text data with text/plain content-type', (done) => {
    const postData = 'This is not a valid plain text. It contains special characters: #$%@';
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .post('/')
      .set('Content-Type', 'text/plain')
      .send(postData)
      .expect(400)
      .expect('Invalid Content Type')
      .end((err, response) => {
        expect(response.text).toEqual('Invalid Content Type'); 
        server.server.close();
        done();
      });
  });
  

  it('should respond with 400 Bad Request for invalid XML data with application/xml content-type', (done) => {
    server = new Myserver();
    server.start(3005);
    const invalidXml = '<root><key>value</key>'; 
    request(server.server)
      .post('/')
      .set('Content-Type', 'application/xml')
      .send(invalidXml)
      .expect(400)
      .expect('Invalid XML Data')
      .end((err, response) => {
        expect(response.text).toEqual('Invalid XML Data');
        server.server.close();
        done();
      });
  });

  it('should respond with 415 Unsupported Media Type for an unsupported content type', (done) => {
    const unsupportedContentType = 'application/pdf';
    const postData = 'Some data';
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .post('/')
      .set('Content-Type', unsupportedContentType)
      .send(postData)
      .expect(415)
      .expect('Unsupported Media Type. Supported types: application/json, application/xml, text/plain')
      .end((err, response) => {
        expect(response.text).toEqual('Unsupported Media Type. Supported types: application/json, application/xml, text/plain');
        server.server.close();
        done();
      });
  });

  it('should respond with 405 Method Not Allowed for GET requests', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .get('/')
      .expect(405)
      .expect('Method not allowed')
      .end((err, response) => {
        expect(response.text).toEqual('Method not allowed');
        server.server.close();
        done();
      });
  });

  it('should respond with 405 Method Not Allowed for PUT requests', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .put('/')
      .expect(405)
      .expect('Method not allowed')
      .end((err, response) => {
        expect(response.text).toEqual('Method not allowed');
        server.server.close();
        done();
      });
  });

  it('should respond with 405 Method Not Allowed for PATCH requests', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .patch('/')
      .expect(405)
      .expect('Method not allowed')
      .end((err, response) => {
        expect(response.text).toEqual('Method not allowed');
        server.server.close();
        done();
      });
  });

  it('should respond with 405 Method Not Allowed for DELETE requests', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .delete('/')
      .expect(405)
      .expect('Method not allowed')
      .end((err, response) => {
        expect(response.text).toEqual('Method not allowed');
        server.server.close();
        done();
      });
  });

  it('should respond with 400 Bad Request for an empty request body', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .post('/')
      .set('Content-Type', 'application/json')
      .send('')
      .expect(400)
      .expect('Invalid JSON Data')
      .end((err, response) => {
        expect(response.text).toEqual('Invalid JSON Data');
        server.server.close();
        done();
      });
  });

  it('should respond with 413 Request Entity Too Large for a large request body', (done) => {
    const messageSize = bodySizeLimit + 1;
    const largeBody = 'x'.repeat(messageSize);
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .post('/')
      .set('Content-Type', 'application/json')
      .send(largeBody)
      .expect(413)
      .expect('Request Entity Too Large')
      .end((err, response) => {
        expect(response.text).toEqual('Request Entity Too Large');
        server.server.close();
        done();
      });
  });

  it('should respond with 413 Request Entity Too Large for a large XML request body', (done) => {
    const messageSize = bodySizeLimit + 1;
    const largeXMLBody = `<root>${'x'.repeat(messageSize)}</root>`;
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .post('/')
      .set('Content-Type', 'application/xml')
      .send(largeXMLBody)
      .expect(413)
      .expect('Request Entity Too Large')
      .end((err, response) => {
        expect(response.text).toEqual('Request Entity Too Large');
        server.server.close();
        done();
      });
  });

  it('should respond with 413 Request Entity Too Large for a large JSON request body', (done) => {
    const messageSize = bodySizeLimit + 1;
    const largeJSONBody = {
      key: 'x'.repeat(messageSize),
    };
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .post('/')
      .set('Content-Type', 'application/json')
      .send(largeJSONBody)
      .expect(413)
      .expect('Request Entity Too Large')
      .end((err, response) => {
        expect(response.text).toEqual('Request Entity Too Large');
        server.server.close();
        done();
      });
  });

  it('should handle case-insensitive content types', (done) => {
    const server = new Myserver(); // Initialize the server
  
    // Start the server before running the test
    server.start(3005);
  
    // Send a request with a content type in uppercase
    request(server.server)
    .post('/')
    .set('Content-Type', 'APPLICATION/JSON')
    .send({ key: 'value' })
    .expect('Content-Type', /json/)
    .expect(200)
    .end((err, response) => {
      const responseBody = JSON.parse(response.text);
      expect(responseBody).toEqual({ key: 'value' });
      server.server.close();
      done();
    });
});

});