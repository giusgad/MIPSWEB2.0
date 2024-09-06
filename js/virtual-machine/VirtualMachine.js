import { Assembler } from "./Assembler.js";
import { CPU } from "./CPU.js";
var VirtualMachine = /** @class */ (function () {
    function VirtualMachine() {
        this.cpu = new CPU();
        this.state = "edit";
    }
    VirtualMachine.prototype.getState = function () {
        return this.state;
    };
    VirtualMachine.prototype.getNextInstructionLineNumber = function () {
        return this.nextInstructionLineNumber;
    };
    VirtualMachine.prototype.assemble = function (program) {
        var assembler = new Assembler();
        this.assembledInstructions = assembler.assemble(program, this.cpu.getMemory(), this.cpu.getRegisters());
        if (this.assembledInstructions.length > 0) {
            this.nextInstructionLineNumber = this.assembledInstructions[0].lineNumber;
        }
        this.state = "execute";
    };
    VirtualMachine.prototype.stop = function () {
        this.state = "edit";
    };
    return VirtualMachine;
}());
export { VirtualMachine };
