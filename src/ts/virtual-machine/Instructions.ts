import {word} from "./Memory.js";
import {register} from "./Registers.js";
import {Format, I_Format, J_Format, params, R_Format} from "./InstructionsFormats.js";
import {instruction, instructionsSet} from "./instructionsSet.js";

export class Instructions {

    private static formats: Map<string, Format> = new Map([
        ['R', new R_Format()],
        ['I', new I_Format()],
        ['J', new J_Format()]
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
        if (instructionsSet.get(name)?.run) {
            return this.copyInstruction(instructionsSet.get(name)!);
        } else {
            return undefined;
        }
    }

    static get(code: number): instruction | undefined {
        const opcode = this.getBits(code, 31, 26);

        let funct: number | undefined = undefined;
        if (opcode === 0x00) {
            funct = this.getBits(code, 5, 0);
        }

        let foundInstruction: instruction | undefined = undefined;

        instructionsSet.forEach((instruction) => {
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