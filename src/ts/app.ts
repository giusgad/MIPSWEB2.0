import {VirtualMachine} from "./virtual-machine/VirtualMachine.js";
import {CPU} from "./virtual-machine/CPU.js";
import {addClass, getFromLocalStorage, removeClass, render, setIntoLocalStorage} from "./index.js";
import {default_settings} from "./settings.js";
import {
    actionsOnFile,
    changeFile,
    closeFile,
    getFiles,
    getSelectedFile,
    importFiles,
    importSample, importSamples,
    newFile,
    openFile, samples
} from "./files.js";
import {editorState, filesEditors, getEditor, initEditors, renderEditor} from "./editor.js";
import {Binary} from "./virtual-machine/Utils.js";
import {scrollConsoleToBottom, watchingConsole} from "./console.js";

export const vm = new VirtualMachine(new CPU);

export let interfaceState: "edit" | "execute" = "edit";

document.addEventListener('DOMContentLoaded', async () => {

    if (!getFromLocalStorage("settings")) {
        setIntoLocalStorage("settings", default_settings);
    }

    await renderApp();
    initEditors();
    clearMemorySelectedFormats();
});

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

export async function renderApp(newState: "edit" | "execute" = interfaceState) {
    interfaceState = newState;
    if (interfaceState === "execute") {
        addClass('execute', 'files-editors');
    } else {
        removeClass('execute', 'files-editors');
    }
    await render('app', 'app.ejs');
    scrollConsoleToBottom();
    watchingConsole();
    for (const fileEditor of filesEditors) {
        const editor = fileEditor.aceEditor;
        editor.resize();
    }
}

export function moveCursorToNextInstruction() {
    const editor = getEditor();
    if (editor) {
        if (vm.nextInstructionLineNumber != null) {
            editor.gotoLine(vm.nextInstructionLineNumber);
        }
    }
}

export async function assemble() {
    await vm.stop();
    const file = getSelectedFile();
    if (file) {
        vm.assemble(file.content);
        renderEditor("execute");
        moveCursorToNextInstruction();
        await renderApp("execute");
    }
}

export async function assembleFiles() {
    const files = getFiles();
    console.log(files);
}

export async function stop() {
    await vm.stop();
    clearMemorySelectedFormats();
    await renderApp("edit");
    renderEditor("edit");
}

export async function step() {
    await vm.step();
    moveCursorToNextInstruction();
    await renderApp();
    renderEditor();
}

export async function run() {
    await vm.run();
    await renderApp();
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
    let selectedInstructionsAddresses: number[] = [];
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
        } else {
            intervals.push(extendInterval(currentInterval, intervals.length));
            currentInterval = [currentCell];
        }
    }
    intervals.push(extendInterval(currentInterval, intervals.length));

    for (const interval of intervals) {
        for (const cell of interval.cells) {
            if (cell.address === vm.cpu.textSegmentStart.getValue()) {
                cell.tags.push({name: '.text', type: 'section'});
            }
            if (cell.address === vm.cpu.dataSegmentStart.getValue()) {
                cell.tags.push({name: '.data', type: 'section'});
            }
            vm.assembler.labels.forEach((address, label) => {
                const addressValue = address.getValue();
                if ((cell.address === addressValue) || ((addressValue > cell.address) && (addressValue < cell.address + 4))) {
                    cell.tags.push({name: label + ':', type: 'label'});
                }
            });
            for (const register of vm.getRegisters()) {
                const addressValue = register.value;
                if ((cell.address === addressValue) || ((addressValue > cell.address) && (addressValue < cell.address + 4))) {
                    if (register.name === 'pc') {
                        cell.tags.push({name: register.name, type: 'pc'});
                    } else {
                        cell.tags.push({name: register.name, type: 'register'});
                    }
                }
            }
        }
    }

    return intervals;
}

export function extendInterval(cells: any, index: number) {
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

(window as any).colFormatSelectOnChange = async function(element: HTMLSelectElement) {
    let settings = getFromLocalStorage("settings");
    if (!settings) {
        settings = default_settings;
    } else if (!settings.colsFormats) {
        settings.colsFormats = default_settings.colsFormats;
    }
    settings.colsFormats[element.id] = element.value;
    setIntoLocalStorage('settings', settings);
    await renderApp();
};

(window as any).assembleClick = async function() {
    await assemble();
};

(window as any).assembleFilesClick = async function() {
    await assembleFiles();
};

(window as any).stepClick = async function() {
    await step();
};

(window as any).runClick = async function() {
    await run();
};

(window as any).stopClick = async function() {
    await stop();
};

(window as any).newFileOnClick = async function() {
    await newFile();
};

(window as any).importFilesOnClick = async function() {
    importFiles();
};

(window as any).openFileOnClick = async function() {
    await openFile();
};

(window as any).importSampleOnClick = async function(name: string) {
    await importSample(name);
};

(window as any).importSamplesOnClick = async function(names: string[]) {
    await importSamples(names);
};


(window as any).changeFileOnClick = async function(stringFileId: string) {
    const fileId = parseInt(stringFileId);
    await changeFile(fileId);
};

(window as any).actionsOnFileOnClick = async function(stringFileId: string) {
    const fileId = parseInt(stringFileId);
    actionsOnFile(fileId);
};

(window as any).closeFileOnClick = async function(stringFileId: string) {
    const fileId = parseInt(stringFileId);
    await closeFile(fileId);
};

(window as any).convert = function(format: string, value: number, signed: boolean = false) {
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

