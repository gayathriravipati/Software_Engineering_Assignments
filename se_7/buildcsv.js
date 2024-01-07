const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const { createInterface } = require("readline");
let results = [];
let rowCount = 0;
let totalvalues = 0;
let spreadSheet = [];

function parseCSV(filename) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(filename).toLowerCase();
    if (ext !== ".csv") {
      reject(new Error("Given file is not a .csv file"));
      return;
    }
    if (!fs.existsSync(filename)) {
      reject(new Error("The file does not exist"));
      return;
    }

    fs.readFile(filename, "utf-8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        // Check for an empty CSV file
        if (data.trim() === "") {
          console.log("CSV file is empty");
          resolve([]); // Resolve with an empty array
          return;
        }

        console.log("Read data:", data); // Log the read data
        results = data.match(/(?:[^\s",]|"(?:\\.|[^"])*")+/g).map((item) => item.trim());
        console.log("Processed results:", results); // Log the processed results
        totalvalues = results.length;
        console.log("Total values:", totalvalues); // Log the total values
        resolve(results);
      }
    });
  });
}

class Bonder {
  constructor(builder) {
    console.log("building the spreadsheet using Bonder");
    this.builder = builder;
  }
  buildSpreadsheet() {
    results.forEach((cellValue) => {
      console.log("value to be sent " + cellValue);
      this.builder.parseCell(cellValue);
    });
    console.log(spreadSheet);
  }
}

