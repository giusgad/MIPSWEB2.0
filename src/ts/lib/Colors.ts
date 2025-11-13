import { getFromStorage } from "../utils.js";

export class Colors {
    static items: { [key: string]: { light: string; dark: string } } = {
        "app-color": { light: "rgb(89, 119, 169)", dark: "rgb(137, 155, 185)" },
        "ace-section": { light: "rgb(162,132,94)", dark: "rgb(172,142,104)" },
        "ace-modifier": {
            light: "rgb(149, 60, 140)",
            dark: "rgb(199, 125, 187)",
        },
        "ace-string": { light: "rgb(57, 108, 46)", dark: "rgb(106, 171, 115)" },
        "ace-function": { light: "rgb(16,89,147)", dark: "rgb(97, 175, 239)" },
        "ace-variable": {
            light: "rgb(253, 151, 30)",
            dark: "rgb(209, 154, 102)",
        },

        red: { light: "rgb(255,59,48)", dark: "rgb(255,69,58)" },
        orange: { light: "rgb(255,149,0)", dark: "rgb(255,159,10)" },
        yellow: { light: "rgb(255,204,0)", dark: "rgb(255,214,10)" },
        green: { light: "rgb(52,199,89)", dark: "rgb(48,209,88)" },
        darkgreen: { light: "rgb(21,107,43)", dark: "rgb(37,168,70)" },
        mint: { light: "rgb(0,199,190)", dark: "rgb(102,212,207)" },
        teal: { light: "rgb(48,176,199)", dark: "rgb(64,200,224)" },
        cyan: { light: "rgb(50,173,230)", dark: "rgb(100,210,255)" },
        blue: { light: "rgb(0,122,255)", dark: "rgb(65, 157, 255)" },
        indigo: { light: "rgb(88,86,214)", dark: "rgb(94,92,230)" },
        purple: { light: "rgb(175,82,222)", dark: "rgb(191,90,242)" },
        pink: { light: "rgb(255,45,85)", dark: "rgb(255,55,95)" },
        brown: { light: "rgb(162,132,94)", dark: "rgb(172,142,104)" },
        "gray-0": { light: "rgb(0,0,0)", dark: "rgb(255,255,255)" },
        "gray-1": { light: "rgb(28,28,30)", dark: "rgb(242,242,247)" },
        "gray-2": { light: "rgb(44,44,46)", dark: "rgb(229,229,234)" },
        "gray-3": { light: "rgb(58,58,60)", dark: "rgb(209,209,214)" },
        "gray-4": { light: "rgb(72,72,74)", dark: "rgb(199,199,204)" },
        "gray-5": { light: "rgb(99,99,102)", dark: "rgb(174,174,178)" },
        "gray-6": { light: "rgb(142,142,147)", dark: "rgb(142,142,147)" },
        "gray-7": { light: "rgb(174,174,178)", dark: "rgb(99,99,102)" },
        "gray-8": { light: "rgb(199,199,204)", dark: "rgb(72,72,74)" },
        "gray-9": { light: "rgb(209,209,214)", dark: "rgb(58,58,60)" },
        "gray-10": { light: "rgb(229,229,234)", dark: "rgb(44,44,46)" },
        "gray-11": { light: "rgb(242,242,247)", dark: "rgb(28,28,30)" },
        "gray-12": { light: "rgb(255,255,255)", dark: "rgb(0,0,0)" },
    };

    public static get(name: string): string | null {
        return this.isDarkMode()
            ? this.items[name].dark
            : this.items[name].light;
    }

    public static isDarkMode(): boolean {
        const system =
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
        const settingsTheme = getFromStorage("local", "settings")?.theme;
        if (settingsTheme === "dark") return true;
        if (settingsTheme === "light") return false;
        return system;
    }

    public static generateCSSVariables(): void {
        const dark = this.isDarkMode();
        const style = document.createElement("style");
        style.type = "text/css";

        const cssVariables = Object.entries(this.items).flatMap(
            ([name, color]) => {
                const rgb = dark ? color.dark : color.light;

                const baseVariable = `--rgb-${name}: ${rgb};`;

                const rgbValues = rgb.match(/\d+/g);

                if (!rgbValues || rgbValues.length !== 3) {
                    console.error(`Invalid RGB format for color: ${rgb}`);
                    return [baseVariable];
                }

                const rgbaVariables = Array.from({ length: 9 }, (_, i) => {
                    const opacity = (i + 1) / 10;
                    return `--rgba-${name}-${(opacity * 100).toFixed(0)}: rgba(${rgbValues.join(", ")}, ${opacity});`;
                });

                return [baseVariable, ...rgbaVariables];
            },
        );

        style.innerHTML = `:root { ${cssVariables.join(" ")} }`;
        document.head.appendChild(style);
    }

    public static init() {
        this.generateCSSVariables();
    }
}
