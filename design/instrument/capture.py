"""Capture every state of the Instrument mockup at 1440x900 and 390x844, headless, and report page errors.

With serve.py running, from the project root:

    artifacts/.venv/Scripts/python.exe design/instrument/capture.py [state ...]

Prints a warning for every label, option or heading that does not start with a capital letter, and for page
errors and failed requests. Writes <state>-desktop.png and <state>-phone.png (the first screen) and, where the page is taller than one
screen, <state>-desktop-full.png and <state>-phone-full.png, into the ignored artifacts/instrument/captures/.
"""
from __future__ import annotations

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[2] / "artifacts" / "instrument" / "captures"
BASE = "http://127.0.0.1:8765/instrument/"
SIZES = {"desktop": (1440, 900), "phone": (390, 844)}

WF = "working-families"
# state: (address, {size: [actions]}); an action is ("click", selector) or ("select", selector, value)
STATES = {
    "table": ("#/", {}),
    "table-theme": ("#/?by=theme", {}),
    "table-2026": ("#/?year=2026", {}),
    "table-2020": ("#/?year=2020", {}),
    "table-gap": ("#/?sort=gap", {}),
    "table-range": ("#/?range=1", {}),
    "table-filter-small": ("#/?state=WA&office=House", {}),
    "table-filter-tiny": ("#/?state=WA&office=Senate", {}),
    "table-filter-empty": ("#/?state=CT&office=Senate&year=2024", {}),
    "filters": ("#/", {"desktop": [("click", "#filtersBtn")], "phone": [("click", "#filtersBtn")]}),
    "term": (f"#/term/{WF}", {}),
    "term-large-gap": ("#/term/reproductive-freedom-rights", {}),
    "term-no-gap": ("#/term/common-sense", {}),
    "term-caveat-freedom": ("#/term/freedom", {}),
    "term-caveat-inflation": ("#/term/inflation", {}),
    "term-2026": ("#/term/tariffs", {}),
    "term-range-on": (f"#/term/{WF}?range=1", {}),
    "term-filter-small": (f"#/term/{WF}?state=WA&office=House", {}),
    "term-filter-tiny": (f"#/term/{WF}?state=WA&office=Senate", {}),
    "term-filter-empty": (f"#/term/{WF}?state=CT&office=Senate", {}),
    "terms": ("#/terms/working-families,middle-class,tax-cuts,health-care,inflation,cost-of-living", {}),
    "panel": (f"#/term/{WF}?panel={WF}.2024.D", {}),
    "panel-excerpt": (f"#/term/{WF}?panel={WF}.2024.D&cand=2024-H0WA08046", {}),
    # a name at the bottom of the 124 who used the word: the click scrolls the list there first, as a reader would
    "panel-excerpt-low": (f"#/term/{WF}?panel={WF}.2024.D",
                          {"desktop": [("click", '#panel [data-cand="2024-H4FL21070"]')], "phone": [("click", '#panel [data-cand="2024-H4FL21070"]')]}),
    "panel-filtered": (f"#/?panel={WF}.2024.R&state=WA&office=House", {}),
    "panel-2026": ("#/term/tariffs?panel=tariffs.2026.R", {}),
    "tab-method": ("#/method", {}),
    "tab-method-window": ("#/method/window", {}),
    "tab-coverage": ("#/coverage", {}),
    "tab-related-work": ("#/related-work", {}),
    "tab-downloads": ("#/downloads", {}),
    "tab-glossary": ("#/glossary", {}),
    "phone-menu": ("#/", {"phone": [("click", "#menuBtn")]}),
}


