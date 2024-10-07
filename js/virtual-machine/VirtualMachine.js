import { Assembler } from "./Assembler.js";
export class VirtualMachine {
    constructor(cpu) {
        this.assembledLinesIndex = 0;
        this.cpu = cpu;
        this.assembler = new Assembler(cpu);
        this.isRunning = false;
        this.state = "edit";
    }
    assemble(program) {
        this.stop();
        this.assembledLines = this.assembler.assemble(program);
        if (this.assembledLines.length > 0) {
            this.nextInstructionLineNumber = this.assembledLines[this.assembledLinesIndex].lineNumber;
        }
        this.state = "execute";
    }
    run() {
        this.isRunning = true;
        while (this.isRunning && !this.cpu.isHalted()) {
            this.step();
        }
    }
    step() {
        if (!this.cpu.isHalted()) {
            this.cpu.execute();
            this.assembledLinesIndex++;
            if (this.assembledLinesIndex >= this.assembledLines.length) {
                this.nextInstructionLineNumber = undefined;
            }
            else {
                this.nextInstructionLineNumber = this.assembledLines[this.assembledLinesIndex].lineNumber;
            }
        }
        else {
            this.pause();
        }
    }
    pause() {
        this.isRunning = false;
    }
    stop() {
        this.pause();
        this.cpu.reset();
        this.nextInstructionLineNumber = undefined;
        this.assembledLinesIndex = 0;
        this.assembledLines = [];
        this.state = "edit";
    }
    getRegisters() {
        const registers = [];
        for (const register of this.cpu.getRegisters()) {
            registers.push({ name: register.name, number: register.number, value: register.value });
        }
        registers.push({ name: "pc", value: this.cpu.pc });
        registers.push({ name: "hi", value: this.cpu.hi });
        registers.push({ name: "lo", value: this.cpu.lo });
        return registers;
    }
    getMemory() {
        return Array.from(this.cpu.getMemory().entries()).map(([address, value]) => ({
            address,
            value
        }));
    }
}
