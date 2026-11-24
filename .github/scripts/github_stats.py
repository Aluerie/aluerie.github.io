"""Collect my recent GitHub activity into a small JSON file for the links page.

Writes commits this week / month, the most active repo this month and lines added per language this week.
Needs a GitHub token in GITHUB_TOKEN. Usage: python github_stats.py <output.json>
"""

import json
import os
import sys
import urllib.parse
import urllib.request
from collections import Counter
from datetime import UTC, datetime, timedelta
from pathlib import PurePosixPath

USER = "Aluerie"

# Files over this many added lines in one commit are most likely generated or vendored, so they're skipped.
MAX_FILE_LINES = 2000

LANGUAGES = {
    ".rs": "Rust",
    ".py": "Python",
    ".ahk": "AutoHotkey",
    ".ah2": "AutoHotkey",
    ".js": "JavaScript",
    ".mjs": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".html": "HTML",
    ".css": "CSS",
    ".lua": "Lua",
    ".c": "C",
    ".h": "C",
    ".cpp": "C++",
    ".hpp": "C++",
    ".cc": "C++",
    ".cs": "C#",
    ".go": "Go",
    ".java": "Java",
    ".kt": "Kotlin",
    ".sh": "Shell",
    ".ps1": "PowerShell",
    ".sql": "SQL",
}


def request(url: str, data: dict | None = None) -> dict:
    headers = {
        "Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "links-page-stats",
    }
    body = json.dumps(data).encode() if data is not None else None
    with urllib.request.urlopen(urllib.request.Request(url, body, headers), timeout=30) as response:
        return json.load(response)


def contributions(since: datetime, until: datetime) -> dict:
    query = """
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          commitContributionsByRepository(maxRepositories: 10) {
            repository { name isPrivate }
            contributions { totalCount }
          }
        }
      }
    }"""
    variables = {"login": USER, "from": since.isoformat(), "to": until.isoformat()}
    result = request("https://api.github.com/graphql", {"query": query, "variables": variables})
    return result["data"]["user"]["contributionsCollection"]


def lines_by_language(since: datetime) -> Counter:
    """Lines added per language in my public commits since `since` (default branches only)."""
    query = f"author:{USER} author-date:>={since.date().isoformat()}"
    url = "https://api.github.com/search/commits?" + urllib.parse.urlencode({"q": query, "per_page": 100})
    lines: Counter = Counter()
    for item in request(url)["items"]:
        if len(item.get("parents", [])) > 1:
            continue  # merge commits repeat other commits' changes
        commit = request(item["url"])
        for changed in commit.get("files", []):
            language = LANGUAGES.get(PurePosixPath(changed["filename"]).suffix.lower())
            if language and 0 < changed["additions"] <= MAX_FILE_LINES:
                lines[language] += changed["additions"]
    return lines


def main() -> None:
    now = datetime.now(UTC)
    month = contributions(now - timedelta(days=30), now)
    week = contributions(now - timedelta(days=7), now)
    languages = lines_by_language(now - timedelta(days=7))

    public_repos = [
        (r["repository"]["name"], r["contributions"]["totalCount"])
        for r in month["commitContributionsByRepository"]
        if not r["repository"]["isPrivate"]
    ]
    top_repo = max(public_repos, key=lambda r: r[1], default=None)

    stats = {
        "updated": now.isoformat(timespec="seconds"),
        "commits_week": week["totalCommitContributions"],
        "commits_month": month["totalCommitContributions"],
        "top_repo_month": {"name": top_repo[0], "commits": top_repo[1]} if top_repo else None,
        "languages_week": [{"name": name, "lines": count} for name, count in languages.most_common()],
    }
    with open(sys.argv[1], "w", encoding="utf-8", newline="\n") as file:
        json.dump(stats, file, indent=2, ensure_ascii=False)
        file.write("\n")


if __name__ == "__main__":
    main()
