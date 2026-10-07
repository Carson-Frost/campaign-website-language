"""Check the Spanish paragraph rule (analyze.para_kind) against langid.py 1.1.6 (Lui and Baldwin 2012).

langid.py is a naive Bayes language identifier with a fixed, distributed model, so it gives the same
label for the same text every time. Every archived paragraph that the rule keeps or drops as Spanish
(page code, spam and placeholder text are left out) is classified by langid over its default 97
languages. Paragraphs under 8 words are counted separately, because identifiers are unreliable on
very short text.
Writes results/language_check.csv (paragraphs and words by rule, langid label and length) and
results/language_check_disagreements.csv (up to 40 random disagreements each way, for reading).
"""
import csv
import random
from collections import Counter

import langid

from analyze import RESULTS, load_texts


def main():
    paras = []
    load_texts(paras_out=paras)
    paras = sorted({(k, p, kind) for k, p, kind in paras if kind in ("", "not English")})
    cells, dis = Counter(), {"rule Spanish, langid not": [], "langid Spanish, rule not": []}
    for k, p, kind in paras:
        lang = langid.classify(p)[0]
        rule = "Spanish" if kind else "kept"
        lid = lang if lang in ("es", "en") else "other"
        band = "8+ words" if len(p.split()) >= 8 else "under 8 words"
        cells[(band, rule, lid, "paragraphs")] += 1
        cells[(band, rule, lid, "words")] += len(p.split())
        if rule == "Spanish" and lang != "es":
            dis["rule Spanish, langid not"].append((k, lang, p))
        elif rule == "kept" and lang == "es":
            dis["langid Spanish, rule not"].append((k, lang, p))
    with open(RESULTS / "language_check.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["length", "rule", "langid", "paragraphs", "words"])
        for band, rule, lid in sorted({c[:3] for c in cells}):
            w.writerow([band, rule, lid, cells[(band, rule, lid, "paragraphs")], cells[(band, rule, lid, "words")]])
            print(band, rule, lid, cells[(band, rule, lid, "paragraphs")], cells[(band, rule, lid, "words")])
    rng = random.Random("language check")
    with open(RESULTS / "language_check_disagreements.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["case", "year", "cand_key", "langid", "paragraph"])
        for case, items in dis.items():
            for k, lang, p in rng.sample(items, min(40, len(items))):
                w.writerow([case, k[0], k[1], lang, p[:500]])


if __name__ == "__main__":
    main()
