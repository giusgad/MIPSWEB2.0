import {CPU} from "./CPU.js";

export type Word = number;

export class Utils {

    static getBits(word: Word, to: number, from: number): Word {
        if (to < from || to > 31 || from < 0) {
            throw new Error(`Invalid parameters: 'from' (${from}) and 'to' (${to}) must be within valid range.`);
        }

        const numBits = to - from + 1;

        return (word >>> from) & ((1 << numBits) - 1);
    }

    static setBits(word: Word, bits: Word, to: number, from: number): Word {
        if (to < from || to > 31 || from < 0) {
            throw new Error(`Invalid parameters: 'from' (${from}) and 'to' (${to}) must be within valid range.`);
        }

        const numBits = to - from + 1;

        const maxBitsValue = (1 << numBits) - 1;  // Valore massimo rappresentabile con 'numBits' bit
        if (bits > maxBitsValue) {
            throw new Error(`Bits value (${bits}) exceeds maximum (${maxBitsValue}) for the range from ${from} to ${to}.`);
        }

        const mask = ((1 << numBits) - 1) << from;

        word &= ~mask;

        word |= (bits << from) & mask;

        return word;
    }

    static convertToHex(value: number) {
        return '0x' + value.toString(16).padStart(8, '0');
    }

    static convertToBasic(value: number, cpu: CPU) {
        return cpu.getInstructionByCode(value)?.basic
    }

    static convertToBinary(value: number) {
        return '0b' + value.toString(2).padStart(32, '0');
    }

}