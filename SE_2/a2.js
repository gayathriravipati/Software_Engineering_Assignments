const readline = require('readline');
const fs = require('fs');

class SpreadsheetCalculator {
  constructor(filePath) {
    this.filePath = filePath;
    this.validCellRanges = [];
  }

  readCSVFile(callback) {
    if (!this.filePath.endsWith('.csv')) {
      throw new Error('Not a CSV file!!');
    }
    if (!fs.existsSync(this.filePath)) {
      throw new Error('File does not exist!');
    }
    const fileStream = fs.createReadStream(this.filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity, // To handle Windows line endings
    });
    const data = [];
    rl.on('line', (line) => {
      data.push(line);
    });
    rl.on('close', () => {
      if (data.length === 0) {
        throw new Error('Given file is empty!');
      }
      // Calculate the number of columns based on the number of commas in the first line
      const numColumns = data[0].split(',').length;
      // Generate valid cell ranges
      const validCellRanges = [];
      for (let col = 0; col < numColumns; col++) {
        const startCell = String.fromCharCode(65 + col) + '1'; // A1, B1, C1, ...
        const endCell = String.fromCharCode(65 + col) + data.length; // A{lastRow}, B{lastRow}, C{lastRow}, ...
        validCellRanges.push(`${startCell}:${endCell}`);
      }
      callback({ data, validCellRanges });
    });
  }

  setvalidranges(validCellRanges){
    this.validCellRanges = validCellRanges;
    console.log(validCellRanges);
  }
  
  getCellCoordinates(cell) {
    const col = cell.charAt(0).toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0) + 1;
    const row = parseInt(cell.substring(1));
    return [col, row];
  }

  validateFormula(formula) {
    console.log(`Debugging: Formula before regex match: ${formula}`);
    if (!formula.startsWith('=')) {
      throw new Error('Invalid formula format. Please start with "=".');
    }
    const formulaRegex = /^=([A-Z]+)\(([A-G][1-9]\d{0,3}):([A-G][1-9]\d{0,3})\)$/;
    const match = formula.match(formulaRegex);

    console.log(`Debugging: Match: ${JSON.stringify(match)}`);

    if (!match || match[0] !== formula) {
      throw new Error('Invalid formula input. Please check the format.');
    }

    const operation = match[1];
    const firstCell = match[2];
    const lastCell = match[3];

    console.log(`Debugging: Operation: ${operation}, FirstCell: ${firstCell}, LastCell: ${lastCell}`);

    // Check if the formula operation is supported
    const supportedOperations = ['SUM', 'AVG', 'MAX', 'MIN', 'TZ', 'MUL'];
    if (!supportedOperations.includes(operation)) {
      throw new Error(`Unsupported operation: ${operation}`);
    }

    // Check if the cell range is within the validCellRanges
    if (!this.isCellRangeValid(firstCell, lastCell)) {
      throw new Error('Cell range is out of bounds.');
    }

    return { operation, firstCell, lastCell };
  }

