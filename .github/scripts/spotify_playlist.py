"""Save my Spotify playlist's name, cover and songs into a small JSON file for the links page.

Reads the public embed page, so no Spotify API key is needed. The embed lists at most 100 songs;
`more` is true when the list was cut off there. Usage: python spotify_playlist.py <output.json>
"""

import json
import re
import sys
import urllib.request

PLAYLIST = "7fVAcuDPLVAUL8555vy8Kz"
EMBED_LIMIT = 100


def main() -> None:
    request = urllib.request.Request(
        f"https://open.spotify.com/embed/playlist/{PLAYLIST}",
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        html = response.read().decode("utf-8")

    match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if not match:
        sys.exit("Spotify embed page has no __NEXT_DATA__ (layout changed or not available)")
    entity = json.loads(match.group(1))["props"]["pageProps"]["state"]["data"]["entity"]
    tracks = entity["trackList"]

    playlist = {
        "name": entity["name"],
        "cover": (entity.get("coverArt") or {}).get("sources", [{}])[0].get("url"),
        "songs": len(tracks),
        "more": len(tracks) >= EMBED_LIMIT,
        "duration_ms": sum(track["duration"] for track in tracks),
        "tracks": [{"title": track["title"], "artist": track["subtitle"]} for track in tracks],
    }
    with open(sys.argv[1], "w", encoding="utf-8", newline="\n") as file:
        json.dump(playlist, file, indent=2, ensure_ascii=False)
        file.write("\n")


if __name__ == "__main__":
    main()
