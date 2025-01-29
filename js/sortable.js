var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { sortFiles, sortOpenedFilesIds } from "./files.js";
import { endDrag } from "./drag.js";
export function initSortables() {
    const filesTabs = document.getElementById('files-tabs');
    if (filesTabs) {
        if (filesTabs.classList.contains('sortable')) {
            // @ts-ignore
            new Sortable(filesTabs, {
                animation: 150,
                ghostClass: 'ghost-class',
                onEnd: (evt) => __awaiter(this, void 0, void 0, function* () {
                    yield sortOpenedFilesIds(evt.oldIndex, evt.newIndex);
                    endDrag();
                })
            });
        }
    }
    const allFiles = document.getElementById('all-files');
    if (allFiles) {
        if (allFiles.classList.contains('sortable')) {
            // @ts-ignore
            new Sortable(allFiles, {
                animation: 150,
                ghostClass: 'ghost-class',
                onEnd: (evt) => __awaiter(this, void 0, void 0, function* () {
                    yield sortFiles(evt.oldIndex, evt.newIndex);
                    endDrag();
                })
            });
        }
    }
}
