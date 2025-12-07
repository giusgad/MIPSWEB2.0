import {
    changeFile,
    file,
    getFiles,
    getSelectedFile,
    getSelectedFileId,
    updateFile,
} from "./files.js";
import { Colors } from "./lib/Colors.js";
import { addClass, removeClass } from "./utils.js";
import { editorState, interfaceState, pauseEditorUpdates } from "./app.js";
import { getCurrentFontSize, highlightElementAnimation } from "./style.js";
import { consoleShown, memoryShown, stop, vm } from "./virtual-machine.js";
import { MipsCompleter } from "./lib/Autocompletion.js";
import { render } from "./rendering.js";

export type editor = {
    fileId: number;
    aceEditor: AceAjax.Editor;
};
export type EditorPosition = { fileId: number; lineNumber: number };

export const aceEditorLightTheme = "ace/theme/chrome";
export const aceEditorDarkTheme = "ace/theme/one_dark";

export let editors: editor[] = [];

export function getSelectedInstructionAddresses() {
    if (editorState === "edit" || vm.cpu.isHalted()) return [];
    const file = getSelectedFile();
    if (!file) return [];
    const fileId = file.id;
    const aceEditor = getAceEditor(file);
    let selectedInstructionAddresses: number[] = [];
    if (aceEditor) {
        const cursorPosition = aceEditor.getCursorPosition();
        const highlightedRow = cursorPosition.row + 1;

        vm.assembler.addressEditorsPositions.forEach((position, address) => {
            if (
                position.fileId === fileId &&
                position.lineNumber === highlightedRow
            ) {
                selectedInstructionAddresses.push(address);
            }
        });
    }
    return selectedInstructionAddresses;
}

function clearNextInstructionMarkers(editor: AceAjax.Editor) {
    let markers = editor.session.getMarkers(false);
    for (let i in markers) {
        if (markers[i].clazz === "next-instruction") {
            editor.session.removeMarker(markers[i].id);
        }
    }
}

export function renderEditors() {
    resizeEditors();
    const aceEditor = getAceEditor();
    if (aceEditor) {
        aceEditor.setFontSize(`${getCurrentFontSize()}px`);
        if (editorState === "edit") {
            ace.require("ace/ext/language_tools");
            aceEditor.setOptions({
                highlightActiveLine: true,
                scrollPastEnd: 0.5,
                printMarginColumn: -1,
                enableLiveAutocompletion: [MipsCompleter],
            });

            clearNextInstructionMarkers(aceEditor);
            aceEditor.focus();
        } else if (editorState === "execute") {
            aceEditor.setOptions({
                highlightActiveLine: true,
                scrollPastEnd: 0.5,
                printMarginColumn: -1,
            });

            let markers = aceEditor.session.getMarkers(false);
            for (let i in markers) {
                if (markers[i].clazz === "next-instruction") {
                    aceEditor.session.removeMarker(markers[i].id);
                }
            }

            selectNextInstruction();
        }
    }
}

export function selectNextInstruction() {
    if (vm.nextInstructionEditorPosition) {
        if (getSelectedFileId() === vm.nextInstructionEditorPosition.fileId) {
            const aceEditor = getAceEditor();
            if (aceEditor) {
                const nextInstructionLine =
                    vm.nextInstructionEditorPosition.lineNumber;
                if (nextInstructionLine) {
                    let Range = ace.require("ace/range").Range,
                        range = new Range(
                            nextInstructionLine - 1,
                            0,
                            nextInstructionLine - 1,
                            Infinity,
                        );
                    clearNextInstructionMarkers(aceEditor);
                    aceEditor.session.addMarker(
                        range,
                        "next-instruction",
                        "fullLine",
                        false,
                    );
                }
            }
        }
    }
}

export function moveCursorToNextInstruction() {
    if (vm.nextInstructionEditorPosition) {
        if (getSelectedFileId() === vm.nextInstructionEditorPosition.fileId) {
            const aceEditor = getAceEditor();
            if (aceEditor) {
                const nextInstructionLine =
                    vm.nextInstructionEditorPosition.lineNumber;
                aceEditor.gotoLine(nextInstructionLine);
                aceEditor.scrollToLine(
                    nextInstructionLine,
                    true,
                    false,
                    () => {},
                );
            }
        }
    }
}

let errorMarker: number | null = null;
export async function moveCursorToPos(pos: EditorPosition) {
    await changeFile(pos.fileId);
    const aceEditor = getAceEditor();
    if (aceEditor) {
        const targetLine = pos.lineNumber;
        let Range = ace.require("ace/range").Range,
            range = new Range(targetLine - 1, 0, targetLine - 1, Infinity);
        const session = aceEditor.getSession();
        clearErrorMarkers();
        errorMarker = session?.addMarker(range, "error", "fullLine", false);
        aceEditor.gotoLine(targetLine);
        aceEditor.scrollToLine(targetLine, true, false, () => {});
    }
}
export function clearErrorMarkers() {
    if (errorMarker) getAceEditor()?.getSession()?.removeMarker(errorMarker);
    errorMarker = null;
}

export function resizeEditors() {
    if (interfaceState === "execute") {
        addClass("execute", "editors");
    } else {
        removeClass("execute", "editors");
    }
    if (consoleShown) {
        addClass("console-shown", "editors");
    } else {
        removeClass("console-shown", "editors");
    }
    for (const editor of editors) {
        editor.aceEditor.resize();
    }
}

export function updateEditorsTheme() {
    const theme = Colors.isDarkMode()
        ? aceEditorDarkTheme
        : aceEditorLightTheme;
    for (const editor of editors) {
        editor.aceEditor.setTheme(theme);
    }
}

