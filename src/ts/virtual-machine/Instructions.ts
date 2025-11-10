import { Binary, Utils } from "./Utils.js";

import { CPU } from "./CPU.js";
import { Assembler } from "./Assembler.js";
import { VirtualMachine } from "./VirtualMachine.js";
import { getFromStorage, parseInlineLiteral } from "../utils.js";
import { register, Registers } from "./Registers.js";
import { getOptions } from "../settings.js";

export type ParamsFormat =
    | "rt, rs, immediate"
    | "rd, rt, sa"
    | "rd, rt, rs"
    | "rs"
    | "rd, rs"
    | "rd"
    | "rs, rt"
    | "rd, rs, rt"
    | "target"
    | "rs, rt, offset"
    | "offset"
    | "rs, offset"
    | "rt, immediate"
    | "rs, immediate"
    | "cop_fun"
    | "rt, offset(base)"
    | "SYSCALL"
    | ""; // no params

export abstract class Instruction {
    symbol: string;
    /**How the params can be passed to an instruction. It's an array
     * since some instructions can accept parameters in different ways*/
    params: ParamsFormat[];
    format: string;
    opcode: Binary;
    funct: Binary | undefined;
    /**Some I instructions are differentiated by a fixed rt field (not accessed by the user)*/
    fixedRt: Binary | undefined;

    constructor(
        symbol: string,
        params: ParamsFormat[],
        format: string,
        opcode: Binary,
        funct: Binary | undefined,
    ) {
        this.symbol = symbol;
        this.params = params;
        this.format = format;
        this.opcode = opcode;
        this.funct = funct;
    }

    abstract execute(
        cpu: CPU,
        params: { [key: string]: Binary },
        vm: VirtualMachine | undefined,
    ): void;

    /**Returns an object with extra info about the instruction
     * should return null if the instruction is not implemented, causing it not to be shown in the help screen*/
    abstract getHelp(): { longName: string; desc: string } | null;

    /** returns the possible params acceptable for the instruction given the number of params found in the user's code*/
    getPossibleParams(n_found_params: number): ParamsFormat[] {
        if (n_found_params === 0)
            return this.params.filter((p) => ["SYSCALL", ""].includes(p));
        return this.params.filter(
            (p) =>
                p.split(",").length === n_found_params ||
                // this case allows space between offset and (base)
                (p === "rt, offset(base)" && n_found_params === 3),
        );
    }

    basic(params: { [key: string]: Binary }, registers: Registers): string {
        const registersFormat = getFromStorage("local", "settings").colsFormats[
            "registers-name-format"
        ];

        const paramsNames = this.params[0].split(",").map((p) => p.trim());
        const paramValues: string[] = [];

        for (const name of paramsNames) {
            if (name.includes("(") && name.includes(")")) {
                const offsetValue = params["immediate"]?.getValue() || 0;
                const rsValue = params["rs"]?.getValue();
                paramValues.push(
                    `${offsetValue}(${registers.getRegisterFormat(
                        rsValue,
                        registersFormat,
                        registers,
                    )})`,
                );
            } else if (["rs", "rt", "rd"].includes(name)) {
                const regValue = params[name]?.getValue();
                paramValues.push(
                    `${registers.getRegisterFormat(
                        regValue,
                        registersFormat,
                        registers,
                    )}`,
                );
            } else if (name === "immediate" || name === "offset") {
                const immediateValue = params["immediate"]?.getValue();
                paramValues.push(
                    immediateValue !== undefined
                        ? immediateValue.toString()
                        : "0",
                );
            } else if (name === "target") {
                const targetValue = params[name]?.getValue();
                paramValues.push(
                    targetValue !== undefined ? targetValue.toString() : "0",
                );
            } else if (name === "SYSCALL" || name === "") {
                return this.symbol.toLowerCase();
            } else if (name === "sa") {
                const shamtValue = params["shamt"]?.getValue();
                paramValues.push(
                    shamtValue !== undefined
                        ? shamtValue.toString()
                        : "undefined",
                );
            } else {
                console.error("Param to handle: " + name);
                const paramValue = params[name]?.getValue();
                paramValues.push(
                    paramValue !== undefined
                        ? paramValue.toString()
                        : "undefined",
                );
            }
        }

        return `${this.symbol.toLowerCase()} ${paramValues.join(" ")}`;
    }

    /**returns a list of the register names that were read*/
    getReadRegisters(
        params: { [key: string]: Binary },
        registers: register[],
    ): string[] {
        let read: register[] = [];
        const rs = params.rs ? registers[params.rs.getValue()] : null;
        const rt = params.rt ? registers[params.rt.getValue()] : null;
        switch (this.params[0]) {
            case "rt, rs, immediate": // imm
                read = [rs!];
                break;
            case "rd, rt, sa": // shift
                read = [rt!];
                break;
            case "rd, rt, rs": // shift register
            case "rs, rt": // mult / div
            case "rs, rt, offset": // branches
            case "rd, rs, rt": // R-format ops
                read = [rt!, rs!];
                break;
            case "rs": // mtlo/mthi
            case "rd, rs": // j
            case "rs, offset": // some branches
            case "rs, immediate": // tgei
                read = [rs!];
                break;
            case "rt, offset(base)": // loads and stores
                if (this.symbol.startsWith("S")) {
                    // only the store read the register
                    read = [rt!];
                }
                break;
            case "SYSCALL":
                read = [registers[2]]; // v0
            case "rd": // mfhi/mflo
            case "rt, immediate": // lui
            case "":
            case "cop_fun":
            case "target":
            case "offset":
            default:
                break;
        }
        return read.map((r) => r.name);
    }

    /**Returns the word-aligned address of memory read by this instruction (if any)*/
    getReadMem(
        params: { [key: string]: Binary },
        registers: register[],
    ): number | undefined {
        if (
            ["LW", "LWL", "LWR", "LH", "LHU", "LB", "LBU", "LL"].includes(
                this.symbol,
            )
        ) {
            const rs = registers[params.rs!.getValue()].binary;
            const immediate = params.immediate!.getValue();
            const address = rs.getValue() + immediate;
            return address - (address % 4);
        }
        return undefined;
    }
    /**Returns the word-aligned address of memory written by this instruction (if any)*/
    getWrittenMem(
        params: { [key: string]: Binary },
        registers: register[],
    ): number | undefined {
        if (["SW", "SWL", "SWR", "SH", "SB", "SC"].includes(this.symbol)) {
            const rs = registers[params.rs!.getValue()].binary;
            const immediate = params.immediate!.getValue();
            const address = rs.getValue() + immediate;
            return address - (address % 4);
        }
        return undefined;
    }

