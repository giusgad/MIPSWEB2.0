import {
    getIntervalExtremes,
    getMemoryIntervals,
    maxAddress,
    minAddress,
} from "./intervals.js";
import { Colors } from "./lib/Colors.js";
import { highlightElementAnimation } from "./style.js";
import { memoryShown } from "./virtual-machine.js";
import { Binary } from "./virtual-machine/Utils.js";

type CanvasInterval = { intervalId: number; startY: number; endY: number };
let canvasIntervals: CanvasInterval[] = [];

function memoryMapOnClick(ev: MouseEvent) {
    if (!memoryShown) return;
    const interval = findClosetInterval(ev.offsetY);
    if (!interval) return;
    // find all the adjacent intervals that were drawn on together
    // since a single pixel in the minimap may represent multiple separate memory intervals
    const memIntervalIds = canvasIntervals
        .filter((i) => i.startY === interval.startY && i.endY === interval.endY)
        .map((i) => i.intervalId);
    for (const id of memIntervalIds) {
        highlightInterval(`${id}`, undefined, true);
    }
}

export function watchMemoryScroll() {
    const elem = document.getElementById("memory-tables");
    if (!elem) return;
    elem.addEventListener("scroll", () => {
        if (!memoryShown) return;
        drawMemoryMapConnections();
    });
    if (memoryShown) drawMemoryMapConnections();
}

/** draw lines connecting the map's interval to the corresponding memory if displayed*/
export function drawMemoryMapConnections() {
    if (!memoryShown) return;
    const canvas = document.getElementById(
        "memorymap-canvas",
    ) as HTMLCanvasElement;
    // scale up canvas resolution
    const resScaling = 3;
    if (!canvas) return;
    canvas.height = canvas.clientHeight * resScaling;
    canvas.width = canvas.clientWidth * resScaling;
    const ctx = canvas.getContext("2d")!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // each interval is drawn with different colors for easier distinction
    const colors = ["mint", "orange", "teal", "yellow", "purple"];
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
        drawLine(ctx, interval.startY, topCornerY, resScaling, color);
        drawLine(ctx, interval.endY, bottomCornerY, resScaling, color);
    }
}

/**Draws a cubic bezier curve between point (canvas_width,y1) and (0, y2) on the given canvas context*/
function drawLine(
    ctx: CanvasRenderingContext2D,
    y1: number,
    y2: number,
    resScaling: number,
    color: string,
) {
    y1 = y1 * resScaling;
    y2 = y2 * resScaling;
    const x1 = ctx.canvas.width;
    const x2 = 0;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2); // Draw straight line instead of bezier curve
    ctx.strokeStyle = color;
    ctx.lineWidth = resScaling;
    ctx.setLineDash([16, 8]);
    ctx.stroke();
}

function isElemVerticallyInView(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect();

    const windowHeight =
        window.innerHeight || document.documentElement.clientHeight;

    const toolbarH = 40;
    const verticallyInView = rect.top < windowHeight && rect.bottom > toolbarH;

    return verticallyInView;
}

/**Finds the closest interval given a y inside the canvas. tollerancePx indicates how many pixels away from the actual interval
 * the given y can be to be considered a match.*/
function findClosetInterval(
    y: number,
    tollerancePx: number = 15,
): CanvasInterval | null {
    let closest: CanvasInterval | null = null;
    let minDistance = Infinity;

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

        if (distance <= tollerancePx && distance < minDistance) {
            closest = interval;
            minDistance = distance;
        }
    }

    return closest;
}

export function drawMemoryMap() {
    let canvasElem = document.getElementById("memorymap");
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
        let { start, end } = extremes;
        start = start - minAddress;
        end = end - minAddress;
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

    // event listeners
    canvasElem.addEventListener("click", memoryMapOnClick);
    canvasElem.addEventListener("mousemove", (ev) => {
        const interval = findClosetInterval(ev.offsetY, 10);
        let addr = interval
            ? interval.intervalId
            : Math.round(ev.offsetY / pixelsPerByte) + minAddress;
        const newTitle = `0x${new Binary(addr).getHex()}`;
        if (newTitle !== canvasElem.title) {
            canvasElem.title = newTitle;
        }
    });
    window.addEventListener("resize", () => {
        drawMemoryMap();
        drawMemoryMapConnections();
    });
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

    if (do_blink && elem) {
        highlightElementAnimation(elem);
    }
}
