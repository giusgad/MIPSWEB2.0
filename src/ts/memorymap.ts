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
    highlighInterval(intervalId);
};

export function highlighInterval(
    id: string,
    opts: ScrollIntoViewOptions = {
        behavior: "smooth",
        block: "center",
    },
) {
    const elem = Array.from(
        document.getElementsByName("memoryIntervalTable"),
    ).find((e) => e.dataset["intervalid"] === id);
    elem?.parentElement?.scrollIntoView(opts);
    elem?.classList.add("highlighted");
    setTimeout(() => elem?.classList.remove("highlighted"), 1500);
}
