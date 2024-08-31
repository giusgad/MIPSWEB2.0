"use strict";
var Icons = /** @class */ (function () {
    function Icons() {
    }
    Icons.render = function (name, attributes) {
        if (attributes === void 0) { attributes = { fill: 'rgb(99, 99, 102)' }; }
        var icon = this.icons[name];
        if (!icon) {
            console.error("Icon \"".concat(name, "\" not found"));
            icon = this.icons['default'];
            attributes['opacity'] = '0.25';
        }
        var attrs = Object.entries(attributes)
            .map(function (_a) {
            var key = _a[0], value = _a[1];
            return "".concat(key, "=\"").concat(value, "\"");
        })
            .join(' ');
        return "\n            <svg viewBox=\"".concat(icon.viewBox, "\" ").concat(attrs, ">\n                ").concat(this.defs, "\n                <path d=\"").concat(icon.path, "\" />\n            </svg>\n        ");
    };
    Icons.icons = {
        microchip: {
            path: 'M176 24l0-24L128 0l0 24 0 40L64 64l0 64-40 0L0 128l0 48 24 0 40 0 0 56-40 0L0 232l0 48 24 0 40 0 0 56-40 0L0 336l0 48 24 0 40 0 0 64 64 0 0 40 0 24 48 0 0-24 0-40 56 0 0 40 0 24 48 0 0-24 0-40 56 0 0 40 0 24 48 0 0-24 0-40 64 0 0-64 40 0 24 0 0-48-24 0-40 0 0-56 40 0 24 0 0-48-24 0-40 0 0-56 40 0 24 0 0-48-24 0-40 0 0-64-64 0 0-40 0-24L336 0l0 24 0 40-56 0 0-40 0-24L232 0l0 24 0 40-56 0 0-40zM352 160l-192 0 0 192 192 0 0-192zM160 128l192 0 32 0 0 32 0 192 0 32-32 0-192 0-32 0 0-32 0-192 0-32 32 0z',
            viewBox: '0 0 512 512'
        },
        settings: {
            path: 'M200 0L312 0l17.2 78.4c15.8 6.5 30.6 15.1 44 25.4l76.5-24.4 56 97-59.4 54.1c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l59.4 54.1-56 97-76.5-24.4c-13.4 10.3-28.2 18.9-44 25.4L312 512l-112 0-17.2-78.4c-15.8-6.5-30.6-15.1-44-25.4L62.3 432.5l-56-97 59.4-54.1C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L6.3 176.5l56-97 76.5 24.4c13.4-10.3 28.2-18.9 44-25.4L200 0zm56 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z',
            viewBox: '0 0 512 512'
        },
        newFile: {
            path: 'M224 0L0 0 0 512l384 0 0-352-160 0L224 0zm32 0l0 128 128 0L256 0zM216 240l0 24 0 48 48 0 24 0 0 48-24 0-48 0 0 48 0 24-48 0 0-24 0-48-48 0-24 0 0-48 24 0 48 0 0-48 0-24 48 0z',
            viewBox: '0 0 384 512'
        },
        importFile: {
            path: 'M224 0L0 0 0 512l384 0 0-352-160 0L224 0zm32 0l0 128 128 0L256 0zM216 232l0 102.1 31-31 17-17L297.9 320l-17 17-72 72-17 17-17-17-72-72-17-17L120 286.1l17 17 31 31L168 232l0-24 48 0 0 24z',
            viewBox: '0 0 384 512'
        },
        default: {
            path: 'M32 32l96 0 0 64L64 96l0 64L0 160 0 64 0 32l32 0zM0 192l64 0 0 128L0 320 0 192zm384 0l64 0 0 128-64 0 0-128zm64-32l-64 0 0-64-64 0 0-64 96 0 32 0 0 32 0 96zm0 192l0 96 0 32-32 0-96 0 0-64 64 0 0-64 64 0zM64 352l0 64 64 0 0 64-96 0L0 480l0-32 0-96 64 0zM288 480l-128 0 0-64 128 0 0 64zM160 96l0-64 128 0 0 64L160 96z',
            viewBox: '0 0 448 512'
        },
    };
    Icons.defs = "\n    <defs>\n        <linearGradient id=\"gradient\" gradientUnits=\"userSpaceOnUse\" x1=\"0\" y1=\"0\" x2=\"1024\" y2=\"1024\">\n            <stop offset=\"0\" stop-color=\"rgb(162, 132, 94)\"/>\n            <stop offset=\"1\" stop-color=\"rgb(0, 122, 255)\"/>\n        </linearGradient>\n    </defs>\n    ";
    return Icons;
}());
