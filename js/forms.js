var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { render } from "./rendering.js";
import { hideFilePopover } from "./popovers.js";
export function showForm(form, data) {
    return __awaiter(this, void 0, void 0, function* () {
        hideFilePopover();
        const formsBg = document.getElementById('forms-bg');
        if (formsBg) {
            formsBg.style.display = 'flex';
        }
        yield render('forms-bg', `app/forms/${form}.ejs`, data);
        const firstTextInput = document.querySelector('input[type="text"]');
        if (firstTextInput) {
            firstTextInput.focus();
            if (firstTextInput.value.length > 0) {
                firstTextInput.select();
            }
            else {
                firstTextInput.setSelectionRange(firstTextInput.value.length, firstTextInput.value.length);
            }
        }
    });
}
export function hideForm() {
    return __awaiter(this, void 0, void 0, function* () {
        const formsBg = document.getElementById('forms-bg');
        if (formsBg) {
            formsBg.style.display = 'none';
            formsBg.innerHTML = '';
        }
    });
}
