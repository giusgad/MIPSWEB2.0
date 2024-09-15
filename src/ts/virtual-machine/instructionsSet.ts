import {register} from "./Registers.js";
import {word} from "./Memory.js";
import {params} from "./InstructionsFormats.js";

export type instruction = {
    format?: 'R' | 'I' | 'J';
    type?: "ALU" | "LOAD" | "STORE" | "BRANCH" | "JUMP";
    opcode?: word;
    funct?: word;
    run?: (registers: register[], params: params) => void;
}

export const instructionsSet: Map<string, instruction> = new Map<string, instruction>([
    ["add", {
        format: 'R', type: "ALU", opcode: 0x00,  funct: 0x20,
        run: (registers, params) => {
            const rd = params.rd!;
            const rs = params.rs!;
            const rt = params.rt!;

            const result = registers[rs].value + registers[rt].value;

            if (result > 0x7FFFFFFF || result < -0x80000000) {
                throw new Error("Integer Overflow");
            }

            registers[rd].value = result;
        }
    }],
    ["sub", {
        format: 'R', type: "ALU", opcode: 0x00, funct: 0x22,
        run: (registers, params) => {
            const rd = params.rd!;
            const rs = params.rs!;
            const rt = params.rt!;

            const result = registers[rs].value - registers[rt].value;

            if (result > 0x7FFFFFFF || result < -0x80000000) {
                throw new Error("Integer Overflow");
            }

            registers[rd].value = result;
        }
    }],
    ["addi", {
        format: 'I', type: "ALU", opcode: 0x08,
        run: (registers, params) => {
            const rt = params.rt!;
            const rs = params.rs!;
            const immediate = params.immediate!;

            const result = registers[rs].value + immediate;

            if (result > 0x7FFFFFFF || result < -0x80000000) {
                throw new Error("Integer Overflow");
            }

            registers[rt].value = result;
        }
    }],
    ["addu", {
        format: 'R', type: "ALU", opcode: 0x00, funct: 0x21,
        run: (registers, params) => {
            const rd = params.rd!;
            const rs = params.rs!;
            const rt = params.rt!;

            registers[rd].value = registers[rs].value + registers[rt].value;
        }
    }],
    ["subu", {
        format: 'R', type: "ALU", opcode: 0x00, funct: 0x23,
        run: (registers, params) => {
            const rd = params.rd!;
            const rs = params.rs!;
            const rt = params.rt!;

            registers[rd].value = registers[rs].value - registers[rt].value;
        }
    }],
    ["addiu", {
        format: 'I', type: "ALU", opcode: 0x09,
        run: (registers, params) => {
            const rt = params.rt!;
            const rs = params.rs!;
            const immediate = params.immediate!;

            registers[rt].value = registers[rs].value + immediate;
        }
    }],
    ["mult", {
        format: 'R', type: "ALU", opcode: 0x00, funct: 0x18,
        run: (registers, params) => {
            const rs = params.rs!;
            const rt = params.rt!;
            const lo = params.lo!;
            const hi = params.hi!;

            const rsVal = registers[rs].value | 0;
            const rtVal = registers[rt].value | 0;

            const productLow = (rsVal * rtVal) >>> 0;
            const productHigh = ((rsVal * rtVal) / 0x100000000) >>> 0;

            lo.value = productLow;
            hi.value = productHigh;
        }
    }],
    ["multu", {
        format: 'R', type: "ALU", opcode: 0x00, funct: 0x19,
        run: (registers, params) => {
            const rs = params.rs!;
            const rt = params.rt!;
            const lo = params.lo!;
            const hi = params.hi!;

            const rsVal = registers[rs].value >>> 0;
            const rtVal = registers[rt].value >>> 0;

            const productLow = (rsVal * rtVal) >>> 0;
            const productHigh = ((rsVal * rtVal) / 0x100000000) >>> 0;

            lo.value = productLow;
            hi.value = productHigh;
        }
    }],
    ["mfhi", {
        format: 'R', type: "ALU", opcode: 0x00, funct: 0x10,
        run: (registers, params) => {
            const rd = params.rd!;
            const hi = params.hi!;

            registers[rd].value = hi.value;
        }
    }],
    ["mflo", {
        format: 'R', type: "ALU", opcode: 0x00, funct: 0x12,
        run: (registers, params) => {
            const rd = params.rd!;
            const lo = params.lo!;

            registers[rd].value = lo.value;
        }
    }],
    ["div", {
        format: 'R', type: "ALU", opcode: 0x00, funct: 0x1A,
        run: (registers, params) => {
            const rs = params.rs!;
            const rt = params.rt!;
            const lo = params.lo!;
            const hi = params.hi!;

            const rsVal = registers[rs].value | 0;
            const rtVal = registers[rt].value | 0;

            if (rtVal === 0) {
                lo.value = 0;
                hi.value = 0;
                return;
            }

            const quotient = (rsVal / rtVal) | 0;
            const remainder = (rsVal % rtVal) | 0;

            lo.value = quotient;
            hi.value = remainder;
        }
    }],
    ["lw", {}],
    ["sw", {}]
]);