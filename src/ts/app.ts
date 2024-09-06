import {getFiles, getSelectedFile, getSelectedFileId, setSelectedFileId} from "./files.js";
import {addClass, removeClass, render} from "./index.js";
import {VirtualMachine} from "./virtual-machine/VirtualMachine.js";
import {reloadEditors, updateEditor} from "./editor.js";

export const vm = new VirtualMachine();

document.body.classList.add('wait');
document.addEventListener('DOMContentLoaded', async () => {

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
        selectedFileId = getSelectedFileId();
        selectedFile = getSelectedFile();
    }
    await render('app', 'app.ejs', {state: "edit", files, selectedFile});
    reloadEditors(files, selectedFileId);

    document.body.classList.remove('wait');
});

export async function updateInterface() {
    const state = vm.getState();
    const files = getFiles();
    const selectedFile = getSelectedFile();

    if (state === "execute") {

        await render('vm-buttons', '/app/vm-buttons.ejs', {state, files});
        await render('opened-files', '/app/opened-files.ejs', {state, files, selectedFile});
        await render('registers', '/app/registers.ejs', {state, files});
        await render('memory', '/app/memory.ejs', {state, files});
        addClass('execute', 'files-editors');
        addClass('execute', 'opened-files');
        addClass('execute', 'registers');

    } else if (state === "edit") {

        await render('vm-buttons', '/app/vm-buttons.ejs', {state, files});
        await render('opened-files', '/app/opened-files.ejs', {state, files, selectedFile});
        await render('registers', '/app/registers.ejs', {state, files});
        await render('memory', '/app/memory.ejs', {state, files});
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
    vm.stop();
    await updateInterface();
    updateEditor();
};

(window as any).stepClick = async function() {
    console.log("Step click");
    updateEditor();
};

(window as any).runClick = async function() {
    console.log("Run click");
    updateEditor();
};

(window as any).settings = async function() {
    console.log("Settings");
};