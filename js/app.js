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
export const vm = new VirtualMachine(new CPU);
const settings = {
    tables: {
        registers: {
            columns: {
                value: { format: 'decimal' }
            }
        },
        memory: {
            columns: {
                address: { format: 'decimal' },
                value: { format: 'basic' }
            }
        }
    }
};
document.body.classList.add('wait');
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    if (!getFromLocalStorage("settings")) {
        setIntoLocalStorage("settings", settings);
    }
    yield render('app', 'app.ejs');
    reloadEditors(getFiles(), getSelectedFileId());
    document.body.classList.remove('wait');
}));
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
    });
}
window.assembleClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const file = getSelectedFile();
        if (file) {
            if (file.content) {
                vm.assemble(file.content);
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
        yield updateInterface();
        updateEditor();
    });
}
export function getContext() {
    const state = vm.state;
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
