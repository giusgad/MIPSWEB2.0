var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getFromLocalStorage, setIntoLocalStorage } from "./index.js";
import { addFileEditor, removeFileEditor, showEditor } from "./editor.js";
import { renderApp } from "./app.js";
export const samples = {
    "sample": `
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
            //console.log(fileHandle);
        }
        catch (err) {
            console.error('Errore durante l’apertura del file:', err);
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
