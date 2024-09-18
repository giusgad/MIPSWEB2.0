var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
    CPU.prototype.getPc = function () {
        return this.registers.pc;
    };
    CPU.prototype.getHi = function () {
        return this.registers.hi;
    };
    CPU.prototype.getLo = function () {
        return this.registers.lo;
    };
    CPU.prototype.clear = function () {
        this.registers.clear();
        this.memory.clear();
    };
    CPU.prototype.step = function () {
        var _a;
        var pc = this.registers.pc;
        if (pc) {
            var code = this.memory.fetch(pc.value);
            if (code === undefined)
                return;
            var instruction = (_a = Instructions.get(code)) === null || _a === void 0 ? void 0 : _a.instruction;
            if (instruction) {
                var formatHandler = Instructions.getFormat(instruction.format);
                if (formatHandler) {
                    var params = formatHandler.disassemble(code, instruction);
                    params = __assign(__assign({}, params), { pc: pc, hi: this.getHi(), lo: this.getLo() });
                    instruction.run(this.getRegisters().registers, params);
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
