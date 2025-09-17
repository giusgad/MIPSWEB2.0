import { intFromStr } from "../utils.js";
import { CPU } from "./CPU.js";
import { Binary } from "./Utils.js";
import { VirtualMachine } from "./VirtualMachine.js";

export abstract class Syscall {
    name: string;
    code: number;

    constructor(name: string, code: number) {
        this.name = name;
        this.code = code;
    }

    abstract execute(
        cpu: CPU,
        params: { [key: string]: Binary },
        vm: VirtualMachine,
    ): Promise<void>;
}

export class Syscalls {
    syscalls: Syscall[] = [];

    constructor() {
        this.initSyscalls();
    }

    get(code: number) {
        return this.syscalls.find((syscall) => syscall.code === code);
    }

    initSyscalls() {
        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("PRINT_INT", 1);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const address = cpu.registers.get("$a0");
                    if (address) {
                        const int = address.binary.getSignedValue();
                        vm.console.printString(int.toString());
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("PRINT_FLOAT", 2);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("PRINT_DOUBLE", 3);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("PRINT_STRING", 4);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const address = cpu.registers.get("$a0");
                    if (address) {
                        const string = vm.cpu.memory.getString(address.binary);
                        vm.console.printString(string);
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("READ_INT", 5);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const currentAsyncToken = vm.getCurrentAsyncToken();

                    vm.cpu.halt();
                    const input: string = await vm.console.getInput();

                    if (currentAsyncToken !== vm.getCurrentAsyncToken()) {
                        return;
                    }

                    vm.cpu.resume();
                    const value = intFromStr(input);
                    const v0 = vm.cpu.getRegisters()[2].binary;
                    v0.set(value);
                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("READ_FLOAT", 6);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("READ_DOUBLE", 7);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("READ_STRING", 8);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const currentAsyncToken = vm.getCurrentAsyncToken();

                    vm.cpu.halt();
                    const input: string = await vm.console.getInput();

                    if (currentAsyncToken !== vm.getCurrentAsyncToken()) {
                        return;
                    }

                    vm.cpu.resume();
                    const buffer = cpu.registers.get("$a0")!.binary.getValue();
                    const maxLength = cpu.registers
                        .get("$a1")!
                        .binary.getValue();
                    const stringBytes = new TextEncoder().encode(input);
                    const terminated = new Uint8Array(stringBytes.length + 1);
                    terminated.set(stringBytes);
                    terminated[terminated.length - 1] = 0; // null byte terminator

                    for (let i = 0; i < terminated.length; i++) {
                        if (i >= maxLength) {
                            vm.console.addLine(
                                `Input string too long, ignoring last ${terminated.length - maxLength} bytes`,
                                "warn",
                            );
                            break;
                        }
                        cpu.memory.storeByte(
                            new Binary(buffer + i),
                            new Binary(terminated[i], 8, false),
                        );
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("SBRK", 9);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const bytes = cpu.registers.get("$a0")!.binary.getValue();
                    const allocatedAddr = cpu.memory.allocate(bytes);
                    cpu.registers.get("$v0")!.binary.set(allocatedAddr, false);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("EXIT", 10);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    vm.console.addLine("Program exited.", "success");
                    await vm.exit();
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("PRINT_CHARACTER", 11);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const character = cpu.registers.get("$a0")!.binary;

                    const decoder = new TextDecoder("latin1");
                    const char = decoder.decode(
                        new Uint8Array([character.getUnsignedValue()]),
                    );
                    vm.console.printString(char);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("READ_CHARACTER", 12);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const currentAsyncToken = vm.getCurrentAsyncToken();

                    vm.cpu.halt();
                    const input: string = await vm.console.getInput();

                    if (currentAsyncToken !== vm.getCurrentAsyncToken()) {
                        return;
                    }

                    vm.cpu.resume();
                    const bytes = new TextEncoder().encode(input);
                    const char = bytes[0] || 0;
                    cpu.registers.get("$v0")!.binary.set(char);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("OPEN_FILE", 13);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("READ_FROM_FILE", 14);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("WRITE_TO_FILE", 15);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("CLOSE_FILE", 16);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("EXIT2", 17);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("TIME", 30);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("MIDI_OUT", 31);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("SLEEP", 32);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("MIDI_OUT_SYNC", 33);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("PRINT_HEX", 34);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("PRINT_BINARY", 35);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("PRINT_UNSIGNED", 36);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("SET_SEED", 40);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("RANDOM_INT", 41);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("RANDOM_INT_RANGE", 42);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("RANDOM_FLOAT", 43);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("RANDOM_DOUBLE", 44);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("CONFIRM_DIALOG", 50);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("INPUT_DIALOG_INT", 51);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("INPUT_DIALOG_FLOAT", 52);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("INPUT_DIALOG_DOUBLE", 53);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("INPUT_DIALOG_STRING", 54);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("MESSAGE_DIALOG", 55);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("MESSAGE_DIALOG_INT", 56);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("MESSAGE_DIALOG_FLOAT", 57);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("MESSAGE_DIALOG_DOUBLE", 58);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );

        this.syscalls.push(
            new (class extends Syscall {
                constructor() {
                    super("MESSAGE_DIALOG_STRING", 59);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.name} not implemented yet`);
                }
            })(),
        );
    }
}
