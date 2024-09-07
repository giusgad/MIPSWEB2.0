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
        return undefined;
    };
    VirtualMachine.prototype.assemble = function (program) {
        var assembler = new Assembler();
        assembler.assemble(program, this.cpu);
        this.state = "execute";
    };
    VirtualMachine.prototype.stop = function () {
        this.state = "edit";
    };
    return VirtualMachine;
}());
export { VirtualMachine };
