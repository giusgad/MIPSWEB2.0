import { getFromStorage, setIntoStorage } from "./utils.js";
import { Colors } from "./lib/Colors.js";
import { updateEditorsTheme } from "./editors.js";
import { renderApp } from "./app.js";
import { hideForm } from "./forms.js";

window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
        Colors.generateCSSVariables();
        updateEditorsTheme();
    });

type setting = {
    name: string;
    desc: string;
    flag: string;
    defaultValue: any;
    inputType: settingsInput;
    /**Needs to be used if inputType is "dropdown"*/
    dropdownOptions?: dropdownOptions;
};
type dropdownOptions = { value: string; desc: string }[];
type settingsInput = "checkbox" | "text" | "dropdown";
type settingsSection = {
    name: string;
    settings: setting[];
};

export const possibleOptions: settingsSection[] = [
    {
        name: "Execution",
        settings: [
            {
                name: "reset-regs",
                desc: "Reset registers on restart",
                flag: "Rr",
                defaultValue: true,
                inputType: "checkbox",
            },
            {
                name: "reset-mem",
                desc: "Reset memory on restart",
                flag: "Rm",
                defaultValue: true,
                inputType: "checkbox",
            },
            {
                name: "entry-point",
                desc: "Where to initialize the program counter",
                flag: "s",
                defaultValue: "main",
                inputType: "dropdown",
                dropdownOptions: [
                    { value: "main", desc: "Global main" },
                    { value: "currFile", desc: "Current file .text" },
                ],
            },
        ],
    },
] as const;

// EXTRACTED for ease of use later
const optionNames = possibleOptions.flatMap((section) =>
    section.settings.map((setting) => setting.name),
);
const optionsByName = Object.fromEntries(
    possibleOptions.flatMap((section) =>
        section.settings.map((setting) => [setting.name, setting]),
    ),
);
const default_options = Object.fromEntries(
    possibleOptions.flatMap((section) =>
        section.settings.map((setting) => [setting.name, setting.defaultValue]),
    ),
);

/**All app settings*/
export const default_settings = {
    options: default_options,
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
    element: HTMLButtonElement | HTMLSelectElement,
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

(window as any).saveSettings = async function (event: SubmitEvent) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const settings = getFromStorage("local", "settings");
    for (const name of optionNames) {
        const rawVal = formData.get(name);
        let val;
        switch (optionsByName[name].inputType) {
            case "checkbox":
                val = rawVal === "on" ? true : false;
                break;
            case "dropdown":
                const opt = optionsByName[name].dropdownOptions?.find(
                    (o) => o.value === rawVal,
                );
                if (!opt) continue;
                val = rawVal;
                break;
            case "text":
            default:
                val = rawVal;
        }
        settings.options[name] = val;
    }
    setIntoStorage("local", "settings", settings);
    console.log(getFromStorage("local", "settings").options);
    await hideForm();
    await renderApp();
};
