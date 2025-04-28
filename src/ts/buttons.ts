import { hideForm, showForm } from "./forms.js";
import { toggleSidebar } from "./sidebar.js";
import {
    changeFile,
    closeAllFiles,
    closeFile,
    deleteFile,
    exportFile,
    getOpenedFiles,
    getSelectedFileId,
    importFiles,
    newFile,
    openFile,
    renameFile,
} from "./files.js";
import { hideFilePopover, showFilePopover } from "./popovers.js";
import { assemble, stop, step, run } from "./virtual-machine.js";
import { colFormatSelect } from "./settings.js";
import { toggleMemoryMap } from "./memorymap.js";

(window as any).colFormatSelectOnChange = async function (
    element: HTMLSelectElement,
) {
    await colFormatSelect(element);
};

(window as any).stepOnClick = async function () {
    await step();
};

(window as any).runOnClick = async function () {
    await run();
};

(window as any).stopOnClick = async function () {
    await stop();
};

(window as any).assembleOnClick = async function () {
    const openedFiles = getOpenedFiles();
    await assemble(openedFiles);
};

(window as any).showFilePopoverOnClick = async function (
    id: string,
    toggleButton: HTMLElement,
) {
    await showFilePopover(id, toggleButton);
};

(window as any).showFormOnClick = async function (
    form: string,
    dataString: string,
) {
    await showForm(form, JSON.parse(dataString));
};

(window as any).hideFormOnClick = async function () {
    await hideForm();
};

(window as any).toggleSidebarOnClick = async function (sidebarButton: string) {
    await toggleSidebar(sidebarButton);
};

(window as any).toggleMemoryMapOnClick = async function () {
    await toggleMemoryMap();
};

(window as any).newFileOnClick = async function () {
    await newFile();
};

(window as any).importFilesOnClick = function () {
    importFiles();
};

(window as any).closeAllFilesOnClick = async function () {
    await closeAllFiles();
};

(window as any).changeFileOnClick = async function (
    stringFileId: string,
    fileTab: HTMLElement,
) {
    let fileTabs = fileTab.parentElement;
    let scrollLeft = undefined;
    if (fileTabs) {
        scrollLeft = fileTabs.scrollLeft;
    }
    const fileId = parseInt(stringFileId);
    if (isNaN(fileId)) console.error("Invalid fileId");
    await changeFile(fileId);
    if (scrollLeft) {
        (document.getElementById("files-tabs") as HTMLElement).scrollLeft =
            scrollLeft;
    }
};

(window as any).openFileOnDbClick = async function (
    stringFileId: string,
    fileContainer: HTMLElement,
) {
    let allFiles = fileContainer.parentElement;
    let scrollTop = undefined;
    if (allFiles) {
        scrollTop = allFiles.scrollTop;
    }
    const fileId = parseInt(stringFileId);
    if (isNaN(fileId)) console.error("Invalid fileId");
    await openFile(fileId);
    if (scrollTop) {
        (document.getElementById("all-files") as HTMLElement).scrollTop =
            scrollTop;
    }
};

(window as any).closeFileOnClick = async function (
    stringFileId: string,
    button: HTMLElement,
) {
    const fileTab = button.parentElement?.parentElement;
    let filesTabs = fileTab?.parentElement;
    let scrollLeft = undefined;
    if (filesTabs) {
        scrollLeft = filesTabs.scrollLeft;
    }
    const selectedFileId = getSelectedFileId();
    const fileId = parseInt(stringFileId);
    await closeFile(fileId);
    if (fileId !== selectedFileId) {
        if (scrollLeft) {
            (document.getElementById("files-tabs") as HTMLElement).scrollLeft =
                scrollLeft;
        }
    }
};

(window as any).deleteFileOnClick = async function (stringFileId: string) {
    const fileId = parseInt(stringFileId);
    await deleteFile(fileId);
};

(window as any).exportFileOnClick = async function (stringFileId: string) {
    const fileId = parseInt(stringFileId);
    await exportFile(fileId);
    hideFilePopover();
};

(window as any).renameFileOnClick = async function (stringFileId: string) {
    const fileId = parseInt(stringFileId);
    const newFileName = (
        document.getElementById("new-file-name") as HTMLInputElement
    )?.value;
    try {
        if (!newFileName) throw new Error("Invalid file name");
        await renameFile(fileId, newFileName);
        await hideForm();
    } catch (error) {
        alert("Error renaming the file. Please try again.");
    }
};
