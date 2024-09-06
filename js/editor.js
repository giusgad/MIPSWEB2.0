import { getSelectedFileId, updateFile } from "./files.js";
import { vm } from "./app.js";
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
    document.getElementById('files-editors').innerHTML = '';
    filesEditors = [];
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
    if (fileId !== null) {
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
}
export function updateEditor() {
    var selectedFileId = getSelectedFileId();
    if (selectedFileId !== null) {
        var fileEditor = filesEditors.find(function (editor) { return editor.fileId === selectedFileId; });
        if (fileEditor) {
            var VMState = vm.getState();
            var aceEditor = fileEditor.aceEditor;
            var cursors = document.getElementsByClassName("ace_hidden-cursors");
            if (VMState === "edit") {
                aceEditor.setOptions({
                    readOnly: false,
                    highlightActiveLine: true,
                    highlightGutterLine: true
                });
                for (var i = 0; i < cursors.length; i++) {
                    cursors[i].style.display = "block";
                }
                var markers = aceEditor.session.getMarkers(false);
                for (var i in markers) {
                    if (markers[i].clazz === "next-instruction") {
                        aceEditor.session.removeMarker(markers[i].id);
                    }
                }
                aceEditor.session.clearBreakpoints();
                aceEditor.focus();
            }
            else if (VMState === "execute") {
                aceEditor.setOptions({
                    readOnly: true,
                    highlightActiveLine: false,
                    highlightGutterLine: false
                });
                for (var i = 0; i < cursors.length; i++) {
                    cursors[i].style.display = "none";
                }
                var nextInstructionLine = vm.getNextInstructionLineNumber();
                var markers = aceEditor.session.getMarkers(false);
                for (var i in markers) {
                    if (markers[i].clazz === "next-instruction") {
                        aceEditor.session.removeMarker(markers[i].id);
                    }
                }
                aceEditor.session.clearBreakpoints();
                if (nextInstructionLine) {
                    var Range_1 = ace.require('ace/range').Range, range = new Range_1(nextInstructionLine - 1, 0, nextInstructionLine - 1, Infinity);
                    aceEditor.session.addMarker(range, "next-instruction", "fullLine", false);
                    aceEditor.session.setBreakpoint(nextInstructionLine - 1, "breakpoint");
                }
            }
        }
    }
}
