var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { addLoader, initLoaders, removeLoader } from "./loaders.js";
import { Colors } from "./lib/Colors.js";
import { Icons } from "./lib/Icons.js";
import { initEditors, renderEditors } from "./editors.js";
import { render } from "./rendering.js";
import { initSortables } from "./sortable.js";
import { hideFilePopover } from "./popovers.js";
import './buttons.js';
import './drag.js';
import './settings.js';
import { getFromStorage, scrollSelectedIntoView, setIntoStorage } from "./utils.js";
import { clearMemorySelectedFormats, default_settings } from "./settings.js";
import { scrollConsoleToBottom, watchingConsole } from "./console.js";
import { endDrag } from "./drag.js";
let online = false;
initLoaders();
if (navigator.onLine) {
    online = true;
}
export let interfaceState = "edit";
export let editorState = "edit";
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    Colors.init();
    Icons.init();
    if (!online) {
        yield renderErrorPage('No Internet connection');
        document.body.style.opacity = '1';
        return;
    }
    try {
        if (!getFromStorage("local", "settings")) {
            setIntoStorage("local", "settings", default_settings);
        }
        clearMemorySelectedFormats();
        initEditors();
        yield renderApp();
    }
    catch (error) {
        console.error(error);
        yield renderErrorPage('Error rendering the app');
    }
    document.body.style.opacity = '1';
}));
window.addEventListener('online', () => {
    window.location.reload();
});
window.addEventListener('offline', () => {
    window.location.reload();
});
window.addEventListener('resize', () => {
    hideFilePopover();
});
window.addEventListener("storage", (event) => __awaiter(void 0, void 0, void 0, function* () {
    if (event.storageArea === localStorage) {
        console.log(`Key: ${event.key}`);
        console.log(`Old value: ${event.oldValue}`);
        console.log(`new value: ${event.newValue}`);
        yield renderApp();
        window.location.reload();
    }
}));
function renderErrorPage(errorMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        document.getElementById('editors').style.display = 'none';
        initLoaders();
        addLoader('renderErrorPage');
        yield render('app', 'error-page.ejs', { errorMessage });
        removeLoader('renderErrorPage');
    });
}
export function renderApp() {
    return __awaiter(this, arguments, void 0, function* (newInterfaceState = interfaceState, newEditorState = editorState) {
        addLoader('renderApp');
        interfaceState = newInterfaceState;
        editorState = newEditorState;
        renderEditors();
        yield render('app', 'app.ejs');
        scrollConsoleToBottom();
        watchingConsole();
        initSortables();
        hideFilePopover();
        scrollSelectedIntoView('files-tabs');
        scrollSelectedIntoView('all-files');
        endDrag();
        removeLoader('renderApp');
    });
}
