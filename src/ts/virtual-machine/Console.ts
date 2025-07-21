import { renderApp } from "../app.js";

type LineSeverity = "success" | "error" | "warn";
type ConsoleLine = {
    text: string;
    type: LineSeverity;
    waitingInput?: boolean;
};

export class Console {
    lines: ConsoleLine[] = [];
    state: "ready" | "waitingInput" = "ready";
    input: string = "";

    addLine(text: string, type: LineSeverity) {
        this.lines.push({ text: text + "\n", type, waitingInput: false });
    }

    async clear() {
        this.state = "ready";
        await new Promise((resolve) => setTimeout(resolve, 200));
        this.lines = [];
        this.input = "";
    }

    async getInput(): Promise<string> {
        this.lines[this.lines.length - 1].waitingInput = true;
        this.state = "waitingInput";
        await renderApp();
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (this.state === "ready") {
                    clearInterval(interval);
                    resolve(this.input);
                }
            }, 100);
        });
    }

    async setInput(input: string) {
        this.input = input;
        this.lines[this.lines.length - 1].waitingInput = false;
        this.addLine(input, "success");
        this.state = "ready";
        await renderApp();
    }

    reset() {
        this.lines = [];
        this.state = "ready";
        this.input = "";
    }
}
