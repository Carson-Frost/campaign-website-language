"""Capture every mockup state at 1440x900 and 390x844 and build the review boards.

With serve.py running, from the project root, using any Python with Playwright and Pillow:

    python design/mockups/capture.py [state-key ...]
    python design/mockups/capture.py --boards

Captures go to the ignored artifacts/mockups/captures/ and boards to artifacts/mockups/boards/.
Each capture is what a reader sees in one screen at that size, after scrolling to the part named.
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ART = Path(__file__).resolve().parents[2] / "artifacts" / "mockups"
CAP, BOARDS = ART / "captures", ART / "boards"
BASE = "http://127.0.0.1:8765/"
SIZES = {"desktop": (1440, 900), "phone": (390, 844)}

# key: (label, hash, element to scroll to or None, element to scroll to on the phone or None)
STATES = {
    "overview-top": ("Opening view", "#/", None, None),
    "overview-findings": ("Opening view: the six findings", "#/", "#f-h", "#f-h"),
    "overview-notes": ("Opening view: reading notes and distinctive words", "#/", ".notes", ".notes"),
    "method-intro": ("Process path: introduction and step list", "#/method", None, None),
    "method-ballot": ("Step 1: the ballot", "#/method/ballot", "#ballot", "#ballot"),
    "method-website": ("Step 2: the website", "#/method/website", "#website", "#website"),
    "method-saved": ("Step 3: the saved copies", "#/method/saved", "#saved", "#saved"),
    "method-text": ("Step 4: the text", "#/method/text", "#text", "#text"),
    "method-screen": ("Step 5: the screen", "#/method/screen", "#screen", "#screen"),
    "method-terms": ("Step 6: the 57 terms", "#/method/terms", "#terms", "#terms"),
    "method-shares": ("Step 7: shares and uncertainty", "#/method/shares", "#shares", "#shares"),
    "method-people": ("Checks done by people", "#/method/people", "#people", "#people"),
    "method-choices": ("Two choices tested: the 60-day window", "#/method/choices?cs=60", "#choices", "#choices"),
    "explore-none": ("Explorer: no term chosen", "#/explore", None, None),
    "explore-one": ("Explorer: one term", "#/explore?t=1", None, ".panel"),
    "explore-several": ("Explorer: several terms", "#/explore?t=6,10,13,7", None, ".panel"),
    "filter-normal": ("Filter: a normal group (House challengers)", "#/explore?t=1&o=House&i=non&panel=1", None, None),
    "filter-small": ("Filter: a very small group (Washington)", "#/explore?t=1&s=WA&panel=1", None, ".panel"),
    "filter-empty": ("Filter: an empty group (Connecticut Senate, 2024)", "#/explore?t=1&y=2024&o=Senate&s=CT&panel=1", None, ".panel"),
    "gap-large": ("A term with a large gap (climate, 2024)", "#/explore?t=51&y=2024", None, ".panel"),
    "gap-none": ("A term with no gap (abortion, 2022)", "#/explore?t=36&y=2022", None, ".panel"),
    "provisional-2026": ("2026 shown as provisional (billionaires)", "#/explore?t=10&y=2026", None, ".panel"),
    "candidate-list": ("The candidates behind a share", "#/explore?t=1&y=2024&sel=2024-D", "#clist", "#clist"),
    "candidate-excerpt": ("One candidate's excerpt", "#/explore?t=1&y=2024&sel=2024-D&c=2024-H4WA05168", "#clist", "#excerpt"),
    "coverage-top": ("Coverage by year and party", "#/coverage", None, None),
    "coverage-selection": ("How analyzed candidates differ", "#/coverage", "#sel-h", "#sel-h"),
    "related": ("Related work", "#/related", None, None),
    "data": ("Downloads and timeline", "#/data", None, None),
}

BOARD_GROUPS = {
    "1-opening": ["overview-top", "overview-findings", "overview-notes"],
    "2-path-a": ["method-intro", "method-ballot", "method-website", "method-saved"],
    "3-path-b": ["method-text", "method-screen", "method-terms", "method-shares"],
    "4-path-checks": ["method-people", "method-choices"],
    "5-explorer-terms": ["explore-none", "explore-one", "explore-several"],
    "6-explorer-filters": ["filter-normal", "filter-small", "filter-empty"],
    "7-gaps-and-2026": ["gap-large", "gap-none", "provisional-2026"],
    "8-candidates": ["candidate-list", "candidate-excerpt"],
    "9-coverage-related-data": ["coverage-top", "coverage-selection", "related", "data"],
}

TITLES = {"1-opening": "Opening view", "2-path-a": "Process path, steps 1 to 3", "3-path-b": "Process path, steps 4 to 7",
          "4-path-checks": "Process path, the checks", "5-explorer-terms": "Explorer, choosing terms",
          "6-explorer-filters": "Explorer, filters", "7-gaps-and-2026": "Explorer, gaps and 2026",
          "8-candidates": "Explorer, the candidates behind a share", "9-coverage-related-data": "Coverage, related work and downloads"}


async def capture(keys):
    from playwright.async_api import async_playwright
    CAP.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge")
        for size, (w, h) in SIZES.items():
            ctx = await browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1,
                                            is_mobile=size == "phone", has_touch=size == "phone")
            page = await ctx.new_page()
            for key in keys:
                label, hsh, scroll_d, scroll_p = STATES[key]
                await page.goto("about:blank")
                await page.goto(BASE + hsh, wait_until="networkidle")
                await page.wait_for_selector("body[data-ready='1']")
                await page.wait_for_timeout(250)
                sel = scroll_d if size == "desktop" else scroll_p
                if sel:
                    await page.evaluate("s => { const el = document.querySelector(s); if (el) el.scrollIntoView(); }", sel)
                elif "#/method/" not in hsh:
                    await page.evaluate("window.scrollTo(0, 0)")
                await page.wait_for_timeout(300)
                await page.screenshot(path=str(CAP / f"{key}-{size}.png"))
                print("captured", key, size)
            await ctx.close()
        await browser.close()


def font(size, bold=False):
    for name in (("segoeuib.ttf" if bold else "segoeui.ttf"), "arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def boards():
    BOARDS.mkdir(parents=True, exist_ok=True)
    dh = 600
    dw, pw = round(1440 * dh / 900), round(390 * dh / 844)
    pad, gap, lab = 40, 28, 44
    for name, keys in BOARD_GROUPS.items():
        W = pad * 2 + dw + gap + pw
        H = pad + 70 + len(keys) * (lab + dh + 36) + pad - 36
        board = Image.new("RGB", (W, H), "#eceae4")
        dr = ImageDraw.Draw(board)
        dr.text((pad, pad - 6), TITLES[name], fill="#1c1b19", font=font(34, True))
        dr.text((pad + dw + gap, pad + 6), "Phone, 390 x 844", fill="#55534e", font=font(18))
        dr.text((pad, pad + 40), "Desktop, 1440 x 900", fill="#55534e", font=font(18))
        y = pad + 70
        for key in keys:
            dr.text((pad, y + 6), STATES[key][0], fill="#1c1b19", font=font(24, True))
            y += lab
            for size, x, w in (("desktop", pad, dw), ("phone", pad + dw + gap, pw)):
                im = Image.open(CAP / f"{key}-{size}.png").convert("RGB").resize((w, dh), Image.LANCZOS)
                dr.rectangle([x - 1, y - 1, x + w, y + dh], outline="#c9c5bb")
                board.paste(im, (x, y))
            y += dh + 36
        board.save(BOARDS / f"{name}.png", optimize=True)
        print("board", BOARDS / f"{name}.png")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args == ["--boards"]:
        boards()
    else:
        asyncio.run(capture(args or list(STATES)))
