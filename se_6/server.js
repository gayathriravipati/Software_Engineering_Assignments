const http = require('http');
const xml2js = require('xml2js');

class Myserver {
  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));
    this.hostname = '127.0.0.1';
    this.bodySizeLimit = 1024 * 1024; // Set a size limit (1 MB in this example)
  }

  handleRequest(req, res) {
    res.setHeader('Content-Type', 'text/plain');

    if (req.method === 'POST') {
      const cType = req.headers['content-type'];
      const contentType = cType.toLowerCase();


      if (contentType === 'application/json' || contentType === 'application/xml' || contentType === 'text/plain') {
        let body = '';
        let bodySize = 0;

        req.on('data', (chunk) => {
          bodySize += chunk.length;
          if (bodySize > this.bodySizeLimit) {
            res.statusCode = 413; // 413 Request Entity Too Large
            res.end('Request Entity Too Large');
            req.destroy(); // Close the request to stop receiving more data
          } else {
            body += chunk;
          }
        });

        req.on('end', () => {
          if (res.statusCode !== 413) {
            try {
              if (contentType === 'application/json') {
                try {
                  JSON.parse(body);
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(body);
                } catch (jsonError) {
                  res.statusCode = 400; // For invalid JSON
                  res.end('Invalid JSON Data');
                }
              } else if (contentType === 'application/xml') {
                xml2js.parseString(body, (err, result) => {
                  if (err) {
                    res.statusCode = 400;
                    res.end('Invalid XML Data');
                  } else {
                    res.setHeader('Content-Type', 'application/xml');
                    res.statusCode = 200;
                    res.end(body);
                  }
                });
              } else if (contentType === 'text/plain') {
                if (/^[a-zA-Z0-9\s]*$/.test(body)) {
                  // Handle text/plain content type
                  res.setHeader('Content-Type', 'text/plain');
                  res.statusCode = 200;
                  res.end(body);
                } else {
                  res.statusCode = 400;
                  res.end('Invalid Content Type');
                }
              }              
            } catch (error) {
              res.statusCode = 400; // For invalid request body
              res.end('Invalid Request Body');
            }
          }
        });
      } else {
        res.statusCode = 415;
        res.end('Unsupported Media Type. Supported types: application/json, application/xml, text/plain');
      }
    } else {
      res.statusCode = 405;
      res.end('Method not allowed');
    }
  }

  start(port) {
    this.server.listen(port, this.hostname, () => {
      console.log(`Server is running at http://${this.hostname}:${port}/`);
    });
  }
}

const myServer = new Myserver();
let port = 3000;
myServer.start(port);
module.exports = Myserver;
