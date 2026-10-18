"""Capture reference web pages for the public site's design research.

Usage, from the project root, with any Python that has Playwright and Pillow:

    artifacts/.venv/Scripts/python.exe design/capture_references.py [key ...]
    artifacts/.venv/Scripts/python.exe design/capture_references.py --boards

Each page is captured at 1440x900 and 390x844: the first screen and the first 7,000 px of the page,
into the ignored artifacts/references/ directory, with the requested URL, final URL, HTTP status,
title, page height and capture time in provenance.json. `--boards` builds one PNG board per
reference (desktop first screen and a deeper desktop strip, phone first screen and a deeper phone
strip) in artifacts/references/boards/. Live pages change, so a recapture is new evidence. A
blocked, empty or error page is not a reference and is recorded as not studied.
"""

from __future__ import annotations

import asyncio
import datetime
import json
import sys
from pathlib import Path

ARTIFACTS = Path(__file__).resolve().parent.parent / "artifacts"
OUT = ARTIFACTS / "references"
SIZES = {"": (1440, 900), "-phone": (390, 844)}
WAYBACK = "https://web.archive.org/web/"

# First captured 2026-10-09.
REFERENCES = {
    # Direct peers: candidate and legislator language, campaign data
    "hilbig-websites": "https://hannohilbig.com/candidatewebsites",
    "campaignview": "https://campaignview.org/",
    "political-pulse": "https://americaspoliticalpulse.com/",
    "political-pulse-2026": "https://americaspoliticalpulse.com/primary",
    "political-pulse-elites": "https://americaspoliticalpulse.com/elites",
    "campaignview-explore": "https://campaignview.org/explore",
    "wesleyan-media": "https://mediaproject.wesleyan.edu/",
    "capitol-words": WAYBACK + "20170601000000/http://capitolwords.org/",
    "nyt-convention-words": "https://archive.nytimes.com/www.nytimes.com/interactive/2012/09/06/us/politics/"
    "convention-word-counts.html",
    "pew-partisan-conflict": "https://www.pewresearch.org/politics/2017/02/23/partisan-conflict-and-congressional-outreach/",
    "loc-elections-archive": "https://www.loc.gov/collections/united-states-elections-web-archive/",
    "voteview": "https://voteview.com/congress/house",
    # Language over time and term explorers
    "ngram": "https://books.google.com/ngrams/graph?content=working+families%2Cmiddle+class&year_start=1960"
    "&year_end=2022&corpus=en&smoothing=3",
    "tvnews-stanford": "https://tvnews.stanford.edu/",
    "trump-archive": "https://www.thetrumparchive.com/",
    "pudding-film-dialogue": "https://pudding.cool/2017/03/film-dialogue/",
    "pudding-vocabulary": "https://pudding.cool/projects/vocabulary/",
    # Data explorers with filters
    "owid-grapher": "https://ourworldindata.org/grapher/life-expectancy",
    "owid-explorer": "https://ourworldindata.org/explorers/co2",
    "datausa": "https://datausa.io/profile/geo/spokane-wa",
    "propublica-nonprofits": "https://projects.propublica.org/nonprofits/",
    # Method written for readers, process shown step by step
    "markup-facebook-method": "https://themarkup.org/show-your-work/2021/11/18/"
    "how-we-investigated-facebooks-most-popular-content",
    "markup-internet-method": "https://themarkup.org/show-your-work/2022/10/19/"
    "how-we-uncovered-disparities-in-internet-deals",
    "538-checking": WAYBACK + "20230215000000/https://projects.fivethirtyeight.com/checking-our-work/",
    "distill-tsne": "https://distill.pub/2016/misread-tsne/",
    "pudding-methods-example": "https://pudding.cool/2018/08/wiki-death/",
    "upshot-how-we": "https://www.nytimes.com/interactive/2020/upshot/up-election-needle-methodology.html",
    # Counterexamples
    "fec-candidates": "https://www.fec.gov/data/candidates/house/?election_year=2024",
    "ballotpedia-race": "https://ballotpedia.org/Washington%27s_5th_Congressional_District_election,_2024",
    "google-trends": "https://trends.google.com/trends/explore?geo=US&q=inflation,abortion",
    "census-cd": "https://www.census.gov/mycd/",
    # Second batch, replacing pages that refused automated access
    "opensecrets-race": "https://www.opensecrets.org/races/summary?cycle=2024&id=WA05",
    "mit-election-lab": "https://electionlab.mit.edu/data",
}
# Pages whose certificate had lapsed when captured; loaded with certificate errors ignored.
INSECURE = {"tvnews-stanford"}


