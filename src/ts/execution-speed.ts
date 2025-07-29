import { getFromStorage, setIntoStorage } from "./utils.js";

/**Execution speed classified in instruction-per-second (or instant)*/
export enum ExecSpeed {
    HalfIps = 1,
    OneIps = 2,
    TwoIps = 3,
    FourIps = 4,
    Instant = 5,
}

/**Gets the execution speed setting and returns the time to wait between instructions in ms*/
export function getExecutionSpeedTimeOut(): number {
    const speed = Number(getFromStorage("local", "executionSpeed"));
    switch (speed) {
        case ExecSpeed.HalfIps:
            return 2000;
        case ExecSpeed.OneIps:
            return 1000;
        case ExecSpeed.TwoIps:
            return 500;
        case ExecSpeed.FourIps:
            return 250;
        case ExecSpeed.Instant:
        default:
            return 0;
    }
}

(window as any).setExecutionSpeed = (val: number) => {
    if (val >= 1 && val <= 5) {
        setIntoStorage("local", "executionSpeed", val);
    }
};

(window as any).getExecutionSpeed = (): number => {
    return getFromStorage("local", "executionSpeed");
};

(window as any).getExecSpeedLabel = (val: string) => {
    const speed = Number(val);
    switch (speed) {
        case ExecSpeed.HalfIps:
            return "1 instruction every 2 seconds";
        case ExecSpeed.OneIps:
            return "1 instruction per second";
        case ExecSpeed.TwoIps:
            return "2 instructions per second";
        case ExecSpeed.FourIps:
            return "4 instructions per second";
        case ExecSpeed.Instant:
            return "Instant execution";
        default:
            return "Invalid execution speed";
    }
};
