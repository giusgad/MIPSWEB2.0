import { renderApp } from "./app.js";

export let memoryMapActive = false;

export async function toggleMemoryMap() {
    memoryMapActive = !memoryMapActive;
    await renderApp();
}

(window as any).isAddressInInterval = function (
    addr: number,
    intervals: [],
): boolean {
    for (let interval of intervals as any) {
        if (
            addr >= interval.cells[0].address &&
            addr <= interval.cells[interval.cells.length - 1].address
        ) {
            return true;
        }
    }
    return false;
};
