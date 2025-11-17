import { getFromStorage, setIntoStorage } from "./utils.js";
import { Colors } from "./lib/Colors.js";
import { updateEditorsTheme } from "./editors.js";
import { renderApp } from "./app.js";
import { hideForm, showToast } from "./forms.js";
import { render } from "./rendering.js";
import { importPublicZip } from "./files.js";
import { confirmClearProject } from "./buttons.js";
import { vm } from "./virtual-machine.js";
import { Memory } from "./virtual-machine/Memory.js";

/**How many iterations are to be considered an infinite loop*/
export const INFINITE_LOOP_TRESHOLD = 10_000;

window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
        Colors.generateCSSVariables();
        updateEditorsTheme();
    });
// load settings and/or project zip from query string if set
window.addEventListener("load", async () => {
    const params = new URLSearchParams(window.location.search);
    const queryFlags = params.get("opts");
    if (queryFlags != null) {
        const newOpts = optsFromFlags(queryFlags);
        if (!newOpts) return;
        updateOpts(newOpts);

        // remove opts from the URL
        params.delete("opts");
        const newUrl =
            window.location.pathname +
            (params.toString() ? "?" + params.toString() : "");
        history.replaceState(null, "", newUrl);
        showToast("Options updated from URL", 4000);
    }
    const projectPath = params.get("project");
    if (projectPath) {
        const confirmed = confirmClearProject();
        if (confirmed) {
            await importPublicZip(projectPath);
            // remove the project string from the URL
            params.delete("project");
            const newUrl =
                window.location.pathname +
                (params.toString() ? "?" + params.toString() : "");
            history.replaceState(null, "", newUrl);
        }
    }
});

type Setting = {
    /*The key which with they will be saved in localstorage**/
    name: string;
    /**Brief description of the option that is shown to the user*/
    desc: string;
    /**Additional info about this option, if present will be showed to the user*/
    help?: string;
    /**Invariant: all flags must start with a capital letter.
     * Note: in case inputType is "checkbox" the flag becomes `${flag}${optionValue}` */
    flag: string;
    defaultValue: any;
    inputType: SettingsInput;
    /**Needs to be used only if inputType is "dropdown"*/
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
    return getFromStorage("local", "settings").options ?? default_options;
}

/**Retrives the current value of a setting and returns the corrseponding flag encoding*/
function settingToFlag(opt: Setting, currVal: any): string {
    let s = "";
    switch (opt.inputType) {
        // flag is only shown if the value is true
        case "checkbox":
            if (currVal) s = opt.flag;
            break;
        case "dropdown":
            s = `${opt.flag}${currVal}`;
            break;
    }
    return s;
}

export function getFlagsFromOpts(opts: OptionsObject): string {
    let flags = "";
    for (const opt of possibleOptions.flatMap(
        (sect: SettingsSection) => sect.settings,
    )) {
        flags += settingToFlag(opt, opts[opt.name as OptionName]);
    }
    return flags;
}

export function optsFromFlags(queryFlags: string): OptionsObject | null {
    const opts: OptionsObject = {};
    if (queryFlags === "") return opts;
    // split by whitespace
    const flags = queryFlags.split(/(?=[A-Z])/);
    for (const opt of possibleOptions.flatMap(
        (sect: SettingsSection) => sect.settings,
    )) {
        for (let i = 0; i < flags.length; i++) {
            const flag = flags[i];
            if (flag.startsWith(opt.flag)) {
                switch (opt.inputType) {
                    case "checkbox":
                        if (flag !== opt.flag) return null;
                        opts[opt.name as OptionName] = true;
                        break;
                    case "dropdown":
                        const value = flag.slice(opt.flag.length);
                        if (opt.dropdownOptions!.find((v) => v.value === value))
                            opts[opt.name as OptionName] = value;
                        else return null;
                        break;
                }
                flags.splice(i, 1);
                break;
            }
        }
    }
    if (flags.length > 0) {
        return null;
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
    // need to call this since endianness is set on memory construction
    vm.cpu.memory = new Memory();
}

export const possibleOptions = [
    {
        name: "Assembler",
        settings: [
            {
                name: "pseudo-enabled",
                desc: "Enable pseudo-instructions",
                help: "If this is not checked, pseudo-instructions won't be allowed and will generate an assembler error",
                flag: "P",
                defaultValue: true,
                inputType: "checkbox",
            },
            {
                name: "allow-literals",
                desc: "Allow literals and syntactic sugar",
                help: "Enables different forms of syntactic sugar. Automatically transforms some R instructions in their immediate correspondent or loads the immediate into $at automatically allowing shorter syntax. Allows direct use of labels in load/store instructions.",
                flag: "L",
                defaultValue: true,
                inputType: "checkbox",
            },
            {
                name: "assembly-mode",
                desc: "Which files to assemble",
                flag: "F",
                defaultValue: "all",
                inputType: "dropdown",
                dropdownOptions: [
                    { value: "all", desc: "All project files" },
                    { value: "current", desc: "Currently open file" },
                ],
            },
            {
                name: "endianness",
                desc: "Endianness",
                flag: "E",
                defaultValue: "big",
                inputType: "dropdown",
                dropdownOptions: [
                    { value: "big", desc: "Big endian" },
                    { value: "little", desc: "Little endian" },
                ],
            },
        ],
    },
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
                name: "detect-infinite-loops",
                desc: "Pause long executions",
                flag: "L",
                help: `If active execution will pause after encountering the same Program Counter ${INFINITE_LOOP_TRESHOLD} times. Disable if your program runs very long loops, otherwise leave enabled as the browser tries to kill the website if it runs for too long`,
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
                    { value: "text", desc: "Text segment start" },
                    { value: "currFile", desc: "Current file" },
                ],
            },
        ],
    },
] as const satisfies readonly SettingsSection[];

// EXTRACTED for ease of use later
const optionNames: OptionName[] = possibleOptions.flatMap((section) =>
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
    if (element.id.startsWith("register")) {
        if (element.id === "registers-name-format") {
            // need to update the assembly format in the deassembled memory
            // since it's cached, the cache needs to be cleared (minor performance loss on play if it was mid execution)
            vm.cpu.decodingCache.clear();
            await render("memory", "/app/memory.ejs", undefined, false);
        }
        await render("registers", "/app/registers.ejs", undefined, false);
    }
}

export async function updateMemoryAddrFormat(value: string) {
    let settings = getFromStorage("local", "settings");
    if (!settings) {
        settings = default_settings;
    } else if (!settings.colsFormats) {
        settings.colsFormats = default_settings.colsFormats;
    }
    settings.colsFormats["memory-address-format"] = value;
    setIntoStorage("local", "settings", settings);
    await render("memory", "/app/memory.ejs", undefined, false);
}

export function getOptionsFromForm(formData: FormData): OptionsObject {
    const opts: { [K in OptionName]?: any } = {};
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
        opts[name] = val;
    }
    return opts;
}

(window as any).saveSettings = async function (event: SubmitEvent) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const newOpts = getOptionsFromForm(formData);
    updateOpts(newOpts);
    await hideForm();
    await renderApp();
};
(window as any).backupOptions = function () {
    const opts = getFromStorage("local", "settings").options;
    setIntoStorage("session", "opts-backup", opts);
};
(window as any).restoreOptions = function () {
    const settings = getFromStorage("local", "settings");
    settings.options =
        getFromStorage("session", "opts-backup") ?? default_options;
    setIntoStorage("local", "settings", settings);
};
