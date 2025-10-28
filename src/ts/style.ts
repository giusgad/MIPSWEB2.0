import { VirtualMachine } from "./virtual-machine/VirtualMachine";

const fontSizeVarName = "--font-size-dyn";
export function changeFontSize(step: number) {
    document.documentElement.style.setProperty(
        fontSizeVarName,
        `${getCurrentFontSize() + step}px`,
    );
}
/**Returns the current font size in px (or defaults 14 if not found)*/
export function getCurrentFontSize(): number {
    const val = getComputedStyle(document.documentElement).getPropertyValue(
        fontSizeVarName,
    );
    let pixels;

    if (val.endsWith("px")) pixels = Number(val.slice(0, -2));
    else pixels = 14;

    return pixels;
}

export function updateTagsWidth(vm: VirtualMachine) {
    const memoryElem = document.getElementById("memory");
    if (!memoryElem) return;
    const longestLabel = Array.from(vm.assembler.allLabels.keys()).reduce(
        (max, label) => Math.max(max, label.length),
        0,
    );
    const minWidth = 15;
    const maxWidth = 25;
    const newWidth = Math.min(Math.max(longestLabel + 8, minWidth), maxWidth);
    memoryElem.style.setProperty("--tags-width", `${newWidth}ch`);
}

/**
 * Calculates the pixel width of 1ch for a given element.
 * @param {HTMLElement} element The element to use for font-family and font-size.
 * @returns The width of one character in pixels.
 */
function getChWidth(element: HTMLElement): number {
    // Create a temporary span element
    const tempSpan = document.createElement("span");
    // Apply the same font styles as the target element
    const computedStyle = window.getComputedStyle(element);
    tempSpan.style.fontFamily = computedStyle.fontFamily;
    tempSpan.style.fontSize = computedStyle.fontSize;
    // Set the content to a single '0' character, which defines the 'ch' unit
    tempSpan.textContent = "0";
    // Make the span off-screen so it doesn't affect the layout
    tempSpan.style.position = "absolute";
    tempSpan.style.visibility = "hidden";
    tempSpan.style.whiteSpace = "nowrap";
    // Append it to the document body to be measured
    document.body.appendChild(tempSpan);
    // Get the width of the '0' character
    const chWidth = tempSpan.offsetWidth;
    // Clean up the temporary element
    document.body.removeChild(tempSpan);
    return chWidth;
}

/**Adjusts all binaries' width and ScaleX css properties to fit in their cells*/
export function adjustBinaryWidth() {
    const gap = 3;
    const padding = 5;
    const elems = document.getElementsByClassName("binary");
    for (const elem of elems) {
        const parentDiv = elem as HTMLDivElement;
        parentDiv.style.setProperty("gap", `${gap}px`);
        parentDiv.style.setProperty("padding-left", `${padding}px`);
        parentDiv.style.setProperty("padding-right", `${padding}px`);
        const spans = parentDiv.getElementsByTagName("span");
        const spanWidth = (parentDiv.clientWidth - gap * 3 - padding * 2) / 4;
        const scale = spanWidth / (8 * getChWidth(spans[0]));
        for (const span of spans) {
            span.style.setProperty("width", `${spanWidth}px`);
            span.style.setProperty("transform", `ScaleX(${scale})`);
        }
    }
}

export function highlightElementAnimation(
    elem: HTMLElement | string,
    scroll = false,
) {
    if (typeof elem === "string") {
        const found = document.getElementById(elem);
        if (!found) return;
        elem = found;
    }
    if (scroll) {
        elem.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    elem.classList.add("highlighted");
    setTimeout(() => elem.classList.remove("highlighted"), 1500);
}
