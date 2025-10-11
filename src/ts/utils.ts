/**Gets an integer from a string, throws if the string is not strictly a numeric value*/
export function intFromStr(str: string): number {
    const num = Number(str);
    if (str === "" || isNaN(num)) {
        throw new Error(`Invalid number: "${str}" is not a number.`);
    }
    return num;
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
    elem.scrollIntoView({ behavior: "instant", block: "nearest" });
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
