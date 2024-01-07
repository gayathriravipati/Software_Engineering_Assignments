class ArrayStats extends Array {
    constructor(...items) {
        super(...items);
        this.sum = 0; 
        this._avgVal = undefined; 
        this._stdevVal = undefined; 
    }

    average() {
        if (this.length === 0) {
            return NaN; 
        }

        this.sum = 0;
        for (let i = 0; i < this.length; i++) {
            this.sum += this[i];
        }
        this._avgVal = this.sum / this.length;
        return this._avgVal;
    }

    get avgVal() {
        return this._avgVal;
    }

    mappervariance(value) {
        return Math.pow(value - this._avgVal, 2);
    }

    stdev() {
        if (this.length === 0) {
            return NaN;
        }
        if (this.length === 1) {
            return 0; 
        }
        const avg = this.average();
        const varianceArray = this.map(this.mappervariance, this);
        let varianceSum = 0;
        for (let i = 0; i < varianceArray.length; i++) {
            varianceSum += varianceArray[i];
        }
        const varianceVal = varianceSum / (this.length - 1); 
        this._stdevVal = Math.sqrt(varianceVal);
        return this._stdevVal;
    }
    
    get stdevVal() {
        return this._stdevVal;
    }
}

const myArray = new ArrayStats(7, 11, 5, 14);
myArray.average();
console.log(myArray.average());
console.log(myArray.stdev());
module.exports = ArrayStats;