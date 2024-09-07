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
var Registers = /** @class */ (function () {
    function Registers() {
        this.defaultRegisters = [
            { name: '$zero', number: 0, value: 0 },
            { name: '$at', number: 1, value: 0 },
            { name: '$v0', number: 2, value: 0 },
            { name: '$v1', number: 3, value: 0 },
            { name: '$a0', number: 4, value: 0 },
            { name: '$a1', number: 5, value: 0 },
            { name: '$a2', number: 6, value: 0 },
            { name: '$a3', number: 7, value: 0 },
            { name: '$t0', number: 8, value: 0 },
            { name: '$t1', number: 9, value: 0 },
            { name: '$t2', number: 10, value: 0 },
            { name: '$t3', number: 11, value: 0 },
            { name: '$t4', number: 12, value: 0 },
            { name: '$t5', number: 13, value: 0 },
            { name: '$t6', number: 14, value: 0 },
            { name: '$t7', number: 15, value: 0 },
            { name: '$s0', number: 16, value: 0 },
            { name: '$s1', number: 17, value: 0 },
            { name: '$s2', number: 18, value: 0 },
            { name: '$s3', number: 19, value: 0 },
            { name: '$s4', number: 20, value: 0 },
            { name: '$s5', number: 21, value: 0 },
            { name: '$s6', number: 22, value: 0 },
            { name: '$s7', number: 23, value: 0 },
            { name: '$t8', number: 24, value: 0 },
            { name: '$t9', number: 25, value: 0 },
            { name: '$k0', number: 26, value: 0 },
            { name: '$k1', number: 27, value: 0 },
            { name: '$gp', number: 28, value: 268468224 },
            { name: '$sp', number: 29, value: 2147479548 },
            { name: '$fp', number: 30, value: 0 },
            { name: '$ra', number: 31, value: 0 }
        ];
        this.defaultPc = { name: "pc", value: 4194304 };
        this.defaultHi = { name: "hi", value: 0 };
        this.defaultLo = { name: "lo", value: 0 };
        this.clear();
    }
    Registers.prototype.clear = function () {
        this.registers = this.defaultRegisters.map(function (register) { return (__assign({}, register)); });
        this.pc = __assign({}, this.defaultPc);
        this.hi = __assign({}, this.defaultHi);
        this.lo = __assign({}, this.defaultLo);
    };
    Registers.prototype.getByName = function (name) {
        if (!this.registers)
            return undefined;
        var register = this.registers.find(function (register) { return register.name === name; });
        if (!register)
            return undefined;
        return register;
    };
    return Registers;
}());
export { Registers };
