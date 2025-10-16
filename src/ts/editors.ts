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
import { editorState, interfaceState, renderApp } from "./app.js";
import { consoleShown, memoryShown, vm } from "./virtual-machine.js";

export type editor = {
    fileId: number;
    aceEditor: AceAjax.Editor;
};
export type EditorPosition = { fileId: number; lineNumber: number };

export const aceEditorLightTheme = "ace/theme/chrome";
export const aceEditorDarkTheme = "ace/theme/one_dark";

export let editors: editor[] = [];

export function getSelectedInstructionAddresses() {
    if (editorState === "edit") return [];
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

export function renderEditors() {
    resizeEditors();
    const aceEditor = getAceEditor();
    if (aceEditor) {
        const cursors = document.getElementsByClassName("ace_cursor-layer");
        if (editorState === "edit") {
            aceEditor.setOptions({
                readOnly: false,
                highlightActiveLine: true,
                scrollPastEnd: 0.5,
            });

            for (let i = 0; i < cursors.length; i++) {
                (cursors[i] as HTMLElement).style.display = "block";
            }

            let markers = aceEditor.session.getMarkers(false);
            for (let i in markers) {
                if (markers[i].clazz === "next-instruction") {
                    aceEditor.session.removeMarker(markers[i].id);
                }
            }
            aceEditor.focus();
        } else if (editorState === "execute") {
            aceEditor.setOptions({
                readOnly: true,
                highlightActiveLine: true,
            });

            for (let i = 0; i < cursors.length; i++) {
                (cursors[i] as HTMLElement).style.display = "none";
            }

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
    const editorHTMLElement = document.getElementById(`editor-${fileId}`);
    if (editorHTMLElement) {
        editorHTMLElement.remove();
    }
    editors = editors.filter((editor) => editor.fileId !== fileId);
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
    if (Colors.isDarkMode()) {
        aceEditor.setTheme(aceEditorDarkTheme);
    } else {
        aceEditor.setTheme(aceEditorLightTheme);
    }
    aceEditor.session.setMode("ace/mode/mips");
    aceEditor.setValue(file.content, 1);

    editors.push({
        fileId: file.id,
        aceEditor: aceEditor,
    });

    aceEditor.session.on("change", async () => {
        updateFile(file.id, aceEditor.getValue());
    });

    aceEditor.getSession().selection.on("changeCursor", async () => {
        if (interfaceState === "execute") {
            const session = getAceEditor()?.getSession();
            if (session) {
                const markers = session.getMarkers(false);
                let first = true;
                for (const i in markers) {
                    if (first) {
                        first = false;
                        continue;
                    }
                    session.removeMarker(markers[i].id);
                }
            }
        }
    });

    aceEditor.on("dblclick", async () => {
        if (interfaceState === "execute") {
            await renderApp("execute", "edit");
        }
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

        // add event listeners after rendering the editor
        requestAnimationFrame(() => {
            // breakpoint event listeners
            for (const lineDiv of document.getElementsByClassName(
                "ace_gutter-cell",
            )) {
                (lineDiv as HTMLDivElement).addEventListener("click", (ev) => {
                    ev.preventDefault();
                    let row = Number(lineDiv.childNodes[0].textContent);
                    if (!row) {
                        console.error("Invalid row number for breakpoint");
                        return;
                    }
                    row = row - 1;
                    const session = getAceEditor()?.getSession();
                    if (session?.getBreakpoints()[row])
                        session?.clearBreakpoint(row);
                    else session?.setBreakpoint(row, "breakpoint-line");
                });
            }
        });
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
