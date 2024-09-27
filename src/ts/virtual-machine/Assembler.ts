import {CPU} from "./CPU.js";
import {AssembledLine} from "./VirtualMachine.js";

export interface Directive {
    assemble(parts: string[], assembler: Assembler): void;
}

class DataDirective implements Directive {
    assemble(parts: string[], assembler: Assembler) {
        assembler.assembleData(parts);
    }
}

class TextDirective implements Directive {
    assemble(parts: string[], assembler: Assembler) {
        assembler.assembleInstruction(parts);
    }
}

export class Assembler {

    cpu: CPU;

    assembledLines: AssembledLine[] = [];

    lineNumber?: number;

    directives: Map<string, Directive> = new Map<string, Directive>([
        [".data", new DataDirective()],
        [".text", new TextDirective()]
    ]);

    directive?: Directive = this.directives.get(".text");

    constructor(cpu: CPU) {
        this.cpu = cpu;
    }

    assemble(program: string): AssembledLine[] {
        this.reset();
        const lines = program.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim().length > 0) {
                this.assembleLine(i + 1, lines[i]);
            }
        }
        return this.assembledLines;
    }

    assembleLine(lineNumber: number, line: string) {
        this.lineNumber = lineNumber;
        const parts = line.split('#')[0].trim().replace(/,/g, '').split(/\s+/);
        if (parts.length === 0 || parts[0] === '') {
            return undefined;
        }
        let directive = this.directives.get(parts[0]);
        if (directive) {
            this.directive = directive;
        } else {
            if (this.directive) {
                this.directive.assemble(parts, this);
            }
        }
    }

    assembleData(parts: string[]) {

    }

    assembleInstruction(parts: string[]) {
        const instructionSymbol = parts[0];
        const source = parts.join(' ');
        const instruction = this.cpu.instructionsSet.getBySymbol(instructionSymbol);
        if (!instruction) throw  new Error(`Instruction ${source} not found`);
        const format = this.cpu.getFormat(instruction.format);
        if (format) {
            const assembledInstruction = format.assemble(parts, instruction, this.cpu);
            if (this.lineNumber !== undefined) {
                this.assembledLines.push({
                    lineNumber: this.lineNumber,
                    source: source,
                    basic: assembledInstruction.basic,
                    code: '0x' + assembledInstruction.code.toString(16).padStart(8, '0'),
                    address: '0x' + this.cpu.textAddress.toString(16).padStart(8, '0')
                });
            }
            this.cpu.storeInstruction(assembledInstruction.code);
        }
    }

    reset() {
        this.assembledLines = [];
        this.lineNumber = undefined;
        this.directive = this.directives.get(".text");
    }

}
