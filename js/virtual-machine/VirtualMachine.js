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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { Assembler } from "./Assembler.js";
import { CPU } from "./CPU.js";
var VirtualMachine = /** @class */ (function () {
    function VirtualMachine() {
        this.assembledLinesIndex = 0;
        this.cpu = new CPU();
        this.state = "edit";
    }
    VirtualMachine.prototype.getState = function () {
        return this.state;
    };
    VirtualMachine.prototype.assemble = function (program) {
        var assembler = new Assembler();
        assembler.assemble(program, this.cpu);
        this.assembledLines = assembler.getAssembledLines();
        if (this.assembledLines.length > 0) {
            this.nextInstructionLineNumber = this.assembledLines[this.assembledLinesIndex].lineNumber;
        }
        this.state = "execute";
    };
    VirtualMachine.prototype.stop = function () {
        this.assembledLines = [];
        this.assembledLinesIndex = 0;
        this.nextInstructionLineNumber = undefined;
        this.cpu.clear();
        this.state = "edit";
    };
    VirtualMachine.prototype.step = function () {
        if (this.assembledLinesIndex >= this.assembledLines.length)
            return;
        this.cpu.step();
        this.assembledLinesIndex++;
        if (this.assembledLinesIndex >= this.assembledLines.length) {
            this.nextInstructionLineNumber = undefined;
            return;
        }
        this.nextInstructionLineNumber = this.assembledLines[this.assembledLinesIndex].lineNumber;
    };
    VirtualMachine.prototype.run = function () {
        while (this.assembledLinesIndex < this.assembledLines.length) {
            this.step();
        }
    };
    VirtualMachine.prototype.getRegisters = function () {
        var cpuRegisters = this.cpu.getRegisters();
        var registers = cpuRegisters === null || cpuRegisters === void 0 ? void 0 : cpuRegisters.registers;
        if (registers) {
            return __spreadArray(__spreadArray([], registers.map(function (register) { return (__assign({}, register)); }), true), [
                __assign({}, cpuRegisters.pc),
                __assign({}, cpuRegisters.hi),
                __assign({}, cpuRegisters.lo)
            ], false);
        }
        else {
            return undefined;
        }
    };
    VirtualMachine.prototype.getMemory = function () {
        var cpuMemory = this.cpu.getMemory();
        var memory = cpuMemory.get();
        return memory;
    };
    VirtualMachine.prototype.getNextInstructionLineNumber = function () {
        return this.nextInstructionLineNumber;
    };
    return VirtualMachine;
}());
export { VirtualMachine };
