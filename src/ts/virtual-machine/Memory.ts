import {Word} from "./Utils.js";

export class Memory {

    private memory: Map<Word, Word> = new Map<Word, Word>();

    store(address: Word, value: Word) {
        this.memory.set(address, value);
    }

    fetch(address: Word) {
        return this.memory.get(address);
    }

    get() {
        const sortedKeys = Array.from(this.memory.keys()).sort((a, b) => a - b);
        const sortedMemory = new Map<Word, Word>();
        for (const key of sortedKeys) {
            sortedMemory.set(key, this.memory.get(key)!);
        }
        return sortedMemory;
    }

    reset() {
        this.memory.clear();
    }
}