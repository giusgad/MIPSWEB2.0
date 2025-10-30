/**Gets an integer from a string, throws if the string is not strictly a numeric value*/
export function intFromStr(str: string): number {
    const num = Number(str);
    if (str === "" || isNaN(num)) {
        throw new Error(`Invalid number: "${str}" is not a number.`);
    }
    return num;
}

/** Parses string as a literal usable in instructions, either a number or a character in single quotes
 * @throws if the literal is invalid.*/
export function parseInlineLiteral(str: string): number {
    let negative = false;
    if (str.startsWith("-")) {
        negative = true;
        str = str.slice(1);
    } else if (str.startsWith("+")) {
        str = str.slice(1);
    }
    let num = Number(str);
    if (str === "" || isNaN(num)) {
        let char = getCharCode(str);
        if (char) return char;
        throw new Error(`Invalid literal: "${str}" is not a literal.`);
    }
    if (negative) num = -1 * num;
    return num;
}

function getCharCode(str: string): number | null {
    // single-quoted character literal
    const match = str.match(/^'(?:\\[nrtbfv0'"\\]|[^'\\])'$/);
    if (!match) return null;

    const inner = str.slice(1, -1);
    const escapeMap = {
        n: "\n",
        r: "\r",
        t: "\t",
        b: "\b",
        f: "\f",
        v: "\v",
        "0": "\0",
        "'": "'",
        '"': '"',
        "\\": "\\",
    };

    let char: string;
    if (inner.startsWith("\\")) {
        char = escapeMap[inner[1] as keyof typeof escapeMap];
    } else {
        char = inner;
    }

    return char ? char.charCodeAt(0) : null;
}

export function getFromStorage(storage: "local" | "session", key: string): any {
    let item = undefined;
    if (storage === "local") {
        item = localStorage.getItem(key);
    }
    if (storage === "session") {
        item = sessionStorage.getItem(key);
    }
    return item ? JSON.parse(item) : undefined;
}

export function setIntoStorage(
    storage: "local" | "session",
    key: string,
    item: any,
) {
    if (storage === "local") {
        localStorage.setItem(key, JSON.stringify(item));
    }
    if (storage === "session") {
        sessionStorage.setItem(key, JSON.stringify(item));
    }
}

export function addClass(className: string, id: string) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.add(className);
    } else {
        console.warn(
            `Element with id "${id}" not found. Can't add class ${className}`,
        );
    }
}

export function removeClass(className: string, id: string) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.remove(className);
    } else {
        console.warn(
            `Element with id "${id}" not found. Can't remove class ${className}`,
        );
    }
}

export function scrollSelectedIntoView(scrollableElementId: string) {
    const scrollable = document.getElementById(
        scrollableElementId,
    ) as HTMLElement;
    if (scrollable) {
        const selected = scrollable.getElementsByClassName("selected")[0];
        if (selected) {
            selected.scrollIntoView({
                behavior: "auto",
                block: "nearest",
            });
        }
    }
}

export function scrollSelectedInstructionIntoView() {
    const elem = document
        .getElementsByClassName("selected-instruction")
        .item(0);
    if (!elem) return;
    elem.scrollIntoView({ behavior: "instant", block: "center" });
}

export function scrollToEnd(scrollableElementId: string, direction: "x" | "y") {
    const scrollable = document.getElementById(
        scrollableElementId,
    ) as HTMLElement;
    if (scrollable) {
        if (direction === "x") {
            scrollable.scrollLeft = scrollable.scrollWidth;
        } else if (direction === "y") {
            scrollable.scrollTop = scrollable.scrollHeight;
        }
    }
}

/**Only run the argument function after this function isn't called for `delay` milliseconds.*/
export function debounce(fn: Function, delay: number) {
    let timeoutId: number;
    return function (...args: any[]) {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => fn.apply(args), delay);
    };
}
