import {getFiles, getSelectedFile, getSelectedFileId, setSelectedFileId} from "./files.js";
import {addClass, removeClass, render} from "./index.js";
import {VirtualMachine} from "./virtual-machine/VirtualMachine.js";
import {reloadEditors, updateEditor} from "./editor.js";

export const vm = new VirtualMachine();

const settings = {
    tables: {
        registers: {
            columns: {
                number: { format: 'decimal' },
                name: { format: 'text' },
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
document.addEventListener('DOMContentLoaded', async () => {

    await render('app', 'app.ejs');
    reloadEditors(getFiles(), getSelectedFileId());

    document.body.classList.remove('wait');
});

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
}

(window as any).assembleClick = async function() {
    const file = getSelectedFile();
    if (file) {
        if (file.content) {
            vm.assemble(file.content);
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
    await updateInterface();
    updateEditor();
}

export function getContext() {
    const state = vm.getState();
    const nextInstructionLineNumber = vm.getNextInstructionLineNumber();
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
    const memory = Array.from(vm.getMemory().entries()).map(([address, value]) => ({
        address,
        value
    }));
    const ctx = {
        state,
        files,
        selectedFile,
        registers,
        memory,
        nextInstructionLineNumber,
        settings
    };
    return ctx;
}