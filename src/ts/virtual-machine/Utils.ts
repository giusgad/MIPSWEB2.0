export class Utils {
    static toHex(value: number, bits: number = 32): string {
        const hex = (value >>> 0)
            .toString(16)
            .padStart(Math.ceil(bits / 4), "0");
        return hex;
    }

    static toBinary(value: number, bits: number = 32): string {
        const binary = (value >>> 0).toString(2).padStart(bits, "0");

        const parts: string[] = [];
        for (let i = 0; i < bits; i += 8) {
            parts.push(binary.substring(i, i + 8));
        }

        return parts.join(" ");
    }

    static toAscii(value: number, bits: number): string[] {
        if (bits <= 0 || bits % 8 !== 0) {
            throw new Error(
                `The number of bits (${bits}) must be a positive multiple of 8.`,
            );
        }

        let ascii: string[] = [];

        for (let i = bits - 8; i >= 0; i -= 8) {
            const byte = (value >> i) & 0xff;
            const char = String.fromCharCode(byte);
            if (char) {
                ascii.push(char);
            }
        }

        return ascii;
    }

    static toSigned(value: number, bits: number): number {
        const min = -1 * Math.pow(2, bits - 1);
        const max = Math.pow(2, bits - 1) - 1;

        if (value < min || value > max) {
            throw new Error(
                `Value ${value} is out of range for signed ${bits}-bit representation. Expected between ${min} and ${max}.`,
            );
        }

        if (value >= 0) {
            return value;
        } else {
            return Math.pow(2, bits) + value;
        }
    }

    static fromSigned(value: number, bits: number): number {
        if (value >= Math.pow(2, bits - 1)) {
            return value - Math.pow(2, bits);
        } else {
            return value;
        }
    }

    static toUnsigned(value: number, bits: number): number {
        const min = 0;
        const max = Math.pow(2, bits) - 1;

        if (value < min || value > max) {
            throw new Error(
                `Value ${value} is out of range for unsigned ${bits}-bit representation. Expected between ${min} and ${max}.`,
            );
        }

        return value;
    }

    static asUnsignedValue(value: number): number {
        return value;
    }
}

export class Binary {
    private binary: number = 0;
    length: number;
    signed: boolean;

    constructor(value: number = 0, bits: number = 32, signed: boolean = false) {
        this.length = bits;
        this.signed = signed;
        this.set(value);
    }

    set(value: number, signed: boolean = this.signed) {
        this.signed = signed;
        if (signed) {
            this.binary = Utils.toSigned(value, this.length);
        } else {
            this.binary = Utils.toUnsigned(value, this.length);
        }
    }

    getValue(): number {
        if (this.signed) {
            return Utils.fromSigned(this.binary, this.length);
        } else {
            return this.binary;
        }
    }

    getUnsignedValue(): number {
        return Utils.asUnsignedValue(this.binary);
    }

    /**@param from: number in [31-0]
     * @param to: number in [31-0] and has to be less than from, range is inclusive
     * @returns Binary representing bits from-to */
    getBits(from: number, to: number, signed: boolean = false): Binary {
        const bits = from - to + 1;
        const mask = ((1 << bits) - 1) << to;
        const extractedBits = (this.binary & mask) >>> to;
        if (signed) {
            return new Binary(
                Utils.fromSigned(extractedBits, bits),
                bits,
                true,
            );
        } else {
            return new Binary(extractedBits, bits);
        }
    }

    setBits(bits: Binary, from: number, to: number) {
        const mask = ((1 << (from - to + 1)) - 1) << to;
        this.binary =
            ((this.binary & ~mask) | ((bits.binary << to) & mask)) >>> 0;
    }

    getHex(): string {
        return Utils.toHex(this.binary, this.length);
    }

    getBinary(): string {
        return Utils.toBinary(this.binary, this.length);
    }

    getAscii(): string {
        const asciiArray = Utils.toAscii(this.binary, this.length);
        return asciiArray.join(" ");
    }

    copy(): Binary {
        return new Binary(this.getValue(), this.length, this.signed);
    }

    equals(binary: Binary): boolean {
        if (this.length !== binary.length) return false;
        if (this.signed !== binary.signed) return false;
        return this.binary === binary.binary;
    }
}
