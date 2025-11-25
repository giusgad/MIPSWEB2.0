import { CPU } from "./CPU.js";
import { file } from "../files.js";
import { Assembler } from "./Assembler.js";
import { Console } from "./Console.js";
import { Binary } from "./Utils.js";
import { renderApp } from "../app.js";
import {
    getExecutionSpeedTimeOut,
    isPerformanceMode,
} from "../execution-speed.js";
import { getOptions, INFINITE_LOOP_TRESHOLD } from "../settings.js";
import { updateUiAfterStep } from "../virtual-machine.js";
import { showForm } from "../forms.js";

export class VirtualMachine {
    cpu: CPU;
    assembler: Assembler;
    running: boolean;
    /**Count how many times the virtual machine encounters each program counter (used for infinite loop detection)*/
    pcCounter: Map<number, number>;

    nextInstructionEditorPosition:
        | { fileId: number; lineNumber: number }
        | undefined;
    /**If this flag is true (can be set by the user with execution speed) then skip all operations about UI updates during execution,
     * leaving only the barebones. This improves performance for complex programs.*/
    performanceMode: boolean = false;

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
            this.console.addLineWithPos(
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
                if (!this.performanceMode && this.isNextInstructionFunction()) {
                    this.stepOutStack.push(this.cpu.pc.getValue() + 4);
                }
                await this.cpu.execute(this);
                if (!this.performanceMode) {
                    const currPC = this.cpu.pc.getValue();
                    if (
                        currPC ===
                        this.stepOutStack[this.stepOutStack.length - 1]
                    )
                        this.stepOutStack.pop();
                    const pcCounter = this.pcCounter.get(currPC);
                    if (pcCounter && pcCounter >= INFINITE_LOOP_TRESHOLD) {
                        if (getOptions()["detect-infinite-loops"]) {
                            showForm(
                                "infinite-loop-popup",
                                { treshold: INFINITE_LOOP_TRESHOLD },
                                false,
                            );
                            this.pcCounter.clear();
                            this.pause(true);
                        }
                    } else {
                        this.pcCounter.set(currPC, (pcCounter ?? 0) + 1);
                    }
                    this.updateEditorPosition();
                    if (
                        this.assembler.breakpointPCs.has(this.cpu.pc.getValue())
                    )
                        this.pause(true);
                }
            } else {
                this.pause(true);
            }
        } catch (error) {
            this.console.addLineWithPos(
                `Runtime Error: ${(error as Error).message}`,
                this.cpu.pc.getValue(),
            );
            console.warn(error);
            this.pause(true);
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
        this.performanceMode = isPerformanceMode();

        while (this.running && !this.cpu.isHalted()) {
            await this.step();
            if (timeout > 0) {
                // update ui if steps are not instant
                await updateUiAfterStep();
                this.pcCounter.clear();
                await new Promise((resolve) => setTimeout(resolve, timeout));
            }
        }
        await updateUiAfterStep();
    }

    pause(updateUi: boolean = false) {
        this.running = false;
        if (updateUi) updateUiAfterStep();
    }

    isNextInstructionFunction(): boolean {
        const instructionCode = this.cpu.memory.loadWord(this.cpu.pc);
        const decodedInstruction = this.cpu.decode(instructionCode);
        if (!decodedInstruction) return false;
        return decodedInstruction.instruction.symbol.endsWith("AL");
    }

    async exit() {
        this.cpu.halt();
        this.pause(false);
        this.nextInstructionEditorPosition = undefined;
        this.lastReadRegisters = undefined;
        this.lastChangedRegister = undefined;
        await updateUiAfterStep();
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
