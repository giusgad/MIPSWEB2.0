var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { changeFile } from "./files.js";
import { VirtualMachine } from "./virtual-machine/VirtualMachine.js";
import { CPU } from "./virtual-machine/CPU.js";
import { renderApp } from "./app.js";
import { moveCursorToNextInstruction, selectNextInstruction } from "./editors.js";
import { Binary } from "./virtual-machine/Utils.js";
import { getFromStorage } from "./utils.js";
export const vm = new VirtualMachine(new CPU());
export function assemble(files) {
    return __awaiter(this, void 0, void 0, function* () {
        vm.assemble(files);
        yield renderApp("execute", "execute");
        if (vm.nextInstructionEditorPosition) {
            yield changeFile(vm.nextInstructionEditorPosition.fileId);
            selectNextInstruction();
            moveCursorToNextInstruction();
        }
    });
}
export function stop() {
    return __awaiter(this, void 0, void 0, function* () {
        vm.stop();
        yield renderApp("edit", "edit");
    });
}
export function step() {
    return __awaiter(this, void 0, void 0, function* () {
        yield vm.step();
        yield renderApp();
        if (vm.nextInstructionEditorPosition) {
            yield changeFile(vm.nextInstructionEditorPosition.fileId);
            selectNextInstruction();
            moveCursorToNextInstruction();
        }
    });
}
export function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield vm.run();
        yield renderApp();
        moveCursorToNextInstruction();
    });
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
        }
        else {
            intervals.push(extendInterval(currentInterval, intervals.length));
            currentInterval = [currentCell];
        }
    }
    intervals.push(extendInterval(currentInterval, intervals.length));
    for (const interval of intervals) {
        for (const cell of interval.cells) {
            if (cell.address === vm.assembler.textSegmentStart.getValue()) {
                cell.tags.push({ name: '.text', type: 'section' });
            }
            if (cell.address === vm.assembler.dataSegmentStart.getValue()) {
                cell.tags.push({ name: '.data', type: 'section' });
            }
            vm.assembler.allLabels.forEach((address, label) => {
                if (address) {
                    const addressValue = address.getValue();
                    if ((cell.address === addressValue) || ((addressValue > cell.address) && (addressValue < cell.address + 4))) {
                        cell.tags.push({ name: label + ':', type: 'label' });
                    }
                }
            });
            for (const register of vm.getRegisters()) {
                const addressValue = register.value;
                if ((cell.address === addressValue) || ((addressValue > cell.address) && (addressValue < cell.address + 4))) {
                    if (register.name === 'pc') {
                        cell.tags.push({ name: register.name, type: 'pc' });
                    }
                    else {
                        cell.tags.push({ name: register.name, type: 'register' });
                    }
                }
            }
        }
    }
    return intervals;
}
export function extendInterval(cells, index) {
    const settings = getFromStorage('local', 'settings');
    const interval = {
        cells: cells,
        formats: {
            address: settings.colsFormats['memory-address-format'],
            value: settings.colsFormats['memory-value-format']
        }
    };
    if ((interval.cells[0].address >= 4194304) && (interval.cells[interval.cells.length - 1].address <= 268500992)) {
        interval.formats.value = 'asm';
    }
    if (settings.colsFormats[`memory-address-format_${index}`]) {
        interval.formats.address = settings.colsFormats[`memory-address-format_${index}`];
    }
    if (settings.colsFormats[`memory-value-format_${index}`]) {
        interval.formats.value = settings.colsFormats[`memory-value-format_${index}`];
    }
    return interval;
}
window.convert = function (format, value, signed = false) {
    if (format === 'decimal') {
        return value;
    }
    if (format === 'hexadecimal') {
        return new Binary(value, 32, signed).getHex();
    }
    if (format === 'binary') {
        return new Binary(value, 32, signed).getBinary();
    }
    if (format === 'ascii') {
        return new Binary(value, 32, signed).getAscii();
    }
    if (format === 'asm') {
        const decodedInstruction = vm.cpu.decode(new Binary(value));
        if (decodedInstruction) {
            return decodedInstruction.basic;
        }
    }
    return 'undefined';
};
