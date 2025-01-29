var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { renderApp } from "../app.js";
export class Console {
    constructor() {
        this.lines = [];
        this.state = 'ready';
        this.input = '';
    }
    addLine(text, type) {
        this.lines.push({ text: text + '\n', type, waitingInput: false });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state = 'ready';
            yield new Promise(resolve => setTimeout(resolve, 200));
            this.lines = [];
            this.input = '';
        });
    }
    getInput() {
        return __awaiter(this, void 0, void 0, function* () {
            this.lines[this.lines.length - 1].waitingInput = true;
            this.state = 'waitingInput';
            yield renderApp();
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (this.state === 'ready') {
                        clearInterval(interval);
                        resolve(this.input);
                    }
                }, 100);
            });
        });
    }
    setInput(input) {
        return __awaiter(this, void 0, void 0, function* () {
            this.input = input;
            this.lines[this.lines.length - 1].waitingInput = false;
            this.addLine(input, 'success');
            this.state = 'ready';
            yield renderApp();
        });
    }
    reset() {
        this.lines = [];
        this.state = 'ready';
        this.input = '';
    }
}
