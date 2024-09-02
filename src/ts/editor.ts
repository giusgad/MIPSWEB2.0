import {file, updateFile} from "./files.js"

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

export function reloadEditors(files: file[], fileId: number) {
    addFilesEditors(files);
    showEditor(fileId);
}

export function addFilesEditors(files: file[]) {
    for (const file of files) {
        addFileEditor(file);
    }
}


export function showEditor(fileId: number) {
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