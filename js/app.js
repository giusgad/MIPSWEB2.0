var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { VirtualMachine } from "./virtual-machine/VirtualMachine.js";
import { CPU } from "./virtual-machine/CPU.js";
import { addClass, getFromLocalStorage, removeClass, render, setIntoLocalStorage } from "./index.js";
import { default_settings } from "./settings.js";
import { actionsOnFile, changeFile, closeFile, getFiles, getSelectedFile, importFiles, importSample, importSamples, newFile, openFile, samples } from "./files.js";
import { editorState, getEditor, initEditors, renderEditor } from "./editor.js";
import { Binary } from "./virtual-machine/Utils.js";
import { scrollConsoleToBottom, watchingConsole } from "./console.js";
export const vm = new VirtualMachine(new CPU);
export let interfaceState = "edit";
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    if (!getFromLocalStorage("settings")) {
        setIntoLocalStorage("settings", default_settings);
    }
    yield renderApp();
    initEditors();
    clearMemorySelectedFormats();
}));
export function clearMemorySelectedFormats() {
    const settings = getFromLocalStorage('settings');
    if (settings) {
        for (const key in settings.colsFormats) {
            if (key.startsWith('memory-address-format_') || key.startsWith('memory-value-format_')) {
                delete settings.colsFormats[key];
            }
        }
        setIntoLocalStorage('settings', settings);
    }
}
export function renderApp() {
    return __awaiter(this, arguments, void 0, function* (newState = interfaceState) {
        interfaceState = newState;
        if (interfaceState === "execute") {
            addClass('execute', 'files-editors');
        }
        else {
            removeClass('execute', 'files-editors');
        }
        yield render('app', 'app.ejs');
        scrollConsoleToBottom();
        watchingConsole();
    });
}
export function moveCursorToNextInstruction() {
    const editor = getEditor();
    if (editor) {
        if (vm.nextInstructionLineNumber != null) {
            editor.gotoLine(vm.nextInstructionLineNumber);
        }
    }
}
export function assemble() {
    return __awaiter(this, void 0, void 0, function* () {
        yield vm.stop();
        const file = getSelectedFile();
        if (file) {
            vm.assemble(file.content);
            renderEditor("execute");
            moveCursorToNextInstruction();
            yield renderApp("execute");
        }
    });
}
export function assembleFiles() {
    return __awaiter(this, void 0, void 0, function* () {
        const files = getFiles();
        console.log(files);
    });
}
export function stop() {
    return __awaiter(this, void 0, void 0, function* () {
        yield vm.stop();
        clearMemorySelectedFormats();
        yield renderApp("edit");
        renderEditor("edit");
    });
}
export function step() {
    return __awaiter(this, void 0, void 0, function* () {
        yield vm.step();
        moveCursorToNextInstruction();
        yield renderApp();
        renderEditor();
    });
}
export function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield vm.run();
        yield renderApp();
    });
}
export function getContext() {
    return {
        vm,
        memoryIntervals: getMemoryIntervals(),
        interfaceState: interfaceState,
        editorState: editorState,
        selectedInstructionsAddresses: getSelectedInstructionsAddresses(),
        files: getFiles(),
        selectedFile: getSelectedFile(),
        settings: getFromLocalStorage('settings'),
        samples: samples
    };
}
export function getSelectedInstructionsAddresses() {
    let selectedInstructionsAddresses = [];
    const editor = getEditor();
    if (editor) {
        const cursorPosition = editor.getCursorPosition();
        const highlightedRow = cursorPosition.row + 1;
        for (const [key, value] of vm.assembler.addressLineMap) {
            if (value === highlightedRow) {
                selectedInstructionsAddresses.push(key);
            }
        }
    }
    return selectedInstructionsAddresses;
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
            if (cell.address === vm.cpu.textSegmentStart.getValue()) {
                cell.tags.push({ name: '.text', type: 'section' });
            }
            if (cell.address === vm.cpu.dataSegmentStart.getValue()) {
                cell.tags.push({ name: '.data', type: 'section' });
            }
            vm.assembler.labels.forEach((address, label) => {
                const addressValue = address.getValue();
                if ((cell.address === addressValue) || ((addressValue > cell.address) && (addressValue < cell.address + 4))) {
                    cell.tags.push({ name: label + ':', type: 'label' });
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
    const settings = getFromLocalStorage('settings');
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
window.colFormatSelectOnChange = function (element) {
    return __awaiter(this, void 0, void 0, function* () {
        let settings = getFromLocalStorage("settings");
        if (!settings) {
            settings = default_settings;
        }
        else if (!settings.colsFormats) {
            settings.colsFormats = default_settings.colsFormats;
        }
        settings.colsFormats[element.id] = element.value;
        setIntoLocalStorage('settings', settings);
        yield renderApp();
    });
};
window.assembleClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield assemble();
    });
};
window.assembleFilesClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield assembleFiles();
    });
};
window.stepClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield step();
    });
};
window.runClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield run();
    });
};
window.stopClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield stop();
    });
};
window.newFileOnClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield newFile();
    });
};
window.importFilesOnClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        importFiles();
    });
};
window.openFileOnClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield openFile();
    });
};
window.importSampleOnClick = function (name) {
    return __awaiter(this, void 0, void 0, function* () {
        yield importSample(name);
    });
};
window.importSamplesOnClick = function (names) {
    return __awaiter(this, void 0, void 0, function* () {
        yield importSamples(names);
    });
};
window.changeFileOnClick = function (stringFileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileId = parseInt(stringFileId);
        yield changeFile(fileId);
    });
};
window.actionsOnFileOnClick = function (stringFileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileId = parseInt(stringFileId);
        actionsOnFile(fileId);
    });
};
window.closeFileOnClick = function (stringFileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileId = parseInt(stringFileId);
        yield closeFile(fileId);
    });
};
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
