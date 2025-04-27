document.addEventListener("dragstart", (event) => {
    startDrag();
});

export function startDrag() {
    document.getElementById("editors")!.classList.add("pointer-events-none");
    document.querySelectorAll(".ace_layer").forEach((layer) => {
        layer.classList.add("pointer-events-none");
    });
    document.querySelectorAll(".ace_gutter").forEach((layer) => {
        layer.classList.add("pointer-events-none");
    });
}

export function endDrag() {
    document.getElementById("editors")!.classList.remove("pointer-events-none");
    document.querySelectorAll(".ace_layer").forEach((layer) => {
        layer.classList.remove("pointer-events-none");
    });
    document.querySelectorAll(".ace_gutter").forEach((layer) => {
        layer.classList.remove("pointer-events-none");
    });
}
