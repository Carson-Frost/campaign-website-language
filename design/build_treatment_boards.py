"""Build one reference board per visual treatment family.

Usage, from the project root, after capture_treatment_references.py has run:

    artifacts/.venv/Scripts/python.exe design/build_treatment_boards.py

Each board shows crops from the captures in artifacts/treatment-references/ that a family in
design/treatments/README.md draws on. Every crop is labelled with its source page, the capture date
from provenance.json and what the family takes from it. Crop boxes are in capture pixels of the
long captures (1440 px wide desktop, 390 px wide phone), chosen after looking at each capture.
Boards are written to artifacts/treatments/boards/<n>-<slug>-references.png.
"""

from __future__ import annotations

import json
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ARTIFACTS = Path(__file__).resolve().parent.parent / "artifacts"
SRC = ARTIFACTS / "treatment-references"
OUT = ARTIFACTS / "treatments" / "boards"
FONT = "C:/Windows/Fonts/segoeui.ttf"
BOLD = "C:/Windows/Fonts/segoeuib.ttf"
WIDTH, MARGIN, GAP = 2400, 48, 36

# (key, "d" desktop or "p" phone, x, y, w, h, display width, what the family takes from it)
Crop = tuple[str, str, int, int, int, int, int, str]

FAMILIES: list[tuple[str, str, list[Crop]]] = [
    ("statistical-release", "Statistical Release", [
        ("ons-labour-market", "d", 240, 5400, 960, 700, 1100,
         "Each figure sits on one row with its period, read across from label to value. "
         "Takes: one figure per row. Not taken: the status pills and repeated quality disclosures."),
        ("census-pulse", "d", 0, 150, 1000, 650, 740,
         "A product-wide 'Experimental data' mark beside the title. "
         "Takes: one statement that marks the whole body of results as exploratory."),
        ("govuk-checkboxes", "d", 440, 4700, 840, 600, 740,
         "Large square checkboxes with a 2 px border and an explicit 'or' option. "
         "Takes: control size, hint text and the wording of empty choices."),
        ("govuk-search-filters", "d", 230, 530, 1000, 770, 740,
         "Filters in a left column under disclosures, the result count set above the results. "
         "Takes: the filter column and the always-visible group count."),
        ("fec-candidates", "d", 0, 200, 700, 480, 740,
         "Filter panel beside a count of matching records. "
         "Takes: the group size stated once above the list. Not taken: the boxed panel and note."),
        ("datawrapper-intervals", "d", 380, 880, 700, 260, 740,
         "Interval drawn as a hatched overlay and named once on the chart. "
         "Takes: labelling the interval in words on the chart itself."),
        ("urban-styleguide", "d", 230, 2620, 1080, 560, 1100,
         "A written type scale for chart title, subtitle, axis, data labels, source and notes. "
         "Takes: fixed chart text sizes that every chart obeys."),
        ("owid-grapher", "d", 60, 3050, 1300, 600, 1100,
         "Downloads described in plain words, one row per file. Takes: the downloads section."),
        ("govuk-search-filters", "p", 0, 440, 390, 404, 390,
         "Phone: the whole filter column folds into one Filter disclosure above the result count. Takes: the phone filter pattern."),
    ]),
    ("annotated-paper", "Annotated Paper", [
        ("tufte-css", "d", 80, 5650, 1200, 900, 1100,
         "A figure kept in the text column with its caption in the wide right margin. "
         "Takes: a right margin, used here for each step's rule, source and standard."),
        ("practical-typography-numbers", "d", 220, 60, 1000, 700, 1100,
         "Section heading hung in the left margin, small-caps run-in heads, a gray margin note. "
         "Takes: the three-column page and the run-in heads."),
        ("practical-typography-numbers", "d", 500, 2480, 680, 260, 740,
         "Figures aligned by meaning, hairline rows, no fills. Takes: the setting of count tables."),
        ("gwern-design", "d", 270, 100, 900, 280, 740,
         "A status line under the title: dates, 'finished', 'certainty: highly likely'. "
         "Takes: an epistemic status line for exploratory findings and the 2026 snapshot."),
        ("distill-momentum", "d", 150, 130, 1150, 660, 740,
         "Centered title, a figure with labels set on it, controls and caption under it, then a ruled byline grid. "
         "Takes: the byline (author, Gonzaga, date) and controls set under a figure."),
        ("markup-method", "d", 400, 4380, 800, 500, 740,
         "A real document shown inside a labelled frame. "
         "Takes: the exhibit frame for an example site, labelled as one of thousands."),
        ("hilbig-websites", "d", 300, 4870, 840, 580, 740,
         "Dumbbell with party names set once on the first row, caption below. "
         "Takes: direct party labels and plain captions."),
        ("hilbig-websites", "d", 300, 0, 840, 900, 740,
         "A peer dataset site: one column, hairline section rules, short plain sections. "
         "Takes: the restraint expected of a research site (and shows the system-font default to avoid)."),
        ("practical-typography-numbers", "p", 0, 0, 390, 844, 390,
         "Phone: the margin heading moves above the text and the margin note becomes a boxed inline note. Takes: how margin notes collapse."),
    ]),
    ("instrument", "Instrument", [
        ("tvnews-stanford", "d", 150, 60, 1140, 640, 1100,
         "One query row per term with its color swatch, a date range and a single chart. "
         "Takes: the term picker as rows of tokens."),
        ("owid-grapher", "d", 30, 60, 1330, 680, 1100,
         "Chart with Table / Map / Line tabs and an entity list whose values are drawn as bars behind each row. "
         "Takes: counts inside filter options and the table tab."),
        ("fec-candidates", "d", 300, 210, 1140, 520, 1100,
         "Dense sortable table, right-aligned figures, count chip. Takes: the candidate list behind a share."),
        ("political-pulse-elites", "d", 100, 1150, 1260, 420, 1100,
         "Ranking with the number of statements under each name and a note on small-sample adjustment. "
         "Takes: n set beside every row (party shown as colored word plus text)."),
        ("observable-plot-dot", "d", 330, 7640, 800, 150, 740,
         "Default mark symbols for categories. Takes: a distinct shape for each party."),
        ("datawrapper-intervals", "d", 380, 2050, 700, 400, 740,
         "A gray full-scale track behind each bar with value markers for earlier results. "
         "Takes: the 0-100 percent track behind every share."),
        ("stripe-docs", "d", 300, 620, 800, 240, 740,
         "Left navigation, underlined tabs and 1 px bordered cards. "
         "Takes: underlined tabs only. Not taken: the bordered cards."),
        ("fec-candidates", "p", 0, 0, 390, 844, 390,
         "Phone: filters become an Edit filters bar, the count stays on top, the table keeps one column. Takes: the phone explorer header."),
    ]),
    ("front-page", "Front Page", [
        ("nyt-convention-words", "d", 180, 300, 1000, 600, 1100,
         "Each word a circle split by party, with an input to add any word. "
         "Takes: the party split as the primary mark and the add-a-term control."),
        ("nyt-convention-words", "d", 240, 1020, 700, 520, 740,
         "Excerpts with the matched words highlighted in the party's tint, speaker in small caps. "
         "Takes: the excerpt treatment."),
        ("datawrapper-intervals", "d", 380, 3080, 700, 420, 740,
         "Hatched minimum-maximum range, solid inner range and a median tick. "
         "Takes: the possible-range band drawn behind the interval."),
        ("pew-short-read", "d", 100, 1515, 600, 370, 740,
         "Chart title, italic subtitle, labelled period bands, party names as panel heads. "
         "Takes: the title stack and a labelled band for 2026."),
        ("pudding-film-dialogue", "d", 250, 200, 900, 600, 740,
         "A very large display headline and a light subtitle. Takes: the scale of the opening."),
        ("open-policing", "d", 230, 1150, 1000, 600, 740,
         "Prose beside its chart, filter chips above the chart. "
         "Takes: filters set directly above the chart they change. Not taken: the colored chips."),
        ("voteview-parties", "d", 140, 230, 1100, 450, 740,
         "Party lines drawn over the faint cloud of individual members. "
         "Takes: showing the candidates behind a share."),
        ("pudding-film-dialogue", "p", 0, 0, 390, 430, 390,
         "Phone: the display headline holds its scale at 390 px. Takes: the phone opening."),
    ]),
]


