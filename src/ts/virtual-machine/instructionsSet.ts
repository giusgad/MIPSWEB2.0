import {register} from "./Registers.js";
import {word} from "./Memory.js";
import {params} from "./InstructionsFormats.js";

export type instruction = {
    format?: 'R' | 'I' | 'J';
    type?: "ALU" | "LOAD" | "STORE" | "BRANCH" | "JUMP";
    opcode?: word;
    funct?: word;
    run?: (registers: register[], params: params) => void;
    basic?: (params: params) => string;
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
        },
        basic: (params) => `add $${params.rd}, $${params.rs}, $${params.rt}`
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
        },
        basic: (params) => `sub $${params.rd}, $${params.rs}, $${params.rt}`
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
        },
        basic: (params) => `addi $${params.rt}, $${params.rs}, ${params.immediate}`
    }],
    ["addu", {
        format: 'R', type: "ALU", opcode: 0x00, funct: 0x21,
        run: (registers, params) => {
            const rd = params.rd!;
            const rs = params.rs!;
            const rt = params.rt!;

            registers[rd].value = registers[rs].value + registers[rt].value;
        },
        basic: (params) => `addu $${params.rd}, $${params.rs}, $${params.rt}`
    }],
    ["subu", {
        format: 'R', type: "ALU", opcode: 0x00, funct: 0x23,
        run: (registers, params) => {
            const rd = params.rd!;
            const rs = params.rs!;
            const rt = params.rt!;

            registers[rd].value = registers[rs].value - registers[rt].value;
        },
        basic: (params) => `subu $${params.rd}, $${params.rs}, $${params.rt}`
    }],
    ["addiu", {
        format: 'I', type: "ALU", opcode: 0x09,
        run: (registers, params) => {
            const rt = params.rt!;
            const rs = params.rs!;
            const immediate = params.immediate!;

            registers[rt].value = registers[rs].value + immediate;
        },
        basic: (params) => `addiu $${params.rt}, $${params.rs}, ${params.immediate}`
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
        },
        basic: (params) => `mult $${params.rs}, $${params.rt}`
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
        },
        basic: (params) => `multu $${params.rs}, $${params.rt}`
    }],
    ["mfhi", {
        format: 'R', type: "ALU", opcode: 0x00, funct: 0x10,
        run: (registers, params) => {
            const rd = params.rd!;
            const hi = params.hi!;

            registers[rd].value = hi.value;
        },
        basic: (params) => `mfhi $${params.rd}`
    }],
    ["mflo", {
        format: 'R', type: "ALU", opcode: 0x00, funct: 0x12,
        run: (registers, params) => {
            const rd = params.rd!;
            const lo = params.lo!;

            registers[rd].value = lo.value;
        },
        basic: (params) => `mflo $${params.rd}`
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
        },
        basic: (params) => `div $${params.rs}, $${params.rt}`
    }],
    ["lw", {}],
    ["sw", {}]
]);