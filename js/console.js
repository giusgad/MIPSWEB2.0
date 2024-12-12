var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { vm } from "./app.js";
document.addEventListener('input', (event) => {
    const target = event.target;
    if (target && target.id === 'console-input') {
        target.style.height = 'auto';
        target.style.height = target.scrollHeight + 'px';
    }
});
document.addEventListener('click', () => {
    if (vm.console.state === 'waitingInput') {
        const consoleInput = document.getElementById('console-input');
        if (consoleInput) {
            consoleInput.focus();
        }
    }
});
export function watchingConsole() {
    const consoleInput = document.getElementById('console-input');
    if (consoleInput) {
        consoleInput.focus();
        consoleInput.addEventListener('keydown', (event) => __awaiter(this, void 0, void 0, function* () {
            if (event.key === 'Enter') {
                event.preventDefault();
                const target = event.target;
                yield vm.console.setInput(target.value);
            }
        }));
    }
}
export function scrollConsoleToBottom() {
    const consoleElement = document.querySelector('.console');
    if (consoleElement) {
        consoleElement.scrollTop = consoleElement.scrollHeight;
    }
}
