import { hideForm, showForm } from "./forms.js";
import {
    changeFile,
    closeFile,
    deleteFile,
    exportZip,
    exportFile,
    getFiles,
    getProjectName,
    getSelectedFileId,
    importFiles,
    importZip,
    isValidProjectName,
    newFile,
    renameFile,
    setProjectName,
} from "./files.js";
import {
    hideFilePopover,
    showFileActionsPopover,
    showPopover,
} from "./popovers.js";
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
import { highlightInterval } from "./memorymap.js";
import { render } from "./rendering.js";
import { adjustBinaryWidth, highlightElementAnimation } from "./style.js";
import { clearErrorMarkers, moveCursorToPos } from "./editors.js";
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
    adjustBinaryWidth();
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
    const openedFiles = getFiles();
    await setMemoryShown(true);
    await assemble(openedFiles);
    clearErrorMarkers();
};

(window as any).showFileActionsOnClick = async function (
    id: string,
    toggleButton: HTMLElement,
) {
    await showFileActionsPopover(id, toggleButton);
};

(window as any).showMenuOnClick = async function (
    button: HTMLElement,
    templatePath: string,
) {
    const rect = button.getBoundingClientRect();
    await showPopover(rect, "menu");
    await render("popover", templatePath);
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

(window as any).toggleMemoryOnClick = async function () {
    await setMemoryShown(!memoryShown);
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

(window as any).goToEditorPosOnClick = async function (target: HTMLDivElement) {
    const pos = {
        lineNumber: Number(target.dataset["linenumber"]),
        fileId: Number(target.dataset["fileid"]),
    };
    await moveCursorToPos(pos);
};
(window as any).goToMemoryPosOnClick = async function (target: HTMLDivElement) {
    const addr = target.dataset["address"]!;
    const elem = document.getElementById(addr);
    if (!elem) return;
    highlightElementAnimation(`${addr}`, true);
    elem.classList.add("error");
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

(window as any).exportZipOnClick = async function () {
    exportZip();
};

/**Ask confirmation from the user on whether it's safe to remove the current project's files.
 * Returns true if the user accepted, false otherwise.*/
export function confirmClearProject(): boolean {
    const noFilesInUse = getFiles().length === 0;
    return (
        noFilesInUse ||
        confirm(
            `Importing a new project will close the currently open one and all unsaved sources will be lost.
Save your current project before proceeding.`,
        )
    );
}
(window as any).importZipOnClick = async function () {
    if (confirmClearProject()) await importZip();
};
(window as any).newProjectOnClick = async function () {
    if (confirmClearProject()) {
        setProjectName(null);
        getFiles().forEach((f) => deleteFile(f.id));
        await renderApp("edit", "edit");
    }
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

let editingName = false;
(window as any).changeProjectNameOnClick = function (btn: HTMLButtonElement) {
    const input = document.getElementById(
        "projectNameInput",
    )! as HTMLInputElement;
    if (editingName) {
        // save project name
        if (isValidProjectName(input.value)) {
            setProjectName(input.value);
            btn.classList.remove("editing");
            editingName = false;
            input.disabled = true;
        } else {
            input.value = getProjectName();
            input.focus();
        }
    } else {
        // start editing
        btn.classList.add("editing");
        editingName = true;
        input.disabled = false;
        input.focus();
        input.setSelectionRange(0, input.value.length);
    }
};
