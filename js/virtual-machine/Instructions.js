var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var Instructions = /** @class */ (function () {
    function Instructions() {
    }
    Instructions.get = function (name) {
        var instruction = this.instructions.get(name);
        if (!instruction) {
            return undefined;
        }
        var copy = {};
        if (instruction.format) {
            copy.format = instruction.format;
        }
        if (instruction.type) {
            copy.type = instruction.type;
        }
        if (instruction.opcode) {
            copy.opcode = instruction.opcode;
        }
        if (instruction.funct) {
            copy.funct = instruction.funct;
        }
        if (instruction.run) {
            copy.run = function (registers) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                instruction.run.apply(instruction, __spreadArray([registers], args, false));
            };
        }
        return copy;
    };
    Instructions.instructions = new Map([
        ["add", { format: 'R', type: "ALU", opcode: 0x00, funct: 0x20,
                run: function (registers, rs, rt, rd) {
                }
            }],
        ["sub", { format: 'R', type: "ALU", opcode: 0x00, funct: 0x22,
                run: function (registers, rs, rt, rd) {
                }
            }],
        ["addi", { format: 'I', type: "ALU", opcode: 0x08,
                run: function (registers, rs, rt, immediate) {
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
