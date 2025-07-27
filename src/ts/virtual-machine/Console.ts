import { renderApp } from "../app.js";

type LineSeverity = "success" | "error" | "warn";
type ConsoleLine = {
    text: string;
    type: LineSeverity;
    waitingInput?: boolean;
    /**Whether this lines was created with a print_string syscall*/
    isPrintString: boolean;
};

export class Console {
    lines: ConsoleLine[] = [];
    state: "ready" | "waitingInput" = "ready";
    input: string = "";

    addLine(text: string, type: LineSeverity) {
        this.lines.push({
            text: text + "\n",
            type,
            waitingInput: false,
            isPrintString: false,
        });
    }

    /**Used for the print_string syscall, if the last line was printed with a syscall, appends to it.*/
    printString(text: string) {
        const parts = text.split("\\n");
        for (let i = 0; i < parts.length; i++) {
            let last = this.lines[this.lines.length - 1];
            // only at the first iteration we can append to the last string, otherwise it was a newline
            if (last && last.isPrintString && i == 0) {
                last.text += parts[i];
            } else {
                this.lines.push({
                    text: parts[i],
                    type: "success",
                    waitingInput: false,
                    isPrintString: true,
                });
            }
        }
    }

    async clear() {
        this.state = "ready";
        await new Promise((resolve) => setTimeout(resolve, 200));
        this.lines = [];
        this.input = "";
    }

    async getInput(): Promise<string> {
        if (this.lines.length === 0) {
            this.addLine("", "success");
        }
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
