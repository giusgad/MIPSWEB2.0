var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { addLoader, removeLoader } from "./loaders.js";
import { Icons } from "./lib/Icons.js";
import { Colors } from "./lib/Colors.js";
import { getFiles, getOpenedFiles, getSelectedFile } from "./files.js";
import { sidebar } from "./sidebar.js";
import { editorState, interfaceState } from "./app.js";
import { getMemoryIntervals, vm } from "./virtual-machine.js";
import { getFromStorage } from "./utils.js";
import { getSelectedInstructionAddresses } from "./editors.js";
window.ejs = ejs;
export function getContext() {
    return {
        files: getFiles(),
        openedFiles: getOpenedFiles(),
        selectedFile: getSelectedFile(),
        sidebar: sidebar,
        interfaceState: interfaceState,
        editorState: editorState,
        settings: getFromStorage("local", "settings"),
        memoryIntervals: getMemoryIntervals(),
        selectedInstructionAddresses: getSelectedInstructionAddresses(),
        vm: vm
    };
}
export function render(id_1, templatePath_1) {
    return __awaiter(this, arguments, void 0, function* (id, templatePath, ctx = undefined) {
        addLoader(`render: ${id}`);
        if (!ctx)
            ctx = getContext();
        const element = document.getElementById(id);
        if (!element)
            throw new Error(`No element found by Id: ${id}`);
        element.innerHTML = yield renderTemplate(templatePath, ctx);
        removeLoader(`render: ${id}`);
    });
}
window.renderTemplate = renderTemplate;
function renderTemplate(templatePath_1) {
    return __awaiter(this, arguments, void 0, function* (templatePath, ctx = undefined) {
        addLoader(`renderTemplate: ${templatePath}`);
        if (!ctx)
            ctx = getContext();
        const template = yield fetch(`src/templates/${templatePath}`).then(res => {
            if (!res.ok) {
                throw new Error(`No template found: "src/templates/${templatePath}"`);
            }
            return res.text();
        });
        const data = { ctx, Icons, Colors };
        const result = ejs.render(template, data, { async: true });
        removeLoader(`renderTemplate: ${templatePath}`);
        return result;
    });
}
