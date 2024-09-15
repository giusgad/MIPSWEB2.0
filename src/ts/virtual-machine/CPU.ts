import {Memory, word} from "./Memory.js";
import {register, Registers} from "./Registers.js";
import {Instructions} from "./Instructions.js";
import {instruction} from "./instructionsSet.js";

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

    getPc() {
        return this.registers.pc;
    }

    getHi() {
        return this.registers.hi;
    }

    getLo() {
        return this.registers.lo;
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
                    let params = formatHandler.disassemble(code, instruction);
                    params = { ...params, pc: pc, hi: this.getHi(), lo: this.getLo() }
                    instruction.run!(this.getRegisters().registers!, params);
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