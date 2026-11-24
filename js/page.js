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
