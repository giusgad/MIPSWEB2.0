var DataDirective = /** @class */ (function () {
    function DataDirective() {
    }
    DataDirective.prototype.assemble = function (parts, assembler) {
        assembler.assembleData(parts);
    };
    return DataDirective;
}());
var TextDirective = /** @class */ (function () {
    function TextDirective() {
    }
    TextDirective.prototype.assemble = function (parts, assembler) {
        assembler.assembleInstruction(parts);
    };
    return TextDirective;
}());
var Assembler = /** @class */ (function () {
    function Assembler(cpu) {
        this.assembledLines = [];
        this.directives = new Map([
            [".data", new DataDirective()],
            [".text", new TextDirective()]
        ]);
        this.directive = this.directives.get(".text");
        this.cpu = cpu;
    }
    Assembler.prototype.assemble = function (program) {
        this.reset();
        var lines = program.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.trim().length > 0) {
                this.assembleLine(i + 1, lines[i]);
            }
        }
        return this.assembledLines;
    };
    Assembler.prototype.assembleLine = function (lineNumber, line) {
        this.lineNumber = lineNumber;
        var parts = line.split('#')[0].trim().replace(/,/g, '').split(/\s+/);
        if (parts.length === 0 || parts[0] === '') {
            return undefined;
        }
        var directive = this.directives.get(parts[0]);
        if (directive) {
            this.directive = directive;
        }
        else {
            if (this.directive) {
                this.directive.assemble(parts, this);
            }
        }
    };
    Assembler.prototype.assembleData = function (parts) {
    };
    Assembler.prototype.assembleInstruction = function (parts) {
        var instructionSymbol = parts[0];
        var source = parts.join(' ');
        var instruction = this.cpu.instructionsSet.getBySymbol(instructionSymbol);
        if (!instruction)
            throw new Error("Instruction ".concat(source, " not found"));
        var format = this.cpu.getFormat(instruction.format);
        if (format) {
            var assembledInstruction = format.assemble(parts, instruction, this.cpu);
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
    };
    Assembler.prototype.reset = function () {
        this.assembledLines = [];
        this.lineNumber = undefined;
        this.directive = this.directives.get(".text");
    };
    return Assembler;
}());
export { Assembler };
