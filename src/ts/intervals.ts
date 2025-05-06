import { getFromStorage } from "./utils.js";
import { vm } from "./virtual-machine.js";
import { Binary } from "./virtual-machine/Utils.js";

interface cell {
    address: number;
    binary: Binary;
    tags: { name: string; type: string }[];
}

interface interval {
    id: number;
    cells: cell[];
    formats: {
        address: string;
        value: string;
        valueGranularity: string;
    };
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
    const intervals = [];
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
    intervals.push(extendInterval(currentInterval, intervals.length));
    mergeIntervals(intervals, getUserIntervals());

    intervals.forEach((interval) => addCellTags(interval));
    return intervals;
}

function getUserIntervals(): userInterval[] {
    return (
        getFromStorage("local", "user Intervals") ?? [
            {
                start: 4194324,
                end: 4194348,
            },
            {
                start: 268500984,
                end: 268500996,
            },
            {
                start: 268460984,
                end: 268460992,
            },
        ]
    );
}

function mergeIntervals(
    intervals: interval[],
    userIntervals: userInterval[],
): interval[] {
    let newIntervals: interval[] = [];
    const memory = vm.cpu.memory;
    userIntervals.sort((a, b) => a.start - b.start);
    for (const userInterval of userIntervals) {
        for (let interval of intervals) {
            const intervalStart = interval.cells[0].address;
            const intervalEnd =
                interval.cells[interval.cells.length - 1].address;
            // if the intervals overlap then merge them
            if (
                intervalStart <= userInterval.end &&
                userInterval.start <= intervalEnd
            ) {
                for (
                    let addr = intervalStart - 4;
                    addr >= userInterval.start;
                    addr -= 4
                ) {
                    interval.cells.unshift({
                        address: addr,
                        binary: memory.loadWord(new Binary(addr)),
                        tags: [],
                    });
                }
                for (
                    let addr = intervalEnd + 4;
                    addr <= userInterval.end;
                    addr += 4
                ) {
                    interval.cells.push({
                        address: addr,
                        binary: memory.loadWord(new Binary(addr)),
                        tags: [],
                    });
                }
            } else {
                const cells = [];
                for (
                    let addr = userInterval.start;
                    addr <= userInterval.end;
                    addr += 4
                ) {
                    cells.push({
                        address: addr,
                        binary: memory.loadWord(new Binary(addr)),
                        tags: [],
                    });
                }
                newIntervals.push(
                    extendInterval(
                        cells,
                        intervals.length + newIntervals.length,
                    ),
                );
            }
        }
    }
    return [...intervals, ...newIntervals];
}

function addCellTags(interval: interval) {
    for (const cell of interval.cells) {
        if (cell.address === vm.assembler.textSegmentStart.getValue()) {
            cell.tags.push({ name: ".text", type: "section" });
        }
        if (cell.address === vm.assembler.dataSegmentStart.getValue()) {
            cell.tags.push({ name: ".data", type: "section" });
        }
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

function extendInterval(cells: cell[]) {
    const settings = getFromStorage("local", "settings");
    const id = cells.length > 0 ? cells[0].address : 0;
    const interval = {
        id: id,
        cells: cells,
        formats: {
            address: settings.colsFormats["memory-address-format"],
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
    if (settings.colsFormats[`memory-address-format_${id}`]) {
        interval.formats.address =
            settings.colsFormats[`memory-address-format_${id}`];
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
