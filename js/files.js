var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getFromLocalStorage, render, setIntoLocalStorage } from "./index.js";
import { addFileEditor, removeFileEditor, renderEditor, showEditor } from "./editor.js";
import { renderApp } from "./app.js";
export const samples = {
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
  `
};
export function openFile() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const [fileHandle] = yield window.showOpenFilePicker({
                types: [
                    {
                        description: 'Assembly Files',
                        accept: { 'text/plain': ['.asm'] },
                    },
                ],
                multiple: false,
            });
            const fileData = yield fileHandle.getFile();
            const fileContent = yield fileData.text();
            const fileId = generateUniqueId();
            const fileName = generateUniqueName(fileData.name.split(".")[0]);
            console.log(fileHandle);
        }
        catch (err) {
            console.error(err);
        }
    });
}
export function saveFile(fileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const file = getFile(fileId);
    });
}
export function importFiles() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.asm';
    input.multiple = true;
    input.onchange = () => __awaiter(this, void 0, void 0, function* () {
        if (input.files && input.files.length > 0) {
            const filesArray = Array.from(input.files);
            for (const selectedFile of filesArray) {
                importFile(selectedFile);
            }
        }
    });
    input.click();
}
export function importFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const fileId = generateUniqueId();
        const fileName = generateUniqueName(file.name.split(".")[0]);
        const fileContent = ((_a = event.target) === null || _a === void 0 ? void 0 : _a.result) || '';
        const fileToAdd = {
            id: fileId,
            name: fileName,
            type: 'asm',
            content: fileContent
        };
        yield addFile(fileToAdd);
    });
    reader.readAsText(file);
}
export function updateFile(fileId, content) {
    const files = getFiles();
    const file = files.find(file => file.id === fileId);
    if (file) {
        file.content = content;
        setFiles(files);
    }
}
export function actionsOnFile(fileId) {
    console.log('actionsOnFile', fileId);
}
function addFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = getFiles();
        files.push(file);
        setFiles(files);
        setSelectedFileId(file.id);
        addFileEditor(file);
        yield renderApp();
    });
}
export function changeFile(fileId) {
    return __awaiter(this, void 0, void 0, function* () {
        setSelectedFileId(fileId);
        showEditor(fileId);
        yield renderApp();
        renderEditor("edit");
        yield render('memory', 'app/memory.ejs');
        yield render('vm-buttons', 'app/vm-buttons.ejs');
    });
}
export function closeFile(fileId) {
    return __awaiter(this, void 0, void 0, function* () {
        //stop the execution if the file is the one being executed
        setFiles(getFiles().filter(file => file.id !== fileId));
        removeFileEditor(fileId);
        const files = getFiles();
        if (files.length > 0) {
            yield changeFile(files[files.length - 1].id);
        }
        else {
            localStorage.removeItem('selectedFileId');
        }
        yield renderApp();
    });
}
export function importSample(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileId = generateUniqueId();
        const fileName = generateUniqueName(name);
        const fileToAdd = {
            id: fileId,
            name: fileName,
            type: "asm",
            content: samples[name]
        };
        yield addFile(fileToAdd);
    });
}
export function newFile() {
    return __awaiter(this, void 0, void 0, function* () {
        const fileName = generateUniqueName("untitled");
        const fileId = generateUniqueId();
        const fileToAdd = {
            id: fileId,
            name: fileName,
            type: "asm",
            content: ""
        };
        yield addFile(fileToAdd);
    });
}
export function setFiles(files) {
    setIntoLocalStorage("files", files);
}
export function getFiles() {
    const files = getFromLocalStorage("files");
    return files ? files : [];
}
export function getFile(fileId) {
    for (const file of getFiles()) {
        if (file.id === fileId)
            return file;
    }
    return null;
}
export function setSelectedFileId(fileId) {
    const file = getFile(fileId);
    if (file) {
        localStorage.setItem("selectedFileId", file.id.toString());
    }
}
export function getSelectedFile() {
    const fileId = getSelectedFileId();
    const files = getFiles();
    if (fileId !== null) {
        if (files.length > 0) {
            for (const file of getFiles()) {
                if (file.id === fileId)
                    return file;
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
export function getSelectedFileId() {
    const fileId = localStorage.getItem("selectedFileId");
    return fileId ? Number(fileId) : null;
}
function generateUniqueId() {
    const files = getFiles();
    return files.length > 0 ? Math.max(...files.map(file => file.id)) + 1 : 0;
}
function generateUniqueName(name) {
    const files = getFiles();
    let newName = name;
    let i = 1;
    while (files.find(file => file.name === newName)) {
        newName = `${name}_${i + 1}`;
        i++;
    }
    return newName;
}
