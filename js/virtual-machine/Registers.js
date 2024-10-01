export class Registers {
    constructor(names) {
        this.registers = [];
        for (let i = 0; i < names.length; i++) {
            const registerName = names[i];
            this.registers.push({
                name: registerName,
                number: i,
                value: 0
            });
        }
    }
    get(name) {
        let register = this.registers.find(reg => reg.name === name);
        if (!register) {
            const number = parseInt(name.split('$')[1], 10);
            if (!isNaN(number)) {
                register = this.registers.find(reg => reg.number === number);
            }
        }
        return register;
    }
    reset() {
        for (let register of this.registers) {
            register.value = 0;
        }
    }
}
