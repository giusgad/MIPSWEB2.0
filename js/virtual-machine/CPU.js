import { Memory } from "./Memory.js";
import { Utils } from "./Utils.js";
import { Registers } from "./Registers.js";
import { InstructionsSet } from "./InstructionsSet.js";
import { I_Format, J_Format, R_Format } from "./Formats.js";
var CPU = /** @class */ (function () {
    function CPU() {
        this.memory = new Memory();
        this.textStartingAddress = 0x00400000;
        this.textAddress = this.textStartingAddress;
        this.textEndingAddress = this.textStartingAddress;
        this.dataStartingAddress = 0x10010000;
        this.dataAddress = this.dataStartingAddress;
        this.registers = new Registers([
            "$zero",
            "$at",
            "$v0", "$v1",
            "$a0", "$a1", "$a2", "$a3",
            "$t0", "$t1", "$t2", "$t3", "$t4", "$t5", "$t6", "$t7",
            "$s0", "$s1", "$s2", "$s3", "$s4", "$s5", "$s6", "$s7",
            "$t8", "$t9",
            "$k0", "$k1",
            "$gp",
            "$sp",
            "$fp",
            "$ra"
        ]);
        this.pc = this.textStartingAddress;
        this.lo = 0x00000000;
        this.hi = 0x00000000;
        this.instructionsSet = new InstructionsSet();
        this.formats = new Map();
        this.instructionBytesLength = 4;
        this.endianness = "big";
        this.halted = false;
        this.registers.get("$gp").value = 0x10008000;
        this.registers.get("$sp").value = 0x7fffeffc;
        this.formats.set('R', new R_Format());
        this.formats.set('I', new I_Format());
        this.formats.set('J', new J_Format());
    }
    CPU.prototype.fetch = function () {
        var word = this.memory.fetch(this.pc);
        if (word) {
            return word;
        }
        else {
            return 0x00000000;
        }
    };
    CPU.prototype.decode = function (instructionCode) {
        var _a;
        return (_a = this.getInstructionByCode(instructionCode)) === null || _a === void 0 ? void 0 : _a.instruction;
    };
    CPU.prototype.execute = function () {
        if (this.pc <= this.textEndingAddress) {
            var instructionCode = this.fetch();
            var instruction = this.decode(instructionCode);
            if (instruction) {
                var format = this.getFormat(instruction.format);
                if (format) {
                    var params = format.disassemble(instructionCode);
                    instruction.execute(this, params);
                    this.pc += this.instructionBytesLength;
                }
            }
            else {
                throw new Error("Unknown instruction code: ".concat(instructionCode));
            }
        }
        else {
            this.halt();
        }
    };
    CPU.prototype.reset = function () {
        this.memory.reset();
        this.textAddress = this.textStartingAddress;
        this.textEndingAddress = this.textStartingAddress;
        this.dataAddress = this.dataStartingAddress;
        this.registers.reset();
        this.pc = this.textStartingAddress;
        this.lo = 0x00000000;
        this.hi = 0x00000000;
        this.halted = false;
    };
    CPU.prototype.halt = function () {
        this.halted = true;
    };
    CPU.prototype.isHalted = function () {
        return this.halted;
    };
    CPU.prototype.storeInstruction = function (code) {
        this.memory.store(this.textAddress, code);
        this.textEndingAddress = this.textAddress;
        this.textAddress += this.instructionBytesLength;
    };
    CPU.prototype.getFormat = function (format) {
        return this.formats.get(format);
    };
    CPU.prototype.getInstructionByCode = function (code) {
        var opcode = Utils.getBits(code, 31, 26);
        var funct = undefined;
        if (opcode === 0x00) {
            funct = Utils.getBits(code, 5, 0);
        }
        var foundInstruction = undefined;
        this.instructionsSet.instructions.forEach(function (instruction) {
            if (foundInstruction)
                return;
            if (instruction.opcode === opcode) {
                if (funct !== undefined) {
                    if (instruction.funct === funct) {
                        foundInstruction = instruction;
                    }
                }
                else {
                    if (!instruction.funct) {
                        foundInstruction = instruction;
                    }
                }
            }
        });
        if (foundInstruction) {
            // @ts-ignore
            var format = this.getFormat(foundInstruction.format);
            if (format) {
                var params = format.disassemble(code);
                // @ts-ignore
                var basic = foundInstruction.basic(params);
                return { instruction: foundInstruction, basic: basic };
            }
        }
        return undefined;
    };
    CPU.prototype.getRegisters = function () {
        return this.registers.registers;
    };
    CPU.prototype.getMemory = function () {
        return this.memory.get();
    };
    return CPU;
}());
export { CPU };
