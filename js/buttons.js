var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { hideForm, showForm } from "./forms.js";
import { toggleSidebar } from "./sidebar.js";
import { changeFile, closeAllFiles, closeFile, deleteFile, exportFile, getOpenedFiles, getSelectedFileId, importFiles, newFile, openFile, renameFile } from "./files.js";
import { hideFilePopover, showFilePopover } from "./popovers.js";
import { assemble, stop, step, run } from "./virtual-machine.js";
import { colFormatSelect } from "./settings.js";
window.colFormatSelectOnChange = function (element) {
    return __awaiter(this, void 0, void 0, function* () {
        yield colFormatSelect(element);
    });
};
window.stepOnClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield step();
    });
};
window.runOnClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield run();
    });
};
window.stopOnClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield stop();
    });
};
window.assembleOnClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const openedFiles = getOpenedFiles();
        yield assemble(openedFiles);
    });
};
window.showFilePopoverOnClick = function (id, toggleButton) {
    return __awaiter(this, void 0, void 0, function* () {
        yield showFilePopover(id, toggleButton);
    });
};
window.showFormOnClick = function (form, dataString) {
    return __awaiter(this, void 0, void 0, function* () {
        yield showForm(form, JSON.parse(dataString));
    });
};
window.hideFormOnClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield hideForm();
    });
};
window.toggleSidebarOnClick = function (sidebarButton) {
    return __awaiter(this, void 0, void 0, function* () {
        yield toggleSidebar(sidebarButton);
    });
};
window.newFileOnClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield newFile();
    });
};
window.importFilesOnClick = function () {
    importFiles();
};
window.closeAllFilesOnClick = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield closeAllFiles();
    });
};
window.changeFileOnClick = function (stringFileId, fileTab) {
    return __awaiter(this, void 0, void 0, function* () {
        let fileTabs = fileTab.parentElement;
        let scrollLeft = undefined;
        if (fileTabs) {
            scrollLeft = fileTabs.scrollLeft;
        }
        const fileId = parseInt(stringFileId);
        if (isNaN(fileId))
            console.error('Invalid fileId');
        yield changeFile(fileId);
        if (scrollLeft) {
            document.getElementById('files-tabs').scrollLeft = scrollLeft;
        }
    });
};
window.openFileOnDbClick = function (stringFileId, fileContainer) {
    return __awaiter(this, void 0, void 0, function* () {
        let allFiles = fileContainer.parentElement;
        let scrollTop = undefined;
        if (allFiles) {
            scrollTop = allFiles.scrollTop;
        }
        const fileId = parseInt(stringFileId);
        if (isNaN(fileId))
            console.error('Invalid fileId');
        yield openFile(fileId);
        if (scrollTop) {
            document.getElementById('all-files').scrollTop = scrollTop;
        }
    });
};
window.closeFileOnClick = function (stringFileId, button) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const fileTab = (_a = button.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement;
        let filesTabs = fileTab === null || fileTab === void 0 ? void 0 : fileTab.parentElement;
        let scrollLeft = undefined;
        if (filesTabs) {
            scrollLeft = filesTabs.scrollLeft;
        }
        const selectedFileId = getSelectedFileId();
        const fileId = parseInt(stringFileId);
        yield closeFile(fileId);
        if (fileId !== selectedFileId) {
            if (scrollLeft) {
                document.getElementById('files-tabs').scrollLeft = scrollLeft;
            }
        }
    });
};
window.deleteFileOnClick = function (stringFileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileId = parseInt(stringFileId);
        yield deleteFile(fileId);
    });
};
window.exportFileOnClick = function (stringFileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileId = parseInt(stringFileId);
        yield exportFile(fileId);
        hideFilePopover();
    });
};
window.renameFileOnClick = function (stringFileId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const fileId = parseInt(stringFileId);
        const newFileName = (_a = document.getElementById('new-file-name')) === null || _a === void 0 ? void 0 : _a.value;
        try {
            if (!newFileName)
                throw new Error('Invalid file name');
            yield renameFile(fileId, newFileName);
            yield hideForm();
        }
        catch (error) {
            alert('Error renaming the file. Please try again.');
        }
    });
};
