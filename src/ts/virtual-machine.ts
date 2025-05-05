import { changeFile, file, getOpenedFiles } from "./files.js";
import { VirtualMachine } from "./virtual-machine/VirtualMachine.js";
import { CPU } from "./virtual-machine/CPU.js";
import { renderApp } from "./app.js";
import {
    moveCursorToNextInstruction,
    selectNextInstruction,
} from "./editors.js";
import { Binary } from "./virtual-machine/Utils.js";
import { getFromStorage } from "./utils.js";

export const vm = new VirtualMachine(new CPU());

export async function assemble(files: file[]) {
    vm.assemble(files);
    await renderApp("execute", "execute");
    if (vm.nextInstructionEditorPosition) {
        await changeFile(vm.nextInstructionEditorPosition.fileId);
        selectNextInstruction();
        moveCursorToNextInstruction();
    }
}

export async function stop() {
    vm.stop();
    await renderApp("edit", "edit");
}

export async function step() {
    await vm.step();
    await renderApp();
    if (vm.nextInstructionEditorPosition) {
        await changeFile(vm.nextInstructionEditorPosition.fileId);
        selectNextInstruction();
        moveCursorToNextInstruction();
    }
}

export async function run() {
    await vm.run();
    await renderApp();
    moveCursorToNextInstruction();
}

export function getMemoryIntervals() {
    const memory = vm.getMemory();
    if (memory.length === 0) {
        return [];
    }
    const intervals = [];
    let currentInterval = [memory[0]];
    for (let i = 1; i < memory.length; i++) {
        const currentCell = memory[i];
        const previousCell = memory[i - 1];

        if (currentCell.address - previousCell.address <= 4) {
            currentInterval.push(currentCell);
        } else {
            intervals.push(extendInterval(currentInterval, intervals.length));
            currentInterval = [currentCell];
        }
    }
    intervals.push(extendInterval(currentInterval, intervals.length));

    intervals.forEach((interval) => addCellTags(interval));
    return intervals;
}

function addCellTags(interval: { cells: any[] }) {
    for (const cell of interval.cells) {
        if (cell.address === vm.assembler.textSegmentStart.getValue()) {
            cell.tags.push({ name: ".text", type: "section" });
        }
        if (cell.address === vm.assembler.dataSegmentStart.getValue()) {
            cell.tags.push({ name: ".data", type: "section" });
        }
        vm.assembler.allLabels.forEach((address, label) => {
            if (address) {
                const addressValue = address.getValue();
                if (
                    cell.address === addressValue ||
                    (addressValue > cell.address &&
                        addressValue < cell.address + 4)
                ) {
                    cell.tags.push({ name: label + ":", type: "label" });
                }
            }
        });
        for (const register of vm.getRegisters()) {
            const addressValue = register.binary.getValue();
            if (
                cell.address === addressValue ||
                (addressValue > cell.address && addressValue < cell.address + 4)
            ) {
                if (register.name === "pc") {
                    cell.tags.push({ name: register.name, type: "pc" });
                } else {
                    if (register.number) {
                        cell.tags.push({
                            name: vm.cpu.registers.getRegisterFormat(
                                register.number,
                                getFromStorage("local", "settings").colsFormats[
                                    "registers-name-format"
                                ],
                                vm.cpu.registers,
                            ),
                            type: "register",
                        });
                    }
                }
            }
        }
    }
}

export function extendInterval(cells: any, index: number) {
    const settings = getFromStorage("local", "settings");
    const interval = {
        cells: cells,
        formats: {
            address: settings.colsFormats["memory-address-format"],
            value: settings.colsFormats["memory-value-format"],
            valueGranularity: settings.colsFormats["memory-value-granularity"],
        },
    };
    if (
        interval.cells[0].address >= 4194304 &&
        interval.cells[interval.cells.length - 1].address < 268500992
    ) {
        interval.formats.value = "asm";
    }
    if (settings.colsFormats[`memory-address-format_${index}`]) {
        interval.formats.address =
            settings.colsFormats[`memory-address-format_${index}`];
    }
    if (settings.colsFormats[`memory-value-format_${index}`]) {
        interval.formats.value =
            settings.colsFormats[`memory-value-format_${index}`];
    }
    if (settings.colsFormats[`memory-value-granularity_${index}`]) {
        interval.formats.valueGranularity =
            settings.colsFormats[`memory-value-granularity_${index}`];
    }
    return interval;
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
