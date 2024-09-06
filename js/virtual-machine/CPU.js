import { Memory } from "./Memory.js";
import { Registers } from "./Registers.js";
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
    return CPU;
}());
export { CPU };
