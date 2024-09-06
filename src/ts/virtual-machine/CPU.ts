import {Memory} from "./Memory.js";
import {Registers} from "./Registers.js";

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

}