export function removeEditor(fileId: number) {
    const editor = editors.find((e) => e.fileId === fileId);
    if (editor) {
        editor.aceEditor.destroy();
        editor.aceEditor.container.remove();
    }
    editors = editors.filter((editor) => editor.fileId !== fileId);
}

async function quickRerender() {
    if (memoryShown)
        await render("memory", "/app/memory.ejs", undefined, false);
    await render("registers", "/app/registers.ejs", undefined, false);
    if (consoleShown)
        await render("console", "/app/console.ejs", undefined, false);
    await render("vm-buttons", "/app/vm-buttons.ejs", undefined, false);
}
export function addEditor(file: file) {
    const editorHTMLDivElement = document.createElement("div");
    editorHTMLDivElement.id = `editor-${file.id}`;
    editorHTMLDivElement.className = "editor";
    editorHTMLDivElement.style.opacity = "0";

    const editorsHTMLElement = document.getElementById("editors");
    if (editorsHTMLElement) {
        editorsHTMLElement.appendChild(editorHTMLDivElement);
    }

    const aceEditor = ace.edit(editorHTMLDivElement);
    aceEditor.commands.removeCommand("find", false);
    aceEditor.commands.removeCommand("openCommandPallete", false);

    if (Colors.isDarkMode()) {
        aceEditor.setTheme(aceEditorDarkTheme);
    } else {
        aceEditor.setTheme(aceEditorLightTheme);
    }
    aceEditor.session.setMode("ace/mode/mips");

    aceEditor.setValue(file.content);

    editors.push({
        fileId: file.id,
        aceEditor: aceEditor,
    });

    // This event listener updates the file in localstorage on input
    // The extra guard for `pauseEditorUpdates` is needed because the event sometimes fires on subsequent rerenders and that causes
    // the last line duplicating. The `silent` guard is neeeded to prevent infinite onchange recursion since setValue triggers the event itself.
    let silent = false;
    aceEditor.session.on("change", async () => {
        if (silent) return;
        if (!pauseEditorUpdates) {
            const newValue = aceEditor.getValue();
            updateFile(file.id, newValue);
            if (interfaceState === "execute" && newValue !== file.content) {
                setTimeout(() => stop(), 10);
            }
        } else {
            silent = true;
            aceEditor.setValue(file.content);
            aceEditor.clearSelection();
            silent = false;
        }
    });

    aceEditor.session.selection.on("changeCursor", async () => {
        if (interfaceState === "execute") {
            const session = aceEditor.session;
            const line = aceEditor.getCursorPosition().row;
            selectCorrespondingAssembled([line], file, session);
        }
    });
    aceEditor.on("changeSelection", () => {
        if (interfaceState === "execute") {
            const sel = aceEditor.getSelectionRange();
            const start = sel.start.row;
            const end = sel.end.row;
            const lines = Array.from(
                { length: end - start + 1 },
                (_, i) => start + i,
            );
            selectCorrespondingAssembled(lines, file, aceEditor.session);
        }
    });

    aceEditor.on("gutterclick", (ev: any) => {
        ev.preventDefault();
        const row = ev.getDocumentPosition().row;
        const session = getAceEditor()?.getSession()!;
        if (session.getBreakpoints()[row]) session.clearBreakpoint(row);
        else session.setBreakpoint(row, "breakpoint-line");
    });

    editorHTMLDivElement.style.opacity = "1";
}

export function showEditor(fileId: number | null) {
    if (fileId !== null) {
        for (const editor of editors) {
            const id = String(editor.fileId);
            const editorElement = document.getElementById(`editor-${id}`);
            if (editorElement) {
                const isActive = id == fileId.toString();
                editorElement.style.display = isActive ? "block" : "none";
                if (isActive) {
                    editor.aceEditor.focus();
                }
                editor.aceEditor.clearSelection();
            }
        }

        // remove error marker when editing
        for (const editorElem of document.getElementsByClassName(
            "ace_content",
        )) {
            editorElem.addEventListener("click", () => {
                clearErrorMarkers();
            });
        }
    } else console.error("File id is null.", fileId);
}

export function getAceEditor(file = getSelectedFile()) {
    if (file) {
        for (const editor of editors) {
            if (editor.fileId === file.id) {
                return editor.aceEditor;
            }
        }
    }
    return undefined;
}

export function initEditors() {
    const editorsElement = document.getElementById("editors");
    if (editorsElement) {
        editorsElement.innerHTML = "";
        for (const { aceEditor } of editors) {
            aceEditor.destroy();
            aceEditor.container.remove();
        }
        editors = [];
        const files = getFiles();
        if (files.length > 0) {
            for (const file of files) {
                addEditor(file);
            }
            showEditor(getSelectedFileId());
        }
    }
}

/**Selects in the memory visualizations the line(s) of assembled corresponding to the code in the specified lines*/
function selectCorrespondingAssembled(
    lines: number[],
    file: file,
    session: AceAjax.IEditSession,
) {
    // clear old selection
    const oldSelection = Array.from(
        document.getElementsByClassName("selected-instruction"),
    );
    for (const old of oldSelection)
        old.classList.remove("selected-instruction");

    // highlight the assembly corresponding to the code in the current cursor line
    for (const line of lines) {
        const assembled = Array.from(
            vm.assembler.addressEditorsPositions.entries(),
        )
            .filter(
                ([_, editorPos]) =>
                    editorPos.fileId === file.id &&
                    editorPos.lineNumber - 1 === line,
            )
            .map(([addr, _]) => addr);

        let first = true;
        assembled.forEach((addr) => {
            const elem = document.getElementById(`${addr}`);
            if (!elem) return;
            if (first) {
                //scroll to the first of the addresses
                first = false;
                highlightElementAnimation(`${addr}`, true, 0);
            }
            elem.classList.add("selected-instruction");
        });
    }
}
