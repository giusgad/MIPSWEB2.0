import {render} from "./rendering.js";
import {hideFilePopover} from "./popovers.js";

export async function showForm(form: string, data: any) {
    hideFilePopover();
    const formsBg = document.getElementById('forms-bg');
    if (formsBg) {
        formsBg.style.display = 'flex';
    }
    await render('forms-bg', `app/forms/${form}.ejs`, data);
    const firstTextInput = document.querySelector('input[type="text"]') as HTMLInputElement | null;
    if (firstTextInput) {
        firstTextInput.focus();
        if (firstTextInput.value.length > 0) {
            firstTextInput.select();
        } else {
            firstTextInput.setSelectionRange(firstTextInput.value.length, firstTextInput.value.length);
        }

    }
}

export async function hideForm() {
    const formsBg = document.getElementById('forms-bg');
    if (formsBg) {
        formsBg.style.display = 'none';
        formsBg.innerHTML = '';
    }
}