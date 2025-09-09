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

type CanvasInterval = { intervalId: number; startY: number; endY: number };
let canvasIntervals: CanvasInterval[] = [];

function memoryMapOnClick(ev: MouseEvent) {
    const interval = findClosetInterval(ev.offsetY);
    if (!interval) return;
    highlightInterval(`${interval.intervalId}`, undefined, true);
}

function findClosetInterval(y: number): CanvasInterval | null {
    let closest: CanvasInterval | null = null;
    let minDistance = Infinity;
    // how many pixels away an interval click is considered valid
    const limit = 15;

    for (const interval of canvasIntervals) {
        const { startY, endY } = interval;

        let distance = 0;
        if (y < startY) {
            distance = startY - y;
        } else if (y > endY) {
            distance = y - endY;
        } else {
            // y is inside the interval
            distance = 0;
        }

        if (distance <= limit && distance < minDistance) {
            closest = interval;
            minDistance = distance;
        }
    }

    return closest;
}

export function drawMemoryMap() {
    if (!memoryShown) return;
    let canvasElem = document.getElementById("memorymap");
    canvasElem?.addEventListener("click", memoryMapOnClick);
    if (!canvasElem) return;
    const canvas = canvasElem as HTMLCanvasElement;
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mem = getMemoryIntervals();
    const memLength = maxAddress - minAddress;
    const pixelsPerByte = (canvas.height - 1) / memLength;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvasIntervals = [];

    for (const interval of mem) {
        const extremes = getIntervalExtremes(interval);
        if (!extremes) continue;
        const { start, end } = extremes;
        const yStart = Math.floor(start * pixelsPerByte);
        const height = Math.max(Math.ceil((end - start) * pixelsPerByte), 1);
        ctx.fillStyle = Colors.get("green") ?? "#ff0000";
        ctx.fillRect(0, yStart, canvas.width, height);
        canvasIntervals.push({
            intervalId: interval.id,
            startY: yStart,
            endY: yStart + height,
        });
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
