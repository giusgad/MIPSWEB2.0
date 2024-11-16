import {file, getFiles, getSelectedFileId, saveFile, updateFile} from "./files.js";
import {getContext, vm} from "./app.js";
import {render} from "./index.js";

export type fileEditor = {
    fileId: number,
    aceEditor: AceAjax.Editor;
}

export let filesEditors: fileEditor[] = [];

export let editorState: "edit" | "execute" = "edit";

export function renderEditor(newState: "edit" | "execute" = editorState) {
    editorState = newState;
    const editor = getEditor();
    const cursors = document.getElementsByClassName("ace_cursor-layer");
    if (editor) {
        if (editorState === "edit") {

            editor.setOptions({
                readOnly: false,
                highlightActiveLine: true
            });

            for (let i = 0; i < cursors.length; i++) {
                (cursors[i] as HTMLElement).style.display = "block";
            }

            let markers = editor.session.getMarkers(false);
            for (let i in markers) {
                if (markers[i].clazz === "next-instruction") {
                    editor.session.removeMarker(markers[i].id);
                }
            }
            editor.session.clearBreakpoints();
            editor.focus();

        } else if (editorState === "execute") {

            editor.setOptions({
                readOnly: true,
                highlightActiveLine: true
            });

            for (let i = 0; i < cursors.length; i++) {
                (cursors[i] as HTMLElement).style.display = "none";
            }

            let markers = editor.session.getMarkers(false);
            for (let i in markers) {
                if (markers[i].clazz === "next-instruction") {
                    editor.session.removeMarker(markers[i].id);
                }
            }
            editor.session.clearBreakpoints();

            const nextInstructionLine = vm.nextInstructionLineNumber;
            if (nextInstructionLine) {
                let Range = ace.require('ace/range').Range,
                    range = new Range(nextInstructionLine - 1, 0, nextInstructionLine - 1, Infinity);
                editor.session.addMarker(range, "next-instruction", "fullLine", false);
                editor.session.setBreakpoint(nextInstructionLine - 1, "breakpoint");
            }
        }
    }
}

export function getEditor(fileId = getSelectedFileId()) {
    if (fileId !== null) {
        for (const fileEditor of filesEditors) {
            if (fileEditor.fileId === fileId) {
                return fileEditor.aceEditor;
            }
        }
    }
    return undefined;
}

export function removeFileEditor(fileId: number) {
    const fileEditorElement = document.getElementById(`file-editor-${fileId}`);
    if (fileEditorElement) {
        fileEditorElement.remove();
    }
    filesEditors = filesEditors.filter(fileEditor => fileEditor.fileId !== fileId);
}

export function showEditor(fileId: number | null) {

    if (fileId !== null) {
        for (const fileEditor of filesEditors) {
            const id = String(fileEditor.fileId);
            const editorElement = document.getElementById(`file-editor-${id}`);
            if (editorElement) {
                const isActive = id == fileId.toString();
                editorElement.style.display = isActive ? 'block' : 'none';
                if (isActive) {
                    fileEditor.aceEditor.focus();
                }
                fileEditor.aceEditor.clearSelection();
            }
        }
    } else console.error('File id is null.', fileId);

}

export function addFileEditor(file: file) {

    const fileEditorElement = document.createElement('div');
    fileEditorElement.id = `file-editor-${file.id}`;
    fileEditorElement.className = 'file-editor';

    const fileEditorsElement = document.getElementById('files-editors');
    if (fileEditorsElement) {
        fileEditorsElement.appendChild(fileEditorElement);
    }

    const aceEditor = ace.edit(fileEditorElement);
    aceEditor.setTheme("ace/theme/chrome");
    aceEditor.session.setMode("ace/mode/mips");
    aceEditor.setValue(file.content, 1);

    filesEditors.push({
        fileId: file.id,
        aceEditor: aceEditor
    });

    aceEditor.session.on("change", async () => {
        updateFile(file.id, aceEditor.getValue());
        await saveFile(file.id);
    });

    aceEditor.getSession().selection.on("changeCursor", async () => {
        await render('memory', 'app/memory.ejs', getContext());
    });

    aceEditor.on("dblclick", async () => {
        renderEditor("edit");
        await render('memory', 'app/memory.ejs');
        await render('vm-buttons', 'app/vm-buttons.ejs');
        aceEditor.clearSelection();
    });

    showEditor(file.id);
}

export function addFilesEditors() {
    const files = getFiles();
    for (const file of files) {
        addFileEditor(file);
    }
}

export function initEditors() {
    const filesEditorsElement = document.getElementById('files-editors');
    if (filesEditorsElement) {
        filesEditorsElement.innerHTML = '';
        filesEditors = [];
        const files = getFiles();
        if (files.length > 0) {
            addFilesEditors();
            showEditor(getSelectedFileId());
        }
    } else console.error('Element with id "files-editors" not found.');
}