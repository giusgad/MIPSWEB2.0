export var instructionsSet = new Map([
    ["add", {
            format: 'R', type: "ALU", opcode: 0x00, funct: 0x20,
            run: function (registers, params) {
                var rd = params.rd;
                var rs = params.rs;
                var rt = params.rt;
                var result = registers[rs].value + registers[rt].value;
                if (result > 0x7FFFFFFF || result < -0x80000000) {
                    throw new Error("Integer Overflow");
                }
                registers[rd].value = result;
            },
            basic: function (params) { return "add $".concat(params.rd, ", $").concat(params.rs, ", $").concat(params.rt); }
        }],
    ["sub", {
            format: 'R', type: "ALU", opcode: 0x00, funct: 0x22,
            run: function (registers, params) {
                var rd = params.rd;
                var rs = params.rs;
                var rt = params.rt;
                var result = registers[rs].value - registers[rt].value;
                if (result > 0x7FFFFFFF || result < -0x80000000) {
                    throw new Error("Integer Overflow");
                }
                registers[rd].value = result;
            },
            basic: function (params) { return "sub $".concat(params.rd, ", $").concat(params.rs, ", $").concat(params.rt); }
        }],
    ["addi", {
            format: 'I', type: "ALU", opcode: 0x08,
            run: function (registers, params) {
                var rt = params.rt;
                var rs = params.rs;
                var immediate = params.immediate;
                var result = registers[rs].value + immediate;
                if (result > 0x7FFFFFFF || result < -0x80000000) {
                    throw new Error("Integer Overflow");
                }
                registers[rt].value = result;
            },
            basic: function (params) { return "addi $".concat(params.rt, ", $").concat(params.rs, ", ").concat(params.immediate); }
        }],
    ["addu", {
            format: 'R', type: "ALU", opcode: 0x00, funct: 0x21,
            run: function (registers, params) {
                var rd = params.rd;
                var rs = params.rs;
                var rt = params.rt;
                registers[rd].value = registers[rs].value + registers[rt].value;
            },
            basic: function (params) { return "addu $".concat(params.rd, ", $").concat(params.rs, ", $").concat(params.rt); }
        }],
    ["subu", {
            format: 'R', type: "ALU", opcode: 0x00, funct: 0x23,
            run: function (registers, params) {
                var rd = params.rd;
                var rs = params.rs;
                var rt = params.rt;
                registers[rd].value = registers[rs].value - registers[rt].value;
            },
            basic: function (params) { return "subu $".concat(params.rd, ", $").concat(params.rs, ", $").concat(params.rt); }
        }],
    ["addiu", {
            format: 'I', type: "ALU", opcode: 0x09,
            run: function (registers, params) {
                var rt = params.rt;
                var rs = params.rs;
                var immediate = params.immediate;
                registers[rt].value = registers[rs].value + immediate;
            },
            basic: function (params) { return "addiu $".concat(params.rt, ", $").concat(params.rs, ", ").concat(params.immediate); }
        }],
    ["mult", {
            format: 'R', type: "ALU", opcode: 0x00, funct: 0x18,
            run: function (registers, params) {
                var rs = params.rs;
                var rt = params.rt;
                var lo = params.lo;
                var hi = params.hi;
                var rsVal = registers[rs].value | 0;
                var rtVal = registers[rt].value | 0;
                var productLow = (rsVal * rtVal) >>> 0;
                var productHigh = ((rsVal * rtVal) / 0x100000000) >>> 0;
                lo.value = productLow;
                hi.value = productHigh;
            },
            basic: function (params) { return "mult $".concat(params.rs, ", $").concat(params.rt); }
        }],
    ["multu", {
            format: 'R', type: "ALU", opcode: 0x00, funct: 0x19,
            run: function (registers, params) {
                var rs = params.rs;
                var rt = params.rt;
                var lo = params.lo;
                var hi = params.hi;
                var rsVal = registers[rs].value >>> 0;
                var rtVal = registers[rt].value >>> 0;
                var productLow = (rsVal * rtVal) >>> 0;
                var productHigh = ((rsVal * rtVal) / 0x100000000) >>> 0;
                lo.value = productLow;
                hi.value = productHigh;
            },
            basic: function (params) { return "multu $".concat(params.rs, ", $").concat(params.rt); }
        }],
    ["mfhi", {
            format: 'R', type: "ALU", opcode: 0x00, funct: 0x10,
            run: function (registers, params) {
                var rd = params.rd;
                var hi = params.hi;
                registers[rd].value = hi.value;
            },
            basic: function (params) { return "mfhi $".concat(params.rd); }
        }],
    ["mflo", {
            format: 'R', type: "ALU", opcode: 0x00, funct: 0x12,
            run: function (registers, params) {
                var rd = params.rd;
                var lo = params.lo;
                registers[rd].value = lo.value;
            },
            basic: function (params) { return "mflo $".concat(params.rd); }
        }],
    ["div", {
            format: 'R', type: "ALU", opcode: 0x00, funct: 0x1A,
            run: function (registers, params) {
                var rs = params.rs;
                var rt = params.rt;
                var lo = params.lo;
                var hi = params.hi;
                var rsVal = registers[rs].value | 0;
                var rtVal = registers[rt].value | 0;
                if (rtVal === 0) {
                    lo.value = 0;
                    hi.value = 0;
                    return;
                }
                var quotient = (rsVal / rtVal) | 0;
                var remainder = (rsVal % rtVal) | 0;
                lo.value = quotient;
                hi.value = remainder;
            },
            basic: function (params) { return "div $".concat(params.rs, ", $").concat(params.rt); }
        }],
    ["lw", {}],
    ["sw", {}]
]);
