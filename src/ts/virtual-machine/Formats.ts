import {Utils, Word} from "./Utils.js";
import {CPU} from "./CPU.js";
import {Instruction} from "./InstructionsSet.js";

export type Params = { [key: string]: Word };

export interface Format {
    assemble(parts: string[], instruction: Instruction, cpu: CPU): { code: Word, basic: string }
    disassemble(instructionCode: Word): Params;
}

export class R_Format implements Format {
    assemble(parts: string[], instruction: Instruction, cpu: CPU) {

        let basic: string;

        let rd = cpu.registers.get("$zero");
        let rs = cpu.registers.get("$zero");
        let rt = cpu.registers.get("$zero");

        if ((parts[0] === "mult") || (parts[0] === "div")) {
            rs = cpu.registers.get(parts[1]);
            rt = cpu.registers.get(parts[2]);
            basic = `${parts[0]} $${rs!.number} $${rt!.number}`;
        } else if ((parts[0] === "mflo") || (parts[0] === "mfhi")) {
            rd = cpu.registers.get(parts[1]);
            basic = `${parts[0]} $${rd!.number}`;
        } else {
            rd = cpu.registers.get(parts[1]);
            rs = cpu.registers.get(parts[2]);
            rt = cpu.registers.get(parts[3]);
            basic = `${parts[0]} $${rd!.number} $${rs!.number} $${rt!.number}`;
        }

        if (!rd || !rs || !rt) throw new Error(`Invalid register name for instruction ${parts.join(' ')}`);

        let code: Word = 0;
        code = Utils.setBits(code, instruction.opcode!, 31, 26);
        code = Utils.setBits(code, rs.number!, 25, 21);
        code = Utils.setBits(code, rt.number!, 20, 16);
        code = Utils.setBits(code, rd.number!, 15, 11);
        code = Utils.setBits(code, 0x00, 10, 6);
        code = Utils.setBits(code, instruction.funct!, 5, 0);

        return {
            code,
            basic
        };
    }

    disassemble(instructionCode: Word): Params {
        const rs: Word = Utils.getBits(instructionCode, 25, 21);
        const rt: Word = Utils.getBits(instructionCode, 20, 16);
        const rd: Word = Utils.getBits(instructionCode, 15, 11);

        return { rs, rt, rd };
    }

}

export class I_Format implements Format {
    assemble(parts: string[], instruction: Instruction, cpu: CPU) {
        const rt = cpu.registers.get(parts[1]);
        const rs = cpu.registers.get(parts[2]);
        const immediate = Number(parts[3]);

        if (!rt || !rs || isNaN(immediate)) throw new Error("Invalid register or immediate value");

        let code: Word = 0;
        code = Utils.setBits(code, instruction.opcode!, 31, 26);
        code = Utils.setBits(code, rs.number!, 25, 21);
        code = Utils.setBits(code, rt.number!, 20, 16);
        code = Utils.setBits(code, immediate & 0xFFFF, 15, 0);

        const basic: string = `${parts[0]} $${rt.number} $${rs.number} ${immediate}`;

        return {
            code,
            basic
        };
    }

    disassemble(instructionCode: Word): Params {
        const rs: Word = Utils.getBits(instructionCode, 25, 21);
        const rt: Word = Utils.getBits(instructionCode, 20, 16);
        const immediate: Word = Utils.getBits(instructionCode, 15, 0);

        return { rs, rt, immediate };
    }
}

export class J_Format implements Format {
    assemble(parts: string[], instruction: Instruction, cpu: CPU) {
        const address = Number(parts[1]);
        if (isNaN(address)) throw new Error("Invalid address");

        const jumpAddress = (address >>> 2) & 0x03FFFFFF;

        let code: Word = 0;
        code = Utils.setBits(code, instruction.opcode!, 31, 26);
        code = Utils.setBits(code, jumpAddress, 25, 0);

        const basic: string = `${parts[0]} ${address}`;

        return {
            code,
            basic
        };
    }

    disassemble(instructionCode: Word): Params {
        const address: Word = Utils.getBits(instructionCode, 25, 0);

        return { address };
    }
}