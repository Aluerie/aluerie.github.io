"""Fail if the Discord card buttons in index.html don't match the link buttons on the page.

The page links (in <main>) and the Discord card (JSON in <head>) are written out separately,
so this catches one being updated without the other. mailto: links are skipped because
Discord buttons only accept web links.
"""

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

INDEX = Path(__file__).resolve().parents[2] / "index.html"


class PageParser(HTMLParser):
    """Collect the card JSON and the hrefs of .link-btn anchors (HTML comments are ignored)."""

    def __init__(self) -> None:
        super().__init__()
        self.page_links: list[str] = []
        self.card_json = ""
        self._in_card = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag == "script" and attributes.get("id") == "discord:component-embed":
            self._in_card = True
        elif tag == "a" and "link-btn" in (attributes.get("class") or "").split():
            self.page_links.append(attributes.get("href") or "")

    def handle_endtag(self, tag: str) -> None:
        if tag == "script":
            self._in_card = False

    def handle_data(self, data: str) -> None:
        if self._in_card:
            self.card_json += data


def card_buttons(node: object) -> list[str]:
    """Return the url of every link button (type 2) in the card, in order."""
    if isinstance(node, dict):
        if node.get("type") == 2 and "url" in node:
            return [node["url"]]
        return [url for value in node.values() for url in card_buttons(value)]
    if isinstance(node, list):
        return [url for item in node for url in card_buttons(item)]
    return []


def main() -> int:
    parser = PageParser()
    parser.feed(INDEX.read_text(encoding="utf-8"))

    if not parser.card_json.strip():
        print("::error file=index.html::Discord card JSON not found")
        return 1
    try:
        card = json.loads(parser.card_json)
    except json.JSONDecodeError as error:
        print(f"::error file=index.html::Discord card JSON is invalid: {error}")
        return 1

    page = [url for url in parser.page_links if not url.startswith("mailto:")]
    discord = card_buttons(card)

    if page == discord:
        print(f"OK: page and Discord card both have the same {len(page)} links.")
        return 0

    print("::error file=index.html::Page links and Discord card buttons don't match")
    for url in page:
        if url not in discord:
            print(f"  only on the page:        {url}")
    for url in discord:
        if url not in page:
            print(f"  only in the Discord card: {url}")
    if sorted(page) == sorted(discord):
        print("  same links, different order")
    return 1


if __name__ == "__main__":
    sys.exit(main())
