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
import {
    getFromStorage,
    scrollSelectedIntoView,
    setIntoStorage,
} from "./utils.js";
import { clearMemorySelectedFormats, default_settings } from "./settings.js";
import { scrollConsoleToBottom, watchingConsole } from "./console.js";
import { endDrag } from "./drag.js";

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
});

window.addEventListener("online", () => {
    window.location.reload();
});

window.addEventListener("offline", () => {
    window.location.reload();
});

window.addEventListener("resize", () => {
    hideFilePopover();
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
) {
    addLoader("renderApp");
    interfaceState = newInterfaceState;
    editorState = newEditorState;
    renderEditors();
    await render("app", "app.ejs");
    scrollConsoleToBottom();
    watchingConsole();
    initSortables();
    hideFilePopover();
    scrollSelectedIntoView("files-tabs");
    scrollSelectedIntoView("all-files");
    endDrag();
    removeLoader("renderApp");
}
