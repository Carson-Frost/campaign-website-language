"""Cut reference crops and build one PNG board per direction family for the design record.

Usage, from the project root, with the project's Python (Pillow):

    artifacts/.venv/Scripts/python.exe design/direction_boards.py

Crops come from the captures in artifacts/references/ (see capture_references.py) and go to
artifacts/directions/crops/; boards go to artifacts/directions/. Live pages change, so after a
recapture every crop box must be checked against its capture again.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ARTIFACTS = Path(__file__).resolve().parent.parent / "artifacts"
REFS = ARTIFACTS / "references"
OUT = ARTIFACTS / "directions"
FONT = "C:/Windows/Fonts/segoeui.ttf"
BOLD = "C:/Windows/Fonts/segoeuib.ttf"

# name: (capture file, (left, top, right, bottom) in capture pixels, caption)
CROPS = {
    "hilbig-coverage": ("hilbig-websites-long.png", (340, 1110, 1100, 1660),
                        "Hilbig: coverage against the ballot, source change shaded"),
    "hilbig-dumbbell": ("hilbig-websites-long.png", (340, 4880, 1100, 5420),
                        "Hilbig: each party's topic share as a dot pair"),
    "pew-rail": ("pew-partisan-conflict.png", (100, 320, 1330, 690),
                 "Pew: methodological note up top, materials and contents rail"),
    "markup-rail": ("markup-facebook-method-long.png", (140, 1040, 1040, 1560),
                    "The Markup: method prose with a data and code rail"),
    "538-worked": ("538-checking-long.png", (370, 1600, 1080, 2180),
                   "FiveThirtyEight: the method taught on one real case"),
    "distill-controls": ("distill-tsne.png", (220, 390, 1220, 900),
                         "Distill: the reader changes the method's settings"),
    "pudding-scrolly": ("pudding-methods-example.png", (0, 440, 1440, 900),
                        "Pudding: text steps over a pinned chart"),
    "owid-grapher": ("owid-grapher.png", (80, 95, 1360, 760),
                     "Our World in Data: chart with a searchable selection list"),
    "owid-explorer": ("owid-explorer.png", (110, 88, 1330, 700),
                      "Our World in Data: labelled settings bar over the chart"),
    "pudding-film-explorer": ("pudding-film-dialogue-long.png", (300, 4730, 1260, 5420),
                              "Pudding: groups, then matching films, then one film"),
    "fec-table": ("fec-candidates.png", (0, 214, 1440, 900),
                  "FEC: filter panel, result count and sortable table"),
    "tvnews-query": ("tvnews-stanford.png", (150, 60, 1290, 720),
                     "Stanford TV News Analyzer: one coloured row per query"),
    "ngram": ("ngram.png", (130, 60, 1380, 640), "Ngram Viewer: terms typed in, lines labelled at the end"),
    "nyt-bubbles": ("nyt-convention-words.png", (240, 320, 1200, 900),
                    "New York Times 2012: words placed by which party used them more"),
    "nyt-excerpts": ("nyt-convention-words-long.png", (240, 1020, 1200, 1700),
                     "New York Times 2012: excerpts side by side, words highlighted"),
    "capitol-compare": ("capitol-words.png", (250, 450, 1200, 700),
                        "Capitol Words: compare two words, each split by party"),
    "pudding-vocab-swarm": ("pudding-vocabulary-long.png", (40, 870, 1340, 1580),
                            "Pudding: every artist as one mark on one axis"),
    "voteview": ("voteview.png", (140, 200, 1300, 900), "Voteview: every member as a dot, roster below"),
    "pp-2026": ("political-pulse-2026.png", (20, 255, 1420, 900),
                "Polarization Research Lab: find your races, then lists by lean"),
    "pp-ranking": ("political-pulse-elites-long.png", (100, 1722, 1340, 2240),
                   "Polarization Research Lab: individuals ranked by a score (counterexample)"),
    "propublica-search": ("propublica-nonprofits.png", (360, 130, 1080, 610),
                          "ProPublica: search-first entry with examples"),
    "datausa-profile": ("datausa.png", (0, 0, 1440, 740), "Data USA: place profile over a photo"),
}

DIRECTIONS = {
    "1-report": ("1. The report",
                 "One long page read top to bottom: summary, the steps, the results, then the explorer and the data.",
                 ["pew-rail", "hilbig-coverage", "hilbig-dumbbell", "markup-rail"]),
    "2-explorer": ("2. The explorer",
                   "Opens on the data tool: settings bar, party shares with ranges, the candidates behind them.",
                   ["owid-explorer", "pudding-film-explorer", "owid-grapher", "fec-table"]),
    "3-path": ("3. Follow one site",
               "The study told as the path of one real campaign site through every step, with the counts at each step.",
               ["538-worked", "distill-controls", "pudding-scrolly", "hilbig-coverage"]),
    "4-field": ("4. The word field",
                "One signature graphic: all 57 terms placed between the parties, moving by year; select a term to open it.",
                ["nyt-bubbles", "nyt-excerpts", "pudding-vocab-swarm", "capitol-compare"]),
    "5-local": ("5. Look up a race",
                "Starts from a place: pick a state or district and see its candidates' words beside the national picture.",
                ["pp-2026", "propublica-search", "datausa-profile", "pp-ranking"]),
}


def cut() -> dict[str, Image.Image]:
    (OUT / "crops").mkdir(parents=True, exist_ok=True)
    images = {}
    for name, (source, box, _) in CROPS.items():
        image = Image.open(REFS / source).convert("RGB")
        left, top, right, bottom = box
        crop = image.crop((left, top, min(right, image.width), min(bottom, image.height)))
        crop.save(OUT / "crops" / f"{name}.png")
        images[name] = crop
    return images


def board(key: str, images: dict[str, Image.Image]) -> None:
    title, lead, names = DIRECTIONS[key]
    cell_w, cell_h, pad, head = 1100, 640, 40, 170
    width = pad + 2 * (cell_w + pad)
    height = head + 2 * (cell_h + 60 + pad)
    canvas = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(canvas)
    draw.text((pad, 36), title, font=ImageFont.truetype(BOLD, 52), fill="black")
    draw.text((pad, 110), lead, font=ImageFont.truetype(FONT, 30), fill="#333")
    caption = ImageFont.truetype(FONT, 26)
    for i, name in enumerate(names):
        image = images[name].copy()
        image.thumbnail((cell_w, cell_h))
        x = pad + (i % 2) * (cell_w + pad)
        y = head + (i // 2) * (cell_h + 60 + pad)
        canvas.paste(image, (x, y))
        draw.rectangle((x, y, x + image.width - 1, y + image.height - 1), outline="#ccc")
        draw.text((x, y + image.height + 12), CROPS[name][2], font=caption, fill="#555")
    canvas.save(OUT / f"{key}.png")
    print(f"board {key}")


def main() -> None:
    images = cut()
    for key in DIRECTIONS:
        board(key, images)
    (OUT / "crops.json").write_text(json.dumps({k: [v[0], v[1]] for k, v in CROPS.items()}, indent=1))


if __name__ == "__main__":
    main()
