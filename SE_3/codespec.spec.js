const ArrayStats = require('./avg2'); 

describe('ArrayStats', function () {
    let myArray;

    beforeEach(function () {
        myArray = new ArrayStats(7, 11, 5, 14);
    });

    it('should calculate the average of elements', function () {
        const average = myArray.average();
        expect(average).toBeCloseTo(9.25, 2); 
    });

    it('should calculate the standard deviation', function () {
        myArray.average(); 
        const stdev = myArray.stdev();
        expect(stdev).toBeCloseTo(4.031,2); 
    });
  
    it('avgVal and stdevVal properties should be read-only', function () {
        myArray.avgVal = 42;
        myArray.stdevVal = 42;
        expect(myArray.avgVal).not.toBe(42);
        expect(myArray.stdevVal).not.toBe(42);
    });

    it('should compute average as NaN for an empty array', function () {
      const emptyArray = new ArrayStats();
      const average = emptyArray.average();
      expect(isNaN(average)).toBe(true);
    });

  it('should compute standard deviation as NaN for an empty array', function () {
      const emptyArray = new ArrayStats();
      const stdev = emptyArray.stdev();
      expect(isNaN(stdev)).toBe(true);
    });

    it('should compute average as the single element value', function () {
      const myArray = new ArrayStats([42]);
      const average = myArray.average();
      expect(average).toBe(42);
  });
  
  it('should compute standard deviation as 0 for a single element array', function () {
      const myArray = new ArrayStats([42]);
      const stdev = myArray.stdev();
      expect(stdev).toBe(0);
  });

  it('should compute average for an array with negative numbers', function () {
    const negativeArray = new ArrayStats(-10, -20, -30, -40);
    const average = negativeArray.average();
    expect(average).toBe(-25);
  });

  it('should compute standard deviation for an array with negative numbers', function () {
    const negativeArray = new ArrayStats(-10, -20, -30, -40);
    const stdev = negativeArray.stdev();
    expect(stdev).toBeCloseTo(12.909); 
  });

  it('should compute average as NaN for an array with non-numeric values', function () {
    const nonNumericArray = new ArrayStats('apple', 'banana', 'cherry');
    const average = nonNumericArray.average();
    expect(isNaN(average)).toBe(true);
});

it('should compute standard deviation as NaN for an array with non-numeric values', function () {
    const nonNumericArray = new ArrayStats('apple', 'banana', 'cherry');
    const stdev = nonNumericArray.stdev();
    expect(isNaN(stdev)).toBe(true);
});

it('should compute average for an array with zero variance', function () {
  const zeroVarianceArray = new ArrayStats(5, 5, 5, 5);
  const average = zeroVarianceArray.average();
  expect(average).toBe(5);
});

it('should compute standard deviation as 0 for an array with zero variance', function () {
  const zeroVarianceArray = new ArrayStats(5, 5, 5, 5);
  const stdev = zeroVarianceArray.stdev();
  expect(stdev).toBe(0);
});

});