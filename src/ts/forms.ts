import { render } from "./rendering.js";
import { hideFilePopover } from "./popovers.js";

let escHandler: ((ev: KeyboardEvent) => void) | null = null;
let onCloseCallback: (() => void) | null = null;

export async function showForm(
    form: string,
    data: any,
    autofocus: boolean,
    onClose?: () => void,
    bindEsc: boolean = true,
) {
    hideFilePopover();
    const formsBg = document.getElementById("forms-bg");
    if (formsBg) {
        formsBg.style.display = "flex";
    }
    await render("forms-bg", `app/forms/${form}.ejs`, data);
    if (autofocus) {
        const firstTextInput = document.querySelector(
            'input[type="text"]',
        ) as HTMLInputElement | null;
        if (firstTextInput) {
            firstTextInput.focus();
            if (firstTextInput.value.length > 0) {
                firstTextInput.select();
            } else {
                firstTextInput.setSelectionRange(
                    firstTextInput.value.length,
                    firstTextInput.value.length,
                );
            }
        }
    }
    if (bindEsc) {
        escHandler = (ev) => {
            if (ev.key === "Escape") {
                hideForm();
            }
        };
        document.addEventListener("keyup", escHandler);
    }
    onCloseCallback = onClose ? onClose : null;
}

export async function hideForm() {
    const formsBg = document.getElementById("forms-bg");
    if (formsBg) {
        formsBg.style.display = "none";
        formsBg.innerHTML = "";
    }
    if (escHandler) {
        document.removeEventListener("keyup", escHandler);
        escHandler = null;
    }
    if (onCloseCallback) {
        onCloseCallback();
        onCloseCallback = null;
    }
}

let toastTimeout: NodeJS.Timeout | null = null;
/**Shows a toast notification for `duration` milliseconds*/
export function showToast(message: string, duration = 2000) {
    const toast = document.getElementById("toast")!;
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }
    toast.textContent = message;
    toast.style.opacity = "1";
    toastTimeout = setTimeout(() => {
        toast.style.opacity = "0";
        toastTimeout = null;
    }, duration);
}
