import { Binary, Utils } from "./Utils.js";
export class Instruction {
    constructor(symbol, params, format, opcode, funct, description) {
        this.symbol = symbol;
        this.params = params;
        this.format = format;
        this.opcode = opcode;
        this.funct = funct;
        this.description = description;
    }
    basic(params) {
        var _a, _b, _c, _d, _e, _f, _g;
        const paramsNames = this.params.split(',').map(p => p.trim());
        const paramValues = [];
        for (const name of paramsNames) {
            if (name.includes('(') && name.includes(')')) {
                const offsetName = name.substring(0, name.indexOf('('));
                const offsetValue = ((_a = params[offsetName]) === null || _a === void 0 ? void 0 : _a.getValue()) || 0;
                const rsValue = (_b = params['rs']) === null || _b === void 0 ? void 0 : _b.getValue();
                paramValues.push(`${offsetValue}($${rsValue})`);
            }
            else if (['rs', 'rt', 'rd'].includes(name)) {
                const regValue = (_c = params[name]) === null || _c === void 0 ? void 0 : _c.getValue();
                paramValues.push(`$${regValue}`);
            }
            else if (name === 'immediate' || name === 'offset') {
                const immediateValue = (_d = params['immediate']) === null || _d === void 0 ? void 0 : _d.getValue();
                paramValues.push(immediateValue !== undefined ? immediateValue.toString() : '0');
            }
            else if (name === 'target') {
                const targetValue = (_e = params[name]) === null || _e === void 0 ? void 0 : _e.getValue();
                paramValues.push(targetValue !== undefined ? targetValue.toString() : '0');
            }
            else if (name === 'SYSCALL' || name === 'BREAK') {
                return this.symbol.toLowerCase();
            }
            else if (name === 'sa') {
                const shamtValue = (_f = params['shamt']) === null || _f === void 0 ? void 0 : _f.getValue();
                paramValues.push(shamtValue !== undefined ? shamtValue.toString() : 'undefined');
            }
            else {
                console.error("To handle param: " + name);
                const paramValue = (_g = params[name]) === null || _g === void 0 ? void 0 : _g.getValue();
                paramValues.push(paramValue !== undefined ? paramValue.toString() : 'undefined');
            }
        }
        return `${this.symbol.toLowerCase()} ${paramValues.join(', ')}`;
    }
}
export class PseudoInstruction {
    constructor(symbol, params) {
        this.symbol = symbol;
        this.params = params.split(',').map(param => param.trim());
    }
    mapParams(tokens) {
        const paramMap = {};
        for (let i = 0; i < this.params.length; i++) {
            paramMap[this.params[i]] = tokens[i + 1];
        }
        return paramMap;
    }
}
export class Instructions {
    constructor() {
        this.instructions = [];
        this.pseudoInstructions = [];
        this.initInstructions();
        this.initPseudoInstructions();
    }
    getBySymbol(symbol) {
        for (const instruction of this.instructions) {
            if (instruction.symbol.toLowerCase() === symbol.toLowerCase()) {
                return instruction;
            }
        }
    }
    getPseudoBySymbol(symbol) {
        for (const pseudo of this.pseudoInstructions) {
            if (pseudo.symbol.toLowerCase() === symbol.toLowerCase()) {
                return pseudo;
            }
        }
    }
    initInstructions() {
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SLL', 'rd, rt, sa', 'R', new Binary(0b000000, 6), new Binary(0b000000, 6), `
                    name: "Shift Word Left Logical",
                    purpose: "To left shift a word by a fixed number of bits.",
                    description: "rd <- rt << sa<br>The contents of the low-order 32-bit word of GPR rt are shifted left, inserting zeroes into the emptied bits; the word result is placed in GPR rd. The bit shift count is specified by sa. If rd is a 64-bit register, the result word is sign-extended.",
                    restrictions: "None.",
                    operation: "s <- sa<br>temp <- GPR[rt](31-s)..0 || 0s<br>GPR[rd] <- sign_extend(temp)",
                    exceptions: "None.",
                    programming_notes: "Unlike nearly all other word operations the input operand does not have to be a properly sign-extended word value to produce a valid sign-extended 32-bit result. The result word is always sign extended into a 64-bit destination register; this instruction with a zero shift amount truncates a 64-bit value to 32 bits and sign extends it.<br>Some assemblers, particularly 32-bit assemblers, treat this instruction with a shift amount of zero as a NOP and either delete it or replace it with an actual NOP.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                const registers = cpu.getRegisters();
                const rd = registers[params.rd.getValue()].binary;
                const rt = registers[params.rt.getValue()].binary;
                const sa = params.shamt;
                rd.set(rt.getValue() << sa.getValue());
                cpu.pc.set(cpu.pc.getValue() + 4);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SRL', 'rd, rt, sa', 'R', new Binary(0b000000, 6), new Binary(0b000010, 6), `
                    name: "Shift Word Right Logical",
                    purpose: "To logical right shift a word by a fixed number of bits.",
                    description: "rd <- rt >> sa (logical)<br>The contents of the low-order 32-bit word of GPR rt are shifted right, inserting zeros into the emptied bits; the word result is placed in GPR rd. The bit shift count is specified by sa. If rd is a 64-bit register, the result word is sign-extended.",
                    restrictions: "On 64-bit processors, if GPR rt does not contain a sign-extended 32-bit value (bits 63..31 equal) then the result of the operation is undefined.",
                    operation: "if (NotWordValue(GPR[rt])) then UndefinedResult() endif<br>s <- sa<br>temp <- 0s || GPR[rt]31..s<br>GPR[rd] <- sign_extend(temp)",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SRA', 'rd, rt, sa', 'R', new Binary(0b000000, 6), new Binary(0b000011, 6), `
                    name: "Shift Word Right Arithmetic",
                    purpose: "To arithmetic right shift a word by a fixed number of bits.",
                    description: "rd <- rt >> sa (arithmetic)<br>The contents of the low-order 32-bit word of GPR rt are shifted right, duplicating the sign-bit (bit 31) in the emptied bits; the word result is placed in GPR rd. The bit shift count is specified by sa. If rd is a 64-bit register, the result word is sign-extended.",
                    restrictions: "On 64-bit processors, if GPR rt does not contain a sign-extended 32-bit value (bits 63..31 equal) then the result of the operation is undefined.",
                    operation: "if (NotWordValue(GPR[rt])) then UndefinedResult() endif<br>s <- sa<br>temp <- (GPR[rt]31)s || GPR[rt]31..s<br>GPR[rd] <- sign_extend(temp)",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SLLV', 'rd, rt, rs', 'R', new Binary(0b000000, 6), new Binary(0b000100, 6), `
                    name: "Shift Word Left Logical Variable",
                    purpose: "To left shift a word by a variable number of bits.",
                    description: "rd <- rt << rs<br>The contents of the low-order 32-bit word of GPR rt are shifted left, inserting zeroes into the emptied bits; the result word is placed in GPR rd. The bit shift count is specified by the low-order five bits of GPR rs. If rd is a 64-bit register, the result word is sign-extended.",
                    restrictions: "None.",
                    operation: "s <- GP[rs]4..0<br>temp <- GPR[rt](31-s)..0 || 0s<br>GPR[rd] <- sign_extend(temp)",
                    exceptions: "None.",
                    programming_notes: "Unlike nearly all other word operations the input operand does not have to be a properly sign-extended word value to produce a valid sign-extended 32-bit result. The result word is always sign extended into a 64-bit destination register; this instruction with a zero shift amount truncates a 64-bit value to 32 bits and sign extends it.<br>Some assemblers, particularly 32-bit assemblers, treat this instruction with a shift amount of zero as a NOP and either delete it or replace it with an actual NOP.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SRLV', 'rd, rt, rs', 'R', new Binary(0b000000, 6), new Binary(0b000110, 6), `
                    name: "Shift Word Right Logical Variable",
                    purpose: "To logical right shift a word by a variable number of bits.",
                    description: "rd <- rt >> rs (logical)<br>The contents of the low-order 32-bit word of GPR rt are shifted right, inserting zeros into the emptied bits; the word result is placed in GPR rd. The bit shift count is specified by the low-order five bits of GPR rs. If rd is a 64-bit register, the result word is sign-extended.",
                    restrictions: "On 64-bit processors, if GPR rt does not contain a sign-extended 32-bit value (bits 63..31 equal) then the result of the operation is undefined.",
                    operation: "if (NotWordValue(GPR[rt])) then UndefinedResult() endif<br>s <- GPR[rs]4..0<br>temp <- 0s || GPR[rt]31..s<br>GPR[rd] <- sign_extend(temp)",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SRAV', 'rd, rt, rs', 'R', new Binary(0b000000, 6), new Binary(0b000111, 6), `
                    name: "Shift Word Right Arithmetic Variable",
                    purpose: "To arithmetic right shift a word by a variable number of bits.",
                    description: "rd <- rt >> rs (arithmetic)<br>The contents of the low-order 32-bit word of GPR rt are shifted right, duplicating the sign-bit (bit 31) in the emptied bits; the word result is placed in GPR rd. The bit shift count is specified by the low-order five bits of GPR rs. If rd is a 64-bit register, the result word is sign-extended.",
                    restrictions: "On 64-bit processors, if GPR rt does not contain a sign-extended 32-bit value (bits 63..31 equal) then the result of the operation is undefined.",
                    operation: "if (NotWordValue(GPR[rt])) then UndefinedResult() endif<br>s <- GPR[rs]4..0<br>temp <- (GPR[rt]31)s || GPR[rt]31..s<br>GPR[rd] <- sign_extend(temp)",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('JR', 'rs', 'R', new Binary(0b000000, 6), new Binary(0b001000, 6), `
                    name: "Jump Register",
                    purpose: "To branch to an instruction address in a register.",
                    description: "PC <- rs<br>Jump to the effective target address in GPR rs. Execute the instruction following the jump, in the branch delay slot, before jumping.",
                    restrictions: "The effective target address in GPR rs must be naturally aligned. If either of the two least-significant bits are not zero, then an Address Error exception occurs, not for the jump instruction, but when the branch target is subsequently fetched as an instruction.",
                    operation: "I:<br>&emsp;temp <- GPR[rs]<br>I+1:<br>&emsp;PC <- temp",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('JALR', 'rd, rs', 'R', new Binary(0b000000, 6), new Binary(0b001001, 6), `
                    name: "Jump And Link Register",
                    purpose: "To procedure call to an instruction address in a register.",
                    description: "rd <- return_addr, PC <- rs<br>Place the return address link in GPR rd. The return link is the address of the second instruction following the branch, where execution would continue after a procedure call.<br>Jump to the effective target address in GPR rs. Execute the instruction following the jump, in the branch delay slot, before jumping.",
                    restrictions: "Register specifiers rs and rd must not be equal, because such an instruction does not have the same effect when re-executed. The result of executing such an instruction is undefined. This restriction permits an exception handler to resume execution by re-executing the branch when an exception occurs in the branch delay slot.<br>The effective target address in GPR rs must be naturally aligned. If either of the two least-significant bits are not -zero, then an Address Error exception occurs, not for the jump instruction, but when the branch target is subsequently fetched as an instruction.",
                    operation: "I:<br>&emsp;temp <- GPR[rs]<br>&emsp;GPR[rd] <- PC + 8<br>I+1:<br>&emsp;PC <- temp",
                    exceptions: "None.",
                    programming_notes: "This is the only branch-and-link instruction that can select a register for the return link; all other link instructions use GPR 31 The default register for GPR rd, if omitted in the assembly language instruction, is GPR 31.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SYSCALL', 'SYSCALL', 'R', new Binary(0b000000, 6), new Binary(0b001100, 6), `
                    name: "System Call",
                    purpose: "To cause a System Call exception.",
                    description: "A system call exception occurs, immediately and unconditionally transferring control to the exception handler.<br>The code field is available for use as software parameters, but is retrieved by the exception handler only by loading the contents of the memory word containing the instruction.",
                    restrictions: "None.",
                    operation: "SignalException(SystemCall)",
                    exceptions: "System Call",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                const registers = cpu.getRegisters();
                const v0 = registers[2].binary;
                const syscall = cpu.syscallsSet.get(v0.getValue());
                if (!syscall)
                    throw new Error(`Unknown syscall: ${v0.getValue()}`);
                syscall.execute(cpu, {});
                cpu.pc.set(cpu.pc.getValue() + 4);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('BREAK', 'BREAK', 'R', new Binary(0b000000, 6), new Binary(0b001101, 6), `
                    name: "Breakpoint",
                    purpose: "To cause a Breakpoint exception.",
                    description: "A breakpoint exception occurs, immediately and unconditionally transferring control to the exception handler.<br>The code field is available for use as software parameters, but is retrieved by the exception handler only by loading the contents of the memory word containing the instruction.",
                    restrictions: "None.",
                    operation: "SignalException(Breakpoint)",
                    exceptions: "Breakpoint",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('MFHI', 'rd', 'R', new Binary(0b000000, 6), new Binary(0b010000, 6), `
                    name: "Move From HI Register",
                    purpose: "To copy the special purpose HI register to a GPR.",
                    description: "rd <- HI<br>The contents of special register HI are loaded into GPR rd.",
                    restrictions: "The two instructions that follow an MFHI instruction must not be instructions that modify the HI register: DDIV, DDIVU, DIV, DIVU, DMULT, DMULTU, MTHI, MULT, MULTU. If this restriction is violated, the result of the MFHI is undefined.",
                    operation: "GPR[rd] <- HI",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('MTHI', 'rs', 'R', new Binary(0b000000, 6), new Binary(0b010001, 6), `
                    name: "Move To HI Register",
                    purpose: "To copy a GPR to the special purpose HI register.",
                    description: "HI <- rs<br>The contents of GPR rs are loaded into special register HI.",
                    restrictions: "If either of the two preceding instructions is MFHI, the result of that MFHI is undefined. Reads of the HI or LO special registers must be separated from subsequent instructions that write to them by two or more other instructions.<br>A computed result written to the HI/LO pair by DDIV, DDIVU, DIV, DIVU, DMULT, DMULTU, MULT, or MULTU must be read by MFHI or MFLO before another result is written into either HI or LO. If an MTHI instruction is executed following one of these arithmetic instructions, but before a MFLO or MFHI instruction, the contents of LO are undefined. The following example shows this illegal situation:<br>MUL r2, r4	# start operation that will eventually write to HI,LO<br>...	# code not containing mfhi or mflo<br>MTHI r6<br>...	# code not containing mflo<br>MFLO r3	# this mflo would get an undefined value",
                    operation: "I-2:, I-1:<br>&emsp;HI <- undefined<br>I:<br>&emsp;HI <- GPR[rs]",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('MFLO', 'rd', 'R', new Binary(0b000000, 6), new Binary(0b010010, 6), `
                    name: "Move From LO Register",
                    purpose: "To copy the special purpose LO register to a GPR.",
                    description: "rd <- LO<br>The contents of special register LO are loaded into GPR rd.",
                    restrictions: "The two instructions that follow an MFLO instruction must not be instructions that modify the LO register: DDIV, DDIVU, DIV, DIVU, DMULT, DMULTU, MTLO, MULT, MULTU. If this restriction is violated, the result of the MFLO is undefined.",
                    operation: "GPR[rd] <- LO",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('MTLO', 'rs', 'R', new Binary(0b000000, 6), new Binary(0b010011, 6), `
                    name: "Move To LO Register",
                    purpose: "To copy a GPR to the special purpose LO register.",
                    description: "LO <- rs<br>The contents of GPR rs are loaded into special register LO.",
                    restrictions: "If either of the two preceding instructions is MFLO, the result of that MFLO is undefined. Reads of the HI or LO special registers must be separated from subsequent instructions that write to them by two or more other instructions.<br>A computed result written to the HI/LO pair by DDIV, DDIVU, DIV, DIVU, DMULT, DMULTU, MULT, or MULTU must be read by MFHI or MFLO before another result is written into either HI or LO. If an MTLO instruction is executed following one of these arithmetic instructions, but before a MFLO or MFHI instruction, the contents of HI are undefined. The following example shows this illegal situation:<br>MUL r2, r4	# start operation that will eventually write to HI,LO<br>...	# code not containing mfhi or mflo<br>MTLO r6<br>...	# code not containing mfhi<br>MFHI r3	# this mfhi would get an undefined value",
                    operation: "I-2:, I-1:<br>&emsp;LO <- undefined<br>I:<br>&emsp;LO <- GPR[rs]",
                    exceptions: "None",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DSLLV', 'rd, rt, rs', 'R', new Binary(0b000000, 6), new Binary(0b010100, 6), `
                    name: "Doubleword Shift Left Logical Variable",
                    purpose: "To left shift a doubleword by a variable number of bits.",
                    description: "rd <- rt << rs<br>The 64-bit doubleword contents of GPR rt are shifted left, inserting zeros into the emptied bits; the result is placed in GPR rd. The bit shift count in the range 0 to 63 is specified by the low-order six bits in GPR rs.",
                    restrictions: "None.",
                    operation: "64-bit processors:<br>s <- 0 || GPR[rs]5..0<br>GPR[rd] <- GPR[rt](63-s)..0 || 0s",
                    exceptions: "Reserved Instruction",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DSRAV', 'rd, rt, rs', 'R', new Binary(0b000000, 6), new Binary(0b010111, 6), `
                    name: "Doubleword Shift Right Arithmetic Variable",
                    purpose: "To arithmetic right shift a doubleword by a variable number of bits.",
                    description: "rd <- rt >> rs (arithmetic)<br>The doubleword contents of GPR rt are shifted right, duplicating the sign bit (63) into the emptied bits; the result is placed in GPR rd. The bit shift count in the range 0 to 63 is specified by the low-order six bits in GPR rs.",
                    restrictions: "None.",
                    operation: "64-bit processors:<br>s <- GPR[rs]5..0<br>GPR[rd] <- (GPR[rt]63)s || GPR[rt]63..s",
                    exceptions: "Reserved Instruction",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('MULT', 'rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b011000, 6), `
                    name: "Multiply Word",
                    purpose: "To multiply 32-bit signed integers.",
                    description: "(LO, HI) <- rs * rt<br>The 32-bit word value in GPR rt is multiplied by the 32-bit value in GPR rs, treating both operands as signed values, to produce a 64-bit result. The low-order 32-bit word of the result is placed into special register LO, and the high-order 32-bit word is placed into special register HI.<br>No arithmetic exception occurs under any circumstances.",
                    restrictions: "On 64-bit processors, if either GPR rt or GPR rs do not contain sign-extended 32-bit values (bits 63..31 equal), then the result of the operation is undefined.<br>If either of the two preceding instructions is MFHI or MFLO, the result of the MFHI or MFLO is undefined. Reads of the HI or LO special registers must be separated from subsequent instructions that write to them by two or more other instructions.",
                    operation: "if (NotWordValue(GPR[rs]) or NotWordValue(GPR[rt])) then UndefinedResult() endif<br>I-2:, I-1:<br>&emsp;LO, HI <- undefined<br>I:<br>&emsp;prod <- GPR[rs]31..0 * GPR[rt]31..0<br>&emsp;LO <- sign_extend(prod31..0)<br>&emsp;HI <- sign_extend(prod63..32)",
                    exceptions: "None.",
                    programming_notes: "In some processors the integer multiply operation may proceed asynchronously and allow other CPU instructions to execute before it is complete. An attempt to read LO or HI before the results are written will wait (interlock) until the results are ready. Asynchronous execution does not affect the program result, but offers an opportunity for performance improvement by scheduling the multiply so that other instructions can execute in parallel.<br>Programs that require overflow detection must check for it explicitly.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('MULTU', 'rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b011001, 6), `
                    name: "Multiply Unsigned Word",
                    purpose: "To multiply 32-bit unsigned integers.",
                    description: "(LO, HI) <- rs * rt<br>The 32-bit word value in GPR rt is multiplied by the 32-bit value in GPR rs, treating both operands as unsigned values, to produce a 64-bit result. The low-order 32-bit word of the result is placed into special register LO, and the high-order 32-bit word is placed into special register HI.<br>No arithmetic exception occurs under any circumstances.",
                    restrictions: "On 64-bit processors, if either GPR rt or GPR rs do not contain sign-extended 32-bit values (bits 63..31 equal), then the result of the operation is undefined.<br>If either of the two preceding instructions is MFHI or MFLO, the result of the MFHI or MFLO is undefined. Reads of the HI or LO special registers must be separated from subsequent instructions that write to them by two or more other instructions.",
                    operation: "if (NotWordValue(GPR[rs]) or NotWordValue(GPR[rt])) then UndefinedResult() endif<br>I-2:, I-1:<br>&emsp;LO, HI <- undefined<br>I:<br>&emsp;prod <- (0 || GPR[rs]31..0) * (0 || GPR[rt]31..0)<br>&emsp;LO <- sign_extend(prod31..0)<br>&emsp;HI <- sign_extend(prod63..32)",
                    exceptions: "None.",
                    programming_notes: "In some processors the integer multiply operation may proceed asynchronously and allow other CPU instructions to execute before it is complete. An attempt to read LO or HI before the results are written will wait (interlock) until the results are ready. Asynchronous execution does not affect the program result, but offers an opportunity for performance improvement by scheduling the multiply so that other instructions can execute in parallel.<br>Programs that require overflow detection must check for it explicitly.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DIV', 'rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b011010, 6), `
                    name: "Divide Word",
                    purpose: "To divide 32-bit signed integers.",
                    description: "(LO, HI) <- rs / rt<br>The 32-bit word value in GPR rs is divided by the 32-bit value in GPR rt, treating both operands as signed values. The 32-bit quotient is placed into special register LO and the 32-bit remainder is placed into special register HI.<br>No arithmetic exception occurs under any circumstances.",
                    restrictions: "On 64-bit processors, if either GPR rt or GPR rs do not contain sign-extended 32-bit values (bits 63..31 equal), then the result of the operation is undefined.<br>If either of the two preceding instructions is MFHI or MFLO, the result of the MFHI or MFLO is undefined. Reads of the HI or LO special registers must be separated from subsequent instructions that write to them by two or more other instructions.<br>If the divisor in GPR rt is zero, the arithmetic result value is undefined.",
                    operation: "if (NotWordValue(GPR[rs]) or NotWordValue(GPR[rt])) then UndefinedResult() endif<br>I-2:, I-1:<br>&emsp;LO, HI <- undefined                       <br>I:<br>&emsp;q <- GPR[rs]31..0 div GPR[rt]31..0                                <br>&emsp;LO <- sign_extend(q31..0)                        <br>&emsp;r <- GPR[rs]31..0 mod GPR[rt]31..0                     <br>&emsp;HI <- sign_extend(r31..0)",
                    exceptions: "None.",
                    programming_notes: "In some processors the integer divide operation may proceed asynchronously and allow other CPU instructions to execute before it is complete. An attempt to read LO or HI before the results are written will wait (interlock) until the results are ready. Asynchronous execution does not affect the program result, but offers an opportunity for performance improvement by scheduling the divide so that other instructions can execute in parallel.<br>No arithmetic exception occurs under any circumstances. If divide-by-zero or overflow conditions should be detected and some action taken, then the divide instruction is typically followed by additional instructions to check for a zero divisor and/or for overflow. If the divide is asynchronous then the zero-divisor check can execute in parallel with the divide. The action taken on either divide-by-zero or overflow is either a convention within the program itself or more typically, the system software; one possibility is to take a BREAK exception with a code field value to signal the problem to the system software.<br>As an example, the C programming language in a UNIX environment expects division by zero to either terminate the program or execute a program-specified signal handler. C does not expect overflow to cause any exceptional condition. If the C compiler uses a divide instruction, it also emits code to test for a zero divisor and execute a BREAK instruction to inform the operating system if one is detected.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DIVU', 'rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b011011, 6), `
                    name: "Divide Unsigned Word",
                    purpose: "To divide 32-bit unsigned integers.",
                    description: "(LO, HI) <- rs / rt<br>The 32-bit word value in GPR rs is divided by the 32-bit value in GPR rt, treating both operands as unsigned values. The 32-bit quotient is placed into special register LO and the 32-bit remainder is placed into special register HI.<br>No arithmetic exception occurs under any circumstances.",
                    restrictions: "On 64-bit processors, if either GPR rt or GPR rs do not contain sign-extended 32-bit values (bits 63..31 equal), then the result of the operation is undefined.<br>If either of the two preceding instructions is MFHI or MFLO, the result of the MFHI or MFLO is undefined. Reads of the HI or LO special registers must be separated from subsequent instructions that write to them, like this one, by two or more other instructions.<br>If the divisor in GPR rt is zero, the arithmetic result is undefined.",
                    operation: "if (NotWordValue(GPR[rs]) or NotWordValue(GPR[rt])) then UndefinedResult() endif<br>I-2:, I-1:<br>&emsp;LO, HI <- undefined<br>I:<br>&emsp;q <- (0 || GPR[rs]31..0) div (0 || GPR[rt]31..0)<br>&emsp;LO <- sign_extend(q31..0)<br>&emsp;r <- (0 || GPR[rs]31..0) mod (0 || GPR[rt]31..0)<br>&emsp;HI <- sign_extend(r31..0)",
                    exceptions: "None.",
                    programming_notes: "See the Programming Notes for the DIV instruction.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DMULT', 'rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b011100, 6), `
                    name: "Doubleword Multiply",
                    purpose: "To multiply 64-bit signed integers.",
                    description: "(LO, HI) <- rs * rt<br>The 64-bit doubleword value in GPR rt is multiplied by the 64-bit value in GPR rs, treating both operands as signed values, to produce a 128-bit result. The low-order 64-bit doubleword of the result is placed into special register LO, and the high-order 64-bit doubleword is placed into special register HI.<br>No arithmetic exception occurs under any circumstances.",
                    restrictions: "If either of the two preceding instructions is MFHI or MFLO, the result of the MFHI or MFLO is undefined. Reads of the HI or LO special registers must be separated from subsequent instructions that write to them by two or more other instructions.",
                    operation: "64-bit processors:<br>I-2:, I-1:<br>&emsp;LO, HI <- undefined<br>I:<br>&emsp;prod <- GPR[rs] * GPR[rt]<br>&emsp;LO <- prod63..0<br>&emsp;HI <- prod127..64",
                    exceptions: "Reserved Instruction",
                    programming_notes: "In some processors the integer multiply operation may proceed asynchronously and allow other CPU instructions to execute before it is complete. An attempt to read LO or HI before the results are written will wait (interlock) until the results are ready. Asynchronous execution does not affect the program result, but offers an opportunity for performance improvement by scheduling the multiply so that other instructions can execute in parallel.<br>Programs that require overflow detection must check for it explicitly.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DMULTU', 'rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b011101, 6), `
                    name: "Doubleword Multiply Unsigned",
                    purpose: "To multiply 64-bit unsigned integers.",
                    description: "(LO, HI) <- rs * rt<br>The 64-bit doubleword value in GPR rt is multiplied by the 64-bit value in GPR rs, treating both operands as unsigned values, to produce a 128-bit result. The low-order 64-bit doubleword of the result is placed into special register LO, and the high-order 64-bit doubleword is placed into special register HI.<br>No arithmetic exception occurs under any circumstances.",
                    restrictions: "If either of the two preceding instructions is MFHI or MFLO, the result of the MFHI or MFLO is undefined. Reads of the HI or LO special registers must be separated from subsequent instructions that write to them by two or more other instructions.",
                    operation: "64-bit processors:<br>I-2:, I-1:<br>&emsp;LO, HI <- undefined        <br>I:<br>&emsp;prod <- (0 || GPR[rs]) * (0 || GPR[rt])<br>&emsp;LO <- prod63..0<br>&emsp;HI <- prod127..64",
                    exceptions: "Reserved Instruction",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DDIV', 'rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b011110, 6), `
                    name: "Doubleword Divide",
                    purpose: "To divide 64-bit signed integers.",
                    description: "(LO, HI) <- rs / rt<br>The 64-bit doubleword in GPR rs is divided by the 64-bit doubleword in GPR rt, treating both operands as signed values. The 64-bit quotient is placed into special register LO and the 64-bit remainder is placed into special register HI.<br>No arithmetic exception occurs under any circumstances.",
                    restrictions: "If either of the two preceding instructions is MFHI or MFLO, the result of the MFHI or MFLO is undefined. Reads of the HI or LO special registers must be separated from subsequent instructions that write to them by two or more other instructions.<br>If the divisor in GPR rt is zero, the arithmetic result value is undefined.",
                    operation: "64-bit processors:<br>I-2:, I-1:<br>&emsp;LO, HI <- undefined<br>I:<br>&emsp;LO <- GPR[rs] div GPR[rt]<br>&emsp;HI <- GPR[rs] mod GPR[rt]",
                    exceptions: "Reserved Instruction",
                    programming_notes: "See the Programming Notes for the DIV instruction.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DDIVU', 'rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b011111, 6), `
                    name: "Doubleword Divide Unsigned",
                    purpose: "To divide 64-bit unsigned integers.",
                    description: "(LO, HI) <- rs / rt<br>The 64-bit doubleword in GPR rs is divided by the 64-bit doubleword in GPR rt, treating both operands as unsigned values. The 64-bit quotient is placed into special register LO and the 64-bit remainder is placed into special register HI.<br>No arithmetic exception occurs under any circumstances.",
                    restrictions: "If either of the two preceding instructions is MFHI or MFLO, the result of the MFHI or MFLO is undefined. Reads of the HI or LO special registers must be separated from subsequent instructions that write to them by two or more other instructions.<br>If the divisor in GPR rt is zero, the arithmetic result value is undefined.",
                    operation: "64-bit processors:<br>I-2:, I-1:<br>&emsp;LO, HI <- undefined      <br>I:<br>&emsp;LO <- (0 || GPR[rs]) div (0 || GPR[rt])               <br>&emsp;HI <- (0 || GPR[rs]) mod (0 || GPR[rt])",
                    exceptions: "Reserved instruction",
                    programming_notes: "See the Programming Notes for the DIV instruction.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('ADD', 'rd, rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b100000, 6), `
                    name: "Add Word",
                    purpose: "To add 32-bit integers. If overflow occurs, then trap.",
                    description: "rd <- rs + rt<br>The 32-bit word value in GPR rt is added to the 32-bit value in GPR rs to produce a 32-bit result. If the addition results in 32-bit 2's complement arithmetic overflow then the destination register is not modified and an Integer Overflow exception occurs. If it does not overflow, the 32-bit result is placed into GPR rd.",
                    restrictions: "On 64-bit processors, if either GPR rt or GPR rs do not contain sign-extended 32-bit values (bits 63..31 equal), then the result of the operation is undefined.",
                    operation: "if (NotWordValue(GPR[rs]) or NotWordValue(GPR[rt])) then UndefinedResult() endif<br>temp <- GPR[rs] + GPR[rt]<br>if (32_bit_arithmetic_overflow) then<br>&emsp;SignalException(IntegerOverflow)<br>else<br>&emsp;GPR[rd] <- sign_extend(temp31..0)<br>endif",
                    exceptions: "Integer Overflow",
                    programming_notes: "ADDU performs the same arithmetic operation but, does not trap on overflow.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('ADDU', 'rd, rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b100001, 6), `
                    name: "Add Unsigned Word",
                    purpose: "To add 32-bit integers.",
                    description: "rd <- rs + rt<br>The 32-bit word value in GPR rt is added to the 32-bit value in GPR rs and the 32-bit arithmetic result is placed into GPR rd.<br>No Integer Overflow exception occurs under any circumstances.",
                    restrictions: "On 64-bit processors, if either GPR rt or GPR rs do not contain sign-extended 32-bit values (bits 63..31 equal), then the result of the operation is undefined.",
                    operation: "if (NotWordValue(GPR[rs]) or NotWordValue(GPR[rt])) then UndefinedResult() endif<br>temp <- GPR[rs] + GPR[rt]<br>GPR[rd] <- sign_extend(temp31..0)",
                    exceptions: "None.",
                    programming_notes: "The term "unsigned" in the instruction name is a misnomer; this operation is 32-bit modulo arithmetic that does not trap on overflow. It is appropriate for arithmetic which is not signed, such as address arithmetic, or integer arithmetic environments that ignore overflow, such as "C" language arithmetic.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                const registers = cpu.getRegisters();
                const rd = registers[params.rd.getValue()].binary;
                const rs = registers[params.rs.getValue()].binary;
                const rt = registers[params.rt.getValue()].binary;
                rd.set(rs.getValue() + rt.getValue());
                cpu.pc.set(cpu.pc.getValue() + 4);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SUB', 'rd, rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b100010, 6), `
                    name: "Subtract Word",
                    purpose: "To subtract 32-bit integers. If overflow occurs, then trap.",
                    description: "rd <- rs - rt<br>The 32-bit word value in GPR rt is subtracted from the 32-bit value in GPR rs to produce a 32-bit result. If the subtraction results in 32-bit 2's complement arithmetic overflow then the destination register is not modified and an Integer Overflow exception occurs. If it does not overflow, the 32-bit result is placed into GPR rd.",
                    restrictions: "On 64-bit processors, if either GPR rt or GPR rs do not contain sign-extended 32-bit values (bits 63..31 equal), then the result of the operation is undefined.",
                    operation: "if (NotWordValue(GPR[rs]) or NotWordValue(GPR[rt])) then UndefinedResult() endif<br>temp <- GPR[rs] - GPR[rt]<br>if (32_bit_arithmetic_overflow) then<br>&emsp;SignalException(IntegerOverflow)<br>else<br>&emsp;GPR[rd] <- temp<br>endif",
                    exceptions: "Integer Overflow",
                    programming_notes: "SUBU performs the same arithmetic operation but, does not trap on overflow.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SUBU', 'rd, rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b100011, 6), `
                    name: "Subtract Unsigned Word",
                    purpose: "To subtract 32-bit integers.",
                    description: "rd <- rs - rt<br>The 32-bit word value in GPR rt is subtracted from the 32-bit value in GPR rs and the 32-bit arithmetic result is placed into GPR rd.<br>No integer overflow exception occurs under any circumstances.",
                    restrictions: "On 64-bit processors, if either GPR rt or GPR rs do not contain sign-extended 32-bit values (bits 63..31 equal), then the result of the operation is undefined.",
                    operation: "if (NotWordValue(GPR[rs]) or NotWordValue(GPR[rt])) then UndefinedResult() endif<br>temp <- GPR[rs] - GPR[rt]<br>GPR[rd] <- temp",
                    exceptions: "None.",
                    programming_notes: "The term "unsigned" in the instruction name is a misnomer; this operation is 32-bit modulo arithmetic that does not trap on overflow. It is appropriate for arithmetic which is not signed, such as address arithmetic, or integer arithmetic environments that ignore overflow, such as "C" language arithmetic.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('AND', 'rd, rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b100100, 6), `
                    name: "And",
                    purpose: "To do a bitwise logical AND.",
                    description: "rd <- rs AND rt<br>The contents of GPR rs are combined with the contents of GPR rt in a bitwise logical AND operation. The result is placed into GPR rd.",
                    restrictions: "None.",
                    operation: "GPR[rd] <- GPR[rs] and GPR[rt]",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('OR', 'rd, rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b100101, 6), `
                    name: "Or",
                    purpose: "To do a bitwise logical OR.",
                    description: "rd <- rs OR rt<br>The contents of GPR rs are combined with the contents of GPR rt in a bitwise logical OR operation. The result is placed into GPR rd.",
                    restrictions: "None.",
                    operation: "GPR[rd] <- GPR[rs] or GPR[rt]",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('XOR', 'rd, rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b100110, 6), `
                    name: "Exclusive OR",
                    purpose: "To do a bitwise logical EXCLUSIVE OR.",
                    description: "rd <- rs XOR rt<br>Combine the contents of GPR rs and GPR rt in a bitwise logical exclusive OR operation and place the result into GPR rd.",
                    restrictions: "None.",
                    operation: "GPR[rd] <- GPR[rs] xor GPR[rt]",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('NOR', 'rd, rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b100111, 6), `
                    name: "Not Or",
                    purpose: "To do a bitwise logical NOT OR.",
                    description: "rd <- rs NOR rt<br>The contents of GPR rs are combined with the contents of GPR rt in a bitwise logical NOR operation. The result is placed into GPR rd.",
                    restrictions: "None.",
                    operation: "GPR[rd] <- GPR[rs] nor GPR[rt]",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SLT', 'rd, rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b101010, 6), `
                    name: "Set On Less Than",
                    purpose: "To record the result of a less-than comparison.",
                    description: "rd <- (rs < rt)<br>Compare the contents of GPR rs and GPR rt as signed integers and record the Boolean result of the comparison in GPR rd. If GPR rs is less than GPR rt the result is 1 (true), otherwise 0 (false).<br>The arithmetic comparison does not cause an Integer Overflow exception.",
                    restrictions: "None.",
                    operation: "if GPR[rs] < GPR[rt] then<br>&emsp;GPR[rd] <- 0GPRLEN-1 || 1<br>else<br>&emsp;GPR[rd] <- 0GPRLEN<br>endif",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SLTU', 'rd, rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b101011, 6), `
                    name: "Set on Less Than Unsigned",
                    purpose: "To record the result of an unsigned less-than comparison.",
                    description: "rd <- (rs < rt)<br>Compare the contents of GPR rs and GPR rt as unsigned integers and record the Boolean result of the comparison in GPR rd. If GPR rs is less than GPR rt the result is 1 (true), otherwise 0 (false).<br>The arithmetic comparison does not cause an Integer Overflow exception.",
                    restrictions: "None.",
                    operation: "if (0 || GPR[rs]) < (0 || GPR[rt]) then<br>&emsp;GPR[rd] <- 0GPRLEN-1 || 1<br>else<br>&emsp;GPR[rd] <- 0GPRLEN<br>endif",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DADD', 'rd, rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b101100, 6), `
                    name: "Doubleword Add",
                    purpose: "To add 64-bit integers. If overflow occurs, then trap.",
                    description: "rd <- rs + rt<br>The 64-bit doubleword value in GPR rt is added to the 64-bit value in GPR rs to produce a 64-bit result. If the addition results in 64-bit 2's complement arithmetic overflow then the destination register is not modified and an Integer Overflow exception occurs. If it does not overflow, the 64-bit result is placed into GPR rd.",
                    restrictions: "None.",
                    operation: "64-bit processors:<br>temp <- GPR[rs] + GPR[rt]<br>if (64_bit_arithmetic_overflow) then<br>&emsp;SignalException(IntegerOverflow)<br>else<br>&emsp;GPR[rd] <- temp<br>endif",
                    exceptions: "Integer Overflow<br>Reserved Instruction",
                    programming_notes: "DADDU performs the same arithmetic operation but, does not trap on overflow.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DADDU', 'rd, rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b101101, 6), `
                    name: "Doubleword Add Unsigned",
                    purpose: "To add 64-bit integers.",
                    description: "rd <- rs + rt<br>The 64-bit doubleword value in GPR rt is added to the 64-bit value in GPR rs and the 64-bit arithmetic result is placed into GPR rd.<br>No Integer Overflow exception occurs under any circumstances.",
                    restrictions: "None.",
                    operation: "64-bit processors:<br>GPR[rd] <- GPR[rs] + GPR[rt]",
                    exceptions: "Reserved Instruction",
                    programming_notes: "The term "unsigned" in the instruction name is a misnomer; this operation is 64-bit modulo arithmetic that does not trap on overflow. It is appropriate for arithmetic which is not signed, such as address arithmetic, or integer arithmetic environments that ignore overflow, such as "C" language arithmetic.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('TGE', 'rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b110000, 6), `
                    name: "Trap if Greater or Equal",
                    purpose: "To compare GPRs and do a conditional Trap.",
                    description: "if (rs >= rt) then Trap.<br>Compare the contents of GPR rs and GPR rt as signed integers; if GPR rs is greater than or equal to GPR rt then take a Trap exception.<br>The contents of the code field are ignored by hardware and may be used to encode information for system software. To retrieve the information, system software must load the instruction word from memory.",
                    restrictions: "None.",
                    operation: "if GPR[rs] >= GPR[rt] then<br>&emsp;SignalException(Trap)<br>endif",
                    exceptions: "Reserved Instruction<br>Trap",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('TGEU', 'rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b110001, 6), `
                    name: "Trap If Greater or Equal Unsigned",
                    purpose: "To compare GPRs and do a conditional Trap.",
                    description: "if (rs >= rt) then Trap<br>Compare the contents of GPR rs and GPR rt as unsigned integers; if GPR rs is greater than or equal to GPR rt then take a Trap exception.<br>The contents of the code field are ignored by hardware and may be used to encode information for system software. To retrieve the information, system software must load the instruction word from memory.",
                    restrictions: "None.",
                    operation: "if (0 || GPR[rs]) >= (0 || GPR[rt]) then<br>&emsp;SignalException(Trap)<br>endif",
                    exceptions: "Reserved Instruction<br>Trap",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('TLT', 'rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b110010, 6), `
                    name: "Trap if Less Than",
                    purpose: "To compare GPRs and do a conditional Trap.",
                    description: "if (rs < rt) then Trap<br>Compare the contents of GPR rs and GPR rt as signed integers; if GPR rs is less than GPR rt then take a Trap exception.<br>The contents of the code field are ignored by hardware and may be used to encode information for system software. To retrieve the information, system software must load the instruction word from memory.",
                    restrictions: "None.",
                    operation: "if GPR[rs] < GPR[rt] then<br>&emsp;SignalException(Trap)<br>endif",
                    exceptions: "Reserved Instruction<br>Trap",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('TLTU', 'rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b110011, 6), `
                    name: "Trap if Less Than Unsigned",
                    purpose: "To compare GPRs and do a conditional Trap.",
                    description: "if (rs < rt) then Trap<br>Compare the contents of GPR rs and GPR rt as unsigned integers; if GPR rs is less than GPR rt then take a Trap exception.<br>The contents of the code field are ignored by hardware and may be used to encode information for system software. To retrieve the information, system software must load the instruction word from memory.",
                    restrictions: "None.",
                    operation: "if (0 || GPR[rs]) < (0 || GPR[rt]) then<br>&emsp;SignalException(Trap)<br>endif",
                    exceptions: "Reserved Instruction<br>Trap",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('TEQ', 'rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b110100, 6), `
                    name: "Trap if Equal",
                    purpose: "To compare GPRs and do a conditional Trap.",
                    description: "if (rs = rt) then Trap<br>Compare the contents of GPR rs and GPR rt as signed integers; if GPR rs is equal to GPR rt then take a Trap exception.<br>The contents of the code field are ignored by hardware and may be used to encode information for system software. To retrieve the information, system software must load the instruction word from memory.",
                    restrictions: "None.",
                    operation: "if GPR[rs] = GPR[rt] then<br>&emsp;SignalException(Trap)<br>endif",
                    exceptions: "Reserved Instruction<br>Trap",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('TNE', 'rs, rt', 'R', new Binary(0b000000, 6), new Binary(0b110110, 6), `
                    name: "Trap if Not Equal",
                    purpose: "To compare GPRs and do a conditional Trap.",
                    description: "if (rs !=  rt) then Trap<br>Compare the contents of GPR rs and GPR rt as signed integers; if GPR rs is not equal to GPR rt then take a Trap exception.<br>The contents of the code field are ignored by hardware and may be used to encode information for system software. To retrieve the information, system software must load the instruction word from memory.",
                    restrictions: "None.",
                    operation: "if GPR[rs] !=  GPR[rt] then<br>&emsp;SignalException(Trap)<br>endif",
                    exceptions: "Reserved Instruction<br>Trap",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DSLL', 'rd, rt, sa', 'R', new Binary(0b000000, 6), new Binary(0b111000, 6), `
                    name: "Doubleword Shift Left Logical",
                    purpose: "To left shift a doubleword by a fixed amount -- 0 to 31 bits.",
                    description: "rd <- rt << sa<br>The 64-bit doubleword contents of GPR rt are shifted left, inserting zeros into the emptied bits; the result is placed in GPR rd. The bit shift count in the range 0 to 31 is specified by sa.",
                    restrictions: "None.",
                    operation: "64-bit processors:<br>s <- 0 || sa<br>GPR[rd] <- GPR[rt](63-s)..0 || 0s",
                    exceptions: "Reserved Instruction",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DSRL', 'rd, rt, sa', 'R', new Binary(0b000000, 6), new Binary(0b111010, 6), `
                    name: "Doubleword Shift Right Logical",
                    purpose: "To logical right shift a doubleword by a fixed amount -- 0 to 31 bits.",
                    description: "rd <- rt >> sa (logical)<br>The doubleword contents of GPR rt are shifted right, inserting zeros into the emptied bits; the result is placed in GPR rd. The bit shift count in the range 0 to 31 is specified by sa.",
                    restrictions: "None.",
                    operation: "64-bit processors:<br>s <- 0 || sa<br>GPR[rd] <- 0s || GPR[rt]63..s",
                    exceptions: "Reserved Instruction",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DSRA', 'rd, rt, sa', 'R', new Binary(0b000000, 6), new Binary(0b111011, 6), `
                    name: "Doubleword Shift Right Arithmetic",
                    purpose: "To arithmetic right shift a doubleword by a fixed amount -- 0 to 31 bits.",
                    description: "rd <- rt >> sa (arithmetic)<br>The 64-bit doubleword contents of GPR rt are shifted right, duplicating the sign bit (63) into the emptied bits; the result is placed in GPR rd. The bit shift count in the range 0 to 31 is specified by sa.",
                    restrictions: "None.",
                    operation: "64-bit processors:<br>s <- 0 || sa<br>GPR[rd] <- (GPR[rt]63)s || GPR[rt] 63..s",
                    exceptions: "Reserved Instruction",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DSLL32', 'rd, rt, sa', 'R', new Binary(0b000000, 6), new Binary(0b111100, 6), `
                    name: "Doubleword Shift Left Logical Plus 32",
                    purpose: "To left shift a doubleword by a fixed amount -- 32 to 63 bits.",
                    description: "rd <- rt << (sa+32)<br>The 64-bit doubleword contents of GPR rt are shifted left, inserting zeros into the emptied bits; the result is placed in GPR rd. The bit shift count in the range 32 to 63 is specified by sa+32.",
                    restrictions: "None.",
                    operation: "64-bit processors:<br>s <- 1 || sa /* 32+sa */<br>GPR[rd] <- GPR[rt](63-s)..0 || 0s",
                    exceptions: "Reserved Instruction",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DSRL32', 'rd, rt, sa', 'R', new Binary(0b000000, 6), new Binary(0b111110, 6), `
                    name: "Doubleword Shift Right Logical Plus 32",
                    purpose: "To logical right shift a doubleword by a fixed amount -- 32 to 63 bits.",
                    description: "rd <- rt >> (sa+32) (logical)<br>The 64-bit doubleword contents of GPR rt are shifted right, inserting zeros into the emptied bits; the result is placed in GPR rd. The bit shift count in the range 32 to 63 is specified by sa+32.",
                    restrictions: "None.",
                    operation: "64-bit processors:<br>s <- 1 || sa /* 32+sa */<br>GPR[rd] <- 0s || GPR[rt]63..s",
                    exceptions: "Reserved Instruction",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DSRA32', 'rd, rt, sa', 'R', new Binary(0b000000, 6), new Binary(0b111111, 6), `
                    name: "Doubleword Shift Right Arithmetic Plus 32",
                    purpose: "To arithmetic right shift a doubleword by a fixed amount -- 32-63 bits.",
                    description: "rd <- rt >> (sa+32) (arithmetic)<br>The doubleword contents of GPR rt are shifted right, duplicating the sign bit (63) into the emptied bits; the result is placed in GPR rd. The bit shift count in the range 32 to 63 is specified by sa+32.",
                    restrictions: "None.",
                    operation: "64-bit processors:<br>s <- 1 || sa /* 32+sa */<br>GPR[rd] <- (GPR[rt]63)s || GPR[rt]63..s",
                    exceptions: "Reserved Instruction",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('J', 'target', 'J', new Binary(0b000010, 6), undefined, `
                    name: "Jump",
                    purpose: "To branch within the current 256 MB aligned region.",
                    description: "This is a PC-region branch (not PC-relative); the effective target address is in the "current" 256 MB aligned region. The low 28 bits of the target address is the instr_index field shifted left 2 bits. The remaining upper bits are the corresponding bits of the address of the instruction in the delay slot (not the branch itself).<br>Jump to the effective target address. Execute the instruction following the jump, in the branch delay slot, before jumping.",
                    restrictions: "None.",
                    operation: "I:<br>I+1:<br>&emsp;PC <- PCGPRLEN..28 || instr_index || 02",
                    exceptions: "None.",
                    programming_notes: "Forming the branch target address by catenating PC and index bits rather than adding a signed offset to the PC is an advantage if all program code addresses fit into a 256 MB region aligned on a 256 MB boundary. It allows a branch to anywhere in the region from anywhere in the region which a signed relative offset would not allow.   <br>This definition creates the boundary case where the branch instruction is in the last word of a 256 MB region and can therefore only branch to the following 256 MB region containing the branch delay slot.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('JAL', 'target', 'J', new Binary(0b000011, 6), undefined, `
                    name: "Jump And Link",
                    purpose: "To procedure call within the current 256 MB aligned region.",
                    description: "Place the return address link in GPR 31. The return link is the address of the second instruction following the branch, where execution would continue after a procedure call.<br>This is a PC-region branch (not PC-relative); the effective target address is in the "current" 256 MB aligned region. The low 28 bits of the target address is the instr_index field shifted left 2 bits. The remaining upper bits are the corresponding bits of the address of the instruction in the delay slot (not the branch itself).<br>Jump to the effective target address. Execute the instruction following the jump, in the branch delay slot, before jumping.",
                    restrictions: "None.",
                    operation: "I:<br>&emsp;GPR[31] <- PC + 8<br>I+1:<br>&emsp;PC <- PCGPRLEN..28 || instr_index || 02",
                    exceptions: "None.",
                    programming_notes: "Forming the branch target address by catenating PC and index bits rather than adding a signed offset to the PC is an advantage if all program code addresses fit into a 256 MB region aligned on a 256 MB boundary. It allows a branch to anywhere in the region from anywhere in the region which a signed relative offset would not allow. <br>This definition creates the boundary case where the branch instruction is in the last word of a 256 MB region and can therefore only branch to the following 256 MB region containing the branch delay slot.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('BEQ', 'rs, rt, offset', 'I', new Binary(0b000100, 6), undefined, `
                    name: "Branch on Equal",
                    purpose: "To compare GPRs then do a PC-relative conditional branch.",
                    description: "if (rs = rt) then branch<br>An 18-bit signed offset (the 16-bit offset field shifted left 2 bits) is added to the address of the instruction following the branch (not the branch itself), in the branch delay slot, to form a PC-relative effective target address.<br>If the contents of GPR rs and GPR rt are equal, branch to the effective target address after the instruction in the delay slot is executed.",
                    restrictions: "None.",
                    operation: "I:<br>&emsp;tgt_offset <- sign_extend(offset || 02)<br>&emsp;condition <- (GPR[rs] = GPR[rt])<br>I+1:<br>&emsp;if condition then<br>&emsp;&emsp;PC <- PC + tgt_offset<br>&emsp;endif",
                    exceptions: "None.",
                    programming_notes: "With the 18-bit signed instruction offset, the conditional branch range is ± 128 KBytes. Use jump (J) or jump register (JR) instructions to branch to more distant addresses.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('BNE', 'rs, rt, offset', 'I', new Binary(0b000101, 6), undefined, `
                    name: "Branch on Not Equal",
                    purpose: "To compare GPRs then do a PC-relative conditional branch.",
                    description: "if (rs !=  rt) then branch<br>An 18-bit signed offset (the 16-bit offset field shifted left 2 bits) is added to the address of the instruction following the branch (not the branch itself), in the branch delay slot, to form a PC-relative effective target address.<br>If the contents of GPR rs and GPR rt are not equal, branch to the effective target address after the instruction in the delay slot is executed.",
                    restrictions: "None.",
                    operation: "I:<br>&emsp;tgt_offset <- sign_extend(offset || 02)<br>&emsp;condition <- (GPR[rs] !=  GPR[rt])<br>I+1:<br>&emsp;if condition then<br>&emsp;&emsp;PC <- PC + tgt_offset<br>&emsp;endif",
                    exceptions: "None.",
                    programming_notes: "With the 18-bit signed instruction offset, the conditional branch range is ± 128 KBytes. Use jump (J) or jump register (JR) instructions to branch to more distant addresses.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('BLEZ', 'rs, offset', 'I', new Binary(0b000110, 6), undefined, `
                    name: "Branch on Less Than or Equal to Zero",
                    purpose: "To test a GPR then do a PC-relative conditional branch.",
                    description: "if (rs <= 0) then branch<br>An 18-bit signed offset (the 16-bit offset field shifted left 2 bits) is added to the address of the instruction following the branch (not the branch itself), in the branch delay slot, to form a PC-relative effective target address.<br>If the contents of GPR rs are less than or equal to zero (sign bit is 1 or value is zero), branch to the effective target address after the instruction in the delay slot is executed.",
                    restrictions: "None.",
                    operation: "I:<br>&emsp;tgt_offset <- sign_extend(offset || 02)<br>&emsp;condition <- GPR[rs] <= 0GPRLEN<br>I+1:<br>&emsp;if condition then<br>&emsp;&emsp;PC <- PC + tgt_offset<br>&emsp;endif",
                    exceptions: "None.",
                    programming_notes: "With the 18-bit signed instruction offset, the conditional branch range is ± 128 KBytes. Use jump (J) or jump register (JR) instructions to branch to more distant addresses.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('BGTZ', 'rs, offset', 'I', new Binary(0b000111, 6), undefined, `
                    name: "Branch on Greater Than Zero",
                    purpose: "To test a GPR then do a PC-relative conditional branch.",
                    description: "if (rs > 0) then branch<br>An 18-bit signed offset (the 16-bit offset field shifted left 2 bits) is added to the address of the instruction following the branch (not the branch itself), in the branch delay slot, to form a PC-relative effective target address.<br>If the contents of GPR rs are greater than zero (sign bit is 0 but value not zero), branch to the effective target address after the instruction in the delay slot is executed.",
                    restrictions: "None.",
                    operation: "I:<br>&emsp;tgt_offset <- sign_extend(offset || 02)<br>&emsp;condition <- GPR[rs] > 0GPRLEN<br>I+1:<br>&emsp;if condition then<br>&emsp;&emsp;PC <- PC + tgt_offset<br>&emsp;endif",
                    exceptions: "None.",
                    programming_notes: "With the 18-bit signed instruction offset, the conditional branch range is ± 128 KBytes. Use jump (J) or jump register (JR) instructions to branch to more distant addresses.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                const registers = cpu.getRegisters();
                const rs = registers[params.rs.getValue()].binary;
                const offset = Utils.fromSigned(params.immediate.getValue(), 18) << 2;
                cpu.pc.set(cpu.pc.getValue() + 4);
                if (rs.getValue() > 0) {
                    cpu.pc.set(cpu.pc.getValue() + offset);
                }
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('ADDI', 'rt, rs, immediate', 'I', new Binary(0b001000, 6), undefined, `
                    name: "Add Immediate Word",
                    purpose: "To add a constant to a 32-bit integer. If overflow occurs, then trap.",
                    description: "rt <- rs + immediate<br>The 16-bit signed immediate is added to the 32-bit value in GPR rs to produce a 32-bit result. If the addition results in 32-bit 2's complement arithmetic overflow then the destination register is not modified and an Integer Overflow exception occurs. If it does not overflow, the 32-bit result is placed into GPR rt.",
                    restrictions: "On 64-bit processors, if GPR rs does not contain a sign-extended 32-bit value (bits 63..31 equal), then the result of the operation is undefined.",
                    operation: "if (NotWordValue(GPR[rs])) then UndefinedResult() endif<br>temp <- GPR[rs] + sign_extend(immediate)<br>if (32_bit_arithmetic_overflow) then<br>&emsp;SignalException(IntegerOverflow)<br>else<br>&emsp;GPR[rt] <- sign_extend(temp31..0)<br>endif",
                    exceptions: "Integer Overflow",
                    programming_notes: "ADDIU performs the same arithmetic operation but, does not trap on overflow.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('ADDIU', 'rt, rs, immediate', 'I', new Binary(0b001001, 6), undefined, `
                    name: "Add Immediate Unsigned Word",
                    purpose: "To add a constant to a 32-bit integer.",
                    description: "rt <- rs + immediate<br>The 16-bit signed immediate is added to the 32-bit value in GPR rs and the 32-bit arithmetic result is placed into GPR rt.<br>No Integer Overflow exception occurs under any circumstances.",
                    restrictions: "On 64-bit processors, if GPR rs does not contain a sign-extended 32-bit value (bits 63..31 equal), then the result of the operation is undefined.",
                    operation: "if (NotWordValue(GPR[rs])) then UndefinedResult() endif<br>temp <- GPR[rs] + sign_extend(immediate)<br>GPR[rt] <- sign_extend(temp31..0)",
                    exceptions: "None.",
                    programming_notes: "The term "unsigned" in the instruction name is a misnomer; this operation is 32-bit modulo arithmetic that does not trap on overflow. It is appropriate for arithmetic which is not signed, such as address arithmetic, or integer arithmetic environments that ignore overflow, such as "C" language arithmetic.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                const registers = cpu.getRegisters();
                const rt = registers[params.rt.getValue()].binary;
                const rs = registers[params.rs.getValue()].binary;
                const immediate = params.immediate.getValue();
                rt.set(rs.getValue() + immediate);
                cpu.pc.set(cpu.pc.getValue() + 4);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SLTI', 'rt, rs, immediate', 'I', new Binary(0b001010, 6), undefined, `
                    name: "Set on Less Than Immediate",
                    purpose: "To record the result of a less-than comparison with a constant.",
                    description: "rt <- (rs < immediate)<br>Compare the contents of GPR rs and the 16-bit signed immediate as signed integers and record the Boolean result of the comparison in GPR rt. If GPR rs is less than immediate the result is 1 (true), otherwise 0 (false).<br>The arithmetic comparison does not cause an Integer Overflow exception.",
                    restrictions: "None.",
                    operation: "if GPR[rs] < sign_extend(immediate) then<br>&emsp;GPR[rd] <- 0GPRLEN-1|| 1<br>else<br>&emsp;GPR[rd] <- 0GPRLEN<br>endif",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SLTIU', 'rt, rs, immediate', 'I', new Binary(0b001011, 6), undefined, `
                    name: "Set on Less Than Immediate Unsigned",
                    purpose: "To record the result of an unsigned less-than comparison with a constant.",
                    description: "rt <- (rs < immediate)<br>Compare the contents of GPR rs and the sign-extended 16-bit immediate as unsigned integers and record the Boolean result of the comparison in GPR rt. If GPR rs is less than immediate the result is 1 (true), otherwise 0 (false).<br>Because the 16-bit immediate is sign-extended before comparison, the instruction is able to represent the smallest or largest unsigned numbers. The representable values are at the minimum [0, 32767] or maximum [max_unsigned-32767, max_unsigned] end of the unsigned range.<br>The arithmetic comparison does not cause an Integer Overflow exception.",
                    restrictions: "None.",
                    operation: "if (0 || GPR[rs]) < (0 || sign_extend(immediate)) then<br>&emsp;GPR[rd] <- 0GPRLEN-1 || 1<br>else<br>&emsp;GPR[rd] <- 0GPRLEN<br>endif",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('ANDI', 'rt, rs, immediate', 'I', new Binary(0b001100, 6), undefined, `
                    name: "And Immediate",
                    purpose: "To do a bitwise logical AND with a constant.",
                    description: "rt <- rs AND immediate<br>The 16-bit immediate is zero-extended to the left and combined with the contents of GPR rs in a bitwise logical AND operation. The result is placed into GPR rt.",
                    restrictions: "None.",
                    operation: "GPR[rt] <- zero_extend(immediate) and GPR[rs]",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('ORI', 'rt, rs, immediate', 'I', new Binary(0b001101, 6), undefined, `
                    name: "Or Immediate",
                    purpose: "To do a bitwise logical OR with a constant.",
                    description: "rd <- rs OR immediate<br>The 16-bit immediate is zero-extended to the left and combined with the contents of GPR rs in a bitwise logical OR operation. The result is placed into GPR rt.",
                    restrictions: "None.",
                    operation: "GPR[rt] <- zero_extend(immediate) or GPR[rs]",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                const registers = cpu.getRegisters();
                const rt = registers[params.rt.getValue()].binary;
                const rs = registers[params.rs.getValue()].binary;
                const immediate = params.immediate.getValue();
                rt.set(rs.getValue() | immediate);
                cpu.pc.set(cpu.pc.getValue() + 4);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('XORI', 'rt, rs, immediate', 'I', new Binary(0b001110, 6), undefined, `
                    name: "Exclusive OR Immediate",
                    purpose: "To do a bitwise logical EXCLUSIVE OR with a constant.",
                    description: "rt <- rs XOR immediate<br>Combine the contents of GPR rs and the 16-bit zero-extended immediate in a bitwise logical exclusive OR operation and place the result into GPR rt.",
                    restrictions: "None.",
                    operation: "GPR[rt] <- GPR[rs] xor zero_extend(immediate)",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('LUI', 'rt, immediate', 'I', new Binary(0b001111, 6), undefined, `
                    name: "Load Upper Immediate",
                    purpose: "To load a constant into the upper half of a word.",
                    description: "rt <- immediate || 016.<br>The 16-bit immediate is shifted left 16 bits and concatenated with 16 bits of low-order zeros. The 32-bit result is sign-extended and placed into GPR rt.",
                    restrictions: "None.",
                    operation: "GPR[rt] <- sign_extend(immediate || 016)",
                    exceptions: "None.",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                const registers = cpu.getRegisters();
                const rt = registers[params.rt.getValue()].binary;
                const immediate = params.immediate.getValue();
                rt.set(immediate << 16);
                cpu.pc.set(cpu.pc.getValue() + 4);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('COP0', 'cop_fun', 'I', new Binary(0b010000, 6), undefined, `
                    name: "Coprocessor Operation",
                    purpose: "To execute a coprocessor instruction.",
                    description: "The coprocessor operation specified by cop_fun is performed by coprocessor unit 0. Details of coprocessor operations must be found in the specification for each coprocessor.<br>Each MIPS architecture level defines up to 4 coprocessor units, numbered 0 to 3. The opcodes corresponding to coprocessors that are not defined by an architecture level may be used for other instructions.",
                    restrictions: "Access to the coprocessors is controlled by system software. Each coprocessor has a "coprocessor usable" bit in the System Control coprocessor. The usable bit must be set for a user program to execute a coprocessor instruction. If the usable bit is not set, an attempt to execute the instruction will result in a Coprocessor Unusable exception. An unimplemented coprocessor must never be enabled. The result of executing this instruction for an unimplemented coprocessor when the usable bit is set, is undefined.<br>See specification for the specific coprocessor being programmed.",
                    operation: "CoprocessorOperation (0, cop_fun)",
                    exceptions: "Reserved Instruction<br>Coprocessor Unusable<br>Coprocessor interrupt or Floating-Point Exception (CP1 only for some processors)",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('COP1', 'cop_fun', 'I', new Binary(0b010001, 6), undefined, `
                    name: "Coprocessor Operation",
                    purpose: "To execute a coprocessor instruction.",
                    description: "The coprocessor operation specified by cop_fun is performed by coprocessor unit 1. Details of coprocessor operations must be found in the specification for each coprocessor.<br>Each MIPS architecture level defines up to 4 coprocessor units, numbered 0 to 3. The opcodes corresponding to coprocessors that are not defined by an architecture level may be used for other instructions.",
                    restrictions: "Access to the coprocessors is controlled by system software. Each coprocessor has a "coprocessor usable" bit in the System Control coprocessor. The usable bit must be set for a user program to execute a coprocessor instruction. If the usable bit is not set, an attempt to execute the instruction will result in a Coprocessor Unusable exception. An unimplemented coprocessor must never be enabled. The result of executing this instruction for an unimplemented coprocessor when the usable bit is set, is undefined.<br>See specification for the specific coprocessor being programmed.",
                    operation: "CoprocessorOperation (1, cop_fun)",
                    exceptions: "Reserved Instruction<br>Coprocessor Unusable<br>Coprocessor interrupt or Floating-Point Exception (CP1 only for some processors)",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('COP2', 'cop_fun', 'I', new Binary(0b010010, 6), undefined, `
                    name: "Coprocessor Operation",
                    purpose: "To execute a coprocessor instruction.",
                    description: "The coprocessor operation specified by cop_fun is performed by coprocessor unit 2. Details of coprocessor operations must be found in the specification for each coprocessor.<br>Each MIPS architecture level defines up to 4 coprocessor units, numbered 0 to 3. The opcodes corresponding to coprocessors that are not defined by an architecture level may be used for other instructions.",
                    restrictions: "Access to the coprocessors is controlled by system software. Each coprocessor has a "coprocessor usable" bit in the System Control coprocessor. The usable bit must be set for a user program to execute a coprocessor instruction. If the usable bit is not set, an attempt to execute the instruction will result in a Coprocessor Unusable exception. An unimplemented coprocessor must never be enabled. The result of executing this instruction for an unimplemented coprocessor when the usable bit is set, is undefined.<br>See specification for the specific coprocessor being programmed.",
                    operation: "CoprocessorOperation (2, cop_fun)",
                    exceptions: "Reserved Instruction<br>Coprocessor Unusable<br>Coprocessor interrupt or Floating-Point Exception (CP1 only for some processors)",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('COP3', 'cop_fun', 'I', new Binary(0b010011, 6), undefined, `
                    name: "Coprocessor Operation",
                    purpose: "To execute a coprocessor instruction.",
                    description: "The coprocessor operation specified by cop_fun is performed by coprocessor unit 3. Details of coprocessor operations must be found in the specification for each coprocessor.<br>Each MIPS architecture level defines up to 4 coprocessor units, numbered 0 to 3. The opcodes corresponding to coprocessors that are not defined by an architecture level may be used for other instructions.",
                    restrictions: "Access to the coprocessors is controlled by system software. Each coprocessor has a "coprocessor usable" bit in the System Control coprocessor. The usable bit must be set for a user program to execute a coprocessor instruction. If the usable bit is not set, an attempt to execute the instruction will result in a Coprocessor Unusable exception. An unimplemented coprocessor must never be enabled. The result of executing this instruction for an unimplemented coprocessor when the usable bit is set, is undefined.<br>See specification for the specific coprocessor being programmed.",
                    operation: "CoprocessorOperation (3, cop_fun)",
                    exceptions: "Reserved Instruction<br>Coprocessor Unusable<br>Coprocessor interrupt or Floating-Point Exception (CP1 only for some processors)",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('BEQL', 'rs, rt, offset', 'I', new Binary(0b010100, 6), undefined, `
                    name: "Branch on Equal Likely",
                    purpose: "To compare GPRs then do a PC-relative conditional branch; execute the delay slot only if the branch is taken.",
                    description: "if (rs = rt) then branch_likely<br>An 18-bit signed offset (the 16-bit offset field shifted left 2 bits) is added to the address of the instruction following the branch (not the branch itself), in the branch delay slot, to form a PC-relative effective target address.<br>If the contents of GPR rs and GPR rt are equal, branch to the target address after the instruction in the delay slot is executed. If the branch is not taken, the instruction in the delay slot is not executed.",
                    restrictions: "None.",
                    operation: "I:<br>&emsp;tgt_offset <- sign_extend(offset || 02)<br>&emsp;condition <- (GPR[rs] = GPR[rt])<br>I+1:<br>&emsp;if condition then<br>&emsp;&emsp;PC <- PC + tgt_offset<br>&emsp;else<br>&emsp;&emsp;NullifyCurrentInstruction()<br>&emsp;endif",
                    exceptions: "Reserved Instruction",
                    programming_notes: "With the 18-bit signed instruction offset, the conditional branch range is ± 128 KBytes. Use jump (J) or jump register (JR) instructions to branch to more distant addresses.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('BNEL', 'rs, rt, offset', 'I', new Binary(0b010101, 6), undefined, `
                    name: "Branch on Not Equal Likely",
                    purpose: "To compare GPRs then do a PC-relative conditional branch; execute the delay slot only if the branch is taken.",
                    description: "if (rs !=  rt) then branch_likely<br>An 18-bit signed offset (the 16-bit offset field shifted left 2 bits) is added to the address of the instruction following the branch (not the branch itself), in the branch delay slot, to form a PC-relative effective target address.<br>If the contents of GPR rs and GPR rt are not equal, branch to the effective target address after the instruction in the delay slot is executed. If the branch is not taken, the instruction in the delay slot is not executed.",
                    restrictions: "None.",
                    operation: "I:<br>&emsp;tgt_offset <- sign_extend(offset || 02)<br>&emsp;condition <- (GPR[rs] !=  GPR[rt])<br>I+1:<br>&emsp;if condition then<br>&emsp;&emsp;PC <- PC + tgt_offset<br>&emsp;else<br>&emsp;&emsp;NullifyCurrentInstruction()<br>&emsp;endif",
                    exceptions: "Reserved Instruction",
                    programming_notes: "With the 18-bit signed instruction offset, the conditional branch range is ± 128 KBytes. Use jump (J) or jump register (JR) instructions to branch to more distant addresses.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('BLEZL', 'rs, offset', 'I', new Binary(0b010110, 6), undefined, `
                    name: "Branch on Less Than or Equal to Zero Likely",
                    purpose: "To test a GPR then do a PC-relative conditional branch; execute the delay slot only if the branch is taken.",
                    description: "if (rs <= 0) then branch_likely<br>An 18-bit signed offset (the 16-bit offset field shifted left 2 bits) is added to the address of the instruction following the branch (not the branch itself), in the branch delay slot, to form a PC-relative effective target address.<br>If the contents of GPR rs are less than or equal to zero (sign bit is 1 or value is zero), branch to the effective target address after the instruction in the delay slot is executed. If the branch is not taken, the instruction in the delay slot is not executed.",
                    restrictions: "None.",
                    operation: "I:<br>&emsp;tgt_offset <- sign_extend(offset || 02)<br>&emsp;condition <- GPR[rs] <= 0GPRLEN<br>I+1:<br>&emsp;if condition then<br>&emsp;&emsp;PC <- PC + tgt_offset<br>&emsp;else<br>&emsp;&emsp;NullifyCurrentInstruction()<br>&emsp;endif",
                    exceptions: "Reserved Instruction",
                    programming_notes: "With the 18-bit signed instruction offset, the conditional branch range is ± 128 KBytes. Use jump (J) or jump register (JR) instructions to branch to more distant addresses.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('BGTZL', 'rs, offset', 'I', new Binary(0b010111, 6), undefined, `
                    name: "Branch on Greater Than Zero Likely",
                    purpose: "To test a GPR then do a PC-relative conditional branch; execute the delay slot only if the branch is taken.",
                    description: "if (rs > 0) then branch_likely<br>An 18-bit signed offset (the 16-bit offset field shifted left 2 bits) is added to the address of the instruction following the branch (not the branch itself), in the branch delay slot, to form a PC-relative effective target address.<br>If the contents of GPR rs are greater than zero (sign bit is 0 but value not zero), branch to the effective target address after the instruction in the delay slot is executed. If the branch is not taken, the instruction in the delay slot is not executed.",
                    restrictions: "None.",
                    operation: "I:<br>&emsp;tgt_offset <- sign_extend(offset || 02)<br>&emsp;condition <- GPR[rs] > 0GPRLEN<br>I+1:<br>&emsp;if condition then<br>&emsp;&emsp;PC <- PC + tgt_offset<br>&emsp;else<br>&emsp;&emsp;NullifyCurrentInstruction()<br>&emsp;endif",
                    exceptions: "Reserved Instruction",
                    programming_notes: "With the 18-bit signed instruction offset, the conditional branch range is ± 128 KBytes. Use jump (J) or jump register (JR) instructions to branch to more distant addresses.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DADDI', 'rt, rs, immediate', 'I', new Binary(0b011000, 6), undefined, `
                    name: "Doubleword Add Immediate",
                    purpose: "To add a constant to a 64-bit integer. If overflow occurs, then trap.",
                    description: "rt <- rs + immediate<br>The 16-bit signed immediate is added to the 64-bit value in GPR rs to produce a 64-bit result. If the addition results in 64-bit 2's complement arithmetic overflow then the destination register is not modified and an Integer Overflow exception occurs. If it does not overflow, the 64-bit result is placed into GPR rt.",
                    restrictions: "None.",
                    operation: "64-bit processors:<br>temp <- GPR[rs] + sign_extend(immediate)<br>if (64_bit_arithmetic_overflow) then<br>&emsp;SignalException(IntegerOverflow)<br>else<br>&emsp;GPR[rt] <- temp<br>endif",
                    exceptions: "Integer Overflow<br>Reserved Instruction",
                    programming_notes: "DADDIU performs the same arithmetic operation but, does not trap on overflow.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('DADDIU', 'rt, rs, immediate', 'I', new Binary(0b011001, 6), undefined, `
                    name: "Doubleword Add Immediate Unsigned",
                    purpose: "To add a constant to a 64-bit integer.",
                    description: "rt <- rs + immediate<br>The 16-bit signed immediate is added to the 64-bit value in GPR rs and the 64-bit arithmetic result is placed into GPR rt.<br>No Integer Overflow exception occurs under any circumstances.",
                    restrictions: "None.",
                    operation: "64-bit processors:<br>GPR[rt] <- GPR[rs] + sign_extend(immediate)",
                    exceptions: "Reserved Instruction",
                    programming_notes: "The term "unsigned" in the instruction name is a misnomer; this operation is 64-bit modulo arithmetic that does not trap on overflow. It is appropriate for arithmetic which is not signed, such as address arithmetic, or integer arithmetic environments that ignore overflow, such as "C" language arithmetic.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('LB', 'rt, offset(base)', 'I', new Binary(0b100000, 6), undefined, `
                    name: "Load Byte",
                    purpose: "To load a byte from memory as a signed value.",
                    description: "rt <- memory[base+offset]<br>The contents of the 8-bit byte at the memory location specified by the effective address are fetched, sign-extended, and placed in GPR rt. The 16-bit signed offset is added to the contents of GPR base to form the effective address.",
                    restrictions: "None.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddr(PSIZE-1).. 2 || (pAddr1..0 xor ReverseEndian2)<br>memword <- LoadMemory (uncached, BYTE, pAddr, vAddr, DATA)<br>byte <- vAddr1..0 xor BigEndianCPU2<br>GPR[rt] <- sign_extend(memword7+8*byte..8*byte)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddrPSIZE-1..3 || (pAddr2..0 xor ReverseEndian3)<br>memdouble <- LoadMemory (uncached, BYTE, pAddr, vAddr, DATA)<br>byte <- vAddr2..0 xor BigEndianCPU3<br>GPR[rt] <- sign_extend(memdouble7+8*byte..8*byte)",
                    exceptions: "TLB Refill, TLB Invalid<br>Address Error",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('LH', 'rt, offset(base)', 'I', new Binary(0b100001, 6), undefined, `
                    name: "Load Halfword",
                    purpose: "To load a halfword from memory as a signed value.",
                    description: "rt <- memory[base+offset].<br>The contents of the 16-bit halfword at the memory location specified by the aligned effective address are fetched, sign-extended, and placed in GPR rt. The 16-bit signed offset is added to the contents of GPR base to form the effective address.",
                    restrictions: "The effective address must be naturally aligned. If the least-significant bit of the address is non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order bit of the offset field must be zero. If it is not, the result of the instruction is undefined.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr0) !=  0 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddrPSIZE - 1..2 || (pAddr1..0 xor (ReverseEndian || 0))<br>memword <- LoadMemory (uncached, HALFWORD, pAddr, vAddr, DATA)<br>byte <- vAddr1..0 xor (BigEndianCPU || 0)<br>GPR[rt] <- sign_extend(memword15+8*byte..8* byte)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr0) !=  0 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddrPSIZE - 1..3 || (pAddr2..0 xor (ReverseEndian || 0))<br>memdouble <- LoadMemory (uncached, HALFWORD, pAddr, vAddr, DATA)<br>byte <- vAddr2..0 xor (BigEndianCPU2 || 0)<br>GPR[rt] <- sign_extend(memdouble15+8*byte..8* byte)",
                    exceptions: "TLB Refill , TLB Invalid<br>Bus Error<br>Address Error",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('LWL', 'rt, offset(base)', 'I', new Binary(0b100010, 6), undefined, `
                    name: "Load Word Left",
                    purpose: "To load the most-significant part of a word as a signed value from an unaligned memory address.",
                    description: "rt <- rt MERGE memory[base+offset]<br>The 16-bit signed offset is added to the contents of GPR base to form an effective address (EffAddr). EffAddr is the address of the most-significant of four consecutive bytes forming a word in memory (W) starting at an arbitrary byte boundary. A part of W, the most-significant one to four bytes, is in the aligned word containing EffAddr. This part of W is loaded into the most-significant (left) part of the word in GPR rt. The remaining least-significant part of the word in GPR rt is unchanged.<br>If GPR rt is a 64-bit register, the destination word is the low-order word of the register. The loaded value is treated as a signed value; the word sign bit (bit 31) is always loaded from memory and the new sign bit value is copied into bits 63..32.<br><figure><br><img src="images/lwl1.png" alt="Unaligned Word Load using LWL and LWR" width="600"><br><figcaption>Unaligned Word Load using LWL and LWR.</figcaption><br></figure><br>The figure above illustrates this operation for big-endian byte ordering for 32-bit and 64-bit registers. The four consecutive bytes in 2..5 form an unaligned word starting at location 2. A part of W, two bytes, is in the aligned word containing the most-significant byte at 2. First, LWL loads these two bytes into the left part of the destination register word and leaves the right part of the destination word unchanged. Next, the complementary LWR loads the remainder of the unaligned word.<br>The bytes loaded from memory to the destination register depend on both the offset of the effective address within an aligned word, i.e. the low two bits of the address (vAddr1..0), and the current byte ordering mode of the processor (big- or little-endian). The table below shows the bytes loaded for every combination of offset and byte ordering.<br><figure><br><img src="images/lwl2.png" alt="Bytes Loaded by LWL Instruction" width="600"><br><figcaption>Bytes Loaded by LWL Instruction.</figcaption><br></figure><br>The unaligned loads, LWL and LWR, are exceptions to the load-delay scheduling restriction in the MIPS I architecture. An unaligned load instruction to GPR rt that immediately follows another load to GPR rt can "read" the loaded data. It will correctly merge the 1 to 4 loaded bytes with the data loaded by the previous instruction.",
                    restrictions: "MIPS I scheduling restriction: The loaded data is not available for use by the following instruction. The instruction immediately following this one, unless it is an unaligned load (LWL, LWR), may not use GPR rt as a source register. If this restriction is violated, the result of the operation is undefined.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddr(PSIZE-1)..2 || (pAddr1..0 xor ReverseEndian2)<br>if BigEndianMem = 0 then<br>&emsp;pAddr <- pAddr(PSIZE-1)..2 || 02<br>endif<br>byte <- vAddr1..0 xor BigEndianCPU2<br>memword <- LoadMemory (uncached, byte, pAddr, vAddr, DATA)<br>GPR[rt] <- memword7+8*byte..0 || GPR[rt]23-8*byte..0<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddr(PSIZE-1)..3 || (pAddr2..0 xor ReverseEndian3)<br>if BigEndianMem = 0 then<br>&emsp;pAddr <- pAddr(PSIZE-1)..3 || 03<br>endif<br>byte <- 0 || (vAddr1..0 xor BigEndianCPU2)<br>word <- vAddr2 xor BigEndianCPU<br>memdouble <- LoadMemory (uncached, byte, pAddr, vAddr, DATA)<br>temp <- memdouble31+32*word-8*byte..32*word || GPR[rt]23-8*byte..0<br>GPR[rt] <- (temp31)32 || temp",
                    exceptions: "TLB Refill, TLB Invalid<br>Bus Error<br>Address Error",
                    programming_notes: "The architecture provides no direct support for treating unaligned words as unsigned values, i.e. zeroing bits 63..32 of the destination register when bit 31 is loaded. See SLL or SLLV for a single-instruction method of propagating the word sign bit in a register into the upper half of a 64-bit register.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('LW', 'rt, offset(base)', 'I', new Binary(0b100011, 6), undefined, `
                    name: "Load Word",
                    purpose: "To load a word from memory as a signed value.",
                    description: "rt <- memory[base+offset]<br>The contents of the 32-bit word at the memory location specified by the aligned effective address are fetched, sign-extended to the GPR register length if necessary, and placed in GPR rt. The 16-bit signed offset is added to the contents of GPR base to form the effective address.",
                    restrictions: "The effective address must be naturally aligned. If either of the two least-significant bits of the address are non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order 2 bits of the offset field must be zero. If they are not, the result of the instruction is undefined.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>memword <- LoadMemory (uncached, WORD, pAddr, vAddr, DATA)<br>GPR[rt] <- memword<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddrPSIZE-1..3 || (pAddr2..0 xor (ReverseEndian || 02))<br>memdouble <- LoadMemory (uncached, WORD, pAddr, vAddr, DATA)<br>byte <- vAddr2..0 xor (BigEndianCPU || 02)<br>GPR[rt] <- sign_extend(memdouble31+8*byte..8*byte)",
                    exceptions: "TLB Refill, TLB Invalid<br>Bus Error<br>Address Error",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('LBU', 'rt, offset(base)', 'I', new Binary(0b100100, 6), undefined, `
                    name: "Load Byte Unsigned",
                    purpose: "To load a byte from memory as an unsigned value.",
                    description: "rt <- memory[base+offset]<br>The contents of the 8-bit byte at the memory location specified by the effective address are fetched, zero-extended, and placed in GPR rt. The 16-bit signed offset is added to the contents of GPR base to form the effective address.",
                    restrictions: "None.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddrPSIZE - 1 .. 2 || (pAddr1..0 xor ReverseEndian2)<br>memword <- LoadMemory (uncached, BYTE, pAddr, vAddr, DATA)<br>byte <- vAddr1..0 xor BigEndianCPU2<br>GPR[rt] <- zero_extend(memword7+8* byte..8* byte)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddrPSIZE-1..3 || (pAddr2..0 xor ReverseEndian3)<br>memdouble <- LoadMemory (uncached, BYTE, pAddr, vAddr, DATA)<br>byte <- vAddr2..0 xor BigEndianCPU3<br>GPR[rt] <- zero_extend(memdouble7+8* byte..8* byte)",
                    exceptions: "TLB Refill, TLB Invalid<br>Address Error",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('LHU', 'rt, offset(base)', 'I', new Binary(0b100101, 6), undefined, `
                    name: "Load Halfword Unsigned",
                    purpose: "To load a halfword from memory as an unsigned value.",
                    description: "rt <- memory[base+offset]<br>The contents of the 16-bit halfword at the memory location specified by the aligned effective address are fetched, zero-extended, and placed in GPR rt. The 16-bit signed offset is added to the contents of GPR base to form the effective address.",
                    restrictions: "The effective address must be naturally aligned. If the least-significant bit of the address is non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order bit of the offset field must be zero. If it is not, the result of the instruction is undefined.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr0) !=  0 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddrPSIZE - 1..2 || (pAddr1..0 xor (ReverseEndian || 0))<br>memword <- LoadMemory (uncached, HALFWORD, pAddr, vAddr, DATA)<br>byte <- vAddr1..0 xor (BigEndianCPU || 0)<br>GPR[rt] <- zero_extend(memword15+8*byte..8*byte)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr0) !=  0 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddrPSIZE - 1..3 || (pAddr2..0 xor (ReverseEndian2 || 0))<br>memdouble <- LoadMemory (uncached, HALFWORD, pAddr, vAddr, DATA)<br>byte <- vAddr2..0 xor (BigEndianCPU2 || 0)<br>GPR[rt] <- zero_extend(memdouble15+8*byte..8*byte)",
                    exceptions: "TLB Refill, TLB Invalid<br>Address Error",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('LWR', 'rt, offset(base)', 'I', new Binary(0b100110, 6), undefined, `
                    name: "Load Word Right",
                    purpose: "",
                    description: "rt <- rt MERGE memory[base+offset]<br>The 16-bit signed offset is added to the contents of GPR base to form an effective address (EffAddr). EffAddr is the address of the least-significant of four consecutive bytes forming a word in memory (W) starting at an arbitrary byte boundary. A part of W, the least-significant one to four bytes, is in the aligned word containing EffAddr. This part of W is loaded into the least-significant (right) part of the word in GPR rt. The remaining most-significant part of the word in GPR rt is unchanged.<br>If GPR rt is a 64-bit register, the destination word is the low-order word of the register. The loaded value is treated as a signed value; if the word sign bit (bit 31) is loaded (i.e. when all four bytes are loaded) then the new sign bit value is copied into bits 63..32. If bit 31 is not loaded then the value of bits 63..32 is implementation dependent; the value is either unchanged or a copy of the current value of bit 31. Executing both LWR and LWL, in either order, delivers in a sign-extended word value in the destination register.<br><figure><br><img src="images/lwr1.png" alt="Unaligned Word Load using LWR and LWL" width="600"><br><figcaption>Unaligned Word Load using LWR and LWL.</figcaption><br></figure><br>The figure above illustrates this operation for big-endian byte ordering for 32-bit and 64-bit registers. The four consecutive bytes in 2..5 form an unaligned word starting at location 2. A part of W, two bytes, is in the aligned word containing the least-significant byte at 5. First, LWR loads these two bytes into the right part of the destination register. Next, the complementary LWL loads the remainder of the unaligned word.<br>The bytes loaded from memory to the destination register depend on both the offset of the effective address within an aligned word, i.e. the low two bits of the address (vAddr1..0), and the current byte ordering mode of the processor (big- or little-endian). The table below shows the bytes loaded for every combination of offset and byte ordering.<br><figure><br><img src="images/lwr2.png" alt="Bytes Loaded by LWR Instruction" width="600"><br><figcaption>Bytes Loaded by LWR Instruction.</figcaption><br></figure><br>The unaligned loads, LWL and LWR, are exceptions to the load-delay scheduling restriction in the MIPS I architecture. An unaligned load to GPR rt that immediately follows another load to GPR rt can "read" the loaded data. It will correctly merge the 1 to 4 loaded bytes with the data loaded by the previous instruction.",
                    restrictions: "MIPS I scheduling restriction: The loaded data is not available for use by the following instruction. The instruction immediately following this one, unless it is an unaligned load (LWL, LWR), may not use GPR rt as a source register. If this restriction is violated, the result of the operation is undefined.<br>None.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddr(PSIZE-1)..2 || (pAddr1..0 xor ReverseEndian2)<br>if BigEndianMem = 0 then<br>&emsp;pAddr <- pAddr(PSIZE-1)..2 || 02<br>endif<br>byte <- vAddr1..0 xor BigEndianCPU2<br>memword <- LoadMemory (uncached, byte, pAddr, vAddr, DATA)<br>GPR[rt] <- memword31..32-8*byte || GPR[rt]31-8*byte..0<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddr(PSIZE-1)..3 || (pAddr2..0 xor ReverseEndian3)<br>if BigEndianMem = 1 then<br>&emsp;pAddr <- pAddr(PSIZE-1)..3 || 03<br>endif<br>byte <- vAddr1..0 xor BigEndianCPU2<br>word <- vAddr2 xor BigEndianCPU<br>memdouble <- LoadMemory (uncached, 0 || byte, pAddr, vAddr, DATA)<br>temp <- GPR[rt]31..32-8*byte || memdouble31+32*word..32*word+8*byte<br>if byte = 4 then<br>&emsp;utemp <- (temp31)32&emsp;/* loaded bit 31, must sign extend */<br>else<br>&emsp;one of the following two behaviors:<br>&emsp;&emsp;utemp <- GPR[rt]63..32&emsp;/* leave what was there alone */<br>&emsp;&emsp;utemp <- (GPR[rt]31)32&emsp;/* sign-extend bit 31 */<br>endif<br>GPR[rt] <- utemp || temp",
                    exceptions: "TLB Refill, TLB Invalid<br>Bus Error<br>Address Error",
                    programming_notes: "The architecture provides no direct support for treating unaligned words as unsigned values, i.e. zeroing bits 63..32 of the destination register when bit 31 is loaded. See SLL or SLLV for a single-instruction method of propagating the word sign bit in a register into the upper half of a 64-bit register.",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SB', 'rt, offset(base)', 'I', new Binary(0b101000, 6), undefined, `
                    name: "Store Byte",
                    purpose: "To store a byte to memory.",
                    description: "memory[base+offset] <- rt<br>The least-significant 8-bit byte of GPR rt is stored in memory at the location specified by the effective address. The 16-bit signed offset is added to the contents of GPR base to form the effective address.",
                    restrictions: "None.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>pAddr <- pAddrPSIZE-1..2 || (pAddr1..0 xor ReverseEndian2)<br>byte <- vAddr1..0 xor BigEndianCPU2<br>dataword <- GPR[rt]31-8*byte..0 || 08*byte<br>StoreMemory (uncached, BYTE, dataword, pAddr, vAddr, DATA)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>pAddr <- pAddrPSIZE-1..3 || (pAddr2..0 xor ReverseEndian3)<br>byte <- vAddr2..0 xor BigEndianCPU3<br>datadouble <- GPR[rt]63-8*byte..0 || 08*byte<br>StoreMemory (uncached, BYTE, datadouble, pAddr, vAddr, DATA)",
                    exceptions: "TLB Refill, TLB Invalid<br>TLB Modified<br>Bus Error<br>Address Error",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SH', 'rt, offset(base)', 'I', new Binary(0b101001, 6), undefined, `
                    name: "Store Halfword",
                    purpose: "To store a halfword to memory.",
                    description: "memory[base+offset] <- rt<br>The least-significant 16-bit halfword of register rt is stored in memory at the location specified by the aligned effective address. The 16-bit signed offset is added to the contents of GPR base to form the effective address.",
                    restrictions: "The effective address must be naturally aligned. If the least-significant bit of the address is non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order bit of the offset field must be zero. If it is not, the result of the instruction is undefined.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr0) !=  0 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>pAddr <- pAddrPSIZE-1..2 || (pAddr1..0 xor (ReverseEndian || 0))<br>byte <- vAddr1..0 xor (BigEndianCPU || 0)<br>dataword <- GPR[rt]31-8*byte..0 || 08*byte<br>StoreMemory (uncached, HALFWORD, dataword, pAddr, vAddr, DATA)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr0) !=  0 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>pAddr <- pAddrPSIZE-1..3 || (pAddr2..0 xor (ReverseEndian2 || 0))<br>byte <- vAddr2..0 xor (BigEndianCPU2 || 0)<br>datadouble <- GPR[rt]63-8*byte..0 || 08*byte<br>StoreMemory (uncached, HALFWORD, datadouble, pAddr, vAddr, DATA)",
                    exceptions: "TLB Refill, TLB Invalid<br>TLB Modified<br>Address Error",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SWL', 'rt, offset(base)', 'I', new Binary(0b101010, 6), undefined, `
                    name: "Store Word Left",
                    purpose: "To store the most-significant part of a word to an unaligned memory address.",
                    description: "memory[base+offset] <- rt<br>The 16-bit signed offset is added to the contents of GPR base to form an effective address (EffAddr). EffAddr is the address of the most-significant of four consecutive bytes forming a word in memory (W) starting at an arbitrary byte boundary. A part of W, the most-significant one to four bytes, is in the aligned word containing EffAddr. The same number of the most-significant (left) bytes from the word in GPR rt are stored into these bytes of W.<br>If GPR rt is a 64-bit register, the source word is the low word of the register.<br><figure><br><img src="images/lwl1.png" alt="Unaligned Word Load using LWL and LWR" width="600"><br><figcaption>Unaligned Word Load using LWL and LWR.</figcaption><br></figure><br>The figure above illustrates this operation for big-endian byte ordering for 32-bit and 64-bit registers. The four consecutive bytes in 2..5 form an unaligned word starting at location 2. A part of W, two bytes, is contained in the aligned word containing the most-significant byte at 2. First, SWL stores the most-significant two bytes of the low-word from the source register into these two bytes in memory. Next, the complementary SWR stores the remainder of the unaligned word.<br><figure><br><img src="images/swl1.png" alt="Unaligned Word Store using SWL and SWR" width="600"><br><figcaption>Unaligned Word Store using SWL and SWR.</figcaption><br></figure><br>The bytes stored from the source register to memory depend on both the offset of the effective address within an aligned word, i.e. the low two bits of the address (vAddr1..0), and the current byte ordering mode of the processor (big- or little-endian). The table below shows the bytes stored for every combination of offset and byte ordering.<br><figure><br><img src="images/swl2.png" alt="Bytes Stored by SWL Instruction" width="600"><br><figcaption>Bytes Stored by SWL Instruction.</figcaption><br></figure>",
                    restrictions: "",
                    operation: "32-bit Processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>pAddr <- pAddr(PSIZE-1)..2 || (pAddr1..0 xor ReverseEndian2)<br>If BigEndianMem = 0 then<br>&emsp;pAddr <- pAddr(PSIZE-1)..2 || 02<br>endif<br>byte <- vAddr1..0 xor BigEndianCPU2<br>dataword <- 024-8*byte || GPR[rt]31..24-8*byte<br>StoreMemory (uncached, byte, dataword, pAddr, vAddr, DATA)<br>64-bit Processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>pAddr <- pAddr(PSIZE-1)..3 || (pAddr2..0 xor ReverseEndian3)<br>If BigEndianMem = 0 then<br>&emsp;pAddr <- pAddr(PSIZE-1)..2 || 02<br>endif<br>byte <- vAddr1..0 xor BigEndianCPU2<br>if (vAddr2 xor BigEndianCPU) = 0 then<br>&emsp;datadouble <- 032 || 024-8*byte || GPR[rt]31..24-8*byte<br>else<br>&emsp;datadouble <- 024-8*byte || GPR[rt]31..24-8*byte || 032<br>endif<br>StoreMemory(uncached, byte, datadouble, pAddr, vAddr, DATA)",
                    exceptions: "TLB Refill, TLB Invalid<br>TLB Modified<br>Bus Error<br>Address Error",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SW', 'rt, offset(base)', 'I', new Binary(0b101011, 6), undefined, `
                    name: "Store Word",
                    purpose: "To store a word to memory.",
                    description: "memory[base+offset] <- rt<br>The least-significant 32-bit word of register rt is stored in memory at the location specified by the aligned effective address. The 16-bit signed offset is added to the contents of GPR base to form the effective address.",
                    restrictions: "The effective address must be naturally aligned. If either of the two least-significant bits of the address are non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order 2 bits of the offset field must be zero. If they are not, the result of the instruction is undefined.",
                    operation: "32-bit Processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>dataword <- GPR[rt]<br>StoreMemory (uncached, WORD, dataword, pAddr, vAddr, DATA)<br>64-bit Processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>pAddr <- pAddrPSIZE-1..3 || (pAddr2..0 xor (ReverseEndian || 02)<br>byte <- vAddr2..0 xor (BigEndianCPU || 02)<br>datadouble <- GPR[rt]63-8*byte || 08*byte<br>StoreMemory (uncached, WORD, datadouble, pAddr, vAddr, DATA)",
                    exceptions: "TLB Refill, TLB Invalid<br>TLB Modified<br>Address Error",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SWR', 'rt, offset(base)', 'I', new Binary(0b101110, 6), undefined, `
                    name: "Store Word Right",
                    purpose: "To store the least-significant part of a word to an unaligned memory address.",
                    description: "memory[base+offset] <- rt<br>The 16-bit signed offset is added to the contents of GPR base to form an effective address (EffAddr). EffAddr is the address of the least-significant of four consecutive bytes forming a word in memory (W) starting at an arbitrary byte boundary. A part of W, the least-significant one to four bytes, is in the aligned word containing EffAddr. The same number of the least-significant (right) bytes from the word in GPR rt are stored into these bytes of W.<br>If GPR rt is a 64-bit register, the source word is the low word of the register.<br><figure><br><img src="images/lwl1.png" alt="Unaligned Word Load using LWL and LWR" width="600"><br><figcaption>Unaligned Word Load using LWL and LWR.</figcaption><br></figure><br>The figure above illustrates this operation for big-endian byte ordering for 32-bit and 64-bit registers. The four consecutive bytes in 2..5 form an unaligned word starting at location 2. A part of W, two bytes, is contained in the aligned word containing the least- significant byte at 5. First, SWR stores the least-significant two bytes of the low-word from the source register into these two bytes in memory. Next, the complementary SWL stores the remainder of the unaligned word.<br><figure><br><img src="images/swr1.png" alt="Unaligned Word Store using SWR and SWL" width="600"><br><figcaption>Unaligned Word Store using SWR and SWL.</figcaption><br></figure><br>The bytes stored from the source register to memory depend on both the offset of the effective address within an aligned word, i.e. the low two bits of the address (vAddr1..0), and the current byte ordering mode of the processor (big- or little-endian). The tabel below shows the bytes stored for every combination of offset and byte ordering.<br><figure><br><img src="images/swr2.png" alt="Bytes Stored by SWR Instruction" width="600"><br><figcaption>Bytes Stored by SWR Instruction.</figcaption><br></figure>",
                    restrictions: "None.",
                    operation: "32-bit Processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>pAddr <- pAddr(PSIZE-1)..2 || (pAddr1..0 xor ReverseEndian2)<br>BigEndianMem = 0 then<br>&emsp;pAddr <- pAddr(PSIZE-1)..2 || 02<br>endif<br>byte <- vAddr1..0 xor BigEndianCPU2<br>dataword <- GPR[rt]31-8*byte || 08*byte<br>StoreMemory (uncached, WORD-byte, dataword, pAddr, vAddr, DATA)<br>64-bit Processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>pAddr <- pAddr(PSIZE-1)..3 || (pAddr2..0 xor ReverseEndian3)<br>If BigEndianMem = 0 then<br>&emsp;pAddr <- pAddr(PSIZE-1)..2 || 02<br>endif<br>byte <- vAddr1..0 xor BigEndianCPU2<br>if (vAddr2 xor BigEndianCPU) = 0 then<br>&emsp;datadouble <- 032 || GPR[rt]31-8*byte..0 || 08*byte<br>else<br>&emsp;datadouble <- GPR[rt]31-8*byte..0 || 08*byte || 032<br>endif<br>StoreMemory(uncached, WORD-byte, datadouble, pAddr, vAddr, DATA)",
                    exceptions: "TLB Refill, TLB Invalid<br>TLB Modified<br>Bus Error<br>Address Error",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('LWC1', 'rt, offset(base)', 'I', new Binary(0b110001, 6), undefined, `
                    name: "Load Word To Coprocessor",
                    purpose: "To load a word from memory to a coprocessor general register.",
                    description: "rt <- memory[base+offset]<br>The contents of the 32-bit word at the memory location specified by the aligned effective address are fetched and made available to coprocessor unit 1. The 16-bit signed offset is added to the contents of GPR base to form the effective address.<br>The manner in which each coprocessor uses the data is defined by the individual coprocessor specification. The usual operation would place the data into coprocessor general register rt.<br>Each MIPS architecture level defines up to 4 coprocessor units, numbered 0 to 3. The opcodes corresponding to coprocessors that are not defined by an architecture level may be used for other instructions.",
                    restrictions: "Access to the coprocessors is controlled by system software. Each coprocessor has a "coprocessor usable" bit in the System Control coprocessor. The usable bit must be set for a user program to execute a coprocessor instruction. If the usable bit is not set, an attempt to execute the instruction will result in a Coprocessor Unusable exception. An unimplemented coprocessor must never be enabled. The result of executing this instruction for an unimplemented coprocessor when the usable bit is set, is undefined.<br>This instruction is not available for coprocessor 0, the System Control coprocessor, and the opcode may be used for other instructions.<br>The effective address must be naturally aligned. If either of the two least-significant bits of the address are non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order 2 bits of the offset field must be zero. If they are not, the result of the instruction is undefined.",
                    operation: "32-bit processors:<br>I:<br>&emsp;vAddr <- sign_extend(offset) + GPR[base]<br>&emsp;if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>&emsp;(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>&emsp;memword <- LoadMemory (uncached, WORD, pAddr, vAddr, DATA)<br>I+1:<br>&emsp;COP_LW (1, rt, memword)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base}<br>if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddrPSIZE-1..3 || (pAddr2..0 xor (ReverseEndian || 02))<br>memdouble <- LoadMemory (uncached, DOUBLEWORD, pAddr, vAddr, DATA)<br>byte <- vAddr2..0 xor (BigEndianCPU || 02)<br>memword <- memdouble31+8*byte..8*byte<br>COP_LW (1, rt, memdouble)",
                    exceptions: "TLB Refill, TLB Invalid<br>Bus Error<br>Address Error<br>Coprocessor Unusable",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('LWC2', 'rt, offset(base)', 'I', new Binary(0b110010, 6), undefined, `
                    name: "Load Word To Coprocessor",
                    purpose: "To load a word from memory to a coprocessor general register.",
                    description: "rt <- memory[base+offset]<br>The contents of the 32-bit word at the memory location specified by the aligned effective address are fetched and made available to coprocessor unit 2. The 16-bit signed offset is added to the contents of GPR base to form the effective address.<br>The manner in which each coprocessor uses the data is defined by the individual coprocessor specification. The usual operation would place the data into coprocessor general register rt.<br>Each MIPS architecture level defines up to 4 coprocessor units, numbered 0 to 3. The opcodes corresponding to coprocessors that are not defined by an architecture level may be used for other instructions.",
                    restrictions: "Access to the coprocessors is controlled by system software. Each coprocessor has a "coprocessor usable" bit in the System Control coprocessor. The usable bit must be set for a user program to execute a coprocessor instruction. If the usable bit is not set, an attempt to execute the instruction will result in a Coprocessor Unusable exception. An unimplemented coprocessor must never be enabled. The result of executing this instruction for an unimplemented coprocessor when the usable bit is set, is undefined.<br>This instruction is not available for coprocessor 0, the System Control coprocessor, and the opcode may be used for other instructions.<br>The effective address must be naturally aligned. If either of the two least-significant bits of the address are non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order 2 bits of the offset field must be zero. If they are not, the result of the instruction is undefined.",
                    operation: "32-bit processors:<br>I:<br>&emsp;vAddr <- sign_extend(offset) + GPR[base]<br>&emsp;if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>&emsp;(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>&emsp;memword <- LoadMemory (uncached, WORD, pAddr, vAddr, DATA)<br>I+1:<br>&emsp;COP_LW (2, rt, memword)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base}<br>if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddrPSIZE-1..3 || (pAddr2..0 xor (ReverseEndian || 02))<br>memdouble <- LoadMemory (uncached, DOUBLEWORD, pAddr, vAddr, DATA)<br>byte <- vAddr2..0 xor (BigEndianCPU || 02)<br>memword <- memdouble31+8*byte..8*byte<br>COP_LW (2, rt, memdouble)",
                    exceptions: "TLB Refill, TLB Invalid<br>Bus Error<br>Address Error<br>Coprocessor Unusable",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('LWC3', 'rt, offset(base)', 'I', new Binary(0b110011, 6), undefined, `
                    name: "Load Word To Coprocessor",
                    purpose: "To load a word from memory to a coprocessor general register.",
                    description: "rt <- memory[base+offset]<br>The contents of the 32-bit word at the memory location specified by the aligned effective address are fetched and made available to coprocessor unit 3. The 16-bit signed offset is added to the contents of GPR base to form the effective address.<br>The manner in which each coprocessor uses the data is defined by the individual coprocessor specification. The usual operation would place the data into coprocessor general register rt.<br>Each MIPS architecture level defines up to 4 coprocessor units, numbered 0 to 3. The opcodes corresponding to coprocessors that are not defined by an architecture level may be used for other instructions.",
                    restrictions: "Access to the coprocessors is controlled by system software. Each coprocessor has a "coprocessor usable" bit in the System Control coprocessor. The usable bit must be set for a user program to execute a coprocessor instruction. If the usable bit is not set, an attempt to execute the instruction will result in a Coprocessor Unusable exception. An unimplemented coprocessor must never be enabled. The result of executing this instruction for an unimplemented coprocessor when the usable bit is set, is undefined.<br>This instruction is not available for coprocessor 0, the System Control coprocessor, and the opcode may be used for other instructions.<br>The effective address must be naturally aligned. If either of the two least-significant bits of the address are non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order 2 bits of the offset field must be zero. If they are not, the result of the instruction is undefined.",
                    operation: "32-bit processors:<br>I:<br>&emsp;vAddr <- sign_extend(offset) + GPR[base]<br>&emsp;if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>&emsp;(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>&emsp;memword <- LoadMemory (uncached, WORD, pAddr, vAddr, DATA)<br>I+1:<br>&emsp;COP_LW (3, rt, memword)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base}<br>if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>pAddr <- pAddrPSIZE-1..3 || (pAddr2..0 xor (ReverseEndian || 02))<br>memdouble <- LoadMemory (uncached, DOUBLEWORD, pAddr, vAddr, DATA)<br>byte <- vAddr2..0 xor (BigEndianCPU || 02)<br>memword <- memdouble31+8*byte..8*byte<br>COP_LW (3, rt, memdouble)",
                    exceptions: "TLB Refill, TLB Invalid<br>Bus Error<br>Address Error<br>Coprocessor Unusable",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('LDC1', 'rt, offset(base)', 'I', new Binary(0b110101, 6), undefined, `
                    name: "Load Doubleword to Coprocessor",
                    purpose: "To load a doubleword from memory to a coprocessor general register.",
                    description: "rt <- memory[base+offset].<br>The contents of the 64-bit doubleword at the memory location specified by the aligned effective address are fetched and made available to coprocessor unit 1. The 16-bit signed offset is added to the contents of GPR base to form the effective address.<br>The manner in which each coprocessor uses the data is defined by the individual coprocessor specifications. The usual operation would place the data into coprocessor general register rt.<br>Each MIPS architecture level defines up to 4 coprocessor units, numbered 0 to 3. The opcodes corresponding to coprocessors that are not defined by an architecture level may be used for other instructions.",
                    restrictions: "Access to the coprocessors is controlled by system software. Each coprocessor has a "coprocessor usable" bit in the System Control coprocessor. The usable bit must be set for a user program to execute a coprocessor instruction. If the usable bit is not set, an attempt to execute the instruction will result in a Coprocessor Unusable exception. An unimplemented coprocessor must never be enabled. The result of executing this instruction for an unimplemented coprocessor when the usable bit is set, is undefined.<br>This instruction is not available for coprocessor 0, the System Control coprocessor, and the opcode may be used for other instructions.<br>The effective address must be naturally aligned. If any of the three least-significant bits of the effective address are non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order 3 bits of the offset field must be zero. If they are not, the result of the instruction is undefined.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr2..0) !=  03 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>memdouble <- LoadMemory (uncached, DOUBLEWORD, pAddr, vAddr, DATA)<br>COP_LD (1, rt, memdouble)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr2..0) !=  03 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>memdouble <- LoadMemory (uncached, DOUBLEWORD, pAddr, vAddr, DATA)<br>COP_LD (1, rt, memdouble)",
                    exceptions: "TLB Refill, TLB Invalid<br>Bus Error<br>Address Error<br>Reserved Instruction<br>Coprocessor Unusable",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('LDC2', 'rt, offset(base)', 'I', new Binary(0b110110, 6), undefined, `
                    name: "Load Doubleword to Coprocessor",
                    purpose: "To load a doubleword from memory to a coprocessor general register.",
                    description: "rt <- memory[base+offset].<br>The contents of the 64-bit doubleword at the memory location specified by the aligned effective address are fetched and made available to coprocessor unit 2. The 16-bit signed offset is added to the contents of GPR base to form the effective address.<br>The manner in which each coprocessor uses the data is defined by the individual coprocessor specifications. The usual operation would place the data into coprocessor general register rt.<br>Each MIPS architecture level defines up to 4 coprocessor units, numbered 0 to 3. The opcodes corresponding to coprocessors that are not defined by an architecture level may be used for other instructions.",
                    restrictions: "Access to the coprocessors is controlled by system software. Each coprocessor has a "coprocessor usable" bit in the System Control coprocessor. The usable bit must be set for a user program to execute a coprocessor instruction. If the usable bit is not set, an attempt to execute the instruction will result in a Coprocessor Unusable exception. An unimplemented coprocessor must never be enabled. The result of executing this instruction for an unimplemented coprocessor when the usable bit is set, is undefined.<br>This instruction is not available for coprocessor 0, the System Control coprocessor, and the opcode may be used for other instructions.<br>The effective address must be naturally aligned. If any of the three least-significant bits of the effective address are non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order 3 bits of the offset field must be zero. If they are not, the result of the instruction is undefined.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr2..0) !=  03 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>memdouble <- LoadMemory (uncached, DOUBLEWORD, pAddr, vAddr, DATA)<br>COP_LD (2, rt, memdouble)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr2..0) !=  03 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, LOAD)<br>memdouble <- LoadMemory (uncached, DOUBLEWORD, pAddr, vAddr, DATA)<br>COP_LD (2, rt, memdouble)",
                    exceptions: "TLB Refill, TLB Invalid<br>Bus Error<br>Address Error<br>Reserved Instruction<br>Coprocessor Unusable",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SC', 'rt, offset(base)', 'I', new Binary(0b111000, 6), undefined, `
                    name: "Store Conditional Word",
                    purpose: "To store a word to memory to complete an atomic read-modify-write.",
                    description: "if (atomic_update) then memory[base+offset] <- rt, rt <- 1 else rt <- 0<br>The LL and SC instructions provide primitives to implement atomic Read-Modify-Write (RMW) operations for cached memory locations.<br>The 16-bit signed offset is added to the contents of GPR base to form an effective address.<br>The SC completes the RMW sequence begun by the preceding LL instruction executed on the processor. If it would complete the RMW sequence atomically, then the least- significant 32-bit word of GPR rt is stored into memory at the location specified by the aligned effective address and a one, indicating success, is written into GPR rt. Otherwise, memory is not modified and a zero, indicating failure, is written into GPR rt.<br>If any of the following events occurs between the execution of LL and SC, the SC will fail:<br>-	A coherent store is completed by another processor or coherent I/O module into the block of physical memory containing the word. The size and alignment of the block is implementation dependent. It is at least one word and is at most the minimum page size.<br>-	An exception occurs on the processor executing the LL/SC. An implementation may detect "an exception" in one of three ways:<br>	1) Detect exceptions and fail when an exception occurs.<br>	2) Fail after the return-from-interrupt instruction (RFE or ERET) is executed.<br>	3) Do both 1 and 2.<br>If any of the following events occurs between the execution of LL and SC, the SC may succeed or it may fail; the success or failure is unpredictable. Portable programs should not cause one of these events.<br>-	A load, store, or prefetch is executed on the processor executing the LL/SC.<br>-	The instructions executed starting with the LL and ending with the SC do not lie in a 2048-byte contiguous region of virtual memory. The region does not have to be aligned, other than the alignment required for instruction words.<br>The following conditions must be true or the result of the SC will be undefined:<br>-	Execution of SC must have been preceded by execution of an LL instruction.<br>-	A RMW sequence executed without intervening exceptions must use the same address in the LL and SC. The address is the same if the virtual address, physical address, and cache-coherence algorithm are identical.<br>Atomic RMW is provided only for cached memory locations. The extent to which the detection of atomicity operates correctly depends on the system implementation and the memory access type used for the location.<br>MP atomicity: To provide atomic RMW among multiple processors, all accesses to the location must be made with a memory access type of cached coherent.<br>Uniprocessor atomicity: To provide atomic RMW on a single processor, all accesses to the location must be made with memory access type of either cached noncoherent or cached coherent. All accesses must be to one or the other access type, they may not be mixed.<br>I/O System: To provide atomic RMW with a coherent I/O system, all accesses to the location must be made with a memory access type of cached coherent. If the I/O system does not use coherent memory operations, then atomic RMW cannot be provided with respect to the I/O reads and writes.<br>The definition above applies to user-mode operation on all MIPS processors that support the MIPS II architecture. There may be other implementation-specific events, such as privileged CP0 instructions, that will cause an SC instruction to fail in some cases. System programmers using LL/SC should consult implementation-specific documentation.",
                    restrictions: "The addressed location must have a memory access type of cached noncoherent or cached coherent; if it does not, the result is undefined.<br>The effective address must be naturally aligned. If either of the two least-significant bits of the address are non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order 2 bits of the offset field must be zero. If they are not, the result of the instruction is undefined.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>dataword <- GPR[rt]<br>if LLbit then<br>&emsp;StoreMemory (uncached, WORD, dataword, pAddr, vAddr, DATA)<br>endif<br>GPR[rt] <- 031 || LLbit<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>pAddr <- pAddrPSIZE-1..3 || (pAddr2..0 xor (ReverseEndian || 02))<br>byte <- vAddr2..0 xor (BigEndianCPU || 02)<br>datadouble <- GPR[rt]63-8*byte..0 || 08*byte<br>if LLbit then<br>&emsp;StoreMemory (uncached, WORD, datadouble, pAddr, vAddr, DATA)<br>endif<br>GPR[rt] <- 063 || LLbit",
                    exceptions: "TLB Refill, TLB Invalid<br>TLB Modified<br>Address Error<br>Reserved Instruction",
                    programming_notes: "LL and SC are used to atomically update memory locations as shown in the example atomic increment operation below.<br>L1:<br>	LL	T1, (T0)	# load counter<br>	ADDI	T2, T1, 1	# increment<br>	SC	T2, (T0)	# try to store, checking for atomicity<br>	BEQ	T2, 0, L1	# if not atomic (0), try again<br>	NOP	# branch-delay slot<br>Exceptions between the LL and SC cause SC to fail, so persistent exceptions must be avoided. Some examples of these are arithmetic operations that trap, system calls, floating-point operations that trap or require software emulation assistance.<br>LL and SC function on a single processor for cached noncoherent memory so that parallel programs can be run on uniprocessor systems that do not support cached coherent memory access types.",
                    implementation_notes: "The block of memory that is "locked" for LL/SC is typically the largest cache line in use."
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SWC1', 'rt, offset(base)', 'I', new Binary(0b111001, 6), undefined, `
                    name: "Store Word From Coprocessor",
                    purpose: "To store a word from a coprocessor general register to memory.",
                    description: "memory[base+offset] <- rt.<br>Coprocessor unit 1 supplies a 32-bit word which is stored at the memory location specified by the aligned effective address. The 16-bit signed offset is added to the contents of GPR base to form the effective address.<br>The data supplied by each coprocessor is defined by the individual coprocessor specifications. The usual operation would read the data from coprocessor general register rt.<br>Each MIPS architecture level defines up to 4 coprocessor units, numbered 0 to 3. The opcodes corresponding to coprocessors that are not defined by an architecture level may be used for other instructions.",
                    restrictions: "Access to the coprocessors is controlled by system software. Each coprocessor has a "coprocessor usable" bit in the System Control coprocessor. The usable bit must be set for a user program to execute a coprocessor instruction. If the usable bit is not set, an attempt to execute the instruction will result in a Coprocessor Unusable exception. An unimplemented coprocessor must never be enabled. The result of executing this instruction for an unimplemented coprocessor when the usable bit is set, is undefined.<br>This instruction is not available for coprocessor 0, the System Control coprocessor, and the opcode may be used for other instructions.<br>The effective address must be naturally aligned. If either of the two least-significant bits of the address are non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order 2 bits of the offset field must be zero. If they are not, the result of the instruction is undefined.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>dataword <- COP_SW (1, rt)<br>StoreMemory (uncached, WORD, dataword, pAddr, vAddr, DATA)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>pAddr <- pAddrPSIZE-1..3 || (pAddr2..0 xor (ReverseEndian || 02)<br>byte <- vAddr2..0 xor (BigEndianCPU || 02)<br>dataword <- COP_SW (1, rt)<br>datadouble <- 032-8*byte || dataword || 08*byte<br>StoreMemory (uncached, WORD, datadouble, pAddr, vAddr DATA)",
                    exceptions: "TLB Refill, TLB Invalid<br>TLB Modified<br>Address Error<br>Reserved Instruction<br>Coprocessor Unusable",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SWC2', 'rt, offset(base)', 'I', new Binary(0b111010, 6), undefined, `
                    name: "Store Word From Coprocessor",
                    purpose: "To store a word from a coprocessor general register to memory.",
                    description: "memory[base+offset] <- rt.<br>Coprocessor unit 2 supplies a 32-bit word which is stored at the memory location specified by the aligned effective address. The 16-bit signed offset is added to the contents of GPR base to form the effective address.<br>The data supplied by each coprocessor is defined by the individual coprocessor specifications. The usual operation would read the data from coprocessor general register rt.<br>Each MIPS architecture level defines up to 4 coprocessor units, numbered 0 to 3. The opcodes corresponding to coprocessors that are not defined by an architecture level may be used for other instructions.",
                    restrictions: "Access to the coprocessors is controlled by system software. Each coprocessor has a "coprocessor usable" bit in the System Control coprocessor. The usable bit must be set for a user program to execute a coprocessor instruction. If the usable bit is not set, an attempt to execute the instruction will result in a Coprocessor Unusable exception. An unimplemented coprocessor must never be enabled. The result of executing this instruction for an unimplemented coprocessor when the usable bit is set, is undefined.<br>This instruction is not available for coprocessor 0, the System Control coprocessor, and the opcode may be used for other instructions.<br>The effective address must be naturally aligned. If either of the two least-significant bits of the address are non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order 2 bits of the offset field must be zero. If they are not, the result of the instruction is undefined.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>dataword <- COP_SW (2, rt)<br>StoreMemory (uncached, WORD, dataword, pAddr, vAddr, DATA)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>pAddr <- pAddrPSIZE-1..3 || (pAddr2..0 xor (ReverseEndian || 02)<br>byte <- vAddr2..0 xor (BigEndianCPU || 02)<br>dataword <- COP_SW (2, rt)<br>datadouble <- 032-8*byte || dataword || 08*byte<br>StoreMemory (uncached, WORD, datadouble, pAddr, vAddr DATA)",
                    exceptions: "TLB Refill, TLB Invalid<br>TLB Modified<br>Address Error<br>Reserved Instruction<br>Coprocessor Unusable",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SWC3', 'rt, offset(base)', 'I', new Binary(0b111011, 6), undefined, `
                    name: "Store Word From Coprocessor",
                    purpose: "To store a word from a coprocessor general register to memory.",
                    description: "memory[base+offset] <- rt.<br>Coprocessor unit 3 supplies a 32-bit word which is stored at the memory location specified by the aligned effective address. The 16-bit signed offset is added to the contents of GPR base to form the effective address.<br>The data supplied by each coprocessor is defined by the individual coprocessor specifications. The usual operation would read the data from coprocessor general register rt.<br>Each MIPS architecture level defines up to 4 coprocessor units, numbered 0 to 3. The opcodes corresponding to coprocessors that are not defined by an architecture level may be used for other instructions.",
                    restrictions: "Access to the coprocessors is controlled by system software. Each coprocessor has a "coprocessor usable" bit in the System Control coprocessor. The usable bit must be set for a user program to execute a coprocessor instruction. If the usable bit is not set, an attempt to execute the instruction will result in a Coprocessor Unusable exception. An unimplemented coprocessor must never be enabled. The result of executing this instruction for an unimplemented coprocessor when the usable bit is set, is undefined.<br>This instruction is not available for coprocessor 0, the System Control coprocessor, and the opcode may be used for other instructions.<br>The effective address must be naturally aligned. If either of the two least-significant bits of the address are non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order 2 bits of the offset field must be zero. If they are not, the result of the instruction is undefined.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>dataword <- COP_SW (3, rt)<br>StoreMemory (uncached, WORD, dataword, pAddr, vAddr, DATA)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr1..0) !=  02 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>pAddr <- pAddrPSIZE-1..3 || (pAddr2..0 xor (ReverseEndian || 02)<br>byte <- vAddr2..0 xor (BigEndianCPU || 02)<br>dataword <- COP_SW (3, rt)<br>datadouble <- 032-8*byte || dataword || 08*byte<br>StoreMemory (uncached, WORD, datadouble, pAddr, vAddr DATA)",
                    exceptions: "TLB Refill, TLB Invalid<br>TLB Modified<br>Address Error<br>Reserved Instruction<br>Coprocessor Unusable",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SDC1', 'rt, offset(base)', 'I', new Binary(0b111101, 6), undefined, `
                    name: "Store Doubleword From Coprocessor",
                    purpose: "To store a doubleword from a coprocessor general register to memory.",
                    description: "memory[base+offset] <- rt<br>Coprocessor unit 1 supplies a 64-bit doubleword which is stored at the memory location specified by the aligned effective address. The 16-bit signed offset is added to the contents of GPR base to form the effective address.<br>The data supplied by each coprocessor is defined by the individual coprocessor specifications. The usual operation would read the data from coprocessor general register rt.<br>Each MIPS architecture level defines up to 4 coprocessor units, numbered 0 to 3. The opcodes corresponding to coprocessors that are not defined by an architecture level may be used for other instructions.",
                    restrictions: "Access to the coprocessors is controlled by system software. Each coprocessor has a "coprocessor usable" bit in the System Control coprocessor. The usable bit must be set for a user program to execute a coprocessor instruction. If the usable bit is not set, an attempt to execute the instruction will result in a Coprocessor Unusable exception. An unimplemented coprocessor must never be enabled. The result of executing this instruction for an unimplemented coprocessor when the usable bit is set, is undefined.<br>This instruction is not defined for coprocessor 0, the System Control coprocessor, and the opcode may be used for other instructions.<br>The effective address must be naturally aligned. If any of the three least-significant bits of the effective address are non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order 3 bits of the offset field must be zero. If they are not, the result of the instruction is undefined.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr2..0) !=  03 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>datadouble <- COP_SD(1, rt)<br>StoreMemory (uncached, DOUBLEWORD, datadouble, pAddr, vAddr, DATA)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr2..0) !=  03 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>datadouble <- COP_SD(1, rt)<br>StoreMemory (uncached, DOUBLEWORD, datadouble, pAddr, vAddr, DATA)",
                    exceptions: "TLB Refill, TLB Invalid<br>TLB Modified<br>Address Error<br>Reserved Instruction<br>Coprocessor Unusable",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
        this.instructions.push(new class extends Instruction {
            constructor() {
                super('SDC2', 'rt, offset(base)', 'I', new Binary(0b111110, 6), undefined, `
                    name: "Store Doubleword From Coprocessor",
                    purpose: "To store a doubleword from a coprocessor general register to memory.",
                    description: "memory[base+offset] <- rt<br>Coprocessor unit 2 supplies a 64-bit doubleword which is stored at the memory location specified by the aligned effective address. The 16-bit signed offset is added to the contents of GPR base to form the effective address.<br>The data supplied by each coprocessor is defined by the individual coprocessor specifications. The usual operation would read the data from coprocessor general register rt.<br>Each MIPS architecture level defines up to 4 coprocessor units, numbered 0 to 3. The opcodes corresponding to coprocessors that are not defined by an architecture level may be used for other instructions.",
                    restrictions: "Access to the coprocessors is controlled by system software. Each coprocessor has a "coprocessor usable" bit in the System Control coprocessor. The usable bit must be set for a user program to execute a coprocessor instruction. If the usable bit is not set, an attempt to execute the instruction will result in a Coprocessor Unusable exception. An unimplemented coprocessor must never be enabled. The result of executing this instruction for an unimplemented coprocessor when the usable bit is set, is undefined.<br>This instruction is not defined for coprocessor 0, the System Control coprocessor, and the opcode may be used for other instructions.<br>The effective address must be naturally aligned. If any of the three least-significant bits of the effective address are non-zero, an Address Error exception occurs.<br>MIPS IV: The low-order 3 bits of the offset field must be zero. If they are not, the result of the instruction is undefined.",
                    operation: "32-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr2..0) !=  03 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>datadouble <- COP_SD(2, rt)<br>StoreMemory (uncached, DOUBLEWORD, datadouble, pAddr, vAddr, DATA)<br>64-bit processors:<br>vAddr <- sign_extend(offset) + GPR[base]<br>if (vAddr2..0) !=  03 then SignalException(AddressError) endif<br>(pAddr, uncached) <- AddressTranslation (vAddr, DATA, STORE)<br>datadouble <- COP_SD(2, rt)<br>StoreMemory (uncached, DOUBLEWORD, datadouble, pAddr, vAddr, DATA)",
                    exceptions: "TLB Refill, TLB Invalid<br>TLB Modified<br>Address Error<br>Reserved Instruction<br>Coprocessor Unusable",
                    programming_notes: "",
                    implementation_notes: ""
                    `);
            }
            execute(cpu, params) {
                throw new Error(`${this.symbol} not implemented yet`);
            }
        }());
    }
    initPseudoInstructions() {
        this.pseudoInstructions.push(new class extends PseudoInstruction {
            constructor() {
                super('MOVE', 'rd, rs');
            }
            expand(assembler, tokens) {
                const params = this.mapParams(tokens);
                return [
                    ['addu', params['rd'], '$zero', params['rs']]
                ];
            }
        }());
        this.pseudoInstructions.push(new class extends PseudoInstruction {
            constructor() {
                super('LI', 'rd, immediate');
            }
            expand(assembler, tokens) {
                const params = this.mapParams(tokens);
                const immediate = parseInt(params['immediate']);
                if (immediate < -32768 || immediate > 32767) {
                    const upper = Utils.fromSigned((immediate >>> 16) & 0xFFFF, 16);
                    const lower = immediate & 0xFFFF;
                    return [
                        ['lui', params['rd'], `${upper}`],
                        ['ori', params['rd'], params['rd'], `${lower}`]
                    ];
                }
                else {
                    return [
                        ['addiu', params['rd'], '$zero', params['immediate']]
                    ];
                }
            }
        }());
        this.pseudoInstructions.push(new class extends PseudoInstruction {
            constructor() {
                super('LA', 'rd, label');
            }
            expand(assembler, tokens) {
                const params = this.mapParams(tokens);
                const label = params['label'];
                const address = assembler.labels.get(label);
                if (address === undefined) {
                    throw new Error(`Label "${label}" not found.`);
                }
                const upper = Utils.fromSigned((address.getValue() >>> 16) & 0xFFFF, 16);
                const lower = address.getValue() & 0xFFFF;
                return [
                    ['lui', params['rd'], `${upper}`],
                    ['ori', params['rd'], params['rd'], `${lower}`]
                ];
            }
        }());
        this.pseudoInstructions.push(new class extends PseudoInstruction {
            constructor() {
                super('BLT', 'rs, rt, label');
            }
            expand(assembler, tokens) {
                const params = this.mapParams(tokens);
                return [];
            }
        }());
        this.pseudoInstructions.push(new class extends PseudoInstruction {
            constructor() {
                super('BLE', 'rs, rt, label');
            }
            expand(assembler, tokens) {
                const params = this.mapParams(tokens);
                return [];
            }
        }());
        this.pseudoInstructions.push(new class extends PseudoInstruction {
            constructor() {
                super('BGT', 'rs, rt, label');
            }
            expand(assembler, tokens) {
                const params = this.mapParams(tokens);
                return [];
            }
        }());
        this.pseudoInstructions.push(new class extends PseudoInstruction {
            constructor() {
                super('BGE', 'rs, rt, label');
            }
            expand(assembler, tokens) {
                const params = this.mapParams(tokens);
                return [];
            }
        }());
    }
}
