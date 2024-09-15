import { Instructions } from "./Instructions.js";
var DataDirective = /** @class */ (function () {
    function DataDirective() {
    }
    DataDirective.prototype.handle = function (parts, memory, registers, assembler) {
        assembler.assembleData(parts, memory, registers);
    };
    return DataDirective;
}());
var TextDirective = /** @class */ (function () {
    function TextDirective() {
    }
    TextDirective.prototype.handle = function (parts, memory, registers, assembler) {
        assembler.assembleInstruction(parts, memory, registers);
    };
    return TextDirective;
}());
var Assembler = /** @class */ (function () {
    function Assembler() {
        this.startTextSegmentAddress = 0x00400000;
        this.startDataSegmentAddress = 0x10010000;
        this.currentTextSegmentAddress = this.startTextSegmentAddress;
        this.currentDataSegmentAddress = this.startDataSegmentAddress;
        this.assembledLines = [];
        this.currentLineNumber = undefined;
    }
    Assembler.prototype.assemble = function (program, cpu) {
        var lines = program.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.trim().length > 0) {
                this.assembleLine(i + 1, lines[i], cpu);
            }
        }
    };
    Assembler.prototype.assembleLine = function (lineNumber, line, cpu) {
        this.currentLineNumber = lineNumber;
        var parts = line.split('#')[0].trim().replace(/,/g, '').split(/\s+/);
        if (parts.length === 0 || parts[0] === '') {
            return undefined;
        }
        var directive = Assembler.directives.get(parts[0]);
        if (directive) {
            this.currentDirective = directive;
        }
        else {
            if (this.currentDirective) {
                this.currentDirective.handle(parts, cpu.getMemory(), cpu.getRegisters(), this);
            }
        }
    };
    Assembler.prototype.assembleInstruction = function (parts, memory, registers) {
        var instruction = Instructions.getByName(parts[0]);
        if (instruction) {
            var format = Instructions.getFormat(instruction.format);
            if (format) {
                var source = parts.join(' ');
                var assembledInstruction = format.assemble(parts, instruction, registers);
                this.storeInstruction(source, assembledInstruction.basic, assembledInstruction.code, memory);
            }
        }
        else {
            console.error('Unrecognized instruction: \n', parts.join(' '));
        }
    };
    Assembler.prototype.storeInstruction = function (source, basic, code, memory) {
        memory.store(this.currentTextSegmentAddress, code);
        this.addAssembledLine(this.currentLineNumber, source, basic, code, this.currentTextSegmentAddress);
        this.currentTextSegmentAddress += 4;
    };
    Assembler.prototype.assembleData = function (parts, memory, registers) {
        console.error("Data to assemble: \n", parts.join(' '));
    };
    Assembler.prototype.storeData = function (source, data, memory) {
        memory.store(this.currentDataSegmentAddress, data);
        this.currentDataSegmentAddress += 4;
    };
    Assembler.prototype.addAssembledLine = function (currentLineNumber, source, basic, code, address) {
        if (currentLineNumber !== undefined) {
            this.assembledLines.push({
                lineNumber: currentLineNumber,
                source: source,
                basic: basic,
                code: '0x' + code.toString(16).padStart(8, '0'),
                address: '0x' + address.toString(16).padStart(8, '0')
            });
        }
    };
    Assembler.prototype.getAssembledLines = function () {
        return this.assembledLines;
    };
    Assembler.directives = new Map([
        [".data", new DataDirective()],
        [".text", new TextDirective()]
    ]);
    return Assembler;
}());
export { Assembler };
