import { vm } from "./virtual-machine.js";

type instructionHelp = {
    symbol: string;
    longName: string;
    params: string[];
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
    ["offset(base)", "4($s3)"],
    ["SYSCALL", ""],
]);
function mapParams(params: string): string {
    return params
        .split(", ")
        .map((p) => paramMap.get(p))
        .join(", ");
}
function mapDesc(desc: string): string {
    let res = `${desc}`;
    for (const [key, replacement] of paramMap) {
        res = res.replace(key, replacement);
    }
    return res;
}

(window as any).getInstructionsHelp = function (): instructionHelp[] {
    const res: instructionHelp[] = [];
    vm.cpu.instructionsSet.instructions.forEach((instr) => {
        const help = instr.getHelp();
        if (help)
            res.push({
                symbol: instr.symbol.toLowerCase(),
                longName: help.longName,
                params: instr.params.map((p) => mapParams(p)),
                description: mapDesc(help.desc),
            });
    });
    res.sort((a, b) => a.symbol.localeCompare(b.symbol));
    return res;
};
