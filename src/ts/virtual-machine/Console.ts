import { renderApp } from "../app.js";
import { blinkConsole } from "../console.js";
import { EditorPosition } from "../editors.js";
import { render } from "../rendering.js";
import { consoleShown, setConsoleShown, vm } from "../virtual-machine.js";

type LineSeverity = "success" | "error" | "warn";

type ConsoleLine = {
    text: string;
    type: LineSeverity;
    waitingInput?: boolean;
    /**Whether this lines was created with a print_string syscall*/
    isPrintString: boolean;
    /**Position of text in the editor that relates to the current line (used for error reporting)*/
    editorPos?: EditorPosition;
    /**Memory address that relates to the current line (used for error reporting)*/
    memoryPos?: number;
};

export class Console {
    lines: ConsoleLine[] = [];
    state: "ready" | "waitingInput" = "ready";
    input: string = "";

    addLine(text: string, type: LineSeverity, showConsole: boolean = true) {
        this.lines.push({
            text: text + "\n",
            type,
            waitingInput: false,
            isPrintString: false,
        });
        if (showConsole) setConsoleShown(true);
    }

    /**Add an error line with a position to which it relates.
     * @param pos if this param is of type number it means it's an address and the position
     * is in memory of the assembled program, otherwise it's of type EditorPosition and it
     * indicates a position in the assembly code*/
    addErrorWithPos(
        errorMsg: string,
        pos: EditorPosition | number | undefined,
    ) {
        let memoryPos,
            editorPos = undefined;
        if (typeof pos === "number") {
            memoryPos = pos;
            editorPos = vm.assembler.addressEditorsPositions.get(pos);
        } else {
            editorPos = pos;
        }
        this.lines.push({
            text: `${errorMsg}\n`,
            type: "error",
            isPrintString: false,
            waitingInput: false,
            editorPos: editorPos,
            memoryPos: memoryPos,
        });
        setConsoleShown(true);
    }

    /**Used for the print_string syscall, if the last line was printed with a syscall, appends to it.*/
    printString(text: string) {
        const parts = text.split("\\n");
        for (let i = 0; i < parts.length; i++) {
            let last = this.lines[this.lines.length - 1];
            // only at the first iteration we can append to the last string, otherwise it was a newline
            if (last != null && last.isPrintString && i == 0) {
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
        setConsoleShown(true);
    }

    async clear() {
        this.state = "ready";
        await new Promise((resolve) => setTimeout(resolve, 200));
        this.lines = [];
        this.input = "";
    }

    async getInput(): Promise<string> {
        if (this.lines.length === 0) {
            this.addLine("", "success", false);
        }
        this.lines[this.lines.length - 1].waitingInput = true;
        this.state = "waitingInput";
        if (consoleShown) {
            await render("console", "/app/console.ejs", undefined, false);
            blinkConsole();
        } else {
            setConsoleShown(true);
            setTimeout(blinkConsole, 250);
        }
        await render("vm-buttons", "/app/vm-buttons.ejs", undefined, false);
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (this.state === "ready") {
                    clearInterval(interval);
                    resolve(this.input);
                }
            }, 20);
        });
    }

    async setInput(input: string) {
        this.input = input;
        this.lines[this.lines.length - 1].waitingInput = false;
        this.addLine(input, "success");
        this.state = "ready";
    }

    reset() {
        this.lines = [];
        this.state = "ready";
        this.input = "";
    }
}
