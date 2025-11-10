import { Instruction, Instructions } from "./Instructions.js";
import { Format, I_Format, J_Format, R_Format } from "./Formats.js";
import { Registers } from "./Registers.js";
import { Binary } from "./Utils.js";
import { Memory } from "./Memory.js";
import { Syscalls } from "./Syscalls.js";
import { VirtualMachine } from "./VirtualMachine.js";
import { getOptions } from "../settings.js";

type DecodingCacheItem = {
    instruction: Instruction;
    params: { [key: string]: Binary };
    basic: string;
};
export class CPU {
    instructionsSet: Instructions = new Instructions();
    syscallsSet: Syscalls = new Syscalls();
    formats: Map<string, Format> = new Map();
    memory: Memory = new Memory();
    registers: Registers = new Registers([
        "$zero",
        "$at",
        "$v0",
        "$v1",
        "$a0",
        "$a1",
        "$a2",
        "$a3",
        "$t0",
        "$t1",
        "$t2",
        "$t3",
        "$t4",
        "$t5",
        "$t6",
        "$t7",
        "$s0",
        "$s1",
        "$s2",
        "$s3",
        "$s4",
        "$s5",
        "$s6",
        "$s7",
        "$t8",
        "$t9",
        "$k0",
        "$k1",
        "$gp",
        "$sp",
        "$fp",
        "$ra",
    ]);
    pc: Binary = new Binary();
    lo: Binary = new Binary();
    hi: Binary = new Binary();
    halted: boolean = false;

    constructor() {
        this.formats.set("R", new R_Format());
        this.formats.set("I", new I_Format());
        this.formats.set("J", new J_Format());
    }

    decodingCache: Map<number, DecodingCacheItem> = new Map();

    decode(instructionCode: Binary) {
        const cached = this.decodingCache.get(
            instructionCode.getUnsignedValue(),
        );
        if (cached) {
            return cached;
        }
        const opcode = new Binary(
            instructionCode.getBits(31, 26).getValue(),
            6,
        );
        let funct: Binary | undefined = undefined;
        if (opcode.getValue() === 0) {
            funct = new Binary(instructionCode.getBits(5, 0).getValue(), 6);
        }
        let foundInstruction: Instruction | undefined = undefined;
        const rtField = instructionCode.getBits(20, 16).getValue();

        for (const instruction of this.instructionsSet.instructions) {
            if (instruction.opcode.getValue() === opcode.getValue()) {
                if (funct) {
                    if (instruction.funct?.getValue() === funct.getValue()) {
                        foundInstruction = instruction;
                        break;
                    }
                } else if (!instruction.funct) {
                    if (instruction.fixedRt) {
                        if (instruction.fixedRt.getValue() === rtField) {
                            // bal and bgezal have the same opcode and fixedRt, but need to be interpreted as bgezal
                            // specifically, `bal target` is interpreted as `bgezal $zero target`
                            if (instruction.symbol === "BAL") continue;
                            foundInstruction = instruction;
                            break;
                        } else {
                            continue;
                        }
                    }
                    foundInstruction = instruction;
                    break;
                }
            }
        }

        if (foundInstruction) {
            const format = this.getFormat(foundInstruction.format);
            if (format) {
                let params = format.disassemble(
                    foundInstruction,
                    instructionCode,
                );

                const basic = foundInstruction.basic(params, this.registers);
                this.decodingCache.set(instructionCode.getUnsignedValue(), {
                    instruction: foundInstruction,
                    params,
                    basic,
                });
                return { instruction: foundInstruction, params, basic };
            }
        }

        return undefined;
    }

    async execute(vm: VirtualMachine) {
        if (this.pc <= vm.assembler.textSegmentEnd) {
            const instructionCode = this.memory.loadWord(this.pc);
            const decodedInstruction = this.decode(instructionCode);
            if (decodedInstruction) {
                const instruction = decodedInstruction.instruction;
                if (instruction) {
                    const oldRegisters = this.registers.copy();

                    await instruction.execute(
                        this,
                        decodedInstruction.params,
                        vm,
                    );

                    // update vm's values for operation visualization (read/written registers and memory)
                    let changedRegister: string | undefined = undefined;
                    for (let i = 0; i < this.registers.registers.length; i++) {
                        if (
                            !this.registers.registers[i].binary.equals(
                                oldRegisters.registers[i].binary,
                            )
                        ) {
                            changedRegister = this.registers.registers[i].name;
                            break;
                        }
                    }
                    const registers = this.getRegisters();
                    vm.lastChangedRegister = changedRegister;
                    vm.lastReadRegisters = instruction.getReadRegisters(
                        decodedInstruction.params,
                        registers,
                    );
                    vm.lastReadMem = instruction.getReadMem(
                        decodedInstruction.params,
                        registers,
                    );
                    vm.lastWrittenMem = instruction.getWrittenMem(
                        decodedInstruction.params,
                        registers,
                    );
                }
            }
        } else {
            this.halt();
        }
    }

    reset() {
        const opts = getOptions();
        if (opts["reset-mem"] === true) {
            this.memory.reset();
        }
        if (opts["reset-regs"] === true) {
            this.registers.reset();
        }
        this.pc.set(0);
        this.lo.set(0);
        this.hi.set(0);
        this.halted = false;
    }

    resume(): void {
        this.halted = false;
    }

    halt(): void {
        this.halted = true;
    }

    isHalted(): boolean {
        return this.halted;
    }

    storeByte(address: Binary, value: Binary) {
        this.memory.storeByte(address, value);
    }

    storeWord(address: Binary, value: Binary) {
        this.memory.storeWord(address, value);
    }

    loadByte(address: Binary): Binary {
        return this.memory.loadByte(address);
    }

    loadWord(address: Binary): Binary {
        return this.memory.loadWord(address);
    }

    getFormat(format: string) {
        return this.formats.get(format);
    }

    getRegisters() {
        return this.registers.registers;
    }

    getMemory() {
        return this.memory.get();
    }
}
