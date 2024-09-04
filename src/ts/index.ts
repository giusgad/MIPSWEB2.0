import {Icons} from "./icons.js";
import {getFiles, getSelectedFile, getSelectedFileId, setSelectedFileId} from "./files.js";
import {getVMState, updateInterface} from "./app.js";
import {reloadEditors} from "./editor.js";

declare const ejs: any;
(window as any).ejs = ejs;
declare const ace: any;

document.body.classList.add('wait');
document.addEventListener('DOMContentLoaded', async () => {

    if (typeof ejs === 'undefined' || typeof ace === 'undefined') {
        console.error('Required libraries (EJS or ACE) failed to load');
        return;
    }

    const state = getVMState();
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
    await render('app', 'app.ejs', {state, files, selectedFile});
    reloadEditors(files, selectedFileId);

    document.body.classList.remove('wait');
});

export async function render(id: string, templatePath: string, data: any) {
    try {
        const element = document.getElementById(id);
        if (!element) throw new Error(`No element found by Id: ${id}`);
        element.innerHTML = await renderTemplate(templatePath, data);
    } catch (error) {
        console.error(error);
    }
}

(window as any).renderTemplate = renderTemplate;
async function renderTemplate(templatePath: string, data: any) {
    const template = await fetch(`templates/${templatePath}`).then(res => {
        if (!res.ok) {
            throw new Error(`No template found: "templates/${templatePath}"`);
        }
        return res.text();
    });
    data = { ...data, Icons };
    return ejs.render(template, data, { async: true });
}

(window as any).settings = async function() {
    console.log("Settings");
};