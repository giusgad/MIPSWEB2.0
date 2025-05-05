import { renderApp } from "./app.js";

export let memoryMapActive = false;

export async function toggleMemoryMap() {
    memoryMapActive = !memoryMapActive;
    await renderApp();
}

(window as any).intervalOnClick = function intervalOnClick(ev: MouseEvent) {
    const target = ev.currentTarget as HTMLDivElement;
    const intervalIndex = target.dataset["intervalindex"] ?? "";
    highlighInterval(intervalIndex);
};

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
