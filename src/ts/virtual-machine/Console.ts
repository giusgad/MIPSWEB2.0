type ConsoleLine = { text: string, type: "success" | "error" };

export class Console {

    lines: ConsoleLine[] = [];

    addLine(text: string, type: "success" | "error") {
        this.lines.push({ text, type });
    }

    clear() {
        this.lines = [];
    }

}