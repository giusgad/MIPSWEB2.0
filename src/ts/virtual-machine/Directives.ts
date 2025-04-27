import { Binary } from "./Utils.js";
import { Assembler } from "./Assembler";

export abstract class Directive {
    abstract assemble(
        tokens: string[],
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        address: Binary,
        assembler: Assembler,
        editorPosition: { fileId: number; lineNumber: number },
    ): void;
    abstract size(tokens: string[]): number;
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

        if (pseudo && args.length === pseudo.params.length) {
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
        address.set(address.getValue() + this.size(tokens));
    }

    size(tokens: string[]): number {
        return 4;
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
            let value: Binary = new Binary(0, 32, true);
            if (!isNaN(Number(token))) {
                value.set(Number(token));
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
        const spaceAmount = parseInt(tokens[0]);
        return spaceAmount;
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
                value.set(Number(token));
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
                if (!isNaN(Number(token)) && token.length === 1) {
                    newTokens.push(token);
                }
            }
        });
        return newTokens;
    }
}
