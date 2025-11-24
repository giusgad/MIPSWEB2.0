import { CPU } from "./CPU.js";
import { file, getSelectedFileId } from "../files.js";
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
import { EditorPosition, getAceEditor } from "../editors.js";
import { InstructionPreprocessor } from "./Instruction-preprocess.js";

export class Assembler {
    cpu: CPU;
    preprocessor: InstructionPreprocessor;
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
    breakpointPCs: Set<number> = new Set();

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
        this.preprocessor = new InstructionPreprocessor();
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
        } else if (opts["entry-point"] === "currFile") {
            const currFileId = getSelectedFileId();
            const fileAddrs: number[] = [];
            for (const [addr, pos] of this.addressEditorsPositions.entries()) {
                if (pos.fileId === currFileId) fileAddrs.push(addr);
            }
            fileAddrs.sort();
            if (fileAddrs[0] <= this.textSegmentEnd.getValue()) {
                this.cpu.pc.set(fileAddrs[0]);
            } else {
                this.cpu.pc.set(this.textSegmentStart.getValue());
            }
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
        /**Keep track of the previous directive, needed for example in this case:
         * x: .byte 50
         * .globl x
         * y: 30
         *
         * The y would be read as word because .globl is not a data directive and so it would reset the data-reading directive to .word
         * By keeping track of the previous one it can be restored to keep reading y as bytes.*/
        let prevDirective: Directive | null = null;
        let address: Binary = new Binary(this.textSegmentEnd.getValue());

        const editorBreakPoints = getAceEditor(file)?.session?.getBreakpoints();
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
            if (withLabels && editorBreakPoints![lineNumber - 1] != null) {
                this.breakpointPCs.add(address.getValue());
            }

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

            // parse label(s) if present
            while (
                tokens[0] !== undefined &&
                (tokens[0].endsWith(":") || tokens[1] === ":")
            ) {
                // if there are spaces before the : it's counted as a separate token
                const label =
                    tokens[1] === ":"
                        ? tokens[0].trim()
                        : tokens[0].slice(0, -1);
                if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(label)) {
                    throw new Error(
                        `Invalid label: "${label}". Labels must only contain alphanumeric characters or underscores and must not start with a number.`,
                    );
                }
                if (!withLabels && labels.has(label) && !globals.has(label))
                    throw new Error(`Duplicate label: "${label}"`);
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
            }
            if (tokens.length === 0) continue;

            // check if the token is a directive
            if (this.directives.get(tokens[0])) {
                // some directives can only be used in the data segment
                if (
                    section === ".text" &&
                    [
                        ".align",
                        ".byte",
                        ".half",
                        ".word",
                        ".asciiz",
                        ".ascii",
                        ".space",
                    ].includes(tokens[0])
                )
                    throw new Error(
                        `Directive "${tokens[0]}" can't be used in the text segment`,
                    );
                prevDirective = directive;
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
                // if the directive is a data directive don't reset it:
                // for example if the directive is .byte, values on next lines will still be read as bytes
                if (!directive.isDataDirective())
                    if (prevDirective && prevDirective.isDataDirective())
                        directive = prevDirective;
                    else directive = this.directives.get(".word")!;
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

    private internalLabelCounter = 0;
    nextInternalLabel(): string {
        return `@${this.internalLabelCounter++}`;
    }

    reset() {
        this.cpu.reset();
        this.dataSegmentEnd.set(this.dataSegmentStart.getValue());
        this.textSegmentEnd.set(this.textSegmentStart.getValue());
        this.addressEditorsPositions = new Map<number, EditorPosition>();
        this.allLabels = new Map<string, Binary | undefined>();
        this.currentEditorPosition = undefined;
        this.breakpointPCs.clear();
    }
}
