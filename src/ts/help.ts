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
};
type SyscallHelp = {
    code: number;
    name: string;
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

(window as any).getInstructionsHelp = function (): InstructionHelp[] {
    const res: InstructionHelp[] = [];
    vm.cpu.instructionsSet.instructions.forEach((instr) => {
        const help = instr.getHelp();
        if (help)
            res.push({
                symbol: instr.symbol.toLowerCase(),
                longName: help.longName,
                params: mapParamsToExamples(instr.params),
                description: mapHelpToExamples(help.desc),
            });
    });
    res.sort((a, b) => a.symbol.localeCompare(b.symbol));
    return res;
};

(window as any).getPseudoInstructionsHelp = function (): InstructionHelp[] {
    const res: InstructionHelp[] = [];
    vm.cpu.instructionsSet.pseudoInstructions.forEach((instr) => {
        const help = instr.getHelp();
        if (help)
            res.push({
                symbol: instr.symbol.toLowerCase(),
                longName: help.longName,
                params: mapParamsToExamples([instr.params.join(", ")]),
                description: mapHelpToExamples(help.desc),
            });
    });
    res.sort((a, b) => a.symbol.localeCompare(b.symbol));
    return res;
};

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
