"""Capture each specimen's explorer states from the explorer down, for the presentation boards.

From the project root, with the server running (design/mockups/serve.py --detach) and a Python
that has Playwright:

    artifacts/.venv/Scripts/python.exe design/treatments/capture_states.py

For every family and state it loads the page at 1440 by 900 and 390 by 844 and captures a strip that
starts at the top of the explorer section (1440 by 1100 and 390 by 1500), and for the one-term state
also the page above the explorer (the opening and the process step), into
artifacts/treatments/specimens/<family>/states/<state>-<size>.png and opening-<size>.png. The specimens' own full-page and
dialog captures stay where their builders put them.
"""
import asyncio
from pathlib import Path

ROOT = "http://127.0.0.1:8765/treatments/"
OUT = Path(__file__).resolve().parents[2] / "artifacts" / "treatments" / "specimens"
SIZES = {"desktop": (1440, 900, 1100), "phone": (390, 844, 1500)}

# family -> (explorer selector, {state: address relative to the family folder})
FAMILIES = {
    "1-statistical-release": ("#explorer", {
        "one-term": "#explorer",
        "small-group": "?state=WA#explorer",
        "empty-group": "?year=2024&office=Senate&state=CT#explorer"}),
    "2-annotated-paper": ("#explorer", {
        "one-term": "",
        "small-group": "#state=WA",
        "empty-group": "#office=Senate&state=CT&year=2024"}),
    "3-instrument": ("#explorer", {
        "one-term": "?term=working-families",
        "small-group": "?term=working-families&state=WA",
        "empty-group": "?term=working-families&year=2024&office=Senate&state=CT"}),
    "4-front-page": ("#explore", {
        "one-term": "",
        "small-group": "?state=WA#explore",
        "empty-group": "?year=2024&office=Senate&state=CT#explore"}),
}


async def main():
    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for family, (selector, states) in FAMILIES.items():
            (OUT / family / "states").mkdir(parents=True, exist_ok=True)
            for state, address in states.items():
                for size, (width, height, strip) in SIZES.items():
                    page = await browser.new_page(viewport={"width": width, "height": height})
                    await page.goto(ROOT + family + "/" + address, wait_until="networkidle")
                    await page.wait_for_timeout(1500)
                    top = await page.evaluate(
                        f"document.querySelector('{selector}').getBoundingClientRect().top + scrollY")
                    full = await page.evaluate("document.documentElement.scrollHeight")
                    if state == "one-term":
                        await page.screenshot(path=str(OUT / family / "states" / f"opening-{size}.png"),
                                              full_page=True,
                                              clip={"x": 0, "y": 0, "width": width, "height": max(height, top)})
                    top = max(0, top - 24)
                    await page.screenshot(path=str(OUT / family / "states" / f"{state}-{size}.png"),
                                          full_page=True,
                                          clip={"x": 0, "y": top, "width": width, "height": min(strip, full - top)})
                    await page.close()
                    print(f"captured {family} {state} {size}")
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
