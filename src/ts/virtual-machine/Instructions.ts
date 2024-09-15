import {word} from "./Memory.js";
import {register} from "./Registers.js";
import {Format, I_Format, J_Format, params, R_Format} from "./InstructionsFormats.js";

export type instruction = {
    format?: 'R' | 'I' | 'J';
    type?: "ALU" | "LOAD" | "STORE" | "BRANCH" | "JUMP";
    opcode?: word;
    funct?: word;
    run?: (registers: register[], params: params) => void;
}

export class Instructions {

    private static formats: Map<string, Format> = new Map([
        ['R', new R_Format()],
        ['I', new I_Format()],
        ['J', new J_Format()]
    ]);

    private static instructions: Map<string, instruction> = new Map<string, instruction>([
        ["add", { format: 'R', type: "ALU", opcode: 0x00, funct: 0x20,
            run: (registers, params) => {
                // ADD rd, rs, rt
                // rd <- rs + rt
                const rd = params.rd!;
                const rs = params.rs!;
                const rt = params.rt!;
                registers[rd].value = registers[rs].value + registers[rt].value;
            }
        }],
        ["sub", { format: 'R', type: "ALU", opcode: 0x00, funct: 0x22,
            run: (registers, params) => {
                // SUB rd, rs, rt
                // rd <- rs - rt
                const rd = params.rd!;
                const rs = params.rs!;
                const rt = params.rt!;
                registers[rd].value = registers[rs].value - registers[rt].value;
            }
        }],
        ["addi", { format: 'I', type: "ALU", opcode: 0x08,
            run: (registers, params) => {
                // ADDI rt, rs, immediate
                // rt <- rs + immediate
                const rt = params.rt!;
                const rs = params.rs!;
                const immediate = params.immediate!;
                registers[rt].value = registers[rs].value + immediate;
            }
        }],
        ["addu", {}],
        ["subu", {}],
        ["addui", {}],
        ["mult", {}],
        ["multu", {}],
        ["mfhi", {}],
        ["mflo", {}],
        ["div", {}],
        ["move", {}],
        ["mul", {}],
        ["div", {}],
        ["lw", {}],
        ["sw", {}],
        ["la", {}],
    ]);

    private static copyInstruction(instruction: instruction): instruction {
        let copy: instruction = {};
        copy.format = instruction.format;
        copy.type = instruction.type;
        copy.opcode = instruction.opcode;
        copy.funct = instruction.funct;
        if (instruction.run) {
            copy.run = (registers: register[], params: params) => {
                instruction.run!(registers, params);
            };
        }
        return copy;
    }

    static getByName(name: string): instruction | undefined {
        const instruction = this.instructions.get(name);
        if (!instruction) return undefined;
        return this.copyInstruction(instruction);
    }

    static get(code: number): instruction | undefined {
        const opcode = this.getBits(code, 31, 26);

        let funct: number | undefined = undefined;
        if (opcode === 0x00) {
            funct = this.getBits(code, 5, 0);
        }

        let foundInstruction: instruction | undefined = undefined;

        this.instructions.forEach((instruction) => {
            if (foundInstruction) return;

            if (instruction.opcode === opcode) {
                if (funct !== undefined) {
                    if (instruction.funct === funct) {
                        foundInstruction = this.copyInstruction(instruction);
                    }
                } else {
                    if (!instruction.funct) {
                        foundInstruction = this.copyInstruction(instruction);
                    }
                }
            }
        });

        return foundInstruction;
    }

    static getFormat(format: string): Format | undefined {
        return this.formats.get(format);
    }

    private static getBits(word: word, to: number, from: number): word {
        return (word << (31 - to)) >>> (31 - to + from);
    }

}