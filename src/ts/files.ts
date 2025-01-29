import {addEditor, editors, removeEditor, showEditor} from "./editors.js";
import {renderApp} from "./app.js";
import {setSidebar, sidebar} from "./sidebar.js";
import {getFromStorage, scrollToEnd, setIntoStorage} from "./utils.js";


export type file = {
    id: number;
    name: string;
    type: string;
    content: string;
    opened: boolean;
};

export async function changeFile(fileId: number) {
    setSelectedFileId(fileId);
    await renderApp();
    showEditor(fileId);
}

export async function closeAllFiles() {
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
    await renderApp('edit', 'edit');
}

export async function deleteFile(fileId: number) {
    await closeFile(fileId);
    const files = getFiles();
    const index = files.findIndex(file => file.id === fileId);
    if (index !== -1) {
        files.splice(index, 1);
        setFiles(files);
    }
    await renderApp();
}

export async function renameFile(fileId: number, newName: string) {
    const files = getFiles();
    const file = files.find(file => file.id === fileId);
    if (file) {
        file.name = generateUniqueName(newName);
        setFiles(files);
    }
    await renderApp();
}

export async function closeFile(fileId: number) {
    const selectedFileId = getSelectedFileId();
    removeOpenedFileId(fileId);
    removeEditor(fileId);
    const openedFiles = getOpenedFiles();
    if (openedFiles.length > 0) {
        if (fileId === selectedFileId) {
            await changeFile(openedFiles[openedFiles.length - 1].id);
        }
    } else {
        localStorage.removeItem('selectedFileId');
    }
    await renderApp('edit', 'edit');
}


export async function openFile(fileId: number) {
    if (getOpenedFilesIds().includes(fileId)) {
        setSelectedFileId(fileId);
        showEditor(fileId);
    } else {
        pushOpenedFileId(fileId);
        setSelectedFileId(fileId);
        const file = getFile(fileId);
        if (!file) return;
        addEditor(file);
        showEditor(file.id);
    }
    await renderApp('edit', 'edit');
}

export function getSelectedFileId(): number | null {
    const fileId = getFromStorage("local", "selectedFileId");
    return fileId ? Number(fileId) : null;
}

export function getSelectedFile() {
    const fileId = getSelectedFileId();
    if (!(fileId == null) && !(!getOpenedFilesIds().includes(fileId!))) {
        return getFile(fileId!);
    }
    if (getOpenedFiles().length > 0) {
        setSelectedFileId(getOpenedFilesIds()[0]);
        return getOpenedFiles()[0];
    }
}

export function setSelectedFileId(fileId: number) {
    const file = getFile(fileId);
    if (file && file.opened && getOpenedFilesIds().includes(fileId)) {
        setIntoStorage("local", "selectedFileId", file.id.toString());
    } else {
        console.error(`No opened file found with id: ${fileId}`);
    }
}

export function updateFile(fileId: number, content: string) {
    const files = getFiles();
    const file = files.find(file => file.id === fileId);
    if (file) {
        file.content = content;
        setFiles(files);
    }
}

export async function sortFiles(from: number, to: number) {
    const files = getFiles();
    const [movedFile] = files.splice(from, 1);
    files.splice(to, 0, movedFile);
    setFiles(files);
}

export async function sortOpenedFilesIds(from: number, to: number) {
    const openedFiles = getOpenedFilesIds();
    const [movedFile] = openedFiles.splice(from, 1);
    openedFiles.splice(to, 0, movedFile);
    setIntoStorage("local", "openedFiles", openedFiles);
}

export function getFile(fileId: number) {
    for (const file of getFiles()) {
        if (file.id === fileId) return file;
    }
    console.error(`No file found with id: ${fileId}`);
    return undefined;
}

function addFile(file: file) {
    const files = getFiles();
    files.push(file);
    setFiles(files);
    setSidebar("all-files");
}

export function pushOpenedFileId(fileId: number) {
    const files = getFiles();
    const file = files.find(file => file.id === fileId);
    if (file) {
        file.opened = true;
        setFiles(files);
        const openedFiles = getOpenedFilesIds();
        openedFiles.push(fileId);
        setIntoStorage("local", "openedFiles", openedFiles);
    } else {
        console.error(`No file found with id: ${fileId}`);
    }
}

export function removeOpenedFileId(fileId: number) {
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
    } else {
        console.error(`No file found with id: ${fileId}`);
    }
}

export function getOpenedFilesIds(): number[] {
    const openedFiles = getFromStorage("local", "openedFiles");
    return openedFiles ? openedFiles : [];
}

export function getOpenedFiles(): file[] {
    const openedFilesIds = getOpenedFilesIds();
    const files = getFiles();
    const openedFiles = [];
    for (const fileId of openedFilesIds) {
        const file = files.find(file => file.id === fileId);
        if (file) openedFiles.push(file);
    }
    return openedFiles;
}

export function setFiles(files: file[]) {
    setIntoStorage("local", "files", files);
}

export function getFiles(): file[] {
    const files = getFromStorage("local", "files");
    return files ? files : [];
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

    reader.onerror = () => {
        console.error(`Error reading the file: ${file.name}`);
        alert(`Unable to read the file: ${file.name}. Please try again.`);
    };

    reader.onload = async (event) => {
        try {
            const fileId = generateUniqueFileId();
            const fileName = generateUniqueName(file.name.split(".")[0]);
            const fileContent = event.target?.result as string || '';

            const fileToAdd: file = {
                id: fileId,
                name: fileName,
                type: 'asm',
                content: fileContent,
                opened: false
            };

            addFile(fileToAdd);
            await openFile(fileId);
        } catch (error) {
            console.error(`Error importing the file: ${file.name}`, error);
            alert(`Error importing the file: ${file.name}. Please try again.`);
        }
    };

    try {
        reader.readAsText(file);
    } catch (error) {
        console.error(`Unexpected error while reading the file: ${file.name}`, error);
        alert(`Unexpected error while reading the file: ${file.name}. Please check the file and try again.`);
    }
}

export async function exportFile(fileId: number) {
    try {
        const file = getFile(fileId);

        if (!file) {
            throw new Error(`File with ID ${fileId} not found.`);
        }

        const handle = await (window as any).showSaveFilePicker({
            suggestedName: `${file.name}.${file.type}`,
            types: [
                {
                    description: "ASM Files",
                    accept: { "text/plain": [".asm"] },
                },
            ],
        });

        const writableStream = await handle.createWritable();
        await writableStream.write(file.content);
        await writableStream.close();

    } catch (error: any) {
        console.error(`Error exporting the file with ID: ${fileId}`, error);

        if (error.name === "AbortError") {
            //alert("Export operation was canceled.");
        } else {
            //alert("Error exporting the file. Please try again.");
        }
    }
}

export async function newFile() {
    const fileName = generateUniqueName("untitled");
    const fileId = generateUniqueFileId();
    const fileToAdd: file = {
        id: fileId,
        name: fileName,
        type: "asm",
        content: "",
        opened: false
    };
    addFile(fileToAdd);
    await openFile(fileId);
}

function generateUniqueFileId() {
    const files = getFiles();
    return files.length > 0 ? Math.max(...files.map(file => file.id)) + 1 : 0;
}

function generateUniqueName(name: string): string {
    const files = getFiles();
    let newName = name;
    let i = 1;
    while (files.find(file => file.name === newName)) {
        newName = `${name}_${i}`;
        i++;
    }
    return newName;
}