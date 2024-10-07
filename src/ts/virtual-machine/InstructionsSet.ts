import {Utils, Word} from "./Utils.js";
import {CPU} from "./CPU.js";
import {Params} from "./Formats.js";

export abstract class Instruction {

    symbol: string;
    params: string;
    name: string;
    format: "R" | "I" | "J";
    opcode: Word;
    funct: Word;

    constructor(symbol: string, params: string, format: "R" | "I" | "J", name: string, opcode: Word, funct?: Word) {
        this.symbol = symbol;
        this.params = params;
        this.name = name;
        this.format = format;
        this.opcode = Utils.asUnsigned(opcode, 6);
        this.funct = funct ? Utils.asUnsigned(funct, 6) : 0x00;
    }

    abstract execute(cpu: CPU, params: Params): void;

    basic(params: Params): string {
        const paramsNames = this.params.split(',').map(p => p.trim());
        const paramValues: string[] = [];
        for (const name of paramsNames) {
            if (name.includes('(') && name.includes(')')) {
                const offsetName = name.substring(0, name.indexOf('('));
                const rsName = name.substring(name.indexOf('(') + 1, name.indexOf(')'));
                const offsetValue = (params as any)[offsetName] || 0;
                const rsValue = (params as any)[rsName];
                const rsStr = `$${rsValue}`;
                paramValues.push(`${offsetValue}(${rsStr})`);
            } else if (['rs', 'rt', 'rd'].includes(name)) {
                const regValue = (params as any)[name];
                paramValues.push(`$${regValue}`);
            } else {
                const paramValue = (params as any)[name];
                paramValues.push(paramValue.toString());
            }
        }
        return `${this.symbol.toLowerCase()} ${paramValues.join(' ')}`;
    }

}

export class InstructionsSet {

    instructions: Instruction[] = [];

    constructor() {
        this.initInstructions();
    }

    getBySymbol(instructionSymbol: string): Instruction | undefined {
        for (const instruction of this.instructions) {
            if (instruction.symbol.toLowerCase() === instructionSymbol.toLowerCase()) {
                return instruction;
            }
        }
    }

    initInstructions() {

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'SLL', 'rd, rt, shamt',
                    'R',
                    'Shift Left Logical',
                    0x00, 0x00
                );
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;
                const rt = params.rt!;
                const shamt = params.shamt!;

                const result = Utils.toUnsigned(registers[rt].value << shamt);

