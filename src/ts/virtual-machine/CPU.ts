import {Memory, word} from "./Memory.js";
import {register, Registers} from "./Registers.js";
import {instruction, Instructions} from "./Instructions.js";

export class CPU {

    private readonly memory: Memory;
    private readonly registers: Registers;

    constructor() {
        this.memory = new Memory();
        this.registers = new Registers();
    }

    getMemory() {
        return this.memory;
    }

    getRegisters() {
        return this.registers;
    }

    clear() {
        this.registers.clear();
        this.memory.clear();
    }

    step() {
        const pc: register | undefined = this.registers.pc;
        if (pc) {
            const code = this.memory.fetch(pc.value);
            if (code === undefined) return;

            let instruction: instruction | undefined = Instructions.get(code);

            if (instruction) {
                const formatHandler = Instructions.getFormat(instruction.format!);
                if (formatHandler) {
                    const params = formatHandler.disassemble(code, instruction);
                    instruction.run!(this.registers.registers!, params);
                    pc.value += 4;
                } else {
                    console.error('Unrecognized instruction format:', instruction.format);
                }
            } else {
                console.error('Unknown instruction code:', code);
            }

        }

    }

}