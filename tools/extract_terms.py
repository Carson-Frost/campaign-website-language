"""Rank candidate master terms from analyzed campaign-website text.

Unigrams by raw frequency after stopword and boilerplate removal; two- and three-word phrases by
Dunning's log-likelihood (G squared, Dunning 1993) using the token-split contingency table (bigram
w1 | w2 and trigram w1 w2 | w3). Candidate-name tokens are stripped per cand_key before counting,
so a candidate's own name never ranks against the content. Stopwords: NLTK english plus the
boilerplate drop list in tools/stopwords_campaign.txt (navigation chrome, legal and office nouns,
generic campaign verbs, common first names).

Output: tools/output/master_candidates.csv with rank, n_gram, term, count, docs, g2 (g2 empty for
unigrams). Top 1500 unigrams, top 1500 bigrams, top 500 trigrams. A shorter phrase is dropped when
a longer phrase contains it and at least DEDUP_OVERLAP of the shorter phrase's documents also hold
the longer one.
"""
import csv
import math
from collections import Counter
from pathlib import Path

from nltk.corpus import stopwords as nltk_stopwords

from analyze import analyzed_texts, gram_counts
from match_fec import toks

HERE = Path(__file__).parent
OUT = HERE / "output"
BOILERPLATE = HERE / "stopwords_campaign.txt"
STOP_PHRASES = HERE / "stop_phrases.txt"

MIN_FREQ = 10
MIN_DOCS = 5
TOP = {1: 1500, 2: 1500, 3: 500}
DEDUP_OVERLAP = 0.75


def load_list(path):
    """One token or phrase per line, lower-cased; blank lines and # comments ignored."""
    out = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            out.add(line.lower())
    return out


def load_boilerplate():
    return load_list(BOILERPLATE)


def g2(a, b, c, d):
    """Dunning's log-likelihood for a 2x2 contingency table."""
    n = a + b + c + d
    if n == 0:
        return 0.0
    total = 0.0
    for obs, row, col in ((a, a + b, a + c), (b, a + b, b + d),
                          (c, c + d, a + c), (d, c + d, b + d)):
        exp = row * col / n if n else 0
        if obs > 0 and exp > 0:
            total += obs * math.log(obs / exp)
    return 2 * total


def collect(analyzed, meta, stop_uni, stop_edge):
    """Per-document gram counts filtered by stops and candidate-name tokens.

    stop_uni drops unigrams (NLTK english plus boilerplate); stop_edge drops a phrase whose first or
    last token is a stopword (NLTK english only, so a boilerplate word like "working" does not kill
    "working families"). Returns totals and docs Counters per n, plus doc_sets for phrases (dedupe).
    """
    totals = {1: Counter(), 2: Counter(), 3: Counter()}
    docs = {1: Counter(), 2: Counter(), 3: Counter()}
    doc_sets = {2: {}, 3: {}}
    for k, text in analyzed.items():
        name_toks = set(toks(meta[k]["name"]))
        for n, c in gram_counts(text).items():
            seen = []
            for gram, v in c.items():
                parts = gram.split()
                if any(p in name_toks for p in parts):
                    continue
                if n == 1:
                    if parts[0] in stop_uni:
                        continue
                else:
                    if parts[0] in stop_edge or parts[-1] in stop_edge:
                        continue
                totals[n][gram] += v
                seen.append(gram)
            for gram in seen:
                docs[n][gram] += 1
                if n > 1:
                    doc_sets[n].setdefault(gram, set()).add(k)
    return totals, docs, doc_sets


def score_phrases(n, totals, docs):
    """G squared per phrase using token splits (bigram: w1 | w2; trigram: w1 w2 | w3)."""
    head, tail = Counter(), Counter()
    N = sum(totals[n].values())
    for gram, v in totals[n].items():
        parts = gram.split()
        l = parts[0] if n == 2 else " ".join(parts[:2])
        r = parts[-1]
        head[l] += v
        tail[r] += v
    scored = []
    for gram, cnt in totals[n].items():
        if cnt < MIN_FREQ or docs[n][gram] < MIN_DOCS:
            continue
        parts = gram.split()
        l = parts[0] if n == 2 else " ".join(parts[:2])
        r = parts[-1]
        a = cnt
        b = head[l] - a
        c = tail[r] - a
        d = N - a - b - c
        scored.append((gram, cnt, docs[n][gram], g2(a, b, c, d)))
    return scored


def dedupe(bi, tri, doc_sets):
    """Drop a bigram when a kept trigram contains it and shares at least DEDUP_OVERLAP of its docs."""
    tri_grams = {g for g, *_ in tri}
    drop = set()
    for bg, *_ in bi:
        pad = " " + bg + " "
        for tg in tri_grams:
            if pad in " " + tg + " ":
                s = doc_sets[2].get(bg, set())
                if s and len(s & doc_sets[3].get(tg, set())) / len(s) >= DEDUP_OVERLAP:
                    drop.add(bg)
                    break
    return [r for r in bi if r[0] not in drop]


def main():
    meta, _, _, _, _, _, analyzed = analyzed_texts()
    nltk_stop = set(nltk_stopwords.words("english"))
    stop_uni = nltk_stop | load_boilerplate()
    stop_edge = nltk_stop

    totals, docs, doc_sets = collect(analyzed, meta, stop_uni, stop_edge)

    uni = sorted(((g, c, docs[1][g], 0.0) for g, c in totals[1].items()
                  if c >= MIN_FREQ and docs[1][g] >= MIN_DOCS),
                 key=lambda r: (-r[1], r[0]))[:TOP[1]]
    bi = sorted(score_phrases(2, totals, docs), key=lambda r: (-r[3], r[0]))[:TOP[2]]
    tri = sorted(score_phrases(3, totals, docs), key=lambda r: (-r[3], r[0]))[:TOP[3]]
    bi = dedupe(bi, tri, doc_sets)

    stop_phrases = load_list(STOP_PHRASES)
    killed = [r for r in bi + tri if r[0] in stop_phrases]
    bi = [r for r in bi if r[0] not in stop_phrases]
    tri = [r for r in tri if r[0] not in stop_phrases]

    OUT.mkdir(parents=True, exist_ok=True)
    out_path = OUT / "master_candidates.csv"
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["rank", "n_gram", "term", "count", "docs", "g2"])
        rank = 0
        for gram, cnt, d, _ in uni:
            rank += 1
            w.writerow([rank, 1, gram, cnt, d, ""])
        for gram, cnt, d, score in bi:
            rank += 1
            w.writerow([rank, 2, gram, cnt, d, round(score, 2)])
        for gram, cnt, d, score in tri:
            rank += 1
            w.writerow([rank, 3, gram, cnt, d, round(score, 2)])

    print(f"wrote {out_path}")
    print(f"unigrams: {len(uni)}")
    print(f"bigrams:  {len(bi)}")
    print(f"trigrams: {len(tri)}")
    print(f"killed by stop_phrases: {len(killed)}")
    for gram, cnt, d, score in sorted(killed, key=lambda r: -r[3])[:10]:
        print(f"  {gram:35s} count={cnt} docs={d} g2={round(score, 2)}")


if __name__ == "__main__":
    main()
