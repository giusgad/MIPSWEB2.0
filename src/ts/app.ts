import { addLoader, initLoaders, removeLoader } from "./loaders.js";
import { Colors } from "./lib/Colors.js";
import { Icons } from "./lib/Icons.js";
import { initEditors, renderEditors } from "./editors.js";
import { render } from "./rendering.js";
import { initSortables } from "./sortable.js";
import { hideFilePopover } from "./popovers.js";
import "./buttons.js";
import "./drag.js";
import "./settings.js";
import "./memorymap.js";
import "./intervals.js";
import "./execution-speed.js";
import "./keyboard-shortcuts.js";
import {
    getFromStorage,
    scrollSelectedIntoView,
    setIntoStorage,
} from "./utils.js";
import { clearMemorySelectedFormats, default_settings } from "./settings.js";
import { scrollConsoleToBottom, watchingConsole } from "./console.js";
import { endDrag } from "./drag.js";
import { stop } from "./virtual-machine.js";
import { adjustBinaryWidth } from "./style.js";

let online = false;
initLoaders();
if (navigator.onLine) {
    online = true;
}

export let interfaceState: "edit" | "execute" = "edit";
export let editorState: "edit" | "execute" = "edit";

document.addEventListener("DOMContentLoaded", async () => {
    Colors.init();
    Icons.init();

    if (!online) {
        await renderErrorPage("No Internet connection");
        document.body.style.opacity = "1";
        return;
    }

    try {
        if (!getFromStorage("local", "settings")) {
            setIntoStorage("local", "settings", default_settings);
        }
        clearMemorySelectedFormats();
        initEditors();
        await renderApp();
    } catch (error) {
        console.error(error);
        await renderErrorPage("Error rendering the app");
    }

    document.body.style.opacity = "1";
    adjustBinaryWidth();
});

window.addEventListener("online", () => {
    window.location.reload();
});

window.addEventListener("offline", () => {
    window.location.reload();
});

window.addEventListener("resize", () => {
    hideFilePopover();
    adjustBinaryWidth();
});

// clicking editor while executing goes back to edit state
document.getElementById("editors")?.addEventListener("click", () => {
    if (editorState === "execute") {
        stop();
    }
});

/* window.addEventListener("focus", async () => {
    initEditors();
    await renderApp();
}); */
// TODO: removed only while developing

async function renderErrorPage(errorMessage: string) {
    document.getElementById("editors")!.style.display = "none";
    initLoaders();
    addLoader("renderErrorPage");
    await render("app", "error-page.ejs", { errorMessage });
    removeLoader("renderErrorPage");
}

export async function renderApp(
    newInterfaceState: "edit" | "execute" = interfaceState,
    newEditorState: "edit" | "execute" = editorState,
    showLoaders: boolean = true,
) {
    if (showLoaders) addLoader("renderApp");
    interfaceState = newInterfaceState;
    editorState = newEditorState;
    renderEditors();
    await render("app", "app.ejs", undefined, showLoaders);
    scrollConsoleToBottom();
    watchingConsole();
    initSortables();
    hideFilePopover();
    scrollSelectedIntoView("files-tabs");
    scrollSelectedIntoView("all-files");
    endDrag();
    if (showLoaders) removeLoader("renderApp");
}
