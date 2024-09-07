import {Memory, word} from "./Memory.js";
import {CPU} from "./CPU.js";
import {instruction, Instructions} from "./Instructions.js";
import {register, Registers} from "./Registers.js"

export type assembledInstruction =  {
    lineNumber: number,
    instruction: string,
    binary?: word,
    address?: word
}

export interface directive {
    handle(parts: string[], memory: Memory, registers: Registers, assembler: Assembler): void;
}

class DataDirective implements directive {
    handle(parts: string[], memory: Memory, registers: Registers, assembler: Assembler) {
        assembler.assembleData(parts, memory, registers);
    }
}

class TextDirective implements directive {
    handle(parts: string[], memory: Memory, registers: Registers, assembler: Assembler) {
        assembler.assembleInstruction(parts, memory, registers);
    }
}

export class Assembler {

    private currentDirective?: directive;
    private startTextSegmentAddress: word = 0x00400000;
    private startDataSegmentAddress: word = 0x10010000;
    private currentTextSegmentAddress: number = this.startTextSegmentAddress;
    private currentDataSegmentAddress: number = this.startDataSegmentAddress;

    private static directives: Map<string, directive> = new Map<string, directive>([
        [".data", new DataDirective()],
        [".text", new TextDirective()]
    ]);

    assemble(program: string, cpu: CPU) {
        const lines = program.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim().length > 0) {
                this.assembleLine(i + 1, lines[i], cpu);
            }
        }
    }

    private assembleLine(lineNumber: number, line: string, cpu: CPU) {

        const parts = line.split('#')[0].trim().replace(/,/g, '').split(/\s+/);
        if (parts.length === 0 || parts[0] === '') {
            return undefined;
        }

        let directive = Assembler.directives.get(parts[0]);
        if (directive) {
            this.currentDirective = directive;
        } else {
            if (this.currentDirective) {
                this.currentDirective.handle(parts, cpu.getMemory(), cpu.getRegisters(), this);
            }
        }

    }

    public assembleInstruction(parts: string[], memory: Memory, registers: Registers) {

        const instruction = Instructions.get(parts[0]);

        if (instruction) {

            switch(instruction.format) {
                case 'R':
                    if (parts.length !== 4) throw new Error(``);
                    this.assembleR(parts, instruction, registers, memory);
                    return;
                case 'I':
                    if (parts.length !== 4) throw new Error(``);
                    this.assembleI(parts, instruction, registers, memory);
                    return;
                case 'J':
                    if (parts.length !== 2) throw new Error(``);
                    this.assembleJ(parts, instruction, memory);
                    return;
                default:
                    console.error('Unrecognized instruction', parts.join(' '));
                    return;
            }

        } else {
            console.error('Unrecognized instruction', parts.join(' '));
        }

    }


    private assembleR(parts: string[], instruction: instruction, registers: Registers, memory: Memory) {

        if (!registers.getByName(parts[1])) throw new Error(``);
        const rd: register = registers.getByName(parts[1])!;

        if (!registers.getByName(parts[2])) throw new Error(``);
        const rs: register = registers.getByName(parts[2])!;

        if (!registers.getByName(parts[3])) throw new Error(``);
        const rt: register = registers.getByName(parts[3])!;

        const binary: word = (instruction.opcode! << 26) | (rs.number! << 21) | (rt.number! << 16) | (rd.number! << 11) | (0x00 << 6) | instruction.funct!;
        this.storeInstruction(binary, memory);
    }

    private assembleI(parts: string[], instruction: instruction, registers: Registers, memory: Memory) {

        if (!registers.getByName(parts[1])) throw new Error(``);
        const rt: register = registers.getByName(parts[1])!;

        if (!registers.getByName(parts[2])) throw new Error(``);
        const rs: register = registers.getByName(parts[2])!;

        const immediate: word = Number(parts[3]);

        const binary: word = (instruction.opcode! << 26) | (rs.number! << 21) | (rt.number! << 16) | immediate;
        this.storeInstruction(binary, memory);

    }

    private assembleJ(parts: string[], instruction: instruction, memory: Memory) {

        const address: word = Number(parts[1]);

        const binary: word = (instruction.opcode! << 26) | address;
        this.storeInstruction(binary, memory);

    }

    public assembleData(parts: string[], memory: Memory, registers: Registers) {

        console.log("Data: ", parts);

    }

    private storeInstruction(instruction: word, memory: Memory) {
        memory.store(this.currentTextSegmentAddress, instruction);
        this.currentTextSegmentAddress += 4;
    }

    private storeData(data: word, memory: Memory) {
        memory.store(this.currentDataSegmentAddress, data);
        this.currentDataSegmentAddress += 4;
    }

}