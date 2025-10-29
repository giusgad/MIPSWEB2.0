import { getOptions } from "../settings.js";
import { parseInlineLiteral } from "../utils.js";
import {
    getLabelAddress,
    Instruction,
    loadImmediate,
    ParamsFormat,
} from "./Instructions.js";
import { Binary } from "./Utils.js";

/**Expands the instruction to:
 *  - allow a number instead of rt in some cases (for example `beq $t0 3 label`)
 *  - automatically convert it to its immediate correspondent (`add $t0 $t1 3` automatically becomes `addi`)
 *  - allow more syntax for offset(base), for example allowing a label (loaded into $at automatically)*/
export class InstructionPreprocessor {
    /**which paramsFormats allow a number to be passed instead of the "rt" register.
     * The number will be loaded in to $at and rt in the instruction will be $at*/
    allowNumberRt: Set<ParamsFormat>;
    constructor() {
        this.allowNumberRt = new Set([
            "rd, rs, rt", // R format operations (add, sub...)
            "rs, rt, offset", // branches
        ]);
    }

    mapParams(
        tokens: string[],
        paramsFormat: ParamsFormat,
    ): { [key: string]: string } {
        const formatParts = paramsFormat.split(",");
        const paramMap: { [key: string]: string } = {};

        for (let i = 0; i < formatParts.length; i++) {
            paramMap[formatParts[i].trim()] = tokens[i + 1];
        }

        return paramMap;
    }

    preprocess(
        instr: Instruction | undefined,
        tokens: string[],
        labels: Map<string, Binary | undefined>,
        globals: Map<string, Binary | undefined>,
        withLabels: boolean = true,
    ): string[][] {
        if (!instr || !getOptions()["allow-literals"]) return [tokens];

        const params = instr.params[0];
        const mapped = this.mapParams(tokens, params);

        if (params === "rt, offset(base)") {
            if (!tokens[2] || tokens.length !== 3) return [tokens];
            const offsetBaseMatch = tokens[2].match(/(-?\d+)\((\$\w+)\)/);
            // supported possibilities:
            // - register without offset: lw $t0 $t1 | lw $t0 ($t1)
            // - literal address (number): lw $t0 1000
            // - label+offset: lw $t0 data+4 | lw $t0 data-4
            // - label: lw $t0 data
            if (!offsetBaseMatch) {
                // register without offset
                const reg = tokens[2].trim().match(/^(\$\w+)$|^\((\$\w+)\)$/);
                if (reg) {
                    const register = reg?.[1] ?? reg?.[2];
                    return [[instr.symbol, mapped["rt"], `0(${register})`]];
                }
                // literal address
                const num = Number(tokens[2]);
                if (!isNaN(num) && tokens[2] != "") {
                    return [
                        ...loadImmediate(tokens[2], "$at"),
                        [instr.symbol, mapped["rt"], "0($at)"],
                    ];
                }
                // label+offset
                const hasPlus = tokens[2].includes("+");
                const hasMinus = tokens[2].includes("-");
                if (hasPlus || hasMinus) {
                    const split = tokens[2]
                        .split(hasPlus ? "+" : "-")
                        .map((part) => part.trim());
                    const labelAddr = getLabelAddress(
                        split[0],
                        labels,
                        globals,
                    );
                    if (labelAddr === undefined) {
                        if (withLabels)
                            throw new Error(`Undefined label: "${split[0]}"`);
                        else return [tokens];
                    }
                    return [
                        ...loadImmediate(labelAddr, "$at"),
                        [
                            instr.symbol,
                            mapped["rt"],
                            `${hasMinus ? "-" : ""}${split[1]}($at)`,
                        ],
                    ];
                }
                // label
                const labelAddr = getLabelAddress(tokens[2], labels, globals);
                if (labelAddr !== undefined) {
                    return [
                        ...loadImmediate(labelAddr, "$at"),
                        [instr.symbol, mapped["rt"], "0($at)"],
                    ];
                } else if (withLabels) {
                    throw new Error(`Undefined label: "${tokens[2]}"`);
                }
            }
        }

        // expand instruction to load a literal instead of rt in $at
        if (this.allowNumberRt.has(params)) {
            if (mapped["rt"].startsWith("$")) return [tokens]; // it's a register so no preprocessing needed
            // check if the instruction has an immediate correspondent and the imm firts in 16 bits
            const immCorrespondent = instr.getImmediateCorrespondent();
            const num = parseInlineLiteral(mapped["rt"]);
            if (immCorrespondent && num && num >= -32768 && num <= 32767) {
                return [[immCorrespondent, ...tokens.slice(1)]];
            }
            return [
                ...loadImmediate(mapped["rt"], "$at"),
                this.substituteAtToRt(tokens, params),
            ];
        }

        return [tokens];
    }

    /**Place the "$at" token in the target register position in the given tokens*/
    private substituteAtToRt(tokens: string[], params: ParamsFormat): string[] {
        const rtIndex = params
            .split(",")
            .map((p) => p.trim())
            .findIndex((v) => v === "rt");
        // first token is the instruction symbol, so add 1
        const newTokens = [...tokens];
        newTokens[rtIndex + 1] = "$at";
        return newTokens;
    }
}
