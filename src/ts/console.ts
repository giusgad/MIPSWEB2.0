import {vm} from "./virtual-machine.js";


document.addEventListener('input', (event) => {
    const target = event.target as HTMLTextAreaElement;
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
        consoleInput.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const target = event.target as HTMLTextAreaElement;
                await vm.console.setInput(target.value);
            }
        });
    }
}

export function scrollConsoleToBottom() {
    const consoleElement = document.querySelector('.console');
    if (consoleElement) {
        consoleElement.scrollTop = consoleElement.scrollHeight;
    }
}