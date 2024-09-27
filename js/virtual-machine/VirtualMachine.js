import { Assembler } from "./Assembler.js";
var VirtualMachine = /** @class */ (function () {
    function VirtualMachine(cpu) {
        this.assembledLinesIndex = 0;
        this.cpu = cpu;
        this.assembler = new Assembler(cpu);
        this.isRunning = false;
        this.state = "edit";
    }
    VirtualMachine.prototype.assemble = function (program) {
        this.assembledLines = this.assembler.assemble(program);
        if (this.assembledLines.length > 0) {
            this.nextInstructionLineNumber = this.assembledLines[this.assembledLinesIndex].lineNumber;
        }
        this.state = "execute";
    };
    VirtualMachine.prototype.run = function () {
        this.isRunning = true;
        while (this.isRunning && !this.cpu.isHalted()) {
            this.step();
        }
    };
    VirtualMachine.prototype.step = function () {
        if (!this.cpu.isHalted()) {
            this.cpu.execute();
            this.assembledLinesIndex++;
            if (this.assembledLinesIndex >= this.assembledLines.length) {
                this.nextInstructionLineNumber = undefined;
            }
            else {
                this.nextInstructionLineNumber = this.assembledLines[this.assembledLinesIndex].lineNumber;
            }
        }
        else {
            this.pause();
        }
    };
    VirtualMachine.prototype.pause = function () {
        this.isRunning = false;
    };
    VirtualMachine.prototype.stop = function () {
        this.pause();
        this.cpu.reset();
        this.nextInstructionLineNumber = undefined;
        this.assembledLinesIndex = 0;
        this.assembledLines = [];
        this.state = "edit";
    };
    VirtualMachine.prototype.getRegisters = function () {
        var registers = [];
        for (var _i = 0, _a = this.cpu.getRegisters(); _i < _a.length; _i++) {
            var register = _a[_i];
            registers.push({ name: register.name, number: register.number, value: register.value });
        }
        registers.push({ name: "pc", value: this.cpu.pc });
        registers.push({ name: "hi", value: this.cpu.hi });
        registers.push({ name: "lo", value: this.cpu.lo });
        return registers;
    };
    VirtualMachine.prototype.getMemory = function () {
        return Array.from(this.cpu.getMemory().entries()).map(function (_a) {
            var address = _a[0], value = _a[1];
            return ({
                address: address,
                value: value
            });
        });
    };
    return VirtualMachine;
}());
export { VirtualMachine };
