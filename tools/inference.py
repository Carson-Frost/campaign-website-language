"""Uncertainty and multiple-testing tools for the term shares, and the table that uses them.

Functions here are small and checked against published or hand-worked values in test_inference.py.
Run as a script, it reads results/term_shares.csv and results/coverage.csv and writes
results/term_gaps.csv (an interval for each share, an interval and exact test for each Democratic minus
Republican gap, and false discovery rate q-values) and results/term_bounds.csv (the range each share
could take if every candidate without an analyzed site were included).

Standards: Wilson score intervals (Brown, Cai and DasGupta 2001, Statistical Science 16(2): 101-133),
Newcombe's Wilson-based interval for a difference of independent proportions (Newcombe 1998, Statistics
in Medicine 17(8): 873-890, method 10), Fisher's exact test, Benjamini and Hochberg (1995, J. Royal
Statistical Society B 57(1): 289-300) and Benjamini and Yekutieli (2001, Annals of Statistics 29(4):
1165-1188), worst-case bounds after Manski (1988, IRP Discussion Paper 873-88), and Krippendorff's alpha
for two coders (Hayes and Krippendorff 2007, Communication Methods and Measures 1(1): 77-89).
"""
import csv
import math
from collections import defaultdict
from math import comb, sqrt

from common import ROOT

RESULTS = ROOT / "results"
Z95 = 1.959964


def wilson(k, n, z=Z95):
    """Wilson score interval for k successes in n trials."""
    p, d = k / n, 1 + z * z / n
    c, h = (p + z * z / (2 * n)) / d, z * sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return max(0.0, c - h), min(1.0, c + h)


def newcombe_difference(k1, n1, k2, n2, z=Z95):
    """Difference p1 - p2 with Newcombe's hybrid score interval (method 10 of Newcombe 1998)."""
    p1, p2 = k1 / n1, k2 / n2
    l1, u1 = wilson(k1, n1, z)
    l2, u2 = wilson(k2, n2, z)
    d = p1 - p2
    return d, d - sqrt((p1 - l1) ** 2 + (u2 - p2) ** 2), d + sqrt((u1 - p1) ** 2 + (p2 - l2) ** 2)


def fisher_exact(a, b, c, d):
    """Two-sided p-value of Fisher's exact test for the table [[a, b], [c, d]].

    Sums the probability of every table with the same margins that is no more likely than the observed
    one, with the relative tolerance R's fisher.test uses.
    """
    n1, n2, k = a + b, c + d, a + c
    total = comb(n1 + n2, k)
    lo, hi = max(0, k - n2), min(k, n1)
    probs = {x: comb(n1, x) * comb(n2, k - x) for x in range(lo, hi + 1)}
    obs = probs[a]
    return min(1.0, sum(v for v in probs.values() if v <= obs * (1 + 1e-7)) / total)


def benjamini_hochberg(pvalues):
    """Adjusted p-values (q-values) controlling the false discovery rate for independent tests."""
    return _step_up(pvalues, 1.0)


def benjamini_yekutieli(pvalues):
    """Adjusted p-values controlling the false discovery rate under any dependence."""
    return _step_up(pvalues, sum(1 / i for i in range(1, len(pvalues) + 1)))


def _step_up(pvalues, factor):
    m = len(pvalues)
    order = sorted(range(m), key=lambda i: pvalues[i])
    q, running = [0.0] * m, 1.0
    for rank in range(m, 0, -1):
        i = order[rank - 1]
        running = min(running, pvalues[i] * m * factor / rank)
        q[i] = min(1.0, running)
    return q


def manski_bounds(k, analyzed, population):
    """Worst-case range for the population share when only `analyzed` of `population` are observed.

    k analyzed candidates use the term. The lowest share assumes no unobserved candidate uses it and the
    highest assumes every one does (Manski 1988), so the width equals the unobserved fraction.
    """
    missing = population - analyzed
    return k / population, (k + missing) / population


