import {word} from "./Memory.js";
import {Registers} from "./Registers.js";
import {instruction} from "./Instructions.js";

export type params = {
    rs?: word;
    rt?: word;
    rd?: word;
    immediate?: word;
    address?: word;
};

export interface Format {
    assemble(parts: string[], instruction: instruction, registers: Registers): { code: word, basic: string };
    disassemble(code: word, instruction: instruction): params;
}

export class R_Format implements Format {
    assemble(parts: string[], instruction: instruction, registers: Registers): { code: word, basic: string } {
        if (parts.length !== 4) throw new Error("Invalid R-type instruction format");

        const rd = registers.getByName(parts[1]);
        const rs = registers.getByName(parts[2]);
        const rt = registers.getByName(parts[3]);

        if (!rd || !rs || !rt) throw new Error("Invalid register name");

        const code = (instruction.opcode! << 26) |
            (rs.number! << 21) |
            (rt.number! << 16) |
            (rd.number! << 11) |
            (0x00 << 6) |
            instruction.funct!;

        const basic: string = `${parts[0]} $${rd.number}, $${rs.number}, $${rt.number}`;

        return {
            code,
            basic
        };
    }

    disassemble(binary: word, instruction: instruction): params {
        const rs = (binary >> 21) & 0x1F;
        const rt = (binary >> 16) & 0x1F;
        const rd = (binary >> 11) & 0x1F;

        return { rs, rt, rd };
    }
}

export class I_Format implements Format {
    assemble(parts: string[], instruction: instruction, registers: Registers): { code: word, basic: string } {
        if (parts.length !== 4) throw new Error("Invalid I-type instruction format");

        const rt = registers.getByName(parts[1]);
        const rs = registers.getByName(parts[2]);
        const immediate = Number(parts[3]);

        if (!rt || !rs || isNaN(immediate)) throw new Error("Invalid register or immediate value");

        const code = (instruction.opcode! << 26) |
            (rs.number! << 21) |
            (rt.number! << 16) |
            (immediate & 0xFFFF);

        const basic: string = `${parts[0]} $${rt.number}, $${rs.number}, ${immediate}`;

        return {
            code,
            basic
        };
    }

    disassemble(binary: word, instruction: instruction): params {
        const rs = (binary >> 21) & 0x1F;
        const rt = (binary >> 16) & 0x1F;
        const immediate = binary & 0xFFFF;

        return { rs, rt, immediate };
    }
}

export class J_Format implements Format {
    assemble(parts: string[], instruction: instruction, registers: Registers): { code: word, basic: string } {
        if (parts.length !== 2) throw new Error("Invalid J-type instruction format");

        const address = Number(parts[1]);
        if (isNaN(address)) throw new Error("Invalid address");

        const code = (instruction.opcode! << 26) |
            (address & 0x03FFFFFF);

        const basic: string = `${parts[0]} ${address}`;

        return {
            code,
            basic
        };
    }

    disassemble(binary: word, instruction: instruction): params {
        const address = binary & 0x03FFFFFF;

        return { address };
    }
}
