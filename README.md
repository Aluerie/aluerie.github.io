# 💜 aluerie.github.io

My links page, live at <https://aluerie.github.io/>.

![The links page: a greeting, "I'm Irene Adler 💜", the @Aluerie handle and a column of link buttons over night-time background art](.github/screenshot.png)

It's a single static page (`index.html`, with styles in `css/`, scripts in `js/` and images in `img/`) served by GitHub Pages straight from `main`, with no build step.

## ✨ Features

- A random greeting for the visitor's time of day.
- Floating hearts on click, hold and mouse move (off when the system asks for reduced motion).
- Click `@Aluerie` to copy the handle.
- "it's 1:52 AM for me 🌙" in the bottom-left corner, in UTC.
- The Twitch button glows and gets a LIVE badge while I'm streaming.
- Hovering a link button shows a notification with live info (`js/status.js`): Twitch stream status via [DecAPI](https://decapi.me/), Discord server size via Discord's invite API, GitHub stats and latest activity, the song I'm playing via [Now Playing for Spotify](https://spotify.aiden.tv/), and Discord presence and current game via [Lanyard](https://github.com/Phineas/lanyard). Each one falls back to plain text if its service doesn't answer.
- A custom Discord card when the link is posted in Discord.
- A handful of easter eggs (in `js/eggs.js` and `js/hearts.js`), and a catch-the-hearts mini-game on the 404 page (`js/catch.js`).

## 🔗 Adding or changing a link

Every link is written out twice in `index.html`, so change both:

1. The button list in `<main>`. A new button needs a `brand-*` class in `css/style.css` and, for a new logo, an icon `<symbol>` in the SVG sprite at the top of `<body>`.
2. The Discord card JSON in `<head>`. Discord allows at most 5 buttons per row and only web links, so `mailto:` stays page-only.

A GitHub Action ([check_discord_card.py](.github/scripts/check_discord_card.py)) fails if the two lists don't match. Run it locally with:

```sh
python .github/scripts/check_discord_card.py
```

Another Action ([dead-links.yml](.github/workflows/dead-links.yml)) checks every link once a week, Discord invites included, and opens an issue if any are broken.

## 🖼️ Link preview image

`img/og.jpg` is the 1200×630 picture shown when the link is shared on X, Telegram, WhatsApp and so on. It's rendered from [og-image.html](.github/og-image.html); after editing that, start a headless Edge (or Chrome) and render it again:

```sh
msedge --headless=new --remote-debugging-port=9333 about:blank
```

```sh
node .github/scripts/render_og_image.mjs
```

## 😀 Discord card emojis

The logos on the Discord card buttons are custom emojis uploaded to Discord from [img/emojis](img/emojis) (256×256 PNGs). The card refers to them by ID only, as `"emoji": { "id": "…" }`, so a new logo has to be uploaded to Discord first. Adding the emoji's `name` makes Discord drop the buttons altogether.

## 📊 Stats

The GitHub hover notification shows commits this month and lines written per language this week, and the Spotify one shows my playlist with a random song from it when I'm not listening to anything. Neither is available to the page directly, so [github-stats.yml](.github/workflows/github-stats.yml) runs [github_stats.py](.github/scripts/github_stats.py) and [spotify_playlist.py](.github/scripts/spotify_playlist.py) every 6 hours and force-pushes the results as `github.json` and `playlist.json` to the `stats` branch, which the page reads from raw.githubusercontent.com. The playlist comes from Spotify's public embed page, so it needs no API key, but it only lists the first 100 songs.

To test the Discord card after pushing, wait about 10 minutes, then post `https://aluerie.github.io/?v=<new number>` so Discord fetches it fresh.

## 📜 License

The code is under the [MIT License](LICENSE). The background art is by [@Shrylia](https://x.com/shrylia) and isn't covered by it. The icons are [Font Awesome Free](https://fontawesome.com/license/free) (CC BY 4.0).
