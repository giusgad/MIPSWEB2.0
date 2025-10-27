import { CPU } from "./CPU.js";
import { file, getFile } from "../files.js";
import { Assembler } from "./Assembler.js";
import { Console } from "./Console.js";
import { Binary } from "./Utils.js";
import { renderApp } from "../app.js";
import { getExecutionSpeedTimeOut } from "../execution-speed.js";
import { getAceEditor } from "../editors.js";
import { getOptions, INFINITE_LOOP_TRESHOLD } from "../settings.js";
import { updateUiAfterStep } from "../virtual-machine.js";

export class VirtualMachine {
    cpu: CPU;
    assembler: Assembler;
    running: boolean;
    /**Count how many times the virtual machine encounters each program counter (used for infinite loop detection)*/
    pcCounter: Map<number, number>;

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
    /**A stack of addresses, when a step is executed and calls a function, its return address is saved on the stack in order to allow a step-out*/
    stepOutStack: number[] = [];

    console: Console = new Console();

    private asyncToken: number = 0;

    constructor(cpu: CPU) {
        this.cpu = cpu;
        this.assembler = new Assembler(this.cpu);
        this.pcCounter = new Map();
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
            this.console.addErrorWithPos(
                `Assemble: ${(error as Error).message}`,
                this.assembler.currentEditorPosition,
            );
            console.error(error);
            throw error;
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
        this.pcCounter.clear();
        this.stepOutStack = [];
    }

    nextInstructionHasBreakPoint(): boolean {
        const pos = this.nextInstructionEditorPosition;
        if (!pos) return false;
        const bps = getAceEditor(
            getFile(pos.fileId),
        )?.session?.getBreakpoints();
        return bps![pos.lineNumber - 1] != null;
    }

    async stepOver() {
        // if step over is not possible execute a normal step
        if (!this.isNextInstructionFunction()) {
            await this.step();
            return;
        }
        const targetPc = this.cpu.pc.getValue() + 4;
        while (this.cpu.pc.getValue() !== targetPc) {
            await this.step();
        }
    }

    async stepOut() {
        if (this.stepOutStack.length <= 0) return;
        const targetPc = this.stepOutStack.pop()!;
        while (this.cpu.pc.getValue() !== targetPc) {
            await this.step();
        }
    }

    async step() {
        try {
            if (
                !this.cpu.isHalted() &&
                this.nextInstructionEditorPosition !== undefined
            ) {
                if (this.isNextInstructionFunction()) {
                    this.stepOutStack.push(this.cpu.pc.getValue() + 4);
                }
                await this.cpu.execute(this);
                const currPC = this.cpu.pc.getValue();
                if (currPC === this.stepOutStack[this.stepOutStack.length - 1])
                    this.stepOutStack.pop();
                const pcCounter = this.pcCounter.get(currPC);
                if (pcCounter && pcCounter >= INFINITE_LOOP_TRESHOLD) {
                    if (getOptions()["detect-infinite-loops"]) {
                        alert(
                            `Infinite loop detected after ${INFINITE_LOOP_TRESHOLD} iterations. The simulation has been paused, but it's possible to continue with the RUN button or disable infinite loop detection in settings.`,
                        );
                        this.pcCounter.clear();
                        this.pause();
                    }
                } else {
                    this.pcCounter.set(currPC, (pcCounter ?? 0) + 1);
                }
                this.updateEditorPosition();
                if (this.nextInstructionHasBreakPoint()) this.pause();
            } else {
                this.pause();
            }
        } catch (error) {
            this.console.addErrorWithPos(
                `Runtime Error : ${(error as Error).message}`,
                this.cpu.pc.getValue(),
            );
            console.warn(error);
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

    /**Updates the next instruction's editor position*/
    updateEditorPosition() {
        if (!this.cpu.isHalted()) {
            this.nextInstructionEditorPosition =
                this.assembler.addressEditorsPositions.get(
                    this.cpu.pc.getValue(),
                );
        }
    }

    async run() {
        this.running = true;
        const timeout = getExecutionSpeedTimeOut();
        while (this.running && !this.cpu.isHalted()) {
            await this.step();
            if (timeout > 0) {
                // update ui if steps are not instant
                updateUiAfterStep();
                await new Promise((resolve) => setTimeout(resolve, timeout));
            }
        }
    }

    pause() {
        this.running = false;
    }

    isNextInstructionFunction(): boolean {
        const instructionCode = this.cpu.memory.loadWord(this.cpu.pc);
        const decodedInstruction = this.cpu.decode(instructionCode);
        if (!decodedInstruction) return false;
        return decodedInstruction.instruction.symbol.endsWith("AL");
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
