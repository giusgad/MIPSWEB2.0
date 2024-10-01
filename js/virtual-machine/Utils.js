export class Utils {
    static getBits(word, to, from) {
        if (to < from || to > 31 || from < 0) {
            throw new Error(`Invalid parameters: 'from' (${from}) and 'to' (${to}) must be within valid range.`);
        }
        const numBits = to - from + 1;
        return (word >>> from) & ((1 << numBits) - 1);
    }
    static setBits(word, bits, to, from) {
        if (to < from || to > 31 || from < 0) {
            throw new Error(`Invalid parameters: 'from' (${from}) and 'to' (${to}) must be within valid range.`);
        }
        const numBits = to - from + 1;
        const maxBitsValue = (1 << numBits) - 1; // Valore massimo rappresentabile con 'numBits' bit
        if (bits > maxBitsValue) {
            throw new Error(`Bits value (${bits}) exceeds maximum (${maxBitsValue}) for the range from ${from} to ${to}.`);
        }
        const mask = ((1 << numBits) - 1) << from;
        word &= ~mask; // Resetta i bit nel range specificato
        word |= (bits << from) & mask; // Imposta i nuovi bit
        // Forza `word` a essere trattato come unsigned a 32 bit.
        return word >>> 0; // Il `>>> 0` forza il numero a essere unsigned
    }
    static convertToHex(value) {
        return '0x' + value.toString(16).padStart(8, '0');
    }
    static convertToBasic(value, cpu) {
        const instruction = cpu.getInstructionByCode(value);
        if (instruction) {
            return instruction.basic;
        }
        else {
            return value;
        }
    }
    static convertToBinary(value) {
        return '0b' + value.toString(2).padStart(32, '0');
    }
    static toSigned(value) {
        return value > 0x7FFFFFFF ? value - 0x100000000 : value;
    }
    static toUnsigned(value) {
        return value >>> 0;
    }
    static asUnsigned(value, bits) {
        const mask = (1 << bits) - 1;
        return value & mask;
    }
    static asSigned(value, bits) {
        const mask = (1 << bits) - 1;
        value &= mask;
        const signBit = 1 << (bits - 1);
        return (value ^ signBit) - signBit;
    }
    static detectSignedOverflow(result) {
        return result > 0x7FFFFFFF || result < -0x80000000;
    }
    static detectUnsignedOverflow(result) {
        return result > 0xFFFFFFFF;
    }
}