    getImmediateCorrespondent(): string | null {
        if (
            [
                "ADD", // ["rd, rs, rt"],
                "AND", // ["rd, rs, rt"],
                "OR", // ["rd, rs, rt"],
                "XOR", // ["rd, rs, rt"],
                "SLT", // ["rd, rs, rt"],
                "TGE", // ["rs, rt"],
                "TLT", // ["rs, rt"],
                "TEQ", // ["rs, rt"],
                "TNE", // ["rs, rt"],
            ].includes(this.symbol)
        ) {
            return `${this.symbol}I`;
        } else if (["TLTU", "ADDU", "SLTU", "TGEU"].includes(this.symbol)) {
            return `${this.symbol.slice(0, this.symbol.length - 1)}IU`;
        }
        return null;
    }
}

export abstract class PseudoInstruction {
    symbol: string;
    params: string[];

    constructor(symbol: string, params: string) {
        this.symbol = symbol;
        this.params = params.split(",").map((param) => param.trim());
    }

    mapParams(tokens: string[]): { [key: string]: string } {
        const paramMap: { [key: string]: string } = {};

        for (let i = 0; i < this.params.length; i++) {
            paramMap[this.params[i]] = tokens[i + 1];
        }

        return paramMap;
    }

    abstract expand(
        assembler: Assembler,
        tokens: string[],
        globals: Map<string, Binary | undefined>,
        labels: Map<string, Binary | undefined>,
        address: Binary,
    ): string[][];

    /**Returns the number of instructions this pseudo maps to if it's always the same number.
     * Otherwise the size needs to be found by expanding the pseudo*/
    abstract size(): number | null;

    abstract getHelp(): { longName: string; desc: string } | null;
}

export class Instructions {
    instructions: Instruction[] = [];
    pseudoInstructions: PseudoInstruction[] = [];

    constructor() {
        this.initInstructions();
        this.initPseudoInstructions();
    }

    getBySymbol(symbol: string): Instruction | undefined {
        for (const instruction of this.instructions) {
            if (instruction.symbol.toLowerCase() === symbol.toLowerCase()) {
                return instruction;
            }
        }
    }

    getPseudoBySymbol(symbol: string): PseudoInstruction | undefined {
        for (const pseudo of this.pseudoInstructions) {
            if (pseudo.symbol.toLowerCase() === symbol.toLowerCase()) {
                return pseudo;
            }
        }
    }

