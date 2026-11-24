# 💜 aluerie.github.io

My links page, live at <https://aluerie.github.io/>.

![The links page: a greeting, "I'm Irene Adler 💜", the @Aluerie handle and a column of link buttons over night-time background art](.github/screenshot.png)

It's a single static page (`index.html`, with styles in `css/`, scripts in `js/` and images in `img/`) served by GitHub Pages straight from `main`, with no build step.

## ✨ Features

- A random greeting for the visitor's time of day.
- Floating hearts on click, hold and mouse move (off when the system asks for reduced motion).
- Click `@Aluerie` to copy the handle.
- A custom Discord card when the link is posted in Discord.

## 🔗 Adding or changing a link

Every link is written out twice in `index.html`, so change both:

1. The button list in `<main>`. A new button needs a `brand-*` class in `css/style.css` and, for a new logo, an icon `<symbol>` in the SVG sprite at the top of `<body>`.
2. The Discord card JSON in `<head>`. Discord allows at most 5 buttons per row and only web links, so `mailto:` stays page-only.

A GitHub Action ([check_discord_card.py](.github/scripts/check_discord_card.py)) fails if the two lists don't match. Run it locally with:

```sh
python .github/scripts/check_discord_card.py
```

To test the Discord card after pushing, wait about 10 minutes, then post `https://aluerie.github.io/?v=<new number>` so Discord fetches it fresh.

## 📜 License

The code is under the [MIT License](LICENSE). The background art is by [@Shrylia](https://x.com/shrylia) and isn't covered by it. The icons are [Font Awesome Free](https://fontawesome.com/license/free) (CC BY 4.0).
