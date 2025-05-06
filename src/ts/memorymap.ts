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

function highlighInterval(id: string) {
    const elem = Array.from(
        document.getElementsByName("memoryIntervalTable"),
    ).find((e) => e.dataset["intervalid"] === id);
    elem?.parentElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
    });
    elem?.classList.add("highlighted");
    setTimeout(() => elem?.classList.remove("highlighted"), 1500);
}
