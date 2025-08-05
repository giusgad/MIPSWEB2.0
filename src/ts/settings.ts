import { getFromStorage, setIntoStorage } from "./utils.js";
import { Colors } from "./lib/Colors.js";
import { updateEditorsTheme } from "./editors.js";
import { renderApp } from "./app.js";

window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
        Colors.generateCSSVariables();
        updateEditorsTheme();
    });

export const default_settings = {
    theme: "auto",
    colsFormats: {
        "registers-name-format": "name",
        "registers-value-format": "int",
        "memory-address-format": "hexadecimal",
        "memory-value-format": "int",
        "memory-value-granularity": "word",
    },
};

export function clearMemorySelectedFormats() {
    const settings = getFromStorage("local", "settings");
    if (settings) {
        for (const key in settings.colsFormats) {
            if (
                key.startsWith("memory-address-format_") ||
                key.startsWith("memory-value-format_") ||
                key.startsWith("memory-value-granularity_")
            ) {
                delete settings.colsFormats[key];
            }
        }
        setIntoStorage("local", "settings", settings);
    }
}

export async function colFormatSelect(
    element: HTMLButtonElement,
    value: string,
) {
    let settings = getFromStorage("local", "settings");
    if (!settings) {
        settings = default_settings;
    } else if (!settings.colsFormats) {
        settings.colsFormats = default_settings.colsFormats;
    }
    settings.colsFormats[element.id] = value;
    // memory and asm can only be visualized with word granularity, ascii can only be visualized by bytes
    if (element.id.startsWith("memory-value-format")) {
        const granularity_id = `memory-value-granularity_${element.dataset["id"]}`;
        if (value === "ascii") {
            settings.colsFormats[granularity_id] = "byte";
        } else if (value === "asm" || value === "binary") {
            settings.colsFormats[granularity_id] = "word";
        }
    }
    setIntoStorage("local", "settings", settings);
    await renderApp();
}
