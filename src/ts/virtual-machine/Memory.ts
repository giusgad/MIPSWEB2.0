import { Binary } from "./Utils.js";

enum Alignment {
    Word,
    Half,
    None,
}

/**returns the address in the given binary as a number.
 * throws an error if the required alignment check doesn't pass
 * or if the address is out of bounds*/
function getNumericAddress(
    addr: Binary,
    alignment: Alignment = Alignment.None,
): number {
    const minAddress = 0x400000;
    const maxAddress = 0xffffffff;
    const val = addr.getValue();
    if (val < minAddress) {
        throw new Error(
            `Invalid address: 0x${addr.getHex()}. Minimum address is 0x${minAddress.toString(16).toUpperCase()}.`,
        );
    } else if (val > maxAddress) {
        throw new Error(
            `Invalid address: 0x${addr.getHex()}. Maximum address is 0x${maxAddress.toString(16).toUpperCase()}.`,
        );
    }
    switch (alignment) {
        case Alignment.Word:
            if (val % 4 != 0) {
                throw new Error(
                    `Address: 0x${addr.getHex()} should be word-aligned.`,
                );
            }
        case Alignment.Half:
            if (val % 2 != 0) {
                throw new Error(
                    `Address: 0x${addr.getHex()} should be half-aligned.`,
                );
            }
        case Alignment.None:
            break;
    }
    return val;
}

export class Memory {
    private heapPointer = 0x10040000;
    private memory: Map<number, Binary> = new Map<number, Binary>();

    /**Inits the heap pointer to 0x10040000 or after the static data end if it exceeds 0x10040000*/
    initHeapPointer(staticDataEnd: number) {
        this.heapPointer = Math.max(staticDataEnd + 4, 0x10040000);
    }

    /**Returns the pointer to the available memory and increases the heap pointer*/
    allocate(bytes: number) {
        const pointer = this.heapPointer;
        let nextHeap = pointer + bytes;
        if (nextHeap % 4 !== 0) {
            nextHeap = nextHeap + (4 - (nextHeap % 4));
        }
        this.heapPointer = nextHeap;
        return pointer;
    }

    storeWord(wordAddress: Binary, value: Binary) {
        let address = getNumericAddress(wordAddress, Alignment.Word);
        this.memory.set(address, value);
    }

    loadWord(wordAddress: Binary, signed: boolean = false): Binary {
        const address = getNumericAddress(wordAddress, Alignment.Word);
        const value = this.memory.get(address);
        if (value !== undefined) {
            return new Binary(value.getValue(), 32, signed);
        } else {
            return new Binary(0, 32, true);
        }
    }

    storeByte(wordAddress: Binary, value: Binary) {
        const address = getNumericAddress(wordAddress);
        const byteOffset = address % 4;
        const alignedAddress = address - byteOffset;
        const wordAlignedAddress = new Binary(alignedAddress);
        let word: Binary = this.loadWord(wordAlignedAddress);

        const bitPosition = byteOffset * 8;

        word.setBits(value, bitPosition + 7, bitPosition);

        this.storeWord(new Binary(alignedAddress), word);
    }

    loadByte(wordAddress: Binary): Binary {
        const address = getNumericAddress(wordAddress);
        const byteOffset = address % 4;
        const alignedAddress = address - byteOffset;
        const wordAlignedAddress = new Binary(alignedAddress);
        let word: Binary = this.loadWord(wordAlignedAddress);

        const bitPosition = byteOffset * 8;

        return word.getBits(bitPosition + 7, bitPosition, true);
    }

    loadHalf(wordAddress: Binary): Binary {
        const address = getNumericAddress(wordAddress, Alignment.Half);
        const byteOffset = address % 4;

        const alignedAddress = address - byteOffset;
        const wordAlignedAddress = new Binary(alignedAddress);
        let word: Binary = this.loadWord(wordAlignedAddress);

        const bitPosition = byteOffset * 8; // 0 or 16

        return word.getBits(bitPosition + 15, bitPosition, true);
    }

    storeHalf(wordAddress: Binary, value: Binary) {
        const address = getNumericAddress(wordAddress, Alignment.Half);
        const byteOffset = address % 4;
        const alignedAddress = address - byteOffset;
        const wordAlignedAddress = new Binary(alignedAddress);
        let word: Binary = this.loadWord(wordAlignedAddress);

        const bitPosition = byteOffset * 8; // 0 or 16

        word.setBits(value, bitPosition + 15, bitPosition);

        this.storeWord(new Binary(alignedAddress), word);
    }

    get() {
        const sortedKeys = Array.from(this.memory.keys()).sort((a, b) => a - b);
        const sortedMemory = new Map<number, Binary>();

        for (const key of sortedKeys) {
            if (key % 4 !== 0) throw new Error(`Memory error`);
            sortedMemory.set(key, this.memory.get(key)!);
        }
        return sortedMemory;
    }

    reset() {
        this.memory.clear();
    }

    getString(address: Binary) {
        let string = "";
        let byte = this.loadByte(address);
        while (byte.getValue() !== 0) {
            string += String.fromCharCode(byte.getValue());
            address.set(address.getValue() + 1);
            byte = this.loadByte(address);
        }
        return string;
    }
}
