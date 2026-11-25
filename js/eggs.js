// Pop-up notifications in the top-right corner.
// window.showToast({ app, time, title, lines, image, key, duration }) adds one for a few seconds: `app` is a
// small header with the app's icon (and `time`, e.g. "now", on the right), `title` a bold line, `lines` plain
// lines under it and `image` a small picture beside them. Showing a toast with the `key` of one still on screen
// updates that one in place and brings it to the front instead of adding another; pass `raise: false` to
// leave it where it is, `onlyIfShown: true` to do nothing when no toast with that key is on screen, and
// `quiet: true` to skip reading it out to screen readers (for rapid little updates).
// They pile up as a stack with the newest in front; hovering fans the stack out and pauses the timers,
// and clicking one dismisses it.
(() => {
    const SHOW_FOR = 4000;
    const MAX = 4;
    const PEEK = 3; // cards visible in the collapsed stack
    const GAP = 8;

    const stack = document.createElement("div");
    stack.className = "toasts";
    document.body.appendChild(stack);

    // Screen readers hear toasts through this hidden line rather than the stack itself,
    // so quiet updates (like "typing…" dots) don't get read out over and over.
    const announcer = document.createElement("div");
    announcer.className = "visually-hidden";
    announcer.setAttribute("role", "status");
    announcer.setAttribute("aria-live", "polite");
    document.body.appendChild(announcer);

    function announce({ app, title, lines = [], quiet }) {
        if (quiet) return;
        announcer.textContent = [app, title, ...lines].filter(Boolean).join(". ");
    }

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

    // Mouse only: on a phone a tap would also count as hovering, and the stack would stay open and paused.
    stack.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse") return;
        expanded = true;
        for (const toast of toasts) {
            clearTimeout(toast.timer);
            toast.remaining = Math.max(toast.deadline - performance.now(), 1000);
        }
        layout();
    });
    stack.addEventListener("pointerleave", (e) => {
        if (e.pointerType !== "mouse" || !expanded) return;
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
        YouTube: { symbol: "i-youtube", emoji: "▶️", color: "#ff0033" },
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
        Reddit: { symbol: "i-reddit-alien", emoji: "👽", color: "#ff4500" },
        X: { symbol: "i-x-twitter", emoji: "🐦", color: "#000000" },
        Bluesky: { symbol: "i-bluesky", emoji: "🦋", color: "#1185fe" },
        Telegram: { emoji: "✈️", color: "#2aabee" },
        Instagram: { emoji: "📸", color: "#d62976" },
        Uber: { emoji: "🚕", color: "#000000" },
        Translate: { emoji: "🌐", color: "#4285f4" },
        Fitness: { emoji: "🏃", color: "#a2f000" },
        Podcasts: { emoji: "🎙️", color: "#9933cc" },
        Books: { emoji: "📚", color: "#ff9500" },
        Alarm: { emoji: "🚨", color: "#ff3b30" },
        Horoscope: { emoji: "🔮", color: "#6e3cbc" },
        Dog: { emoji: "🐕", color: "#c69c6d" },
        Fridge: { emoji: "🧊", color: "#9ad0ec" },
        Mom: { emoji: "👩", color: "#ff6fa8" },
        Universe: { emoji: "🌌", color: "#1a1040" },
        "Elden Ring": { emoji: "💍", color: "#3a2f14" },
        Silksong: { emoji: "🧵", color: "#8b1e2d" },
        "Hollow Knight": { emoji: "🪲", color: "#1f2a44" },
        "Stellar Blade": { emoji: "⚔️", color: "#0d1b2a" },
        "Dota 2": { emoji: "🛡️", color: "#a3221a" },
        AluBot: { emoji: "🤖", color: "#6366f1" },
        Affirmations: { emoji: "✨", color: "#c4b5fd" },
        // Shows and movies
        Carrie: { emoji: "🩸", color: "#7a0010" },
        "Lord of the Rings": { emoji: "🧙", color: "#4a3b1f" },
        "The Mentalist": { emoji: "🍵", color: "#2f4f2f" },
        "House M.D.": { emoji: "💊", color: "#1e3a5f" },
        "Avatar: TLA": { emoji: "🌪️", color: "#2a6f97" },
        Sherlock: { emoji: "🕵️", color: "#1c1c1c" },
        Silo: { emoji: "🕳️", color: "#3d3d3d" },
        Inception: { emoji: "🌀", color: "#2b2d42" },
        "Peaky Blinders": { emoji: "🎩", color: "#2b2b2b" },
        "The Crown": { emoji: "👑", color: "#4b0082" },
        "Six Feet Under": { emoji: "⚰️", color: "#2f3e46" },
        "The Sopranos": { emoji: "🍝", color: "#8b0000" },
        // Books
        "Les Misérables": { emoji: "🕯️", color: "#3a2e5c" },
        "Sherlock Holmes": { emoji: "🔍", color: "#6b4e2e" },
        "The Great Gatsby": { emoji: "🥂", color: "#b8860b" },
        // Languages (flag emoji don't render on Windows, hence the stand-ins)
        English: { emoji: "📘", color: "#012169" },
        French: { emoji: "🥐", color: "#0055a4" },
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

    function fill(el, { app, time, title, lines = [], image, wideImage }) {
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
            img.className = wideImage ? "toast-image wide" : "toast-image";
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
        announce(options);
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
        // Batch 3: messages
        ["Messages", "'are you mad at me?' (they're not)"],
        ["Messages", "you have 3 unread 'lol's"],
        ["Messages", "friend: omg look at this cat 🐈 (it's the 8th cat today)"],
        ["Messages", "'ok' (punctuation detected, be afraid)"],
        ["Messages", "your future self: please go to bed"],
        ["Messages", "someone reacted 😂 to your message from 2019"],
        ["Mom", "call me when you can. not urgent. (it's urgent)"],
        ["Mom", "sent you a picture of a flower 🌷"],
        ["Mom", "did you dress warm enough?"],
        ["Telegram", "you've been added to 'definitely not spam'"],
        ["Telegram", "47 stickers received, 0 words"],
        // Batch 3: social
        ["Reddit", "u/someone replied: 'source?'"],
        ["Reddit", "your comment got 1 upvote (it was you)"],
        ["Reddit", "trending: 'is it normal to stay up until 5am'"],
        ["X", "someone quote-tweeted you. bravely."],
        ["X", "you have 1 new follower: a bot named Brenda"],
        ["X", "trending: #CantSleep"],
        ["Bluesky", "someone followed you 🦋"],
        ["Bluesky", "your feed is calm today. suspicious."],
        ["Instagram", "your friend posted 47 stories"],
        ["Instagram", "someone liked your post from 3 years ago 👀"],
        // Batch 3: games and streams
        ["Steam", "Elden Ring: you have died 9,999 times. git gud 💀"],
        ["Steam", "your backlog grew by 3 games this sale"],
        ["Steam", "achievement unlocked: 'went to bed early' (0.1% of players)"],
        ["Twitch", "raid incoming! 🚨"],
        ["Twitch", "your clip got 3 views (all you)"],
        ["Discord", "someone is streaming 'Sekiro but blindfolded'"],
        ["Discord", "server boost expired. the emotes are crying"],
        ["Discord", "you've been muted in #memes for posting too many memes"],
        ["Game", "daily login reward: 5 gems 💎"],
        ["Game", "your crops are ready to harvest 🌾"],
        // Batch 3: media
        ["YouTube", "recommended: '10 hours of rain sounds'"],
        ["YouTube", "your favourite creator uploaded… a 2-hour video essay"],
        ["Spotify", "you've listened to the same album 12 times today 🎧"],
        ["Spotify", "your daylist: 'sleepy cozy wednesday night'"],
        ["Netflix", "new season of the show you forgot about 📺"],
        ["Podcasts", "new episode: 'why you can't sleep'"],
        ["Books", "you're 12% into a book you started in 2022 📖"],
        ["Shazam", "it's that song again. you know the one"],
        // Batch 3: code
        ["GitHub", "your CI is green. take a screenshot, it won't last"],
        ["GitHub", "issue #1 opened: 'it doesn't work'"],
        ["GitHub", "you pushed to main on a Friday 😱"],
        ["GitHub", "merge conflict in your heart 💔"],
        // Batch 3: phone and apps
        ["Battery", "charging… slowly… very slowly 🐌"],
        ["Storage", "can't take photo: 4,000 cat pictures in the way"],
        ["Settings", "Do Not Disturb disturbed you"],
        ["Translate", "'meow' detected: cat"],
        ["Uber", "your driver is 1 minute away (for 20 minutes)"],
        ["Delivery", "your bubble tea has left the shop 🧋"],
        ["Bank", "transaction declined: 'one more skin'"],
        ["Maps", "you've arrived: your bed 🛏️"],
        ["Find My", "found: your will to live (it was in the couch)"],
        ["Notes", "list: milk, eggs, figure out life"],
        // Batch 3: life and vibes
        ["Alarm", "WAKE UP (snooze to ignore your responsibilities)"],
        ["Fitness", "close your rings! (you closed the app)"],
        ["Health", "you've been sitting for 6 hours. impressive."],
        ["Weather", "100% chance of staying in bed"],
        ["Weather", "foggy outside, foggy inside 🌫️"],
        ["Horoscope", "today the stars say: nap"],
        ["Horoscope", "your lucky colour today is purple 💜"],
        ["Moon", "the moon says hi 🌙"],
        ["Fridge", "door open for 2 minutes. what are you looking for?"],
        ["Cat", "sitting on your keyboard. sdfjkhsdkjf"],
        ["Cat", "demands to be let out. then in. then out."],
        ["Dog", "would like to go for a walk. right now. 🐕"],
        ["Plants", "your cactus is fine. it's always fine 🌵"],
        ["Universe", "you are made of stardust ✨"],
        ["Universe", "everything's going to be okay 💜"],
        ["Hearts", "you're doing great, sweetie 💜"],
        // Elden Ring
        ["Elden Ring", "YOU DIED"],
        ["Elden Ring", "message nearby: 'try finger, but hole'"],
        ["Elden Ring", "Malenia has entered the chat. let me solo her 🗡️"],
        ["Elden Ring", "you've been invaded. they're wearing a bear head"],
        ["Elden Ring", "Margit sends his regards 🪓"],
        ["Elden Ring", "Site of Grace discovered. rest a bit 🔥"],
        ["Elden Ring", "Torrent would like a snack 🐴"],
        ["Elden Ring", "you dropped 400,000 runes. go get them. carefully."],
        ["Elden Ring", "Melina: shall I accompany you to bed? 🌙"],
        ["Elden Ring", "a dog is waiting behind that corner. trust no dog"],
        // Hollow Knight: Silksong
        ["Silksong", "Hornet: Shaw! 🧵"],
        ["Silksong", "Hornet: Gitgud! (she means it)"],
        ["Silksong", "it's out. it's really out. we're not dreaming 😭"],
        ["Silksong", "a bell rings somewhere in Pharloom 🔔"],
        ["Silksong", "you got 1 rosary. spent it immediately"],
        ["Silksong", "ADINO! 🕷️"],
        ["Silksong", "new quest on the wish board 📜"],
        ["Silksong", "you died to a bug with a stick. again."],
        // Hollow Knight
        ["Hollow Knight", "Zote the Mighty has 57 precepts for you 📜"],
        ["Hollow Knight", "Grimm troupe has arrived in town 🎪"],
        ["Hollow Knight", "Elderbug says hi 👋"],
        ["Hollow Knight", "Quirrel is resting by the lake 🌊"],
        ["Hollow Knight", "your shade is waiting for you somewhere spooky 👻"],
        ["Hollow Knight", "Path of Pain: are you sure? (no)"],
        ["Hollow Knight", "Cornifer is humming nearby 🗺️ go buy a map"],
        ["Hollow Knight", "the Radiance shines too bright. use sunglasses 😎"],
        // Stellar Blade
        ["Stellar Blade", "perfect parry! ✨"],
        ["Stellar Blade", "Lily: Eve, are you okay?"],
        ["Stellar Blade", "Adam: we need more supplies 🎒"],
        ["Stellar Blade", "new outfit unlocked 👗"],
        ["Stellar Blade", "a can has been found 🥫 collection: 23/50"],
        ["Stellar Blade", "Naytiba spotted nearby. beta skill ready ⚡"],
        ["Stellar Blade", "fishing spot discovered 🎣 (combat can wait)"],
        ["Stellar Blade", "camp ready. rest and change hairstyles 💇"],
        // Dota 2
        ["Dota 2", "match found! (you were in the bathroom)"],
        ["Dota 2", "your teammate picked Techies 💣"],
        ["Dota 2", "mid or feed"],
        ["Dota 2", "Roshan has been slain 🐉"],
        ["Dota 2", "an ally has abandoned the game. the remaining players are free to leave"],
        ["Dota 2", "'gg ez' — said at minute 4"],
        ["Dota 2", "your behaviour score went down 😇→😈"],
        ["Dota 2", "a new patch dropped. everything you knew is wrong"],
        ["Dota 2", "Pudge hooked you through the trees 🪝"],
        ["Dota 2", "low priority: 1 game remaining. stay strong 💜"],
        ["Dota 2", "the radiant ancient has fallen 🏆"],
        ["Dota 2", "you've been commended for: friendly 💜"],
        // AluBot (my Discord bot)
        ["AluBot", "I'm online 🟢 (for now)"],
        ["AluBot", "restarted. again. don't ask 🔄"],
        ["AluBot", "command not found: !sleep"],
        ["AluBot", "someone typed !help. I helped 💜"],
        ["AluBot", "Irene is playing Dota 2 again. I'm tracking it 👀"],
        ["AluBot", "error 404: motivation not found"],
        ["AluBot", "new update deployed 🚀 (please don't break)"],
        ["AluBot", "I've been running for 47 days straight. I need a vacation 🏝️"],
        ["AluBot", "reminder: Irene told me to tell you to drink water 💧"],
        ["AluBot", "beep boop. I love you 💜"],
        // Motivational
        ["Affirmations", "you're doing better than you think 💜"],
        ["Affirmations", "small steps still count 🌱"],
        ["Affirmations", "rest is productive too"],
        ["Affirmations", "you've survived 100% of your bad days so far"],
        ["Affirmations", "it's okay to start over. as many times as you need"],
        ["Affirmations", "progress, not perfection ✨"],
        ["Affirmations", "you don't have to have it all figured out"],
        ["Affirmations", "be as kind to yourself as you are to your friends"],
        ["Affirmations", "one thing at a time. you've got this"],
        ["Affirmations", "your pace is the right pace 🐢"],
        ["Affirmations", "the hard part is starting. you can do the hard part"],
        ["Affirmations", "you are allowed to take up space"],
        ["Affirmations", "today counts, even if all you did was get through it"],
        ["Affirmations", "you're not behind. you're on your own path 🛤️"],
        ["Affirmations", "drink some water, take a breath, try again 💧"],
        ["Affirmations", "future you is going to be so proud"],
        ["Affirmations", "you are more than your productivity"],
        ["Affirmations", "it's a bad day, not a bad life"],
        ["Affirmations", "the world is better with you in it 💜"],
        ["Affirmations", "you've grown so much. look back sometime"],
        ["Elden Ring", "every death is a lesson. the boss falls eventually 🗡️"],
        ["Hollow Knight", "even the smallest knight can go far 🪲"],
        ["Dota 2", "one lost game isn't the whole season 🛡️"],
        ["GitHub", "every expert was once a beginner who kept committing"],
        ["AluBot", "I believe in you. and I'm a bot, I don't lie 🤖"],
        ["Cat", "purrs supportively 🐈"],
        ["Universe", "you're exactly where you need to be right now 🌌"],
        ["Hearts", "proud of you. just for existing 💜"],
        // Carrie (the 2026 series)
        ["Carrie", "new episode available 📺 (watch with the lights on)"],
        ["Carrie", "prom tickets are on sale 🎟️ (maybe skip this one)"],
        ["Carrie", "reminder: never pour anything on anyone. ever."],
        ["Carrie", "they're all gonna laugh at you (they're not) 💜"],
        ["Carrie", "the gym is on fire. not metaphorically 🔥"],
        ["Carrie", "telekinesis update available. please use responsibly"],
        ["Carrie", "a character is about to deliver a 6-minute monologue. get comfy 🕯️"],
        ["Carrie", "you binged the whole season in one night. no regrets"],
        ["Carrie", "Stephen King cameo spotted? 👀"],
        // Lord of the Rings
        ["Lord of the Rings", "one does not simply go to bed at a normal hour"],
        ["Lord of the Rings", "second breakfast is ready 🍳"],
        ["Lord of the Rings", "Gandalf: a wizard is never late. unlike your bus"],
        ["Lord of the Rings", "the eagles are coming! (they're always late) 🦅"],
        ["Lord of the Rings", "Sam is carrying you. again 💜"],
        ["Lord of the Rings", "you shall not pass… on this snack 🍪"],
        ["Lord of the Rings", "they're taking the hobbits to Isengard 🎶"],
        // The Mentalist
        ["The Mentalist", "Jane is lying on the couch in the office again 🛋️"],
        ["The Mentalist", "Jane made tea. he's solved the case already 🍵"],
        ["The Mentalist", "Lisbon: 'Jane!' (he did something)"],
        ["The Mentalist", "Red John left a smiley on your wall 🙂"],
        ["The Mentalist", "you looked up and to the left. you're lying 👀"],
        // House M.D.
        ["House M.D.", "it's not lupus"],
        ["House M.D.", "it's never lupus"],
        ["House M.D.", "okay, this one time it was lupus"],
        ["House M.D.", "everybody lies 💊"],
        ["House M.D.", "Wilson brought lunch. House stole it 🥪"],
        ["House M.D.", "clinic duty in 5 minutes. House is hiding"],
        // Avatar: The Last Airbender
        ["Avatar: TLA", "my cabbages!! 🥬"],
        ["Avatar: TLA", "Uncle Iroh made you some tea 🍵 sit down, have some"],
        ["Avatar: TLA", "Sokka invented a new boomerang trick 🪃 it came back"],
        ["Avatar: TLA", "Zuko is talking about honour again 🔥"],
        ["Avatar: TLA", "Appa, yip yip! ☁️"],
        ["Avatar: TLA", "Toph says you're doing great. she can feel it in the ground"],
        ["Avatar: TLA", "the Avatar has returned (after 100 years, again)"],
        // Sherlock (BBC)
        ["Sherlock", "John: Sherlock, there's a head in the fridge 🧊"],
        ["Sherlock", "the game is on 🔍"],
        ["Sherlock", "Mrs. Hudson: I'm your landlady, not your housekeeper ☕"],
        ["Sherlock", "Moriarty: did you miss me? 📺"],
        ["Sherlock", "Mycroft wants a word. he sent a car 🚗"],
        ["Sherlock", "you have been deduced. you had cereal for dinner"],
        // Silo
        ["Silo", "don't say you want to go out 🤫"],
        ["Silo", "cleaning day was cancelled. good."],
        ["Silo", "you found a relic. hide it. now 🗝️"],
        ["Silo", "the stairs: 144 floors. the elevator: doesn't exist"],
        ["Silo", "Juliette fixed the generator again ⚙️"],
        // Inception
        ["Inception", "is this a dream? spin the top 🌀"],
        ["Inception", "BWAAAAAM 🎺"],
        ["Inception", "you need to go deeper"],
        ["Inception", "kick in 3… 2… 1…"],
        ["Inception", "the top is still spinning. don't look away"],
        // Peaky Blinders
        ["Peaky Blinders", "by order of the Peaky Blinders: go to sleep 🎩"],
        ["Peaky Blinders", "Tommy Shelby is staring at a wall, thinking 🚬"],
        ["Peaky Blinders", "Arthur is having a moment. again."],
        ["Peaky Blinders", "the Garrison is open for business 🥃"],
        ["Peaky Blinders", "new flat cap delivered 🧢"],
        // The Crown
        ["The Crown", "the Queen would like a word 👑"],
        ["The Crown", "tea is served at precisely 4 o'clock ☕"],
        ["The Crown", "a corgi has been spotted in the palace 🐕"],
        ["The Crown", "new season: same family, new actors"],
        ["The Crown", "the royal schedule: a balcony wave at noon 👋"],
        // Six Feet Under
        ["Six Feet Under", "Fisher & Sons Funeral Home: business as usual ⚰️"],
        ["Six Feet Under", "Nate has made another big life decision"],
        ["Six Feet Under", "Claire is painting something dark again 🎨"],
        ["Six Feet Under", "reminder: everything ends. so enjoy it 💜"],
        ["Six Feet Under", "the finale is still making you cry. years later 😭"],
        // The Sopranos
        ["The Sopranos", "Tony is at the therapist again 🛋️"],
        ["The Sopranos", "gabagool is ready 🍝"],
        ["The Sopranos", "the ducks left the pool 🦆"],
        ["The Sopranos", "family meeting at Satriale's 🥩"],
        ["The Sopranos", "the screen went black. don't stop believin' 🎶"],
        // Les Misérables (book)
        ["Les Misérables", "Valjean stole a loaf of bread 🥖 (19 years, worth it?)"],
        ["Les Misérables", "Javert is still chasing you. 17 years later 👮"],
        ["Les Misérables", "the bishop gave you the candlesticks too 🕯️"],
        ["Les Misérables", "you're on page 600. the sewers chapter is next 💀"],
        ["Les Misérables", "do you hear the people sing? 🎶"],
        ["Les Misérables", "Victor Hugo has started another 50-page tangent"],
        // Sherlock Holmes (books)
        ["Sherlock Holmes", "elementary, my dear Watson 🔍"],
        ["Sherlock Holmes", "a new case has arrived at 221B Baker Street 🏠"],
        ["Sherlock Holmes", "Watson has written another story about you ✍️"],
        ["Sherlock Holmes", "Holmes is playing violin at 3am again 🎻"],
        ["Sherlock Holmes", "Irene Adler: always 'the woman' 💜"],
        ["Sherlock Holmes", "when you eliminate the impossible… go to bed"],
        // The Great Gatsby (book)
        ["The Great Gatsby", "Gatsby is throwing another party 🥂 you're invited"],
        ["The Great Gatsby", "the green light across the bay is blinking 💚"],
        ["The Great Gatsby", "old sport! 🎩"],
        ["The Great Gatsby", "Daisy left the party early. again"],
        ["The Great Gatsby", "so we beat on, boats against the current 🌊"],
        // English
        ["English", "today's word: 'petrichor' 🌧️ the smell of rain"],
        ["English", "today's word: 'serendipity' ✨"],
        ["English", "today's word: 'defenestration' (look it up)"],
        ["English", "'their', 'there' or 'they're'? you got this"],
        ["English", "lesson streak: 12 days 🔥 keep it up"],
        ["English", "phrasal verb of the day: 'to call it a night' 🌙"],
        ["English", "irregular verbs: go, went, gone (to bed, please)"],
        ["English", "pronunciation check: 'Worcestershire' 😵"],
        // French
        ["French", "mot du jour : 'flâner', to wander with no goal 🚶"],
        ["French", "bonne nuit ! 🌙"],
        ["French", "your croissant has been delivered 🥐"],
        ["French", "le chat est sur la table. again 🐈"],
        ["French", "ça va ? 💜"],
        ["French", "conjugation drill: je suis, tu es, il est… fatigué"],
        ["French", "streak : 7 jours 🔥 c'est magnifique"],
        ["French", "today's word: 'dépaysement' ✨ the feeling of being somewhere new"],
        ["Duolingo", "🦉 the owl speaks French now. be afraid"],
        ["Duolingo", "🦉 you missed your English lesson. the owl is sad"],
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
    // clientWidth/Height leave out the scrollbar, like the background does.
    function place() {
        const viewWidth = document.documentElement.clientWidth;
        const viewHeight = document.documentElement.clientHeight;
        const scale = Math.max(viewWidth / IMAGE.width, viewHeight / IMAGE.height);
        const offsetX = (viewWidth - IMAGE.width * scale) / 2;
        const offsetY = (viewHeight - IMAGE.height * scale) / 2;
        const left = offsetX + PHONE.left * scale;
        const top = offsetY + PHONE.top * scale;
        const width = (PHONE.right - PHONE.left) * scale;
        const height = (PHONE.bottom - PHONE.top) * scale;
        spot.style.left = `${left}px`;
        spot.style.top = `${top}px`;
        spot.style.width = `${width}px`;
        spot.style.height = `${height}px`;
        // Hide it when the phone is cropped off screen (narrow or portrait windows).
        spot.hidden = left + width / 2 > viewWidth || top + height / 2 > viewHeight;
    }
    place();
    window.addEventListener("resize", place);

    // Now and then the phone glows and shakes as if something came in, so people notice it can be clicked.
    // Only for visitors who haven't found it yet (remembered per browser).
    const FOUND_KEY = "phone-found";
    let found = false;
    try {
        found = localStorage.getItem(FOUND_KEY) === "1";
    } catch {
        // Storage blocked: treat as a first visit.
    }
    const between = (min, max) => (min + Math.random() * (max - min)) * 1000;

    // A few gentle buzzes per visit at most, and none once the phone has been clicked.
    let buzzesLeft = 3;
    function buzz() {
        if (found) return;
        if (!spot.hidden && document.visibilityState === "visible") {
            spot.classList.remove("buzz");
            void spot.offsetWidth; // restart the animation
            spot.classList.add("buzz");
            buzzesLeft--;
        }
        if (buzzesLeft > 0) setTimeout(buzz, between(90, 150));
    }
    spot.addEventListener("animationend", (e) => {
        if (e.animationName === "phone-glow") spot.classList.remove("buzz");
    });
    setTimeout(buzz, between(20, 30));

    spot.addEventListener("click", () => {
        if (!found) {
            found = true;
            try {
                localStorage.setItem(FOUND_KEY, "1");
            } catch {
                // Not remembered then; it stops buzzing for this visit and starts again on the next.
            }
        }
        const [app, text] = nextNotification();
        window.showToast({ app, time: "now", lines: [text] });
    });

    // Holding the mouse still over the phone for a few seconds: someone starts typing… and never sends it.
    const endings = ["…never mind 🫣", "stopped typing", "deleted it 👀", "typing… (still)"];
    let stillTimer;
    let typing = false;

    function startTyping() {
        typing = true;
        const show = (lines, extra = {}) =>
            window.showToast({ key: "typing", app: "Messages", time: "now", title: "unknown number", lines, ...extra });
        show(["typing"], { duration: 3000 });
        let dots = 0;
        const tick = setInterval(() => {
            dots = (dots + 1) % 4;
            show([`typing${".".repeat(dots)}`], { duration: 3000, raise: false, onlyIfShown: true, quiet: true });
        }, 450);
        setTimeout(() => {
            clearInterval(tick);
            show([endings[Math.floor(Math.random() * endings.length)]], { duration: 3500, raise: false, onlyIfShown: true });
            typing = false;
        }, 4500);
    }

    spot.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse" || typing) return;
        clearTimeout(stillTimer);
        stillTimer = setTimeout(startTyping, 5000);
    });
    spot.addEventListener("pointerleave", () => clearTimeout(stillTimer));
    spot.addEventListener("click", () => clearTimeout(stillTimer));
})();

// Easter egg: switching to another tab makes the tab title beg you to come back.
(() => {
    const original = document.title;
    const missing = ["come back 🥺", "I miss you 💜", "psst… 👀", "don't leave me 😿", "hello?? 👋"];
    let restore;
    document.addEventListener("visibilitychange", () => {
        clearTimeout(restore);
        if (document.hidden) {
            document.title = missing[Math.floor(Math.random() * missing.length)];
        } else {
            document.title = "you're back 💜";
            restore = setTimeout(() => (document.title = original), 1500);
        }
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
