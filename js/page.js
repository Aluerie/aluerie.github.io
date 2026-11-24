// The greeting is a random phrase for the visitor's time of day; "Hello there," in the HTML is the fallback.
(() => {
    const greeting = document.querySelector(".greeting");
    if (!greeting) return;

    const lateNight = [
        "Can't sleep either?",
        "Up late too?",
        "Oh, you're still awake?",
        "Shouldn't you be asleep?",
        "Hi, fellow night owl,",
        "Insomnia gang,",
        "One more scroll, huh?",
        "It's way past bedtime,",
        "Midnight snack break?",
        "The night is young,",
        "Psst, you awake?",
        "Same, can't sleep,",
        "3am thoughts?",
    ];
    const morning = [
        "Good morning,",
        "Morning, sleepyhead,",
        "Rise and shine,",
        "Coffee first, then hi,",
        "Oh, an early bird,",
        "Morning!",
        "Top of the morning,",
        "Hope you slept well,",
        "Breakfast yet?",
        "Good morning, sunshine,",
        "Up already?",
    ];
    const afternoon = [
        "Hello there,",
        "Hey you,",
        "Oh, hi!",
        "Welcome,",
        "Good afternoon,",
        "Hi hi,",
        "Oh, hello!",
        "Nice to see you,",
        "Afternoon break?",
        "Hey, welcome in,",
        "Long time no see,",
        "Fancy seeing you here,",
    ];
    const evening = [
        "Good evening,",
        "Evening, stranger,",
        "Cozy night, huh?",
        "Hi, night person,",
        "Evening!",
        "How was your day?",
        "Winding down?",
        "Hey, night owl in training,",
        "Hi, welcome back,",
        "Long day, huh?",
        "Perfect time for a stream,",
        "Tea and chill?",
    ];

    const hour = new Date().getHours();
    const phrases = hour < 5 ? lateNight : hour < 12 ? morning : hour < 18 ? afternoon : evening;
    greeting.textContent = phrases[Math.floor(Math.random() * phrases.length)];
})();

// "it's 03:12 for me 🌙" under the handle. Shows UTC on purpose, not my real time zone.
(() => {
    const line = document.querySelector(".my-time");
    if (!line) return;

    const format = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

    function tick() {
        const now = new Date();
        const hour = now.getUTCHours();
        const icon = hour < 5 ? "🌙" : hour < 8 ? "🌅" : hour < 18 ? "☀️" : hour < 21 ? "🌆" : "🌙";
        line.textContent = `it's ${format.format(now)} for me ${icon}`;
        line.hidden = false;
    }
    tick();
    // Re-check at the start of every minute.
    setTimeout(() => {
        tick();
        setInterval(tick, 60 * 1000);
    }, (60 - new Date().getSeconds()) * 1000);
})();

// While I'm live on Twitch, the Twitch button glows and gets a LIVE badge. Checked on load and every few minutes.
(() => {
    const button = document.querySelector(".link-btn.brand-twitch");
    if (!button) return;

    const badge = document.createElement("span");
    badge.className = "live-badge";
    badge.textContent = "LIVE";

    async function check() {
        try {
            const response = await fetch("https://decapi.me/twitch/uptime/irene_adler__", {
                signal: AbortSignal.timeout(8000),
            });
            const text = response.ok ? await response.text() : "";
            // Live streams answer with the uptime ("1 hour, 2 minutes"); anything else counts as offline.
            const live = /\d/.test(text) && !/offline|error|not found|invalid/i.test(text);
            button.classList.toggle("is-live", live);
            if (live) button.appendChild(badge);
            else badge.remove();
        } catch {
            // Network trouble: leave the button as it is.
        }
    }
    check();
    setInterval(check, 3 * 60 * 1000);
})();

// Clicking the @Aluerie handle copies it and says so in a notification.
// Easter egg: clicking it again and again gets more and more exasperated replies.
(() => {
    const handle = document.querySelector(".handle");
    if (!handle) return;

    const replies = [
        "copied 💜",
        "copied again 💜",
        "yes, it's copied",
        "still copied, promise",
        "it's in your clipboard!!",
        "okay you REALLY like my name",
        "I'm flattered 😳",
        "fine. copied 💜",
    ];
    const text = handle.textContent.trim();
    let clicks = 0;
    let lastClick = 0;

    handle.addEventListener("click", async () => {
        // Count clicks in a row; a pause of a few seconds starts over.
        const now = performance.now();
        clicks = now - lastClick < 4000 ? clicks + 1 : 0;
        lastClick = now;

        try {
            await navigator.clipboard.writeText(text);
            window.showToast({
                key: "copy",
                title: replies[Math.min(clicks, replies.length - 1)],
                lines: [`${text} is in your clipboard`],
                duration: 2500,
            });
        } catch {
            window.showToast({ key: "copy", title: "couldn't copy 😿", lines: [`it's ${text}, by the way`] });
        }
    });
})();
