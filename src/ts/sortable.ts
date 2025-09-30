import { sortFiles } from "./files.js";
import { endDrag } from "./drag.js";

export function initSortables() {
    const filesTabs = document.getElementById("files-tabs");
    if (filesTabs) {
        if (filesTabs.classList.contains("sortable")) {
            // @ts-ignore
            new Sortable(filesTabs, {
                animation: 150,
                ghostClass: "ghost-class",
                onEnd: async (evt: any) => {
                    await sortFiles(evt.oldIndex, evt.newIndex);
                    endDrag();
                },
            });
        }
    }
}