class Builder {
  #findformulae;
  constructor() {
    console.log("In builder");
    this.cells = {};
    this.spreadSheet = [];
    //findformulae using a JavaScript Map
    this.#findformulae = new Map([
      ["SUM", (args) => args.reduce((a, b) => a + b, 0)],
      ["SUB", (args) => args.reduce((a, b) => a - b, 0)],
      ["AVERAGE", (args) => args.reduce((a, b) => a + b, 0) / args.length],
      ["MAX", (a,b) => Math.max(a,b)],
      ["MIN", (a,b) => Math.min(a,b)],
      ["COUNT", (args) => args.map((a) => (a, 1)).reduce((a, b) => a + b, 0)],
      [
        "IF",
        (condition,trueval,falseValue) => {
            console.log(condition,trueval,falseValue);
          if (condition) {
            return trueval;
          } else {
            return falseValue;
          }
        },
      ],
      ["MOD", (a,b) => a % b, 0],
      ["POWER", (a,b) => Math.pow(a, b), 0],
    ]);
  }

  parseCell(cell) {
    console.log("Received :", cell);
    if(cell.startsWith('"=') && cell.endsWith('"')){
        cell = cell.substring(1,cell.length-1);   
    }
    console.log(cell);
    if (cell.startsWith("=")) {   //checking to what formula does this cell matches to
      let calc,
        range = [];
        if(cell.startsWith("=IF")){
            calc = 'IF'
        }
        else{
            console.log("Type of formula to evaluate")
            calc = cell.split("=").pop().split("(")[0].toUpperCase(); //SUM
            console.log(calc)
        }
      if (cell.includes(":")) {
        range = cell.split("(").pop().split(")")[0].split(":"); //[A1,A100]
        console.log(calc, range);
        console.log("Evaluating the formuale and pushing it to the spreadsheet builder")
        spreadSheet.push(this.evaluateRangeFormula(calc, range));
      } else if (cell.includes(",")) {
        range = cell.split("(").pop().split(")")[0].split(","); 
        spreadSheet.push(this.evaluateifformula(calc, range));
      } else {
        console.log("Cell contains invalid formula");
        spreadSheet.push(0);
      }
    } else if (!isNaN(parseInt(cell))) {   //numeric value to be added for the spreadsheet
      spreadSheet.push(parseInt(cell));
    } else {
      // empty cell;
      spreadSheet.push(0);
    }
  }

  evaluateRangeFormula(calc, range) {
    const [col1, row1] = this.getColumnRow(range[0]); //[A,1]
    const [col2, row2] = this.getColumnRow(range[1]); //[B,1]
    const col1check = col1.charCodeAt(0) - 65; // A-0, B-1, etc.
    const col2check = col2.charCodeAt(0) - 65; // A-0, B-1, etc.
    
    // Ensure row1 and row2 are within the valid range
    if (row1 < 1 || row1 > totalvalues || row2 < 1 || row2 > totalvalues) {
      throw new Error("Row references exceeded range");
    }
  
    // Ensure column references are within the valid range
    if (col1check > totalvalues || col2check > totalvalues) {
      throw new Error("Column references exceeded range");
    }
  
    // Ensure the correct range order
    if (col1check > col2check || row1 > row2) {
      throw new Error("Column numbers should go from low to high");
    }
  
    const functionName = this.#findformulae.get(calc);
    let args = results.slice(col1check, col2check + 1).map(Number);
    const functionResult = functionName(args);
    return functionResult;
  }
  
  evaluateifformula(calc, range) {
    const findfunction = this.#findformulae.get(calc);
    console.log("inside condition func, calc = ", calc);
    if (calc == "IF") {
      let conditionCheck = range[0],
        trueValue = range[1],
        falseValue = range[2];
      const matches = conditionCheck.match(/([A-Z]\d+|[=<>]+|[A-Z]\d+)/g);
      if (matches) {
        console.log("Matched");
        let condition;
        const [cell1, operator, cell2] = matches;
        console.log("Cell 1:", cell1);
        console.log("Operator:", operator);
        console.log("Cell 2:", cell2);
        const [c1, r1] = this.getColumnRow(cell1); //start cell range
        const [c2, r2] = this.getColumnRow(cell2); //end cell range
        const c1val = c1.charCodeAt(0) - 65; 
        const c2val = c2.charCodeAt(0) - 65; 
        console.log(c1,c2,r1,r2,c1val,c2val);
        if (operator === "=") {
          condition = (c1val === c2val);
        } else if (operator === "<") {
          condition = (c1val < c2val);
        } else if (operator === ">") {
          condition = (c1val > c2val);
        } else if (operator === ">=") {
          condition = (c1val >= c2val);
        } else if (operator === "<=") {
          condition = (c1val <= c2val);
        } else if (operator === "!=") {
          condition = (c1val != c2val);
        } else {
          throw new Error("IF condition wrongly specified");
        }
        console.log(condition);
        const functionResult = findfunction(condition, trueValue, falseValue);
        console.log(functionResult);
        return parseInt(functionResult);
      } else {
        console.log("Invalid formula format");
      }
    } else {
      let cellValue = range[0], opValue = range[1],c1val, temp;
      console.log(cellValue, opValue);
      if (!isNaN(opValue)){
        console.log("Number");
        const [col, row] = this.getColumnRow(cellValue); 
        c1val = col.charCodeAt(0) - 65; 
        temp = opValue;
        console.log(results[c1val],temp);
      }
      else{
        const [c1, r1] = this.getColumnRow(cellValue); 
        c1val = c1.charCodeAt(0) - 65; 
        const [c2, r2] = this.getColumnRow(opValue); 
        const c2val = c2.charCodeAt(0) - 65; 
        console.log(results[c1val],results[c2val]);
        temp = results[c2val];
      }
      const functionResult = findfunction(results[c1val], temp);
      return functionResult;
    }
  }

   getColumnRow(cell) {
    const set = cell.split(/(\d+)/); 
    const col = set[0].toUpperCase(); 
    const row = parseInt(set[1]); 
    return [col, row]; 
  }
}

parseCSV("data.csv")
  .then((results) => {
    const builder = new Builder();
    const bonder = new Bonder(builder);
    bonder.buildSpreadsheet(results);
  })
  .catch((err) => console.error(err));

  module.exports = {
    Builder,
    Bonder,
    parseCSV
};