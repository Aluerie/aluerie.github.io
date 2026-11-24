// Hovering a link button (or tabbing to it) shows a notification with live info for that link:
// stream status, Discord presence, server size, GitHub activity and so on.
// Every source is optional: if a service is down or blocked, the toast falls back to plain text or isn't shown.
(() => {
    if (!window.showToast) return;

    const TWITCH = "irene_adler__";
    const DISCORD_ID = "312204139751014400";
    const DISCORD_INVITE = "K8FuDeP";
    const GITHUB = "Aluerie";
    const EMAIL = "aluerie@gmail.com";
    // Read-only "now playing" link from spotify.aiden.tv (the same kind chatbots use for !song).
    // It's public by design; if it ever needs replacing, generate a new one there.
    const SPOTIFY_NOW_PLAYING = "https://spotify.aidenwallis.co.uk/u/65eb6afbe1ec4a6adb08b060";

    const HOVER_DELAY = 300; // so sweeping the mouse across the list doesn't fire every button
    const CACHE_FOR = 2 * 60 * 1000;
    const RETRY_AFTER = 15 * 1000; // failed requests are retried sooner

    // ---- fetching ----

    const cache = new Map();

    // Fetch once per `keep` ms (RETRY_AFTER if it failed); concurrent callers share the same request.
    // Resolves to null on any failure.
    function cached(url, as = "json", keep = CACHE_FOR) {
        const hit = cache.get(url);
        if (hit && performance.now() - hit.time < (hit.failed ? RETRY_AFTER : keep)) return hit.promise;
        const entry = { time: performance.now(), failed: false };
        entry.promise = fetch(url, { signal: AbortSignal.timeout(4000) })
            .then((r) => (r.ok ? r[as]() : null))
            .catch(() => null)
            .then((body) => {
                entry.failed = body === null;
                return body;
            });
        cache.set(url, entry);
        return entry.promise;
    }

    const ago = (date) => {
        const seconds = (new Date(date) - Date.now()) / 1000;
        const format = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });
        for (const [unit, size] of [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]]) {
            if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
        }
        return "just now";
    };

    const plural = (n, word) => `${n.toLocaleString("en")} ${word}${n === 1 ? "" : "s"}`;

    // Lanyard mirrors my Discord presence (status, game, Spotify) as public JSON.
    async function lanyard() {
        const body = await cached(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        return body?.success ? body.data : null;
    }

    // ---- one function per button ----
    // Each returns the toast to show. A source with several slow parts can also call `update(toast)`
    // later to fill in more details as they arrive.

    async function twitch(update) {
        const base = "https://decapi.me/twitch";
        const get = (what) => cached(`${base}/${what}/${TWITCH}`, "text");
        const clean = (s) => (s && !/error|not found|invalid|offline/i.test(s) ? s.trim() : "");

        const uptime = await get("uptime");
        if (!uptime) return { title: "come say hi on stream 💜" };
        const live = !/offline/i.test(uptime);

        // The essentials first, then each extra detail as soon as it comes in.
        const details = { title: "", game: "", followers: 0 };
        const render = () =>
            live
                ? {
                      title: `🔴 Live now · ${uptime.trim()}`,
                      lines: [details.title, details.game && `playing ${details.game}`],
                  }
                : {
                      title: "💤 Offline right now",
                      lines: [
                          details.game && `last played ${details.game}`,
                          details.followers ? `${plural(details.followers, "follower")} · come join them` : "",
                      ],
                  };
        get("title").then((t) => { details.title = clean(t); update(render()); });
        get("game").then((g) => { details.game = clean(g); update(render()); });
        get("followcount").then((f) => { details.followers = Number(clean(f)) || 0; update(render()); });
        return render();
    }

    async function discordDm() {
        const data = await lanyard();
        if (!data) return { title: "@aluerie on Discord", lines: ["the quickest way to reach me"] };

        const statuses = {
            online: "🟢 Online",
            idle: "🌙 Away",
            dnd: "⛔ Do not disturb",
            offline: "⚫ Offline",
        };
        const custom = data.activities.find((a) => a.type === 4);
        const playing = data.activities.find((a) => a.type === 0);
        return {
            title: statuses[data.discord_status] ?? `@${data.discord_user.username} on Discord`,
            lines: [
                custom && [custom.emoji?.name, custom.state].filter(Boolean).join(" "),
                playing && `🎮 playing ${playing.name}`,
                data.listening_to_spotify && `🎵 ${data.spotify.song} · ${data.spotify.artist}`,
                `@${data.discord_user.username} on Discord`,
            ],
        };
    }

    async function discordServer() {
        const invite = await cached(`https://discord.com/api/v10/invites/${DISCORD_INVITE}?with_counts=true`);
        if (!invite?.guild) return { title: "my Discord server", lines: ["come hang out 💜"] };
        return {
            title: invite.guild.name,
            lines: [
                invite.guild.description,
                `🟢 ${invite.approximate_presence_count.toLocaleString("en")} online · ${plural(invite.approximate_member_count, "member")}`,
            ],
        };
    }

    const EVENTS = {
        PushEvent: "pushed to",
        CreateEvent: "created something in",
        PullRequestEvent: "opened a pull request in",
        IssuesEvent: "opened an issue in",
        IssueCommentEvent: "commented in",
        ReleaseEvent: "released",
        WatchEvent: "starred",
        ForkEvent: "forked",
        GollumEvent: "edited the wiki of",
    };

    // Commit counts and lines per language, collected every few hours by the github-stats workflow.
    const GITHUB_STATS = `https://raw.githubusercontent.com/${GITHUB}/aluerie.github.io/stats/github.json`;

    async function github() {
        const [stats, events] = await Promise.all([
            cached(GITHUB_STATS),
            cached(`https://api.github.com/users/${GITHUB}/events/public?per_page=10`),
        ]);

        const latest = Array.isArray(events) ? events.find((e) => EVENTS[e.type]) : null;
        let activity = "";
        if (latest) {
            const repo = latest.repo.name.replace(`${GITHUB}/`, "");
            const created = { repository: "created", branch: "created a branch in", tag: "tagged a release of" };
            const verb =
                latest.type === "CreateEvent" ? created[latest.payload.ref_type] ?? EVENTS.CreateEvent : EVENTS[latest.type];
            activity = `${verb} ${repo} · ${ago(latest.created_at)}`;
        }
        if (!stats?.commits_month) return { title: "mods, bots and little tools", lines: [activity] };

        // A different one of this week's top languages on each hover, for a bit of variety.
        const languages = (stats.languages_week ?? []).slice(0, 3);
        const language = languages[Math.floor(Math.random() * languages.length)];
        const busiest = stats.top_repo_month?.name;
        return {
            title: `${plural(stats.commits_month, "commit")} this month${busiest ? ` · mostly ${busiest}` : ""}`,
            lines: [
                language && `wrote ${plural(language.lines, "line")} of ${language.name} this week`,
                activity,
            ],
        };
    }

    async function spotify() {
        // Songs change every few minutes, so this one is only cached briefly.
        const playing = (await cached(SPOTIFY_NOW_PLAYING, "text", 20 * 1000))?.trim();
        if (playing && !/no song|not playing|error|not found|invalid/i.test(playing)) {
            return { title: "🎵 Listening right now", lines: [playing] };
        }
        return { title: "my playlist 🎵", lines: ["press play and stay a while"] };
    }

    async function steam() {
        const data = await lanyard();
        const playing = data?.activities.find((a) => a.type === 0);
        if (playing) {
            return { title: `🎮 Playing ${playing.name}`, lines: [playing.details, playing.state] };
        }
        return { title: "see what I've been playing 🎮" };
    }

    async function email() {
        return { title: EMAIL, lines: ["click to write to me ✉️"] };
    }

    // ---- wiring ----

    function sourceFor(link) {
        const href = link.getAttribute("href") ?? "";
        if (link.classList.contains("brand-twitch")) return ["twitch", "Twitch", twitch];
        if (link.classList.contains("brand-github")) return ["github", "GitHub", github];
        if (link.classList.contains("brand-discord")) {
            return href.includes("discord.gg")
                ? ["discord-server", "Discord", discordServer]
                : ["discord-dm", "Discord", discordDm];
        }
        if (link.classList.contains("brand-spotify")) return ["spotify", "Spotify", spotify];
        if (link.classList.contains("brand-steam")) return ["steam", "Steam", steam];
        if (link.classList.contains("brand-email")) return ["email", "Email", email];
        return null;
    }

    const wait = (ms) => new Promise((resolve) => setTimeout(() => resolve("waiting"), ms));

    // Hint for visitors who haven't found the hover notifications: once, 30 seconds in, mouse users only.
    // Remembered per browser, and skipped for good as soon as they hover a button themselves.
    const HINT_KEY = "hover-hint-done";
    const remember = (key) => {
        try {
            localStorage.setItem(key, "1");
        } catch {
            // Storage blocked: the hint may show again on a later visit, which is fine.
        }
    };
    const remembered = (key) => {
        try {
            return localStorage.getItem(key) === "1";
        } catch {
            return false;
        }
    };
    let hovered = false;
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !remembered(HINT_KEY)) {
        setTimeout(() => {
            if (hovered) return;
            remember(HINT_KEY);
            window.showToast({ app: "psst…", title: "hover the buttons 👀", lines: ["they know things about me"], duration: 7000 });
        }, 30 * 1000);
    }

    async function show(link) {
        const source = sourceFor(link);
        if (!source) return;
        if (!hovered) {
            hovered = true;
            remember(HINT_KEY);
        }
        const [key, app, load] = source;
        // Late results only refresh the toast if it's still on screen, and don't pull it to the front.
        let latest = null;
        const update = (toast) => {
            latest = toast;
            window.showToast({ key, app, ...toast, duration: 5000, raise: false, onlyIfShown: true });
        };

        const loading = load(update);
        const quick = await Promise.race([loading, wait(150)]);
        if (quick !== "waiting") {
            // Cached details may already have come in through `update` before the first toast was shown.
            window.showToast({ key, app, ...(latest ?? quick), duration: 5000 });
            return;
        }
        // Slow source: show a placeholder now and swap the real info in when it arrives.
        window.showToast({ key, app, title: "checking…", duration: 6000 });
        update(await loading);
    }

    for (const link of document.querySelectorAll(".link-btn")) {
        let timer = 0;
        link.addEventListener("pointerenter", (e) => {
            if (e.pointerType !== "mouse") return;
            timer = setTimeout(() => show(link), HOVER_DELAY);
        });
        link.addEventListener("pointerleave", () => clearTimeout(timer));
        link.addEventListener("focus", () => {
            if (link.matches(":focus-visible")) show(link);
        });
    }
})();
