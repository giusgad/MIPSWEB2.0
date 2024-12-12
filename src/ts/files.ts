import {getFromLocalStorage, render, setIntoLocalStorage} from "./index.js";
import {addFileEditor, removeFileEditor, renderEditor, showEditor} from "./editor.js";
import {renderApp} from "./app.js";

export type file = {
    id: number;
    name: string;
    type: string;
    content: string;
};

export const samples: { [name: string]: string } = {
    "mulDiv": `

.data
    
a:\t.word 10
b:\t.word 20

.text
.globl main
    
main:

    la $s1 a
    la $s2 b
    
    li $t0 100
    li $t1 45
    
    mult $t0, $t1
    mflo $t2
    
    mul $t3, $t0, $t1 
    
    div $t0, $t1
    mflo $t4
    
    div $t5, $t0, $t1
  `,
    "nextInt": `

\t.data
msg1:\t.asciiz "Inserire numero intero: "\t
msg2:\t.asciiz "Intero successivo: "

\t.text
\t.globl main
main:
\tli $v0 4 # selezione di print_string (codice = 4)
\tla $a0 msg1\t# $a0 = indirizzo di msg1
\tsyscall

\tli $v0 5 # Selezione read_int (codice = 5)
\tsyscall\t
\tmove $t0 $v0 # sposto il risultato in $t0

\tli $v0 4 # selezione di print_string
\tla $a0 msg2 # $a0 = indirizzo di string2
\tsyscall\t\t\t
\t
\taddi $t0 $t0 1 # $t0+=1

\tli $v0 1 # selezione di print_int (codice = 1)
\tadd $a0 $zero $t0 # $a0 = $t0
\tsyscall\t\t\t

\tli $v0 10 # exit
\tsyscall
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
        console.error(err);
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
    await renderApp();
    renderEditor("edit");
    await render('memory', 'app/memory.ejs');
    await render('vm-buttons', 'app/vm-buttons.ejs');
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
    await renderApp();
}

export async function importSample(name: string) {
    const fileId = generateUniqueId();
    const fileName = generateUniqueName(name);
    const fileContent = await fetch(`resources/samples/${name}.asm`).then(res => {
        if (!res.ok) {
            throw new Error(`No sample file found: "resources/samples/${name}.asm"`);
        }
        return res.text();
    });
    const fileToAdd: file = {
        id: fileId,
        name: fileName,
        type: "asm",
        content: fileContent
    };
    await addFile(fileToAdd);
}

export async function importSamples(names: string[]) {
    for (const name of names) {
        await importSample(name);
    }
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