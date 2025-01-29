import {renderApp} from "./app.js";

export let sidebar: string | undefined = undefined;

export function setSidebar(sidebarContent: string | undefined = undefined) {
    sidebar = sidebarContent;
}

export async function toggleSidebar(sidebarContent: string) {
    if (sidebar === sidebarContent) {
        sidebar = undefined;
    } else {
        setSidebar(sidebarContent);
    }
    await renderApp();
}