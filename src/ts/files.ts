import { addEditor, removeEditor, showEditor } from "./editors.js";
import { renderApp } from "./app.js";
import { getFromStorage, setIntoStorage } from "./utils.js";
import { setConsoleShown } from "./virtual-machine.js";
import { confirmClearProject } from "./buttons.js";
import { showToast } from "./forms.js";

declare const JSZip: any;
const defaultProjectName = "MIPS_project";

export type file = {
    id: number;
    name: string;
    type: string;
    content: string;
};

export async function changeFile(fileId: number) {
    if (getSelectedFileId() === fileId) return;
    setSelectedFileId(fileId);
    showEditor(fileId);
    await renderApp();
}

export async function deleteFile(fileId: number, rerender: boolean = true) {
    const files = getFiles();
    const index = files.findIndex((file) => file.id === fileId);
    if (index !== -1) {
        files.splice(index, 1);
        setFiles(files);
    }
    await closeFile(fileId, false);
    if (rerender) await renderApp();
}

export async function renameFile(fileId: number, newName: string) {
    const files = getFiles();
    const file = files.find((file) => file.id === fileId);
    if (file) {
        file.name = generateUniqueName(newName, file.name);
        setFiles(files);
    }
    await renderApp();
}

export async function closeFile(fileId: number, rerender: boolean = true) {
    const selectedFileId = getSelectedFileId();
    removeEditor(fileId);
    const files = getFiles();
    if (files.length > 0) {
        if (fileId === selectedFileId) {
            await changeFile(files[files.length - 1].id);
        }
    } else {
        setConsoleShown(false);
        localStorage.removeItem("selectedFileId");
    }
    if (rerender) await renderApp("edit", "edit");
}

async function openFileTab(fileId: number, rerender: boolean = true) {
    const file = getFiles().find((f) => f.id === fileId);
    if (!file) {
        console.error(`Can't open file. File with id '${fileId}' not found`);
        return;
    }
    setSelectedFileId(fileId);
    showEditor(fileId);
    if (rerender) await renderApp("edit", "edit");
}

export function getSelectedFileId(): number | null {
    const fileId = getFromStorage("local", "selectedFileId");
    return fileId ? Number(fileId) : null;
}

export function getSelectedFile() {
    const fileId = getSelectedFileId();
    if (fileId != null) {
        return getFile(fileId!);
    }
    const files = getFiles();
    if (files.length > 0) {
        setSelectedFileId(files[0].id);
        return files[0];
    }
}

export function setSelectedFileId(fileId: number) {
    const file = getFile(fileId);
    if (file) {
        setIntoStorage("local", "selectedFileId", file.id.toString());
    } else {
        localStorage.removeItem("selectedFileId");
        console.error(`No opened file found with id: ${fileId}`);
    }
}

export function updateFile(fileId: number, content: string) {
    const files = getFiles();
    const file = files.find((file) => file.id === fileId);
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

export function getFile(fileId: number) {
    for (const file of getFiles()) {
        if (file.id === fileId) return file;
    }
    console.error(`No file found with id: ${fileId}`);
    return undefined;
}

function addFile(file: file) {
    const files = getFiles();
    addEditor(file);
    files.push(file);
    setFiles(files);
}

export function setFiles(files: file[]) {
    setIntoStorage("local", "files", files);
}

export function getFiles(): file[] {
    const files = getFromStorage("local", "files");
    return files ? files : [];
}

export function importFiles() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".asm";
    input.multiple = true;
    input.onchange = async () => {
        if (input.files && input.files.length > 0) {
            const filesArray = Array.from(input.files);
            for (const selectedFile of filesArray) {
                await importFile(selectedFile);
            }
        }
        await renderApp("edit", "edit");
    };
    input.click();
}

export async function importPublicZip(zipPath: string) {
    zipPath = zipPath.trim();
    if (!zipPath.endsWith(".zip")) return;
    try {
        while (zipPath.startsWith("/")) zipPath = zipPath.slice(1);
        const res = await fetch(`projects/${zipPath}`); //TODO: change to absolute
        const arrayBuffer = await res.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        await loadProject(zip, zipPath.split("/").pop());
    } catch (e) {
        alert(
            "There was a problem loading the project specified in the url string. Please check the path and try again.",
        );
        console.error(e);
    }
}

export async function importZip() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip";
    input.multiple = false;
    input.onchange = async () => {
        if (input.files && input.files.length === 1) {
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(input.files[0]);
            let name = input.files[0].name;
            await loadProject(zipContent, name);
        }
    };
    input.click();
}

