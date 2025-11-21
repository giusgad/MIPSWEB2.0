import { hideForm, showForm } from "./forms.js";
import { getFromStorage, setIntoStorage } from "./utils.js";
import { vm } from "./virtual-machine.js";
import { ParamsFormat } from "./virtual-machine/Instructions.js";

(window as any).getActiveHelpTab = function (): number {
    const item = getFromStorage("session", "help-tab-index");
    if (!item) return 0;
    const num = Number(item);
    if (!isNaN(num)) return num;
    sessionStorage.removeItem("help-tab-index");
    return 0;
};
(window as any).sectionTitleOnClick = async function (i: number) {
    setIntoStorage("session", "help-tab-index", i);
    await hideForm();
    await showForm("help", undefined, false);
};

type InstructionHelp = {
    symbol: string;
    longName: string;
    params: string[];
    description: string;
    meta: "instr" | "pseudo";
};
type SyscallHelp = {
    code: number;
    name: string;
    description: string;
};
type DirectiveHelp = {
    symbol: string;
    example: string;
    description: string;
};
type RegisterHelp = {
    regs: { num: string; name: string }[];
    longName: string;
    description: string;
};

export const paramExampleMap: Map<string, string> = new Map([
    ["rd", "$s0"],
    ["rt", "$s1"],
    ["rs", "$s2"],
    ["sa", "5"],
    ["target", "label"],
    ["offset", "label"],
    ["immediate", "1000"],
    ["imm", "1000"],
    ["offset(base)", "4($s2)"],
    ["SYSCALL", ""],
]);

/**Substitues rt, rs etc. with example registers like $s0 $s1 and things like "imm" with an example number like 1000, consistently with mapHelpToExamples*/
export function mapParamsToExamples(params: string[]): string[] {
    const preprocessor = vm.assembler.preprocessor;
    // preprocessor params that need to be added here to be shown in the help
    const extra: string[] = [];
    if (preprocessor.allowNumberRt.has(params[0] as ParamsFormat)) {
        extra.push(
            params[0]
                .split(", ")
                .map((p) => (p === "rt" ? "imm" : p))
                .join(", "),
        );
    } else if (params.includes("rt, offset(base)")) {
        extra.push(
            "rt, rs",
            "rt, imm",
            "rt, label-4",
            "rt, label+4",
            "rt, label",
        );
    }
    return [...params, ...extra].map((param) =>
        param
            .split(", ")
            .map((p) => paramExampleMap.get(p) ?? p)
            .join(", "),
    );
}

/**Substitues rt, rs etc. with example registers like $s0 $s1 and things like "imm" with an example number like 1000, consistently with mapParamsToExamples*/
export function mapHelpToExamples(desc: string): string {
    let res = `${desc}`;
    for (const [key, replacement] of paramExampleMap) {
        // needed to avoid replacing in words like part (rt) or integers (rs)
        // Match key when only when its preceded/followed by , ; ( ) or whitespace
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(
            `(?<=^|[\\s,;()])${escapedKey}(?=$|[\\s,;()])`,
            "g",
        );
        res = res.replace(regex, `<span class="code">${replacement}</span>`);
    }
    return res;
}

(window as any).getAllInstructionsHelp = function (): InstructionHelp[] {
    const res = [...getInstructionsHelp(), ...getPseudoInstructionsHelp()];
    res.sort((a, b) => a.symbol.localeCompare(b.symbol));
    res.map((i) => {
        i.longName = i.longName
            .split(/\s+/)
            .map((word) => `<span style="white-space: nowrap;">${word}</span>`)
            .join(" ");
        i.longName = i.longName.replace(
            /[A-Z]/g,
            (match) => `<span class="mnemonic">${match}</span>`,
        );
    });
    return res;
};

function getInstructionsHelp(): InstructionHelp[] {
    const res: InstructionHelp[] = [];
    vm.cpu.instructionsSet.instructions.forEach((instr) => {
        const help = instr.getHelp();
        if (help)
            res.push({
                symbol: instr.symbol.toLowerCase(),
                longName: help.longName,
                params: mapParamsToExamples(instr.params),
                description: mapHelpToExamples(help.desc),
                meta: "instr",
            });
    });
    return res;
}

function getPseudoInstructionsHelp(): InstructionHelp[] {
    const res: InstructionHelp[] = [];
    vm.cpu.instructionsSet.pseudoInstructions.forEach((instr) => {
        const help = instr.getHelp();
        if (help)
            res.push({
                symbol: instr.symbol.toLowerCase(),
                longName: help.longName,
                params: mapParamsToExamples([instr.params.join(", ")]),
                description: mapHelpToExamples(help.desc),
                meta: "pseudo",
            });
    });
    return res;
}

