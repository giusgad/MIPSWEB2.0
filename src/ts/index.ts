import {Icons} from "./icons.js";

declare const ejs: any;
(window as any).ejs = ejs;
declare const ace: any;

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof ejs === 'undefined' || typeof ace === 'undefined') {
        console.error('Required libraries (EJS or ACE) failed to load');
        return;
    }
});

export async function render(id: string, templatePath: string, data: any) {
    try {
        const element = document.getElementById(id);
        if (!element) throw new Error(`No element found by Id: ${id}`);
        element.innerHTML = await renderTemplate(templatePath, data);
    } catch (error) {
        console.error(error);
    }
}

(window as any).renderTemplate = renderTemplate;
async function renderTemplate(templatePath: string, data: any) {
    const template = await fetch(`templates/${templatePath}`).then(res => {
        if (!res.ok) {
            throw new Error(`No template found: "templates/${templatePath}"`);
        }
        return res.text();
    });
    data = { ...data, Icons };
    return ejs.render(template, data, { async: true });
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