import { renderApp } from "./app.js";

export let memoryMapActive = false;

export async function toggleMemoryMap() {
    memoryMapActive = !memoryMapActive;
    await renderApp();
}
