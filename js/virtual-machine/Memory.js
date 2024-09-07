var Memory = /** @class */ (function () {
    function Memory() {
        this.memory = new Map();
    }
    Memory.prototype.clear = function () {
        this.memory.clear();
    };
    Memory.prototype.store = function (address, value) {
        this.memory.set(address, value);
    };
    Memory.prototype.fetch = function (address) {
        return this.memory.get(address);
    };
    Memory.prototype.get = function () {
        var sortedKeys = Array.from(this.memory.keys()).sort(function (a, b) { return a - b; });
        var sortedMemory = new Map();
        for (var _i = 0, sortedKeys_1 = sortedKeys; _i < sortedKeys_1.length; _i++) {
            var key = sortedKeys_1[_i];
            sortedMemory.set(key, this.memory.get(key));
        }
        return sortedMemory;
    };
    return Memory;
}());
export { Memory };
