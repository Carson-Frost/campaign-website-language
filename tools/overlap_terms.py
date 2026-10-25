"""Document-overlap counts for the top-ranked master candidates.

Loads tools/output/master_candidates.csv, picks the top-N per n_gram, and computes, for every unordered
pair, |A intersect B| / min(|A|, |B|) using the per-document gram sets of each analyzed candidate-year
text (reused from analyze.analyzed_texts). Pairs with overlap >= THRESHOLD are saved to
tools/output/overlaps.csv so the clustering pass has an audit trail of empirical anchors.
"""
import csv
from collections import defaultdict
from pathlib import Path

from analyze import analyzed_texts, gram_counts

HERE = Path(__file__).parent
OUT = HERE / "output"
MASTER = OUT / "master_candidates.csv"
TOPN = {"1": 150, "2": 100, "3": 50}
THRESHOLD = 0.4  # a touch below the 0.5 merge rule, so the clusterer sees borderline pairs


def pick_terms():
    by_n = defaultdict(list)
    for r in csv.DictReader(open(MASTER, encoding="utf-8")):
        by_n[r["n_gram"]].append(r["term"])
    return [t for n in ("1", "2", "3") for t in by_n[n][:TOPN[n]]]


def doc_sets(terms, analyzed):
    want = {n: {t for t in terms if len(t.split()) == n} for n in (1, 2, 3)}
    sets = defaultdict(set)
    for k, text in analyzed.items():
        gc = gram_counts(text)
        for n in (1, 2, 3):
            for t in want[n] & set(gc[n]):
                sets[t].add(k)
    return sets


def main():
    _, _, _, _, _, _, analyzed = analyzed_texts()
    terms = pick_terms()
    sets = doc_sets(terms, analyzed)
    rows = []
    for i, a in enumerate(terms):
        sa = sets[a]
        if not sa:
            continue
        for b in terms[i + 1:]:
            sb = sets[b]
            if not sb:
                continue
            m = min(len(sa), len(sb))
            ov = len(sa & sb) / m
            if ov >= THRESHOLD:
                rows.append((a, b, len(sa), len(sb), ov))
    rows.sort(key=lambda r: -r[4])
    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / "overlaps.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["term_a", "term_b", "docs_a", "docs_b", "overlap"])
        for a, b, da, db, ov in rows:
            w.writerow([a, b, da, db, round(ov, 3)])
    print(f"terms: {len(terms)}  pairs over {THRESHOLD}: {len(rows)}")
    for a, b, da, db, ov in rows[:60]:
        print(f"  {ov:.2f}  {a:28s} <-> {b:28s} ({da}, {db})")


if __name__ == "__main__":
    main()
