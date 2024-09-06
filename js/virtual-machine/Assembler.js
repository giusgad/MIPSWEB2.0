var Assembler = /** @class */ (function () {
    function Assembler() {
    }
    Assembler.prototype.assemble = function (program, memory, registers) {
        var lines = program.split('\n');
        var assembledInstructions = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.trim().length > 0) {
                var assembledInstruction = this.assembleLine(i + 1, lines[i], memory, registers);
                if (assembledInstruction) {
                    //console.log(assembledInstruction);
                    assembledInstructions.push(assembledInstruction);
                }
            }
        }
        return assembledInstructions;
    };
    Assembler.prototype.assembleLine = function (lineNumber, line, memory, registers) {
        var parts = line.split('#')[0].trim().replace(/,/g, '').split(/\s+/);
        if (parts.length === 0 || parts[0] === '') {
            return undefined;
        }
        return {
            lineNumber: lineNumber,
            instruction: parts.join(' '),
            binary: 0,
            address: 0
        };
    };
    return Assembler;
}());
export { Assembler };
