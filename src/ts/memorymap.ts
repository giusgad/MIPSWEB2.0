import {
    getIntervalExtremes,
    getMemoryIntervals,
    maxAddress,
    minAddress,
} from "./intervals.js";
import { Colors } from "./lib/Colors.js";
import { memoryShown } from "./virtual-machine.js";

(window as any).intervalOnClick = function intervalOnClick(
    target: HTMLDivElement,
) {
    const intervalId = target.dataset["intervalid"] ?? "";
    highlightInterval(intervalId);
};

export function drawMemoryMap() {
    if (!memoryShown) return;
    let canvasElem = document.getElementById("memorymap");
    if (!canvasElem) return;
    const canvas = canvasElem as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mem = getMemoryIntervals();
    const memLength = maxAddress - minAddress;
    const pixelsPerByte = canvas.height / memLength;

    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const interval of mem) {
        const extremes = getIntervalExtremes(interval);
        if (!extremes) continue;
        const { start, end } = extremes;
        const yStart = Math.floor(start * pixelsPerByte);
        ctx.fillStyle = Colors.get("green") ?? "#ff0000";
        ctx.fillRect(
            0,
            yStart,
            canvas.width,
            Math.ceil((end - start) * pixelsPerByte),
        );
    }
}

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
