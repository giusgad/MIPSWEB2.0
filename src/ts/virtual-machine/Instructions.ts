import {word} from "./Memory.js";

export type instruction = {
    format?: 'R' | 'I' | 'J';
    type?: "ALU" | "LOAD" | "STORE" | "BRANCH" | "JUMP";
    opcode?: word;
    funct?: word;
    run?: () => void;
}

export class Instructions {

    private static instructions: Map<string, instruction> = new Map<string, instruction>([
        ["add", { format: 'R', type: "ALU", opcode: 0x00, funct: 0x20,
            run: () => {

            }
        }],
        ["sub", { format: 'R', type: "ALU", opcode: 0x00, funct: 0x22,
            run: () => {

            }
        }],
        ["addi", { format: 'I', type: "ALU", opcode: 0x08,
            run: () => {

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

    static get(name: string): instruction | undefined {
        const instruction = this.instructions.get(name);
        if (!instruction) {
            return undefined;
        }
        let copy: instruction = {};
        if (instruction.format) {
            copy.format = instruction.format;
        }
        if (instruction.type) {
            copy.type = instruction.type;
        }
        if (instruction.opcode) {
            copy.opcode = instruction.opcode;
        }
        if (instruction.funct) {
            copy.funct = instruction.funct;
        }
        if (instruction.run) {
            copy.run = () => {
                instruction.run!();
            };
        }
        return copy;
    }

    /*
    static getByFunct(funct: word): instruction {
        for(const instructionName of this.instructions.keys()) {
            const instruction = this.instructions.get(instructionName)!;
            if (instruction.funct === funct) {
                if (instruction.opcode !== 0x00) throw new Error(``);
                return instruction;
            }
        }
        throw new Error(``);
    }

    static getByOpcode(opcode: word): instruction {
        if (opcode === 0x00) throw new Error(``);
        for(const instructionName of this.instructions.keys()) {
            const instruction = this.instructions.get(instructionName)!;
            if (instruction.opcode === opcode) {
                return instruction;
            }
        }
        throw new Error(``);
    }
     */

}