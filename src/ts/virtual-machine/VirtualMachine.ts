import { CPU } from "./CPU.js";
import { file } from "../files.js";
import { Assembler } from "./Assembler.js";
import { Console } from "./Console.js";
import { Binary } from "./Utils.js";
import { renderApp } from "../app.js";
import { getExecutionSpeedTimeOut } from "../execution-speed.js";
import { step } from "../virtual-machine.js";

export class VirtualMachine {
    cpu: CPU;
    assembler: Assembler;
    running: boolean;

    nextInstructionEditorPosition:
        | { fileId: number; lineNumber: number }
        | undefined;

    /**Register that was changed by the last instruction*/
    lastChangedRegister?: string;
    /**List of register names that were read in the last */
    lastReadRegisters?: string[];
    /**word-aligned address of the memory read by the last instruction*/
    lastReadMem?: number;
    /**word-aligned address of the memory written by the last instruction*/
    lastWrittenMem?: number;

    console: Console = new Console();

    private asyncToken: number = 0;

    constructor(cpu: CPU) {
        this.cpu = cpu;
        this.assembler = new Assembler(this.cpu);
        this.running = false;
    }

    assemble(files: file[]) {
        this.stop();
        this.assembler.reset();
        this.cpu.reset();
        try {
            this.assembler.assembleFiles(files);
            this.nextInstructionEditorPosition =
                this.assembler.addressEditorsPositions.get(
                    this.cpu.pc.getValue(),
                );
            // the end of static data is the highest key in memory after assembling the program
            const staticDataEnd = Math.max(...this.cpu.memory.get().keys());
            this.cpu.memory.initHeapPointer(staticDataEnd);
        } catch (error) {
            // @ts-ignore
            this.console.addLine(`Assemble: ${error.message}`, "error");
            console.error(error);
        }
    }

    stop() {
        this.reset();
    }

    reset() {
        this.running = false;
        this.nextInstructionEditorPosition = undefined;
        this.lastChangedRegister = undefined;
        this.lastReadRegisters = undefined;
        this.lastReadMem = undefined;
        this.lastWrittenMem = undefined;
        this.console.reset();
        this.asyncToken++;
    }

    async step() {
        try {
            if (
                !this.cpu.isHalted() &&
                this.nextInstructionEditorPosition !== undefined
            ) {
                await this.cpu.execute(this);
                if (!this.cpu.isHalted()) {
                    this.nextInstructionEditorPosition =
                        this.assembler.addressEditorsPositions.get(
                            this.cpu.pc.getValue(),
                        );
                }
            } else {
                this.pause();
            }
        } catch (error) {
            this.console.addLine(
                // @ts-ignore
                `Runtime Error at 0x${this.cpu.pc.getHex()}: ${error.message}`,
                "error",
            );
            console.error(error);
            this.pause();
        }
        if (
            this.cpu.pc.getValue() >= this.assembler.textSegmentEnd.getValue()
        ) {
            this.cpu.halt();
            this.console.addLine(
                "Program finished (dropped off bottom).",
                "success",
            );
        }
    }

    async run() {
        this.running = true;
        const timeout = getExecutionSpeedTimeOut();
        while (this.running && !this.cpu.isHalted()) {
            if (timeout > 0) {
                // calls the outer step function since it also updates ui
                await step();
                await new Promise((resolve) => setTimeout(resolve, timeout));
            } else {
                await this.step();
            }
        }
    }

    pause() {
        this.running = false;
    }

    async exit() {
        this.cpu.halt();
        this.pause();
        this.nextInstructionEditorPosition = undefined;
        await renderApp("execute");
    }

    getRegisters() {
        const registers = [...this.cpu.getRegisters()];
        registers.push({ name: "pc", binary: this.cpu.pc });
        registers.push({ name: "hi", binary: this.cpu.hi });
        registers.push({ name: "lo", binary: this.cpu.lo });
        return registers;
    }

    getMemory() {
        return Array.from(this.cpu.getMemory().entries()).map(
            ([address, binary]): {
                address: number;
                binary: Binary;
                tags: { name: string; type: string }[];
            } => ({
                address,
                binary: binary,
                tags: [],
            }),
        );
    }

    getCurrentAsyncToken(): number {
        return this.asyncToken;
    }
}
