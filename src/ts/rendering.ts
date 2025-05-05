import { addLoader, removeLoader } from "./loaders.js";
import { Icons } from "./lib/Icons.js";
import { Colors } from "./lib/Colors.js";
import { getFiles, getOpenedFiles, getSelectedFile } from "./files.js";
import { sidebar } from "./sidebar.js";
import { editorState, interfaceState } from "./app.js";
import { vm } from "./virtual-machine.js";
import { getFromStorage } from "./utils.js";
import { getSelectedInstructionAddresses } from "./editors.js";
import { memoryMapActive } from "./memorymap.js";
import { getMemoryIntervals } from "./intervals.js";

declare const ejs: any;
(window as any).ejs = ejs;

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
        memoryMapActive: memoryMapActive,
        selectedInstructionAddresses: getSelectedInstructionAddresses(),
        vm: vm,
    };
}

export async function render(
    id: string,
    templatePath: string,
    ctx: any = undefined,
) {
    addLoader(`render: ${id}`);
    if (!ctx) ctx = getContext();
    const element = document.getElementById(id);
    if (!element) throw new Error(`No element found by Id: ${id}`);
    element.innerHTML = await renderTemplate(templatePath, ctx);
    removeLoader(`render: ${id}`);
}

(window as any).renderTemplate = renderTemplate;
async function renderTemplate(templatePath: string, ctx: any = undefined) {
    addLoader(`renderTemplate: ${templatePath}`);
    if (!ctx) ctx = getContext();
    const template = await fetch(`src/templates/${templatePath}`).then(
        (res) => {
            if (!res.ok) {
                throw new Error(
                    `No template found: "src/templates/${templatePath}"`,
                );
            }
            return res.text();
        },
    );
    const data = { ctx, Icons, Colors };
    const result = ejs.render(template, data, { async: true });
    removeLoader(`renderTemplate: ${templatePath}`);
    return result;
}
