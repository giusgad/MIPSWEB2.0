import {Memory, word} from "./Memory.js";
import {CPU} from "./CPU.js";
import {Instructions} from "./Instructions.js";
import {Registers} from "./Registers.js"

export type assembledLine =  {
    lineNumber: number,
    source: string,
    basic: string,
    code: string,
    address: string
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
    private assembledLines: assembledLine[] = [];
    private currentLineNumber?: number = undefined;

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

        this.currentLineNumber = lineNumber;

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

        const instruction = Instructions.getByName(parts[0]);

        if (instruction) {

            const format = Instructions.getFormat(instruction.format!);
            if (format) {
                const source: string = parts.join(' ');
                const assembledInstruction = format.assemble(parts, instruction, registers);
                this.storeInstruction(source, assembledInstruction.basic, assembledInstruction.code, memory);
            }

        } else {
            console.error('Unrecognized instruction: \n', parts.join(' '));
        }

    }

    private storeInstruction(source: string, basic: string, code: word, memory: Memory) {
        memory.store(this.currentTextSegmentAddress, code);

        this.addAssembledLine(this.currentLineNumber, source, basic, code, this.currentTextSegmentAddress);

        this.currentTextSegmentAddress += 4;
    }

    public assembleData(parts: string[], memory: Memory, registers: Registers) {

        console.error("Data to assemble: \n", parts.join(' '));

    }

    private storeData(source: string, data: word, memory: Memory) {
        memory.store(this.currentDataSegmentAddress, data);
        this.currentDataSegmentAddress += 4;
    }

    addAssembledLine(currentLineNumber: number | undefined, source: string, basic: string, code: word, address: word) {
        if (currentLineNumber !== undefined) {
            this.assembledLines.push({
                lineNumber: currentLineNumber,
                source: source,
                basic: basic,
                code: '0x' + code.toString(16).padStart(8, '0'),
                address: '0x' + address.toString(16).padStart(8, '0')
            });
        }
    }

    getAssembledLines() {
        return this.assembledLines;
    }
}