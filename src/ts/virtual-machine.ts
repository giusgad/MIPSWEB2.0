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
import { addClass, removeClass } from "./utils.js";

export const vm = new VirtualMachine(new CPU());
export let memoryShown = false;
export let consoleShown = false;

export async function setMemoryShown(val: boolean) {
    if (val === memoryShown) return;
    memoryShown = val;
    const classAction = val ? addClass : removeClass;
    classAction("memory-shown", "opened-files");
    classAction("memory-shown", "editors");
    classAction("memory-shown", "memory");
    classAction("memory-shown", "console");
    await render("memory", "/app/memory.ejs", undefined, false);
}

export async function setConsoleShown(val: boolean) {
    if (val === consoleShown) return;
    consoleShown = val;
    const classAction = val ? addClass : removeClass;
    classAction("console-shown", "console");
    classAction("console-shown", "sidebar");
    classAction("console-shown", "editors");
    await render("console", "/app/console.ejs", undefined, false);
}

export async function assemble(files: file[]) {
    try {
        vm.assemble(files);
        if (vm.nextInstructionEditorPosition) {
            await changeFile(vm.nextInstructionEditorPosition.fileId);
            selectNextInstruction();
            moveCursorToNextInstruction();
        }
        await renderApp("execute", "execute");
    } catch (error) {
        await renderApp("edit", "edit");
    }
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
    if (memoryShown)
        await render("memory", "/app/memory.ejs", undefined, false);
    await render("registers", "/app/registers.ejs", undefined, false);
    if (consoleShown)
        await render("console", "/app/console.ejs", undefined, false);
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
