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
import { renderApp } from "../app.js";
export class VirtualMachine {
    constructor(cpu) {
        this.console = new Console();
        this.asyncToken = 0;
        this.cpu = cpu;
        this.assembler = new Assembler(this.cpu);
        this.running = false;
    }
    assemble(files) {
        this.stop();
        try {
            this.assembler.assembleFiles(files);
            this.nextInstructionEditorPosition = this.assembler.addressEditorsPositions.get(this.cpu.pc.getValue());
        }
        catch (error) {
            // @ts-ignore
            this.console.addLine(`Assemble: ${error.message}`, "error");
            console.error(error);
        }
    }
    stop() {
        this.reset();
    }
    reset() {
        this.cpu.reset();
        this.assembler.reset();
        this.running = false;
        this.nextInstructionEditorPosition = undefined;
        this.lastChangedRegister = undefined;
        this.console.reset();
        this.asyncToken++;
    }
    step() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.cpu.isHalted() && this.nextInstructionEditorPosition !== undefined) {
                    yield this.cpu.execute(this);
                    if (!this.cpu.isHalted()) {
                        this.nextInstructionEditorPosition = this.assembler.addressEditorsPositions.get(this.cpu.pc.getValue());
                    }
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
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            this.running = true;
            while (this.running && !this.cpu.isHalted()) {
                yield this.step();
            }
        });
    }
    pause() {
        this.running = false;
    }
    exit() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cpu.halt();
            this.pause();
            this.nextInstructionEditorPosition = undefined;
            yield renderApp("execute");
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
        return Array.from(this.cpu.getMemory().entries()).map(([address, binary]) => ({
            address,
            binary: binary,
            tags: []
        }));
    }
    getCurrentAsyncToken() {
        return this.asyncToken;
    }
}