# Every label, option, heading, button and list line of the interface opens with a capital letter (or a figure);
# the parts of a candidate's line ("NC-12 · Incumbent · Won") are checked one by one. Excerpts and file names are
# the study's data and are skipped.
LINT = r"""() => {
  const bad = [];
  const low = s => /^[a-z]/.test(s.replace(/^[^A-Za-z0-9]+/, ''));
  const skip = e => e.closest('.ex, .cols, a[download], .cite, script, style, [hidden]');
  const first = el => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => n.nodeValue.trim() ? 1 : 3 }); const n = w.nextNode(); return n ? n.nodeValue.replace(/\s+/g, ' ').trim() : ''; };
  document.querySelectorAll('option, button, label, legend, th, summary, h1, h2, h3, p, li, dd, dt, figcaption, .chip, .tab, .unit, .of, .tag, .pn, .nm, .theme, .back').forEach(e => {
    if (skip(e) || e.matches('.share, .gp, .chg, .vh') && !e.textContent.trim()) return;
    const t = e.matches('option') ? e.textContent.trim() : first(e);
    if (t && low(t) && !(e.tagName === 'LI' && e.querySelector('button, a'))) bad.push(t.slice(0, 50));
    // an option such as "Sort: Most used overall" is checked after its colon too
    if (e.matches('option')) t.split(':').slice(1).map(x => x.trim()).forEach(x => { if (x && low(x)) bad.push(x.slice(0, 50)); });
  });
  document.querySelectorAll('.meta, .sub').forEach(e => {
    if (skip(e)) return;
    e.textContent.split('·').map(x => x.trim()).filter(Boolean).forEach(x => { if (low(x)) bad.push(x.slice(0, 50)); });
  });
  document.querySelectorAll('input[placeholder]').forEach(i => { if (low(i.placeholder)) bad.push(i.placeholder); });
  return [...new Set(bad)];
}"""


def capture(page, key, addr, actions, size):
    w, h = SIZES[size]
    page.set_viewport_size({"width": w, "height": h})
    page.goto(BASE + "?v=" + key)
    page.evaluate("(a) => { location.hash = a; }", addr)
    page.reload()
    page.wait_for_selector("html[data-ready='1']", timeout=15000)
    page.wait_for_timeout(500)
    for act in actions.get(size, []):
        if act[0] == "click":
            page.click(act[1])
        elif act[0] == "select":
            page.select_option(act[1], act[2])
        page.wait_for_timeout(250)
    name = f"{key}-{size}"
    page.screenshot(path=str(OUT / f"{name}.png"))
    for text in page.evaluate(LINT):
        print(f"  [{size}] {key}: label does not start with a capital: {text!r}")
    full = page.evaluate("document.documentElement.scrollHeight")
    wide = page.evaluate("document.documentElement.scrollWidth")
    if wide > w:
        print(f"  [{size}] {key}: horizontal overflow, page is {wide} px wide")
    if full > h + 40 and not actions.get(size):
        page.screenshot(path=str(OUT / f"{name}-full.png"), full_page=True)
    return full


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    keys = [k for k in sys.argv[1:] if k in STATES] or list(STATES)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for size in SIZES:
            w, h = SIZES[size]
            ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1)
            page = ctx.new_page()
            page.on("pageerror", lambda e, s=size: print(f"  [{s}] page error: {e}"))
            page.on("console", lambda m, s=size: print(f"  [{s}] console {m.type}: {m.text}") if m.type in ("error", "warning") else None)
            page.on("requestfailed", lambda r, s=size: print(f"  [{s}] request failed: {r.url} {r.failure}"))
            for key in keys:
                addr, actions = STATES[key]
                if size not in SIZES or (size != "phone" and key.startswith("phone-")):
                    continue
                for attempt in range(3):  # the loopback server can refuse a connection in a burst; retry
                    try:
                        full = capture(page, key, addr, actions, size)
                        print(f"{key}-{size}: page height {full}")
                        break
                    except Exception as e:  # keep going so one broken state does not hide the others
                        if attempt == 2:
                            print(f"{key}-{size}: FAILED {e}")
            ctx.close()
        browser.close()


if __name__ == "__main__":
    main()