async def capture(pairs: list[tuple[str, str]]) -> None:
    from playwright.async_api import async_playwright

    OUT.mkdir(parents=True, exist_ok=True)
    record_path = OUT / "provenance.json"
    records = json.loads(record_path.read_text()) if record_path.exists() else {}
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        for key, url in pairs:
            for suffix, (width, height) in SIZES.items():
                name = f"{key}{suffix}"
                page = await browser.new_page(viewport={"width": width, "height": height},
                                              ignore_https_errors=key in INSECURE)
                try:
                    response = await page.goto(url, wait_until="load", timeout=90000)
                    await page.wait_for_timeout(7000)
                    await page.keyboard.press("Escape")  # closes newsletter and cookie dialogs that cover the page
                    for _ in range(10):
                        await page.mouse.wheel(0, 700)
                        await page.wait_for_timeout(250)
                    await page.evaluate("window.scrollTo(0, 0)")
                    await page.wait_for_timeout(1000)
                    await page.screenshot(path=str(OUT / f"{name}.png"))
                    full = await page.evaluate("document.documentElement.scrollHeight")
                    clip = {"x": 0, "y": 0, "width": width, "height": min(full, 7000)}
                    await page.screenshot(path=str(OUT / f"{name}-long.png"), full_page=True, clip=clip)
                    records[name] = {
                        "requested": url,
                        "final": page.url,
                        "status": response.status if response else None,
                        "title": await page.title(),
                        "page_height": full,
                        "captured": datetime.datetime.now().isoformat(timespec="seconds"),
                    }
                    print(f"captured {name} ({full} px, status {records[name]['status']})", flush=True)
                except Exception as error:  # noqa: BLE001 - record and continue with the next page
                    records[name] = {"requested": url, "error": str(error)[:200]}
                    print(f"failed {name}: {str(error)[:150]}", flush=True)
                finally:
                    await page.close()
                record_path.write_text(json.dumps(records, indent=2))
                await asyncio.sleep(3)
        await browser.close()


# Deeper strip offsets (desktop, phone) in capture pixels, chosen after looking at each long capture.
STRIPS: dict[str, tuple[int, int]] = {}
FONT = "C:/Windows/Fonts/segoeui.ttf"
BOLD = "C:/Windows/Fonts/segoeuib.ttf"


def boards() -> None:
    from PIL import Image, ImageDraw, ImageFont

    out = OUT / "boards"
    out.mkdir(parents=True, exist_ok=True)
    records = json.loads((OUT / "provenance.json").read_text())
    font, bold = ImageFont.truetype(FONT, 22), ImageFont.truetype(BOLD, 28)
    for key in REFERENCES:
        desk, phone = OUT / f"{key}-long.png", OUT / f"{key}-phone-long.png"
        if not desk.exists() or not phone.exists():
            continue
        d_top, p_top = STRIPS.get(key, (1800, 2200))
        d_img, p_img = Image.open(desk).convert("RGB"), Image.open(phone).convert("RGB")

        def cut(image, top, width, height):
            top = max(0, min(top, max(0, image.height - height)))
            return image.crop((0, top, width, min(image.height, top + height)))

        tiles = [cut(d_img, 0, 1440, 900), cut(d_img, d_top, 1440, 900)]
        phones = [cut(p_img, 0, 390, 844), cut(p_img, p_top, 390, 844)]
        width = 1440 + 40 + 390 * 2 + 40 + 80
        board = Image.new("RGB", (width, 110 + 900 * 2 + 40), "white")
        draw = ImageDraw.Draw(board)
        rec = records.get(key, {})
        draw.text((40, 24), key, font=bold, fill="black")
        draw.text((40, 62), f"{rec.get('final', REFERENCES[key])}   captured {rec.get('captured', '?')}",
                  font=font, fill="#555")
        board.paste(tiles[0], (40, 110))
        board.paste(tiles[1], (40, 110 + 900 + 20))
        board.paste(phones[0], (40 + 1440 + 40, 110))
        board.paste(phones[1], (40 + 1440 + 40 + 390 + 20, 110))
        board.save(out / f"{key}.png")
        print(f"board {key}")


def main() -> None:
    args = sys.argv[1:]
    if args == ["--boards"]:
        boards()
        return
    keys = args or list(REFERENCES)
    asyncio.run(capture([(key, REFERENCES[key]) for key in keys]))


if __name__ == "__main__":
    main()
