export class Console {
    constructor() {
        this.lines = [];
    }
    addLine(text, type) {
        this.lines.push({ text, type });
    }
    clear() {
        this.lines = [];
    }
}
