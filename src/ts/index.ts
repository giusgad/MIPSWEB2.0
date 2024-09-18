import {Icons} from "./icons.js";
import {getContext} from "./app.js";
import {Instructions} from "./virtual-machine/Instructions.js";

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
async function renderTemplate(templatePath: string, ctx = getContext()) {
    const template = await fetch(`src/templates/${templatePath}`).then(res => {
        if (!res.ok) {
            throw new Error(`No template found: "src/templates/${templatePath}"`);
        }
        return res.text();
    });
    const data = { ...ctx, Icons };
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

(window as any).convert = convert;
function convert(format: string, value: number) {
    if (format === "hex") {
        return convertToHex(value);
    }
    if (format === "basic") {
        return convertToBasic(value);
    }
    return value;
}

function convertToHex(value: number) {
    return '0x' + value.toString(16).padStart(8, '0');
}

function convertToBasic(value: number) {
    return Instructions.get(value)?.basic;
}