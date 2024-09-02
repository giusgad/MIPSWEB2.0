import { updateFile } from "./files.js";
export var filesEditors = [];
export function addFileEditor(file) {
    var fileEditorElement = document.createElement('div');
    fileEditorElement.id = "file-editor-".concat(file.id);
    fileEditorElement.className = 'file-editor';
    var fileEditorsElement = document.getElementById('files-editors');
    if (fileEditorsElement) {
        fileEditorsElement.appendChild(fileEditorElement);
    }
    var aceEditor = ace.edit(fileEditorElement);
    aceEditor.setTheme("ace/theme/chrome");
    aceEditor.session.setMode("ace/mode/mips");
    aceEditor.setValue(file.content, 1);
    filesEditors.push({
        fileId: file.id,
        aceEditor: aceEditor
    });
    aceEditor.session.on("change", function () {
        updateFile(file.id, aceEditor.getValue());
    });
    showEditor(file.id);
}
export function removeFileEditor(fileId) {
    var fileEditorElement = document.getElementById("file-editor-".concat(fileId));
    if (fileEditorElement) {
        fileEditorElement.remove();
    }
    filesEditors = filesEditors.filter(function (fileEditor) { return fileEditor.fileId !== fileId; });
}
export function reloadEditors(files, fileId) {
    addFilesEditors(files);
    showEditor(fileId);
}
export function addFilesEditors(files) {
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        addFileEditor(file);
    }
}
export function showEditor(fileId) {
    for (var _i = 0, filesEditors_1 = filesEditors; _i < filesEditors_1.length; _i++) {
        var fileEditor = filesEditors_1[_i];
        var id = String(fileEditor.fileId);
        var editorElement = document.getElementById("file-editor-".concat(id));
        if (editorElement) {
            var isActive = id == fileId.toString();
            editorElement.style.display = isActive ? 'block' : 'none';
            if (isActive) {
                fileEditor.aceEditor.focus();
            }
            fileEditor.aceEditor.clearSelection();
        }
    }
}
