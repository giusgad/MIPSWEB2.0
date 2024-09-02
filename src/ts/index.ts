import {getFiles, getSelectedFileId} from "./files.js";
import { Icons } from './icons.js';
import {reloadEditors} from "./editor.js";

declare const ejs: any;
declare const ace: any;

document.addEventListener('DOMContentLoaded', async () => {

    if (typeof ejs === 'undefined' || typeof ace === 'undefined') {
        console.error('Required libraries (EJS or ACE) failed to load');
        return;
    }

    await renderElementById('app', null);

    const files = getFiles();
    if (files.length > 0) {
        let fileId = getSelectedFileId();
        if (!fileId) {
            fileId = files[0].id;
        }
        await renderElementById('files', {files, fileId: fileId});
        reloadEditors(files, fileId);
    } else {
        localStorage.removeItem('selectedFileId');
    }

    await renderElementById('registers', null);
    await renderElementById('memory', null);

    document.body.style.opacity = '1';
});






export async function renderElementById(id: string, data: any) {
    try {
        const element = document.getElementById(id);
        if (!element) throw new Error(`No element found by Id: ${id}`);
        data = { ...data, Icons };
        element.innerHTML = await render(id, data);
    } catch (error) {
        console.error(error);
    }
}

async function render(templateName: string, data: any) {
    const template = await fetch(`templates/${templateName}.ejs`).then(res => {
        if (!res.ok) {
            throw new Error(`No template found: "templates/${templateName}.ejs"`);
        }
        return res.text();
    });

    return ejs.render(template, data);
}

(window as any).settings = function() {
    console.log("Settings");
};