def krippendorff_alpha_binary(pairs):
    """Krippendorff's alpha for two coders with 0/1 codes and no missing values.

    pairs is a list of (code_by_coder_1, code_by_coder_2). Alpha is 1 minus observed over expected
    disagreement, where expected disagreement comes from the pooled use of the two codes.
    """
    n = 2 * len(pairs)
    disagree = sum(a != b for a, b in pairs)
    ones = sum(a + b for a, b in pairs)
    zeros = n - ones
    observed = 2 * disagree / n  # each unit contributes two ordered pairs of unequal codes, over n pairable values
    expected = 2 * ones * zeros / (n * (n - 1))
    if expected == 0:
        return 1.0 if disagree == 0 else float("nan")
    return 1 - observed / expected


def percent_agreement(pairs):
    return sum(a == b for a, b in pairs) / len(pairs)


def _int(x):
    return int(x)


def term_gaps():
    """Rows for results/term_gaps.csv, from term_shares.csv (all offices) and Democratic and Republican only."""
    cells = {}
    with open(RESULTS / "term_shares.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["office"] == "All" and r["party_group"] in ("Democratic", "Republican"):
                cells[(r["term"], r["year"], r["party_group"])] = (_int(r["candidates_using"]), _int(r["candidates_analyzed"]),
                                                                  r["theme"])
    keys = sorted({(t, y) for t, y, _ in cells})
    rows = []
    for t, y in keys:
        (kd, nd, theme), (kr, nr, _) = cells[(t, y, "Democratic")], cells[(t, y, "Republican")]
        gap, glo, ghi = newcombe_difference(kd, nd, kr, nr)
        dlo, dhi = wilson(kd, nd)
        rlo, rhi = wilson(kr, nr)
        p = fisher_exact(kd, nd - kd, kr, nr - kr)
        rows.append([theme, t, y, kd, nd, kr, nr, kd / nd, dlo, dhi, kr / nr, rlo, rhi, gap, glo, ghi, p])
    ps = [r[-1] for r in rows]
    bh, by = benjamini_hochberg(ps), benjamini_yekutieli(ps)
    return [[*r[:7], *(round(x, 4) for x in r[7:16]), f"{r[16]:.3g}", f"{b:.3g}", f"{y:.3g}"]
            for r, b, y in zip(rows, bh, by)]


GAP_HEADER = ["theme", "term", "year", "dem_using", "dem_analyzed", "rep_using", "rep_analyzed",
              "dem_share", "dem_low", "dem_high", "rep_share", "rep_low", "rep_high",
              "gap_dem_minus_rep", "gap_low", "gap_high", "fisher_p", "q_benjamini_hochberg", "q_benjamini_yekutieli"]


def term_bounds():
    """Rows for results/term_bounds.csv: worst-case ranges for every party and year, for two populations."""
    cov = defaultdict(lambda: [0, 0, 0])
    with open(RESULTS / "coverage.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            c = cov[(r["year"], r["party_group"])]
            c[0] += _int(r["candidates"])
            c[1] += _int(r["website_known"])
            c[2] += _int(r["analyzed"])
    rows = []
    with open(RESULTS / "term_shares.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["office"] != "All" or r["party_group"] not in ("Democratic", "Republican", "Independent", "Third party"):
                continue
            k, n = _int(r["candidates_using"]), _int(r["candidates_analyzed"])
            ballot, with_site, analyzed = cov[(r["year"], r["party_group"])]
            assert analyzed == n, (r["term"], r["year"], r["party_group"], analyzed, n)
            lo_b, hi_b = manski_bounds(k, n, ballot)
            lo_s, hi_s = manski_bounds(k, n, with_site)
            rows.append([r["theme"], r["term"], r["year"], r["party_group"], k, n, with_site, ballot,
                         round(k / n, 4), round(lo_s, 4), round(hi_s, 4), round(lo_b, 4), round(hi_b, 4)])
    return rows


BOUND_HEADER = ["theme", "term", "year", "party_group", "using", "analyzed", "with_known_website", "on_ballot",
                "share_of_analyzed", "low_among_known_website", "high_among_known_website",
                "low_among_ballot", "high_among_ballot"]


def main():
    with open(RESULTS / "term_gaps.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(GAP_HEADER)
        w.writerows(term_gaps())
    with open(RESULTS / "term_bounds.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(BOUND_HEADER)
        w.writerows(term_bounds())


if __name__ == "__main__":
    main()
