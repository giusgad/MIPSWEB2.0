import {getFromLocalStorage, render, setIntoLocalStorage} from "./index.js";
import {addFileEditor, removeFileEditor, showEditor} from "./editor.js";
import {renderApp} from "./app.js";

export type file = {
    id: number;
    name: string;
    type: string;
    content: string;
};

export const samples: { [name: string]: string } = {
    "sample":
        `
.data

int_values:  .word 10, 20, 30    
char_values: .byte 'A', 'B', 'C' 
buffer1:     .space 10          
buffer2:     .space 20          

.text

main:
    addiu $t1, $zero, 5     
    move $t2, $t1            

loop_start:
    addiu $t1, $t1, -1       
after_decrement:
    bgtz $t1, loop_start     
    nop                     

after_loop:
    addiu $v0, $zero, 10    
    syscall                 
`
};

export async function openFile() {

    try {

        const [fileHandle] = await (window as any).showOpenFilePicker({
            types: [
                {
                    description: 'Assembly Files',
                    accept: { 'text/plain': ['.asm'] },
                },
            ],
            multiple: false,
        });

        const fileData = await fileHandle.getFile();
        const fileContent = await fileData.text();
        const fileId = generateUniqueId();
        const fileName = generateUniqueName(fileData.name.split(".")[0]);

        console.log(fileHandle);

    } catch (err) {
        console.error('Errore durante l’apertura del file:', err);
    }

}

export async function saveFile(fileId: number) {
    const file = getFile(fileId);
}

export function importFiles() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.asm';
    input.multiple = true;
    input.onchange = async () => {
        if (input.files && input.files.length > 0) {
            const filesArray = Array.from(input.files);
            for (const selectedFile of filesArray) {
                importFile(selectedFile);
            }
        }
    };
    input.click();
}

export function importFile(file: File) {
    const reader = new FileReader();
    reader.onload = async (event) => {
        const fileId = generateUniqueId();
        const fileName = generateUniqueName(file.name.split(".")[0]);
        const fileContent = event.target?.result as string || '';
        const fileToAdd: file = {
            id: fileId,
            name: fileName,
            type: 'asm',
            content: fileContent
        };
        await addFile(fileToAdd);
    };
    reader.readAsText(file);
}

export function updateFile(fileId: number, content: string) {
    const files = getFiles();
    const file = files.find(file => file.id === fileId);
    if (file) {
        file.content = content;
        setFiles(files);
    }
}

export function actionsOnFile(fileId: number) {
    console.log('actionsOnFile', fileId);
}

async function addFile(file: file) {
    const files = getFiles();
    files.push(file);
    setFiles(files);
    setSelectedFileId(file.id);
    addFileEditor(file);
    await renderApp();
}

export async function changeFile(fileId: number) {
    setSelectedFileId(fileId);
    showEditor(fileId);
    await render('app', 'app.ejs');
}

export async function closeFile(fileId: number) {
    //stop the execution if the file is the one being executed
    setFiles(getFiles().filter(file => file.id !== fileId));
    removeFileEditor(fileId);
    const files = getFiles();
    if (files.length > 0) {
        await changeFile(files[files.length - 1].id);
    } else {
        localStorage.removeItem('selectedFileId');
    }
    await render('app', 'app.ejs');
}

export async function importSample(name: string) {
    const fileId = generateUniqueId();
    const fileName = generateUniqueName(name);
    const fileToAdd: file = {
        id: fileId,
        name: fileName,
        type: "asm",
        content: samples[name]
    };
    await addFile(fileToAdd);
}

export async function newFile() {
    const fileName = generateUniqueName("untitled");
    const fileId = generateUniqueId();
    const fileToAdd: file = {
        id: fileId,
        name: fileName,
        type: "asm",
        content: ""
    };
    await addFile(fileToAdd);
}

export function setFiles(files: file[]) {
    setIntoLocalStorage("files", files);
}

export function getFiles(): file[] {
    const files = getFromLocalStorage("files");
    return files ? files : [];
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
    const files = getFiles();
    if (fileId !== null) {
        if (files.length > 0) {
            for (const file of getFiles()) {
                if (file.id === fileId) return file;
            }
        }
    }
    if (files.length > 0) {
        const file = files[files.length - 1];
        setSelectedFileId(file.id);
        return file;
    }
    localStorage.removeItem('selectedFileId');
    return null;
}

export function getSelectedFileId(): number | null {
    const fileId = localStorage.getItem("selectedFileId");
    return fileId ? Number(fileId) : null;
}

function generateUniqueId() {
    const files = getFiles();
    return files.length > 0 ? Math.max(...files.map(file => file.id)) + 1 : 0;
}

function generateUniqueName(name: string): string {
    const files = getFiles();
    let newName = name;
    let i = 1;
    while (files.find(file => file.name === newName)) {
        newName = `${name}_${i + 1}`;
        i++;
    }
    return newName;
}