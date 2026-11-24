// Pop-up notifications in the top-right corner, used by the easter eggs.
// window.showToast(text, app) adds one for a few seconds; `app` adds a phone-style header line.
// They pile up as a stack with the newest in front; hovering fans the stack out and pauses the timers,
// and clicking one dismisses it.
(() => {
    const SHOW_FOR = 4000;
    const MAX = 4;
    const PEEK = 3; // cards visible in the collapsed stack
    const GAP = 8;

    const stack = document.createElement("div");
    stack.className = "toasts";
    stack.setAttribute("role", "status");
    stack.setAttribute("aria-live", "polite");
    document.body.appendChild(stack);

    let toasts = []; // newest first
    let expanded = false;

    function layout() {
        const frontHeight = toasts[0]?.naturalHeight ?? 0;
        let y = 0;
        toasts.forEach((toast, i) => {
            const el = toast.el;
            if (expanded) {
                el.style.transform = `translateY(${y}px)`;
                el.style.height = `${toast.naturalHeight}px`;
                el.style.opacity = "1";
                y += toast.naturalHeight + GAP;
            } else {
                el.style.transform = `translateY(${i * 12}px) scale(${1 - i * 0.05})`;
                // Older cards take the front card's height so only their bottom edge peeks out.
                el.style.height = `${i === 0 ? toast.naturalHeight : frontHeight}px`;
                el.style.opacity = i < PEEK ? "1" : "0";
            }
            el.style.zIndex = String(MAX - i);
            el.classList.toggle("behind", !expanded && i > 0);
        });
        const extent = expanded ? y - GAP : frontHeight + Math.min(toasts.length - 1, PEEK - 1) * 12;
        stack.style.height = `${Math.max(extent, 0)}px`;
    }

    function startTimer(toast, ms) {
        toast.deadline = performance.now() + ms;
        toast.timer = setTimeout(() => dismiss(toast), ms);
    }

    function dismiss(toast) {
        if (!toasts.includes(toast)) return;
        clearTimeout(toast.timer);
        toasts = toasts.filter((t) => t !== toast);
        toast.el.classList.add("leaving");
        setTimeout(() => toast.el.remove(), 300);
        if (!toasts.length) expanded = false;
        layout();
    }

    stack.addEventListener("mouseenter", () => {
        expanded = true;
        for (const toast of toasts) {
            clearTimeout(toast.timer);
            toast.remaining = Math.max(toast.deadline - performance.now(), 1000);
        }
        layout();
    });
    stack.addEventListener("mouseleave", () => {
        expanded = false;
        for (const toast of toasts) startTimer(toast, toast.remaining ?? SHOW_FOR);
        layout();
    });

    window.showToast = (text, app) => {
        const el = document.createElement("div");
        el.className = "toast entering";
        if (app) {
            const header = document.createElement("div");
            header.className = "toast-app";
            header.textContent = `${app} · now`;
            el.appendChild(header);
        }
        el.appendChild(document.createTextNode(text));
        stack.prepend(el);

        const toast = { el, naturalHeight: el.offsetHeight };
        el.addEventListener("click", () => dismiss(toast));
        toasts.unshift(toast);
        for (const old of toasts.slice(MAX)) dismiss(old);
        if (!expanded) startTimer(toast, SHOW_FOR);
        else toast.remaining = SHOW_FOR;

        layout();
        // Next frame, drop the off-screen start position so it slides in.
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("entering")));
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
