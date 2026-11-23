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
