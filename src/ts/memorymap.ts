import { renderApp } from "./app.js";

export let memoryMapActive = false;

export async function toggleMemoryMap() {
    memoryMapActive = !memoryMapActive;
    await renderApp();
    if (memoryMapActive) {
        const cells = document.querySelectorAll<HTMLDivElement>(
            ".memorymap .interval",
        );
        cells.forEach((c) => {
            c.addEventListener("click", cellClick);
        });
    }
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

function cellClick(ev: MouseEvent) {
    const target = ev.currentTarget as HTMLDivElement;
    const intervalIndex = target.dataset["intervalindex"] ?? "";
    highlighInterval(intervalIndex);
}

function highlighInterval(index: string) {
    const elem = Array.from(
        document.getElementsByName("memoryIntervalTable"),
    ).find((e) => e.dataset["intervalindex"] === index);
    elem?.parentElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
    });
    elem?.classList.add("highlighted");
    setTimeout(() => elem?.classList.remove("highlighted"), 1500);
}
