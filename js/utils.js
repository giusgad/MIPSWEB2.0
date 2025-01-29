export function getFromStorage(storage, key) {
    let item = undefined;
    if (storage === 'local') {
        item = localStorage.getItem(key);
    }
    if (storage === 'session') {
        item = sessionStorage.getItem(key);
    }
    return item ? JSON.parse(item) : undefined;
}
export function setIntoStorage(storage, key, item) {
    if (storage === 'local') {
        localStorage.setItem(key, JSON.stringify(item));
    }
    if (storage === 'session') {
        sessionStorage.setItem(key, JSON.stringify(item));
    }
}
export function addClass(className, id) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.add(className);
    }
    else {
        console.error(`Element with id "${id}" not found.`);
    }
}
export function removeClass(className, id) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.remove(className);
    }
    else {
        console.error(`Element with id "${id}" not found.`);
    }
}
export function scrollSelectedIntoView(scrollableElementId) {
    const scrollable = document.getElementById(scrollableElementId);
    if (scrollable) {
        const selected = scrollable.getElementsByClassName('selected')[0];
        if (selected) {
            selected.scrollIntoView({
                behavior: 'auto',
                block: 'nearest',
            });
        }
    }
}
export function scrollToEnd(scrollableElementId, direction) {
    const scrollable = document.getElementById(scrollableElementId);
    if (scrollable) {
        if (direction === 'x') {
            scrollable.scrollLeft = scrollable.scrollWidth;
        }
        else if (direction === 'y') {
            scrollable.scrollTop = scrollable.scrollHeight;
        }
    }
}
