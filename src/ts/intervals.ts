import { HIDE_AT_POINTER } from "./settings.js";
import { getFromStorage } from "./utils.js";
import { vm } from "./virtual-machine.js";
import { Binary } from "./virtual-machine/Utils.js";

export const minAddress = 4194304;
export const maxAddress = 2147483648;

interface cell {
    address: number;
    binary: Binary;
    tags: { name: string; type: string }[];
}

interface interval {
    id: number;
    cells: cell[];
    formats: {
        value: string;
        valueGranularity: string;
    };
}

export function getIntervalExtremes(interval: interval): {
    start: number;
    end: number;
} | null {
    if (interval.cells.length > 0)
        return {
            start: interval.cells[0].address,
            end: interval.cells[interval.cells.length - 1].address,
        };
    else return null;
}

interface userInterval {
    start: number;
    end: number;
}

export function getMemoryIntervals() {
    const memory = vm.getMemory();
    if (memory.length === 0) {
        return [];
    }
    let intervals = [];
    let currentInterval = [memory[0]];
    for (let i = 1; i < memory.length; i++) {
        const currentCell = memory[i];
        const previousCell = memory[i - 1];

        if (currentCell.address - previousCell.address <= 4) {
            currentInterval.push(currentCell);
        } else {
            intervals.push(extendInterval(currentInterval));
            currentInterval = [currentCell];
        }
    }
    intervals.push(extendInterval(currentInterval));
    intervals = mergeIntervals(intervals, getUserIntervals());

    intervals.forEach((interval) => addCellTags(interval));
    return intervals;
}

function getUserIntervals(): userInterval[] {
    return getFromStorage("local", "userIntervals") ?? [];
}

function mergeIntervals(
    intervals: interval[],
    userIntervals: userInterval[],
): interval[] {
    const memory = vm.cpu.memory;
    const userCell = function (addr: number): cell {
        return {
            address: addr,
            binary: memory.loadWord(new Binary(addr)),
            tags: [],
        };
    };

    let newIntervals: interval[] = [];
    for (const userInterval of userIntervals) {
        let extended = false;
        for (let interval of intervals) {
            const intervalStart = interval.cells[0].address;
            const intervalEnd =
                interval.cells[interval.cells.length - 1].address;
            // if the intervals overlap then merge them
            if (
                intervalStart <= userInterval.end &&
                userInterval.start <= intervalEnd
            ) {
                extended = true;
                for (
                    let addr = intervalStart - 4;
                    addr >= userInterval.start;
                    addr -= 4
                ) {
                    interval.cells.unshift(userCell(addr));
                }
                for (
                    let addr = intervalEnd + 4;
                    addr <= userInterval.end;
                    addr += 4
                ) {
                    interval.cells.push(userCell(addr));
                }
            }
        }
        if (!extended) {
            const cells = [];
            for (
                let addr = userInterval.start;
                addr <= userInterval.end;
                addr += 4
            ) {
                cells.push(userCell(addr));
            }
            if (cells.length === 0) {
                console.warn(
                    `Found user interval with end < start, ignoring: ${userInterval.start}..${userInterval.end}`,
                );
                continue;
            }
            newIntervals.push(extendInterval(cells));
        }
    }
    let res = [...intervals, ...newIntervals];
    res.sort((a, b) => a.id - b.id);
    return res;
}

function addCellTags(interval: interval) {
    for (const cell of interval.cells) {
        vm.assembler.allLabels.forEach((address, label) => {
            if (address) {
                const addressValue = address.getValue();
                if (
                    cell.address === addressValue ||
                    (addressValue > cell.address &&
                        addressValue < cell.address + 4)
                ) {
                    cell.tags.push({ name: label + ":", type: "label" });
                }
            }
        });
        for (const register of vm.getRegisters()) {
            if (HIDE_AT_POINTER && register.name === "$at") continue;
            const addressValue = register.binary.getValue();
            if (
                cell.address === addressValue ||
                (addressValue > cell.address && addressValue < cell.address + 4)
            ) {
                if (register.name === "pc") {
                    cell.tags.push({ name: register.name, type: "pc" });
                } else {
                    if (register.number) {
                        cell.tags.push({
                            name: vm.cpu.registers.getRegisterFormat(
                                register.number,
                                getFromStorage("local", "settings").colsFormats[
                                    "registers-name-format"
                                ],
                                vm.cpu.registers,
                            ),
                            type: "register",
                        });
                    }
                }
            }
        }
    }
}

/** Adds the column format options to the provided cells.
 * If there are saved options applies them, otherwise uses defaults*/
function extendInterval(cells: cell[]): interval {
    const settings = getFromStorage("local", "settings");
    const id = cells.length > 0 ? cells[0].address : 0;
    const interval = {
        id: id,
        cells: cells,
        formats: {
            value: settings.colsFormats["memory-value-format"],
            valueGranularity: settings.colsFormats["memory-value-granularity"],
        },
    };
    if (
        interval.cells[0].address >= 4194304 &&
        interval.cells[interval.cells.length - 1].address < 268500992
    ) {
        interval.formats.value = "asm";
    }
    if (settings.colsFormats[`memory-value-format_${id}`]) {
        interval.formats.value =
            settings.colsFormats[`memory-value-format_${id}`];
    }
    if (settings.colsFormats[`memory-value-granularity_${id}`]) {
        interval.formats.valueGranularity =
            settings.colsFormats[`memory-value-granularity_${id}`];
    }
    return interval;
}

export function setGranularTooltips() {
    for (const granularElem of document.getElementsByClassName("granular")) {
        const addrElem =
            granularElem.parentElement?.getElementsByClassName("address")[0]!;
        const initialAddr = addrElem.classList.contains("hexadecimal")
            ? parseInt(addrElem.innerHTML.trim(), 16)
            : parseInt(addrElem.innerHTML.trim(), 10);
        const parts = granularElem.getElementsByClassName("value");
        for (let i = 0; i < parts.length; i++) {
            const part = parts.item(i) as HTMLElement;
            let addr;
            if (vm.cpu.memory.isBigEndian()) {
                addr =
                    parts.length === 2 ? initialAddr + i * 2 : initialAddr + i;
            } else {
                addr =
                    parts.length === 2
                        ? initialAddr + 4 - (i + 1) * 2
                        : initialAddr + 4 - (i + 1);
            }
            part.title = `Address: 0x${new Binary(addr).getHex()}`;
        }
    }
}
