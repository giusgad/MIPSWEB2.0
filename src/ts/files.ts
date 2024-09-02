import {renderElementById} from "./index.js";
import {addFileEditor, removeFileEditor, showEditor} from "./editor.js";

export type file = {
    id: number,
    name: string,
    type: string,
    content: string
};

(window as any).newFile = async function() {
    const files = getFiles();
    const fileName = generateUniqueName("untitled", files);
    const fileId = files.length > 0 ? Math.max(...files.map(file => file.id)) + 1 : 0;
    const fileToAdd: file = {
        id: fileId,
        name: fileName,
        type: "asm",
        content: ""
    };
    await addFile(fileToAdd, files);
};

(window as any).closeFile = async function(fileId: string) {
    let files = getFiles();
    setFiles(files.filter(file => file.id !== Number(fileId)));
    removeFileEditor(Number(fileId));
    files = getFiles();
    if (files.length > 0) {
        await changeFileTab(`${files[files.length - 1].id}`);
    } else {
        localStorage.removeItem('selectedFileId');
        await renderElementById('files', {});
    }
};

(window as any).importFile = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.asm';
    input.addEventListener('change', () => {
        const file = input.files![0];
        const reader = new FileReader();
        reader.onload = async () => {
            const files = getFiles();
            const fileName = generateUniqueName(file.name.split(".")[0], files);
            const fileId = files.length > 0 ? Math.max(...files.map(file => file.id)) + 1 : 0;
            const fileToAdd: file = {
                id: fileId,
                name: fileName,
                type: "asm",
                content: reader.result as string
            };
            await addFile(fileToAdd, files);
        };
        reader.readAsText(file);
    });
    input.click();
};

(window as any).changeFileTab = changeFileTab;
async function changeFileTab(fileId: string) {
    setSelectedFileId(Number(fileId));
    await renderElementById('files', {files: getFiles(), fileId: Number(fileId)});
    showEditor(Number(fileId));
}

export function updateFile(fileId: number, content: string) {
    const files = getFiles();
    const file = files.find(file => file.id === fileId);
    if (file) {
        file.content = content;
        setFiles(files);
    }
}

async function addFile(file: file, files: file[]) {
    files.push(file);
    setFiles(files);
    await changeFileTab((file.id).toString());
    addFileEditor(file);
}

export function getFiles(): file[] {
    const files = localStorage.getItem("files");
    return files ? JSON.parse(files) : [];
}

function setFiles(files: file[]) {
    localStorage.setItem("files", JSON.stringify(files));
}

export function setSelectedFileId(fileId: number) {
    localStorage.setItem("selectedFileId", fileId.toString());
}

export function getSelectedFileId(): number | null {
    const fileId = localStorage.getItem("selectedFileId");
    return fileId ? Number(fileId) : null;
}

function generateUniqueName(name: string, files: file[]): string {
    let newName = name;
    let i = 1;
    while (files.find(file => file.name === newName)) {
        newName = `${name}_${i}`;
        i++;
    }
    return newName;
}