import { I_Format, J_Format, R_Format } from "./InstructionsFormats.js";
import { instructionsSet } from "./instructionsSet.js";
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
        var _a;
        if ((_a = instructionsSet.get(name)) === null || _a === void 0 ? void 0 : _a.run) {
            return this.copyInstruction(instructionsSet.get(name));
        }
        else {
            return undefined;
        }
    };
    Instructions.get = function (code) {
        var _this = this;
        var opcode = this.getBits(code, 31, 26);
        var funct = undefined;
        if (opcode === 0x00) {
            funct = this.getBits(code, 5, 0);
        }
        var foundInstruction = undefined;
        instructionsSet.forEach(function (instruction) {
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
    return Instructions;
}());
export { Instructions };
