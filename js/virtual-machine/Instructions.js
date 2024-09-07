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
            copy.run = function () {
                instruction.run();
            };
        }
        return copy;
    };
    Instructions.instructions = new Map([
        ["add", { format: 'R', type: "ALU", opcode: 0x00, funct: 0x20,
                run: function () {
                }
            }],
        ["sub", { format: 'R', type: "ALU", opcode: 0x00, funct: 0x22,
                run: function () {
                }
            }],
        ["addi", { format: 'I', type: "ALU", opcode: 0x08,
                run: function () {
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
