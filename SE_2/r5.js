const fs = require('fs');
const readline = require('readline');
const filePath = 'trained.csv';
//const filePath = 'r3.js';
//const filePath = '404.csv';
//const filePath = 'empty.csv';
const style = 'font-family: "Courier";';
const fileContent = fs.readFileSync(filePath, 'utf8');
  if (fileContent.trim() === '') {
    console.error('Given file is empty!!');
    process.exit(1); 
  }

//reading the CSV file
function readCSVFile(filePath, callback) {
  try {
    const fileExtension = filePath.split('.').pop().toLowerCase();
    if (fileExtension !== 'csv') {
      throw new Error('Given file is not a CSV!!');
    }
    if(!fs.existsSync(filePath)){
        throw new Error('Given file does not exist!!');
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading the file:', err);
        return;
      }
      callback(data);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

//printing the CSV rows
function displayCSVRows(data, style) {
  const rows = data.split('\n');
  rows.forEach((row) => {
    console.log(`%c${row}`, style);
  });
}

//Taking the user input
function getUserInput(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter any input: ', (userInput) => {
    rl.close();
    callback(userInput);
  });
}
// Main function
function main() {
  readCSVFile(filePath, (data) => {
    console.log('Displaying the CSV file contents:');
    displayCSVRows(data, style);
    getUserInput((userInput) => {
      console.log('User Input:', userInput);
    });
  });
}

main();
module.exports = { readCSVFile, displayCSVRows, getUserInput };