import { Binary } from "./Utils.js";
export class Memory {
    constructor() {
        this.memory = new Map();
    }
    storeWord(wordAddress, value) {
        let address = wordAddress.getValue();
        this.memory.set(address, value.getValue());
    }
    loadWord(wordAddress, signed = false) {
        const value = this.memory.get(wordAddress.getValue());
        if (value !== undefined) {
            return new Binary(value, 32, signed);
        }
        else {
            return new Binary(0, 32, true);
        }
    }
    storeByte(wordAddress, value) {
        const address = wordAddress.getValue();
        const byteOffset = address % 4;
        const alignedAddress = address - byteOffset;
        const wordAlignedAddress = new Binary(alignedAddress);
        let word = this.loadWord(wordAlignedAddress);
        const bitPosition = byteOffset * 8;
        word.setBits(value, bitPosition + 7, bitPosition);
        this.storeWord(new Binary(alignedAddress), word);
    }
    loadByte(wordAddress) {
        const address = wordAddress.getValue();
        const byteOffset = address % 4;
        const alignedAddress = address - byteOffset;
        const wordAlignedAddress = new Binary(alignedAddress);
        let word = this.loadWord(wordAlignedAddress);
        const bitPosition = byteOffset * 8;
        return word.getBits(bitPosition + 7, bitPosition, true);
    }
    get() {
        const sortedKeys = Array.from(this.memory.keys()).sort((a, b) => a - b);
        const sortedMemory = new Map();
        for (const key of sortedKeys) {
            if (key % 4 !== 0)
                throw new Error(`Memory error`);
            sortedMemory.set(key, this.memory.get(key));
        }
        return sortedMemory;
    }
    reset() {
        this.memory.clear();
    }
    getString(address) {
        let string = '';
        let byte = this.loadByte(address);
        while (byte.getValue() !== 0) {
            string += String.fromCharCode(byte.getValue());
            address.set(address.getValue() + 1);
            byte = this.loadByte(address);
        }
        return string;
    }
}
