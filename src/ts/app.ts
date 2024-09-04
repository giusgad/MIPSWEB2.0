import {getFiles, getSelectedFile} from "./files.js";
import {render} from "./index.js";

let state = "edit";

export function getVMState() {
    return state;
}

export async function updateInterface(newState: string) {
    state = newState;
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

function addClass(className: string, id: string) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.add(className);
    } else {
        console.error(`Element with id "${id}" not found.`);
    }
}

function removeClass(className: string, id: string) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.remove(className);
    } else {
        console.error(`Element with id "${id}" not found.`);
    }
}


(window as any).assembleClick = async function() {
    await updateInterface("execute");
};

(window as any).stopClick = async function() {
    await updateInterface("edit");
};

(window as any).stepClick = async function() {
    console.log("Step click");
};

(window as any).runClick = async function() {
    console.log("Run click");
};