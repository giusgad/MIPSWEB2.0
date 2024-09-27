var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Instruction = /** @class */ (function () {
    function Instruction(symbol, params, format, name, opcode, funct) {
        this.symbol = symbol;
        this.params = params;
        this.name = name;
        this.format = format;
        this.opcode = opcode;
        if (funct) {
            this.funct = funct;
        }
    }
    Instruction.prototype.basic = function (params) {
        var paramsNames = this.params.split(',').map(function (p) { return p.trim(); });
        var paramValues = paramsNames.map(function (name) {
            var paramValue = params[name];
            if (paramValue !== undefined) {
                if (['rs', 'rt', 'rd'].includes(name)) {
                    return "$".concat(paramValue);
                }
                else {
                    return paramValue;
                }
            }
            else {
                return '';
            }
        });
        return "".concat(this.symbol.toLowerCase(), " ").concat(paramValues.join(' '));
    };
    return Instruction;
}());
export { Instruction };
var InstructionsSet = /** @class */ (function () {
    function InstructionsSet() {
        this.instructions = [];
        this.initInstructions();
    }
    InstructionsSet.prototype.getBySymbol = function (instructionSymbol) {
        for (var _i = 0, _a = this.instructions; _i < _a.length; _i++) {
            var instruction = _a[_i];
            if (instruction.symbol.toLowerCase() === instructionSymbol.toLowerCase()) {
                return instruction;
            }
        }
    };
    InstructionsSet.prototype.initInstructions = function () {
        this.instructions.push(new /** @class */ (function (_super) {
            __extends(class_1, _super);
            function class_1() {
                return _super.call(this, 'MFHI', 'rd', 'R', '', 0x00, 0x10) || this;
            }
            class_1.prototype.execute = function (cpu, params) {
                var registers = cpu.getRegisters();
                var rd = params.rd;
                registers[rd].value = cpu.hi;
            };
            return class_1;
        }(Instruction))());
        this.instructions.push(new /** @class */ (function (_super) {
            __extends(class_2, _super);
            function class_2() {
                return _super.call(this, 'MFLO', 'rd', 'R', '', 0x00, 0x12) || this;
            }
            class_2.prototype.execute = function (cpu, params) {
                var registers = cpu.getRegisters();
                var rd = params.rd;
                registers[rd].value = cpu.lo;
            };
            return class_2;
        }(Instruction))());
        this.instructions.push(new /** @class */ (function (_super) {
            __extends(class_3, _super);
            function class_3() {
                return _super.call(this, 'MULT', 'rs, rt', 'R', '', 0x00, 0x18) || this;
            }
            class_3.prototype.execute = function (cpu, params) {
                var registers = cpu.getRegisters();
                var rs = params.rs;
                var rt = params.rt;
                var rsVal = registers[rs].value | 0;
                var rtVal = registers[rt].value | 0;
                var productLow = (rsVal * rtVal) >>> 0;
                var productHigh = ((rsVal * rtVal) / 0x100000000) >>> 0;
                cpu.lo = productLow;
                cpu.hi = productHigh;
            };
            return class_3;
        }(Instruction))());
        this.instructions.push(new /** @class */ (function (_super) {
            __extends(class_4, _super);
            function class_4() {
                return _super.call(this, 'MULTU', 'rs, rt', 'R', '', 0x00, 0x19) || this;
            }
            class_4.prototype.execute = function (cpu, params) {
                var registers = cpu.getRegisters();
                var rs = params.rs;
                var rt = params.rt;
                var rsVal = registers[rs].value >>> 0;
                var rtVal = registers[rt].value >>> 0;
                var productLow = (rsVal * rtVal) >>> 0;
                var productHigh = ((rsVal * rtVal) / 0x100000000) >>> 0;
                cpu.lo = productLow;
                cpu.hi = productHigh;
            };
            return class_4;
        }(Instruction))());
        this.instructions.push(new /** @class */ (function (_super) {
            __extends(class_5, _super);
            function class_5() {
                return _super.call(this, 'DIV', 'rs, rt', 'R', '', 0x00, 0x1A) || this;
            }
            class_5.prototype.execute = function (cpu, params) {
                var registers = cpu.getRegisters();
                var rs = params.rs;
                var rt = params.rt;
                var rsVal = registers[rs].value | 0;
                var rtVal = registers[rt].value | 0;
                if (rtVal === 0) {
                    cpu.lo = 0;
                    cpu.hi = 0;
                    return;
                }
                var quotient = (rsVal / rtVal) | 0;
                var remainder = (rsVal % rtVal) | 0;
                cpu.lo = quotient;
                cpu.hi = remainder;
            };
            return class_5;
        }(Instruction))());
        this.instructions.push(new /** @class */ (function (_super) {
            __extends(class_6, _super);
            function class_6() {
                return _super.call(this, 'ADD', 'rd, rs, rt', 'R', 'Add Word', 0x00, 0x20) || this;
            }
            class_6.prototype.execute = function (cpu, params) {
                var registers = cpu.getRegisters();
                var rd = params.rd;
                var rs = params.rs;
                var rt = params.rt;
                var result = registers[rs].value + registers[rt].value;
                if (result > 0x7FFFFFFF || result < -0x80000000) {
                    throw new Error("Integer Overflow");
                }
                registers[rd].value = result;
            };
            return class_6;
        }(Instruction))());
        this.instructions.push(new /** @class */ (function (_super) {
            __extends(class_7, _super);
            function class_7() {
                return _super.call(this, 'ADDU', 'rd, rs, rt', 'R', '', 0x00, 0x21) || this;
            }
            class_7.prototype.execute = function (cpu, params) {
                var registers = cpu.getRegisters();
                var rd = params.rd;
                var rs = params.rs;
                var rt = params.rt;
                registers[rd].value = registers[rs].value + registers[rt].value;
            };
            return class_7;
        }(Instruction))());
        this.instructions.push(new /** @class */ (function (_super) {
            __extends(class_8, _super);
            function class_8() {
                return _super.call(this, 'SUB', 'rd, rs, rt', 'R', '', 0x00, 0x22) || this;
            }
            class_8.prototype.execute = function (cpu, params) {
                var registers = cpu.getRegisters();
                var rd = params.rd;
                var rs = params.rs;
                var rt = params.rt;
                var result = registers[rs].value - registers[rt].value;
                if (result > 0x7FFFFFFF || result < -0x80000000) {
                    throw new Error("Integer Overflow");
                }
                registers[rd].value = result;
            };
            return class_8;
        }(Instruction))());
        this.instructions.push(new /** @class */ (function (_super) {
            __extends(class_9, _super);
            function class_9() {
                return _super.call(this, 'SUBU', 'rd, rs, rt', 'R', '', 0x00, 0x23) || this;
            }
            class_9.prototype.execute = function (cpu, params) {
                var registers = cpu.getRegisters();
                var rd = params.rd;
                var rs = params.rs;
                var rt = params.rt;
                registers[rd].value = registers[rs].value - registers[rt].value;
            };
            return class_9;
        }(Instruction))());
        this.instructions.push(new /** @class */ (function (_super) {
            __extends(class_10, _super);
            function class_10() {
                return _super.call(this, 'J', 'address', 'J', 'Jump', 0x02) || this;
            }
            class_10.prototype.execute = function (cpu, params) {
                var registers = cpu.getRegisters();
                console.error("TO-DO: Jump");
            };
            return class_10;
        }(Instruction))());
        this.instructions.push(new /** @class */ (function (_super) {
            __extends(class_11, _super);
            function class_11() {
                return _super.call(this, 'ADDI', 'rt, rs, immediate', 'I', 'Add Immediate Word', 0x08) || this;
            }
            class_11.prototype.execute = function (cpu, params) {
                var registers = cpu.getRegisters();
                var rt = params.rt;
                var rs = params.rs;
                var immediate = params.immediate;
                var result = registers[rs].value + immediate;
                if (result > 0x7FFFFFFF || result < -0x80000000) {
                    throw new Error("Integer Overflow");
                }
                registers[rt].value = result;
            };
            return class_11;
        }(Instruction))());
        this.instructions.push(new /** @class */ (function (_super) {
            __extends(class_12, _super);
            function class_12() {
                return _super.call(this, 'ADDIU', 'rt, rs, immediate', 'I', '', 0x09) || this;
            }
            class_12.prototype.execute = function (cpu, params) {
                var registers = cpu.getRegisters();
                var rt = params.rt;
                var rs = params.rs;
                var immediate = params.immediate;
                registers[rt].value = registers[rs].value + immediate;
            };
            return class_12;
        }(Instruction))());
    };
    return InstructionsSet;
}());
export { InstructionsSet };
