import {Binary} from "./Utils.js";
import {Instruction} from "./Instructions.js";
import {CPU} from "./CPU.js";
import {Assembler} from "./Assembler.js";
import {register} from "./Registers.js";

export interface Format {
    assemble(tokens: string[], instruction: Instruction, cpu: CPU, assembler: Assembler, globals: Map<string, Binary | undefined>, labels: Map<string, Binary | undefined>, address: Binary): Binary;
    disassemble(instruction: Instruction, instructionCode: Binary): { [key: string]: Binary };
}

export class R_Format implements Format {
    assemble(tokens: string[], instruction: Instruction, cpu: CPU, assembler: Assembler, globals: Map<string, Binary | undefined>, labels: Map<string, Binary | undefined>, address: Binary): Binary {

        const opcode: Binary = instruction.opcode!;
        const funct: Binary = instruction.funct!;
        let rs: register | undefined = cpu.registers.get('$zero');
        let rt: register | undefined = cpu.registers.get('$zero');
        let rd: register | undefined = cpu.registers.get('$zero');
        let shamt: Binary = new Binary(0, 5);

        if (instruction.params === 'rd, rt, sa') {

            rd = cpu.registers.get(tokens[1]);
            rt = cpu.registers.get(tokens[2]);
            shamt.set(Number(tokens[3]));

        } else if (instruction.params === 'rd, rt, rs') {

            rd = cpu.registers.get(tokens[1]);
            rt = cpu.registers.get(tokens[2]);
            rs = cpu.registers.get(tokens[3]);

        } else if (instruction.params === 'rs') {

            rs = cpu.registers.get(tokens[1]);

        } else if (instruction.params === 'rd, rs') {

            rd = cpu.registers.get(tokens[1]);
            rs = cpu.registers.get(tokens[2]);

        } else if (instruction.params === 'SYSCALL') {



        } else if (instruction.params === 'BREAK') {



        } else if (instruction.params === 'rd') {

            rd = cpu.registers.get(tokens[1]);

        } else if (instruction.params === 'rs, rt') {

            rs = cpu.registers.get(tokens[1]);
            rt = cpu.registers.get(tokens[2]);

        } else if (instruction.params === 'rd, rs, rt') {

            rd = cpu.registers.get(tokens[1]);
            rs = cpu.registers.get(tokens[2]);
            rt = cpu.registers.get(tokens[3]);

        } else {
            console.error(`Unhandled R-format instruction: ${instruction.symbol} ${instruction.params}`);
        }

        if (!rs || !rt || !rd) {
            throw new Error(`Invalid params for instruction ${tokens.join(' ')}`);
        }

        let code = new Binary();
        code.setBits(opcode, 31, 26);
        code.setBits(new Binary(rs.number, 5), 25, 21);
        code.setBits(new Binary(rt.number, 5), 20, 16);
        code.setBits(new Binary(rd.number, 5), 15, 11);
        code.setBits(shamt, 10, 6);
        code.setBits(funct, 5, 0);
        return code;
    }

    disassemble(instruction: Instruction, instructionCode: Binary): { [p: string]: Binary } {
        const opcode = instructionCode.getBits(31, 26);
        const rs = instructionCode.getBits(25, 21);
        const rt = instructionCode.getBits(20, 16);
        const rd = instructionCode.getBits(15, 11);
        const shamt = instructionCode.getBits(10, 6);
        const funct = instructionCode.getBits(5, 0);
        return { opcode, rs, rt, rd, shamt, funct };
    }

}

