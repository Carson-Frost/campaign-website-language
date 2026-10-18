"""Build the PNG boards that present the four treatment specimens to the owner.

From the project root, with a Python that has Pillow, after capture_states.py:

    python design/treatments/build_specimen_boards.py

Reads the captures in the ignored artifacts/treatments/specimens/<family>/ and writes, into
artifacts/treatments/boards/:

- <family>-specimen.png: the page above the explorer (the opening and the process step) at desktop
  and phone, then the explorer with one term, a small group, an empty group and the candidates behind
  a share, each at desktop and phone.
- compare-first-screen.png: the four families' first desktop screen (1440 by 900) side by side, so the
  treatments can be compared on the same content.

Desktop captures are shown at half size and phone captures at three fifths, so both read at the same
text size on the board.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ART = Path(__file__).resolve().parents[2] / "artifacts" / "treatments"
SPEC, OUT = ART / "specimens", ART / "boards"
FONT, BOLD = "C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/segoeuib.ttf"
DESK, PHONE, GAP, PAIR, MARGIN = 0.5, 0.6, 56, 16, 48
INK, MUTED, GROUND = "#111111", "#555555", "#e9e7e2"

# family -> (title, first-screen capture, extra opening capture or None, candidate-list capture stem)
FAMILIES = {
    "1-statistical-release": ("1. Statistical Release", "1-3-opening-step-explorer-desktop.png", None,
                              "6-candidate-list-wa-2024-dem"),
    "2-annotated-paper": ("2. Annotated Paper", "1-one-term-desktop.png", None, "4-candidate-list-wa-2024-d"),
    "3-instrument": ("3. Instrument", "3-explorer-one-term-desktop.png",
                     ("The process step, opened from the pipeline", "2-step-saved-by-common-crawl"),
                     "6-candidates-wa-2024-democratic"),
    "4-front-page": ("4. Front Page", "1-one-term-desktop.png", None, "4-candidate-list"),
}
STATES = [("One term", "one-term"), ("Small group: Washington", "small-group"),
          ("Empty group: Connecticut, Senate, 2024", "empty-group")]


def fonts():
    return ImageFont.truetype(BOLD, 44), ImageFont.truetype(BOLD, 26), ImageFont.truetype(FONT, 22)


def shown(path, size, first_screen=False):
    image = Image.open(path).convert("RGB")
    if first_screen:  # a dialog is fixed to the screen, so only the first screen of its capture matters
        image = image.crop((0, 0, image.width, round(image.width * (900 / 1440 if size == "desktop" else 844 / 390))))
    native = 1440 if size == "desktop" else 390
    width = round(native * (DESK if size == "desktop" else PHONE))
    return image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)


def pair(folder, stem, states_dir=False, first_screen=False):
    base = SPEC / folder / ("states" if states_dir else "")
    return (shown(base / f"{stem}-desktop.png", "desktop", first_screen),
            shown(base / f"{stem}-phone.png", "phone", first_screen))


def family_board(folder, title, extra, cand_stem):
    head, bold, font = fonts()
    rows = [[("Opening and process step", *pair(folder, "opening", True))]]
    if extra:
        rows[0].append((extra[0], *pair(folder, extra[1], first_screen=True)))
    rows.append([(label, *pair(folder, stem, True)) for label, stem in STATES]
                + [("Candidates behind a share: Washington, 2024, Democrats", *pair(folder, cand_stem, first_screen=True))])

    def row_width(row):
        return sum(d.width + PAIR + p.width for _, d, p in row) + GAP * (len(row) - 1)

    width = MARGIN * 2 + max(row_width(r) for r in rows)
    heights = [max(max(d.height, p.height) for _, d, p in row) + 50 for row in rows]
    board = Image.new("RGB", (width, MARGIN + 80 + sum(heights) + GAP * len(rows) + MARGIN), GROUND)
    draw = ImageDraw.Draw(board)
    draw.text((MARGIN, MARGIN - 8), title, font=head, fill=INK)
    draw.text((MARGIN + draw.textlength(title, font=head) + 24, MARGIN + 10),
              "Each pair: desktop 1440 by 900 at half size, phone 390 by 844 at three fifths",
              font=font, fill=MUTED)
    y = MARGIN + 80
    for row, h in zip(rows, heights):
        x = MARGIN
        for label, d, p in row:
            draw.text((x, y), label, font=bold, fill=INK)
            board.paste(d, (x, y + 44))
            board.paste(p, (x + d.width + PAIR, y + 44))
            x += d.width + PAIR + p.width + GAP
        y += h + GAP
    board.save(OUT / f"{folder}-specimen.png", optimize=True)
    print(f"board {folder}-specimen.png {board.size}")


def compare_board():
    head, bold, _ = fonts()
    tiles = [(title, Image.open(SPEC / f / first).convert("RGB").crop((0, 0, 1440, 900)))
             for f, (title, first, _, _) in FAMILIES.items()]
    board = Image.new("RGB", (MARGIN * 2 + 2 * 1440 + GAP, MARGIN + 90 + 2 * (900 + 50) + GAP + MARGIN), GROUND)
    draw = ImageDraw.Draw(board)
    draw.text((MARGIN, MARGIN - 8), "First desktop screen, 1440 by 900, the same content in each treatment",
              font=head, fill=INK)
    for i, (title, tile) in enumerate(tiles):
        x = MARGIN + (i % 2) * (1440 + GAP)
        y = MARGIN + 90 + (i // 2) * (900 + 50 + GAP)
        draw.text((x, y), title, font=bold, fill=INK)
        board.paste(tile, (x, y + 44))
    board.save(OUT / "compare-first-screen.png", optimize=True)
    print(f"board compare-first-screen.png {board.size}")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for folder, (title, _, extra, cand) in FAMILIES.items():
        family_board(folder, title, extra, cand)
    compare_board()
