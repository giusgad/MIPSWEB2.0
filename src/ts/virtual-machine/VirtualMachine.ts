import {assembledLine, Assembler} from "./Assembler.js";
import {CPU} from "./CPU.js";
import {word} from "./Memory";

export class VirtualMachine {

    private state: "edit" | "execute";
    private cpu: CPU;

    private assembledLines?: assembledLine[];
    private assembledLinesIndex: number = 0;
    private nextInstructionLineNumber?: number;

    constructor() {
        this.cpu = new CPU();
        this.state = "edit";
    }

    getState() {
        return this.state;
    }

    assemble(program: string) {
        const assembler = new Assembler();
        assembler.assemble(program, this.cpu);
        this.assembledLines = assembler.getAssembledLines();
        if (this.assembledLines.length > 0) {
            this.nextInstructionLineNumber = this.assembledLines[this.assembledLinesIndex].lineNumber;
        }
        this.state = "execute";
    }

    stop() {
        this.assembledLines = [];
        this.assembledLinesIndex = 0;
        this.nextInstructionLineNumber = undefined;
        this.cpu.clear();
        this.state = "edit";
    }

    step() {
        if (this.assembledLinesIndex >= this.assembledLines!.length) return;
        this.cpu.step();
        this.assembledLinesIndex++;
        if (this.assembledLinesIndex >= this.assembledLines!.length) {
            this.nextInstructionLineNumber = undefined;
            return;
        }
        this.nextInstructionLineNumber = this.assembledLines![this.assembledLinesIndex].lineNumber;
    }

    run() {
        while (this.assembledLinesIndex < this.assembledLines!.length) {
            this.step();
        }
    }

    getRegisters(): ({ number?: word | undefined; name: string; value: word } | {})[] | undefined {
        const cpuRegisters = this.cpu.getRegisters();
        const registers = cpuRegisters?.registers;

        if (registers) {
            return [
                ...registers.map(register => ({ ...register })),
                { ...cpuRegisters.pc },
                { ...cpuRegisters.hi },
                { ...cpuRegisters.lo }
            ];
        } else {
            return undefined;
        }
    }

    getNextInstructionLineNumber() {
        return this.nextInstructionLineNumber;
    }

}