import { hideForm, showForm } from "../forms.js";
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

    /**Returns a string that descibes what the syscall does if it's implemented, null otherwise*/
    getHelp(): string | null {
        return null;
    }
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
                    const reg = cpu.registers.get("$a0")!;
                    const int = reg.binary.getSignedValue();
                    vm.console.printString(int.toString());

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): string {
                    return "print the integer in $a0";
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
                getHelp(): string {
                    return "print the null-terminated string at the address in $a0";
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
                getHelp(): string {
                    return "read an integer from console and load it in $v0";
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
                    storeString(vm, input, buffer, maxLength);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): string {
                    return "read a string to the address in $a0, with a maximum length in bytes set in $a1";
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
                getHelp(): string {
                    return "allocate $a0 bytes on the heap and return the address of the requested memory in $v0";
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
                getHelp(): string {
                    return "terminate the program";
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
                getHelp(): string {
                    return "Print the character in $a0";
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
                getHelp(): string {
                    return "Read a character from console and load it in $v0";
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
                    const code = cpu.registers.get("$a0")!.binary.getValue();
                    vm.console.addLine(
                        `Program exited with code ${code}.`,
                        "success",
                    );
                    await vm.exit();
                }
                getHelp(): string | null {
                    return "terminate the program with the exit code contained in $a0";
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
                    const reg = cpu.registers.get("$a0")!;
                    vm.console.printString(`0x${reg.binary.getHex()}`);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): string {
                    return "print the integer in $a0 formatted as hexadecimal";
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
                    const reg = cpu.registers.get("$a0")!;
                    vm.console.printString(reg.binary.getBinary());

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): string {
                    return "print the integer in $a0 formatted as binary";
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
                    const reg = cpu.registers.get("$a0")!;
                    vm.console.printString(
                        reg.binary.getUnsignedValue().toString(),
                    );

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): string {
                    return "print the integer in $a0 interpreted as unsigned";
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
                    const num = (Math.random() * 0x100000000) | 0;
                    cpu.registers.get("$v0")!.binary.set(num, true);
                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): string {
                    return "set $v0 to a random value";
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
                    let a = cpu.registers.get("$a0")!.binary.getSignedValue();
                    let b = cpu.registers.get("$a1")!.binary.getSignedValue();
                    if (a > b) [a, b] = [b, a];
                    const range = b - a + 1;
                    const num = (Math.floor(Math.random() * range) + a) | 0;
                    cpu.registers.get("$v0")!.binary.set(num, true);
                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): string {
                    return "set $v0 to a random integer value in the inclusive range between $a0 and $a1 interpreted as signed values (the smaller one represents the lower bound)";
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
                    const currentAsyncToken = vm.getCurrentAsyncToken();

                    vm.cpu.halt();
                    const address = cpu.registers.get("$a0")!;
                    const msg = vm.cpu.memory.getString(address.binary);
                    const res = await showSyscallDialog("input_confirm", msg);

                    if (currentAsyncToken !== vm.getCurrentAsyncToken()) {
                        return;
                    }

                    vm.cpu.resume();
                    const v0 = vm.cpu.registers.get("$v0")!.binary;
                    v0.set(Number(res));
                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): string | null {
                    return `shows a confirmation dialog showing as message the null-terminated string at the address in $a0; sets $v0 based on the user selection like so: <span class="code">{'yes': 0, 'no': 1, 'cancel': 2}</span>`;
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
                    const currentAsyncToken = vm.getCurrentAsyncToken();

                    vm.cpu.halt();
                    const address = cpu.registers.get("$a0")!;
                    const msg = vm.cpu.memory.getString(address.binary);
                    try {
                        const res = await showSyscallDialog("input_int", msg);

                        if (currentAsyncToken !== vm.getCurrentAsyncToken()) {
                            return;
                        }

                        vm.cpu.resume();
                        const v0 = vm.cpu.registers.get("$v0")!.binary;
                        v0.set(intFromStr(res));
                    } catch (e) {
                        throw e;
                    }
                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): string | null {
                    return `shows an input dialog showing as message the null-terminated string at the address in $a0; sets $v0 to the integer inserted by the user`;
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
                    const currentAsyncToken = vm.getCurrentAsyncToken();

                    vm.cpu.halt();
                    const address = cpu.registers.get("$a0")!;
                    const msg = vm.cpu.memory.getString(address.binary);
                    const res = await showSyscallDialog("input_string", msg);

                    if (currentAsyncToken !== vm.getCurrentAsyncToken()) {
                        return;
                    }
                    const buffer = cpu.registers.get("$a1")!.binary.getValue();
                    const maxLength = cpu.registers
                        .get("$a2")!
                        .binary.getValue();
                    storeString(vm, res, buffer, maxLength);
                    vm.cpu.resume();
                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): string | null {
                    return `shows a dialog showing as message the null-terminated string at the address in $a0; stores the string inserted by the user at the address in $a1, limiting its length to $a2`;
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
                    const currentAsyncToken = vm.getCurrentAsyncToken();

                    vm.cpu.halt();
                    const address = cpu.registers.get("$a0")!;
                    const msg = vm.cpu.memory.getString(address.binary);
                    await showSyscallDialog("output", msg);

                    if (currentAsyncToken !== vm.getCurrentAsyncToken()) {
                        return;
                    }

                    vm.cpu.resume();
                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): string | null {
                    return "show a dialog with a message set to the null-terminated string at the address in $a0";
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
                    const currentAsyncToken = vm.getCurrentAsyncToken();

                    vm.cpu.halt();
                    const address = cpu.registers.get("$a0")!;
                    const msg = vm.cpu.memory.getString(address.binary);
                    const payload = cpu.registers.get("$a1")!.binary.getValue();
                    await showSyscallDialog("output", msg, `${payload}`);

                    if (currentAsyncToken !== vm.getCurrentAsyncToken()) {
                        return;
                    }

                    vm.cpu.resume();
                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): string | null {
                    return "show a dialog with a message set to the null-terminated string at the address in $a0 and with the integer in $a1 as content."
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
                    const currentAsyncToken = vm.getCurrentAsyncToken();

                    vm.cpu.halt();
                    const address = cpu.registers.get("$a0")!;
                    const msg = vm.cpu.memory.getString(address.binary);
                    const payloadAddr = cpu.registers.get("$a1")!.binary;
                    const payload = vm.cpu.memory.getString(payloadAddr);
                    await showSyscallDialog("output", msg, payload);

                    if (currentAsyncToken !== vm.getCurrentAsyncToken()) {
                        return;
                    }

                    vm.cpu.resume();
                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): string | null {
                    return "show a dialog with a message set to the null-terminated string at the address in $a0 and with the null-terminated string at the address in $a1 as content";
                }
            })(),
        );
    }
}

function storeString(
    vm: VirtualMachine,
    str: string,
    address: number,
    maxLength: number,
) {
    const stringBytes = new TextEncoder().encode(str);
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
        vm.cpu.memory.storeByte(
            new Binary(address + i),
            new Binary(terminated[i], 8, false),
        );
    }
}

