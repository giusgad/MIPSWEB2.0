import { mapHelpToExamples, mapParamsToExamples } from "../help.js";
import { vm } from "../virtual-machine.js";

type MipsCompletion = {
    instruction: string;
    params: string[];
    help: string | null;
    isPseudo: boolean;
};

const isa = vm.cpu.instructionsSet;
const regulars: MipsCompletion[] = isa.instructions
    .filter((instr) => instr.getHelp() != null)
    .map((instr) => {
        const help = instr.getHelp()!;
        return {
            instruction: instr.symbol.toLowerCase(),
            params: mapParamsToExamples(instr.params),
            help: mapHelpToExamples(help.desc),
            isPseudo: false,
        };
    });
const pseudos: MipsCompletion[] = isa.pseudoInstructions
    .filter((instr) => instr.getHelp() != null)
    .map((instr) => {
        const help = instr.getHelp()!;
        return {
            instruction: instr.symbol.toLowerCase(),
            params: mapParamsToExamples([instr.params.join(", ")]),
            help: mapHelpToExamples(help.desc),
            isPseudo: true,
        };
    });

function generateCompletions(...parts: (MipsCompletion | undefined)[]): any[] {
    const res: any[] = [];
    for (const cmp of parts) {
        if (cmp == null) continue;
        for (const params of cmp.params) {
            res.push({
                name: cmp.instruction,
                value: `${cmp.instruction} ${params}`,
                meta: cmp.isPseudo ? "pseudo" : "instr",
                score: 10,
                docHTML: `<p>${cmp.help}</p>`,
            });
        }
    }
    return res;
}

function generateDirectiveCompletions(): any[] {
    const res: any[] = [];
    for (const dir of [...vm.assembler.directives.keys(), ".data", ".text"]) {
        res.push({
            name: dir,
            value: dir,
            meta: "directive",
            score: [".data", ".text"].includes(dir) ? 20 : 10,
        });
    }
    return res;
}

export const MipsCompleter = {
    id: "MIPS",
    identifierRegexps: [/[\.a-zA-Z_0-9\$-]/], // allow '.' as part of prefix, for directives
    getCompletions: function (
        editor: any,
        session: AceAjax.IEditSession,
        pos: any,
        prefix: any,
        callback: any,
    ) {
        let foundComment = false;
        const line = session
            .getLine(pos.row)
            .trim()
            .split(/,\s*|\s+/)
            .filter((part) => {
                if (foundComment) return false;
                if (part.startsWith("#")) {
                    foundComment = true;
                    return false;
                } else if (part.includes("#")) foundComment = true;
                return true;
            });
        if (line.length === 0) {
            callback(null, []);
            return;
        } else if (
            line.length === 1 ||
            (line.length === 2 && line[0].endsWith(":")) ||
            (line.length === 3 && line[1] === ":")
        ) {
            if (line[0].startsWith(".")) {
                callback(null, generateDirectiveCompletions());
                return;
            }
            const regular = regulars.filter((c) =>
                c.instruction.startsWith(prefix),
            );
            const pseudo = pseudos.filter((c) =>
                c.instruction.startsWith(prefix),
            );
            callback(null, generateCompletions(...regular, ...pseudo));
        }
    },
};
