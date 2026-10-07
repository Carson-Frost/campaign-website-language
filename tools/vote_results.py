"""General-election results for 2020-2024 candidates, used to compare analyzed and unanalyzed candidates.

2020 and 2022: FEC certified results (artifacts/fec/federalelections20xx.xlsx), joined by FEC ID.
2024: FEC has published no congressional results workbook, so results come from Ballotpedia's
certified vote boxes on each district, at-large or Senate race page, joined by Ballotpedia page.
A candidate wins with the most votes, or the most runoff votes where a race went to a runoff
(Georgia, Louisiana). dem_two_party is the Democratic share of the Democratic and Republican vote in
that race, a measure of how partisan the seat was.

Reads artifacts/data/candidates.csv. Writes artifacts/data/results.csv
(year, office, state, district, fec_id, bp_url, vote_share, won, dem_two_party).
"""
import csv
import re
import urllib.parse
from collections import defaultdict

import openpyxl

from common import ABBR, ART, DATA, text_of
from universe import page

STATE_OF = {v: k for k, v in ABBR.items()}
FEC_SHEETS = {"2020": ("federalelections2020.xlsx", "12. US Senate Results by State", "13. US House Results by State"),
              "2022": ("federalelections2022.xlsx", "7. US Senate Results by State", "8. US House Results by State")}


def num(v):
    return float(v) if isinstance(v, (int, float)) else 0.0


def fec_results(year, groups):
    """votes[(race)][fec_id] = (general, runoff) from the certified results workbook."""
    name, sen, house = FEC_SHEETS[year]
    wb = openpyxl.load_workbook(ART / "fec" / name, read_only=True)
    races = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0, False]))
    for office, sheet in (("Senate", sen), ("House", house)):
        for r in wb[sheet].iter_rows(min_row=3, values_only=True):
            st, dist, fid, gen, runoff = r[1], str(r[3] or "").strip(), str(r[4] or "").strip(), r[15], r[17]
            if not fid or fid == "n/a" or st not in STATE_OF:
                continue
            if office == "Senate":
                dist = "S2" if "UNEXPIRED" in dist.upper() else "S"
            else:
                dist = f"{int(dist):02d}" if dist.isdigit() else "00"
            c = races[(year, office, st, dist)][fid]
            c[0] += num(gen)
            c[1] += num(runoff)
            c[2] |= isinstance(gen, str) and "unopposed" in gen.lower()
    out = {}
    for race, cands in races.items():
        cands = {f: v for f, v in cands.items() if v[0] or v[1] or v[2]}
        if not cands:
            continue
        total = sum(v[0] for v in cands.values())
        by_runoff = any(v[1] for v in cands.values())
        winner = max(cands, key=lambda f: (cands[f][2], cands[f][1] if by_runoff else cands[f][0]))
        d = sum(v[0] for f, v in cands.items() if groups.get((year, f)) == "Democratic")
        rp = sum(v[0] for f, v in cands.items() if groups.get((year, f)) == "Republican")
        for f, v in cands.items():
            out[(year, f)] = dict(vote_share=1.0 if v[2] else (v[0] / total if total else ""), won=int(f == winner),
                                  dem_two_party=round(d / (d + rp), 4) if d + rp else "")
    return out


def ordinal(n):
    return f"{n}{'th' if 10 <= n % 100 <= 20 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')}"


def result_box(t, want):
    """(bp_url, vote count, winner) rows of the first vote box whose header fully matches want."""
    for m in re.finditer(r'<div class="(?:votebox|rcvvotebox)"', t):
        blk = t[m.start(): m.start() + 200000]
        nxt = re.search(r'<div class="(?:votebox|rcvvotebox)"', blk[20:])
        blk = blk[: nxt.start() + 20] if nxt else blk
        head = re.search(r'votebox-header-election-type">([^<]+)<', blk)
        if not head or not re.fullmatch(want, text_of(head.group(1))):
            continue
        rows = []
        for tr in re.findall(r'<tr class="results_row[^"]*".*?</tr>', blk, re.S):
            link = re.search(r'votebox-results-cell--text">.*?href="(https://ballotpedia\.org/[^"#]+)"', tr, re.S)
            nums = re.findall(r'votebox-results-cell--number">([\d,]+)\s*</td>', tr)
            if link and "Write-in" not in text_of(tr):
                rows.append((link.group(1), float(nums[-1].replace(",", "")) if nums else 0.0,
                             'class="results_row  winner"' in tr or "results_row winner" in tr))
        return rows
    return []


def bp_results(rows, groups):
    races = defaultdict(list)
    for r in rows:
        races[(r["office"], r["state"], r["district"])].append(r)
    out = {}
    for (office, st, dist), cands in sorted(races.items()):
        state = STATE_OF[st]
        if office == "Senate":
            title = f"United States Senate {'special ' if dist == 'S2' else ''}election in {state}, 2024"
            want = (r"Special general" if dist == "S2" else r"General") + r" election for U\.S\. Senate " + re.escape(state)
        elif dist == "00":
            title = f"United States House of Representatives elections in {state}, 2024"
            want = r"General election for U\.S\. House " + re.escape(state) + r" At-large District"
        else:
            title = f"{state}'{'' if state.endswith('s') else 's'} {ordinal(int(dist))} Congressional District election, 2024"
            kind = "Nonpartisan primary" if state == "Louisiana" else "General election"
            want = kind + r" for U\.S\. House " + re.escape(state) + r" District " + str(int(dist))
        try:
            box = result_box(page(title), want)
        except RuntimeError as e:
            print("missing page:", title, e, flush=True)
            continue
        if not box:
            print("no results box:", title, flush=True)
            continue
        total = sum(v for _, v, _ in box)
        votes = {urllib.parse.unquote(u): (v, w) for u, v, w in box}
        d = sum(v for u, (v, _) in votes.items() if groups.get(("2024", u)) == "Democratic")
        rp = sum(v for u, (v, _) in votes.items() if groups.get(("2024", u)) == "Republican")
        for r in cands:
            u = urllib.parse.unquote(r["bp_url"])
            if u in votes:
                out[("2024", r["bp_url"])] = dict(vote_share=votes[u][0] / total if total else "", won=int(votes[u][1]),
                                                  dem_two_party=round(d / (d + rp), 4) if d + rp else "")
    return out


def main():
    rows = [r for r in csv.DictReader(open(DATA / "candidates.csv", encoding="utf-8")) if r["year"] != "2026"]
    fec_groups = {(r["year"], r["fec_id"]): r["party_group"] for r in rows if r["fec_id"]}
    bp_groups = {(r["year"], urllib.parse.unquote(r["bp_url"])): r["party_group"] for r in rows}
    res = {}
    for y in ("2020", "2022"):
        res.update(fec_results(y, fec_groups))
    res.update(bp_results([r for r in rows if r["year"] == "2024"], bp_groups))
    out, hit = [], 0
    for r in rows:
        x = res.get((r["year"], r["fec_id"])) if r["year"] != "2024" else res.get(("2024", r["bp_url"]))
        hit += bool(x)
        out.append(dict(year=r["year"], office=r["office"], state=r["state"], district=r["district"], fec_id=r["fec_id"],
                        bp_url=r["bp_url"], **(x or dict(vote_share="", won="", dem_two_party=""))))
    with open(DATA / "results.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(out[0]))
        w.writeheader()
        w.writerows(out)
    print("results for", hit, "of", len(rows))


if __name__ == "__main__":
    main()
