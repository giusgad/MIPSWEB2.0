import {updateInterface, stopExecution} from "./app.js";
import {addFileEditor, removeFileEditor, showEditor} from "./editor.js";
import {removeClass, render} from "./index.js";

export type file = {
    id: number,
    name: string,
    type: string,
    content: string
};

export const samples: { [name: string]: string } = {
    "sample":
`
.data



.text

    addi $t1, $zero, 1  # 0 + 1 = 1 -> $t1
    addi $t2, $zero, 2  # 0 + 2 = 2 -> $t2
    addi $t3, $zero, 3  # 0 + 3 = 3 -> $t3
    addi $t4, $zero, 4  # 0 + 4 = 4 -> $t4
    addi $t5, $zero, 5  # 0 + 5 = 5 -> $t5
    sub  $t6, $t4, $t3  # 4 - 3 = 1  -> $t6
    add  $t7, $t6, $t2  # 1 + 2 = 3  -> $t7
    addi $s0, $t7, 7    # 3 + 7 = 10 -> $s0
`
};

(window as any).newFile = async function() {
    await stopExecution();
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

(window as any).importFile = async function () {
    await stopExecution();
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

(window as any).openSample = async function(name: string) {
    const files = getFiles();
    const fileId = files.length > 0 ? Math.max(...files.map(file => file.id)) + 1 : 0;
    const fileToAdd: file = {
        id: fileId,
        name: name,
        type: "asm",
        content: samples[name]
    };
    await addFile(fileToAdd, files);
};

(window as any).changeFileTab = changeFileTab;
async function changeFileTab(sFileId: string) {
    await stopExecution();
    const fileId = Number(sFileId);
    setSelectedFileId(fileId);
    showEditor(fileId);
    await updateInterface();
}

(window as any).closeFile = async function(sFileId: string) {
    await stopExecution();
    const fileId = Number(sFileId);
    let files = getFiles();
    setFiles(files.filter(file => file.id !== fileId));
    removeFileEditor(fileId);
    files = getFiles();
    if (files.length > 0) {
        await changeFileTab(`${files[files.length - 1].id}`);
    } else {
        localStorage.removeItem('selectedFileId');
        await render('app', 'app.ejs');
    }
};

async function addFile(file: file, files: file[]) {
    files.push(file);
    setFiles(files);
    setSelectedFileId(file.id);
    await render('app', 'app.ejs');
    removeClass('execute', 'files-editors');
    addFileEditor(file);
}

export function getFiles(): file[] {
    const files = localStorage.getItem("files");
    return files ? JSON.parse(files) : [];
}

export function setFiles(files: file[]) {
    localStorage.setItem("files", JSON.stringify(files));
}

export function getFile(fileId: number) {
    for (const file of getFiles()) {
        if (file.id === fileId) return file;
    }
    return null;
}

export function setSelectedFileId(fileId: number) {
    const file = getFile(fileId);
    if (file) {
        localStorage.setItem("selectedFileId", file.id.toString());
    }
}

export function getSelectedFile(): file | null {
    const fileId = getSelectedFileId();
    if (fileId !== null) {
        const files = getFiles();
        if (files.length > 0) {
            for (const file of getFiles()) {
                if (file.id === fileId) return file;
            }
        }
    }
    localStorage.removeItem('selectedFileId');
    return null;
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

export function updateFile(fileId: number, content: string) {
    const files = getFiles();
    const file = files.find(file => file.id === fileId);
    if (file) {
        file.content = content;
        setFiles(files);
    }
}