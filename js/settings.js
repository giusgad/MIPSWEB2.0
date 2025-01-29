var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getFromStorage, setIntoStorage } from "./utils.js";
import { Colors } from "./lib/Colors.js";
import { updateEditorsTheme } from "./editors.js";
import { renderApp } from "./app.js";
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    Colors.generateCSSVariables();
    updateEditorsTheme();
});
export const default_settings = {
    theme: 'auto',
    colsFormats: {
        'registers-value-format': 'decimal',
        'memory-address-format': 'hexadecimal',
        'memory-value-format': 'decimal'
    }
};
export function clearMemorySelectedFormats() {
    const settings = getFromStorage("local", 'settings');
    if (settings) {
        for (const key in settings.colsFormats) {
            if (key.startsWith('memory-address-format_') || key.startsWith('memory-value-format_')) {
                delete settings.colsFormats[key];
            }
        }
        setIntoStorage("local", 'settings', settings);
    }
}
export function colFormatSelect(element) {
    return __awaiter(this, void 0, void 0, function* () {
        let settings = getFromStorage('local', 'settings');
        if (!settings) {
            settings = default_settings;
        }
        else if (!settings.colsFormats) {
            settings.colsFormats = default_settings.colsFormats;
        }
        settings.colsFormats[element.id] = element.value;
        setIntoStorage('local', 'settings', settings);
        yield renderApp();
    });
}