(window as any).getSyscallHelp = function (): SyscallHelp[] {
    const res: SyscallHelp[] = [];
    for (const syscall of vm.cpu.syscallsSet.syscalls) {
        const help = syscall.getHelp();
        if (!help) continue;
        res.push({
            code: syscall.code,
            name: syscall.name,
            description: help.replace(
                /\$(..)/g,
                '<span class="code">$$$1</span>',
            ),
        });
    }
    res.sort((a, b) => a.code - b.code);
    return res;
};

(window as any).getAsciiTableHelp = function (): string[] {
    const help = Array(128).fill("");
    help[0] = "terminator byte";
    help[8] = "backspace";
    help[9] = "horizontal tab";
    help[10] = "newline";
    help[11] = "vertical tab";
    help[12] = "form feed";
    help[13] = "carriage return";
    help[32] = "space";
    help[127] = "delete";
    return help;
};

export function getDirectivesHelp(): DirectiveHelp[] {
    const helps: DirectiveHelp[] = [];
    for (const [symbol, dir] of vm.assembler.directives.entries()) {
        const help = dir.getHelp();
        helps.push({
            symbol: symbol,
            example: help.example,
            description: help.desc,
        });
    }
    return [
        {
            symbol: ".data",
            example: ".data\n0x11223344",
            description: "begin data section",
        },
        {
            symbol: ".text",
            example: ".text\nli $t0 3",
            description: "begin text section",
        },
        ...helps,
    ];
}

(window as any).getDirectivesHelp = getDirectivesHelp;

(window as any).getRegistersHelp = function (): RegisterHelp[] {
    const res: RegisterHelp[] = [];
    const helps = [
        {
            from: 0,
            to: 0,
            longName: "ZERO",
            desc: `<span class="invariant">always set to 0</span>`,
        },
        {
            from: 1,
            to: 1,
            longName: "Assembler Temporary",
            desc: `<span class="invariant">used by the assembler</span> in pseudoinstruction expansions`,
        },
        {
            from: 2,
            to: 3,
            longName: "Value",
            desc: "general purpose registers, conventionally used for procedure return values",
        },
        {
            from: 4,
            to: 7,
            longName: "Argument",
            desc: "general purpose registers, conventionally used for procedure call arguments",
        },
        {
            from: 8,
            to: 15,
            longName: "Temporary",
            desc: "general purpose registers, conventionally procedure calls can overwrite their contents.",
        },
        {
            from: 16,
            to: 23,
            longName: "Saved",
            desc: "general purpose registers, conventionally procedure calls guarantee that the contents of these registers will be unchanged when they return",
        },
        {
            from: 24,
            to: 25,
            longName: "Temporary",
            desc: "See above",
        },
        {
            from: 26,
            to: 27,
            longName: "Kernel",
            desc: "reserved for kernel (OS) use",
        },
        {
            from: 28,
            to: 28,
            longName: "Global Pointer",
            desc: "stores the address of the middle of a 64K block of memory in the heap, which contains constants and global variables",
        },
        {
            from: 29,
            to: 29,
            longName: "Stack Pointer",
            desc: "stores the address of the last (smallest) position in the stack",
        },
        {
            from: 30,
            to: 30,
            longName: "Frame Pointer",
            desc: "stores the address of the base of the current function's stack frame",
        },
        {
            from: 31,
            to: 31,
            longName: "Return Address",
            desc: `stores the address of the caller of the current function, <span class="invariant">automatically set by procedure call instructions (like jump-and-link)</span>`,
        },
    ];
    const registers = vm.cpu.registers.registers;
    helps.forEach((help) => {
        const regs = [];
        for (let i = help.from; i <= help.to; i++) {
            regs.push({ num: `\$${i}`, name: registers[i].name });
        }
        res.push({
            regs: regs,
            longName: help.longName,
            description: help.desc,
        });
    });
    return [
        ...res,
        {
            regs: [{ name: "PC", num: "" }],
            longName: "Program Counter",
            description:
                "contains the memory address for the next instruction that the CPU will execute",
        },
        {
            regs: [{ name: "lo", num: "" }],
            longName: "LOw part register",
            description:
                "stores the lower half of a 64-bit product or quotient of a division",
        },
        {
            regs: [{ name: "hi", num: "" }],
            longName: "HIgh part register",
            description:
                "stores the upper half of a 64-bit product or remainder of a division",
        },
    ];
};
