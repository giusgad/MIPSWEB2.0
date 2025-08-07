import { changeFile, file, getOpenedFiles } from "./files.js";
import { VirtualMachine } from "./virtual-machine/VirtualMachine.js";
import { CPU } from "./virtual-machine/CPU.js";
import { renderApp } from "./app.js";
import {
    moveCursorToNextInstruction,
    selectNextInstruction,
} from "./editors.js";
import { Binary } from "./virtual-machine/Utils.js";
import { render } from "./rendering.js";

export const vm = new VirtualMachine(new CPU());
export let memoryShown = false;
export let consoleShown = false;

export function setMemoryShown(val: boolean) {
    memoryShown = val;
}

export async function setConsoleShown(val: boolean) {
    consoleShown = val;
    await renderApp();
}

export async function assemble(files: file[]) {
    vm.assemble(files);
    if (vm.nextInstructionEditorPosition) {
        await changeFile(vm.nextInstructionEditorPosition.fileId);
        selectNextInstruction();
        moveCursorToNextInstruction();
    }
    await renderApp("execute", "execute");
}

export async function stop() {
    vm.stop();
    await renderApp("edit", "edit");
}

export async function step() {
    await vm.step();
    if (vm.cpu.isHalted()) {
        await renderApp();
        return;
    }
    if (vm.nextInstructionEditorPosition) {
        await changeFile(vm.nextInstructionEditorPosition.fileId);
        selectNextInstruction();
        moveCursorToNextInstruction();
    }
    // last call was most likely a syscall, rerender everything. Syscalls halting the cpu otherwise generate ui glitches.
    if (
        vm.lastReadRegisters?.length === 1 &&
        vm.lastReadRegisters[0] === "$v0"
    ) {
        await renderApp(undefined, undefined, false);
    } else {
        if (memoryShown)
            await render("memory", "/app/memory.ejs", undefined, false);
        await render("registers", "/app/registers.ejs", undefined, false);
        if (consoleShown)
            await render("console", "/app/console.ejs", undefined, false);
    }
}

export async function run() {
    await vm.run();
    await renderApp();
    moveCursorToNextInstruction();
}

export async function pause() {
    vm.pause();
    await renderApp();
}

(window as any).convert = function (format: string, bin: Binary | number) {
    if (typeof bin === "number") {
        // cell addresses are passed as a number
        bin = new Binary(bin);
    }
    switch (format) {
        case "decimal":
            return bin.getValue();
        case "uint":
            return bin.getUnsignedValue();
        case "int":
            return bin.getSignedValue();
        case "hexadecimal":
        case "hex":
            return bin.getHex();
        case "binary":
            return bin.getBinary();
        case "ascii":
            return bin.getAscii();
        case "asm":
            const decodedInstruction = vm.cpu.decode(bin);
            if (decodedInstruction) {
                return decodedInstruction.basic;
            }
    }
    return "undefined";
};
