var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Icons } from "./icons.js";
import { getContext } from "./app.js";
import { Utils } from "./virtual-machine/Utils.js";
import { vm } from "./app.js";
window.ejs = ejs;
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    if (typeof ejs === 'undefined' || typeof ace === 'undefined') {
        console.error('Required libraries (EJS or ACE) failed to load');
        return;
    }
}));
export function render(id_1, templatePath_1) {
    return __awaiter(this, arguments, void 0, function* (id, templatePath, ctx = getContext()) {
        try {
            const element = document.getElementById(id);
            if (!element)
                throw new Error(`No element found by Id: ${id}`);
            element.innerHTML = yield renderTemplate(templatePath, ctx);
        }
        catch (error) {
            console.error(error);
        }
    });
}
window.renderTemplate = renderTemplate;
function renderTemplate(templatePath_1) {
    return __awaiter(this, arguments, void 0, function* (templatePath, ctx = getContext()) {
        const template = yield fetch(`src/templates/${templatePath}`).then(res => {
            if (!res.ok) {
                throw new Error(`No template found: "src/templates/${templatePath}"`);
            }
            return res.text();
        });
        const data = Object.assign(Object.assign({}, ctx), { Icons });
        return ejs.render(template, data, { async: true });
    });
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
export function getFromLocalStorage(key) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : undefined;
}
export function setIntoLocalStorage(key, item) {
    localStorage.setItem(key, JSON.stringify(item));
}
window.convert = convert;
function convert(format, value) {
    if (format === "hex") {
        return Utils.convertToHex(value);
    }
    if (format === "basic") {
        return Utils.convertToBasic(value, vm.cpu);
    }
    return value;
}
