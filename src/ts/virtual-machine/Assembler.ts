import { CPU } from "./CPU.js";
import { file } from "../files.js";
import { Binary } from "./Utils.js";
import {
    alignDirective,
    asciiDirective,
    asciizDirective,
    asmDirective,
    byteDirective,
    Directive,
    globlDirective,
    halfDirective,
    spaceDirective,
    wordDirective,
} from "./Directives.js";
import { getOptions } from "../settings.js";
import { EditorPosition } from "../editors.js";

export class Assembler {
    cpu: CPU;
    directives: Map<string, Directive> = new Map<string, Directive>([
        [".asm", new asmDirective()],
        [".align", new alignDirective()],
        [".byte", new byteDirective()],
        [".half", new halfDirective()],
        [".word", new wordDirective()],
        [".globl", new globlDirective()],
        [".asciiz", new asciizDirective()],
        [".ascii", new asciiDirective()],
        [".space", new spaceDirective()],
    ]);

    dataSegmentStart: Binary = new Binary(0x10010000);
    dataSegmentEnd: Binary = new Binary(this.dataSegmentStart.getValue());
    textSegmentStart: Binary = new Binary(0x00400000);
    textSegmentEnd: Binary = new Binary(this.textSegmentStart.getValue());

    addressEditorsPositions: Map<number, EditorPosition> = new Map<
        number,
        EditorPosition
    >();
    allLabels: Map<string, Binary | undefined> = new Map<
        string,
        Binary | undefined
    >();
    /** the editor position of the code currently being assembled. */
    currentEditorPosition: EditorPosition | undefined;

    constructor(cpu: CPU) {
        this.cpu = cpu;
    }

    assembleFiles(files: file[]) {
        this.reset();

        const globals: Map<string, Binary | undefined> = new Map<
            string,
            Binary | undefined
        >();
        const labels: Map<number, Map<string, Binary | undefined>> = new Map<
            number,
            Map<string, Binary | undefined>
        >();

        // the following two for loops are the two assembly passes. The first one doesn't actually
        // assemble the instruction but is needed to find the positions of the labels, the second one
        // compiles everything inserting the labels positions.
        for (const file of files) {
            labels.set(file.id, new Map<string, Binary | undefined>());
            this.assembleFile(file, globals, labels.get(file.id)!, false);
        }
        this.dataSegmentEnd.set(this.dataSegmentStart.getValue());
        this.textSegmentEnd.set(this.textSegmentStart.getValue());
        for (const file of files) {
            this.assembleFile(file, globals, labels.get(file.id)!, true);
        }

        this.cpu.registers.get("$gp")!.binary = new Binary(0x10008000);
        this.cpu.registers.get("$sp")!.binary = new Binary(0x7fffeffc);

        const opts = getOptions();
        if (opts["entry-point"] === "main" && globals.has("main")) {
            this.cpu.pc.set(globals.get("main")!.getValue());
        } else {
            // entry-point == text segment start
            this.cpu.pc.set(this.textSegmentStart.getValue());
        }

        const allLabels = new Map<string, Binary | undefined>();
        labels.forEach((value, key) => {
            value.forEach((value, key) => {
                if (value) {
                    allLabels.set(key, value);
                }
            });
        });

        this.allLabels = allLabels;
    }

