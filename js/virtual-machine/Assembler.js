class DataDirective {
    assemble(parts, assembler) {
        assembler.assembleData(parts);
    }
}
class TextDirective {
    assemble(parts, assembler) {
        assembler.assembleInstruction(parts);
    }
}
export class Assembler {
    constructor(cpu) {
        this.assembledLines = [];
        this.directives = new Map([
            [".data", new DataDirective()],
            [".text", new TextDirective()]
        ]);
        this.directive = this.directives.get(".text");
        this.cpu = cpu;
    }
    assemble(program) {
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
    assembleLine(lineNumber, line) {
        this.lineNumber = lineNumber;
        const parts = line.split('#')[0].trim().replace(/,/g, '').split(/\s+/);
        if (parts.length === 0 || parts[0] === '') {
            return undefined;
        }
        let directive = this.directives.get(parts[0]);
        if (directive) {
            this.directive = directive;
        }
        else {
            if (this.directive) {
                this.directive.assemble(parts, this);
            }
        }
    }
    assembleData(parts) {
    }
    assembleInstruction(parts) {
        const instructionSymbol = parts[0];
        const source = parts.join(' ');
        const instruction = this.cpu.instructionsSet.getBySymbol(instructionSymbol);
        if (!instruction)
            throw new Error(`Instruction ${source} not found`);
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
