import { Binary } from "./Utils.js";
import { Assembler } from "./Assembler";
import { intFromStr } from "../utils.js";
import { getOptions } from "../settings.js";

export abstract class Directive {
    abstract assemble(
        tokens: string[],
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        address: Binary,
        assembler: Assembler,
        editorPosition: { fileId: number; lineNumber: number },
    ): void;
    abstract size(
        tokens: string[],
        address?: number,
        assembler?: Assembler,
    ): number;
    tokenize(tokens: string[]) {
        tokens = tokens.map((token) => token.replace(/,/g, ""));
        return tokens;
    }
}

export class asmDirective extends Directive {
    assemble(
        tokens: string[],
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        address: Binary,
        assembler: Assembler,
        editorPosition: { fileId: number; lineNumber: number },
    ) {
        const symbol = tokens[0];
        const pseudo = assembler.cpu.instructionsSet.getPseudoBySymbol(symbol);
        const args = tokens.slice(1);
        const opts = getOptions();
        const isPseudoAndRegular =
            pseudo && assembler.cpu.instructionsSet.getBySymbol(symbol);

        if (pseudo) {
            if (opts["pseudo-enabled"] === false)
                throw new Error(
                    `Pseudoinstruction "${symbol}" is not allowed. You can enable pseudo-instructions in settings.`,
                );

            // check if the number of arguments is correct for the pseudo instruction
            if (
                (pseudo.params[0] === "" && args.length !== 0) ||
                (pseudo.params[0] !== "" &&
                    args.length !== pseudo.params.length)
            ) {
                // if the number of arguments is incorrect but the pseudo can also be interpreted as a regular instruction
                // then try parsing it as a regular instruction instead of erroring out.
                if (isPseudoAndRegular) {
                    this.assembleInstruction(
                        tokens,
                        globals,
                        labels,
                        address,
                        assembler,
                        editorPosition,
                    );
                    return;
                }
                throw new Error(
                    `Invalid params for pseudoinstruction "${tokens.join(" ")}". Expected: "${pseudo.params}".`,
                );
            }

            const expandedInstructions = pseudo.expand(
                assembler,
                tokens,
                globals,
                labels,
                address,
            );
            for (const expandedTokens of expandedInstructions) {
                this.assembleInstruction(
                    expandedTokens,
                    globals,
                    labels,
                    address,
                    assembler,
                    editorPosition,
                );
            }
        } else {
            this.assembleInstruction(
                tokens,
                globals,
                labels,
                address,
                assembler,
                editorPosition,
            );
        }
    }

    assembleInstruction(
        tokens: string[],
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        address: Binary,
        assembler: Assembler,
        editorPosition: { fileId: number; lineNumber: number },
    ) {
        const instruction = assembler.cpu.instructionsSet.getBySymbol(
            tokens[0],
        );
        const preprocessed = assembler.preprocessor.preprocess(
            instruction,
            tokens,
            labels,
        );
        for (const tokens of preprocessed) {
            assembler.addressEditorsPositions.set(
                address.getValue(),
                editorPosition,
            );
            const code: Binary = assembler.assembleInstruction(
                tokens,
                globals,
                labels,
                address,
            );
            assembler.cpu.storeWord(address, code);
            address.set(
                address.getValue() + this.size(tokens, undefined, assembler),
            );
        }
    }

    /**Finds whether the instruction is a pseudoinstruction or not. If it is gets its expansion's size.*/
    size(tokens: string[], address?: number, assembler?: Assembler): number {
        const calcRegular = () => {
            if (!assembler) return 4;
            const instruction = assembler.cpu.instructionsSet.getBySymbol(
                tokens[0],
            );
            const preprocessed = assembler.preprocessor.preprocess(
                instruction,
                tokens,
                new Map(),
            );
            return preprocessed.length * 4;
        };
        if (!assembler) return 4;
        const symbol = tokens[0];
        const pseudo = assembler.cpu.instructionsSet.getPseudoBySymbol(symbol);
        const regular = assembler.cpu.instructionsSet.getBySymbol(symbol);
        const isPseudoAndRegular = pseudo && regular;
        if (regular || (!pseudo && !regular)) return calcRegular();
        // If an instruction can be interpreted as both pseudo and regular instruction:
        // if the number of arguments is incorrect for the pseudo return 4 since it's a regular instruction
        if (isPseudoAndRegular && pseudo.params.length !== tokens.length - 1)
            return calcRegular();
        if (pseudo) {
            const staticSize = pseudo.size();
            if (staticSize) return staticSize * 4;
            try {
                const expanded = pseudo.expand(
                    assembler,
                    tokens,
                    new Map(),
                    new Map(),
                    new Binary(0),
                );
                return expanded.length * 4;
            } catch {
                return calcRegular();
            }
        }
        return calcRegular();
    }
}

export class wordDirective extends Directive {
    assemble(
        tokens: string[],
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        address: Binary,
        assembler: Assembler,
        editorPosition: { fileId: number; lineNumber: number },
    ) {
        tokens.forEach((token) => {
            let value: Binary = new Binary(0, 32);
            if (!isNaN(Number(token))) {
                const num = Number(token);
                value.set(num, num <= 2147483647);
            } else if (
                (token.startsWith('"') && token.endsWith('"')) ||
                (token.startsWith("'") && token.endsWith("'"))
            ) {
                value.set(token.slice(1, -1).charCodeAt(0));
            } else {
                throw new Error(`Invalid token for .word directive: ${token}`);
            }
            if (address.getValue() % 4 !== 0) {
                address.set(
                    address.getValue() + (4 - (address.getValue() % 4)),
                );
            }
            assembler.cpu.storeWord(address, value);
            address.set(address.getValue() + 4);
        });
    }