export class I_Format implements Format {
    assemble(tokens: string[], instruction: Instruction, cpu: CPU, assembler: Assembler, globals: Map<string, Binary | undefined>, labels: Map<string, Binary | undefined>, address: Binary): Binary {

        const opcode: Binary = instruction.opcode!;
        let rs = cpu.registers.get('$zero');
        let rt = cpu.registers.get('$zero');
        let immediate = new Binary(0, 16, true);

        if (instruction.params === 'rs, rt, offset') {

            rs = cpu.registers.get(tokens[1]);
            rt = cpu.registers.get(tokens[2]);
            const offset = assembler.resolveLabel(tokens[3], globals, labels, address);
            immediate.set(offset);

        } else if (instruction.params === 'rs, offset') {

            rs = cpu.registers.get(tokens[1]);
            const offset = assembler.resolveLabel(tokens[2], globals, labels, address);
            immediate.set(offset);

        } else if (instruction.params === 'rt, rs, immediate') {

            rt = cpu.registers.get(tokens[1]);
            rs = cpu.registers.get(tokens[2]);
            if (['ADDI', 'ADDIU', 'DADDI', 'DADDIU', 'SLTI', 'SLTIU'].includes(instruction.symbol)) { // immediate signed
                immediate.set(Number(tokens[3]));
            } else if (['ANDI', 'ORI', 'XORI'].includes(instruction.symbol)) { // immediate unsigned
                immediate.set(Number(tokens[3]), false);
            } else console.error(`Unhandled I-format instruction: ${instruction.symbol} ${instruction.params}`);

        } else if (instruction.params === 'rt, immediate') {

            rt = cpu.registers.get(tokens[1]);
            immediate.set(Number(tokens[2]));

        } else if (instruction.params === 'cop_fun') {

            throw new Error(`TO-DO: Assemble I ${instruction.symbol} ${instruction.params}`);

        } else if (instruction.params === 'rt, offset(base)') {

            rt = cpu.registers.get(tokens[1]);
            const offsetBaseMatch = tokens[2].match(/(-?\d+)\((\$\w+)\)/);
            if (offsetBaseMatch) {
                const offset = Number(offsetBaseMatch[1]);
                immediate.set(offset);
                const base = cpu.registers.get(offsetBaseMatch[2]);
                rs = base;
            }

        } else {
            console.error(`Unhandled I-format instruction: ${instruction.symbol} ${instruction.params}`);
        }

        if (!rs || !rt) {
            throw new Error(`Invalid params for instruction ${tokens.join(' ')}`);
        }

        let code = new Binary();
        code.setBits(opcode, 31, 26);
        code.setBits(new Binary(rs.number, 5),  25, 21);
        code.setBits(new Binary(rt.number, 5), 20, 16);
        code.setBits(immediate, 15, 0);

        return code;
    }

    disassemble(instruction: Instruction, instructionCode: Binary): { [p: string]: Binary } {
        const opcode = instructionCode.getBits(31, 26);
        const rs = instructionCode.getBits(25, 21);
        const rt = instructionCode.getBits(20, 16);

        let immediate = new Binary(0, 16, true);
        if (['ANDI', 'ORI', 'XORI'].includes(instruction.symbol)) {
            immediate.set(instructionCode.getBits(15, 0).getValue(), false);
        } else {
            immediate.set(instructionCode.getBits(15, 0, true).getValue());
        }

        return { opcode, rs, rt, immediate };
    }
}

export class J_Format implements Format {
    assemble(tokens: string[], instruction: Instruction, cpu: CPU, assembler: Assembler, globals: Map<string, Binary | undefined>, labels: Map<string, Binary | undefined>, address: Binary): Binary {

        const opcode: Binary = instruction.opcode!;
        const target = new Binary(0, 26);

        if (instruction.params === 'target') {
            const targetAddress = assembler.resolveLabel(tokens[1], globals, labels, address, true);
            target.set(targetAddress);
        } else {
            console.error(`Unhandled J-format instruction: ${instruction.symbol} ${instruction.params}`);
        }

        let code = new Binary();
        code.setBits(opcode, 31, 26);
        code.setBits(target, 25, 0);
        return code;
    }

    disassemble(instruction: Instruction, instructionCode: Binary): { [key: string]: Binary } {
        const opcode = instructionCode.getBits(31, 26);
        const target = new Binary(instructionCode.getBits(25, 0).getValue(), 26);
        return { opcode, target };
    }

}