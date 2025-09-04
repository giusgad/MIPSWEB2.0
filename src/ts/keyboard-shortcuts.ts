import { editorState, interfaceState } from "./app.js";
import { vm } from "./virtual-machine.js";

type Shortcut = {
    key: string;
    action: () => void;
};

const isStepPossible = function (): boolean {
    return (
        vm.nextInstructionEditorPosition !== undefined &&
        editorState === "execute" &&
        interfaceState === "execute" &&
        !vm.cpu.isHalted()
    );
};

const keyboardShortcuts: Shortcut[] = [
    {
        key: "ctrl+A",
        action: (window as any).assembleOnClick,
    },
    {
        key: "s",
        action: () => {
            if (isStepPossible()) (window as any).stepOnClick();
        },
    },
    {
        key: "S",
        action: () => {
            if (interfaceState === "execute") (window as any).stopOnClick();
        },
    },
    {
        key: " ", // space
        action: () => {
            if (interfaceState === "execute") (window as any).runOnClick();
        },
    },
];

document.addEventListener("keydown", (ev) => {
    const pressedKeys = `${ev.ctrlKey ? "ctrl+" : ""}${ev.key}`;
    const shortcut = keyboardShortcuts.find(
        (shortcut) => shortcut.key === pressedKeys,
    );
    if (shortcut) {
        shortcut.action();
    }
});
