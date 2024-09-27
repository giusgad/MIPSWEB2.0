var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { getFiles, getSelectedFile, getSelectedFileId, setSelectedFileId } from "./files.js";
import { addClass, getFromLocalStorage, removeClass, render, setIntoLocalStorage } from "./index.js";
import { reloadEditors, updateEditor } from "./editor.js";
import { VirtualMachine } from "./virtual-machine/VirtualMachine.js";
import { CPU } from "./virtual-machine/CPU.js";
export var vm = new VirtualMachine(new CPU);
var settings = {
    tables: {
        registers: {
            columns: {
                value: { format: 'decimal' }
            }
        },
        memory: {
            columns: {
                address: { format: 'decimal' },
                value: { format: 'basic' }
            }
        }
    }
};
document.body.classList.add('wait');
document.addEventListener('DOMContentLoaded', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!getFromLocalStorage("settings")) {
                    setIntoLocalStorage("settings", settings);
                }
                return [4 /*yield*/, render('app', 'app.ejs')];
            case 1:
                _a.sent();
                reloadEditors(getFiles(), getSelectedFileId());
                document.body.classList.remove('wait');
                return [2 /*return*/];
        }
    });
}); });
export function updateInterface() {
    return __awaiter(this, void 0, void 0, function () {
        var ctx, state;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ctx = getContext();
                    state = ctx.state;
                    if (!(state === "execute")) return [3 /*break*/, 5];
                    return [4 /*yield*/, render('vm-buttons', '/app/vm-buttons.ejs', ctx)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, render('opened-files', '/app/opened-files.ejs', ctx)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, render('registers', '/app/registers.ejs', ctx)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, render('memory', '/app/memory.ejs', ctx)];
                case 4:
                    _a.sent();
                    addClass('execute', 'files-editors');
                    addClass('execute', 'opened-files');
                    addClass('execute', 'registers');
                    return [3 /*break*/, 10];
                case 5:
                    if (!(state === "edit")) return [3 /*break*/, 10];
                    return [4 /*yield*/, render('vm-buttons', '/app/vm-buttons.ejs', ctx)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, render('opened-files', '/app/opened-files.ejs', ctx)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, render('registers', '/app/registers.ejs', ctx)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, render('memory', '/app/memory.ejs', ctx)];
                case 9:
                    _a.sent();
                    removeClass('execute', 'files-editors');
                    removeClass('execute', 'opened-files');
                    removeClass('execute', 'registers');
                    _a.label = 10;
                case 10: return [2 /*return*/];
            }
        });
    });
}
window.assembleClick = function () {
    return __awaiter(this, void 0, void 0, function () {
        var file;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    file = getSelectedFile();
                    if (!file) return [3 /*break*/, 2];
                    if (!file.content) return [3 /*break*/, 2];
                    vm.assemble(file.content);
                    return [4 /*yield*/, updateInterface()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    updateEditor();
                    return [2 /*return*/];
            }
        });
    });
};
window.stopClick = function () {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, stopExecution()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
};
window.stepClick = function () {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    vm.step();
                    return [4 /*yield*/, updateInterface()];
                case 1:
                    _a.sent();
                    updateEditor();
                    return [2 /*return*/];
            }
        });
    });
};
window.runClick = function () {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    vm.run();
                    return [4 /*yield*/, updateInterface()];
                case 1:
                    _a.sent();
                    updateEditor();
                    return [2 /*return*/];
            }
        });
    });
};
window.settingsClick = function () {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            console.log("Settings");
            return [2 /*return*/];
        });
    });
};
export function stopExecution() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    vm.stop();
                    return [4 /*yield*/, updateInterface()];
                case 1:
                    _a.sent();
                    updateEditor();
                    return [2 /*return*/];
            }
        });
    });
}
export function getContext() {
    var state = vm.state;
    var nextInstructionLineNumber = vm.nextInstructionLineNumber;
    var files = getFiles();
    var selectedFileId = getSelectedFileId();
    if (selectedFileId === null) {
        if (files.length > 0) {
            setSelectedFileId(files[0].id);
        }
    }
    var selectedFile = getSelectedFile();
    if ((selectedFileId !== null) && (!selectedFile)) {
        setSelectedFileId(files[0].id);
        selectedFile = getSelectedFile();
    }
    var registers = vm.getRegisters();
    var memory = vm.getMemory();
    var ctx = {
        state: state,
        files: files,
        selectedFile: selectedFile,
        registers: registers,
        memory: memory,
        nextInstructionLineNumber: nextInstructionLineNumber,
        settings: getFromLocalStorage("settings")
    };
    return ctx;
}
