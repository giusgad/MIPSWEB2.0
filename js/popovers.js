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
import { getFile } from "./files.js";
export function showFilePopover(id, toggleButton) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const fileContainer = (_a = toggleButton.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement;
        if (fileContainer) {
            if (fileContainer.classList.contains('active')) {
                fileContainer.classList.remove('active');
                hideFilePopover();
                return;
            }
            else {
                fileContainer.classList.add('active');
            }
        }
        const filesContainers = document.getElementsByClassName('file-container');
        for (let i = 0; i < filesContainers.length; i++) {
            const container = filesContainers[i];
            if (container !== fileContainer && container.classList.contains('active')) {
                container.classList.remove('active');
            }
        }
        const rect = toggleButton.getBoundingClientRect();
        yield showPopover(rect);
        window.addEventListener('click', (event) => {
            const popover = document.getElementById(`popover`);
            const activeFileContainer = document.getElementsByClassName('file-container active')[0];
            const toggleButton = activeFileContainer === null || activeFileContainer === void 0 ? void 0 : activeFileContainer.getElementsByClassName('toggle-button')[0];
            if (popover && activeFileContainer && toggleButton) {
                if (!popover.contains(event.target) && !toggleButton.contains(event.target)) {
                    hideFilePopover();
                    document.removeEventListener('click', () => { });
                }
            }
        });
        (_b = document.getElementById('all-files')) === null || _b === void 0 ? void 0 : _b.addEventListener('scroll', (event) => {
            hideFilePopover();
        });
        yield render('popover', '/app/popovers/file-popover.ejs', { file: getFile(parseInt(id)) });
    });
}
export function showPopover(rect) {
    return __awaiter(this, void 0, void 0, function* () {
        const x = rect.left / window.innerWidth * 100;
        const y = rect.top / window.innerHeight * 100;
        const popover = document.getElementById(`popover`);
        if (popover) {
            popover.style.position = 'absolute';
            if (y <= 50) {
                popover.style.left = `${rect.left + rect.width}px`;
                popover.style.top = `${rect.top - 1}px`;
                popover.style.bottom = 'auto';
                popover.style.right = 'auto';
            }
            else {
                popover.style.left = `${rect.left + rect.width}px`;
                popover.style.bottom = `${window.innerHeight - rect.top - rect.height - 1}px`;
                popover.style.top = 'auto';
                popover.style.right = 'auto';
            }
        }
    });
}
export function hideFilePopover() {
    const popover = document.getElementById(`popover`);
    if (popover) {
        popover.innerHTML = '';
    }
    removeActiveClassesFromFilesContainers();
}
export function removeActiveClassesFromFilesContainers() {
    const filesContainers = document.getElementsByClassName('file-container');
    for (let i = 0; i < filesContainers.length; i++) {
        const container = filesContainers[i];
        if (container.classList.contains('active')) {
            container.classList.remove('active');
        }
    }
}
