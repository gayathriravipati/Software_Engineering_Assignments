const {readCSVFile, displayCSVRows, getUserInput } = require('./r5');
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000; 

// Jasmine test suite
describe('readCSVFile', () => {
  it('Throw an error if the given file has invalid extension', () => {
    const filePath = 'r3.js';
    try {
      readFile(filePath);
      fail('Expected readFile to throw an error');
    } catch (error) {
      console.error('Custom Error Message: Invalid Extension for the given file!!');
    }
  });

  it('Throw an error if file does not exists', () => {
    const filePath = '404.csv';
    try {
      readFile(filePath);
      fail('Expected readFile to throw an error');
    } catch (error) {
      console.error('Custom Error Message: Non existing CSV file');
    }
  });

  it('If the given CSV is empty then print the error', () => {
    const emptyCsv = 'empty.csv';
    try {
      readFile(filePath);
      fail('Error reading the CSV file: File is empty');
    } catch (error) {
      console.error('Error reading the CSV file: File is empty');
    }
  });

});