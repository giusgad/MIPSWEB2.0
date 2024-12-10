import {renderApp} from "../app.js";

type ConsoleLine = { text: string, type: "success" | "error", waitingInput?: boolean };

export class Console {

    lines: ConsoleLine[] = [];
    state: 'ready' | 'waitingInput' = 'ready';
    input: string = '';

    addLine(text: string, type: "success" | "error") {
        this.lines.push({ text: text + '\n', type, waitingInput: false });
    }

    clear() {
        this.lines = [];
        this.state = 'ready';
        this.input = '';
    }

    async getInput(): Promise<string> {
        this.lines[this.lines.length - 1].waitingInput = true;
        this.state = 'waitingInput';
        await renderApp();
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (this.state === 'ready') {
                    clearInterval(interval);
                    resolve(this.input);
                }
            }, 100);
        });
    }

    async setInput(input: string) {
        this.input = input;
        this.lines[this.lines.length - 1].waitingInput = false;
        this.addLine(input, 'success');
        this.state = 'ready';
        await renderApp();
    }

}