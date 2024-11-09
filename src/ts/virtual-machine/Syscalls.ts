import {CPU} from "./CPU";
import {Binary} from "./Utils";

export abstract class Syscall {

    name: string;
    code: number;

    constructor(name: string, code: number) {
        this.name = name;
        this.code = code;
    }

    abstract execute(cpu: CPU, params: { [key: string]: Binary }): void;

}

export class Syscalls {

    syscalls: Syscall[] = [];

    constructor() {
        this.initSyscalls();
    }

    get(code: number) {
        return this.syscalls.find(syscall => syscall.code === code);
    }

    initSyscalls() {

        this.syscalls.push(new class extends Syscall {
            constructor() {
                super(
                    "PRINT_INT", 1
                );
            }
            execute(cpu: CPU, params: { [key: string]: Binary }): void {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });

        this.syscalls.push(new class extends Syscall {
            constructor() {
                super(
                    "PRINT_FLOAT", 2
                );
            }
            execute(cpu: CPU, params: { [key: string]: Binary }): void {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });

        this.syscalls.push(new class extends Syscall {
            constructor() {
                super(
                    "PRINT_DOUBLE", 3
                );
            }
            execute(cpu: CPU, params: { [key: string]: Binary }): void {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });

        this.syscalls.push(new class extends Syscall {
            constructor() {
                super(
                    "PRINT_STRING", 4
                );
            }
            execute(cpu: CPU, params: { [key: string]: Binary }): void {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });

        this.syscalls.push(new class extends Syscall {
            constructor() {
                super(
                    "READ_INT", 5
                );
            }
            execute(cpu: CPU, params: { [key: string]: Binary }): void {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });

        this.syscalls.push(new class extends Syscall {
            constructor() {
                super(
                    "READ_FLOAT", 6
                );
            }
            execute(cpu: CPU, params: { [key: string]: Binary }): void {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });

        this.syscalls.push(new class extends Syscall {
            constructor() {
                super(
                    "READ_DOUBLE", 7
                );
            }
            execute(cpu: CPU, params: { [key: string]: Binary }): void {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });

        this.syscalls.push(new class extends Syscall {
            constructor() {
                super(
                    "READ_STRING", 8
                );
            }
            execute(cpu: CPU, params: { [key: string]: Binary }): void {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });

        this.syscalls.push(new class extends Syscall {
            constructor() {
                super(
                    "SBRK", 9
                );
            }
            execute(cpu: CPU, params: { [key: string]: Binary }): void {
                console.log(`TO-DO: Execute ${this.name} syscall`);
            }
        });

        this.syscalls.push(new class extends Syscall {
            constructor() {
                super(
                    "EXIT", 10
                );
            }
            execute(cpu: CPU, params: { [key: string]: Binary }): void {

                cpu.halt();

            }
        });

    }

}