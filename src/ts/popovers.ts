import { render } from "./rendering.js";
import { getFile } from "./files.js";

export async function showFileActionsPopover(
    id: string,
    toggleButton: HTMLElement,
) {
    const fileContainer = toggleButton.parentElement?.parentElement;
    if (fileContainer) {
        if (fileContainer.classList.contains("active")) {
            fileContainer.classList.remove("active");
            hideFilePopover();
            return;
        } else {
            fileContainer.classList.add("active");
        }
    }
    const filesContainers = document.getElementsByClassName("file-container");
    for (let i = 0; i < filesContainers.length; i++) {
        const container = filesContainers[i];
        if (
            container !== fileContainer &&
            container.classList.contains("active")
        ) {
            container.classList.remove("active");
        }
    }
    const rect = toggleButton.getBoundingClientRect();
    await showPopover(rect);
    window.addEventListener("click", (event) => {
        const popover = document.getElementById(`popover`);
        const activeFileContainer = document.getElementsByClassName(
            "file-container active",
        )[0];
        const toggleButton =
            activeFileContainer?.getElementsByClassName("toggle-button")[0];
        if (popover && activeFileContainer && toggleButton) {
            if (
                !popover.contains(event.target as Node) &&
                !toggleButton.contains(event.target as Node)
            ) {
                hideFilePopover();
                document.removeEventListener("click", () => {});
            }
        }
    });
    document
        .getElementById("all-files")
        ?.addEventListener("scroll", (event) => {
            hideFilePopover();
        });
    await render("popover", "/app/popovers/file-actions-popover.ejs", {
        file: getFile(parseInt(id)),
    });
}

export async function showPopover(
    rect: DOMRect,
    mode: "menu" | "side" = "side",
) {
    const x = (rect.left / window.innerWidth) * 100;
    const y = (rect.top / window.innerHeight) * 100;

    const popover = document.getElementById(`popover`);
    if (popover) {
        popover.style.position = "absolute";
        if (mode === "side") {
            if (y <= 50) {
                popover.style.left = `${rect.left + rect.width}px`;
                popover.style.top = `${rect.top - 1}px`;
                popover.style.bottom = "auto";
                popover.style.right = "auto";
            } else {
                popover.style.left = `${rect.left + rect.width}px`;
                popover.style.bottom = `${window.innerHeight - rect.top - rect.height - 1}px`;
                popover.style.top = "auto";
                popover.style.right = "auto";
            }
        } else {
            popover.style.top = `${rect.bottom}px`;
            popover.style.left = `${rect.left}px`;
        }
    }
    window.addEventListener("click", (ev) => {
        const popover = document.getElementById("popover");
        if (!popover) return;
        if (!popover.contains(ev.target as Node)) {
            popover.innerHTML = "";
        }
    });
}

export function hideFilePopover() {
    const popover = document.getElementById(`popover`);
    if (popover) {
        popover.innerHTML = "";
    }
    removeActiveClassesFromFilesContainers();
}

export function removeActiveClassesFromFilesContainers() {
    const filesContainers = document.getElementsByClassName("file-container");
    for (let i = 0; i < filesContainers.length; i++) {
        const container = filesContainers[i];
        if (container.classList.contains("active")) {
            container.classList.remove("active");
        }
    }
}
