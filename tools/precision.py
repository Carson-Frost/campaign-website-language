"""Match precision per term from the hand-coded sample.

Reads results/term_matches_coded.csv: 20 random users per term in the report's findings, each shown at
one random match and coded intended = 1 when the match is the sense the term is meant to measure.
regex_version v1 is the prespecified pattern; v2 rows are a fresh sample drawn after a pattern was
narrowed. A narrowed term's precision comes from its fresh sample alone, because the first sample
shaped the narrowing and would understate its error (Hastie, Tibshirani and Friedman 2009, sec. 7.2).
Every precision carries a 95% Wilson score interval (Brown, Cai and DasGupta 2001).
Writes results/term_precision.csv.
"""
import csv
import math
import re
from collections import defaultdict

from common import ROOT
from terms import TERMS

RESULTS = ROOT / "results"


def wilson(k, n, z=1.959964):
    """95% Wilson score interval for k successes in n trials."""
    p, d = k / n, 1 + z * z / n
    c, h = (p + z * z / (2 * n)) / d, z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return max(0.0, c - h), min(1.0, c + h)


def main():
    pats = {lab: re.compile(rx, re.I) for _, lab, rx in TERMS}
    rows = list(csv.DictReader(open(RESULTS / "term_matches_coded.csv", encoding="utf-8")))
    by = defaultdict(lambda: defaultdict(list))
    for r in rows:
        text, pos = r["before"] + r["match"] + r["after"], len(r["before"])
        if not any(m.start() == pos for m in pats[r["term"]].finditer(text)):
            assert r["regex_version"] == "v1", f"a fresh-sample match no longer matches: {r['term']}"
            continue  # a first-round match that the narrowed pattern no longer produces
        by[r["term"]][r["regex_version"]].append(int(r["intended"]))
    with open(RESULTS / "term_precision.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["term", "sample", "coded", "intended", "precision", "wilson_low", "wilson_high"])
        for term in sorted(by):
            sample = "v2" if by[term]["v2"] else "v1"
            v = by[term][sample]
            lo, hi = wilson(sum(v), len(v))
            w.writerow([term, sample, len(v), sum(v), round(sum(v) / len(v), 2), round(lo, 2), round(hi, 2)])
            print(f"{term:32} {sample} {sum(v)}/{len(v)} = {sum(v) / len(v):.0%}  ({lo:.0%}-{hi:.0%})")


if __name__ == "__main__":
    main()
