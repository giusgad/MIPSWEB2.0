import { renderApp } from "./app.js";
import { render } from "./rendering.js";
import { consoleShown, setConsoleShown, vm } from "./virtual-machine.js";

document.addEventListener("input", (event) => {
    const target = event.target as HTMLTextAreaElement;
    if (target && target.id === "console-input") {
        target.style.height = "auto";
        target.style.height = target.scrollHeight + "px";
    }
});

document.addEventListener("click", () => {
    if (vm.console.state === "waitingInput") {
        const consoleInput = document.getElementById("console-input");
        if (consoleInput) {
            consoleInput.focus();
        }
    }
});

export function watchingConsole() {
    const consoleInput = document.getElementById("console-input");
    if (consoleInput) {
        consoleInput.focus();
        consoleInput.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                const target = event.target as HTMLTextAreaElement;
                await vm.console.setInput(target.value);
                await renderApp(undefined, undefined, false);
            }
            await render("vm-buttons", "/app/vm-buttons.ejs", undefined, false);
        });
    }
}

export function scrollConsoleToBottom() {
    const consoleElement = document.querySelector(".console");
    if (consoleElement) {
        consoleElement.scrollTop = consoleElement.scrollHeight;
    }
}

export function blinkConsole() {
    const blink = () => {
        const consoleElement = document.querySelector(".console");
        if (!consoleElement) return;
        const addBlink = () => {
            consoleElement.classList.add("blinking");
        };
        const removeBlink = () => {
            consoleElement.classList.remove("blinking");
        };
        addBlink();
        setTimeout(removeBlink, 200);
        setTimeout(addBlink, 400);
        setTimeout(removeBlink, 600);
        document.getElementById("console-input")?.focus();
    };
    if (!consoleShown) {
        setConsoleShown(true);
    } else {
        blink();
    }
}
