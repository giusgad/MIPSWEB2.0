import {sortFiles, sortOpenedFilesIds} from "./files.js";
import {endDrag} from "./drag.js";

export function initSortables() {

    const filesTabs = document.getElementById('files-tabs');
    if (filesTabs) {
        if (filesTabs.classList.contains('sortable')) {
            // @ts-ignore
            new Sortable(filesTabs, {
                animation: 150,
                ghostClass: 'ghost-class',
                onEnd: async (evt: any) => {
                    await sortOpenedFilesIds(evt.oldIndex, evt.newIndex);
                    endDrag();
                }
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
                onEnd: async (evt: any) => {
                    await sortFiles(evt.oldIndex, evt.newIndex);
                    endDrag();
                }
            });
        }
    }

}