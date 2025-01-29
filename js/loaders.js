import { getFromStorage, setIntoStorage } from "./utils.js";
export function initLoaders() {
    setIntoStorage('local', 'loaders', []);
}
export function addLoader(id) {
    const loaders = getFromStorage('local', 'loaders') || [];
    if (!loaders.includes(id))
        loaders.push(id);
    setIntoStorage('local', 'loaders', loaders);
    if (!document.body.classList.contains('loading')) {
        document.body.classList.add('loading');
    }
}
export function removeLoader(id) {
    const loaders = getFromStorage('local', 'loaders') || [];
    const index = loaders.indexOf(id);
    if (index !== -1) {
        loaders.splice(index, 1);
        setIntoStorage('local', 'loaders', loaders);
    }
    if (loaders.length === 0) {
        document.body.classList.remove('loading');
    }
}
