import {Memory, word} from "./Memory.js";
import {Registers} from "./Registers.js";

export type assembledInstruction =  {
    lineNumber: number,
    instruction: string,
    binary?: word,
    address?: word
}

export class Assembler {

    assemble(program: string, memory: Memory, registers: Registers) {
        const lines = program.split('\n');
        const assembledInstructions: assembledInstruction[] = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim().length > 0) {
                const assembledInstruction = this.assembleLine(i+1, lines[i], memory, registers);
                if (assembledInstruction) {
                    console.log(assembledInstruction);
                    assembledInstructions.push(assembledInstruction);
                }
            }
        }
        return assembledInstructions;
    }


    private assembleLine(lineNumber: number, line: string, memory: Memory, registers: Registers) {

        const parts = line.split('#')[0].trim().replace(/,/g, '').split(/\s+/);
        if (parts.length === 0 || parts[0] === '') {
            return undefined;
        }



        return {
            lineNumber: lineNumber,
            instruction: parts.join(' '),
            binary: 0,
            address: 0
        };
    }
}