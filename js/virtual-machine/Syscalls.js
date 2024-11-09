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
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("PRINT_FLOAT", 2);
            }
            execute(cpu, params) {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("PRINT_DOUBLE", 3);
            }
            execute(cpu, params) {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("PRINT_STRING", 4);
            }
            execute(cpu, params) {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("READ_INT", 5);
            }
            execute(cpu, params) {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("READ_FLOAT", 6);
            }
            execute(cpu, params) {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("READ_DOUBLE", 7);
            }
            execute(cpu, params) {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("READ_STRING", 8);
            }
            execute(cpu, params) {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });
        this.syscalls.push(new class extends Syscall {
            constructor() {
                super("SBRK", 9);
            }
            execute(cpu, params) {
                console.log(`TO-DO: Execute ${this.name} syscall`);
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
    }
}
