import { getFromStorage, setIntoStorage } from "./utils.js";
import { Colors } from "./lib/Colors.js";
import { updateEditorsTheme } from "./editors.js";
import { renderApp } from "./app.js";
import { hideForm } from "./forms.js";
import { render } from "./rendering.js";

window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
        Colors.generateCSSVariables();
        updateEditorsTheme();
    });
// load setting from query string if set
window.addEventListener("load", () => {
    const params = new URLSearchParams(window.location.search);
    const queryFlags = params.get("opts");
    if (queryFlags != null) {
        const newOpts = optsFromFlags(queryFlags);
        updateOpts(newOpts);

        // remove opts from the url
        params.delete("opts");
        const newUrl =
            window.location.pathname +
            (params.toString() ? "?" + params.toString() : "");
        history.replaceState(null, "", newUrl);
    }
});

type Setting = {
    name: string;
    desc: string;
    /**Invariant: all flags must start with a capital letter.
     * Note: in case inputType is "checkbox" the flag becomes `${flag}${optionValue}` */
    flag: string;
    defaultValue: any;
    inputType: SettingsInput;
    /**Needs to be used if inputType is "dropdown"*/
    dropdownOptions?: DropdownOptions;
};
type DropdownOptions = { value: string; desc: string }[];
type SettingsInput = "checkbox" | "dropdown";
type SettingsSection = {
    name: string;
    settings: Setting[];
};

export type OptionName =
    (typeof possibleOptions)[number]["settings"][number]["name"];
export type OptionsObject = {
    [K in OptionName]?: any;
};

export function getOptions(): OptionsObject {
    return getFromStorage("local", "settings").options;
}

/**Retrives the current value of a setting and returns the corrseponding flag encoding*/
function settingToFlag(opt: Setting): string {
    const opts = getFromStorage("local", "settings").options;
    const currVal = opts[opt.name];
    let s = "";
    switch (opt.inputType) {
        // flag is only shown if the value is true
        case "checkbox":
            if (currVal) s = opt.flag;
        case "dropdown":
            s = `${opt.flag}${currVal}`;
    }
    return s;
}

function optsFromFlags(queryFlags: string): OptionsObject {
    const opts: OptionsObject = {};
    if (queryFlags === "") return opts;
    // split by whitespace
    const flags = queryFlags.split(/(?=[A-Z])/);
    for (const opt of possibleOptions.flatMap((sect) => sect.settings)) {
        for (const flag of flags) {
            if (flag.startsWith(opt.flag)) {
                switch (opt.inputType) {
                    case "checkbox":
                        opts[opt.name] = true;
                        break;
                    case "dropdown":
                        const value = flag.slice(opt.flag.length);
                        if (opt.dropdownOptions!.find((v) => v.value === value))
                            opts[opt.name] = value;
                        break;
                }
            }
        }
    }
    return opts;
}

/**Merges the currently saved options in localStorage, overwriting them with values from newOpts if present.
 * Note that boolean values are all set to false before merging with the new options, which mean that any option
 * that needs to be true, has to be specified in the opts.*/
export function updateOpts(newOpts: OptionsObject) {
    const settings = getFromStorage("local", "settings");
    // set all the boolean options to false, because only the one in newOpts are set to true
    const oldOpts = settings.options;
    for (const [key, val] of Object.entries(oldOpts)) {
        if (typeof val === "boolean") {
            oldOpts[key] = false;
        }
    }
    settings.options = { ...oldOpts, ...newOpts };
    setIntoStorage("local", "settings", settings);
}

export const possibleOptions = [
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
                flag: "S",
                defaultValue: "main",
                inputType: "dropdown",
                dropdownOptions: [
                    { value: "main", desc: "Global main" },
                    { value: "curr", desc: "Current file .text" },
                ],
            },
        ],
    },
] as const satisfies readonly SettingsSection[];

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
    if (element.id.startsWith("memory"))
        await render("memory", "/app/memory.ejs", undefined, false);
    if (element.id.startsWith("register"))
        await render("registers", "/app/registers.ejs", undefined, false);
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
            default:
                val = rawVal;
        }
        settings.options[name] = val;
    }
    setIntoStorage("local", "settings", settings);
    await hideForm();
    await renderApp();
};
