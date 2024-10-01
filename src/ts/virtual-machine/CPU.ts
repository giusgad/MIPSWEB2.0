import {Memory} from "./Memory.js";
import {Utils, Word} from "./Utils.js";
import {Registers} from "./Registers.js";
import {Instruction, InstructionsSet} from "./InstructionsSet.js";
import {Format, I_Format, J_Format, R_Format} from "./Formats.js";

export type Endianness = "big" | "little";

export class CPU {

    memory: Memory = new Memory();
    textStartingAddress: Word = 0x00400000;
    textAddress: Word = this.textStartingAddress;
    textEndingAddress: Word = this.textStartingAddress;
    dataStartingAddress: Word = 0x10010000;
    dataAddress: Word = this.dataStartingAddress;

    registers: Registers = new Registers(
        [
            "$zero",
            "$at",
            "$v0", "$v1",
            "$a0", "$a1", "$a2", "$a3",
            "$t0", "$t1", "$t2", "$t3", "$t4", "$t5", "$t6", "$t7",
            "$s0", "$s1", "$s2", "$s3", "$s4", "$s5", "$s6", "$s7",
            "$t8", "$t9",
            "$k0", "$k1",
            "$gp",
            "$sp",
            "$fp",
            "$ra"
        ]
    );
    pc: Word = this.textStartingAddress;
    lo: Word = 0x00000000;
    hi: Word = 0x00000000;

    instructionsSet: InstructionsSet = new InstructionsSet();
    formats: Map<string, Format> = new Map();

    instructionBytesLength: number = 4;
    endianness: Endianness = "big";

    halted: boolean = false;

    constructor() {
        this.registers.get("$gp")!.value = 0x10008000;
        this.registers.get("$sp")!.value = 0x7fffeffc;
        this.formats.set('R', new R_Format());
        this.formats.set('I', new I_Format());
        this.formats.set('J', new J_Format());
    }

    fetchInstruction(): Word {
        return this.memory.fetch(this.pc);
    }

    decode(instructionCode: Word): Instruction | undefined {
        return this.getInstructionByCode(instructionCode)?.instruction;
    }

    execute() {
        if (this.pc <= this.textEndingAddress) {
            const instructionCode = this.fetchInstruction();
            const instruction = this.decode(instructionCode);
            if (instruction) {

                const format = this.getFormat(instruction.format);
                if (format) {

                    let params = format.disassemble(instructionCode);

                    instruction.execute(this, params);

                }

            } else {
                throw new Error(`Unknown instruction code: ${instructionCode}`);
            }
        } else {
            this.halt();
        }
    }

    reset() {
        this.memory.reset();
        this.textAddress = this.textStartingAddress;
        this.textEndingAddress = this.textStartingAddress;
        this.dataAddress = this.dataStartingAddress;
        this.registers.reset();
        this.registers.get("$gp")!.value = 0x10008000;
        this.registers.get("$sp")!.value = 0x7fffeffc;
        this.pc = this.textStartingAddress;
        this.lo = 0x00000000;
        this.hi = 0x00000000;
        this.halted = false;
    }

    halt(): void {
        this.halted = true;
    }

    isHalted(): boolean {
        return this.halted;
    }

    storeInstruction(code: Word) {
        this.memory.store(this.textAddress, code);
        this.textEndingAddress = this.textAddress;
        this.textAddress += this.instructionBytesLength;
    }

    getFormat(format: string) {
        return this.formats.get(format);
    }

    getInstructionByCode(code: Word): { instruction: Instruction, basic: string } | undefined {
        const opcode = Utils.getBits(code, 31, 26);
        let funct: number | undefined = undefined;
        if (opcode === 0x00) {
            funct = Utils.getBits(code, 5, 0);
        }

        let foundInstruction: Instruction | undefined = undefined;

        for (const instruction of this.instructionsSet.instructions) {
            if (instruction.opcode === opcode) {
                if (funct !== undefined) {
                    if (instruction.funct === funct) {
                        foundInstruction = instruction;
                        break;
                    }
                } else {
                    if (!instruction.funct) {
                        foundInstruction = instruction;
                        break;
                    }
                }
            }
        }

        if (foundInstruction) {
            const format = this.getFormat(foundInstruction.format);
            if (format) {
                let params = format.disassemble(code);
                const basic = foundInstruction.basic(params);
                return { instruction: foundInstruction, basic };
            }
        }

        console.error(`Instruction not found for code: ${code} (0x${code.toString(16).padStart(8, '0')})`);
        return undefined;
    }

    getRegisters() {
        return this.registers.registers;
    }

    getMemory() {
        return this.memory.get();
    }

}