                registers[rd].value = result;
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'SRL', 'rd, rt, shamt',
                    'R',
                    'Shift Right Logical',
                    0x00, 0x02
                );
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;
                const rt = params.rt!;
                const shamt = params.shamt!;

                const result = Utils.toUnsigned(registers[rt].value >>> shamt);

                registers[rd].value = result;
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'MFHI', 'rd',
                    'R',
                    '',
                    0x00, 0x10
                );
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;

                registers[rd].value = Utils.toSigned(cpu.hi);
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'MFLO', 'rd',
                    'R',
                    '',
                    0x00, 0x12
                );
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;

                registers[rd].value = Utils.toSigned(cpu.lo);
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'MULT', 'rs, rt',
                    'R',
                    '',
                    0x00, 0x18
                );
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rs = params.rs!;
                const rt = params.rt!;

                const rsVal = Utils.toSigned(registers[rs].value);
                const rtVal = Utils.toSigned(registers[rt].value);

                const product = BigInt(rsVal) * BigInt(rtVal);

                cpu.lo = Number(product & BigInt(0xFFFFFFFF));  // Lower 32 bits
                cpu.hi = Number(product >> BigInt(32));         // Upper 32 bits
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'MULTU', 'rs, rt',
                    'R',
                    '',
                    0x00, 0x19
                );
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rs = params.rs!;
                const rt = params.rt!;

                const rsVal = Utils.toUnsigned(registers[rs].value);
                const rtVal = Utils.toUnsigned(registers[rt].value);

                const product = BigInt(rsVal) * BigInt(rtVal);

                cpu.lo = Number(product & BigInt(0xFFFFFFFF));  // Lower 32 bits
                cpu.hi = Number(product >> BigInt(32));         // Upper 32 bits
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'DIV', 'rs, rt',
                    'R',
                    '',
                    0x00, 0x1A
                );
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rs = params.rs!;
                const rt = params.rt!;

                const rsVal = Utils.toSigned(registers[rs].value);
                const rtVal = Utils.toSigned(registers[rt].value);

                if (rtVal === 0) {
                    cpu.lo = 0;
                    cpu.hi = 0;
                    cpu.pc += cpu.instructionBytesLength;
                    return;
                }

                const quotient = (rsVal / rtVal) | 0;
                const remainder = rsVal % rtVal;

                cpu.lo = quotient;
                cpu.hi = remainder;
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'ADD', 'rd, rs, rt',
                    'R',
                    'Add Word',
                    0x00, 0x20);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;
                const rs = params.rs!;
                const rt = params.rt!;

                const rsVal = Utils.toSigned(registers[rs].value);
                const rtVal = Utils.toSigned(registers[rt].value);
                const result = rsVal + rtVal;

                if (Utils.detectSignedOverflow(result)) {
                    throw new Error("Integer Overflow");
                }

                registers[rd].value = Utils.toSigned(result);
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'ADDU', 'rd, rs, rt',
                    'R',
                    '',
                    0x00, 0x21);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;
                const rs = params.rs!;
                const rt = params.rt!;

                const rsVal = Utils.toUnsigned(registers[rs].value);
                const rtVal = Utils.toUnsigned(registers[rt].value);

                const result = rsVal + rtVal;

                registers[rd].value = Utils.toUnsigned(result);
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'SUB', 'rd, rs, rt',
                    'R',
                    '',
                    0x00, 0x22);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;
                const rs = params.rs!;
                const rt = params.rt!;

                const rsVal = Utils.toSigned(registers[rs].value);
                const rtVal = Utils.toSigned(registers[rt].value);
                const result = rsVal - rtVal;

                if (Utils.detectSignedOverflow(result)) {
                    throw new Error("Integer Overflow");
                }

                registers[rd].value = Utils.toSigned(result);
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'SUBU', 'rd, rs, rt',
                    'R',
                    '',
                    0x00, 0x23);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;
                const rs = params.rs!;
                const rt = params.rt!;

                const rsVal = Utils.toUnsigned(registers[rs].value);
                const rtVal = Utils.toUnsigned(registers[rt].value);

                const result = rsVal - rtVal;

                registers[rd].value = Utils.toUnsigned(result);
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'AND', 'rd, rs, rt',
                    'R',
                    '',
                    0x00, 0x24
                );
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;
                const rs = params.rs!;
                const rt = params.rt!;

                registers[rd].value = registers[rs].value & registers[rt].value;
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'OR', 'rd, rs, rt',
                    'R',
                    '',
                    0x00, 0x25
                );
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;
                const rs = params.rs!;
                const rt = params.rt!;

                registers[rd].value = registers[rs].value | registers[rt].value;
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'J', 'address',
                    'J',
                    'Jump',
                    0x02);
            }
            execute(cpu: CPU, params: Params): void {
                const address = Utils.asUnsigned(params.address!, 26);
                cpu.pc = (cpu.pc & 0xF0000000) | (address << 2);
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'ADDI', 'rt, rs, immediate',
                    'I',
                    'Add Immediate Word',
                    0x08);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rt = params.rt!;
                const rs = params.rs!;
                let immediate = params.immediate!;

                const rsVal = Utils.toSigned(registers[rs].value);
                immediate = Utils.asSigned(immediate, 16);
                const result = rsVal + immediate;

                if (Utils.detectSignedOverflow(result)) {
                    throw new Error("Integer Overflow");
                }

                registers[rt].value = Utils.toSigned(result);
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'ADDIU',
                    'rt, rs, immediate',
                    'I',
                    'Add Immediate Unsigned',
                    0x09
                );
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rt = params.rt!;
                const rs = params.rs!;
                let immediate = params.immediate!;

                immediate = Utils.asSigned(immediate, 16);

                registers[rt].value = Utils.toUnsigned(registers[rs].value + immediate);
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'ANDI', 'rt, rs, immediate',
                    'I',
                    '',
                    0x0C
                );
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rt = params.rt!;
                const rs = params.rs!;
                const immediate = Utils.asUnsigned(params.immediate!, 16);
                registers[rt].value = registers[rs].value & immediate;
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'ORI', 'rt, rs, immediate',
                    'I',
                    '',
                    0x0D
                );
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rt = params.rt!;
                const rs = params.rs!;
                const immediate = Utils.asUnsigned(params.immediate!, 16);
                registers[rt].value = registers[rs].value | immediate;
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'LUI', 'rt, immediate',
                    'I',
                    'Load Upper Immediate',
                    0x0F
                );
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rt = params.rt!;
                const immediate = Utils.asUnsigned(params.immediate!, 16);
                registers[rt].value = immediate << 16;
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'LW', 'rt, offset(rs)',
                    'I',
                    'Load Word',
                    0x23
                );
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rt = params.rt!;
                const rs = params.rs!;
                const offset = Utils.asSigned(params.immediate!, 16);
                const address = registers[rs].value + offset;

                const word = cpu.memory.fetch(address);
                if (word !== undefined) {
                    registers[rt].value = word;
                } else {
                    throw new Error(`Memory access error at address ${address.toString(16)}`);
                }
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'SW', 'rt, offset(rs)',
                    'I',
                    'Store Word',
                    0x2B
                );
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rt = params.rt!;
                const rs = params.rs!;
                const offset = Utils.asSigned(params.immediate!, 16);
                const address = registers[rs].value + offset;
                const word = registers[rt].value;
                cpu.memory.store(address, word);
                cpu.pc += cpu.instructionBytesLength;
            }
        }());

    }

}