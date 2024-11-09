import { Binary } from "./Utils.js";
export class Memory {
    constructor() {
        this.memory = new Map();
    }
    storeWord(wordAddress, value) {
        let address = wordAddress.getValue();
        this.memory.set(address, value.getValue());
    }
    fetchWord(wordAddress) {
        const value = this.memory.get(wordAddress.getValue());
        if (value !== undefined) {
            return new Binary(value);
        }
        else {
            return new Binary();
        }
    }
    storeByte(wordAddress, value) {
        const address = wordAddress.getValue();
        const byteOffset = address % 4;
        const alignedAddress = address - byteOffset;
        const wordAlignedAddress = new Binary(alignedAddress);
        let word = this.fetchWord(wordAlignedAddress);
        const bitPosition = byteOffset * 8;
        word.setBits(value, bitPosition + 7, bitPosition);
        this.storeWord(new Binary(alignedAddress), word);
    }
    fetchByte(wordAddress) {
        return new Binary();
    }
    get() {
        const sortedKeys = Array.from(this.memory.keys()).sort((a, b) => a - b);
        const sortedMemory = new Map();
        for (const key of sortedKeys) {
            if (key % 4 !== 0)
                throw new Error("Memory error");
            sortedMemory.set(key, this.memory.get(key));
        }
        return sortedMemory;
    }
    reset() {
        this.memory.clear();
    }
}
