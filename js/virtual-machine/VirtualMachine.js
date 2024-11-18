import { Assembler } from "./Assembler.js";
export class VirtualMachine {
    constructor(cpu) {
        this.cpu = cpu;
        this.assembler = new Assembler(cpu);
        this.running = false;
    }
    assemble(program) {
        this.stop();
        this.assembler.assemble(program);
        this.nextInstructionLineNumber = this.assembler.addressLineMap.get(this.cpu.pc.getValue());
    }
    run() {
        this.running = true;
        while (this.running && !this.cpu.isHalted()) {
            this.step();
        }
    }
    step() {
        if (!this.cpu.isHalted() && this.nextInstructionLineNumber !== undefined) {
            this.cpu.execute();
            this.nextInstructionLineNumber = this.assembler.addressLineMap.get(this.cpu.pc.getValue());
        }
        else {
            this.pause();
        }
    }
    pause() {
        this.running = false;
    }
    stop() {
        this.pause();
        this.assembler.reset();
    }
    getRegisters() {
        const registers = [];
        for (const register of this.cpu.getRegisters()) {
            registers.push({ name: register.name, number: register.number, value: register.binary.getValue() });
        }
        registers.push({ name: "pc", value: this.cpu.pc.getValue() });
        registers.push({ name: "hi", value: this.cpu.hi.getValue() });
        registers.push({ name: "lo", value: this.cpu.lo.getValue() });
        return registers;
    }
    getMemory() {
        return Array.from(this.cpu.getMemory().entries()).map(([address, value]) => ({
            address,
            value,
            labels: []
        }));
    }
}
