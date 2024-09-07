import {assembledInstruction, Assembler} from "./Assembler.js";
import {CPU} from "./CPU.js";

export class VirtualMachine {

    private state: "edit" | "execute";
    private cpu: CPU;

    constructor() {
        this.cpu = new CPU();
        this.state = "edit";
    }

    getState() {
        return this.state;
    }

    getNextInstructionLineNumber() {
        return undefined;
    }

    assemble(program: string) {
        const assembler = new Assembler();
        assembler.assemble(program, this.cpu);
        this.state = "execute";
    }

    stop() {
        this.state = "edit";
    }

}