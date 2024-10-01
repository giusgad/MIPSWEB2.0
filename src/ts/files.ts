import {updateInterface, stopExecution} from "./app.js";
import {addFileEditor, removeFileEditor, showEditor} from "./editor.js";
import {getFromLocalStorage, removeClass, render, setIntoLocalStorage} from "./index.js";

export type file = {
    id: number,
    name: string,
    type: string,
    content: string
};

export const samples: { [name: string]: string } = {
    "sample":
`
# LUI, ORI
LUI $t0, 0x1234        # $t0 = 0x12340000
ORI $t0, $t0, 0x5678   # $t0 = 0x12345678

LUI $t1, 0x0000        # $t1 = 0x00000000
ORI $t1, $t1, 0x0005   # $t1 = 0x00000005

LUI $t2, 0x0000        # $t2 = 0x00000000
ORI $t2, $t2, 0x0003   # $t2 = 0x00000003

# ADD
ADD $t3, $t1, $t2      # $t3 = $t1 + $t2 = 5 + 3 = 8

# SUB
SUB $t4, $t1, $t2      # $t4 = $t1 - $t2 = 5 - 3 = 2

# ADDI
ADDI $t5, $t1, 10      # $t5 = $t1 + 10 = 5 + 10 = 15

# ADDU
ADDU $t6, $t0, $t0     # $t6 = $t0 + $t0

# SUBU
SUBU $t7, $t0, $t0     # $t7 = $t0 - $t0 = 0

# ADDIU
ADDIU $s0, $t1, -1     # $s0 = $t1 + (-1) = 5 - 1 = 4

# MULT
MULT $t1, $t2          # $t1 * $t2 = 5 * 3
MFLO $s1               # $s1 = lown (15)
MFHI $s2               # $s2 = high (0)

# DIV
DIV $t1, $t2           # $t1 / $t2 = 5 / 3
MFLO $s3               # $s3 = 5 / 3 = 1
MFHI $s4               # $s4 = 5 % 3 = 2

# AND
AND $s5, $t0, $t3      # $s5 = $t0 AND $t3

# OR
OR $s6, $t0, $t3       # $s6 = $t0 OR $t3

# ANDI
ANDI $s7, $t0, 0x00FF  # $s7 = $t0 AND 0x00FF

# ORI
ORI $t8, $t0, 0x00FF   # $t8 = $t0 OR 0x00FF

# SLL
SLL $t9, $t1, 2        # $t9 = $t1 << 2 (5 << 2 = 20)

# SRL
SRL $v0, $t1, 1        # $v0 = $t1 >> 1 (5 >> 1 = 2)

# SW
SW $t0, 0($sp)         # $t0 -> stack

# LW
LW $a0, 0($sp)         # stack -> $a0
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
    const files = getFromLocalStorage("files");
    return files ? files : [];
}

export function setFiles(files: file[]) {
    setIntoLocalStorage("files", files);
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