def load(key: str, variant: str) -> Image.Image:
    name = f"{key}-long.png" if variant == "d" else f"{key}-phone-long.png"
    return Image.open(SRC / name).convert("RGB")


def build(number: int, slug: str, title: str, crops: list[Crop], records: dict) -> Path:
    font, small, bold, head = (ImageFont.truetype(FONT, 22), ImageFont.truetype(FONT, 19),
                               ImageFont.truetype(BOLD, 22), ImageFont.truetype(BOLD, 40))
    tiles = []
    for key, variant, x, y, w, h, display, note in crops:
        image = load(key, variant).crop((x, y, x + w, y + h))
        scale = display / w
        image = image.resize((display, round(h * scale)), Image.LANCZOS)
        record = records.get(key if variant == "d" else f"{key}-phone", {})
        where = "desktop 1440 px" if variant == "d" else "phone 390 px"
        source = f"{key} ({where}), captured {record.get('captured', '?')[:10]}"
        url = record.get("final", "")
        chars = max(30, int(display / 10.5))
        lines = [(source, bold)] + [(line, small) for line in textwrap.wrap(url, chars + 8)]
        lines += [(line, font) for line in textwrap.wrap(note, chars)]
        tiles.append((image, lines))

    # Shelf layout: tiles left to right, wrapping into rows.
    rows, row, used = [], [], MARGIN
    for tile in tiles:
        if row and used + tile[0].width > WIDTH - MARGIN:
            rows.append(row)
            row, used = [], MARGIN
        row.append(tile)
        used += tile[0].width + GAP
    rows.append(row)

    def caption_height(lines):
        return len(lines) * 30 + 12

    heights = [max(t[0].height + 16 + caption_height(t[1]) for t in r) for r in rows]
    board = Image.new("RGB", (WIDTH, 150 + sum(h + GAP for h in heights) + MARGIN), "#f2f2f0")
    draw = ImageDraw.Draw(board)
    draw.text((MARGIN, 36), f"{number}. {title}", font=head, fill="#111")
    draw.text((MARGIN, 92), "Reference crops from captured live pages. Each label names the source and "
              "what this family takes from it.", font=font, fill="#555")
    top = 150
    for r, height in zip(rows, heights):
        left = MARGIN
        for image, lines in r:
            board.paste(image, (left, top))
            draw.rectangle((left - 1, top - 1, left + image.width, top + image.height), outline="#999")
            ty = top + image.height + 16
            for text, f in lines:
                draw.text((left, ty), text, font=f, fill="#111" if f is not small else "#666")
                ty += 30
            left += image.width + GAP
        top += height + GAP
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{number}-{slug}-references.png"
    board.save(path)
    return path


def main() -> None:
    records = json.loads((SRC / "provenance.json").read_text())
    for number, (slug, title, crops) in enumerate(FAMILIES, start=1):
        print(build(number, slug, title, crops, records))


if __name__ == "__main__":
    main()
