var Registers = /** @class */ (function () {
    function Registers(names) {
        this.registers = [];
        for (var i = 0; i < names.length; i++) {
            var registerName = names[i];
            this.registers.push({
                name: registerName,
                number: i,
                value: 0
            });
        }
    }
    Registers.prototype.get = function (name) {
        var register = this.registers.find(function (reg) { return reg.name === name; });
        if (!register) {
            var number_1 = parseInt(name.split('$')[1], 10);
            if (!isNaN(number_1)) {
                register = this.registers.find(function (reg) { return reg.number === number_1; });
            }
        }
        return register;
    };
    Registers.prototype.reset = function () {
        for (var _i = 0, _a = this.registers; _i < _a.length; _i++) {
            var register = _a[_i];
            register.value = 0;
        }
    };
    return Registers;
}());
export { Registers };
