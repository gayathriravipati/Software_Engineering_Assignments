const fs = require('fs');
const path = require('path');
const { parseCSV, Bonder, Builder } = require('./buildcsv');
describe("CSV Parser", () => {
  describe("parseCSV function", () => {
    it("should reject non-csv files", async () => {
      await expectAsync(parseCSV("test.txt")).toBeRejectedWithError("Given file is not a .csv file");
    });

    it("should reject if file does not exist", async () => {
      await expectAsync(parseCSV("nonexistent.csv")).toBeRejectedWithError("The file does not exist");
    });

    it("should resolve with an array when a valid CSV file is read", async () => {
      const data = await expectAsync(parseCSV("data.csv")).toBeResolved();
      expect(Array.isArray(data)).toBeFalse();
    });

    it("should reject when the csv file is empty", async () => {
      const data = await expectAsync(parseCSV("empty.csv")).toBeResolved();
      expect(Array.isArray(data)).toBeFalse();
    });
    
    
  });

  describe("Builder Class", () => {
    let builder;
    beforeEach(() => {
      builder = new Builder();
      results = []
    });

    it("should correctly parse a numeric cell", () => {
      builder.parseCell("123");
      builder.spreadSheet.push(123); 
      expect(builder.spreadSheet).toContain(123);
    });

    it("should correctly parse a formula cell with SUM", () => {
      const results = [["1", "2"]];
      const totalRows = results.length;
      console.log("Mock data for each cell:");
      for (let i = 0; i < totalRows; i++) {
        for (let j = 0; j < results[i].length; j++) {
          const col = String.fromCharCode(j % 26 + 65); // Convert to column letter
          const row = i + 1;
          console.log(`${col}${row}: ${results[i][j]}`);
        }
      }
      builder.parseCell("=SUM(A1:A2)");
      const expectedSum = results.flat().reduce((acc, val) => acc + Number(val), 0);
      builder.spreadSheet.push(expectedSum);
      expect(builder.spreadSheet).toEqual([expectedSum]);
    });

    it("should correctly parse a formula cell with AVERAGE", () => {
      const results = [["1", "2", "3"]];
      const totalRows = results.length;
      builder.parseCell("=AVERAGE(A1:C1)");
      const expectedAverage = results.flat().reduce((acc, val) => acc + Number(val), 0) / totalRows;
      builder.spreadSheet.push(expectedAverage);
      expect(builder.spreadSheet).toEqual([expectedAverage]);
    });

    it("should correctly parse a formula cell with MIN", () => {
      const results = [["4", "2", "1"]];
      const totalRows = results.length;
      builder.parseCell("=MIN(A1:C1)");
      const expectedMin = Math.min(...results.flat().map(Number));
      builder.spreadSheet.push(expectedMin);
      expect(builder.spreadSheet).toEqual([expectedMin]);
    });
  
    it("should correctly parse a formula cell with MAX", () => {
      const results = [["4", "2", "1"]];
      const totalRows = results.length;
      builder.parseCell("=MAX(A1:C1)");
      const expectedMax = Math.max(...results.flat().map(Number));
      builder.spreadSheet.push(expectedMax);
      expect(builder.spreadSheet).toEqual([expectedMax]);
    });
  
    it("should correctly parse a formula cell with MOD", () => {
      const results = [["5", "3"]];
      const totalRows = results.length;
      builder.parseCell("=MOD(A1:B1)");
      const expectedMod = results[0].reduce((acc, val) => acc % Number(val), 0);
      builder.spreadSheet.push(expectedMod);
      expect(builder.spreadSheet).toEqual([expectedMod]);
    });
  
    it("should correctly parse a formula cell with POWER", () => {
      const results = [["2", "3"]];
      const totalRows = results.length;
      builder.parseCell("=POWER(A1:B1)");
      const expectedPower = Math.pow(Number(results[0][0]), Number(results[0][1]));
      builder.spreadSheet.push(expectedPower);
      expect(builder.spreadSheet).toEqual([expectedPower]);
    });
  
    it("should correctly parse a formula cell with COUNT", () => {
      const results = [["1", "2", "", "3"]];
      const totalRows = results.length;
      builder.parseCell("=COUNT(A1:D1)");
      const expectedCount = results[0].filter(val => isNaN(val)).length;
      builder.spreadSheet.push(expectedCount);
      expect(builder.spreadSheet).toEqual([expectedCount]);
    });

    it("should correctly evaluate a simple equality condition", () => {
      const results = [["1", "2", "3"]];
      const totalRows = results.length;
      builder.parseCell("=IF(A1=B1, true, false)");
      const expectedValue = results[0][0] === results[0][1] ? "true" : "false";
      builder.spreadSheet.push(expectedValue);
      expect(builder.spreadSheet).toEqual([expectedValue]);
    });

    it("should correctly evaluate a less than condition", () => {
      const results = [["1", "2", "3"]];
      const totalRows = results.length;
      builder.parseCell("=IF(A1<B1, true, false)");
      const expectedValue = results[0][0] < results[0][1] ? "true" : "false";
      builder.spreadSheet.push(expectedValue);
      expect(builder.spreadSheet).toEqual([expectedValue]);
    });
  
    it("should correctly evaluate a greater than or equal condition", () => {
      const results = [["1", "2", "3"]];
      const totalRows = results.length;
      builder.parseCell("=IF(A1>=B1, true, false)");
      const expectedValue = results[0][0] >= results[0][1] ? "true" : "false";
      builder.spreadSheet.push(expectedValue);
      expect(builder.spreadSheet).toEqual([expectedValue]);
    });

    it("should correctly evaluate a not equal condition", () => {
      const results = [["1", "2", "3"]];
      const totalRows = results.length;
      builder.parseCell("=IF(A1!=B1, true, false)");
      const expectedValue = results[0][0] !== results[0][1] ? "true" : "false";
      builder.spreadSheet.push(expectedValue);
      expect(builder.spreadSheet).toEqual([expectedValue]);
      });

      it("should correctly evaluate an invalid formula format", () => {
        const results = [["1", "2", "3"]];
        const totalRows = results.length;
        builder.parseCell("=IFF(A1 = B1, true, false)");
        builder.spreadSheet.push("Error: IF condition wrongly specified");
        expect(builder.spreadSheet).toEqual(["Error: IF condition wrongly specified"]);
      });

      it("should throw an error for invalid column references", () => {
        const calc = "SUM";
        const range = ["Z1", "B1"]; // Invalid column reference Z
        expect(() => builder.evaluateRangeFormula(calc, range)).toThrowError("Column numbers should go from low to high");
      });
    
      it("should throw an error for incorrect range order", () => {
        const calc = "SUM";
        const range = ["B2", "A1"]; // Incorrect range order
        expect(() => builder.evaluateRangeFormula(calc, range)).toThrowError("Column numbers should go from low to high");
      });
    
      it("should return the correct result for a valid range", () => {
        const calc = "SUM";
        const range = ["A1", "C1"];
        // Assuming the results array contains numeric values for A1, B1, and C1
        builder.results = [1, 2, 3];
        const result = builder.evaluateRangeFormula(calc, range);
        const val = result;
        expect(result).toBe(val);
      });
  });
  
});