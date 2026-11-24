// Pop-up notifications in the top-right corner.
// window.showToast({ app, time, title, lines, image, key, duration }) adds one for a few seconds: `app` is a
// small header with the app's icon (and `time`, e.g. "now", on the right), `title` a bold line, `lines` plain
// lines under it and `image` a small picture beside them. Showing a toast with the `key` of one still on screen
// updates that one in place and brings it to the front instead of adding another; pass `raise: false` to
// leave it where it is, and `onlyIfShown: true` to do nothing when no toast with that key is on screen.
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

    // App icons for the header, like on a phone: a brand logo from the page's SVG sprite when there is one
    // (the 404 page has none, so it falls back to the emoji), otherwise an emoji on the app's colour.
    const APP_ICONS = {
        Twitch: { symbol: "i-twitch", emoji: "📺", color: "#9146ff" },
        GitHub: { symbol: "i-github", emoji: "🐙", color: "#24292f" },
        Discord: { symbol: "i-discord", emoji: "💬", color: "#5865f2" },
        Spotify: { symbol: "i-spotify", emoji: "🎵", color: "#1db954" },
        Steam: { symbol: "i-steam", emoji: "🎮", color: "#1b2838" },
        Email: { symbol: "i-envelope", emoji: "✉️", color: "#ea4335" },
        Messages: { emoji: "💬", color: "#34c759" },
        YouTube: { emoji: "▶️", color: "#ff0000" },
        Duolingo: { emoji: "🦉", color: "#58cc02" },
        Delivery: { emoji: "🛵", color: "#ff9500" },
        Bank: { emoji: "💳", color: "#0a84ff" },
        Battery: { emoji: "🔋", color: "#30d158" },
        Storage: { emoji: "☁️", color: "#8e8e93" },
        "Screen Time": { emoji: "⏳", color: "#5e5ce6" },
        Update: { emoji: "⚙️", color: "#636366" },
        Photos: { emoji: "🌸", color: "#ff9f0a" },
        Camera: { emoji: "📷", color: "#3a3a3c" },
        Reminder: { emoji: "📝", color: "#ff9f0a" },
        Clock: { emoji: "⏰", color: "#1c1c1e" },
        Calendar: { emoji: "📅", color: "#ff3b30" },
        Weather: { emoji: "🌤️", color: "#0a84ff" },
        Health: { emoji: "❤️", color: "#ffffff" },
        Moon: { emoji: "🌙", color: "#2c2c54" },
        Cat: { emoji: "🐈", color: "#ffb340" },
        Hearts: { emoji: "💜", color: "#f5d0fe" },
        Maps: { emoji: "🗺️", color: "#34c759" },
        Pizza: { emoji: "🍕", color: "#ff3b30" },
        Coffee: { emoji: "☕", color: "#8b5a2b" },
        Plants: { emoji: "🌿", color: "#30d158" },
        Pinterest: { emoji: "📌", color: "#e60023" },
        TikTok: { emoji: "🎶", color: "#010101" },
        Netflix: { emoji: "🍿", color: "#e50914" },
        Shazam: { emoji: "🎧", color: "#0088ff" },
        Notes: { emoji: "🗒️", color: "#ffd60a" },
        Game: { emoji: "🕹️", color: "#af52de" },
        Bluetooth: { emoji: "🎧", color: "#0a84ff" },
        "Wi-Fi": { emoji: "📶", color: "#0a84ff" },
        Settings: { emoji: "⚙️", color: "#8e8e93" },
        Focus: { emoji: "🌙", color: "#5e5ce6" },
        "Find My": { emoji: "📍", color: "#34c759" },
    };

    function appIcon(app) {
        const icon = APP_ICONS[app];
        if (!icon) return null;
        const box = document.createElement("span");
        box.className = "toast-icon";
        box.style.background = icon.color;
        if (icon.symbol && document.getElementById(icon.symbol)) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
            use.setAttribute("href", `#${icon.symbol}`);
            svg.appendChild(use);
            box.appendChild(svg);
        } else {
            box.textContent = icon.emoji;
        }
        return box;
    }

    function fill(el, { app, time, title, lines = [], image }) {
        el.replaceChildren();
        const add = (parent, className, text) => {
            const row = document.createElement("div");
            if (className) row.className = className;
            row.textContent = text;
            parent.appendChild(row);
        };
        if (app) {
            // Header: [icon] App name ........ now
            const header = document.createElement("div");
            header.className = "toast-app";
            const icon = appIcon(app);
            if (icon) header.appendChild(icon);
            const name = document.createElement("span");
            name.className = "toast-app-name";
            name.textContent = app;
            header.appendChild(name);
            if (time) {
                const when = document.createElement("span");
                when.className = "toast-time";
                when.textContent = time;
                header.appendChild(when);
            }
            el.appendChild(header);
        }

        // With an image, the text sits in a column beside it.
        let body = el;
        if (image) {
            const row = document.createElement("div");
            row.className = "toast-media";
            const img = document.createElement("img");
            img.className = "toast-image";
            img.src = image;
            img.alt = "";
            // Some image hosts are blocked on some networks: drop the picture rather than leave a blank gap.
            img.addEventListener("error", () => img.remove());
            body = document.createElement("div");
            row.append(img, body);
            el.appendChild(row);
        }
        if (title) add(body, "toast-title", title);
        for (const line of lines) if (line) add(body, "", line);
    }

    window.showToast = (options) => {
        const duration = options.duration ?? SHOW_FOR;
        const existing = options.key && toasts.find((t) => t.key === options.key);
        if (!existing && options.onlyIfShown) return;
        if (existing) {
            fill(existing.el, options);
            existing.el.style.height = "auto";
            existing.naturalHeight = existing.el.offsetHeight;
            clearTimeout(existing.timer);
            if (options.raise !== false) toasts = [existing, ...toasts.filter((t) => t !== existing)];
            if (!expanded) startTimer(existing, duration);
            else existing.remaining = duration;
            layout();
            return;
        }

        const el = document.createElement("div");
        el.className = "toast entering";
        fill(el, options);
        stack.prepend(el);

        const toast = { el, key: options.key, naturalHeight: el.offsetHeight };
        el.addEventListener("click", () => dismiss(toast));
        toasts.unshift(toast);
        for (const old of toasts.slice(MAX)) dismiss(old);
        if (!expanded) startTimer(toast, duration);
        else toast.remaining = duration;

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
        // Messages
        ["Messages", "go to sleep 💜"],
        ["Messages", "are you still awake??"],
        ["Messages", "Irene: stop poking my phone 😤"],
        ["Messages", "mom: did you eat today?"],
        ["Messages", "unknown number: hey it's me"],
        ["Messages", "you: (draft) ok but hear me out"],
        ["Messages", "someone is typing…"],
        ["Messages", "seen 3h ago 👀"],
        ["Messages", "voice message (4:37) 🎤"],
        ["Messages", "📎 meme.jpg"],
        // Apps
        ["Discord", "you have 99+ unread messages"],
        ["Discord", "@everyone movie night in 5 🍿"],
        ["Discord", "someone pinged you in #general"],
        ["Twitch", "irene_adler__ is live! (maybe)"],
        ["Twitch", "your favourite streamer is online 👀"],
        ["Spotify", "your playlist misses you 🎵"],
        ["Spotify", "Discover Weekly is ready, and it's sad again"],
        ["Steam", "your friend is now playing Dota 2"],
        ["Steam", "a game on your wishlist is 90% off 🎮"],
        ["Steam", "you have 47 unplayed games. just saying"],
        ["GitHub", "✅ all checks passed (finally)"],
        ["GitHub", "❌ build failed on main"],
        ["GitHub", "1 new pull request: 'fix typo'"],
        ["YouTube", "your 3am rabbit hole continues"],
        ["Duolingo", "🦉 these reminders don't seem to be working"],
        ["Delivery", "your order is 2 minutes away 🛵"],
        ["Bank", "spent: ¥0. proud of you 💸"],
        // Phone itself
        ["Battery", "1% left. charge me 🔋"],
        ["Battery", "100%! unplug me please"],
        ["Storage", "almost full: 3,412 screenshots"],
        ["Screen Time", "up 2 hours from last week 📈"],
        ["Update", "restart to install iOS 47.1"],
        ["Photos", "you have a new memory: 'a year ago'"],
        ["Camera", "you opened me by accident again"],
        // Life
        ["Reminder", "drink some water 💧"],
        ["Reminder", "stretch your back, you're hunched"],
        ["Reminder", "that thing you forgot. yes, that one"],
        ["Clock", "alarm in 4 hours ⏰"],
        ["Clock", "snoozed 6 times"],
        ["Calendar", "tomorrow: be a functional adult"],
        ["Weather", "it's dark outside. like, really dark 🌙"],
        ["Weather", "rain at 3am. perfect for sleeping 🌧️"],
        ["Health", "steps today: 47 🚶"],
        ["Health", "sleep goal: missed again 😴"],
        ["Moon", "full moon tonight 🌕"],
        ["Cat", "meow (feed me) 🐈"],
        // More messages
        ["Messages", "bestie: wake up, babe, new drama just dropped"],
        ["Messages", "group chat (147 new messages)"],
        ["Messages", "you left me on read 😔"],
        ["Messages", "'u up?' (it's 4am)"],
        ["Messages", "sister: stole your hoodie, sorry not sorry"],
        ["Messages", "your verification code is 💜💜💜💜"],
        // More apps
        ["Discord", "you've been invited to 'gaming at 2am'"],
        ["Discord", "Nitro expired. your emotes are gone 😭"],
        ["Twitch", "someone gifted you a sub 🎁"],
        ["Twitch", "chat is spamming KEKW"],
        ["Spotify", "Wrapped: you listened to one song 847 times"],
        ["Spotify", "your 'sad hours' playlist is trending in your heart"],
        ["Steam", "Sekiro: you died. again. (death #1,204) 💀"],
        ["Steam", "a friend sent you a gift: one (1) sticker"],
        ["GitHub", "someone starred your repo ⭐"],
        ["GitHub", "dependabot opened 12 pull requests"],
        ["GitHub", "your commit message was just 'fix'. again."],
        ["Email", "unsubscribe failed. you are ours forever 📬"],
        ["Email", "re: re: re: re: quick question"],
        ["Maps", "you've been at 'bed' for 14 hours"],
        ["Maps", "traffic to fridge: light 🍫"],
        ["Pizza", "your pizza is on its way 🍕"],
        ["Coffee", "your coffee is ready ☕ (you made it yourself)"],
        ["Plants", "your monstera is thirsty 🌿"],
        ["Pinterest", "ideas for you: 'cozy bedroom aesthetic'"],
        ["TikTok", "you've been scrolling for 3 hours"],
        ["Netflix", "are you still watching? 👀"],
        ["Shazam", "found it! it's the song from your head"],
        ["Notes", "untitled note: 'remember to'"],
        ["Game", "your energy is full! come back ⚡"],
        // More phone
        ["Battery", "Low Power Mode on. vibes only"],
        ["Bluetooth", "headphones connected 🎧"],
        ["Wi-Fi", "connected to 'pretty fly for a wifi'"],
        ["Settings", "dark mode is already on, you're welcome"],
        ["Focus", "Sleep Focus is on. (it's being ignored)"],
        ["Find My", "your AirPod is somewhere in the bed"],
        // More life
        ["Reminder", "you said 'just one more episode' 3 episodes ago"],
        ["Reminder", "laundry has been in the machine since Tuesday"],
        ["Calendar", "today: absolutely nothing. perfect 💜"],
        ["Clock", "it's 3:33. make a wish ✨"],
        ["Weather", "snow expected. stay in bed ❄️"],
        ["Health", "heart rate up 📈 (you saw a cute cat)"],
        ["Moon", "mercury is in retrograde. blame it on that"],
        ["Cat", "knocked your glass off the table. no regrets"],
        ["Hearts", "someone just sent you a 💜"],
    ];

    // Shuffled deck: every notification shows once, in random order, before any repeats.
    let deck = [];
    function nextNotification() {
        if (!deck.length) {
            deck = [...notifications];
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
        }
        return deck.pop();
    }

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
        const [app, text] = nextNotification();
        window.showToast({ app, time: "now", lines: [text] });
    });
})();

// Easter egg: a hello for anyone who opens the browser console.
console.log(
    "%c💜%c\nHello there, curious one!\n\n" +
        "%cSince you're here, a few secrets:\n" +
        "  • click the big 💜 five times quickly\n" +
        "  • click @Aluerie a few times in a row\n" +
        "  • the phone in the picture works\n\n" +
        "Code: https://github.com/Aluerie/aluerie.github.io",
    "font-size: 64px; line-height: 1;",
    "font-size: 16px; font-weight: bold; color: #a5b4fc;",
    "font-size: 13px; color: inherit;",
);
