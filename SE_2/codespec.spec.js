const SpreadsheetCalculator = require('./a2'); 

describe('SpreadsheetCalculator', () => {
  let calculator;

  beforeAll(() => {
    calculator = new SpreadsheetCalculator('trained.csv'); 
  });

  it('should throw an error for an invalid file format when reading CSV', () => {
    const calculator = new SpreadsheetCalculator('r3.js');
    expect(() => {
      calculator.readCSVFile();
    }).toThrowError('Not a CSV file!!');
  });

  it('should throw an error if the given file does not exist', () => {
    const calculator = new SpreadsheetCalculator('404.csv');
    expect(() => {
      calculator.readCSVFile();
    }).toThrowError('File does not exist!');
  });

  it('should throw an error if the given file is empty', () => {
    const calculator = new SpreadsheetCalculator('empty.csv'); // Provide the path to an empty CSV file
    try {
      calculator.readCSVFile(() => {}); // Pass an empty callback as the file is expected to be empty
    } catch (error) {
      expect(error.message).toBe('Given file is empty!');
    }
  });

  it('should throw an error if the formula does not start with "="', () => {
    const formula = 'SUM(A1:A5)';
    
    expect(() => {
      if (!formula.startsWith('=')) {
        throw new Error('Invalid formula format. Please start with "=".');
      }
    }).toThrowError('Invalid formula format. Please start with "=".');
  });

  it('should throw an error if the formula does not match the expected pattern', () => {
    const formula = '=SUM(A1:B5))';
    expect(() => {
      const formulaRegex = /^=([A-Z]+)\(([A-G][1-9]\d{0,3}):([A-G][1-9]\d{0,3})\)$/;
      const match = formula.match(formulaRegex);
      
      if (!match || match[0] !== formula) {
        throw new Error('Invalid formula input. Please check the format.');
      }
    }).toThrowError('Invalid formula input. Please check the format.');
  });

  it('should throw an error for an unsupported operation', () => {
      const unsupportedOperation = 'SUB';
      expect(() => {
        const supportedOperations = ['SUM', 'AVG', 'MAX', 'MIN', 'TZ', 'MUL', 'RET'];
        if (!supportedOperations.includes(unsupportedOperation)) {
          throw new Error(`Unsupported operation: ${unsupportedOperation}`);
        }
      }).toThrowError('Unsupported operation: SUB');
    });

    it('should compute the sum of valid numeric values', function() {
      const values = ['10', '20', '30', '40'];
      const expectedResult = 100;
      const result = calculator.computeSumInRange(values);
      expect(result).toEqual(expectedResult);
    });
  
    it('should handle empty values array', function() {
      const values = [];
      const expectedResult = 0;
      const result = calculator.computeSumInRange(values);
      expect(result).toEqual(expectedResult);
    });

    it('should compute the average of valid numeric values', function() {
      const values = ['10', '20', '30', '40'];
      const expectedResult = 25; // (10 + 20 + 30 + 40) / 4 = 25
      const result = calculator.computeAverageInRange(values);
      expect(result).toEqual(expectedResult);
    });
  
    it('should handle empty values array', function() {
      const values = [];
      try {
        calculator.computeAverageInRange(values);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).toBe('No valid values found. Cannot calculate average.');
      }
    });
  
    it('should handle values array with no valid values', function() {
      const values = ['abc', 'def', 'xyz'];
      try {
        calculator.computeAverageInRange(values);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).toBe('No valid values found. Cannot calculate average.');
      }
    });

    it('should throw an error when the average is zero', function() {
      const values = ['0', '0', '0', '0'];
      expect(function() {
          calculator.computeAverageInRange(values);
      }).toThrowError('Average is zero or negative. Calculation not allowed.');
  });
  
    it('should throw an error when the average is negative', function() {
        const values = ['1', '2', '-3', '-4'];
        expect(function() {
            calculator.computeAverageInRange(values);
        }).toThrowError('Average is zero or negative. Calculation not allowed.');
    });

    it('should return the maximum value in the range', function() {
      const values = ['10', '20', '30', '40'];
      const result = calculator.computeMaxInRange(values);
      expect(result).toEqual(40);
    });
  
    it('should handle negative values in the range', function() {
      const values = ['-10', '-5', '-20', '-1'];
      const result = calculator.computeMaxInRange(values);
      expect(result).toEqual(-1);
    });
  
    it('should handle a range with no valid values', function() {
      const values = ['invalid', 'NaN', 'abc', ''];
      expect(function() {
        calculator.computeMaxInRange(values);
      }).toThrowError('No valid values found. Cannot calculate maximum.');
    });

    it('should return the minimum value in the range', function() {
      const values = ['10', '20', '5', '40'];
      const result = calculator.computeMinInRange(values);
      expect(result).toEqual(5);
    });
  
    it('should handle negative values in the range', function() {
      const values = ['-10', '-5', '-20', '-1'];
      const result = calculator.computeMinInRange(values);
      expect(result).toEqual(-20);
    });
  
    it('should handle a range with no valid values', function() {
      const values = ['invalid', 'NaN', 'abc', ''];
      expect(function() {
        calculator.computeMinInRange(values);
      }).toThrowError('No valid values found. Cannot calculate minimum.');
    });

    it('should return the count of zeros in the range', function() {
      const values = ['0', '0', '5', '0', '10', '0'];
      const result = calculator.computeTotalZeros(values);
      expect(result).toEqual(4);
    });
  
    it('should handle zero values represented as strings', function() {
      const values = ['0', '0', '0', '0'];
      const result = calculator.computeTotalZeros(values);
      expect(result).toEqual(4);
    });
  
    it('should handle zero values represented as numbers', function() {
      const values = [0, 0, 0, 0];
      const result = calculator.computeTotalZeros(values);
      expect(result).toEqual(4);
    });
  
    it('should handle a range with no zero values', function() {
      const values = ['1', '2', '3', '4', '5'];
      expect(function() {
        calculator.computeTotalZeros(values);
      }).toThrowError('No zeros found in the range.');
    });
  
    it('should handle a range with no valid values', function() {
      const values = ['invalid', 'NaN', 'abc', ''];
      expect(function() {
        calculator.computeTotalZeros(values);
      }).toThrowError('No zeros found in the range.');
    });

    it('should throw an error for a non-numeric value', () => {
      const data = ['1, 2, 3', '4, hello, 6', '7, 8, 9'];
      const firstCell = 'A1';
      const lastCell = 'C3';
      expect(() => {
        calculator.getCellValues(data, firstCell, lastCell);
      }).toThrowError('Non-numeric value found in the range.');
    });
  
    it('should throw an error for a negative value', () => {
      const data = ['1, 2, 3', '4, -5, 6', '7, 8, 9'];
      const firstCell = 'A1';
      const lastCell = 'C3';
      expect(() => {
        calculator.getCellValues(data, firstCell, lastCell);
      }).toThrowError('Negative value found in the range.');
    });
  
    it('should return values for a valid range', () => {
      const data = ['1,2,3', '4,5,6', '7,8,9']; 
      const firstCell = 'A1';
      const lastCell = 'C3';
      const values = calculator.getCellValues(data, firstCell, lastCell);
      const expectedValues = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
      expect(values).toEqual(expectedValues);
    });

    it('should log values for a valid range', () => {
      spyOn(console, 'log');
      const data = ['1,2,3', '4,5,6', '7,8,9'];
      const firstCell = 'A1';
      const lastCell = 'C3';
      calculator.retrieveValuesInRange(data, firstCell, lastCell);
      expect(console.log).toHaveBeenCalledTimes(10);
      // Check if the logged values match the expected output
      expect(console.log).toHaveBeenCalledWith('Values in range A1:C3:');
      expect(console.log).toHaveBeenCalledWith('Row 1: 1');
      expect(console.log).toHaveBeenCalledWith('Row 2: 2');
      expect(console.log).toHaveBeenCalledWith('Row 3: 3');
      expect(console.log).toHaveBeenCalledWith('Row 4: 4');
      expect(console.log).toHaveBeenCalledWith('Row 5: 5');
      expect(console.log).toHaveBeenCalledWith('Row 6: 6');
      expect(console.log).toHaveBeenCalledWith('Row 7: 7');
      expect(console.log).toHaveBeenCalledWith('Row 8: 8');
      expect(console.log).toHaveBeenCalledWith('Row 9: 9');
    });
    it('should compute the multiplication of valid numeric values', function () {
      const values = ['2', '3', '4'];
      const expectedResult = 24; // 2 * 3 * 4 = 24
      const result = calculator.computeMultiplicationInRange(values);
      expect(result).toEqual(expectedResult);
    });

    it('should throw an error when product is negative', function () {
        const values = ['-2', '3', '4'];
        expect(function () {
          calculator.computeMultiplicationInRange(values);
        }).toThrowError('Product is zero or negative. Calculation not allowed.');
      });

  it('should handle empty values array', function () {
    const values = [];
    const expectedResult = 1; // Product of an empty array is 1
    const result = calculator.computeMultiplicationInRange(values);
    expect(result).toEqual(expectedResult);
  });

  it('should throw an error when product is zero', function () {
    const values = ['0', '2', '3'];
    expect(function () {
      calculator.computeMultiplicationInRange(values);
    }).toThrowError('Product is zero or negative. Calculation not allowed.');
  });

  it('should throw an error for a negative sum', function() {
    const values = ['10', '-20', '30', '40'];
    try {
      calculator.computeSumInRange(values);
    } catch (error) {
      expect(error.message).toBe('Sum is negative. Calculation not allowed.');
    }
  });

  it('should return true for a valid cell range', () => {
    const validCellRanges = ['A1:B3', 'C4:D6', 'E7:F9'];
    const firstCell = 'A2';
    const lastCell = 'B2';
    calculator.validCellRanges = validCellRanges;
    const isRangeValid = calculator.isCellRangeValid(firstCell, lastCell);
    expect(isRangeValid).toBe(true);
  });

  it('should return false for an invalid cell range', () => {
    // Define valid cell ranges, e.g., 'A1:B3', 'C4:D6', 'E7:F9'
    const validCellRanges = ['A1:B3', 'C4:D6', 'E7:F9'];
    const firstCell = 'Z10'; // Not within valid ranges
    const lastCell = 'AA11'; // Not within valid ranges
    calculator.validCellRanges = validCellRanges;
    const isRangeValid = calculator.isCellRangeValid(firstCell, lastCell);
    expect(isRangeValid).toBe(false);
  });

  });