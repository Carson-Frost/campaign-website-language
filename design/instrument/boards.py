"""Build the two review boards from the captures, into the ignored artifacts/instrument/boards/.

    artifacts/.venv/Scripts/python.exe design/instrument/boards.py

pew-comparison.png puts three Pew Research Center charts (artifacts/pew/charts/) beside this site's charts
(artifacts/instrument/captures/). phone-states.png lays six phone captures side by side. Run capture.py first.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2] / "artifacts"
CAP = ROOT / "instrument" / "captures"
PEW = ROOT / "pew" / "charts"
OUT = ROOT / "instrument" / "boards"
FONT = "C:/Windows/Fonts/arial.ttf"
BOLD = "C:/Windows/Fonts/arialbd.ttf"


def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)


def fit(im, width):
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


def crop(path, box, width):
    return fit(Image.open(path).convert("RGB").crop(box), width)


def pew_comparison():
    colw, gap, pad = 790, 40, 24
    rows = [
        ("Pew Research Center, “Republicans see more discrimination than Democrats…” (May 20, 2025)",
         crop(PEW / "PP_2025.5.20_discrimination_00-02.png", (0, 0, 1280, 640), colw),
         "This site: the ranked table, 2024",
         crop(CAP / "table-desktop.png", (170, 70, 1270, 878), colw)),
        ("Pew Research Center, “Americans see Republicans growing more comfortable…” (May 30, 2025)",
         crop(PEW / "SR_25.05.30_rep-dem-comfort_2.png", (0, 0, 620, 718), colw),
         "This site: one word across cycles",
         crop(CAP / "term-desktop-full.png", (170, 60, 1270, 1120), colw)),
        ("Pew Research Center, “Republican Party’s advantage on crime grows…” (Oct. 30, 2025)",
         crop(PEW / "PP_2025.10.29_views-of-republican-democratic-parties_2-03.png", (0, 0, 840, 992), colw),
         "This site: several words side by side",
         crop(CAP / "terms-desktop-full.png", (170, 60, 1270, 840), colw)),
    ]
    head = 56
    heights = [58 + max(r[1].height, r[3].height) + 28 for r in rows]
    board = Image.new("RGB", (2 * colw + gap + 2 * pad, head + sum(heights)), "white")
    d = ImageDraw.Draw(board)
    d.text((pad, 18), "Pew Research Center charts (left) and this site's charts (right). The conventions are borrowed; the charts are not copies.", font=font(22, True), fill="#111")
    y = head
    for (lt, li, rt, ri), h in zip(rows, heights):
        d.text((pad, y + 6), lt, font=font(17, True), fill="#333")
        d.text((pad + colw + gap, y + 6), rt, font=font(17, True), fill="#333")
        board.paste(li, (pad, y + 38))
        board.paste(ri, (pad + colw + gap, y + 38))
        y += h
        d.line([(pad, y - 14), (board.width - pad, y - 14)], fill="#ccc", width=1)
    OUT.mkdir(parents=True, exist_ok=True)
    board.save(OUT / "pew-comparison.png")
    return board.size


def phone_states():
    panels = [
        ("Ranked table, 2024", "table-phone.png"),
        ("One word across cycles", "term-phone.png"),
        ("Several words side by side", "terms-phone.png"),
        ("Filters sheet", "filters-phone.png"),
        ("Candidate drawer, a name low in the list", "panel-excerpt-low-phone.png"),
        ("Method: does the window matter?", "tab-method-window-phone.png"),
    ]
    w, h, gap, pad = 390, 844, 28, 24
    board = Image.new("RGB", (len(panels) * w + (len(panels) - 1) * gap + 2 * pad, 56 + h + 60), "white")
    d = ImageDraw.Draw(board)
    d.text((pad, 16), "This site on a phone (390 by 844), current captures", font=font(22, True), fill="#111")
    for i, (label, name) in enumerate(panels):
        x = pad + i * (w + gap)
        board.paste(Image.open(CAP / name).convert("RGB"), (x, 56))
        d.rectangle([x - 1, 55, x + w, 56 + h], outline="#999")
        d.text((x, 56 + h + 14), label, font=font(18), fill="#222")
    board.save(OUT / "phone-states.png")
    return board.size


if __name__ == "__main__":
    print("pew-comparison.png", pew_comparison())
    print("phone-states.png", phone_states())
