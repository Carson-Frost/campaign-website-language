"""Capture reference web pages for the public site's visual treatment research.

Usage, from the project root, with any Python that has Playwright and Pillow:

    artifacts/.venv/Scripts/python.exe design/capture_treatment_references.py [key ...]

Each page is captured at 1440x900 and 390x844: the first screen and the first 9,000 px of the page,
into the ignored artifacts/treatment-references/ directory, with the requested URL, final URL, HTTP
status, title, page height and capture time in provenance.json. Live pages change, so a recapture is
new evidence. A blocked, empty or error page is not a reference and is recorded as not studied in
design/treatments/README.md. Boards are built by build_treatment_boards.py.
"""

from __future__ import annotations

import asyncio
import datetime
import json
import sys
from pathlib import Path

ARTIFACTS = Path(__file__).resolve().parent.parent / "artifacts"
OUT = ARTIFACTS / "treatment-references"
SIZES = {"": (1440, 900), "-phone": (390, 844)}
LONG = 9000

# Chosen for the quality of their visual treatment. First captured 2026-10-09.
REFERENCES = {
    # Direct peers: elections, legislators and political text
    "campaignview": "https://campaignview.org/",
    "hilbig-websites": "https://hannohilbig.com/candidatewebsites",
    "political-pulse": "https://americaspoliticalpulse.com/",
    "manifesto-project": "https://manifesto-project.wzb.eu/",
    "comparative-agendas": "https://www.comparativeagendas.net/",
    "voteview-parties": "https://voteview.com/parties/all",
    "nyt-convention-words": "https://archive.nytimes.com/www.nytimes.com/interactive/2012/09/06/us/politics/"
    "convention-word-counts.html",
    "pew-short-read": "https://www.pewresearch.org/short-reads/2026/02/24/"
    "stark-partisan-divide-in-who-thinks-their-side-is-winning-and-losing-in-politics/",
    "tvnews-stanford": "https://tvnews.stanford.edu/",
    # Adjacent: data journalism, statistical agencies, academic project sites
    "ons-labour-market": "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/"
    "employmentandemployeetypes/bulletins/uklabourmarket/latest",
    "census-pulse": "https://www.census.gov/data/experimental-data-products/household-pulse-survey.html",
    "owid-grapher": "https://ourworldindata.org/grapher/share-of-population-in-extreme-poverty",
    "open-policing": "https://openpolicing.stanford.edu/findings/",
    "eviction-lab": "https://evictionlab.org/eviction-tracking/",
    "markup-method": "https://themarkup.org/show-your-work/2023/10/02/"
    "how-we-assessed-the-accuracy-of-predictive-policing-software",
    "distill-momentum": "https://distill.pub/2017/momentum/",
    "pudding-film-dialogue": "https://pudding.cool/2017/03/film-dialogue/",
    "reuters-graphics": "https://www.reuters.com/graphics/",
    "datawrapper-intervals": "https://www.datawrapper.de/blog/confidence-intervals-value-markers-bar-charts/",
    "urban-styleguide": "https://urbaninstitute.github.io/graphics-styleguide/",
    # Exceptional interfaces elsewhere: typography, tools, documentation
    "practical-typography": "https://practicaltypography.com/",
    "tufte-css": "https://edwardtufte.github.io/tufte-css/",
    "gwern": "https://gwern.net/",
    "govuk-search-filters": "https://www.gov.uk/search/research-and-statistics",
    "govuk-checkboxes": "https://design-system.service.gov.uk/components/checkboxes/",
    "observable-plot-dot": "https://observablehq.com/plot/marks/dot",
    "stripe-docs": "https://docs.stripe.com/payments",
    "fathom": "https://fathom.info/",
    # Counterexamples
    "ballotpedia-race": "https://ballotpedia.org/Washington%27s_5th_Congressional_District_election,_2024",
    "google-trends": "https://trends.google.com/trends/explore?geo=US&q=inflation,abortion",
    "fec-candidates": "https://www.fec.gov/data/candidates/house/?election_year=2024",
    "270towin": "https://www.270towin.com/2024-house-election/",
    # Second batch: deeper pages where a home page showed too little, and a replacement for a blocked page
    "practical-typography-numbers": "https://practicaltypography.com/grids-of-numbers.html",
    "gwern-design": "https://gwern.net/design",
    "political-pulse-elites": "https://americaspoliticalpulse.com/elites",
    "ft-visual-vocabulary": "https://ft-interactive.github.io/visual-vocabulary/",
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
                context = await browser.new_context(viewport={"width": width, "height": height},
                                                    ignore_https_errors=key in INSECURE,
                                                    device_scale_factor=1)
                page = await context.new_page()
                try:
                    response = await page.goto(url, wait_until="load", timeout=90000)
                    await page.wait_for_timeout(7000)
                    await page.keyboard.press("Escape")  # closes newsletter and cookie dialogs that cover the page
                    for _ in range(14):
                        await page.mouse.wheel(0, 700)
                        await page.wait_for_timeout(250)
                    await page.evaluate("window.scrollTo(0, 0)")
                    await page.wait_for_timeout(1000)
                    await page.screenshot(path=str(OUT / f"{name}.png"))
                    full = await page.evaluate("document.documentElement.scrollHeight")
                    clip = {"x": 0, "y": 0, "width": width, "height": min(full, LONG)}
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
                    records[name] = {"requested": url, "error": str(error)[:200],
                                     "captured": datetime.datetime.now().isoformat(timespec="seconds")}
                    print(f"failed {name}: {str(error)[:150]}", flush=True)
                finally:
                    await context.close()
                record_path.write_text(json.dumps(records, indent=2))
                await asyncio.sleep(2)
        await browser.close()


def main() -> None:
    keys = sys.argv[1:] or list(REFERENCES)
    asyncio.run(capture([(key, REFERENCES[key]) for key in keys]))


if __name__ == "__main__":
    main()
