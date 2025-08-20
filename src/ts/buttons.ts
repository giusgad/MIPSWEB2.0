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
import {
    assemble,
    stop,
    step,
    run,
    pause,
    vm,
    memoryShown,
    setMemoryShown,
    setConsoleShown,
    consoleShown,
} from "./virtual-machine.js";
import {
    colFormatSelect,
    getFlagsFromOpts,
    getOptionsFromForm,
    optsFromFlags,
    updateOpts,
} from "./settings.js";
import { highlightInterval, toggleMemoryMap } from "./memorymap.js";
import { render } from "./rendering.js";
import { renderApp } from "./app.js";

(window as any).cycleStateBtn = async function (
    btn: HTMLButtonElement,
    onchange: (btn: HTMLButtonElement, value: string) => Promise<void>,
) {
    const values = btn.dataset["values"]?.split(",");
    const curr = Number(btn.dataset["current"]);
    if (isNaN(curr) || values == null) return;
    const next = (curr + 1) % values.length;
    btn.dataset["current"] = `${next}`;
    const val = values[next];
    btn.innerText = getStateBtnText(val);
    await onchange(btn, val);
};
const getStateBtnText = function (val: string, long: boolean = false): string {
    switch (val) {
        case "decimal":
            return long ? "Decimal" : "Dec";
        case "uint":
            return long ? "Unsigned Int" : "Uint";
        case "int":
            return long ? "Signed Int" : "Int";
        case "hexadecimal":
        case "hex":
            return long ? "Hexadecimal" : "Hex";
        case "binary":
            return long ? "Binary" : "Bin";
        case "ascii":
            return "ASCII";
        case "asm":
            return long ? "Instruction" : "Asm";
        case "name":
            return "Name";
        case "number":
            return long ? "number" : "Num";
        default:
            return val;
    }
};
(window as any).getStateBtnText = getStateBtnText;

(window as any).colFormatSelectOnChange = async function (
    element: HTMLButtonElement | HTMLSelectElement,
    value: string | undefined,
) {
    await colFormatSelect(element, value || element?.value);
    const id = element.id.split("_")[1];
    highlightInterval(id, { behavior: "instant", block: "end" });
};

(window as any).stepOnClick = async function () {
    await step();
};

(window as any).runOnClick = async function () {
    if (vm.running) {
        pause();
    } else {
        run();
    }
    await render("vm-buttons", "/app/vm-buttons.ejs", undefined, false);
};

(window as any).stopOnClick = async function () {
    await stop();
};

(window as any).assembleOnClick = async function () {
    const openedFiles = getOpenedFiles();
    setMemoryShown(true);
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
    autofocus: boolean = true,
) {
    await showForm(
        form,
        dataString ? JSON.parse(dataString) : undefined,
        autofocus,
    );
};

(window as any).hideFormOnClick = async function () {
    await hideForm();
};

(window as any).toggleSidebarOnClick = async function (sidebarButton: string) {
    await toggleSidebar(sidebarButton);
};

(window as any).toggleMemoryOnClick = async function () {
    setMemoryShown(!memoryShown);
    await renderApp();
};
(window as any).toggleConsoleOnClick = async function () {
    await setConsoleShown(!consoleShown);
};

(window as any).getOptionFlagsOnClick = function () {
    const form = document.getElementById("settings-form");
    if (!form) return;
    const opts = getOptionsFromForm(new FormData(form as HTMLFormElement));
    const flags = getFlagsFromOpts(opts);
    const input = document.getElementById("option-tags");
    if (!input) return;
    (input as HTMLInputElement).value = flags;
};
(window as any).setOptionsByFlagsOnClick = async function () {
    const input = document.getElementById("option-tags");
    if (!input) return;
    const newOpts = optsFromFlags((input as HTMLInputElement).value);
    if (!newOpts) {
        input.classList.add("error");
        return;
    }
    input.classList.remove("error");
    updateOpts(newOpts);
    await hideForm();
    await showForm("settings", undefined, false);
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
