import { renderApp } from "./app.js";

export let memoryMapActive = false;

export async function toggleMemoryMap() {
    memoryMapActive = !memoryMapActive;
    await renderApp();
}

(window as any).intervalOnClick = function intervalOnClick(
    target: HTMLDivElement,
) {
    const intervalId = target.dataset["intervalid"] ?? "";
    highlightInterval(intervalId);
};

export function highlightInterval(
    id: string,
    opts: ScrollIntoViewOptions = {
        behavior: "smooth",
        block: "center",
    },
    do_blink: boolean = false,
) {
    const elem = Array.from(
        document.getElementsByName("memoryIntervalTable"),
    ).find((e) => e.dataset["intervalid"] === id);
    elem?.parentElement?.scrollIntoView(opts);

    if (do_blink) {
        elem?.classList.add("highlighted");
        setTimeout(() => elem?.classList.remove("highlighted"), 1500);
    }
}
