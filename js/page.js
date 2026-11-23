// Clicking the @Aluerie handle copies it and briefly shows "copied 💜" in its place.
(() => {
    const handle = document.querySelector(".handle");
    const status = document.querySelector(".copied");
    if (!handle || !status) return;

    const text = handle.textContent.trim();
    let resetTimer = 0;

    handle.addEventListener("click", async () => {
        let message;
        try {
            await navigator.clipboard.writeText(text);
            message = "copied 💜";
        } catch {
            message = "couldn't copy";
        }
        handle.textContent = message;
        status.textContent = message;
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
            handle.textContent = text;
            status.textContent = "";
        }, 1500);
    });
})();
