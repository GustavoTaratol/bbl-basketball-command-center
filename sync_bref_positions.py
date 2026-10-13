"""Build the BBL eligibility snapshot from Basketball Reference's player index."""

from csv import DictReader, DictWriter
from html import unescape
from pathlib import Path
from time import sleep
from urllib.request import Request, urlopen
import re
import unicodedata

ROOT = Path(__file__).parent
INPUTS = (ROOT / "cbs_adp_snapshot.csv", ROOT / "cbs_deep_pool_snapshot.csv")
OUTPUT = ROOT / "basketball_reference_positions.csv"
USER_AGENT = "BBL-Draft-Assistant/1.0 (personal research tool)"


def key(value):
    text = unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", text.lower())


def wanted_players():
    players = {}
    for path in INPUTS:
        with path.open(newline="", encoding="utf-8") as handle:
            for row in DictReader(handle):
                name = row.get("name")
                if name:
                    players[key(name)] = name
    return players


def parse_directory(page):
    rows = []
    pattern = re.compile(
        r'<tr[^>]*>\s*<th[^>]*data-append-csv="([^"]+)"[^>]*data-stat="player"[^>]*>'
        r'.*?<a[^>]*>(.*?)</a>.*?'
        r'<td[^>]*data-stat="year_min"[^>]*>(.*?)</td>.*?'
        r'<td[^>]*data-stat="year_max"[^>]*>(.*?)</td>.*?'
        r'<td[^>]*data-stat="pos"[^>]*>(.*?)</td>',
        re.S,
    )
    for bref_id, name, year_min, year_max, position in pattern.findall(page):
        clean = lambda value: unescape(re.sub(r"<[^>]+>", "", value)).strip()
        rows.append({
            "bref_id": bref_id,
            "name": clean(name),
            "year_min": clean(year_min),
            "year_max": clean(year_max),
            "bref_position": clean(position),
        })
    return rows


def to_platform_positions(label):
    positions = []
    for group in re.split(r"[-/]", label.upper()):
        for position in {"G": ("PG", "SG"), "F": ("SF", "PF"), "C": ("C",)}.get(group, ()):
            if position not in positions:
                positions.append(position)
    return "/".join(positions)


def main():
    wanted = wanted_players()
    matches = {}
    initials = sorted({re.sub(r"[^a-z]", "", name.split()[-1].lower())[:1] for name in wanted.values()})
    for index, initial in enumerate(initials):
        url = f"https://www.basketball-reference.com/players/{initial}/"
        request = Request(url, headers={"User-Agent": USER_AGENT})
        page = urlopen(request, timeout=30).read().decode("utf-8", "ignore")
        for row in parse_directory(page):
            player_key = key(row["name"])
            if player_key in wanted:
                previous = matches.get(player_key)
                if previous is None or int(row["year_max"] or 0) > int(previous["year_max"] or 0):
                    matches[player_key] = row
        if index + 1 < len(initials):
            sleep(0.7)

    with OUTPUT.open("w", newline="", encoding="utf-8") as handle:
        writer = DictWriter(handle, fieldnames=("name", "positions", "bref_position", "bref_id", "source_url"))
        writer.writeheader()
        for player_key, original_name in wanted.items():
            row = matches.get(player_key)
            if not row:
                continue
            writer.writerow({
                "name": original_name,
                "positions": to_platform_positions(row["bref_position"]),
                "bref_position": row["bref_position"],
                "bref_id": row["bref_id"],
                "source_url": f'https://www.basketball-reference.com/players/{row["bref_id"][0]}/{row["bref_id"]}.html',
            })
    print(f"Wrote {len(matches)} matched players to {OUTPUT}")


if __name__ == "__main__":
    main()
