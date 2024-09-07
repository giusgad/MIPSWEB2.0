import {word} from "./Memory.js";

export type register = {
    name: string,
    number?: word | undefined,
    value: word;
}

export class Registers {

    private defaultRegisters: register[] = [
                                    { name: '$zero', number: 0,  value: 0 },
                                    { name: '$at',   number: 1,  value: 0 },
                                    { name: '$v0',   number: 2,  value: 0 },
                                    { name: '$v1',   number: 3,  value: 0 },
                                    { name: '$a0',   number: 4,  value: 0 },
                                    { name: '$a1',   number: 5,  value: 0 },
                                    { name: '$a2',   number: 6,  value: 0 },
                                    { name: '$a3',   number: 7,  value: 0 },
                                    { name: '$t0',   number: 8,  value: 0 },
                                    { name: '$t1',   number: 9,  value: 0 },
                                    { name: '$t2',   number: 10, value: 0 },
                                    { name: '$t3',   number: 11, value: 0 },
                                    { name: '$t4',   number: 12, value: 0 },
                                    { name: '$t5',   number: 13, value: 0 },
                                    { name: '$t6',   number: 14, value: 0 },
                                    { name: '$t7',   number: 15, value: 0 },
                                    { name: '$s0',   number: 16, value: 0 },
                                    { name: '$s1',   number: 17, value: 0 },
                                    { name: '$s2',   number: 18, value: 0 },
                                    { name: '$s3',   number: 19, value: 0 },
                                    { name: '$s4',   number: 20, value: 0 },
                                    { name: '$s5',   number: 21, value: 0 },
                                    { name: '$s6',   number: 22, value: 0 },
                                    { name: '$s7',   number: 23, value: 0 },
                                    { name: '$t8',   number: 24, value: 0 },
                                    { name: '$t9',   number: 25, value: 0 },
                                    { name: '$k0',   number: 26, value: 0 },
                                    { name: '$k1',   number: 27, value: 0 },
                                    { name: '$gp',   number: 28, value: 268468224 },
                                    { name: '$sp',   number: 29, value: 2147479548 },
                                    { name: '$fp',   number: 30, value: 0 },
                                    { name: '$ra',   number: 31, value: 0 }
    ];
    private defaultPc: register =   { name: "pc",                value: 4194304};
    private defaultHi: register =   { name: "hi",                value: 0};
    private defaultLo: register =   { name: "lo",                value: 0};

    registers?: register[];
    pc?: register;
    hi?: register;
    lo?: register;

    constructor() {
        this.clear();
    }

    clear() {
        this.registers = this.defaultRegisters.map(register => ({ ...register }));
        this.pc = { ...this.defaultPc };
        this.hi = { ...this.defaultHi };
        this.lo = { ...this.defaultLo };
    }

    getByName(name: string) {
        if (!this.registers) return undefined;
        const register = this.registers.find(register => register.name === name);
        if (!register) return undefined;
        return register;
    }

}