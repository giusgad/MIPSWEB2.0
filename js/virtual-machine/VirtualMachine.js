var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Assembler } from "./Assembler.js";
import { Console } from "./Console.js";
export class VirtualMachine {
    constructor(cpu) {
        this.console = new Console();
        this.cpu = cpu;
        this.assembler = new Assembler(cpu);
        this.running = false;
    }
    assemble(program) {
        try {
            this.assembler.assemble(program);
            this.nextInstructionLineNumber = this.assembler.addressLineMap.get(this.cpu.pc.getValue());
            //this.console.addLine("Assemble: operation completed successfully", "success");
        }
        catch (error) {
            // @ts-ignore
            this.console.addLine(`Assemble: ${error.message}`, "error");
            console.error(error);
        }
    }
    step() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.cpu.isHalted() && this.nextInstructionLineNumber !== undefined) {
                    yield this.cpu.execute(this);
                    this.nextInstructionLineNumber = this.assembler.addressLineMap.get(this.cpu.pc.getValue());
                }
                else {
                    this.pause();
                }
            }
            catch (error) {
                // @ts-ignore
                this.console.addLine(`${error.message}`, "error");
                console.error(error);
                this.pause();
            }
        });
    }
    pause() {
        this.running = false;
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.console.clear();
            this.lastChangedRegister = undefined;
            this.pause();
            this.assembler.reset();
            this.nextInstructionLineNumber = undefined;
        });
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
            tags: []
        }));
    }
}
