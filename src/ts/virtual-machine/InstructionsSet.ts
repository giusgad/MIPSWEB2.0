import {Word} from "./Utils.js";
import {CPU} from "./CPU.js";
import {Params} from "./Formats.js";

export abstract class Instruction {

    symbol: string;
    params: string;
    name: string;
    format: "R" | "I" | "J";
    opcode: Word;
    funct?: Word;

    constructor(symbol: string, params: string, format: "R" | "I" | "J", name: string, opcode: Word, funct?: Word) {
        this.symbol = symbol;
        this.params = params;
        this.name = name;
        this.format = format;
        this.opcode = opcode;
        if (funct) {
            this.funct = funct;
        }
    }

    abstract execute(cpu: CPU, params: Params): void;

    basic(params: Params): string {
        const paramsNames = this.params.split(',').map(p => p.trim());
        const paramValues = paramsNames.map(name => {
            const paramValue = (params as any)[name];
            if (paramValue !== undefined) {
                if (['rs', 'rt', 'rd'].includes(name)) {
                    return `$${paramValue}`;
                } else {
                    return paramValue;
                }
            } else {
                return '';
            }
        });
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
                    'MFHI',
                    'rd',
                    'R',
                    '',
                    0x00, 0x10);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;
                registers[rd].value = cpu.hi;
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'MFLO',
                    'rd',
                    'R',
                    '',
                    0x00, 0x12);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;
                registers[rd].value = cpu.lo;
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'MULT',
                    'rs, rt',
                    'R',
                    '',
                    0x00, 0x18);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rs = params.rs!;
                const rt = params.rt!;
                const rsVal = registers[rs].value | 0;
                const rtVal = registers[rt].value | 0;
                const productLow = (rsVal * rtVal) >>> 0;
                const productHigh = ((rsVal * rtVal) / 0x100000000) >>> 0;
                cpu.lo = productLow;
                cpu.hi = productHigh;
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'MULTU',
                    'rs, rt',
                    'R',
                    '',
                    0x00, 0x19);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rs = params.rs!;
                const rt = params.rt!;
                const rsVal = registers[rs].value >>> 0;
                const rtVal = registers[rt].value >>> 0;
                const productLow = (rsVal * rtVal) >>> 0;
                const productHigh = ((rsVal * rtVal) / 0x100000000) >>> 0;
                cpu.lo = productLow;
                cpu.hi = productHigh;
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'DIV',
                    'rs, rt',
                    'R',
                    '',
                    0x00, 0x1A);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rs = params.rs!;
                const rt = params.rt!;
                const rsVal = registers[rs].value | 0;
                const rtVal = registers[rt].value | 0;
                if (rtVal === 0) {
                    cpu.lo = 0;
                    cpu.hi = 0;
                    return;
                }
                const quotient = (rsVal / rtVal) | 0;
                const remainder = (rsVal % rtVal) | 0;
                cpu.lo = quotient;
                cpu.hi = remainder;
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'ADD',
                    'rd, rs, rt',
                    'R',
                    'Add Word',
                    0x00, 0x20);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;
                const rs = params.rs!;
                const rt = params.rt!;
                const result = registers[rs].value + registers[rt].value;
                if (result > 0x7FFFFFFF || result < -0x80000000) {
                    throw new Error("Integer Overflow");
                }
                registers[rd].value = result;
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'ADDU',
                    'rd, rs, rt',
                    'R',
                    '',
                    0x00, 0x21);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;
                const rs = params.rs!;
                const rt = params.rt!;
                registers[rd].value = registers[rs].value + registers[rt].value;
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'SUB',
                    'rd, rs, rt',
                    'R',
                    '',
                    0x00, 0x22);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;
                const rs = params.rs!;
                const rt = params.rt!;
                const result = registers[rs].value - registers[rt].value;
                if (result > 0x7FFFFFFF || result < -0x80000000) {
                    throw new Error("Integer Overflow");
                }
                registers[rd].value = result;
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'SUBU',
                    'rd, rs, rt',
                    'R',
                    '',
                    0x00, 0x23);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rd = params.rd!;
                const rs = params.rs!;
                const rt = params.rt!;
                registers[rd].value = registers[rs].value - registers[rt].value;
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'J',
                    'address',
                    'J',
                    'Jump',
                    0x02);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                console.error("TO-DO: Jump");
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'ADDI',
                    'rt, rs, immediate',
                    'I',
                    'Add Immediate Word',
                    0x08);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rt = params.rt!;
                const rs = params.rs!;
                const immediate = params.immediate!;
                const result = registers[rs].value + immediate;
                if (result > 0x7FFFFFFF || result < -0x80000000) {
                    throw new Error("Integer Overflow");
                }
                registers[rt].value = result;
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super(
                    'ADDIU',
                    'rt, rs, immediate',
                    'I',
                    '',
                    0x09);
            }
            execute(cpu: CPU, params: Params): void {
                const registers = cpu.getRegisters();
                const rt = params.rt!;
                const rs = params.rs!;
                const immediate = params.immediate!;
                registers[rt].value = registers[rs].value + immediate;
            }
        }());

    }

}