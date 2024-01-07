const request = require('supertest'); 
const Myserver = require('./server'); 
const bodySizeLimit = 1024 * 1024;

describe('Myserver API', () => {
  let server;

  it('should respond with a specific resource for a valid GET request with ID', (done) => {
    const validID = 5; 
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .get(`/${validID}`)
      .expect(200)
      .end((err, response) => {
        const responseBody = JSON.parse(response.text);
        expect(responseBody).toEqual(jasmine.objectContaining({ id: validID }));
        server.server.close();
        done();
      });
  });

  it('should respond with 404 Resource Not Found for a GET request with an invalid ID', (done) => {
    const invalidID = 999; 
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .get(`/${invalidID}`)
      .expect(404)
      .end((err, response) => {
        const responseBody = JSON.parse(response.text);
        expect(responseBody).toEqual(jasmine.objectContaining({ error: 'Resource not found' }));
        server.server.close();
        done();
      });
  });

  it('should respond with all resources for a valid GET request without ID', (done) => {
    server = new Myserver();
    server.start(3005);
    server.db.query('SELECT COUNT(*) AS total FROM user', (err, countResult) => {
      if (err) {
        done.fail(err);
      }
      const expectedCount = countResult[0].total;
      request(server.server)
        .get('/')
        .expect(200)
        .end((err, response) => {
          const responseBody = JSON.parse(response.text);
          const actualCount = responseBody.length;
          expect(actualCount).toEqual(expectedCount);
          server.server.close();
          done();
        });
    });
  });

  it('should respond with a single resource for a valid GET request with an ID parameter', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .get('/?id=5') //  'id=5'
      .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body[0]).toEqual({ id: 5, name: 'Mike', city: 'Miami', school: 'High School E' });
        server.server.close();
        done();
      });
  });

  it('should respond with all resources for a valid GET request without query parameters', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .get('/')
      .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
        server.server.close();
        done();
      });
  });
  
  it('should respond with filtered resources for a valid GET request with query parameters', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .get('/?name=Mike&school=High%20School%20E') // Include the query parameters
      .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0]).toEqual({ id: 5, name: 'Mike', city: 'Miami', school: 'High School E' });
        server.server.close();
        done();
      });
  });
  
  it('should respond with all resources for a valid GET request without query parameters', (done) => {
    server = new Myserver();
    server.start(3005);
    server.db.query('SELECT COUNT(*) AS total FROM user', (err, countResult) => {
      if (err) {
        server.server.close();
        done.fail(err);
        return;
      }
      const expectedCount = countResult[0].total;
      request(server.server)
        .get('/')
        .then((response) => {
          expect(response.statusCode).toBe(200);
          expect(response.body.length).toEqual(expectedCount);
          server.server.close();
          done();
        });
    });
  });

  it('should respond with a 201 status code for a valid POST request with a single record', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .post('/')
      .send({
        name: 'New User',
        city: 'New City',
        school: 'New School',
      })
      .set('Content-Type', 'application/json')
      .expect(201)
      .end((err, response) => {
        expect(response.body.message).toBe('Record(s) created');
        server.server.close();
        done();
      });
  });

  it('should respond with 413 Request Entity Too Large for a large POST request body', (done) => {
    const messageSize = bodySizeLimit + 1;
    const largePostData = {
      id: 145,
      name: 'x'.repeat(messageSize),
      city: 'Updated City',
      school: 'Updated School',
    };
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .put('/1')
      .set('Content-Type', 'application/json')
      .send(largePostData)
      .expect(413)
      .end((err, response) => {
        expect(JSON.parse(response.text)).toEqual('Request Entity Too Large');
        server.server.close();
        done();
      });
  });

  it('should respond with a 201 status code for a valid POST request with multiple records', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .post('/')
      .send([
        {
          name: 'User 1',
          city: 'City 1',
          school: 'School 1',
        },
        {
          name: 'User 2',
          city: 'City 2',
          school: 'School 2',
        },
      ])
      .set('Content-Type', 'application/json')
      .expect(201)
      .end((err, response) => {
        expect(response.body.message).toBe('Record(s) created');
        server.server.close();
        done();
      });
  });

  it('should respond with a 400 status code for an invalid JSON data in the POST request', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .post('/')
      .send('Invalid JSON')
      .set('Content-Type', 'application/json')
      .expect(400)
      .end((err, response) => {
        expect(response.body).toBe('Invalid JSON Data');
        server.server.close();
        done();
      });
  });

  it('should respond with 200 OK for a valid PUT request', (done) => {
    const validPutData = {
      id: 22,
      name: 'Updated Name',
      city: 'Updated City',
      school: 'Updated School',
    };
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .put('/1')
      .set('Content-Type', 'application/json')
      .send(validPutData)
      .expect(200)
      .end((err, response) => {
        expect(JSON.parse(response.text)).toEqual({ message: 'Record updated' });
        server.server.close();
        done();
      });
  });

  it('should respond with 400 Bad Request for invalid JSON data in PUT request', (done) => {
    const invalidPutData = 'Invalid JSON Data';
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .put('/1')
      .set('Content-Type', 'application/json')
      .send(invalidPutData)
      .expect(400)
      .end((err, response) => {
        expect(JSON.parse(response.text)).toEqual({ error: 'Invalid JSON Data' });
        server.server.close();
        done();
      });
  });

  it('should respond with 413 Request Entity Too Large for a large PUT request body', (done) => {
    const messageSize = bodySizeLimit + 1;
    const largePutData = {
      id: 1,
      name: 'x'.repeat(messageSize),
      city: 'Updated City',
      school: 'Updated School',
    };
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .put('/1')
      .set('Content-Type', 'application/json')
      .send(largePutData)
      .expect(413)
      .end((err, response) => {
        expect(JSON.parse(response.text)).toEqual('Request Entity Too Large');
        server.server.close();
        done();
      });
  });

  it('should respond with a 404 status code for a non-existing resource in the PUT request', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .put('/')
      .set('Content-Type', 'application/json')
      .send({ id: 999, name: 'New Name', city: 'New City', school: 'New School' })
      .expect(404)
      .end((err, response) => {
        expect(response.body.error).toBe('Resource not found');
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
      .end((err, response) => {
        expect(response.text).toEqual('"Request Entity Too Large"');
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
      .end((err, response) => {
        expect(response.text).toEqual('"Invalid JSON Data"');
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
      .end((err, response) => {
        expect(response.text).toEqual('"Invalid JSON Data"');
        server.server.close();
        done();
      });
  });

  it('should respond with a 200 status code for a valid DELETE request with an existing ID', (done) => {
    server = new Myserver();
    server.start(3005);
    const existingId = 70; // Replace with the ID of an existing record
    request(server.server)
      .delete(`/?id=${existingId}`)
      .expect(200)
      .end((err, response) => {
        expect(response.body.message).toBe('Record(s) deleted');
        server.server.close();
        done();
      });
  });

  it('should respond with a 400 status code for a DELETE request without an ID parameter', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .delete('/')
      .expect(400)
      .end((err, response) => {
        expect(response.body.error).toBe('Invalid or missing parameters in query');
        server.server.close();
        done();
      });
  });

  it('should respond with a 404 status code for a DELETE request with a non-existing ID', (done) => {
    server = new Myserver();
    server.start(3005);
    const nonExistingId = 999; 
    request(server.server)
      .delete(`/?id=${nonExistingId}`)
      .expect(404)
      .end((err, response) => {
        expect(response.body.error).toBe('Resource not found');
        server.server.close();
        done();
      });
  });

  it('should respond with a 405 status code for an unsupported DELETE request with invalid parameters', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .delete('/?invalidParam=123')
      .expect(405)
      .end((err, response) => {
        expect(response.body.error).toBe('Invalid or missing parameters in query');
        server.server.close();
        done();
      });
  });

  it('should respond with a 200 status code for a DELETE request with valid name, city, and school parameters', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .delete('/?name=haindu Name&city=LA City&school=Chaitanya')
      .expect(200)
      .end((err, response) => {
        const responseBody = JSON.parse(response.text); // Parse the JSON response
        expect(responseBody.message).toBe('Record(s) deleted');
        server.server.close();
        done();
      });
  });
  

  it('should respond with a 404 status code for a DELETE request with a combination of valid and invalid parameters', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .delete('/?name=Updated Name&city=Updated City&school=Invalid School')
      .expect(404)
      .end((err, response) => {
        expect(response.body.error).toBe('Resource not found');
        server.server.close();
        done();
      });
  });

  it('should respond with a 415 status code for a DELETE request with invalid content-type', (done) => {
    server = new Myserver();
    server.start(3005);
    request(server.server)
      .delete('/?name=Sarah &city=Seattle &school=High School F')
      .set('Content-Type', 'text/plain') // Set an invalid content-type
      .expect(415)
      .end((err, response) => {
        expect(response.body.error).toBe('Resource not found');
        server.server.close();
        done();
      });
  });
});
