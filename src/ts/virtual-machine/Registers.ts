import {Binary} from "./Utils.js";

export type register = {
    name: string,
    number?: number,
    binary: Binary
}

export class Registers {

    registers: register[] = [];

    constructor(names: string[]) {
        for (let i = 0; i < names.length; i++) {
            const registerName = names[i];
            this.registers.push({
                name: registerName,
                number: i,
                binary: new Binary(0, 32, true)
            });
        }
    }

    copy(): Registers {
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

    get(name: string): register | undefined {
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

}