    initInstructions() {
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SLL",
                        ["rd, rt, sa"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b000000, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd!.getValue()].binary;
                    const rt = registers[params.rt!.getValue()].binary;
                    const sa = params.shamt!;

                    rd.set(rt.getValue() << sa.getValue());

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Shift word Left Logical",
                        desc: "set rd to (rt << sa)",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SRL",
                        ["rd, rt, sa"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b000010, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd!.getValue()].binary;
                    const rt = registers[params.rt!.getValue()].binary;
                    const sa = params.shamt!.getValue();

                    rd.set(rt.getValue() >> sa);
                    rd.setBits(new Binary(0), 31, 31 - sa + 1);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Shift word Right Logical",
                        desc: "set rd to (rt >> sa)",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SRA",
                        ["rd, rt, sa"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b000011, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd!.getValue()].binary;
                    const rt = registers[params.rt!.getValue()].binary;
                    const sa = params.shamt!.getValue();

                    rd.set(rt.getValue() >> sa);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Shift word Right Arithmetic",
                        desc: "set rd to (rt >> sa) extending the sign bit in the emptied bits",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SLLV",
                        ["rd, rt, rs"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b000100, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd!.getValue()].binary;
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const sa = rs.getBits(4, 0).getValue();
                    rd.set(rt.getValue() << sa);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Shift word Left Logical Variable",
                        desc: "set rd to (rt << rs)",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SRLV",
                        ["rd, rt, rs"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b000110, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd!.getValue()].binary;
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const sa = rs.getBits(4, 0).getValue();
                    rd.set(rt.getValue() >> sa);
                    rd.setBits(new Binary(0), 31, 31 - sa + 1);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Shift word Right Logical Variable",
                        desc: "set rd to (rt >> rs)",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SRAV",
                        ["rd, rt, rs"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b000111, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd!.getValue()].binary;
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const sa = rs.getBits(4, 0).getValue();
                    rd.set(rt.getValue() >> sa);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Shift word Right Arithmetic Variable",
                        desc: "set rd to (rt >> rs) extending the sign bit in the emptied bits",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "JR",
                        ["rs"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b001000, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs =
                        registers[params.rs.getValue()].binary.getValue();

                    cpu.pc.set(rs);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Jump Register",
                        desc: "execute a branch to the address in rs",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "JALR",
                        ["rd, rs", "rs"], // if not specified rd is implied to 31 ($ra)
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b001001, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;

                    rd.set(cpu.pc.getValue() + 4);
                    cpu.pc.set(rs.getValue());
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Jump And Link Register",
                        desc: "execute a procedure call to the address in rs; return address is saved in rd, which if not specified is 31 ($ra)",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SYSCALL",
                        ["SYSCALL"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b001100, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const v0 = registers[2].binary;

                    const syscall = cpu.syscallsSet.get(v0.getValue());
                    if (!syscall) {
                        throw new Error(`Unknown syscall: ${v0.getValue()}`);
                    }

                    await syscall.execute(cpu, {}, vm);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "SYStem CALL",
                        desc: "cause a system call exception",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "BREAK",
                        [""],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b001101, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = params.rs!;
                    const rt = params.rt!;
                    const rd = params.rd!;
                    const shamt = params.shamt!;
                    // the code is made of the 20 bits between opcode and funct
                    let code = new Binary(0, 20, false);
                    code.setBits(rs, 25, 21);
                    code.setBits(rt, 20, 16);
                    code.setBits(rd, 15, 11);
                    code.setBits(shamt, 10, 6);
                    vm.console.addLine(`BREAK: ${code.getBinary(5)}`, "warn");

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Breakpoint",
                        desc: "cause a breakpoint exception; the 20 central bits in the instruction code can be retrieved by the exception handler for information",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "MFHI",
                        ["rd"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b010000, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const rd = cpu.getRegisters()[params.rd!.getValue()].binary;
                    rd.set(cpu.hi.getUnsignedValue(), false);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Move From HI register",
                        desc: "set rd to the contents of the HI register",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "MTHI",
                        ["rs"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b010001, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const rs = cpu.getRegisters()[params.rs!.getValue()].binary;
                    cpu.hi.set(rs.getValue());

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Move To HI register",
                        desc: "set the HI register to the contents of rs",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "MFLO",
                        ["rd"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b010010, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd!.getValue()].binary;

                    rd.set(cpu.lo.getUnsignedValue(), false);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Move From LO register",
                        desc: "set rd to the contents of the LO register",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "MTLO",
                        ["rs"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b010011, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const rs = cpu.getRegisters()[params.rs!.getValue()].binary;
                    cpu.lo.set(rs.getValue());

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Move To LO register",
                        desc: "set the LO register to the contents of rs",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "MULT",
                        ["rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b011000, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs!.getValue()].binary;
                    const rt = registers[params.rt!.getValue()].binary;

                    const rsValue = rs.getSignedValue();
                    const rtValue = rt.getSignedValue();
                    const result = BigInt(rsValue) * BigInt(rtValue);

                    cpu.lo.set(Number(result & BigInt(0xffffffff)));
                    cpu.hi.set(
                        Number((result >> BigInt(32)) & BigInt(0xffffffff)),
                    );

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "MULTiply word",
                        desc: "multiply rs by rt as 32-bit signed integers, producing a 64bit result; set LO to the low-order 32 bits and HI to the high-order 32 bits.",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "MULTU",
                        ["rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b011001, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs.getValue()].binary;
                    const rt = registers[params.rt.getValue()].binary;

                    const rsValue = BigInt(rs.getUnsignedValue());
                    const rtValue = BigInt(rt.getUnsignedValue());

                    const val = rsValue * rtValue;

                    const loValue = Number(val & BigInt(0xffffffff));
                    const hiValue = Number(
                        (val >> BigInt(32)) & BigInt(0xffffffff),
                    );

                    cpu.lo.set(loValue, false);
                    cpu.hi.set(hiValue, false);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "MULTiply Unsigned word",
                        desc: "multiply rs by rt as 32-bit unsigned integers, producing a 64bit result; set LO to the low-order 32 bits and HI to the high-order 32 bits.",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "DIV",
                        ["rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b011010, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs.getValue()].binary;
                    const rt = registers[params.rt.getValue()].binary;

                    const rsValue = rs.getSignedValue();
                    const rtValue = rt.getSignedValue();

                    if (rtValue === 0) {
                        console.warn(
                            "DIV instruction: Division by zero. Result undefined.",
                        );
                    }

                    const quotient = Math.floor(rsValue / rtValue);
                    const remainder = rsValue % rtValue;

                    cpu.lo.set(quotient);
                    cpu.hi.set(remainder);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "DIVide word",
                        desc: "divide rs by rt, treating operands as signed values; set LO to the quotient and set HI to the remainder",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "DIVU",
                        ["rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b011011, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs.getValue()].binary;
                    const rt = registers[params.rt.getValue()].binary;

                    const rsValue = rs.getUnsignedValue();
                    const rtValue = rt.getUnsignedValue();

                    if (rtValue === 0) {
                        console.warn(
                            "DIVU instruction: Division by zero. Result undefined.",
                        );
                    }

                    const quotient = Math.floor(rsValue / rtValue);
                    const remainder = rsValue % rtValue;

                    cpu.lo.set(quotient, false);
                    cpu.hi.set(remainder, false);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "DIVide Unsigned word",
                        desc: "divide rs by rt, treating operands as unsigned values; set LO to the quotient and set HI to the remainder",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "ADD",
                        ["rd, rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b100000, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const rt = registers[params.rt!.getValue()].binary;

                    const rsValue = rs.getSignedValue();
                    const rtValue = rt.getSignedValue();
                    const result = rsValue + rtValue;

                    const overflow =
                        (rsValue > 0 && rtValue > 0 && result < 0) ||
                        (rsValue < 0 && rtValue < 0 && result > 0);

                    if (overflow) {
                        throw new Error("Integer Overflow");
                    }

                    rd.set(result, true);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "ADD word",
                        desc: "Set rd to rs + rt; if the addition results in 2's complement arithmetic overflow then trap",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "ADDU",
                        ["rd, rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b100001, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const rt = registers[params.rt!.getValue()].binary;

                    rd.set(rs.getSignedValue() + rt.getSignedValue());

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "ADD Unsigned word",
                        desc: "Set rd to rs + rt; doesn't trap on overflow",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SUB",
                        ["rd, rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b100010, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const rt = registers[params.rt!.getValue()].binary;

                    const rsValue = rs.getSignedValue();
                    const rtValue = rt.getSignedValue();
                    const result = rsValue - rtValue;

                    const overflow =
                        (rsValue > 0 && rtValue < 0 && result < 0) ||
                        (rsValue < 0 && rtValue > 0 && result > 0);

                    if (overflow) {
                        throw new Error("Integer Overflow");
                    }

                    rd.set(result, true);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "SUBtract word",
                        desc: "Set rd to rs - rt; if the subtraction results in 2's complement arithmetic overflow then trap",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SUBU",
                        ["rd, rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b100011, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rsValue =
                        registers[
                            params.rs.getValue()
                        ].binary.getUnsignedValue();
                    const rtValue =
                        registers[
                            params.rt.getValue()
                        ].binary.getUnsignedValue();
                    const rd = registers[params.rd.getValue()].binary;

                    const result = (rsValue - rtValue) >>> 0;

                    rd.set(result, false);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "SUBtract Unsigned word",
                        desc: "Set rd to rs - rt; doesn't trap on overflow",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "AND",
                        ["rd, rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b100100, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd.getValue()].binary;
                    const rs = registers[params.rs.getValue()].binary;
                    const rt = registers[params.rt.getValue()].binary;

                    const value =
                        (rs.getUnsignedValue() & rt.getUnsignedValue()) >>> 0;
                    rd.set(value, false);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "AND",
                        desc: "set rd to the result of the bitwise operation rs AND rt",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "OR",
                        ["rd, rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b100101, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd.getValue()].binary;
                    const rs = registers[params.rs.getValue()].binary;
                    const rt = registers[params.rt.getValue()].binary;

                    const value =
                        (rs.getUnsignedValue() | rt.getUnsignedValue()) >>> 0;
                    rd.set(value, false);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "OR",
                        desc: "set rd to the result of the bitwise operation rs OR rt",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "XOR",
                        ["rd, rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b100110, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd.getValue()].binary;
                    const rs = registers[params.rs.getValue()].binary;
                    const rt = registers[params.rt.getValue()].binary;

                    const value =
                        (rs.getUnsignedValue() ^ rt.getUnsignedValue()) >>> 0;
                    rd.set(value, false);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "XOR",
                        desc: "set rd to the result of the bitwise operation rs XOR rt (exclusive OR)",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "NOR",
                        ["rd, rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b100111, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd.getValue()].binary;
                    const rs = registers[params.rs.getValue()].binary;
                    const rt = registers[params.rt.getValue()].binary;

                    const value =
                        ~(rs.getUnsignedValue() | rt.getUnsignedValue()) >>> 0;
                    rd.set(value, false);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "NOR",
                        desc: "set rd to the result of the bitwise operation rs NOR rt",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SLT",
                        ["rd, rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b101010, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd.getValue()].binary;
                    const rs = registers[params.rs.getValue()].binary;
                    const rt = registers[params.rt.getValue()].binary;

                    if (rs.getSignedValue() < rt.getSignedValue()) {
                        rd.set(1);
                    } else {
                        rd.set(0);
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Set on Less Than",
                        desc: "set rd to 1 if (rs < rt) as signed integers, set rd to 0 otherwise",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SLTU",
                        ["rd, rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b101011, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rd = registers[params.rd.getValue()].binary;
                    const rs = registers[params.rs.getValue()].binary;
                    const rt = registers[params.rt.getValue()].binary;

                    if (rs.getUnsignedValue() < rt.getUnsignedValue()) {
                        rd.set(1);
                    } else {
                        rd.set(0);
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Set on Less Than Unsigned",
                        desc: "set rd to 1 if (rs < rt) as unsigned integers, set rd to 0 otherwise",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "TGE",
                        ["rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b110000, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs.getValue()].binary;
                    const rt = registers[params.rt.getValue()].binary;

                    if (rs.getSignedValue() >= rt.getSignedValue()) {
                        vm.console.addLine(`Trap by ${this.symbol}`, "warn");
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Trap if Greater or Equal",
                        desc: "if (rs >= rt) as signed integers then trap",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "TGEU",
                        ["rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b110001, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs.getValue()].binary;
                    const rt = registers[params.rt.getValue()].binary;

                    if (rs.getUnsignedValue() >= rt.getUnsignedValue()) {
                        vm.console.addLine(`Trap by ${this.symbol}`, "warn");
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Trap if Greater or Equal Unsigned",
                        desc: "if (rs >= rt) as unsigned integers then trap",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "TGEI",
                        ["rs, immediate"],
                        "I",
                        new Binary(0b000001, 6),
                        undefined,
                    );
                    this.fixedRt = new Binary(0b01000, 5);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs.getValue()].binary;
                    const imm = params.immediate!;

                    if (rs.getSignedValue() >= imm.getValue()) {
                        vm.console.addLine(`Trap by ${this.symbol}`, "warn");
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Trap if Greater or Equal Immediate",
                        desc: "if (rs >= immediate) as signed integers then trap",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "TGEIU",
                        ["rs, immediate"],
                        "I",
                        new Binary(0b000001, 6),
                        undefined,
                    );
                    this.fixedRt = new Binary(0b01001, 5);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs.getValue()].binary;
                    const imm = params.immediate!;

                    if (rs.getUnsignedValue() >= imm.getUnsignedValue()) {
                        vm.console.addLine(`Trap by ${this.symbol}`, "warn");
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Trap if Greater or Equal Immediate Unsigned",
                        desc: "if (rs >= immediate) as unsigned integers then trap",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "TLT",
                        ["rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b110010, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs.getValue()].binary;
                    const rt = registers[params.rt.getValue()].binary;

                    if (rs.getSignedValue() < rt.getSignedValue()) {
                        vm.console.addLine(`Trap by ${this.symbol}`, "warn");
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Trap if Less Than",
                        desc: "if (rs < rt) as signed integers then trap",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "TLTI",
                        ["rs, immediate"],
                        "I",
                        new Binary(0b000001, 6),
                        undefined,
                    );
                    this.fixedRt = new Binary(0b01010, 5);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs.getValue()].binary;
                    const imm = params.immediate!;

                    if (rs.getSignedValue() < imm.getSignedValue()) {
                        vm.console.addLine(`Trap by ${this.symbol}`, "warn");
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Trap if Less Than Immediate",
                        desc: "if (rs < immediate) as signed integers then trap",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "TLTIU",
                        ["rs, immediate"],
                        "I",
                        new Binary(0b000001, 6),
                        undefined,
                    );
                    this.fixedRt = new Binary(0b01011, 5);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs.getValue()].binary;
                    const imm = params.immediate!;

                    if (rs.getUnsignedValue() < imm.getUnsignedValue()) {
                        vm.console.addLine(`Trap by ${this.symbol}`, "warn");
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Trap if Less Than Immediate Unsigned",
                        desc: "if (rs < immediate) as unsigned integers then trap",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "TLTU",
                        ["rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b110011, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs.getValue()].binary;
                    const rt = registers[params.rt.getValue()].binary;

                    if (rs.getUnsignedValue() < rt.getUnsignedValue()) {
                        vm.console.addLine(`Trap by ${this.symbol}`, "warn");
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Trap if Less Than Unsigned",
                        desc: "if (rs < rt) as unsigned integers then trap",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "TEQ",
                        ["rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b110100, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs.getValue()].binary;
                    const rt = registers[params.rt.getValue()].binary;

                    if (rs.getUnsignedValue() === rt.getUnsignedValue()) {
                        vm.console.addLine(`Trap by ${this.symbol}`, "warn");
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Trap if EQual",
                        desc: "if (rs == rt) then trap",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "TEQI",
                        ["rs, immediate"],
                        "I",
                        new Binary(0b000001, 6),
                        undefined,
                    );
                    this.fixedRt = new Binary(0b01100, 5);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs.getValue()].binary;
                    const imm = params.immediate!;

                    if (rs.getUnsignedValue() === imm.getUnsignedValue()) {
                        vm.console.addLine(`Trap by ${this.symbol}`, "warn");
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Trap if EQual Immediate",
                        desc: "if (rs == immediate) then trap",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "TNE",
                        ["rs, rt"],
                        "R",
                        new Binary(0b000000, 6),
                        new Binary(0b110110, 6),
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs.getValue()].binary;
                    const rt = registers[params.rt.getValue()].binary;

                    if (rs.getUnsignedValue() !== rt.getUnsignedValue()) {
                        vm.console.addLine(`Trap by ${this.symbol}`, "warn");
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Trap if Not Equal",
                        desc: "if (rs != rt) then trap",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "TNEI",
                        ["rs, immediate"],
                        "I",
                        new Binary(0b000001, 6),
                        undefined,
                    );
                    this.fixedRt = new Binary(0b01110, 5);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs.getValue()].binary;
                    const imm = params.immediate!;

                    if (rs.getUnsignedValue() !== imm.getUnsignedValue()) {
                        vm.console.addLine(`Trap by ${this.symbol}`, "warn");
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Trap if Not Equal Immediate",
                        desc: "if (rs != immediate) then trap",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "J",
                        ["target"],
                        "J",
                        new Binary(0b000010, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const target = params.target.getValue();

                    const newPC =
                        (cpu.pc.getValue() & 0xf0000000) | (target << 2);
                    cpu.pc.set(newPC);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Jump",
                        desc: "jump to the target address",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "JAL",
                        ["target"],
                        "J",
                        new Binary(0b000011, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const target = params.target.getValue();

                    registers[31].binary.set(cpu.pc.getValue() + 4);

                    const newPC =
                        (cpu.pc.getValue() & 0xf0000000) | (target << 2);
                    cpu.pc.set(newPC);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Jump And Link",
                        desc: "execute a procedure call to the target address and set $ra to the return address",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "BAL",
                        ["offset"],
                        "I",
                        new Binary(0b000001, 6),
                        undefined,
                    );
                    this.fixedRt = new Binary(0b10001, 5);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const offset =
                        Utils.fromSigned(params.immediate!.getValue(), 16) << 2;

                    registers[31].binary.set(cpu.pc.getValue() + 4);
                    cpu.pc.set(cpu.pc.getValue() + 4 + offset);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Branch And Link",
                        desc: "do an unconditional PC-relative procedure call to offset",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "BEQ",
                        ["rs, rt, offset"],
                        "I",
                        new Binary(0b000100, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs!.getValue()].binary;
                    const rt = registers[params.rt!.getValue()].binary;
                    const offset =
                        Utils.fromSigned(params.immediate!.getValue(), 16) << 2;

                    if (rs.getUnsignedValue() === rt.getUnsignedValue()) {
                        cpu.pc.set(cpu.pc.getValue() + 4 + offset);
                    } else {
                        cpu.pc.set(cpu.pc.getValue() + 4);
                    }
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Branch on EQual",
                        desc: "if (rs == rt) then do a PC-relative branch to offset",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "B",
                        ["offset"],
                        "I",
                        new Binary(0b000100, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const offset =
                        Utils.fromSigned(params.immediate!.getValue(), 16) << 2;

                    cpu.pc.set(cpu.pc.getValue() + 4 + offset);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Branch",
                        desc: "do an unconditional branch to offset",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "BGEZ",
                        ["rs, offset"],
                        "I",
                        new Binary(0b000001, 6),
                        undefined,
                    );
                    this.fixedRt = new Binary(0b00001, 5);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs!.getValue()].binary;
                    const offset =
                        Utils.fromSigned(params.immediate!.getValue(), 16) << 2;

                    if (rs.getSignedValue() >= 0) {
                        cpu.pc.set(cpu.pc.getValue() + 4 + offset);
                    } else {
                        cpu.pc.set(cpu.pc.getValue() + 4);
                    }
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Branch on Greater than or Equal to Zero",
                        desc: "if (rs >= 0) then do a PC-relative branch to offset",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "BGEZAL",
                        ["rs, offset"],
                        "I",
                        new Binary(0b000001, 6),
                        undefined,
                    );
                    this.fixedRt = new Binary(0b10001, 5);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs!.getValue()].binary;
                    const offset =
                        Utils.fromSigned(params.immediate!.getValue(), 16) << 2;
                    registers[31].binary.set(cpu.pc.getValue() + 4);

                    if (rs.getSignedValue() >= 0) {
                        cpu.pc.set(cpu.pc.getValue() + 4 + offset);
                    } else {
                        cpu.pc.set(cpu.pc.getValue() + 4);
                    }
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName:
                            "Branch on Greater than or Equal to Zero And Link",
                        desc: "if (rs >= 0) then do a PC-relative branch to offset and set $ra to the return address",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "BGTZ",
                        ["rs, offset"],
                        "I",
                        new Binary(0b000111, 6),
                        undefined,
                    );
                    this.fixedRt = new Binary(0b00000, 5);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs!.getValue()].binary;
                    const offset =
                        Utils.fromSigned(params.immediate!.getValue(), 16) << 2;

                    if (rs.getSignedValue() > 0) {
                        cpu.pc.set(cpu.pc.getValue() + 4 + offset);
                    } else {
                        cpu.pc.set(cpu.pc.getValue() + 4);
                    }
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Branch on Greater Than Zero",
                        desc: "if (rs > 0) then do a PC-relative branch to offset",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "BNE",
                        ["rs, rt, offset"],
                        "I",
                        new Binary(0b000101, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs!.getValue()].binary;
                    const rt = registers[params.rt!.getValue()].binary;
                    const offset =
                        Utils.fromSigned(params.immediate!.getValue(), 16) << 2;

                    if (rs.getUnsignedValue() !== rt.getUnsignedValue()) {
                        cpu.pc.set(cpu.pc.getValue() + 4 + offset);
                    } else {
                        cpu.pc.set(cpu.pc.getValue() + 4);
                    }
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Branch on Not Equal",
                        desc: "if (rs != rt) then do a PC-relative branch to offset",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "BLEZ",
                        ["rs, offset"],
                        "I",
                        new Binary(0b000110, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs!.getValue()].binary;
                    const offset =
                        Utils.fromSigned(params.immediate!.getValue(), 16) << 2;

                    if (rs.getValue() <= 0) {
                        cpu.pc.set(cpu.pc.getValue() + 4 + offset);
                    } else {
                        cpu.pc.set(cpu.pc.getValue() + 4);
                    }
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Branch on Less than or Equal to Zero",
                        desc: "if (rs <= 0) then do a PC-relative branch to offset",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "BLTZ",
                        ["rs, offset"],
                        "I",
                        new Binary(0b000001, 6),
                        undefined,
                    );
                    this.fixedRt = new Binary(0, 5);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs!.getValue()].binary;
                    const offset =
                        Utils.fromSigned(params.immediate!.getValue(), 16) << 2;

                    if (rs.getValue() <= 0) {
                        cpu.pc.set(cpu.pc.getValue() + 4 + offset);
                    } else {
                        cpu.pc.set(cpu.pc.getValue() + 4);
                    }
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Branch on Less Than Zero",
                        desc: "if (rs < 0) then do a PC-relative branch to offset",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "BLTZAL",
                        ["rs, offset"],
                        "I",
                        new Binary(0b000001, 6),
                        undefined,
                    );
                    this.fixedRt = new Binary(0b10000, 5);
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rs = registers[params.rs!.getValue()].binary;
                    const offset =
                        Utils.fromSigned(params.immediate!.getValue(), 16) << 2;
                    registers[31].binary.set(cpu.pc.getValue() + 4);

                    if (rs.getValue() <= 0) {
                        cpu.pc.set(cpu.pc.getValue() + 4 + offset);
                    } else {
                        cpu.pc.set(cpu.pc.getValue() + 4);
                    }
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Branch on Less Than Zero And Link",
                        desc: "if (rs < 0) then do a PC-relative branch to offset and set $ra to the return address",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "ADDI",
                        ["rt, rs, immediate"],
                        "I",
                        new Binary(0b001000, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const immediate = params.immediate!.getValue();

                    const rsValue = rs.getSignedValue();
                    const result = rsValue + immediate;

                    const overflow =
                        (rsValue >= 0 && immediate >= 0 && result < 0) ||
                        (rsValue < 0 && immediate < 0 && result >= 0);

                    if (overflow) {
                        throw new Error(
                            `Arithmetic Overflow in ADDI instruction`,
                        );
                    }

                    rt.set(result, true);
                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "ADD Immediate word",
                        desc: "Set rt to rs + immediate; if the addition results in 2's complement arithmetic overflow then trap",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "ADDIU",
                        ["rt, rs, immediate"],
                        "I",
                        new Binary(0b001001, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const immediate = params.immediate!.getValue();

                    rt.set(rs.getValue() + immediate);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "ADD Immediate Unsigned word",
                        desc: "Set rt to rs + immediate; doesn't trap on overflow",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SLTI",
                        ["rt, rs, immediate"],
                        "I",
                        new Binary(0b001010, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt.getValue()].binary;
                    const rs = registers[params.rs.getValue()].binary;
                    const imm = params.immediate!;

                    if (rs.getSignedValue() < imm.getSignedValue()) {
                        rt.set(1);
                    } else {
                        rt.set(0);
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Set on Less Than Immediate",
                        desc: "set rd to 1 if (rs < immediate) as signed integers, set rd to 0 otherwise",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SLTIU",
                        ["rt, rs, immediate"],
                        "I",
                        new Binary(0b001011, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt.getValue()].binary;
                    const rs = registers[params.rs.getValue()].binary;
                    const imm = params.immediate!;

                    if (rs.getUnsignedValue() < imm.getUnsignedValue()) {
                        rt.set(1);
                    } else {
                        rt.set(0);
                    }

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Set on Less Than Immediate Unsigned",
                        desc: "set rd to 1 if (rs < immediate) as unsigned integers, set rd to 0 otherwise",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "ANDI",
                        ["rt, rs, immediate"],
                        "I",
                        new Binary(0b001100, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt.getValue()].binary;
                    const rs = registers[params.rs.getValue()].binary;
                    const imm = params.immediate!;

                    const value =
                        (rs.getUnsignedValue() & imm.getUnsignedValue()) >>> 0;
                    rt.set(value, false);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "AND Immediate",
                        desc: "set rt to the result of the bitwise operation rs AND immediate",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "ORI",
                        ["rt, rs, immediate"],
                        "I",
                        new Binary(0b001101, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt.getValue()].binary;
                    const rs = registers[params.rs.getValue()].binary;
                    const imm = params.immediate!;

                    const value =
                        (rs.getUnsignedValue() | imm.getUnsignedValue()) >>> 0;
                    rt.set(value, false);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "OR Immediate",
                        desc: "set rt to the result of the bitwise operation rs OR immediate",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "XORI",
                        ["rt, rs, immediate"],
                        "I",
                        new Binary(0b001110, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt.getValue()].binary;
                    const rs = registers[params.rs.getValue()].binary;
                    const imm = params.immediate!;

                    const value =
                        (rs.getUnsignedValue() ^ imm.getUnsignedValue()) >>> 0;
                    rt.set(value, false);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "XOR Immediate",
                        desc: "set rt to the result of the bitwise operation rs AND immediate",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "LUI",
                        ["rt, immediate"],
                        "I",
                        new Binary(0b001111, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt!.getValue()].binary;
                    const immediate = params.immediate!.getValue();

                    rt.set(immediate << 16);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Load Upper Immediate",
                        desc: "load the 16-bit immediate in the upper half of rt concatenated with 16 bits of low-order zeros.",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "BEQL",
                        ["rs, rt, offset"],
                        "I",
                        new Binary(0b010100, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.symbol} not implemented yet`);
                }
                getHelp(): null {
                    return null;
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "BNEL",
                        ["rs, rt, offset"],
                        "I",
                        new Binary(0b010101, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.symbol} not implemented yet`);
                }
                getHelp(): null {
                    return null;
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "BLEZL",
                        ["rs, offset"],
                        "I",
                        new Binary(0b010110, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.symbol} not implemented yet`);
                }
                getHelp(): null {
                    return null;
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "LB",
                        ["rt, offset(base)"],
                        "I",
                        new Binary(0b100000, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const immediate = params.immediate!.getValue();

                    const address = rs.getValue() + immediate;
                    const value = cpu.memory.loadByte(new Binary(address));
                    rt.set(value.getValue(), true);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Load Byte",
                        desc: "load a byte from the effective address into rt and extend its sign",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "LH",
                        ["rt, offset(base)"],
                        "I",
                        new Binary(0b100001, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const immediate = params.immediate!.getValue();

                    const address = rs.getValue() + immediate;
                    const value = cpu.memory.loadHalf(new Binary(address));
                    rt.set(value.getValue(), true);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Load Halfword",
                        desc: "load a half word from the effective address into rt and extend its sign",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "LWL",
                        ["rt, offset(base)"],
                        "I",
                        new Binary(0b100010, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const immediate = params.immediate!.getValue();

                    const address = rs.getValue() + immediate;
                    const inWordOffset = address % 4;
                    const alignedAddress = address - inWordOffset;
                    const word = cpu.memory.loadWord(
                        new Binary(alignedAddress),
                    );
                    const from = 8 * inWordOffset - 1;
                    const to = 0;
                    rt.setBits(word.getBits(from, to), from, to);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Load Word Left",
                        desc: "load the most-significant part of a word from an unaligned memory address into rt preserving its other half",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "LW",
                        ["rt, offset(base)"],
                        "I",
                        new Binary(0b100011, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const immediate = params.immediate!.getValue();

                    const address = rs.getValue() + immediate;
                    const value = cpu.memory.loadWord(
                        new Binary(address),
                        true,
                    );
                    rt.set(value.getValue());

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Load Word",
                        desc: "load a word from the effective address",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "LBU",
                        ["rt, offset(base)"],
                        "I",
                        new Binary(0b100100, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const immediate = params.immediate!.getValue();

                    const address = rs.getValue() + immediate;
                    const value = cpu.memory.loadByte(new Binary(address));
                    rt.set(value.getUnsignedValue(), false);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Load Byte Unsigned",
                        desc: "load a byte from the effective address into rt and zero extend the value",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "LHU",
                        ["rt, offset(base)"],
                        "I",
                        new Binary(0b100101, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const immediate = params.immediate!.getValue();

                    const address = rs.getValue() + immediate;
                    const value = cpu.memory.loadHalf(new Binary(address));
                    rt.set(value.getUnsignedValue(), false);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Load Halfword Unsigned",
                        desc: "load a halfword from the effective address into rt and zero extend the value",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "LWR",
                        ["rt, offset(base)"],
                        "I",
                        new Binary(0b100110, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const immediate = params.immediate!.getValue();

                    const address = rs.getValue() + immediate;
                    const inWordOffset = address % 4;
                    const alignedAddress = address - inWordOffset;
                    const word = cpu.memory.loadWord(
                        new Binary(alignedAddress),
                    );
                    const from = 31;
                    const to = 31 - 8 * inWordOffset;
                    rt.setBits(word.getBits(from, to), from, to);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Load Word Right",
                        desc: "load the least-significant part of a word from an unaligned memory address into rt preserving its other half",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SB",
                        ["rt, offset(base)"],
                        "I",
                        new Binary(0b101000, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const immediate = params.immediate!.getValue();

                    const address = rs.getValue() + immediate;
                    const value = rt.getBits(7, 0, false);
                    cpu.memory.storeByte(new Binary(address), value);

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Store Byte",
                        desc: "Store the least significant byte of rt to the effective address",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SH",
                        ["rt, offset(base)"],
                        "I",
                        new Binary(0b101001, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const immediate = params.immediate!.getValue();

                    const address = rs.getValue() + immediate;
                    cpu.memory.storeHalf(
                        new Binary(address),
                        rt.getBits(15, 0, false),
                    );

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Store Halfword",
                        desc: "Store the least significant halfword of rt to the effective address",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SWL",
                        ["rt, offset(base)"],
                        "I",
                        new Binary(0b101010, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const immediate = params.immediate!.getValue();

                    const address = rs.getValue() + immediate;
                    cpu.memory.storeByte(
                        new Binary(address),
                        rt.getBits(31, 24),
                    );
                    cpu.memory.storeByte(
                        new Binary(address + 1),
                        rt.getBits(23, 16),
                    );

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Store Word Left",
                        desc: "store the most-significant part of rt to an unaligned memory address",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SW",
                        ["rt, offset(base)"],
                        "I",
                        new Binary(0b101011, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const immediate = params.immediate!.getValue();

                    const address = rs.getValue() + immediate;
                    cpu.memory.storeWord(new Binary(address), rt.copy());

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Store Word",
                        desc: "store the contents of rt to the effective address",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SWR",
                        ["rt, offset(base)"],
                        "I",
                        new Binary(0b101110, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    const registers = cpu.getRegisters();
                    const rt = registers[params.rt!.getValue()].binary;
                    const rs = registers[params.rs!.getValue()].binary;
                    const immediate = params.immediate!.getValue();

                    const address = rs.getValue() + immediate;
                    cpu.memory.storeByte(
                        new Binary(address),
                        rt.getBits(15, 8),
                    );
                    cpu.memory.storeByte(
                        new Binary(address + 1),
                        rt.getBits(7, 0),
                    );

                    cpu.pc.set(cpu.pc.getValue() + 4);
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Store Word Right",
                        desc: "store the least-significant part of rt to an unaligned memory address",
                    };
                }
            })(),
        );
        this.instructions.push(
            new (class extends Instruction {
                constructor() {
                    super(
                        "SC",
                        ["rt, offset(base)"],
                        "I",
                        new Binary(0b111000, 6),
                        undefined,
                    );
                }
                async execute(
                    cpu: CPU,
                    params: { [key: string]: Binary },
                    vm: VirtualMachine,
                ): Promise<void> {
                    throw new Error(`${this.symbol} not implemented yet`);
                }
                getHelp(): null {
                    return null;
                }
            })(),
        );
    }

    initPseudoInstructions() {
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("NOP", "");
                }
                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    return [["sll", "$zero", "$zero", "0"]];
                }
                size(): number {
                    return 1;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "No OPeration",
                        desc: "execute a filler operation that doesn't affect the status of the CPU",
                    };
                }
            })(),
        );
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("MOVE", "rd, rs");
                }
                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    return [["addu", params["rd"], params["rs"], "$zero"]];
                }
                size(): number {
                    return 1;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Move register",
                        desc: "copy the content of rs in rd",
                    };
                }
            })(),
        );
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("NOT", "rd, rs");
                }
                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    return [["nor", params["rd"], params["rs"], "$zero"]];
                }
                size(): number {
                    return 1;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "NOT",
                        desc: "set rd to the bitwise negation of rs",
                    };
                }
            })(),
        );
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("NEG", "rd, rs");
                }
                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    return [["sub", params["rd"], "$zero", params["rs"]]];
                }
                size(): number {
                    return 1;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "NEGate word",
                        desc: "set rd to the negation of rs ( $zero - rs ); if the subtraction results in 2's complement arithmetic overflow then trap",
                    };
                }
            })(),
        );
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("NEGU", "rd, rs");
                }
                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    return [["subu", params["rd"], "$zero", params["rs"]]];
                }
                size(): number {
                    return 1;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "NEGate Unsigned word",
                        desc: "set rd to the negation of rs ( $zero - rs ); doesn't trap on overflow",
                    };
                }
            })(),
        );
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("ABS", "rd, rs");
                }
                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    let skipLabel = "L1";
                    while (labels.has(skipLabel)) {
                        let n = Math.floor(Math.random() * 10);
                        skipLabel = `${skipLabel}${n}`;
                    }
                    labels.set(skipLabel, new Binary(address.getValue() + 12));
                    return [
                        ["addu", params["rd"], params["rs"], "$zero"],
                        ["bgez", params["rs"], skipLabel],
                        ["sub", params["rd"], "$zero", params["rs"]],
                    ];
                }
                size(): number {
                    return 3;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "ABSolute value of word",
                        desc: "set rd to the absolute value of rs (|rs|)",
                    };
                }
            })(),
        );
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("LI", "rd, immediate");
                }
                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);

                    return loadImmediate(params["immediate"], params["rd"]);
                }
                size(): null {
                    return null;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Load Immediate",
                        desc: "load a constant (immediate) in rd",
                    };
                }
            })(),
        );
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("LA", "rd, label");
                }
                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    const label = params["label"];
                    const labelAddress = getLabelAddress(
                        label,
                        labels,
                        globals,
                    );
                    if (labelAddress === undefined) {
                        throw new Error(`Label "${label}" not found.`);
                    }

                    const upper = Utils.fromSigned(
                        (labelAddress >>> 16) & 0xffff,
                        16,
                    );
                    const lower = labelAddress & 0xffff;

                    return [
                        ["lui", "$at", `${upper}`],
                        ["ori", params["rd"], "$at", `${lower}`],
                    ];
                }
                size(): number {
                    return 2;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Load Address",
                        desc: "load the effective address of label in rd",
                    };
                }
            })(),
        );
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("BEQZ", "rs, label");
                }
                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    return [["beq", params["rs"], "$zero", params["label"]]];
                }
                size(): number {
                    return 1;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Branch on EQual to Zero",
                        desc: "if (rs == 0) then do a PC-relative branch to label",
                    };
                }
            })(),
        );
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("BNEZ", "rs, label");
                }
                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    return [["bne", params["rs"], "$zero", params["label"]]];
                }
                size(): number {
                    return 1;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Branch on Not Equal to Zero",
                        desc: "if (rs != 0) then do a PC-relative branch to label",
                    };
                }
            })(),
        );
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("BLT", "rs, rt, label");
                }
                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    if (
                        !params["rt"].startsWith("$") &&
                        getOptions()["allow-literals"]
                    )
                        return [
                            ...loadImmediate(params["rt"]),
                            ["slt", "$at", params["rs"], "$at"],
                            ["bne", "$at", "$zero", params["label"]],
                        ];
                    return [
                        ["slt", "$at", params["rs"], params["rt"]],
                        ["bne", "$at", "$zero", params["label"]],
                    ];
                }
                size(): null {
                    return null;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Branch on Less Than",
                        desc: "if (rs < rt) then do a PC-relative branch to label",
                    };
                }
            })(),
        );
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("BLE", "rs, rt, label");
                }

                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    if (
                        !params["rt"].startsWith("$") &&
                        getOptions()["allow-literals"]
                    )
                        return [
                            ...loadImmediate(params["rt"]),
                            ["slt", "$at", "$at", params["rs"]],
                            ["beq", "$at", "$zero", params["label"]],
                        ];
                    return [
                        ["slt", "$at", params["rt"], params["rs"]],
                        ["beq", "$at", "$zero", params["label"]],
                    ];
                }
                size(): null {
                    return null;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Branch on Less than or Equal",
                        desc: "if (rs <= rt) then do a PC-relative branch to label",
                    };
                }
            })(),
        );
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("BGT", "rs, rt, label");
                }

                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    if (
                        !params["rt"].startsWith("$") &&
                        getOptions()["allow-literals"]
                    )
                        return [
                            ...loadImmediate(params["rt"]),
                            ["slt", "$at", "$at", params["rs"]],
                            ["bne", "$at", "$zero", params["label"]],
                        ];
                    return [
                        ["slt", "$at", params["rt"], params["rs"]],
                        ["bne", "$at", "$zero", params["label"]],
                    ];
                }
                size(): null {
                    return null;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Branch on Greater Than",
                        desc: "if (rs > rt) then do a PC-relative branch to label",
                    };
                }
            })(),
        );
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("BGE", "rs, rt, label");
                }

                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    if (
                        !params["rt"].startsWith("$") &&
                        getOptions()["allow-literals"]
                    )
                        return [
                            ...loadImmediate(params["rt"]),
                            ["slt", "$at", params["rs"], "$at"],
                            ["beq", "$at", "$zero", params["label"]],
                        ];
                    return [
                        ["slt", "$at", params["rs"], params["rt"]],
                        ["beq", "$at", "$zero", params["label"]],
                    ];
                }
                size(): null {
                    return null;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Branch on Greater than or Equal",
                        desc: "if (rs >= rt) then do a PC-relative branch to label",
                    };
                }
            })(),
        );
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("MUL", "rd, rs, rt");
                }

                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    if (
                        !params["rt"].startsWith("$") &&
                        getOptions()["allow-literals"]
                    )
                        return [
                            ...loadImmediate(params["rt"]),
                            ["mult", params["rs"], "$at"],
                            ["mflo", params["rd"]],
                        ];
                    return [
                        ["mult", params["rs"], params["rt"]],
                        ["mflo", params["rd"]],
                    ];
                }
                size(): null {
                    return null;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "MULtiply word to register",
                        desc: "set rd to the low-order word of the result of rs x rt as signed integers",
                    };
                }
            })(),
        );

        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("DIV", "rd, rs, rt");
                }

                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    if (
                        !params["rt"].startsWith("$") &&
                        getOptions()["allow-literals"]
                    )
                        return [
                            ...loadImmediate(params["rt"]),
                            ["bne", "$at", "$zero", "1"],
                            ["break"],
                            ["div", params["rs"], "$at"],
                            ["mflo", params["rd"]],
                        ];
                    return [
                        ["bne", params["rt"], "$zero", "1"],
                        ["break"],
                        ["div", params["rs"], params["rt"]],
                        ["mflo", params["rd"]],
                    ];
                }
                size(): null {
                    return null;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "DIVide word to register",
                        desc: "set rd to the quotient of the division rs / rt",
                    };
                }
            })(),
        );

        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("SEQ", "rd, rs, rt");
                }

                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    if (
                        !params["rt"].startsWith("$") &&
                        getOptions()["allow-literals"]
                    )
                        return [
                            ...loadImmediate(params["rt"]),
                            ["xor", params["rd"], params["rs"], "$at"],
                            ["sltiu", params["rd"], params["rd"], "1"],
                        ];
                    return [
                        ["xor", params["rd"], params["rs"], params["rt"]],
                        ["sltiu", params["rd"], params["rd"], "1"],
                    ];
                }
                size(): null {
                    return null;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "Set on EQual",
                        desc: "set rd to 1 if (rs == rt) as signed integers, set rd to 0 otherwise",
                    };
                }
            })(),
        );

        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("SUBI", "rd, rs, imm");
                }

                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    return [
                        ...loadImmediate(params["imm"], "$at"),
                        ["sub", params["rd"], params["rs"], "$at"],
                    ];
                }
                size(): null {
                    return null;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "SUBtract Immediate word",
                        desc: "Set rd to rs - immediate; if the addition results in 2's complement arithmetic overflow then trap",
                    };
                }
            })(),
        );
        this.pseudoInstructions.push(
            new (class extends PseudoInstruction {
                constructor() {
                    super("MULU", "rd, rs, rt");
                }

                expand(
                    assembler: Assembler,
                    tokens: string[],
                    globals: Map<string, Binary | undefined>,
                    labels: Map<string, Binary | undefined>,
                    address: Binary,
                ): string[][] {
                    const params = this.mapParams(tokens);
                    if (
                        !params["rt"].startsWith("$") &&
                        getOptions()["allow-literals"]
                    )
                        return [
                            ...loadImmediate(params["rt"]),
                            ["MULTU", params["rs"], "$at"],
                            ["MFLO", params["rd"]],
                        ];
                    return [
                        ["MULTU", params["rs"], params["rt"]],
                        ["MFLO", params["rd"]],
                    ];
                }
                size(): number {
                    return 2;
                }
                getHelp(): { longName: string; desc: string } {
                    return {
                        longName: "MULtiply Unsigned word",
                        desc: "set rd to the low-order word of the result of rs x rt as unsigned integers",
                    };
                }
            })(),
        );
    }
}

/**Load an immediate into $at or destRegister if specified.
 * Uses one or two instructions based on the size of the immediate to load.*/
export function loadImmediate(
    immediate: string | number,
    destRegister?: string,
): string[][] {
    const imm =
        typeof immediate === "string"
            ? parseInlineLiteral(immediate)
            : immediate;
    if (!destRegister) destRegister = "$at";
    if (imm < -32768 || imm > 32767) {
        const upper = Utils.fromSigned((imm >>> 16) & 0xffff, 16);
        const lower = imm & 0xffff;

        return [
            ["lui", "$at", `${upper}`],
            ["ori", destRegister, "$at", `${lower}`],
        ];
    } else {
        return [["addiu", destRegister, "$zero", `${immediate}`]];
    }
}

export function getLabelAddress(
    label: string,
    labels: Map<string, Binary | undefined>,
    globals: Map<string, Binary | undefined>,
): number | undefined {
    let labelAddress = labels.get(label)?.getValue();
    if (labelAddress === undefined) {
        labelAddress = globals.get(label)?.getValue();
    }
    return labelAddress;
}
