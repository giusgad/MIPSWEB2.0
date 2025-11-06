import { getOptions } from "./settings.js";
import { vm } from "./virtual-machine.js";
import { ParamsFormat } from "./virtual-machine/Instructions.js";

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

const paramMap: Map<string, string> = new Map([
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
function mapParams(params: string[]): string[] {
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
            .map((p) => paramMap.get(p) ?? p)
            .join(", "),
    );
}
function mapDesc(desc: string): string {
    let res = `${desc}`;
    for (const [key, replacement] of paramMap) {
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
                params: mapParams(instr.params),
                description: mapDesc(help.desc),
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
                params: mapParams([instr.params.join(", ")]),
                description: mapDesc(help.desc),
            });
    });
    res.sort((a, b) => a.symbol.localeCompare(b.symbol));
    return res;
};

(window as any).getSyscallHelp = function (): SyscallHelp[] {
    const res: SyscallHelp[] = [];
    for (const syscall of vm.cpu.syscallsSet.syscalls) {
        res.push({
            code: syscall.code,
            name: syscall.name,
            description: syscall.getHelp() ?? "Not implemented",
        });
    }
    res.sort((a, b) => a.code - b.code);
    return res;
};
