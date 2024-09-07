export type word = number;

export class Memory {

    private memory: Map<word, word> = new Map<word, word>();

    clear() {
        this.memory.clear();
    }

    store(address: word, value: word) {
        this.memory.set(address, value);
    }

    fetch(address: word) {
        return this.memory.get(address);
    }

    get() {
        const sortedKeys = Array.from(this.memory.keys()).sort((a, b) => a - b);
        const sortedMemory = new Map<word, word>();
        for (const key of sortedKeys) {
            sortedMemory.set(key, this.memory.get(key)!);
        }
        return sortedMemory;
    }

}