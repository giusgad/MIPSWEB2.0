var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { Icons } from "./icons.js";
import { getContext } from "./app.js";
import { Utils } from "./virtual-machine/Utils.js";
import { vm } from "./app.js";
window.ejs = ejs;
document.addEventListener('DOMContentLoaded', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (typeof ejs === 'undefined' || typeof ace === 'undefined') {
            console.error('Required libraries (EJS or ACE) failed to load');
            return [2 /*return*/];
        }
        return [2 /*return*/];
    });
}); });
export function render(id_1, templatePath_1) {
    return __awaiter(this, arguments, void 0, function (id, templatePath, ctx) {
        var element, _a, error_1;
        if (ctx === void 0) { ctx = getContext(); }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    element = document.getElementById(id);
                    if (!element)
                        throw new Error("No element found by Id: ".concat(id));
                    _a = element;
                    return [4 /*yield*/, renderTemplate(templatePath, ctx)];
                case 1:
                    _a.innerHTML = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _b.sent();
                    console.error(error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
window.renderTemplate = renderTemplate;
function renderTemplate(templatePath_1) {
    return __awaiter(this, arguments, void 0, function (templatePath, ctx) {
        var template, data;
        if (ctx === void 0) { ctx = getContext(); }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("src/templates/".concat(templatePath)).then(function (res) {
                        if (!res.ok) {
                            throw new Error("No template found: \"src/templates/".concat(templatePath, "\""));
                        }
                        return res.text();
                    })];
                case 1:
                    template = _a.sent();
                    data = __assign(__assign({}, ctx), { Icons: Icons });
                    return [2 /*return*/, ejs.render(template, data, { async: true })];
            }
        });
    });
}
export function addClass(className, id) {
    var element = document.getElementById(id);
    if (element) {
        element.classList.add(className);
    }
    else {
        console.error("Element with id \"".concat(id, "\" not found."));
    }
}
export function removeClass(className, id) {
    var element = document.getElementById(id);
    if (element) {
        element.classList.remove(className);
    }
    else {
        console.error("Element with id \"".concat(id, "\" not found."));
    }
}
export function getFromLocalStorage(key) {
    var item = localStorage.getItem(key);
    return item ? JSON.parse(item) : undefined;
}
export function setIntoLocalStorage(key, item) {
    localStorage.setItem(key, JSON.stringify(item));
}
window.convert = convert;
function convert(format, value) {
    if (format === "hex") {
        return Utils.convertToHex(value);
    }
    if (format === "basic") {
        return Utils.convertToBasic(value, vm.cpu);
    }
    return value;
}
