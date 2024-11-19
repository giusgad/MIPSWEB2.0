export class Syscall {
    constructor(name, code) {
        this.name = name;
        this.code = code;
    }
}
export class Syscalls {
    constructor() {
        this.syscalls = [];
        this.initSyscalls();
    }
    get(code) {
        return this.syscalls.find(syscall => syscall.code === code);
    }
    initSyscalls() {
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("PRINT_INT", 1);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("PRINT_FLOAT", 2);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("PRINT_DOUBLE", 3);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("PRINT_STRING", 4);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("READ_INT", 5);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("READ_FLOAT", 6);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("READ_DOUBLE", 7);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("READ_STRING", 8);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("SBRK", 9);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("EXIT", 10);
            }
            execute(cpu, params) {
                cpu.halt();
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("PRINT_CHARACTER", 11);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("READ_CHARACTER", 12);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("OPEN_FILE", 13);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("READ_FROM_FILE", 14);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("WRITE_TO_FILE", 15);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("CLOSE_FILE", 16);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("EXIT2", 17);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("TIME", 30);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("MIDI_OUT", 31);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("SLEEP", 32);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("MIDI_OUT_SYNC", 33);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("PRINT_HEX", 34);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("PRINT_BINARY", 35);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("PRINT_UNSIGNED", 36);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("SET_SEED", 40);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("RANDOM_INT", 41);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("RANDOM_INT_RANGE", 42);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("RANDOM_FLOAT", 43);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("RANDOM_DOUBLE", 44);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("CONFIRM_DIALOG", 50);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("INPUT_DIALOG_INT", 51);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("INPUT_DIALOG_FLOAT", 52);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("INPUT_DIALOG_DOUBLE", 53);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("INPUT_DIALOG_STRING", 54);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("MESSAGE_DIALOG", 55);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("MESSAGE_DIALOG_INT", 56);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("MESSAGE_DIALOG_FLOAT", 57);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("MESSAGE_DIALOG_DOUBLE", 58);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("MESSAGE_DIALOG_STRING", 59);
            }
            execute(cpu, params) {
                throw new Error(`${this.name} not implemented yet`);
            }
        });
    }
}
