import { Memory } from "./Memory.js";
import { Registers } from "./Registers.js";
import { Instructions } from "./Instructions.js";
var CPU = /** @class */ (function () {
    function CPU() {
        this.memory = new Memory();
        this.registers = new Registers();
    }
    CPU.prototype.getMemory = function () {
        return this.memory;
    };
    CPU.prototype.getRegisters = function () {
        return this.registers;
    };
    CPU.prototype.clear = function () {
        this.registers.clear();
        this.memory.clear();
    };
    CPU.prototype.step = function () {
        var pc = this.registers.pc;
        if (pc) {
            var code = this.memory.fetch(pc.value);
            if (code === undefined)
                return;
            var instruction = Instructions.get(code);
            if (instruction) {
                var formatHandler = Instructions.getFormat(instruction.format);
                if (formatHandler) {
                    var params = formatHandler.disassemble(code, instruction);
                    instruction.run(this.registers.registers, params);
                    pc.value += 4;
                }
                else {
                    console.error('Unrecognized instruction format:', instruction.format);
                }
            }
            else {
                console.error('Unknown instruction code:', code);
            }
        }
    };
    return CPU;
}());
export { CPU };
