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
        var instruction = Instructions.get(parts[0]);
        if (instruction) {
            switch (instruction.format) {
                case 'R':
                    if (parts.length !== 4)
                        throw new Error("");
                    this.assembleR(parts, instruction, registers, memory);
                    return;
                case 'I':
                    if (parts.length !== 4)
                        throw new Error("");
                    this.assembleI(parts, instruction, registers, memory);
                    return;
                case 'J':
                    if (parts.length !== 2)
                        throw new Error("");
                    this.assembleJ(parts, instruction, memory);
                    return;
                default:
                    console.error('Unrecognized instruction', parts.join(' '));
                    return;
            }
        }
        else {
            console.error('Unrecognized instruction', parts.join(' '));
        }
    };
    Assembler.prototype.assembleR = function (parts, instruction, registers, memory) {
        if (!registers.getByName(parts[1]))
            throw new Error("");
        var rd = registers.getByName(parts[1]);
        if (!registers.getByName(parts[2]))
            throw new Error("");
        var rs = registers.getByName(parts[2]);
        if (!registers.getByName(parts[3]))
            throw new Error("");
        var rt = registers.getByName(parts[3]);
        var binary = (instruction.opcode << 26) | (rs.number << 21) | (rt.number << 16) | (rd.number << 11) | (0x00 << 6) | instruction.funct;
        this.storeInstruction(binary, memory);
    };
    Assembler.prototype.assembleI = function (parts, instruction, registers, memory) {
        if (!registers.getByName(parts[1]))
            throw new Error("");
        var rt = registers.getByName(parts[1]);
        if (!registers.getByName(parts[2]))
            throw new Error("");
        var rs = registers.getByName(parts[2]);
        var immediate = Number(parts[3]);
        var binary = (instruction.opcode << 26) | (rs.number << 21) | (rt.number << 16) | immediate;
        this.storeInstruction(binary, memory);
    };
    Assembler.prototype.assembleJ = function (parts, instruction, memory) {
        var address = Number(parts[1]);
        var binary = (instruction.opcode << 26) | address;
        this.storeInstruction(binary, memory);
    };
    Assembler.prototype.assembleData = function (parts, memory, registers) {
        console.log("Data: ", parts);
    };
    Assembler.prototype.storeInstruction = function (instruction, memory) {
        memory.store(this.currentTextSegmentAddress, instruction);
        this.currentTextSegmentAddress += 4;
    };
    Assembler.prototype.storeData = function (data, memory) {
        memory.store(this.currentDataSegmentAddress, data);
        this.currentDataSegmentAddress += 4;
    };
    Assembler.directives = new Map([
        [".data", new DataDirective()],
        [".text", new TextDirective()]
    ]);
    return Assembler;
}());
export { Assembler };