    size(tokens: string[]): number {
        const numValues = tokens.length;
        return 4 * numValues;
    }
}

export class globlDirective extends Directive {
    assemble(
        tokens: string[],
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        address: Binary,
        assembler: Assembler,
        editorPosition: { fileId: number; lineNumber: number },
    ) {
        if (!globals.has(tokens[0])) {
            globals.set(tokens[0], undefined);
        }
        if (!labels.has(tokens[0])) {
            labels.set(tokens[0], undefined);
        }
    }

    size(tokens: string[]): number {
        return 0;
    }
}

export class asciiDirective extends Directive {
    assemble(
        tokens: string[],
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        address: Binary,
        assembler: Assembler,
        editorPosition: { fileId: number; lineNumber: number },
    ) {
        const string = tokens[0].slice(1, -1);
        for (let i = 0; i < string.length; i++) {
            let value: Binary = new Binary(string.charCodeAt(i), 8);
            assembler.cpu.storeByte(address, value);
            address.set(address.getValue() + 1);
        }
        address.set(address.getValue() + 1);
    }

    size(tokens: string[]): number {
        const string = tokens[0].slice(1, -1);
        return string.length + 1;
    }
}

export class asciizDirective extends Directive {
    assemble(
        tokens: string[],
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        address: Binary,
        assembler: Assembler,
        editorPosition: { fileId: number; lineNumber: number },
    ) {
        const string = tokens[0].slice(1, -1);
        for (let i = 0; i < string.length; i++) {
            let value: Binary = new Binary(string.charCodeAt(i), 8);
            assembler.cpu.storeByte(address, value);
            address.set(address.getValue() + 1);
        }
        let value: Binary = new Binary(0, 8);
        assembler.cpu.storeByte(address, value);
        address.set(address.getValue() + 1);
    }

    size(tokens: string[]): number {
        const string = tokens[0].slice(1, -1);
        return string.length + 1;
    }
}

export class spaceDirective extends Directive {
    assemble(
        tokens: string[],
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        address: Binary,
        assembler: Assembler,
        editorPosition: { fileId: number; lineNumber: number },
    ) {
        address.set(address.getValue() + this.size(tokens));
    }

    size(tokens: string[]): number {
        const spaceAmount = intFromStr(tokens[0]);
        return spaceAmount;
    }
}

export class alignDirective extends Directive {
    assemble(
        tokens: string[],
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        address: Binary,
        assembler: Assembler,
        editorPosition: { fileId: number; lineNumber: number },
    ) {
        const currentAddr = address.getValue();
        address.set(currentAddr + this.size(tokens, currentAddr));
    }

    size(tokens: string[], address: number): number {
        const n = intFromStr(tokens[0]);
        const alignment = 2 ** n;
        const filled = address % alignment;
        // already aligned
        if (filled === 0) {
            return 0;
        } else {
            return alignment - filled;
        }
    }
}

export class byteDirective extends Directive {
    assemble(
        tokens: string[],
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        address: Binary,
        assembler: Assembler,
        editorPosition: { fileId: number; lineNumber: number },
    ) {
        tokens.forEach((token) => {
            let value: Binary = new Binary(0, 8);
            if (!isNaN(Number(token))) {
                const num = Number(token);
                value.set(num, num < 128);
            } else if (
                (token.startsWith('"') && token.endsWith('"')) ||
                (token.startsWith("'") && token.endsWith("'"))
            ) {
                value.set(token.slice(1, -1).charCodeAt(0));
            } else {
                console.error(
                    `Token non valido nella direttiva .byte: ${token}`,
                );
            }
            assembler.cpu.storeByte(address, value);
            address.set(address.getValue() + 1);
        });
    }

    size(tokens: string[]): number {
        const numValues = tokens.length;
        return numValues;
    }

    tokenize(tokens: string[]) {
        const newTokens: string[] = [];
        tokens.forEach((token) => {
            if (
                (token.startsWith('"') && token.endsWith('"')) ||
                (token.startsWith("'") && token.endsWith("'"))
            ) {
                newTokens.push(token);
            } else {
                token = token.replace(",", "");
                if (!isNaN(Number(token))) {
                    newTokens.push(token);
                }
            }
        });
        return newTokens;
    }
}

export class halfDirective extends Directive {
    assemble(
        tokens: string[],
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        address: Binary,
        assembler: Assembler,
        editorPosition: { fileId: number; lineNumber: number },
    ) {
        tokens.forEach((token) => {
            let value: Binary = new Binary(0, 16);
            if (!isNaN(Number(token))) {
                const num = Number(token);
                value.set(num, num < 2 ** 15);
            } else if (
                (token.startsWith('"') && token.endsWith('"')) ||
                (token.startsWith("'") && token.endsWith("'"))
            ) {
                const first = token.slice(1, -1).charCodeAt(0) || 0;
                const second = token.slice(1, -1).charCodeAt(1) || 0;
                value.setBits(new Binary(first, 8), 7, 0);
                value.setBits(new Binary(second, 8), 15, 8);
            } else {
                console.error(
                    `Token non valido nella direttiva .byte: ${token}`,
                );
            }
            assembler.cpu.memory.storeHalf(address, value);
            address.set(address.getValue() + 2);
        });
    }

    size(tokens: string[]): number {
        const numValues = tokens.length;
        return numValues * 2;
    }

    tokenize(tokens: string[]) {
        const newTokens: string[] = [];
        tokens.forEach((token) => {
            if (
                (token.startsWith('"') && token.endsWith('"')) ||
                (token.startsWith("'") && token.endsWith("'"))
            ) {
                newTokens.push(token);
            } else {
                token = token.replace(",", "");
                if (!isNaN(Number(token))) {
                    newTokens.push(token);
                }
            }
        });
        return newTokens;
    }
}
