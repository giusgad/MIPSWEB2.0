import { Binary } from "./Utils.js";
export class Registers {
    constructor(names) {
        this.registers = [];
        for (let i = 0; i < names.length; i++) {
            const registerName = names[i];
            this.registers.push({
                name: registerName,
                number: i,
                binary: new Binary(0, 32, true)
            });
        }
    }
    copy() {
        const registers = new Registers([]);
        for (let register of this.registers) {
            registers.registers.push({
                name: register.name,
                number: register.number,
                binary: register.binary.copy()
            });
        }
        return registers;
    }
    get(name) {
        if (!name) {
            return undefined;
        }
        let register = this.registers.find(reg => reg.name === name);
        if (!register) {
            const dollarIndex = name.indexOf('$');
            if (dollarIndex !== -1) {
                const numberStr = name.substring(dollarIndex + 1);
                const number = parseInt(numberStr, 10);
                if (!isNaN(number)) {
                    register = this.registers.find(reg => reg.number === number);
                }
            }
        }
        return register;
    }
    reset() {
        for (let register of this.registers) {
            register.binary.set(0);
        }
    }
    getRegisterFormat(number, format, registers) {
        if (format === 'number') {
            return '$' + number;
        }
        else {
            return registers.registers[number].name;
        }
    }
}