    assembleFile(
        file: file,
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        withLabels: boolean = false,
    ) {
        let section: ".text" | ".data" = ".text";
        let directive: Directive = this.directives.get(".asm")!;
        let address: Binary = new Binary(this.textSegmentEnd.getValue());

        const lines = file.content.split("\n");
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;
            if (line === "" || line.startsWith("#")) continue;
            let tokens = this.tokenize(line);
            if (tokens.length === 0) continue;

            this.currentEditorPosition = {
                fileId: file.id,
                lineNumber: lineNumber,
            };

            if (tokens[0] === ".data") {
                section = ".data";
                directive = this.directives.get(".word")!;
                address = new Binary(this.dataSegmentEnd.getValue());
                continue;
            } else if (tokens[0] === ".text") {
                section = ".text";
                directive = this.directives.get(".asm")!;
                address = new Binary(this.textSegmentEnd.getValue());
                continue;
            }

            if (tokens[0].endsWith(":") || tokens[1] === ":") {
                // if there are spaces before the : it's counted as a separate token
                const label =
                    tokens[1] === ":"
                        ? tokens[0].trim()
                        : tokens[0].slice(0, -1);
                labels.set(label, new Binary(address.getValue()));
                if (!withLabels) {
                    if (globals.has(label)) {
                        if (globals.get(label) === undefined) {
                            globals.set(label, new Binary(address.getValue()));
                        } else {
                            throw new Error(`Label ${label} already defined`);
                        }
                    }
                }
                if (tokens[1] === ":") tokens.shift();
                tokens.shift();
                if (tokens.length === 0) continue;
            }

            if (this.directives.get(tokens[0])) {
                directive = this.directives.get(tokens[0])!;

                tokens.shift();

                if (directive instanceof globlDirective && !withLabels) {
                    directive.assemble(
                        directive.tokenize(tokens),
                        globals,
                        labels,
                        address,
                        this,
                        this.currentEditorPosition,
                    );
                }
            }

            if (withLabels) {
                if (!(directive instanceof globlDirective)) {
                    directive.assemble(
                        directive.tokenize(tokens),
                        globals,
                        labels,
                        address,
                        this,
                        this.currentEditorPosition,
                    );
                }
            } else {
                address.set(
                    address.getValue() +
                        directive.size(tokens, address.getValue(), this),
                );
            }

            if (section === ".data") {
                this.dataSegmentEnd.set(address.getValue());
                directive = this.directives.get(".word")!;
            } else if (section === ".text") {
                this.textSegmentEnd.set(address.getValue());
                directive = this.directives.get(".asm")!;
            }
        }

        // check that each globl has a lable with the same name in the file
        globals.forEach((value, key) => {
            if (value == null) {
                const addr = labels.get(key);
                if (addr) globals.set(key, addr);
                if (!addr)
                    throw new Error(
                        `Global declaration ".globl ${key}" has no corresponding label.`,
                    );
            }
        });
    }

    assembleInstruction(
        tokens: string[],
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        address: Binary,
    ): Binary {
        const symbol = tokens[0];
        const instruction = this.cpu.instructionsSet.getBySymbol(symbol);
        if (!instruction) {
            throw new Error(`Instruction ${tokens[0].toUpperCase()} not found`);
        }
        const format = this.cpu.getFormat(instruction.format);
        if (!format) {
            throw new Error(
                `Format ${instruction.format} for instruction ${tokens.join(" ")}`,
            );
        }
        const code = format.assemble(
            tokens,
            instruction,
            this.cpu,
            this,
            globals,
            labels,
            address,
        );
        return code;
    }

    resolveLabel(
        token: string,
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        address: Binary,
        absolute: boolean = false,
    ): number {
        if (!isNaN(Number(token))) {
            return Number(token);
        }

        let labelAddress = undefined;

        if (labels.has(token)) {
            labelAddress = labels.get(token)!;
        } else if (globals.has(token)) {
            labelAddress = globals.get(token)!;
        }

        if (labelAddress === undefined) {
            throw new Error(`Label ${token} not found`);
        }

        if (absolute) {
            return (labelAddress.getValue() >>> 2) & 0x03ffffff;
        } else {
            return (labelAddress.getValue() - (address.getValue() + 4)) >> 2;
        }
    }

    tokenize(line: string): string[] {
        line = line.split("#")[0].trim();

        // quoted strings, labels (end with colon), space separated words
        return line.match(/"[^"]*"|'[^']*'|[^,\s]+:|[^,\s]+/g) || [];
    }

    reset() {
        this.cpu.reset();
        this.dataSegmentEnd.set(this.dataSegmentStart.getValue());
        this.textSegmentEnd.set(this.textSegmentStart.getValue());
        this.addressEditorsPositions = new Map<number, EditorPosition>();
        this.allLabels = new Map<string, Binary | undefined>();
        this.currentEditorPosition = undefined;
    }
}
