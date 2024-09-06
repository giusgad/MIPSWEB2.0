import {assembledInstruction, Assembler} from "./Assembler.js";
import {CPU} from "./CPU.js";

export class VirtualMachine {

    private state: "edit" | "execute";
    private cpu: CPU;
    private assembledInstructions?: assembledInstruction[];
    private nextInstructionLineNumber?: number;

    constructor() {
        this.cpu = new CPU();
        this.state = "edit";
    }

    getState() {
        return this.state;
    }

    getNextInstructionLineNumber() {
        return this.nextInstructionLineNumber;
    }

    assemble(program: string) {
        const assembler = new Assembler();
        this.assembledInstructions = assembler.assemble(program, this.cpu.getMemory(), this.cpu.getRegisters());
        if (this.assembledInstructions.length > 0) {
            this.nextInstructionLineNumber = this.assembledInstructions[0].lineNumber;
        }
        this.state = "execute";
    }

    stop() {
        this.state = "edit";
    }

}