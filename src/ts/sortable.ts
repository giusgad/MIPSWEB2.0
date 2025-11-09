import { sortFiles } from "./files.js";
import { endDrag } from "./drag.js";

export function initSortables() {
    const filesTabs = document.getElementById("files-tabs");
    if (filesTabs) {
        if (filesTabs.classList.contains("sortable")) {
            // @ts-ignore
            new Sortable(filesTabs, {
                animation: 150,
                filter: ".not-draggable",
                ghostClass: "ghost-class",
                // avoid moving of the add symbol by dragging other elements to its right
                onMove: (evt: any) =>
                    !(
                        evt.related &&
                        evt.related.classList.contains("not-draggable")
                    ),
                onEnd: async (evt: any) => {
                    await sortFiles(evt.oldIndex, evt.newIndex);
                    endDrag();
                },
            });
        }
    }
}
