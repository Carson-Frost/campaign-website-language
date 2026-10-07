"""Presidential vote by seat: the Democratic share of the two-party presidential vote in each
candidate-year's district, or statewide for Senate, from Ballotpedia.

Each year uses the most recent presidential result on that year's lines:
- Senate and at-large seats: the statewide result from "Presidential election in <state>, 2024", which
  shows the 2024 and 2020 results (2020 for 2020 and 2022, 2024 for 2024 and 2026).
- 2022 House: the 2020 result on 2022 lines (Daily Kos Elections), from the "Effect of redistricting"
  table on the state's 1st-district 2022 race page.
- 2026 House: the 2024 result on 2026 lines (The Downballot), from the state's 2026 House elections page.
  Missouri used its older map for the 2026 general, and Ballotpedia's table follows that map.
- 2024 House: the same 2024 table, for the states whose lines did not change between 2024 and 2026.
  Ballotpedia has no 2024 result on 2024 lines for the nine states that redrew, so those stay blank.
- 2020 House: Ballotpedia has no 2020 result on 2020 lines for districts, so only at-large seats are filled.

Reads artifacts/data/candidates.csv. Writes artifacts/data/seat_pres.csv
(year, office, state, district, bp_url, pres_year, pres_dem_two_party).
"""
import csv
import re

from common import ABBR, DATA, text_of
from universe import page
from vote_results import ordinal

STATE_OF = {v: k for k, v in ABBR.items()}
REDRAWN_2026 = {"AL", "CA", "FL", "LA", "NC", "OH", "TN", "TX", "UT"}  # Ballotpedia, Sept. 2026


def two_party(d, r):
    return round(d / (d + r), 4)


NOMINEES = {2020: ("Joe Biden", "Donald Trump"), 2024: ("Kamala D. Harris", "Donald Trump")}


def statewide(state):
    """{2020: share, 2024: share} from the vote boxes on the state's 2024 presidential page.

    Alaska (2024) and Maine use ranked-choice boxes, which carry no party marks, so nominees are matched
    by name and their first-round votes are used.
    """
    t = page(f"Presidential election in {state}, 2024")
    out = {}
    for m in re.finditer(r'<div class="(?:votebox|rcvvotebox)"', t):
        box = text_of(t[m.start(): m.start() + 60000])
        # Some boxes open with a disclaimer before the title.
        y = re.match(r".{0,400}?Presidential election (?:results )?in " + re.escape(state) + r", (2020|2024)\b", box)
        if not y or int(y.group(1)) in out:
            continue
        box = box[y.end():]
        votes = [re.search(re.escape(n) + r"[^\d]*?\s[\d.]+ ([\d,]{3,})\b", box) for n in NOMINEES[int(y.group(1))]]
        out[int(y.group(1))] = two_party(*(float(v.group(1).replace(",", "")) for v in votes))
    return out


def district_table(t, caption):
    """{district number: share} from the first table whose text starts with caption (a regex)."""
    for m in re.finditer(r"<table[^>]*>(.*?)</table>", t, re.S):
        if not re.match(caption, text_of(m.group(1))):
            continue
        out = {}
        for tr in re.findall(r"<tr>(.*?)</tr>", m.group(1), re.S):
            cells = [text_of(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)]
            num = re.search(r"(\d+)(?:st|nd|rd|th)$", cells[0]) if cells else None
            pct = [float(c.rstrip("%")) for c in cells[1:3] if re.fullmatch(r"[\d.]+%", c)]
            if num and len(pct) == 2:
                out[f"{int(num.group(1)):02d}"] = two_party(*pct)
        return out
    return {}


def house_2022(state, districts):
    """The state table on the 1st district's page, or else each district page's own one-row table
    (Louisiana's pages have only the latter)."""
    poss = "'" if state.endswith("s") else "'s"
    title = lambda d: f"{state}{poss} {ordinal(int(d))} Congressional District election, 2022"
    out = district_table(page(title("01")), r"2020 presidential results by Congressional district, " + re.escape(state))
    if out:
        return out
    for d in districts:
        t = page(title(d))
        for m in re.finditer(r"<table[^>]*>(.*?)</table>", t, re.S):
            x = re.fullmatch(r"2020 presidential results in .+ based on 2022 district lines Joe Biden Donald Trump "
                             r"([\d.]+)% ([\d.]+)%", text_of(m.group(1)))
            if x:
                out[d] = two_party(float(x.group(1)), float(x.group(2)))
    return out


def house_2026(state):
    t = page(f"United States House of Representatives elections in {state}, 2026")
    return district_table(t, r"2024 presidential results in congressional districts, " + re.escape(state))


def main():
    rows = list(csv.DictReader(open(DATA / "candidates.csv", encoding="utf-8")))
    states = sorted({r["state"] for r in rows})
    multi = {(r["year"], r["state"]) for r in rows if r["office"] == "House" and r["district"] != "00"}
    sw = {st: statewide(STATE_OF[st]) for st in states}
    dists22 = lambda st: sorted({r["district"] for r in rows if r["year"] == "2022" and r["state"] == st and r["office"] == "House"})
    h22 = {st: house_2022(STATE_OF[st], dists22(st)) for st in states if ("2022", st) in multi}
    h26 = {st: house_2026(STATE_OF[st]) for st in states if ("2026", st) in multi}
    for name, tables in (("2022", h22), ("2026", h26)):
        for st, tab in tables.items():
            if not tab:
                print("no", name, "district table:", st, flush=True)
    out, hit = [], 0
    for r in rows:
        y, st, d = int(r["year"]), r["state"], r["district"]
        py = 2020 if y <= 2022 else 2024
        if r["office"] == "Senate" or d == "00":
            v = sw[st].get(py)
        elif y == 2022:
            v = h22.get(st, {}).get(d)
        elif y == 2026 or (y == 2024 and st not in REDRAWN_2026):
            v = h26.get(st, {}).get(d)
        else:
            v = None
        hit += v is not None
        out.append(dict(year=r["year"], office=r["office"], state=st, district=d, bp_url=r["bp_url"], pres_year=py,
                        pres_dem_two_party="" if v is None else v))
    with open(DATA / "seat_pres.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(out[0]))
        w.writeheader()
        w.writerows(out)
    print("presidential vote for", hit, "of", len(rows))


if __name__ == "__main__":
    main()
