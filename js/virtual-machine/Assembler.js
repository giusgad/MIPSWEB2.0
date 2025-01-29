import { Binary } from "./Utils.js";
import { asciizDirective, asmDirective, byteDirective, globlDirective, spaceDirective, wordDirective } from "./Directives.js";
export class Assembler {
    constructor(cpu) {
        this.directives = new Map([
            [".asm", new asmDirective()],
            [".word", new wordDirective()],
            [".globl", new globlDirective()],
            [".asciiz", new asciizDirective()],
            [".byte", new byteDirective()],
            [".space", new spaceDirective()]
        ]);
        this.dataSegmentStart = new Binary(0x10010000);
        this.dataSegmentEnd = new Binary(this.dataSegmentStart.getValue());
        this.textSegmentStart = new Binary(0x00400000);
        this.textSegmentEnd = new Binary(this.textSegmentStart.getValue());
        this.addressEditorsPositions = new Map();
        this.allLabels = new Map();
        this.cpu = cpu;
    }
    assembleFiles(files) {
        this.reset();
        const globals = new Map();
        const labels = new Map();
        for (const file of files) {
            labels.set(file.id, new Map());
            this.assembleFile(file, globals, labels.get(file.id));
        }
        this.dataSegmentEnd.set(this.dataSegmentStart.getValue());
        this.textSegmentEnd.set(this.textSegmentStart.getValue());
        for (const file of files) {
            this.assembleFile(file, globals, labels.get(file.id), true);
        }
        this.cpu.registers.get("$gp").binary = new Binary(0x10008000);
        this.cpu.registers.get("$sp").binary = new Binary(0x7fffeffc);
        if (globals.has("main")) {
            this.cpu.pc.set(globals.get("main").getValue());
        }
        else {
            this.cpu.pc.set(this.textSegmentStart.getValue());
        }
        const allLabels = new Map();
        labels.forEach((value, key) => {
            value.forEach((value, key) => {
                if (value) {
                    allLabels.set(key, value);
                }
            });
        });
        this.allLabels = allLabels;
    }
    assembleFile(file, globals, labels, withLabels = false) {
        let section = ".text";
        let directive = this.directives.get(".asm");
        let address = new Binary(this.textSegmentEnd.getValue());
        const lines = file.content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;
            if (line === '' || line.startsWith('#'))
                continue;
            let tokens = this.tokenize(line);
            if (tokens.length === 0)
                continue;
            if (tokens[0] === '.data') {
                section = '.data';
                directive = this.directives.get(".word");
                address = new Binary(this.dataSegmentEnd.getValue());
                continue;
            }
            else if (tokens[0] === '.text') {
                section = '.text';
                directive = this.directives.get(".asm");
                address = new Binary(this.textSegmentEnd.getValue());
                continue;
            }
            if (tokens[0].endsWith(':')) {
                const label = tokens[0].slice(0, -1);
                labels.set(label, new Binary(address.getValue()));
                if (!withLabels) {
                    if (globals.has(label)) {
                        if (globals.get(label) === undefined) {
                            globals.set(label, new Binary(address.getValue()));
                        }
                        else {
                            throw new Error(`Label ${label} already defined`);
                        }
                    }
                }
                tokens.shift();
                if (tokens.length === 0)
                    continue;
            }
            if (this.directives.get(tokens[0])) {
                directive = this.directives.get(tokens[0]);
                tokens.shift();
                if ((directive instanceof globlDirective) && (!withLabels)) {
                    directive.assemble(directive.tokenize(tokens), globals, labels, address, this, { fileId: file.id, lineNumber: lineNumber });
                }
            }
            if (withLabels) {
                if (!(directive instanceof globlDirective)) {
                    directive.assemble(directive.tokenize(tokens), globals, labels, address, this, { fileId: file.id, lineNumber: lineNumber });
                }
            }
            else {
                address.set(address.getValue() + directive.size(tokens));
            }
            if (section === '.data') {
                this.dataSegmentEnd.set(address.getValue());
                directive = this.directives.get(".word");
            }
            else if (section === '.text') {
                this.textSegmentEnd.set(address.getValue());
                directive = this.directives.get(".asm");
            }
        }
        globals.forEach((value, key) => {
            if (value === undefined) {
                globals.delete(key);
            }
        });
    }
    assembleInstruction(tokens, globals, labels, address) {
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
        const code = format.assemble(tokens, instruction, this.cpu, this, globals, labels, address);
        return code;
    }
    resolveLabel(token, globals, labels, address, absolute = false) {
        if (!isNaN(Number(token))) {
            return Number(token);
        }
        let labelAddress = undefined;
        if (labels.has(token)) {
            if (labels.get(token)) {
                labelAddress = labels.get(token);
            }
            else {
                if (globals.has(token)) {
                    labelAddress = globals.get(token);
                }
            }
        }
        if (labelAddress === undefined) {
            throw new Error(`Label ${token} not found`);
        }
        if (absolute) {
            return (labelAddress.getValue() >>> 2) & 0x03FFFFFF;
        }
        else {
            return ((labelAddress.getValue() - (address.getValue() + 4)) >> 2);
        }
    }
    tokenize(line) {
        line = line.split('#')[0].trim();
        return line.match(/"([^"]*)"|'([^']*)'|\S+/g) || [];
    }
    reset() {
        this.cpu.reset();
        this.dataSegmentEnd.set(this.dataSegmentStart.getValue());
        this.textSegmentEnd.set(this.textSegmentStart.getValue());
        this.addressEditorsPositions = new Map();
        this.allLabels = new Map();
    }
}
