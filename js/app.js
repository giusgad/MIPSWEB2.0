var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getFiles, getSelectedFile, getSelectedFileId, setSelectedFileId } from "./files.js";
import { addClass, getFromLocalStorage, removeClass, render, setIntoLocalStorage } from "./index.js";
import { reloadEditors, updateEditor } from "./editor.js";
import { VirtualMachine } from "./virtual-machine/VirtualMachine.js";
import { CPU } from "./virtual-machine/CPU.js";
import { Binary } from "./virtual-machine/Utils.js";
export const vm = new VirtualMachine(new CPU);
export let state = "edit";
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
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    if (!getFromLocalStorage("settings")) {
        setIntoLocalStorage("settings", default_settings);
    }
    yield render('app', 'app.ejs');
    reloadEditors(getFiles(), getSelectedFileId());
    initializeSelectListeners();
    document.body.classList.remove('wait');
}));
function initializeSelectListeners() {
    const registersValueFormatSelect = document.getElementById('col-format-registers-value');
    const memoryAddressFormatSelect = document.getElementById('col-format-memory-address');
    const memoryValueFormatSelect = document.getElementById('col-format-memory-value');
    if (registersValueFormatSelect) {
        registersValueFormatSelect.addEventListener('change', () => __awaiter(this, void 0, void 0, function* () {
            updateSettingInLocalStorage('tables.registers.columns.value.format', registersValueFormatSelect.value);
            yield updateInterface();
        }));
    }
    if (memoryAddressFormatSelect) {
        memoryAddressFormatSelect.addEventListener('change', () => __awaiter(this, void 0, void 0, function* () {
            updateSettingInLocalStorage('tables.memory.columns.address.format', memoryAddressFormatSelect.value);
            yield updateInterface();
        }));
    }
    if (memoryValueFormatSelect) {
        memoryValueFormatSelect.addEventListener('change', () => __awaiter(this, void 0, void 0, function* () {
            updateSettingInLocalStorage('tables.memory.columns.value.format', memoryValueFormatSelect.value);
            yield updateInterface();
        }));
    }
}
function updateSettingInLocalStorage(path, value) {
    const settings = getFromLocalStorage("settings") || {};
    setDeepValue(settings, path, value);
    setIntoLocalStorage("settings", settings);
}
function setDeepValue(obj, path, value) {
    const keys = path.split('.');
    let temp = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!temp[keys[i]])
            temp[keys[i]] = {};
        temp = temp[keys[i]];
    }
    temp[keys[keys.length - 1]] = value;
}
export function updateInterface() {
    return __awaiter(this, void 0, void 0, function* () {
        const ctx = getContext();
        const state = ctx.state;
        if (state === "execute") {
            yield render('vm-buttons', '/app/vm-buttons.ejs', ctx);
            yield render('opened-files', '/app/opened-files.ejs', ctx);
            yield render('registers', '/app/registers.ejs', ctx);
            yield render('memory', '/app/memory.ejs', ctx);
            addClass('execute', 'files-editors');
            addClass('execute', 'opened-files');
            addClass('execute', 'registers');
        }
        else if (state === "edit") {
            yield render('vm-buttons', '/app/vm-buttons.ejs', ctx);
            yield render('opened-files', '/app/opened-files.ejs', ctx);
            yield render('registers', '/app/registers.ejs', ctx);
            yield render('memory', '/app/memory.ejs', ctx);
            removeClass('execute', 'files-editors');
            removeClass('execute', 'opened-files');
            removeClass('execute', 'registers');
        }
        initializeSelectListeners();
    });
}
window.assembleClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const file = getSelectedFile();
        if (file) {
            if (file.content) {
                vm.assemble(file.content);
                state = "execute";
                yield updateInterface();
            }
        }
        updateEditor();
    });
};
window.stopClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield stopExecution();
    });
};
window.stepClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        vm.step();
        yield updateInterface();
        updateEditor();
    });
};
window.runClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        vm.run();
        yield updateInterface();
        updateEditor();
    });
};
window.settingsClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Settings");
    });
};
export function stopExecution() {
    return __awaiter(this, void 0, void 0, function* () {
        vm.stop();
        state = "edit";
        yield updateInterface();
        updateEditor();
    });
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
window.convert = convert;
function convert(format, value, signed = false) {
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
