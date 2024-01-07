const http = require('http');
const xml2js = require('xml2js');
const mysql = require('mysql2');

class Myserver {
  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));
    this.hostname = '127.0.0.1';
    this.bodySizeLimit = 1024 * 1024;
    this.db = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'heythere',
      database: 'se5', 
    });
    this.db.connect((err) => {
      if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
      }
      console.log('Connected to MySQL database');
    });
  }
  handleRequest(req, res) {
    res.setHeader('Content-Type', 'application/json');
    console.log("method is",req.method)
    if (req.method === 'POST') {
      const cType = req.headers['content-type'];
      const contentType = cType.toLowerCase();
    
      if (contentType === 'application/json' || contentType === 'application/xml' || contentType === 'text/plain') {
        let body = '';
        let bodySize = 0;
    
        req.on('data', (chunk) => {
          bodySize += chunk.length;
          if (bodySize > this.bodySizeLimit) {
            res.statusCode = 413;
            res.end(JSON.stringify("Request Entity Too Large"));
            req.destroy();
          } else {
            body += chunk;
          }
        });
    
        req.on('end', () => {
          if (res.statusCode !== 413) {
            try {
              if (contentType === 'application/json') {
                const data = JSON.parse(body);
                
                // Check if data is an array or a single object
                const records = Array.isArray(data) ? data : [data];
    
                // Start a transaction
                this.db.beginTransaction((err) => {
                  if (err) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    return;
                  }
    
                  // Helper function to handle record insertion
                  const insertRecord = (record, callback) => {
                    this.db.query(
                      'INSERT INTO user (name, city, school) VALUES (?, ?, ?)',
                      [record.name, record.city, record.school],
                      (err) => {
                        if (err) {
                          callback(err);
                        } else {
                          callback(null);
                        }
                      }
                    );
                  };
    
                  const insertionErrors = [];
    
                  // Insert each record in the array
                  const insertNextRecord = (index) => {
                    if (index < records.length) {
                      insertRecord(records[index], (err) => {
                        if (err) {
                          insertionErrors.push(err);
                        }
                        insertNextRecord(index + 1);
                      });
                    } else {
                      if (insertionErrors.length > 0) {
                        // Roll back the transaction if any insertion fails
                        this.db.rollback(() => {
                          res.statusCode = 500;
                          res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        });
                      } else {
                        // Commit the transaction if all insertions are successful
                        this.db.commit((err) => {
                          if (err) {
                            res.statusCode = 500;
                            res.end(JSON.stringify({ error: 'Internal Server Error' }));
                          } else {
                            res.statusCode = 201;
                            res.end(JSON.stringify({ message: 'Record(s) created' }));
                          }
                        });
                      }
                    }
                  };
    
                  insertNextRecord(0);
                });
              } 
            } catch (error) {
              res.statusCode = 400;
              res.end(JSON.stringify('Invalid JSON Data'));
            }
          }
        });
      } else {
        res.statusCode = 415;
        res.end(JSON.stringify({ error: 'Unsupported Media Type' }));
      }
    }
     else if (req.method === 'GET') {
      const urlParts = req.url.split('?'); // Split URL at the query string
      const id = parseInt(urlParts[0].split('/').pop(), 10); // Extract the ID from the URL
    
      if (!isNaN(id)) {
        // Check if the resource exists in the database
        this.db.query('SELECT * FROM user WHERE id = ?', [id], (err, rows) => {
          if (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
          } else if (rows.length === 0) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Resource not found' }));
          } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(rows[0])); // Assuming you return a single resource
          }
        });
      } else {
        if (urlParts[1]) {
          const queryParameters = new URLSearchParams(urlParts[1]);
          if (queryParameters.toString() === '') {
            this.db.query('SELECT * FROM user', (err, rows) => {
              if (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
              } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(rows));
              }
            });
          } else {
            const conditions = [];
            const values = [];
    
            for (const [key, value] of queryParameters.entries()) {
              conditions.push(`${key} = ?`);
              values.push(value);
            }
            const query = `SELECT * FROM user WHERE ${conditions.join(' AND ')}`;
            this.db.query(query, values, (err, rows) => {
              if (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
              } else if (rows.length === 0) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ message: 'No such records available' }));
              } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(rows));
              }
            });
          }
        } else {
          // Handle GET request without query parameters
          this.db.query('SELECT * FROM user', (err, rows) => {
            if (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Internal Server Error' }));
            } else {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(rows));
            }
          });
        }
      }
    }
     
    else if (req.method === 'PUT') { 
      const cType = req.headers['content-type'];
      const contentType = cType.toLowerCase();
    
      if (contentType === 'application/json' || contentType === 'application/xml' || contentType === 'text/plain') {
        let body = '';
        let bodySize = 0;
    
        req.on('data', (chunk) => {
          bodySize += chunk.length;
          if (bodySize > this.bodySizeLimit) {
            res.statusCode = 413;
            res.end(JSON.stringify('Request Entity Too Large'));
            req.destroy();
          } else {
            body += chunk;
          }
        });
    
        req.on('end', () => {
          if (res.statusCode !== 413) {
            try {
              if (contentType === 'application/json') {
                const data = JSON.parse(body);
                const id = data.id; 
    
                if (isNaN(id)) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Invalid ID' }));
                  return;
                }
    
                // Check if the resource exists in the database
                this.db.query('SELECT * FROM user WHERE id = ?', [id], (err, rows) => {
                  if (err) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                  } else if (rows.length === 0) {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: 'Resource not found' }));
                  } else {
                    // The resource exists, proceed with the update
                    this.db.query(
                      'UPDATE user SET name = ?, city = ?, school = ? WHERE id = ?',
                      [data.name, data.city, data.school, id],
                      (err) => {
                        if (err) {
                          res.statusCode = 500;
                          res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        } else {
                          res.statusCode = 200;
                          res.end(JSON.stringify({ message: 'Record updated' }));
                        }
                      }
                    );
                  }
                });
              } 
            } catch (error) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON Data' }));
            }
          }
        });
      } else {
        res.statusCode = 415;
        res.end(JSON.stringify({ error: 'Unsupported Media Type' }));
      }
    }
    else if (req.method === 'DELETE') {
      const queryParams = new URLSearchParams(req.url.split('?')[1]);
      const idQueryParam = queryParams.get('id');
      const nameQueryParam = queryParams.get('name');
      const cityQueryParam = queryParams.get('city');
      const schoolQueryParam = queryParams.get('school');
    
      if (idQueryParam || nameQueryParam || cityQueryParam || schoolQueryParam) {
        const conditions = [];
        const values = [];
    
        if (idQueryParam) {
          conditions.push('id = ?');
          values.push(parseInt(idQueryParam, 10));
        }
        if (nameQueryParam) {
          conditions.push('name = ?');
          values.push(nameQueryParam);
        }
        if (cityQueryParam) {
          conditions.push('city = ?');
          values.push(cityQueryParam);
        }
        if (schoolQueryParam) {
          conditions.push('school = ?');
          values.push(schoolQueryParam);
        }
    
        const whereClause = conditions.join(' AND ');
    
        if (whereClause) {
          this.db.query('SELECT id FROM user WHERE ' + whereClause, values, (err, rows) => {
            if (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Internal Server Error' }));
            } else if (rows.length === 0) {
              // No records match the specified conditions, respond with 404
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Resource not found' }));
            } else {
              // Records exist, proceed with the delete
              this.db.query('DELETE FROM user WHERE ' + whereClause, values, (err) => {
                if (err) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Internal Server Error' }));
                } else {
                  res.statusCode = 200;
                  res.end(JSON.stringify({ message: 'Record(s) deleted' }));
                }
              });
            }
          });
        }
      } else {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid or missing parameters in query' }));
      }
    } else {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
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