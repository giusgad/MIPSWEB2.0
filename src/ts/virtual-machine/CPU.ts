import {Registers} from "./Registers.js";
import {Memory} from "./Memory.js";
import {Binary} from "./Utils.js";
import {Instruction, Instructions} from "./Instructions.js";
import {Format, I_Format, J_Format, R_Format} from "./Formats.js";
import {Syscalls} from "./Syscalls.js";
import {VirtualMachine} from "./VirtualMachine";

export class CPU {

    textSegmentStart: Binary = new Binary(0x00400000);
    textSegmentEnd: Binary = new Binary(this.textSegmentStart.getValue());
    dataSegmentStart: Binary = new Binary(0x10010000);
    dataSegmentEnd: Binary = new Binary(this.dataSegmentStart.getValue());

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
    pc: Binary = new Binary(this.textSegmentStart.getValue());
    lo: Binary = new Binary();
    hi: Binary = new Binary();

    instructionsSet: Instructions = new Instructions();
    syscallsSet: Syscalls = new Syscalls();
    formats: Map<string, Format> = new Map();

    memory: Memory = new Memory();

    halted: boolean = false;

    constructor() {
        this.registers.get("$gp")!.binary = new Binary(0x10008000);
        this.registers.get("$sp")!.binary = new Binary(0x7fffeffc);
        this.formats.set('R', new R_Format());
        this.formats.set('I', new I_Format());
        this.formats.set('J', new J_Format());
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

    decode(instructionCode: Binary): { instruction: Instruction, params: { [key: string]: Binary }, basic: string } | undefined {console.log()

        const opcode = new Binary(instructionCode.getBits(31, 26).getValue(), 6);

        let funct: Binary | undefined = undefined;
        if (opcode.getValue() === 0) {
            funct = new Binary(instructionCode.getBits(5, 0).getValue(), 6);
        }

        let foundInstruction: Instruction | undefined = undefined;

        for (const instruction of this.instructionsSet.instructions) {
            if (instruction.opcode.getValue() === opcode.getValue()) {
                if (funct) {
                    if (instruction.funct?.getValue() === funct.getValue()) {
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

                let params = format.disassemble(foundInstruction, instructionCode);

                const basic = foundInstruction.basic(params);
                return { instruction: foundInstruction, params, basic };
            }
        }

        return undefined;
    }

    async execute(vm: VirtualMachine) {
        if (this.pc <= this.textSegmentEnd) {
            const instructionCode = this.memory.loadWord(this.pc);
            const decodedInstruction = this.decode(instructionCode);
            if (decodedInstruction) {
                const instruction = decodedInstruction.instruction;
                if (instruction) {
                    await instruction.execute(this, decodedInstruction.params, vm);
                }
            }
        } else {
            this.halt();
        }
    }

    getFormat(format: string) {
        return this.formats.get(format);
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

    reset() {
        this.registers.reset();
        this.memory.reset();
        this.textSegmentStart = new Binary(0x00400000);
        this.textSegmentEnd = new Binary(this.textSegmentStart.getValue());
        this.dataSegmentStart = new Binary(0x10010000);
        this.dataSegmentEnd = new Binary(this.dataSegmentStart.getValue());
        this.registers.get("$gp")!.binary = new Binary(0x10008000);
        this.registers.get("$sp")!.binary = new Binary(0x7fffeffc);
        this.pc = new Binary(this.textSegmentStart.getValue());
        this.lo = new Binary();
        this.hi = new Binary();
        this.halted = false;
    }

    getRegisters() {
        return this.registers.registers;
    }

    getMemory() {
        return this.memory.get();
    }

}