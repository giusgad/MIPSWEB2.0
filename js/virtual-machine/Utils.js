export class Utils {
    static toHex(value, bits = 32) {
        const hex = (value >>> 0).toString(16).padStart(Math.ceil(bits / 4), '0');
        return '0x' + hex;
    }
    static toBinary(value, bits = 32) {
        const binary = (value >>> 0).toString(2).padStart(bits, '0');
        return binary;
    }
    static toAscii(value, bits) {
        if (bits <= 0 || bits % 8 !== 0) {
            throw new Error(`The number of bits (${bits}) must be a positive multiple of 8.`);
        }
        let ascii = [];
        for (let i = bits - 8; i >= 0; i -= 8) {
            const byte = (value >> i) & 0xFF;
            const char = String.fromCharCode(byte);
            if (char) {
                ascii.push(char);
            }
        }
        return ascii;
    }
    static toSigned(value, bits) {
        const min = -1 * Math.pow(2, bits - 1);
        const max = Math.pow(2, bits - 1) - 1;
        if (value < min || value > max) {
            throw new Error(`Value ${value} is out of range for signed ${bits}-bit representation. Expected between ${min} and ${max}.`);
        }
        if (value >= 0) {
            return value;
        }
        else {
            return Math.pow(2, bits) + value;
        }
    }
    static fromSigned(value, bits) {
        if (value >= Math.pow(2, bits - 1)) {
            return value - Math.pow(2, bits);
        }
        else {
            return value;
        }
    }
    static toUnsigned(value, bits) {
        const min = 0;
        const max = Math.pow(2, bits) - 1;
        if (value < min || value > max) {
            throw new Error(`Value ${value} is out of range for unsigned ${bits}-bit representation. Expected between ${min} and ${max}.`);
        }
        return value;
    }
}
export class Binary {
    constructor(value = 0, bits = 32, signed = false) {
        this.binary = 0;
        this.length = bits;
        this.signed = signed;
        this.set(value);
    }
    set(value, signed = this.signed) {
        this.signed = signed;
        if (signed) {
            this.binary = Utils.toSigned(value, this.length);
        }
        else {
            this.binary = Utils.toUnsigned(value, this.length);
        }
    }
    getValue() {
        if (this.signed) {
            return Utils.fromSigned(this.binary, this.length);
        }
        else {
            return this.binary;
        }
    }
    getBits(from, to, signed = false) {
        const bits = from - to + 1;
        const mask = ((1 << bits) - 1) << to;
        const extractedBits = (this.binary & mask) >>> to;
        if (signed) {
            return new Binary(Utils.fromSigned(extractedBits, bits), bits, true);
        }
        else {
            return new Binary(extractedBits, bits);
        }
    }
    setBits(bits, from, to) {
        const mask = ((1 << (from - to + 1)) - 1) << to;
        this.binary = ((this.binary & ~mask) | ((bits.binary << to) & mask)) >>> 0;
    }
    getHex() {
        return Utils.toHex(this.binary, this.length);
    }
    getBinary() {
        return Utils.toBinary(this.binary, this.length);
    }
    getAscii() {
        const asciiArray = Utils.toAscii(this.binary, this.length);
        return asciiArray.join(' ');
    }
    copy() {
        return new Binary(this.binary, this.length, this.signed);
    }
    equals(binary) {
        if (this.length !== binary.length)
            return false;
        if (this.signed !== binary.signed)
            return false;
        return this.binary === binary.binary;
    }
}
