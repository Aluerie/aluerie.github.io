// Floating hearts: a small burst on click/tap and a sparse trail behind the mouse.
// Skipped entirely when the visitor's system asks for reduced motion.
(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const HEART = "💜";

    function spawn(x, y, { size, dx, dy, duration, opacity }) {
        const el = document.createElement("span");
        el.className = "heart";
        el.textContent = HEART;
        el.style.fontSize = `${size}px`;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.body.appendChild(el);

        el.animate(
            [
                { transform: "translate(-50%, -50%) scale(0.6)", opacity },
                { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`, opacity: 0 },
            ],
            { duration, easing: "ease-out" },
        ).onfinish = () => el.remove();
    }

    const rand = (min, max) => min + Math.random() * (max - min);

    // Easter egg: clicking the 💜 in the heading sets off a big burst all around it.
    document.addEventListener("pointerdown", (e) => {
        const egg = e.target.closest(".heart-egg");
        if (!egg) return;
        const box = egg.getBoundingClientRect();
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;
        for (let i = 0; i < 40; i++) {
            const angle = rand(0, Math.PI * 2);
            const distance = rand(80, 260);
            spawn(x, y, {
                size: rand(16, 30),
                dx: Math.cos(angle) * distance,
                dy: Math.sin(angle) * distance - 40,
                duration: rand(900, 1600),
                opacity: 1,
            });
        }
    });

    // Option 1: a few hearts float up from where you click or tap.
    document.addEventListener("pointerdown", (e) => {
        for (let i = 0; i < 5; i++) {
            spawn(e.clientX, e.clientY, {
                size: rand(16, 24),
                dx: rand(-40, 40),
                dy: rand(-90, -50),
                duration: rand(700, 1000),
                opacity: 1,
            });
        }
    });

    // While the button is held, keep pouring hearts from the pointer.
    let pointerX = 0;
    let pointerY = 0;
    let holdDelay = 0;
    let pourTimer = 0;

    function stopPouring() {
        clearTimeout(holdDelay);
        clearInterval(pourTimer);
        holdDelay = pourTimer = 0;
    }

    document.addEventListener("pointerdown", (e) => {
        pointerX = e.clientX;
        pointerY = e.clientY;
        stopPouring();
        // Short delay so a normal click only gives the burst.
        holdDelay = setTimeout(() => {
            pourTimer = setInterval(() => {
                spawn(pointerX, pointerY, {
                    size: rand(14, 22),
                    dx: rand(-50, 50),
                    dy: rand(-110, -60),
                    duration: rand(800, 1200),
                    opacity: 0.9,
                });
            }, 60);
        }, 250);
    });
    document.addEventListener("pointerup", stopPouring);
    document.addEventListener("pointercancel", stopPouring);
    window.addEventListener("blur", stopPouring);

    // Option 2: an occasional faint heart while the mouse moves.
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;
    document.addEventListener("pointermove", (e) => {
        pointerX = e.clientX;
        pointerY = e.clientY;
        if (e.pointerType !== "mouse") return;
        const now = performance.now();
        if (now - lastTime < 80 || Math.hypot(e.clientX - lastX, e.clientY - lastY) < 60) return;
        lastX = e.clientX;
        lastY = e.clientY;
        lastTime = now;
        spawn(e.clientX, e.clientY, {
            size: rand(12, 16),
            dx: rand(-10, 10),
            dy: rand(-30, -15),
            duration: 600,
            opacity: 0.6,
        });
    });
})();
