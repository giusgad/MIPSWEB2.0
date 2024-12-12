import {Icons} from "./icons.js";
import {getContext} from "./app.js";

declare const ejs: any;
(window as any).ejs = ejs;
declare const ace: any;

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof ejs === 'undefined' || typeof ace === 'undefined') {
        console.error('Required libraries (EJS or ACE) failed to load');
        return;
    }
});

export async function render(id: string, templatePath: string, ctx = getContext()) {
    try {
        const element = document.getElementById(id);
        if (!element) throw new Error(`No element found by Id: ${id}`);
        element.innerHTML = await renderTemplate(templatePath, ctx);
    } catch (error) {
        console.error(error);
    }
}

(window as any).renderTemplate = renderTemplate;
async function renderTemplate(templatePath: string, ctx: any = undefined) {
    document.body.classList.add('wait');
    if (!ctx) ctx = getContext();
    const template = await fetch(`src/templates/${templatePath}`).then(res => {
        if (!res.ok) {
            throw new Error(`No template found: "src/templates/${templatePath}"`);
        }
        return res.text();
    });
    const data = { ctx, Icons };
    const result = ejs.render(template, data, { async: true });
    document.body.classList.remove('wait');
    return result;
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

export function getFromLocalStorage(key: string): any {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : undefined;
}

export function setIntoLocalStorage(key: string, item: any) {
    localStorage.setItem(key, JSON.stringify(item));
}