async function loadProject(zip: any, name: string | undefined) {
    // delete all current files
    getFiles().forEach((f) => deleteFile(f.id, false));
    // load the new files
    for (const file of Object.values(zip.files).filter(
        (f: any) => !f.dir && !f.name.includes("/") && f.name.endsWith(".asm"),
    )) {
        const fileData = await (file as any).async("text");
        // only load the file in a tab if it's the first one
        await importFile(new File([fileData], (file as any).name));
    }
    // set the project name
    if (name == null) name = `${defaultProjectName}.zip`;
    if (name.endsWith(".zip")) name = name.substring(0, name.length - 4);
    setProjectName(name);
    await renderApp("edit", "edit");
}

/** specifies the file to import and whether to open a tab when loaded */
export async function importFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => {
            const msg = `Unable to read the file: ${file.name}. Please try again.`;
            console.error(msg);
            alert(msg);
            reject(new Error(msg));
        };

        reader.onload = async (event) => {
            try {
                const fileId = generateUniqueFileId();
                const fileName = generateUniqueName(file.name.split(".")[0]);
                const fileContent = (event.target?.result as string) || "";

                const fileToAdd: file = {
                    id: fileId,
                    name: fileName,
                    type: "asm",
                    content: fileContent,
                };

                addFile(fileToAdd);
                await openFileTab(fileId, false);
                resolve();
            } catch (error) {
                console.error(`Error importing the file: ${file.name}`, error);
                alert(
                    `Error importing the file: ${file.name}. Please try again.`,
                );
                reject(error);
            }
        };

        try {
            reader.readAsText(file);
        } catch (error) {
            console.error(
                `Unexpected error while reading the file: ${file.name}`,
                error,
            );
            alert(
                `Unexpected error while reading the file: ${file.name}. Please check the file and try again.`,
            );
            reject(error);
        }
    });
}

export async function exportFile(fileId: number) {
    try {
        const file = getFile(fileId);

        if (!file) {
            throw new Error(`File with ID ${fileId} not found.`);
        }

        const blob = new Blob([file.content], { type: "text/plain" });
        showDownloadPrompt(blob, `${file.name}.${file.type}`);
    } catch (error: any) {
        console.error(`Error exporting the file with ID: ${fileId}`, error);
    }
}

export function getProjectName() {
    return getFromStorage("local", "project-name") || defaultProjectName;
}
export function setProjectName(val: string | null) {
    if (val == null || !isValidFileName(val)) val = defaultProjectName;
    setIntoStorage("local", "project-name", val);
}
export function isValidFileName(val: string): boolean {
    if (!val || val.trim() === "") return false;
    // only ASCII letters, digits, spaces, dashes, underscores
    const validPattern = /^[A-Za-z0-9 _-]+$/;
    // not: \ / : * ? " < > |
    const invalidCharsPattern = /[\\\/:*?"<>|]/;
    return validPattern.test(val) && !invalidCharsPattern.test(val);
}

export async function exportZip() {
    const zip = new JSZip();
    for (const file of getFiles()) {
        if (!file.name.endsWith(".asm")) file.name = `${file.name}.asm`;
        zip.file(file.name, file.content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    showDownloadPrompt(blob, `${getProjectName()}.zip`);
}

/**Download the given blob named as the specified download string*/
function showDownloadPrompt(blob: Blob, download: string) {
    // Create a temporary download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = download;
    document.body.appendChild(a);
    a.click();
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function newFile() {
    const fileName = generateUniqueName("untitled");
    const fileId = generateUniqueFileId();
    const fileToAdd: file = {
        id: fileId,
        name: fileName,
        type: "asm",
        content: "",
    };
    addFile(fileToAdd);
    await openFileTab(fileId);
}

function generateUniqueFileId() {
    const files = getFiles();
    return files.length > 0 ? Math.max(...files.map((file) => file.id)) + 1 : 0;
}

/**Generates a unique file name by adding _{number} at the end of the given string.
 * Can ignore a specific name, useful for example when renaming a file, so that the file's new name doesn't conflict with itself*/
function generateUniqueName(name: string, ignore?: string): string {
    const files = getFiles();
    let newName = name;
    let i = 1;
    while (
        files.find((file) => file.name === newName && file.name !== ignore)
    ) {
        newName = `${name}_${i}`;
        i++;
    }
    return newName;
}

export async function handleFileDrop(ev: DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    if (!ev.dataTransfer) return;
    const files = Array.from(ev.dataTransfer.files);
    if (files.length === 1 && files[0].name.endsWith(".zip")) {
        if (!confirmClearProject()) return;
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(files[0]);
        await loadProject(zipContent, files[0].name);
    } else if (files.every((f) => f.name.endsWith(".asm"))) {
        for (const file of files) {
            await importFile(file);
        }
        await renderApp("edit", "edit");
    } else {
        showToast(
            "Can only load a single zip file (a project) or import one or more `.asm` files",
            5000,
        );
    }
}
