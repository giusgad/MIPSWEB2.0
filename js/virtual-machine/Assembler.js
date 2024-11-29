import { Binary } from "./Utils.js";
import { asciizDirective, asmDirective, byteDirective, spaceDirective, wordDirective } from "./Directives.js";
export class Assembler {
    constructor(cpu) {
        this.labels = new Map();
        this.section = ".text";
        this.directives = new Map([
            [".asm", new asmDirective()],
            [".word", new wordDirective()],
            [".byte", new byteDirective()],
            [".space", new spaceDirective()],
            [".asciiz", new asciizDirective()],
        ]);
        this.directive = this.directives.get(".asm");
        this.addressLineMap = new Map();
        this.cpu = cpu;
        this.textSegmentAddress = new Binary(this.cpu.textSegmentStart.getValue());
        this.dataSegmentAddress = new Binary(this.cpu.dataSegmentStart.getValue());
    }
    assemble(program, withLabels = false) {
        const lines = program.split('\n');
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (line === '' || line.startsWith('#'))
                continue;
            let tokens = this.tokenize(line);
            if (tokens.length === 0)
                continue;
            if (tokens[0] === '.text') {
                this.section = ".text";
                this.directive = this.directives.get(".asm");
                this.textSegmentAddress.set(this.cpu.textSegmentEnd.getValue());
                continue;
            }
            else if (tokens[0] === '.data') {
                this.section = ".data";
                this.directive = this.directives.get(".word");
                this.dataSegmentAddress.set(this.cpu.dataSegmentEnd.getValue());
                continue;
            }
            if (tokens[0].endsWith(':')) {
                const label = tokens[0].slice(0, -1);
                if (!withLabels) {
                    if (this.labels.has(label)) {
                        throw new Error(`Duplicate label: ${label}`);
                    }
                    if (this.section === ".text") {
                        this.labels.set(label, new Binary(this.textSegmentAddress.getValue()));
                    }
                    else {
                        this.labels.set(label, new Binary(this.dataSegmentAddress.getValue()));
                    }
                }
                tokens.shift();
                if (tokens.length === 0)
                    continue;
            }
            if (tokens[0] === ".globl")
                continue;
            const directive = this.directives.get(tokens[0]);
            if (directive) {
                this.directive = directive;
                tokens.shift();
            }
            tokens = this.directive.tokenize(tokens);
            if (withLabels) {
                if (this.section === ".text") {
                    this.directive.assemble(tokens, this.textSegmentAddress, this, i + 1);
                }
                else {
                    this.directive.assemble(tokens, this.dataSegmentAddress, this, i + 1);
                }
            }
            else {
                if (this.section === ".text") {
                    this.textSegmentAddress.set(this.textSegmentAddress.getValue() + 4);
                }
                else {
                    this.dataSegmentAddress.set(this.dataSegmentAddress.getValue() + this.directive.size(tokens));
                }
            }
        }
        if (withLabels) {
            this.cpu.textSegmentEnd.set(this.textSegmentAddress.getValue());
            this.cpu.dataSegmentEnd.set(this.dataSegmentAddress.getValue());
        }
        else {
            this.textSegmentAddress = new Binary(this.cpu.textSegmentStart.getValue());
            this.dataSegmentAddress = new Binary(this.cpu.dataSegmentStart.getValue());
            this.section = ".text";
            this.directive = this.directives.get(".asm");
            this.assemble(program, true);
        }
    }
    assembleInstruction(tokens) {
        const symbol = tokens[0];
        if (symbol.toLowerCase() === "nop")
            return new Binary();
        const instruction = this.cpu.instructionsSet.getBySymbol(symbol);
        if (!instruction) {
            throw new Error(`Instruction ${tokens[0].toUpperCase()} not found`);
        }
        const format = this.cpu.getFormat(instruction.format);
        if (!format) {
            throw new Error(`Format ${instruction.format} for instruction ${tokens.join(' ')}`);
        }
        const code = format.assemble(tokens, instruction, this.cpu, this);
        return code;
    }
    resolveLabel(token) {
        if (!isNaN(Number(token))) {
            return Number(token);
        }
        const labelAddress = this.labels.get(token);
        if (!labelAddress) {
            throw new Error(`Label ${token} non trovata.`);
        }
        return ((labelAddress.getValue() - (this.textSegmentAddress.getValue() + 4)) >> 2);
    }
    tokenize(line) {
        line = line.split('#')[0].trim();
        return line.match(/"([^"]*)"|'([^']*)'|\S+/g) || [];
    }
    reset() {
        this.labels.clear();
        this.cpu.reset();
        this.textSegmentAddress = new Binary(this.cpu.textSegmentStart.getValue());
        this.dataSegmentAddress = new Binary(this.cpu.dataSegmentStart.getValue());
        this.section = ".text";
        this.directive = this.directives.get(".asm");
        this.addressLineMap.clear();
    }
}
