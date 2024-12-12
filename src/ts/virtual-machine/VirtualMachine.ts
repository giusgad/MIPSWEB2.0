import {CPU} from "./CPU.js";
import {Assembler} from "./Assembler.js";
import {Console} from "./Console.js";

export class VirtualMachine {

    cpu: CPU;
    assembler: Assembler;
    running: boolean;

    nextInstructionLineNumber?: number;

    lastChangedRegister?: string;

    console: Console = new Console();

    constructor(cpu: CPU) {
        this.cpu = cpu;
        this.assembler = new Assembler(cpu);
        this.running = false;
    }

    assemble(program: string) {
        try {
            this.assembler.assemble(program);
            this.nextInstructionLineNumber = this.assembler.addressLineMap.get(this.cpu.pc.getValue());
            //this.console.addLine("Assemble: operation completed successfully", "success");
        } catch (error) {
            // @ts-ignore
            this.console.addLine(`Assemble: ${error.message}`, "error");
            console.error(error);
        }
    }

    async step() {
        try {
            if (!this.cpu.isHalted() && this.nextInstructionLineNumber !== undefined) {
                await this.cpu.execute(this);
                this.nextInstructionLineNumber = this.assembler.addressLineMap.get(this.cpu.pc.getValue());
            } else {
                this.pause();
            }
        } catch (error) {
            // @ts-ignore
            this.console.addLine(`${error.message}`, "error");
            console.error(error);
            this.pause();
        }
    }

    pause() {
        this.running = false;
    }

    async stop() {
        await this.console.clear();
        this.lastChangedRegister = undefined;
        this.pause();
        this.assembler.reset();
        this.nextInstructionLineNumber = undefined;
    }

    getRegisters() {
        const registers = [];
        for (const register of this.cpu.getRegisters()) {
            registers.push({name: register.name, number: register.number, value: register.binary.getValue()});
        }
        registers.push({name: "pc", value: this.cpu.pc.getValue()});
        registers.push({name: "hi", value: this.cpu.hi.getValue()});
        registers.push({name: "lo", value: this.cpu.lo.getValue()});
        return registers;
    }

    getMemory() {
        return Array.from(this.cpu.getMemory().entries()).map(([address, value]): {address: number, value: number, tags: {name: string, type: string}[]} => ({
            address,
            value,
            tags: []
        }));
    }

}