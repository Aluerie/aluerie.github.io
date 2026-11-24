// 404 mini-game: tap the falling 💜 before they hit the bottom, and leave the 🖤 alone.
// Three missed 💜 (or one tapped 🖤 each) end the round.
(() => {
    const main = document.querySelector("main");
    const greeting = document.querySelector(".greeting");
    const playButton = document.querySelector(".play-btn");
    if (!main || !greeting || !playButton) return;

    const LIVES = 3;
    const hud = document.createElement("div");
    hud.className = "hud";
    hud.hidden = true;
    document.body.appendChild(hud);

    let score = 0;
    let lives = 0;
    let speed = 0;
    let spawnEvery = 0;
    let sinceSpawn = 0;
    let lastFrame = 0;
    let hearts = [];
    let running = false;

    function readBest() {
        try {
            return Number(localStorage.getItem("catch-best")) || 0;
        } catch {
            return 0;
        }
    }

    function saveBest(value) {
        try {
            localStorage.setItem("catch-best", String(value));
        } catch {
            // Storage blocked: the best score just isn't remembered.
        }
    }

    function drawHud() {
        hud.textContent = `${score} caught   ${"💜".repeat(lives)}${"🤍".repeat(LIVES - lives)}`;
    }

    function addHeart() {
        // Bad hearts only show up once you've got the hang of it.
        const bad = score >= 5 && Math.random() < 0.18;
        const el = document.createElement("button");
        el.type = "button";
        el.className = "catch-heart";
        el.textContent = bad ? "🖤" : "💜";
        el.setAttribute("aria-label", bad ? "black heart, don't catch" : "purple heart, catch");
        const x = 30 + Math.random() * (window.innerWidth - 60);
        el.style.left = `${x}px`;
        document.body.appendChild(el);

        const heart = { el, bad, y: -50, wobble: Math.random() * Math.PI * 2 };
        el.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            if (!running || !hearts.includes(heart)) return;
            remove(heart, true);
            if (heart.bad) {
                loseLife();
            } else {
                score++;
                speed = Math.min(speed + 7, 460);
                spawnEvery = Math.max(spawnEvery - 15, 380);
                drawHud();
            }
        });
        hearts.push(heart);
    }

    function remove(heart, popped) {
        hearts = hearts.filter((h) => h !== heart);
        if (!popped) {
            heart.el.remove();
            return;
        }
        heart.el.classList.add("popped");
        setTimeout(() => heart.el.remove(), 250);
    }

    function loseLife() {
        lives--;
        drawHud();
        document.body.classList.remove("ouch");
        void document.body.offsetWidth;
        document.body.classList.add("ouch");
        if (lives <= 0) end();
    }

    function frame(time) {
        if (!running) return;
        // Clamp the step so a backgrounded tab doesn't teleport everything on return.
        const dt = Math.min(time - lastFrame, 50) / 1000;
        lastFrame = time;

        sinceSpawn += dt * 1000;
        if (sinceSpawn >= spawnEvery) {
            sinceSpawn = 0;
            addHeart();
        }

        for (const heart of [...hearts]) {
            heart.y += speed * dt;
            heart.wobble += dt * 3;
            heart.el.style.transform = `translate(-50%, ${heart.y}px) rotate(${Math.sin(heart.wobble) * 15}deg)`;
            if (heart.y > window.innerHeight) {
                remove(heart, false);
                if (!heart.bad) loseLife();
                if (!running) return;
            }
        }
        requestAnimationFrame(frame);
    }

    function start() {
        score = 0;
        lives = LIVES;
        speed = 140;
        spawnEvery = 900;
        sinceSpawn = spawnEvery;
        running = true;
        main.hidden = true;
        hud.hidden = false;
        drawHud();
        lastFrame = performance.now();
        requestAnimationFrame(frame);
    }

    function end() {
        running = false;
        for (const heart of hearts) heart.el.remove();
        hearts = [];

        const best = readBest();
        if (score > best) saveBest(score);
        greeting.textContent =
            score > best && best > 0
                ? `New best: ${score} hearts!`
                : `You caught ${score} heart${score === 1 ? "" : "s"}${best ? ` (best ${Math.max(best, score)})` : ""},`;
        playButton.textContent = "🎮 Play again";
        hud.hidden = true;
        main.hidden = false;
    }

    playButton.addEventListener("click", start);
})();
