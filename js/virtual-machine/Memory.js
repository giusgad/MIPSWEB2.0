export class Memory {
    constructor() {
        this.memory = new Map();
    }
    store(address, value) {
        this.memory.set(address, value);
    }
    fetch(address) {
        const word = this.memory.get(address);
        if (word !== undefined) {
            return word;
        }
        else {
            return 0x00000000;
        }
    }
    get() {
        const sortedKeys = Array.from(this.memory.keys()).sort((a, b) => a - b);
        const sortedMemory = new Map();
        for (const key of sortedKeys) {
            sortedMemory.set(key, this.memory.get(key));
        }
        return sortedMemory;
    }
    reset() {
        this.memory.clear();
    }
}