function showSyscallDialog(
    variant: "input_confirm" | "input_int" | "input_string" | "output",
    message: string,
    /**The payload for output dialogs*/
    payload?: string,
): Promise<string> {
    return new Promise(async (resolve, reject) => {
        await showForm(
            "syscall-dialog",
            { variant: variant, msg: message, payload: payload },
            true,
            undefined,
            // only bind the esc key if no input is required
            variant === "output",
        );
        // add listeners and handlers to get input and return it resolving the promise
        switch (variant) {
            case "input_confirm":
                const yesBtn = document.getElementById("yesBtn")!;
                const noBtn = document.getElementById("noBtn")!;
                const cancBtn = document.getElementById("cancBtn")!;
                const handleYes = () => {
                    cleanup();
                    resolve("0");
                };
                const handleNo = () => {
                    cleanup();
                    resolve("1");
                };
                const handleCanc = () => {
                    cleanup();
                    resolve("2");
                };
                const cleanup = () => {
                    hideForm();
                    yesBtn.removeEventListener("click", handleYes);
                    noBtn.removeEventListener("click", handleNo);
                    cancBtn.removeEventListener("click", handleCanc);
                };
                yesBtn.addEventListener("click", handleYes);
                noBtn.addEventListener("click", handleNo);
                cancBtn.addEventListener("click", handleCanc);
                break;
            case "input_int":
            case "input_string":
                const confirmBtn = document.getElementById("confirmBtn")!;
                const handleEnter = (ev: KeyboardEvent) => {
                    if (ev.key === "Enter") confirmBtn.click();
                };
                document.addEventListener("keyup", handleEnter);
                const handleConfirm = () => {
                    const str = (
                        document.getElementById(
                            "dialogIntInput",
                        ) as HTMLInputElement
                    ).value;
                    confirmBtn.removeEventListener("click", handleConfirm);
                    document.removeEventListener("keyup", handleEnter);
                    hideForm();
                    resolve(str);
                };
                confirmBtn.addEventListener("click", handleConfirm);
        }
    });
}
