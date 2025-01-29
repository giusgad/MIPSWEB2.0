var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { addEditor, editors, removeEditor, showEditor } from "./editors.js";
import { renderApp } from "./app.js";
import { setSidebar, sidebar } from "./sidebar.js";
import { getFromStorage, setIntoStorage } from "./utils.js";
export function changeFile(fileId) {
    return __awaiter(this, void 0, void 0, function* () {
        setSelectedFileId(fileId);
        yield renderApp();
        showEditor(fileId);
    });
}
export function closeAllFiles() {
    return __awaiter(this, void 0, void 0, function* () {
        localStorage.removeItem('openedFiles');
        localStorage.removeItem('selectedFileId');
        const files = getFiles();
        files.forEach(file => {
            file.opened = false;
        });
        setFiles(files);
        editors.forEach(editor => {
            removeEditor(editor.fileId);
        });
        if (!sidebar) {
            setSidebar('all-files');
        }
        yield renderApp('edit', 'edit');
    });
}
export function deleteFile(fileId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield closeFile(fileId);
        const files = getFiles();
        const index = files.findIndex(file => file.id === fileId);
        if (index !== -1) {
            files.splice(index, 1);
            setFiles(files);
        }
        yield renderApp();
    });
}
export function renameFile(fileId, newName) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = getFiles();
        const file = files.find(file => file.id === fileId);
        if (file) {
            file.name = generateUniqueName(newName);
            setFiles(files);
        }
        yield renderApp();
    });
}
export function closeFile(fileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const selectedFileId = getSelectedFileId();
        removeOpenedFileId(fileId);
        removeEditor(fileId);
        const openedFiles = getOpenedFiles();
        if (openedFiles.length > 0) {
            if (fileId === selectedFileId) {
                yield changeFile(openedFiles[openedFiles.length - 1].id);
            }
        }
        else {
            localStorage.removeItem('selectedFileId');
        }
        yield renderApp('edit', 'edit');
    });
}
export function openFile(fileId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (getOpenedFilesIds().includes(fileId)) {
            setSelectedFileId(fileId);
            showEditor(fileId);
        }
        else {
            pushOpenedFileId(fileId);
            setSelectedFileId(fileId);
            const file = getFile(fileId);
            if (!file)
                return;
            addEditor(file);
            showEditor(file.id);
        }
        yield renderApp('edit', 'edit');
    });
}
export function getSelectedFileId() {
    const fileId = getFromStorage("local", "selectedFileId");
    return fileId ? Number(fileId) : null;
}
export function getSelectedFile() {
    const fileId = getSelectedFileId();
    if (!(fileId == null) && !(!getOpenedFilesIds().includes(fileId))) {
        return getFile(fileId);
    }
    if (getOpenedFiles().length > 0) {
        setSelectedFileId(getOpenedFilesIds()[0]);
        return getOpenedFiles()[0];
    }
}
export function setSelectedFileId(fileId) {
    const file = getFile(fileId);
    if (file && file.opened && getOpenedFilesIds().includes(fileId)) {
        setIntoStorage("local", "selectedFileId", file.id.toString());
    }
    else {
        console.error(`No opened file found with id: ${fileId}`);
    }
}
export function updateFile(fileId, content) {
    const files = getFiles();
    const file = files.find(file => file.id === fileId);
    if (file) {
        file.content = content;
        setFiles(files);
    }
}
export function sortFiles(from, to) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = getFiles();
        const [movedFile] = files.splice(from, 1);
        files.splice(to, 0, movedFile);
        setFiles(files);
    });
}
export function sortOpenedFilesIds(from, to) {
    return __awaiter(this, void 0, void 0, function* () {
        const openedFiles = getOpenedFilesIds();
        const [movedFile] = openedFiles.splice(from, 1);
        openedFiles.splice(to, 0, movedFile);
        setIntoStorage("local", "openedFiles", openedFiles);
    });
}
export function getFile(fileId) {
    for (const file of getFiles()) {
        if (file.id === fileId)
            return file;
    }
    console.error(`No file found with id: ${fileId}`);
    return undefined;
}
function addFile(file) {
    const files = getFiles();
    files.push(file);
    setFiles(files);
    setSidebar("all-files");
}
export function pushOpenedFileId(fileId) {
    const files = getFiles();
    const file = files.find(file => file.id === fileId);
    if (file) {
        file.opened = true;
        setFiles(files);
        const openedFiles = getOpenedFilesIds();
        openedFiles.push(fileId);
        setIntoStorage("local", "openedFiles", openedFiles);
    }
    else {
        console.error(`No file found with id: ${fileId}`);
    }
}
export function removeOpenedFileId(fileId) {
    const files = getFiles();
    const file = files.find(file => file.id === fileId);
    if (file) {
        file.opened = false;
        setFiles(files);
        const openedFiles = getOpenedFilesIds();
        const index = openedFiles.indexOf(fileId);
        if (index !== -1) {
            openedFiles.splice(index, 1);
            setIntoStorage("local", "openedFiles", openedFiles);
        }
    }
    else {
        console.error(`No file found with id: ${fileId}`);
    }
}
export function getOpenedFilesIds() {
    const openedFiles = getFromStorage("local", "openedFiles");
    return openedFiles ? openedFiles : [];
}
export function getOpenedFiles() {
    const openedFilesIds = getOpenedFilesIds();
    const files = getFiles();
    const openedFiles = [];
    for (const fileId of openedFilesIds) {
        const file = files.find(file => file.id === fileId);
        if (file)
            openedFiles.push(file);
    }
    return openedFiles;
}
export function setFiles(files) {
    setIntoStorage("local", "files", files);
}
export function getFiles() {
    const files = getFromStorage("local", "files");
    return files ? files : [];
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
    reader.onerror = () => {
        console.error(`Error reading the file: ${file.name}`);
        alert(`Unable to read the file: ${file.name}. Please try again.`);
    };
    reader.onload = (event) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const fileId = generateUniqueFileId();
            const fileName = generateUniqueName(file.name.split(".")[0]);
            const fileContent = ((_a = event.target) === null || _a === void 0 ? void 0 : _a.result) || '';
            const fileToAdd = {
                id: fileId,
                name: fileName,
                type: 'asm',
                content: fileContent,
                opened: false
            };
            addFile(fileToAdd);
            yield openFile(fileId);
        }
        catch (error) {
            console.error(`Error importing the file: ${file.name}`, error);
            alert(`Error importing the file: ${file.name}. Please try again.`);
        }
    });
    try {
        reader.readAsText(file);
    }
    catch (error) {
        console.error(`Unexpected error while reading the file: ${file.name}`, error);
        alert(`Unexpected error while reading the file: ${file.name}. Please check the file and try again.`);
    }
}
export function exportFile(fileId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const file = getFile(fileId);
            if (!file) {
                throw new Error(`File with ID ${fileId} not found.`);
            }
            const handle = yield window.showSaveFilePicker({
                suggestedName: `${file.name}.${file.type}`,
                types: [
                    {
                        description: "ASM Files",
                        accept: { "text/plain": [".asm"] },
                    },
                ],
            });
            const writableStream = yield handle.createWritable();
            yield writableStream.write(file.content);
            yield writableStream.close();
        }
        catch (error) {
            console.error(`Error exporting the file with ID: ${fileId}`, error);
            if (error.name === "AbortError") {
                //alert("Export operation was canceled.");
            }
            else {
                //alert("Error exporting the file. Please try again.");
            }
        }
    });
}
export function newFile() {
    return __awaiter(this, void 0, void 0, function* () {
        const fileName = generateUniqueName("untitled");
        const fileId = generateUniqueFileId();
        const fileToAdd = {
            id: fileId,
            name: fileName,
            type: "asm",
            content: "",
            opened: false
        };
        addFile(fileToAdd);
        yield openFile(fileId);
    });
}
function generateUniqueFileId() {
    const files = getFiles();
    return files.length > 0 ? Math.max(...files.map(file => file.id)) + 1 : 0;
}
function generateUniqueName(name) {
    const files = getFiles();
    let newName = name;
    let i = 1;
    while (files.find(file => file.name === newName)) {
        newName = `${name}_${i}`;
        i++;
    }
    return newName;
}
