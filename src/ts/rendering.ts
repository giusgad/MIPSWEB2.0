import { addLoader, removeLoader } from "./loaders.js";
import { Icons } from "./lib/Icons.js";
import { Colors } from "./lib/Colors.js";
import { getFiles, getProjectName, getSelectedFile } from "./files.js";
import { editorState, interfaceState } from "./app.js";
import {
    consoleShown,
    memoryShown,
    registersShown,
    vm,
} from "./virtual-machine.js";
import { getFromStorage } from "./utils.js";
import { getSelectedInstructionAddresses } from "./editors.js";
import { getMemoryIntervals } from "./intervals.js";
import { possibleOptions } from "./settings.js";
import {
    drawMemoryMap,
    drawMemoryMapConnections,
    watchMemoryScroll,
} from "./memorymap.js";
import { scrollConsoleToBottom, watchingConsole } from "./console.js";
import { updateTagsWidth } from "./style.js";

declare const ejs: any;
(window as any).ejs = ejs;

export function getContext() {
    return {
        projectName: getProjectName(),
        files: getFiles(),
        selectedFile: getSelectedFile(),
        interfaceState: interfaceState,
        editorState: editorState,
        /** currently set options*/
        settings: getFromStorage("local", "settings"),
        /** possible options as defined in settings.ts*/
        possibleOptions: possibleOptions,
        memoryIntervals: getMemoryIntervals(),
        memoryShown: memoryShown,
        consoleShown: consoleShown,
        registersShown: registersShown,
        selectedInstructionAddresses: getSelectedInstructionAddresses(),
        vm: vm,
    };
}

export async function render(
    id: string,
    templatePath: string,
    ctx: any = undefined,
    showLoaders: boolean = true,
) {
    if (showLoaders) addLoader(`render: ${id}`);
    if (!ctx) ctx = getContext();
    const element = document.getElementById(id);
    if (!element) throw new Error(`No element found by Id: ${id}`);
    element.innerHTML = await renderTemplate(templatePath, ctx);
    if (showLoaders) removeLoader(`render: ${id}`);
    if (id === "memory" || id === "app") {
        drawMemoryMap();
        if (memoryShown) drawMemoryMapConnections();
        watchMemoryScroll();
        updateTagsWidth(ctx.vm);
    } else if (id === "console" && vm.console.state === "waitingInput") {
        const consoleInput = document.getElementById("console-input");
        if (consoleInput) {
            consoleInput.focus();
        }
        watchingConsole();
        scrollConsoleToBottom();
    }
}

(window as any).renderTemplate = renderTemplate;
async function renderTemplate(templatePath: string, ctx: any = undefined) {
    addLoader(`renderTemplate: ${templatePath}`);
    if (!ctx) ctx = getContext();
    const template = await fetch(`templates/${templatePath}`).then((res) => {
        if (!res.ok) {
            throw new Error(`No template found: "templates/${templatePath}"`);
        }
        return res.text();
    });
    const data = { ctx, Icons, Colors };
    const result = ejs.render(template, data, { async: true });
    removeLoader(`renderTemplate: ${templatePath}`);
    return result;
}
