import { editorState, interfaceState, renderApp } from "./app.js";
import { changeFontSize } from "./style.js";
import { vm } from "./virtual-machine.js";

type Shortcut = {
    key: string;
    action: () => void;
    conditions?: () => boolean;
    mods?: "ctrl/cmd" | "shift";
};

const isStepPossible = function (): boolean {
    return (
        vm.nextInstructionEditorPosition !== undefined &&
        editorState === "execute" &&
        interfaceState === "execute" &&
        (!vm.cpu.isHalted() || vm.console.state === "waitingInput")
    );
};

const keyboardShortcuts: Shortcut[] = [
    {
        mods: "ctrl/cmd",
        key: "b",
        action: (window as any).assembleOnClick,
    },
    {
        key: "F5",
        conditions: () => isStepPossible(),
        action: () => (window as any).stepOnClick(),
    },
    {
        key: "F11",
        conditions: () => isStepPossible(),
        action: () => (window as any).stepOnClick(),
    },
    {
        key: "F10",
        conditions: () => isStepPossible(),
        action: () => (window as any).stepOverOnClick(),
    },
    {
        mods: "shift",
        key: "F11",
        conditions: () => isStepPossible(),
        action: () => (window as any).stepOutOnClick(),
    },
    {
        key: " ", // space
        conditions: () => interfaceState === "execute",
        action: () => (window as any).runOnClick(),
    },
    {
        mods: "ctrl/cmd",
        key: "r",
        conditions: () => interfaceState === "execute",
        action: () => (window as any).runOnClick(),
    },
    {
        mods: "ctrl/cmd",
        key: "+",
        action: async () => {
            changeFontSize(1);
            await renderApp(undefined, undefined, false);
        },
    },
    {
        mods: "ctrl/cmd",
        key: "-",
        action: async () => {
            changeFontSize(-1);
            await renderApp(undefined, undefined, false);
        },
    },
];

function checkMods(shortcut: Shortcut, ev: KeyboardEvent): boolean {
    if (!shortcut.mods) {
        return !(ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey);
    }
    switch (shortcut.mods) {
        case "ctrl/cmd":
            // on macos cmd registers as metaKey
            return (ev.ctrlKey || ev.metaKey) && !(ev.shiftKey || ev.altKey);
        case "shift":
            return ev.shiftKey && !(ev.ctrlKey || ev.metaKey || ev.altKey);
    }
}

document.addEventListener("keydown", (ev) => {
    const shortcut = keyboardShortcuts.find(
        (shortcut) => shortcut.key === ev.key && checkMods(shortcut, ev),
    );
    if (shortcut) {
        if (shortcut.conditions && !shortcut.conditions()) return;
        ev.preventDefault();
        shortcut.action();
    }
});
