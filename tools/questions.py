"""Question 1 of ANALYSIS_PLAN.md: which words stay split between the parties from 2020 to 2024, and
which change from one election to the next.

A term is **split** when the Democratic and Republican shares differ in the same direction in 2020, 2022
and 2024, each with a Benjamini-Hochberg adjusted p-value below 0.05 (adjusted over the 171 comparisons
of those three years, as in results/term_gaps.csv). A term is **moving** when at least one party's share
changes between consecutive elections (2020 to 2022 or 2022 to 2024) with an adjusted p-value below 0.05,
adjusted over all 57 terms by two parties by two pairs of elections, 228 comparisons. The two
properties give four classes. Changes compare each year's candidates as independent groups, which
understates the uncertainty for candidates who ran in both years.

Writes results/term_changes.csv (every within-party change with its test) and results/term_classes.csv
(one row per term).
"""
import csv
from collections import defaultdict

import inference as inf
from common import ROOT

RESULTS = ROOT / "results"
YEARS = ("2020", "2022", "2024")
PAIRS = (("2020", "2022"), ("2022", "2024"))
PARTIES = ("Democratic", "Republican")
ALPHA = 0.05


def load_counts():
    """{(term, year, party): (using, analyzed)} for all offices together, plus {term: theme}."""
    counts, themes = {}, {}
    with open(RESULTS / "term_shares.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["office"] == "All" and r["party_group"] in PARTIES:
                counts[(r["term"], r["year"], r["party_group"])] = (int(r["candidates_using"]), int(r["candidates_analyzed"]))
                themes[r["term"]] = r["theme"]
    return counts, themes


def changes(counts, terms):
    """Within-party change between consecutive elections, with exact tests adjusted over the whole family."""
    rows = []
    for t in terms:
        for g in PARTIES:
            for y0, y1 in PAIRS:
                (k0, n0), (k1, n1) = counts[(t, y0, g)], counts[(t, y1, g)]
                p = inf.fisher_exact(k0, n0 - k0, k1, n1 - k1)
                rows.append(dict(term=t, party=g, y0=y0, y1=y1, share0=k0 / n0, share1=k1 / n1, change=k1 / n1 - k0 / n0, p=p))
    q = inf.benjamini_hochberg([r["p"] for r in rows])
    for r, x in zip(rows, q):
        r["q"] = x
    return rows


def classify(counts, themes, gap_rows):
    """One row per term. gap_rows are inference.term_gaps() rows, of which only 2020 to 2024 are used."""
    terms = sorted(themes)
    chg = changes(counts, terms)
    moving = defaultdict(list)
    for r in chg:
        if r["q"] < ALPHA:
            moving[r["term"]].append(f'{r["party"][:3]}. {r["y0"]} to {r["y1"]}')
    gap = {(r[1], r[2]): (float(r[13]), float(r[17])) for r in gap_rows if r[2] in YEARS}
    out = []
    for t in terms:
        diffs = [gap[(t, y)][0] for y in YEARS]
        qs = [gap[(t, y)][1] for y in YEARS]
        same_sign = all(d > 0 for d in diffs) or all(d < 0 for d in diffs)
        split = same_sign and all(q < ALPHA for q in qs)
        side = ("Democratic" if diffs[0] > 0 else "Republican") if split else ""
        is_moving = bool(moving[t])
        label = ("split" if split else "not consistently split") + (", moving" if is_moving else ", still")
        out.append(dict(theme=themes[t], term=t, split=split, favors=side, moving=is_moving, moves="; ".join(moving[t]),
                        gaps=diffs, gap_q=qs, label=label))
    return out, chg


def main():
    counts, themes = load_counts()
    out, chg = classify(counts, themes, inf.term_gaps())
    with open(RESULTS / "term_changes.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["term", "party", "year_from", "year_to", "share_from", "share_to", "change", "fisher_p",
                    "q_benjamini_hochberg"])
        for r in chg:
            w.writerow([r["term"], r["party"], r["y0"], r["y1"], round(r["share0"], 4), round(r["share1"], 4),
                        round(r["change"], 4), f'{r["p"]:.3g}', f'{r["q"]:.3g}'])
    with open(RESULTS / "term_classes.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["theme", "term", "class", "favors", "gap_2020", "gap_2022", "gap_2024", "gap_q_2020", "gap_q_2022",
                    "gap_q_2024", "significant_changes"])
        for r in out:
            w.writerow([r["theme"], r["term"], r["label"], r["favors"], *(round(x, 4) for x in r["gaps"]),
                        *(f"{x:.3g}" for x in r["gap_q"]), r["moves"]])


if __name__ == "__main__":
    main()
