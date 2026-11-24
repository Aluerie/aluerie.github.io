// Small pop-up toast, used by the easter eggs. window.showToast(text, app) shows it for a few seconds;
// `app` adds a phone-notification style header line.
(() => {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);

    let hideTimer = 0;

    window.showToast = (text, app) => {
        toast.replaceChildren();
        if (app) {
            const header = document.createElement("div");
            header.className = "toast-app";
            header.textContent = `${app} · now`;
            toast.appendChild(header);
        }
        toast.appendChild(document.createTextNode(text));
        toast.classList.add("show");
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => toast.classList.remove("show"), 3500);
    };
})();

// Easter egg: the phone in the background art is clickable and shows a fake notification.
(() => {
    // Where the phone sits in the 2048×1152 background image, in image pixels.
    const IMAGE = { width: 2048, height: 1152 };
    const PHONE = { left: 1680, top: 280, right: 1965, bottom: 695 };

    const notifications = [
        ["Messages", "go to sleep 💜"],
        ["Messages", "are you still awake??"],
        ["Messages", "Irene: stop poking my phone 😤"],
        ["Discord", "you have 99+ unread messages"],
        ["Twitch", "irene_adler__ is live! (maybe)"],
        ["Spotify", "your playlist misses you 🎵"],
        ["Steam", "your friend is now playing Dota 2"],
        ["Battery", "1% left. charge me 🔋"],
        ["Reminder", "drink some water 💧"],
        ["Clock", "alarm in 4 hours ⏰"],
        ["Weather", "it's dark outside. like, really dark 🌙"],
    ];
    let next = Math.floor(Math.random() * notifications.length);

    const spot = document.createElement("div");
    spot.className = "phone-spot";
    spot.setAttribute("aria-hidden", "true");
    document.body.appendChild(spot);

    // The background is fixed, centred and covers the viewport, so map the phone into viewport pixels.
    function place() {
        const scale = Math.max(window.innerWidth / IMAGE.width, window.innerHeight / IMAGE.height);
        const offsetX = (window.innerWidth - IMAGE.width * scale) / 2;
        const offsetY = (window.innerHeight - IMAGE.height * scale) / 2;
        const left = offsetX + PHONE.left * scale;
        const top = offsetY + PHONE.top * scale;
        const width = (PHONE.right - PHONE.left) * scale;
        const height = (PHONE.bottom - PHONE.top) * scale;
        spot.style.left = `${left}px`;
        spot.style.top = `${top}px`;
        spot.style.width = `${width}px`;
        spot.style.height = `${height}px`;
        // Hide it when the phone is cropped off screen (narrow or portrait windows).
        spot.hidden = left + width / 2 > window.innerWidth || top + height / 2 > window.innerHeight;
    }
    place();
    window.addEventListener("resize", place);

    spot.addEventListener("click", () => {
        const [app, text] = notifications[next];
        next = (next + 1) % notifications.length;
        window.showToast(text, app);
    });
})();

// Easter egg: a hello for anyone who opens the browser console.
console.log(
    "%c💜%c\nHello there, curious one!\n\n" +
        "%cSince you're here, a few secrets:\n" +
        "  • click the big 💜 five times quickly\n" +
        "  • draw a circle with your mouse\n" +
        "  • the phone in the picture works\n\n" +
        "Code: https://github.com/Aluerie/aluerie.github.io",
    "font-size: 64px; line-height: 1;",
    "font-size: 16px; font-weight: bold; color: #a5b4fc;",
    "font-size: 13px; color: inherit;",
);
