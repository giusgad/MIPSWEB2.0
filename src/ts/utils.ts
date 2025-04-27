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
        console.error(`Element with id "${id}" not found.`);
    }
}

export function removeClass(className: string, id: string) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.remove(className);
    } else {
        console.error(`Element with id "${id}" not found.`);
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