isCellRangeValid(firstCell, lastCell) {
  console.log('testtttt');
  const [firstCellCol, firstCellRow] = this.getCellCoordinates(firstCell);
  const [lastCellCol, lastCellRow] = this.getCellCoordinates(lastCell);
  //console.log(`Debugging: firstCellCol: ${firstCellCol}, firstCellRow: ${firstCellRow}, lastCellCol: ${lastCellCol},lastCellRow: ${lastCellRow} `);
  //console.log(this.validCellRanges.length);
  for (let i=0; i<this.validCellRanges.length;i++) {
    //console.log(`Debugging: startCol: ${startCol}, endCol: ${endCol}, startRow: ${startRow},endRow: ${endRow} `);
    //console.log(`Debugging: firstCellCol: ${firstCellCol}, firstCellRow: ${firstCellRow}, lastCellCol: ${lastCellCol},lastCellRow: ${lastCellRow} `);
    const [start, end] = this.validCellRanges[i].split(':');
    const [startCol, startRow] = this.getCellCoordinates(start);
    const [endCol, endRow] = this.getCellCoordinates(end);
    //console.log(`Debugging: startCol: ${startCol}, endCol: ${endCol}, startRow: ${startRow},endRow: ${endRow} `);
    //console.log(`Debugging: firstCellCol: ${firstCellCol}, firstCellRow: ${firstCellRow}, lastCellCol: ${lastCellCol},lastCellRow: ${lastCellRow} `);
    if (
      firstCellCol >= startCol && firstCellCol <= endCol &&
      firstCellRow >= startRow && firstCellRow <= endRow &&
      lastCellCol >= startCol && lastCellCol <= endCol &&
      lastCellRow >= startRow && lastCellRow <= endRow
    ) {
      //console.log(`Debugging: startCol: ${startCol}, endCol: ${endCol}, startRow: ${startRow},endRow: ${endRow} `);
      //console.log(`Debugging: firstCellCol: ${firstCellCol}, firstCellRow: ${firstCellRow}, lastCellCol: ${lastCellCol},lastCellRow: ${lastCellRow} `);
      return true; // The cell range is valid
    }
  }
  return false; // The cell range is out of bounds
}


  evaluateFormula(data, formula) {
    const { operation, firstCell, lastCell } = this.validateFormula(formula);
    const values = this.getCellValues(data, firstCell, lastCell);
    switch (operation) {
      case 'SUM':
        return this.computeSumInRange(values);
      case 'AVG':
        return this.computeAverageInRange(values);
      case 'MAX':
        return this.computeMaxInRange(values);
      case 'MIN':
        return this.computeMinInRange(values);
      case 'TZ':
        return this.computeTotalZeros(values);
      case 'MUL':
        return this.computeMultiplicationInRange(values);
      case 'RET':
        return this.retrieveValuesInRange(data, firstCell, lastCell);
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }
  retrieveValuesInRange(data, startCell, lastCell) {
    const values = this.getCellValues(data, startCell, lastCell);
    console.log(`Values in range ${startCell}:${lastCell}:`);
    for (let i = 0; i < values.length; i++) {
      console.log(`Row ${i + 1}: ${values[i]}`);
    }
  }
  computeSumInRange(values) {
    let sum = 0;
    for (let cell of values) {
      const cellValue = parseFloat(cell);
      if (!isNaN(cellValue)) {
        sum += cellValue;
      }
    }
    if (sum < 0) {
      throw new Error('Sum is negative. Calculation not allowed.');
    }
    return sum;
  }
  
  computeAverageInRange(values) {
    let sum = 0;
    let count = 0;
  
    for (let cell of values) {
      const cellValue = parseFloat(cell);
      if (!isNaN(cellValue)) {
        sum += cellValue;
        count++;
      }
    }
    if (count === 0) {
      throw new Error('No valid values found. Cannot calculate average.');
    }
    const average = sum / count;
    if (average <1) {
      throw new Error('Average is zero or negative. Calculation not allowed.');
    }
    return average;
  }

  computeMultiplicationInRange(values) {
    let product = 1;
    for (let cell of values) {
      const cellValue = parseFloat(cell);
      if (!isNaN(cellValue)) {
        product *= cellValue;
      }
    }
    if (product <= 0) {
      throw new Error('Product is zero or negative. Calculation not allowed.');
    }
    return product;
  } 
  
  computeMaxInRange(values) {
    let max = Number.NEGATIVE_INFINITY;
    let hasValidValue = false;
    for (let cell of values) {
      const cellValue = parseFloat(cell);
      if (!isNaN(cellValue)) {
        max = Math.max(max, cellValue);
        hasValidValue = true;
      }
    }
    if (!hasValidValue) {
      throw new Error('No valid values found. Cannot calculate maximum.');
    }
    return max;
  }

  computeMinInRange(values) {
    let min = Number.POSITIVE_INFINITY;
    let hasValidValue = false;
    for (let cell of values) {
      const cellValue = parseFloat(cell);
      if (!isNaN(cellValue)) {
        min = Math.min(min, cellValue);
        hasValidValue = true;
      }
    }
    if (!hasValidValue) {
      throw new Error('No valid values found. Cannot calculate minimum.');
    }
    return min;
  }

  computeTotalZeros(values) {
    let zeroCount = 0;
    for (let cell of values) {
      if (cell === '0' || parseFloat(cell) === 0) {
        zeroCount++;
      }
    }
    if (zeroCount === 0) {
      throw new Error('No zeros found in the range.');
    }
    return zeroCount;
  }

  getCellValues(data, firstCell, lastCell) {
    const [startCol, startRow] = this.getCellCoordinates(firstCell);
    const [endCol, endRow] = this.getCellCoordinates(lastCell);
    const values = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cellValue = data[row - 1].split(',')[col - 1];
        const numericValue = parseFloat(cellValue);
  
        if (isNaN(numericValue)) {
          throw new Error('Non-numeric value found in the range.');
        }
  
        if (numericValue < 0) {
          throw new Error('Negative value found in the range.');
        }
  
        values.push(cellValue);
      }
    }
    return values;
  }
}

const filePath = 'trained.csv'; // Update with your file path
const calculator = new SpreadsheetCalculator(filePath);
let validCellRanges = [];
calculator.readCSVFile(({ data, validCellRanges }) => {
  console.log('Valid Cell Ranges:', validCellRanges.join(', '));
  console.log('Try asking for operations - RET, SUM, MUL, MAX, MIN, TZ', validCellRanges.join(', '));
  calculator.setvalidranges(validCellRanges);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter a formula of the format (e.g., =SUM(A1:A5)): ', (formula) => {
    try {
      const result = calculator.evaluateFormula(data, formula);
      console.log(`Result of formula ${formula}: ${result}`);
    } catch (error) {
      console.error(error.message);
    }
    rl.close();
  });
});

module.exports = SpreadsheetCalculator;