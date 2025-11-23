import { hideForm, showForm, showToast } from "./forms.js";
import {
    changeFile,
    closeFile,
    deleteFile,
    exportZip,
    exportFile,
    getFiles,
    getSelectedFileId,
    importFiles,
    importZip,
    isValidFileName,
    newFile,
    renameFile,
    setProjectName,
    getSelectedFile,
    getFile,
} from "./files.js";
import {
    hideFilePopover,
    showFileActionsPopover,
    showPopover,
} from "./popovers.js";
import {
    assemble,
    stop,
    run,
    pause,
    vm,
    memoryShown,
    setMemoryShown,
    setConsoleShown,
    consoleShown,
    updateUiAfterStep,
    setRegistersShown,
    registersShown,
} from "./virtual-machine.js";
import {
    colFormatSelect,
    getFlagsFromOpts,
    getOptions,
    getOptionsFromForm,
    optsFromFlags,
    updateMemoryAddrFormat,
    updateOpts,
} from "./settings.js";
import { render } from "./rendering.js";
import { highlightElementAnimation } from "./style.js";
import { clearErrorMarkers, moveCursorToPos } from "./editors.js";
import { renderApp } from "./app.js";
import { blinkConsole } from "./console.js";
import { getFromStorage, setIntoStorage } from "./utils.js";

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
            return long ? "Unsigned Decimal" : "Dec";
        case "int":
            return long ? "Signed Decimal" : "±Dec";
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
};
(window as any).setMemoryAddrFormat = async function (
    _btn: any,
    value: string,
) {
    await updateMemoryAddrFormat(value);
};

(window as any).disableLoopDetectionOnClick = function () {
    const settings = getFromStorage("local", "settings");
    settings.options["detect-infinite-loops"] = false;
    setIntoStorage("local", "settings", settings);
};

(window as any).stepOnClick = async function () {
    if (vm.console.state === "waitingInput") {
        blinkConsole();
        return;
    }
    await vm.step();
    await updateUiAfterStep();
};

(window as any).stepOverOnClick = async function () {
    if (vm.console.state === "waitingInput") {
        blinkConsole();
        return;
    }
    await vm.stepOver();
    await updateUiAfterStep(true);
};
(window as any).stepOutOnClick = async function () {
    if (vm.console.state === "waitingInput") {
        blinkConsole();
        return;
    }
    await vm.stepOut();
    await updateUiAfterStep(true);
};

(window as any).runOnClick = async function () {
    if (vm.console.state === "waitingInput") {
        blinkConsole();
        return;
    }
    if (vm.running) {
        pause();
    } else {
        run();
    }
    updateUiAfterStep();
    await render("vm-buttons", "/app/vm-buttons.ejs", undefined, false);
};

(window as any).stopOnClick = async function () {
    await stop();
};

(window as any).assembleOnClick = async function () {
    let files;
    switch (getOptions()["assembly-mode"]) {
        case "current":
            const selected = getSelectedFile();
            if (selected) files = [selected];
            else files = getFiles();
            break;
        case "all":
        default:
            files = getFiles();
            break;
    }
    await setMemoryShown(true);
    await setRegistersShown(true);
    await assemble(files);
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
    onClose?: () => {},
) {
    await showForm(
        form,
        dataString ? JSON.parse(dataString) : undefined,
        autofocus,
        onClose,
    );
};

(window as any).hideFormOnClick = async function () {
    await hideForm();
};

(window as any).toggleMemoryOnClick = async function () {
    await setMemoryShown(!memoryShown);
};
(window as any).toggleRegistersOnClick = async function () {
    await setRegistersShown(!registersShown);
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
(window as any).setOptionsByFlagsOnClick = async function (
    ev: ClipboardEvent,
    elem: HTMLInputElement,
) {
    ev.preventDefault();
    const flags = ev.clipboardData?.getData("text") || "";
    const newOpts = optsFromFlags(flags);
    elem.value = flags;
    if (!newOpts) {
        elem.classList.add("error");
        return;
    }
    elem.classList.remove("error");
    updateOpts(newOpts);
    await hideForm();
    await showForm("settings", undefined, false);
    setTimeout((window as any).getOptionFlagsOnClick, 100);
    showToast("Options set by pasted flags");
};

(window as any).copyOptionsFlagsOnClick = function (fullURL: boolean) {
    const flags = (document.getElementById("option-tags") as HTMLInputElement)
        .value;
    if (!flags) return;
    if (!fullURL) {
        navigator.clipboard.writeText(flags);
    } else {
        const params = new URLSearchParams();
        params.set("opts", flags);
        const url = `${window.location}?${params.toString()}`;
        navigator.clipboard.writeText(url);
    }
    showToast(`Copied ${fullURL ? "URL" : "flags"} to clipboard`);
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
    const file = getFile(fileId);
    if (
        file?.content === "" ||
        confirm(
            `Are you sure you want to delete "${file?.name || "untitled.asm"}"?`,
        )
    )
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
        for (const file of getFiles()) {
            await deleteFile(file.id, false);
        }
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

(window as any).renameProjectOnClick = async function () {
    const newName = (
        document.getElementById("new-project-name") as HTMLInputElement
    )?.value;
    try {
        if (!newName) throw new Error("Invalid project name");
        setProjectName(newName);
        await hideForm();
        await renderApp();
    } catch (error) {
        alert("Error renaming the project. Please try again.");
    }
};

function enableEditName(
    elem: HTMLElement,
    onConfirm: (newName: string) => void,
) {
    elem.contentEditable = "true";
    elem.focus();

    const initialName = elem.innerText;

    const resetEditable = () => {
        elem.contentEditable = "false";
        elem.innerText = initialName;
        elem.removeEventListener("keydown", handleClick);
    };

    const handleClick = (ev: KeyboardEvent) => {
        if (ev.key === "Enter") {
            ev.preventDefault();
            elem.contentEditable = "false";
            elem.removeEventListener("keydown", handleClick);
            const newName = elem.innerText.trim();
            if (isValidFileName(elem.innerText)) {
                elem.innerText = newName;
                onConfirm(newName);
            } else {
                resetEditable();
            }
        } else if (ev.key === "Escape") {
            resetEditable();
        }
    };

    elem.addEventListener("keydown", handleClick);
}

(window as any).enableProjectNameEdit = function (elem: HTMLElement) {
    enableEditName(elem, (newName) => setProjectName(newName));
};

(window as any).enableFileNameEdit = function (elem: HTMLElement) {
    enableEditName(elem, (newName) =>
        renameFile(Number(elem.dataset["fileid"]), newName),
    );
};
