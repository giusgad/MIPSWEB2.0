import { I_Format, J_Format, R_Format } from "./InstructionsFormats.js";
var Instructions = /** @class */ (function () {
    function Instructions() {
    }
    Instructions.copyInstruction = function (instruction) {
        var copy = {};
        copy.format = instruction.format;
        copy.type = instruction.type;
        copy.opcode = instruction.opcode;
        copy.funct = instruction.funct;
        if (instruction.run) {
            copy.run = function (registers, params) {
                instruction.run(registers, params);
            };
        }
        return copy;
    };
    Instructions.getByName = function (name) {
        var instruction = this.instructions.get(name);
        if (!instruction)
            return undefined;
        return this.copyInstruction(instruction);
    };
    Instructions.get = function (code) {
        var _this = this;
        var opcode = this.getBits(code, 31, 26);
        var funct = undefined;
        if (opcode === 0x00) {
            funct = this.getBits(code, 5, 0);
        }
        var foundInstruction = undefined;
        this.instructions.forEach(function (instruction) {
            if (foundInstruction)
                return;
            if (instruction.opcode === opcode) {
                if (funct !== undefined) {
                    if (instruction.funct === funct) {
                        foundInstruction = _this.copyInstruction(instruction);
                    }
                }
                else {
                    if (!instruction.funct) {
                        foundInstruction = _this.copyInstruction(instruction);
                    }
                }
            }
        });
        return foundInstruction;
    };
    Instructions.getFormat = function (format) {
        return this.formats.get(format);
    };
    Instructions.getBits = function (word, to, from) {
        return (word << (31 - to)) >>> (31 - to + from);
    };
    Instructions.formats = new Map([
        ['R', new R_Format()],
        ['I', new I_Format()],
        ['J', new J_Format()]
    ]);
    Instructions.instructions = new Map([
        ["add", { format: 'R', type: "ALU", opcode: 0x00, funct: 0x20,
                run: function (registers, params) {
                    // ADD rd, rs, rt
                    // rd <- rs + rt
                    var rd = params.rd;
                    var rs = params.rs;
                    var rt = params.rt;
                    registers[rd].value = registers[rs].value + registers[rt].value;
                }
            }],
        ["sub", { format: 'R', type: "ALU", opcode: 0x00, funct: 0x22,
                run: function (registers, params) {
                    // SUB rd, rs, rt
                    // rd <- rs - rt
                    var rd = params.rd;
                    var rs = params.rs;
                    var rt = params.rt;
                    registers[rd].value = registers[rs].value - registers[rt].value;
                }
            }],
        ["addi", { format: 'I', type: "ALU", opcode: 0x08,
                run: function (registers, params) {
                    // ADDI rt, rs, immediate
                    // rt <- rs + immediate
                    var rt = params.rt;
                    var rs = params.rs;
                    var immediate = params.immediate;
                    registers[rt].value = registers[rs].value + immediate;
                }
            }],
        ["addu", {}],
        ["subu", {}],
        ["addui", {}],
        ["mult", {}],
        ["multu", {}],
        ["mfhi", {}],
        ["mflo", {}],
        ["div", {}],
        ["move", {}],
        ["mul", {}],
        ["div", {}],
        ["lw", {}],
        ["sw", {}],
        ["la", {}],
    ]);
    return Instructions;
}());
export { Instructions };
