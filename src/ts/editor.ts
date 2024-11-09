import {file, getSelectedFileId, updateFile} from "./files.js"
import {state, stopExecution, vm} from "./app.js";

export type fileEditor = {
    fileId: number,
    aceEditor: AceAjax.Editor;
}

export let filesEditors: fileEditor[] = [];

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

    aceEditor.session.on("change", () => {
        updateFile(file.id, aceEditor.getValue());
    });

    showEditor(file.id);
}

export function removeFileEditor(fileId: number) {
    const fileEditorElement = document.getElementById(`file-editor-${fileId}`);
    if (fileEditorElement) {
        fileEditorElement.remove();
    }
    filesEditors = filesEditors.filter(fileEditor => fileEditor.fileId !== fileId);
}

export function reloadEditors(files: file[], fileId: number | null) {
    document.getElementById('files-editors')!.innerHTML = '';
    filesEditors = [];
    addFilesEditors(files);
    showEditor(fileId);
}

export function addFilesEditors(files: file[]) {
    for (const file of files) {
        addFileEditor(file);
    }
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
    }
}

export function updateEditor(): void {
    const selectedFileId = getSelectedFileId();
    if (selectedFileId !== null) {
        const fileEditor = filesEditors.find(editor => editor.fileId === selectedFileId);
        if (fileEditor) {
            const VMState = state;
            const aceEditor: AceAjax.Editor = fileEditor.aceEditor;
            const cursors = document.getElementsByClassName("ace_hidden-cursors");
            if (VMState === "edit") {

                aceEditor.setOptions({
                    readOnly: false,
                    highlightActiveLine: true,
                    highlightGutterLine: true
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
                aceEditor.session.clearBreakpoints();
                aceEditor.focus();

            } else if (VMState === "execute") {

                aceEditor.setOptions({
                    readOnly: true,
                    highlightActiveLine: false,
                    highlightGutterLine: false
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
                aceEditor.session.clearBreakpoints();
                const nextInstructionLine = vm.nextInstructionLineNumber;
                if (nextInstructionLine) {
                    let Range = ace.require('ace/range').Range,
                        range = new Range(nextInstructionLine - 1, 0, nextInstructionLine - 1, Infinity);
                    aceEditor.session.addMarker(range, "next-instruction", "fullLine", false);
                    aceEditor.session.setBreakpoint(nextInstructionLine-1, "breakpoint");
                }

            }
        }
    }
}