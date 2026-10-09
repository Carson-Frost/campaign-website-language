"""Term shares under the three collection windows (analysis plan, Amendment 4).

The text of a candidate-year can come from the 60 days before election day (pages_cc.jsonl), the
120 days before it (pages_cc_120.jsonl) or the whole election year (pages_cc_year.jsonl), each
collected by cc.py with the same page choice and screened by analyze.py's rules. For Democratic and
Republican candidates in every year (2026 provisional) this writes:

- results/coverage_windows.csv: candidate-years on the ballot and analyzed, by window, year and party.
- results/term_shares_windows.csv: each term's share by window, year and party, for every candidate-year
  analyzed in that window ("all") and for those analyzed in all three windows ("common").

Run after cc.py --window 120 and --window year, from tools/.
"""
import csv
import re
from collections import Counter

from analyze import RESULTS, SHARE_HEADER, analyzed_texts, load_texts, share_rows
from terms import TERMS

WINDOWS = ("60", "120", "year")
YEARS = ("2020", "2022", "2024", "2026")
PARTIES = ("Democratic", "Republican")


def main():
    pats = [(th, lab, re.compile(rx, re.I)) for th, lab, rx in TERMS]
    analyzed, meta = {}, None
    for w in WINDOWS:
        meta, *_, done = analyzed_texts(loaded=load_texts(window=w))
        analyzed[w] = {k: t for k, t in done.items() if k[0] in YEARS and meta[k]["party_group"] in PARTIES}
    common = set.intersection(*(set(a) for a in analyzed.values()))

    ballot = Counter((k[0], r["party_group"]) for k, r in meta.items() if k[0] in YEARS and r["party_group"] in PARTIES)
    with open(RESULTS / "coverage_windows.csv", "w", newline="", encoding="utf-8") as f:
        out = csv.writer(f)
        out.writerow(["window", "year", "party_group", "on_ballot", "analyzed", "analyzed_in_all_windows"])
        for w in WINDOWS:
            got = Counter((k[0], meta[k]["party_group"]) for k in analyzed[w])
            both = Counter((k[0], meta[k]["party_group"]) for k in common)
            for cell in sorted(ballot):
                out.writerow([w, *cell, ballot[cell], got[cell], both[cell]])

    with open(RESULTS / "term_shares_windows.csv", "w", newline="", encoding="utf-8") as f:
        out = csv.writer(f)
        out.writerow(["window", "sample"] + SHARE_HEADER)
        for w in WINDOWS:
            for sample, keys in (("all", analyzed[w]), ("common", common)):
                texts = {k: analyzed[w][k] for k in sorted(keys)}
                out.writerows([w, sample] + r for r in share_rows(texts, meta, pats) if r[3] == "All")


if __name__ == "__main__":
    main()
