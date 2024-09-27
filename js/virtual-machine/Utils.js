var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.getBits = function (word, to, from) {
        if (to < from || to > 31 || from < 0) {
            throw new Error("Invalid parameters: 'from' (".concat(from, ") and 'to' (").concat(to, ") must be within valid range."));
        }
        var numBits = to - from + 1;
        return (word >>> from) & ((1 << numBits) - 1);
    };
    Utils.setBits = function (word, bits, to, from) {
        if (to < from || to > 31 || from < 0) {
            throw new Error("Invalid parameters: 'from' (".concat(from, ") and 'to' (").concat(to, ") must be within valid range."));
        }
        var numBits = to - from + 1;
        var maxBitsValue = (1 << numBits) - 1; // Valore massimo rappresentabile con 'numBits' bit
        if (bits > maxBitsValue) {
            throw new Error("Bits value (".concat(bits, ") exceeds maximum (").concat(maxBitsValue, ") for the range from ").concat(from, " to ").concat(to, "."));
        }
        var mask = ((1 << numBits) - 1) << from;
        word &= ~mask;
        word |= (bits << from) & mask;
        return word;
    };
    Utils.convertToHex = function (value) {
        return '0x' + value.toString(16).padStart(8, '0');
    };
    Utils.convertToBasic = function (value, cpu) {
        var _a;
        return (_a = cpu.getInstructionByCode(value)) === null || _a === void 0 ? void 0 : _a.basic;
    };
    Utils.convertToBinary = function (value) {
        return '0b' + value.toString(2).padStart(32, '0');
    };
    return Utils;
}());
export { Utils };
