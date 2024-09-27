import { Utils } from "./Utils.js";
var R_Format = /** @class */ (function () {
    function R_Format() {
    }
    R_Format.prototype.assemble = function (parts, instruction, cpu) {
        var basic;
        var rd = cpu.registers.get("$zero");
        var rs = cpu.registers.get("$zero");
        var rt = cpu.registers.get("$zero");
        if ((parts[0] === "mult") || (parts[0] === "div")) {
            rs = cpu.registers.get(parts[1]);
            rt = cpu.registers.get(parts[2]);
            basic = "".concat(parts[0], " $").concat(rs.number, " $").concat(rt.number);
        }
        else if ((parts[0] === "mflo") || (parts[0] === "mfhi")) {
            rd = cpu.registers.get(parts[1]);
            basic = "".concat(parts[0], " $").concat(rd.number);
        }
        else {
            rd = cpu.registers.get(parts[1]);
            rs = cpu.registers.get(parts[2]);
            rt = cpu.registers.get(parts[3]);
            basic = "".concat(parts[0], " $").concat(rd.number, " $").concat(rs.number, " $").concat(rt.number);
        }
        if (!rd || !rs || !rt)
            throw new Error("Invalid register name for instruction ".concat(parts.join(' ')));
        var code = 0;
        code = Utils.setBits(code, instruction.opcode, 31, 26);
        code = Utils.setBits(code, rs.number, 25, 21);
        code = Utils.setBits(code, rt.number, 20, 16);
        code = Utils.setBits(code, rd.number, 15, 11);
        code = Utils.setBits(code, 0x00, 10, 6);
        code = Utils.setBits(code, instruction.funct, 5, 0);
        return {
            code: code,
            basic: basic
        };
    };
    R_Format.prototype.disassemble = function (instructionCode) {
        var rs = Utils.getBits(instructionCode, 25, 21);
        var rt = Utils.getBits(instructionCode, 20, 16);
        var rd = Utils.getBits(instructionCode, 15, 11);
        return { rs: rs, rt: rt, rd: rd };
    };
    return R_Format;
}());
export { R_Format };
var I_Format = /** @class */ (function () {
    function I_Format() {
    }
    I_Format.prototype.assemble = function (parts, instruction, cpu) {
        var rt = cpu.registers.get(parts[1]);
        var rs = cpu.registers.get(parts[2]);
        var immediate = Number(parts[3]);
        if (!rt || !rs || isNaN(immediate))
            throw new Error("Invalid register or immediate value");
        var code = 0;
        code = Utils.setBits(code, instruction.opcode, 31, 26);
        code = Utils.setBits(code, rs.number, 25, 21);
        code = Utils.setBits(code, rt.number, 20, 16);
        code = Utils.setBits(code, immediate & 0xFFFF, 15, 0);
        var basic = "".concat(parts[0], " $").concat(rt.number, " $").concat(rs.number, " ").concat(immediate);
        return {
            code: code,
            basic: basic
        };
    };
    I_Format.prototype.disassemble = function (instructionCode) {
        var rs = Utils.getBits(instructionCode, 25, 21);
        var rt = Utils.getBits(instructionCode, 20, 16);
        var immediate = Utils.getBits(instructionCode, 15, 0);
        return { rs: rs, rt: rt, immediate: immediate };
    };
    return I_Format;
}());
export { I_Format };
var J_Format = /** @class */ (function () {
    function J_Format() {
    }
    J_Format.prototype.assemble = function (parts, instruction, cpu) {
        var address = Number(parts[1]);
        if (isNaN(address))
            throw new Error("Invalid address");
        var jumpAddress = (address >>> 2) & 0x03FFFFFF;
        var code = 0;
        code = Utils.setBits(code, instruction.opcode, 31, 26);
        code = Utils.setBits(code, jumpAddress, 25, 0);
        var basic = "".concat(parts[0], " ").concat(address);
        return {
            code: code,
            basic: basic
        };
    };
    J_Format.prototype.disassemble = function (instructionCode) {
        var address = Utils.getBits(instructionCode, 25, 0);
        return { address: address };
    };
    return J_Format;
}());
export { J_Format };
