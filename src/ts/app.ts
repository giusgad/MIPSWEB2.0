import {getFiles, getSelectedFile, getSelectedFileId, setSelectedFileId} from "./files.js";
import {addClass, getFromLocalStorage, removeClass, render, setIntoLocalStorage} from "./index.js";
import {reloadEditors, updateEditor} from "./editor.js";
import {VirtualMachine} from "./virtual-machine/VirtualMachine.js";
import {CPU} from "./virtual-machine/CPU.js";
import {Binary} from "./virtual-machine/Utils.js";

export const vm = new VirtualMachine(new CPU);

export let state: "edit" | "execute" = "edit";

const default_settings = {
    tables: {
        registers: {
            columns: {
                value: { format: 'decimal' }
            }
        },
        memory: {
            columns: {
                address: { format: 'decimal' },
                value: { format: 'hex' }
            }
        }
    }
};

document.body.classList.add('wait');
document.addEventListener('DOMContentLoaded', async () => {

    if (!getFromLocalStorage("settings")) {
        setIntoLocalStorage("settings", default_settings);
    }

    await render('app', 'app.ejs');
    reloadEditors(getFiles(), getSelectedFileId());

    initializeSelectListeners();

    document.body.classList.remove('wait');
});

function initializeSelectListeners() {
    const registersValueFormatSelect = document.getElementById('col-format-registers-value') as HTMLSelectElement;
    const memoryAddressFormatSelect = document.getElementById('col-format-memory-address') as HTMLSelectElement;
    const memoryValueFormatSelect = document.getElementById('col-format-memory-value') as HTMLSelectElement;
    if (registersValueFormatSelect) {
        registersValueFormatSelect.addEventListener('change', async () => {
            updateSettingInLocalStorage('tables.registers.columns.value.format', registersValueFormatSelect.value);
            await updateInterface();
        });
    }
    if (memoryAddressFormatSelect) {
        memoryAddressFormatSelect.addEventListener('change', async () => {
            updateSettingInLocalStorage('tables.memory.columns.address.format', memoryAddressFormatSelect.value);
            await updateInterface();
        });
    }
    if (memoryValueFormatSelect) {
        memoryValueFormatSelect.addEventListener('change', async () => {
            updateSettingInLocalStorage('tables.memory.columns.value.format', memoryValueFormatSelect.value);
            await updateInterface();
        });
    }
}

function updateSettingInLocalStorage(path: string, value: string) {
    const settings = getFromLocalStorage("settings") || {};
    setDeepValue(settings, path, value);
    setIntoLocalStorage("settings", settings);
}

function setDeepValue(obj: any, path: string, value: any) {
    const keys = path.split('.');
    let temp = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!temp[keys[i]]) temp[keys[i]] = {};
        temp = temp[keys[i]];
    }
    temp[keys[keys.length - 1]] = value;
}

export async function updateInterface() {

    const ctx = getContext();
    const state = ctx.state;

    if (state === "execute") {

        await render('vm-buttons', '/app/vm-buttons.ejs', ctx);
        await render('opened-files', '/app/opened-files.ejs', ctx);
        await render('registers', '/app/registers.ejs', ctx);
        await render('memory', '/app/memory.ejs', ctx);
        addClass('execute', 'files-editors');
        addClass('execute', 'opened-files');
        addClass('execute', 'registers');

    } else if (state === "edit") {

        await render('vm-buttons', '/app/vm-buttons.ejs', ctx);
        await render('opened-files', '/app/opened-files.ejs', ctx);
        await render('registers', '/app/registers.ejs', ctx);
        await render('memory', '/app/memory.ejs', ctx);
        removeClass('execute', 'files-editors');
        removeClass('execute', 'opened-files');
        removeClass('execute', 'registers');
    }

    initializeSelectListeners();

}

(window as any).assembleClick = async function() {
    const file = getSelectedFile();
    if (file) {
        if (file.content) {
            vm.assemble(file.content);
            state = "execute";
            await updateInterface();
        }
    }
    updateEditor();
};

(window as any).stopClick = async function() {
    await stopExecution();
};

(window as any).stepClick = async function() {
    vm.step();
    await updateInterface();
    updateEditor();
};

(window as any).runClick = async function() {
    vm.run();
    await updateInterface();
    updateEditor();
};

(window as any).settingsClick = async function() {
    console.log("Settings");
};

export async function stopExecution() {
    vm.stop();
    state = "edit";
    await updateInterface();
    updateEditor();
}

export function getContext() {
    const nextInstructionLineNumber = vm.nextInstructionLineNumber;
    const files = getFiles();
    let selectedFileId = getSelectedFileId();
    if (selectedFileId === null) {
        if (files.length > 0) {
            setSelectedFileId(files[0].id);
        }
    }
    let selectedFile = getSelectedFile();
    if ((selectedFileId !== null) && (!selectedFile)) {
        setSelectedFileId(files[0].id);
        selectedFile = getSelectedFile();
    }
    const registers = vm.getRegisters();
    const memory = vm.getMemory();
    const ctx = {
        vm,
        state,
        files,
        selectedFile,
        registers,
        memory,
        nextInstructionLineNumber,
        settings: getFromLocalStorage("settings")
    };
    return ctx;
}

(window as any).convert = convert;
function convert(format: string, value: number, signed: boolean = false) {
    if (format === 'decimal') {
        return value;
    }
    if (format === 'hex') {
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
}