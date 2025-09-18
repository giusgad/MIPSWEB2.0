import {
    getIntervalExtremes,
    getMemoryIntervals,
    maxAddress,
    minAddress,
} from "./intervals.js";
import { Colors } from "./lib/Colors.js";
import { highlightElementAnimation } from "./style.js";
import { memoryShown } from "./virtual-machine.js";

type CanvasInterval = { intervalId: number; startY: number; endY: number };
let canvasIntervals: CanvasInterval[] = [];

function memoryMapOnClick(ev: MouseEvent) {
    const interval = findClosetInterval(ev.offsetY);
    if (!interval) return;
    highlightInterval(`${interval.intervalId}`, undefined, true);
}

/** draw lines connecting the map's interval to the corresponding memory if displayed*/
function memoryMapOnHover(hoverEnter: boolean) {
    const canvas = document.getElementById(
        "memorymap-canvas",
    ) as HTMLCanvasElement;
    // scale up canvas resolution
    const resScaling = 3;
    if (!canvas) return;
    canvas.height = canvas.clientHeight * resScaling;
    canvas.width = canvas.clientWidth * resScaling;
    const ctx = canvas.getContext("2d")!;

    if (hoverEnter) {
        // each interval is drawn with different colors for easier distinction
        const colors = ["mint", "orange", "yellow", "teal", "purple"];
        let color_index = 0;

        for (const interval of canvasIntervals) {
            // find the memory table that corresponds to the current interval and its corner coordinates
            const target = Array.from(
                document.getElementsByName("memoryIntervalTable"),
            ).find((e) => e.dataset["intervalid"] === `${interval.intervalId}`);
            if (!target || !isElemVerticallyInView(target)) continue;

            const canvasRect = canvas.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            // get Y coordinates relative to canvas
            const topCornerY = targetRect.top - canvasRect.top;
            const bottomCornerY = targetRect.bottom - canvasRect.top;
            const color = Colors.get(colors[color_index++ % colors.length])!;
            drawBezier(ctx, interval.startY, topCornerY, resScaling, color);
            drawBezier(ctx, interval.endY, bottomCornerY, resScaling, color);
        }
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}
/**Draws a cubic bezier curve between point (0,y1) and (canvas_width, y2) on the given canvas context*/
function drawBezier(
    ctx: CanvasRenderingContext2D,
    y1: number,
    y2: number,
    resScaling: number,
    color: string,
) {
    y1 = y1 * resScaling;
    y2 = y2 * resScaling;
    const x1 = 0;
    const x2 = ctx.canvas.width;
    const offset = ctx.canvas.width / 2;

    const cp1x = x1 + offset;
    const cp1y = y1;

    const cp2x = x2 - offset;
    const cp2y = y2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = resScaling;
    ctx.stroke();
}

function isElemVerticallyInView(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect();

    const windowHeight =
        window.innerHeight || document.documentElement.clientHeight;

    const toolbarH = 40;
    const verticallyInView =
        rect.top < windowHeight && rect.bottom > toolbarH * 2;

    return verticallyInView;
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

let mouseOnMemoryMap = false;

export function drawMemoryMap() {
    if (!memoryShown) return;
    let canvasElem = document.getElementById("memorymap");
    if (!canvasElem) return;
    canvasElem.addEventListener("click", memoryMapOnClick);
    const canvas = canvasElem as HTMLCanvasElement;

    // add event listeners to draw the connecting arrows
    let hoverTimeout: number | null = null;
    const hoverDelay = 500; // milliseconds
    canvas.addEventListener("mouseenter", () => {
        mouseOnMemoryMap = true;
        // Start a delay before triggering hover effect
        hoverTimeout = window.setTimeout(() => {
            memoryMapOnHover(true);
            hoverTimeout = null; // Clear timeout reference
        }, hoverDelay);
    });
    canvas.addEventListener("mouseleave", () => {
        mouseOnMemoryMap = false;
        // If we're still waiting on the mouseenter delay, cancel it
        if (hoverTimeout !== null) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        memoryMapOnHover(false);
    });

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
    /**id of the interval to highlight, not an html element's id*/
    id: string,
    opts: ScrollIntoViewOptions = {
        behavior: "smooth",
        block: "nearest",
    },
    do_blink: boolean = false,
) {
    const elem = Array.from(
        document.getElementsByName("memoryIntervalTable"),
    ).find((e) => e.dataset["intervalid"] === id);
    elem?.parentElement?.scrollIntoView(opts);
    if (mouseOnMemoryMap) memoryMapOnHover(false);

    if (do_blink && elem) {
        highlightElementAnimation(elem);
    }

    // redraw memorymap after scrolling
    setTimeout(() => {
        if (mouseOnMemoryMap) memoryMapOnHover(true);
    }, 1000);
}
