"""Term usage by party and year in collected campaign-website text.

Inputs: artifacts/data/sites_input.csv and pages_cc.jsonl (Common Crawl), pages_archived.jsonl
(Wayback) and pages_live.jsonl (2026 live sites).
Main analysis: archived text for every year (Common Crawl and Wayback captures from the 60 days
before election day), so all four years share one source and method. Check: 2026 term shares
recomputed from the live crawl of every 2026 site with a known address.
A candidate-year is analyzed when its de-duplicated text from its current site has at least MIN_WORDS
words and passes screen(), which drops text that is not campaign content.

Outputs in results/: coverage.csv, term_shares.csv, term_shares_2026_live.csv,
distinctive_terms.csv, examples.json, corpus_stats.json, excluded_sites.csv (screened out),
term_matches_sample.csv (20 random users per term, for hand-coding match precision), selection.csv
(analyzed against unanalyzed candidates; needs artifacts/data/results.csv from vote_results.py and
artifacts/data/seat_pres.csv from seat_pres.py) and
term_shares_panel.csv (candidates analyzed in two or more years),
term_shares_min_words.csv (shares at 50, 100 and 200 words), site_length.csv (words by party and year) and
term_shares_added.csv (shares for the added abortion wordings in terms.ADDED_TERMS).
"""
import csv
import json
import random
import re
from collections import Counter, defaultdict

import numpy as np

from common import ROOT, DATA
from match_fec import toks
from sites import MAX_PAGES, main_host, norm_site
from terms import ADDED_TERMS, TERMS

MIN_WORDS = 100
GROUPS = ("Democratic", "Republican", "Independent", "Third party")
RESULTS = ROOT / "results"


def normalize(t):
    t = t.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", t)


CSS_RULE = re.compile(r"(?:[.#@][^{}\s]*|\b[a-z]+)[^{}.!?]{0,200}\{(?:[^{}]*:[^{}]*|\s*)\}")


def strip_css(t):
    """Remove stylesheet rules that some site builders leak into extracted text."""
    if "{" not in t:
        return t
    s = CSS_RULE.sub(" ", t)
    while s != t:  # nested rules (@media) need repeated passes
        t, s = s, CSS_RULE.sub(" ", s)
    return re.sub(r"\s+", " ", s.replace("}", " "))


LATIN = set("lorem ipsum dolor sit amet consectetur adipiscing adipisicing elit sed eiusmod tempor ut labore dolore magna "
            "aliqua enim quis nisi commodo duis aute velit esse nulla et est quae quam autem eget vitae nec vel eu nunc "
            "mauris ac".split())
ENGLISH = set("the and of to a in for is that on with as are be this we our it by you your will have not from at all".split())
# Articles such as de, la, los and el are left out: they fill American names (Los Angeles, De La Cruz).
SPANISH = set("que en y por para con una su sus al es se lo como nuestra nuestro nuestros nuestras más".split())
CAMPAIGN = re.compile(r"\b(?:congress(?:ional|man|woman)?|senat(?:e|or)|elect(?:ed|ion|ions)?|re-?elect|vot(?:e|es|ers?|ing)|"
                      r"campaign|candidate|district|representative|legislat(?:ion|ive|ure|or)|government|politic(?:s|al|ians?)|"
                      r"ballot|paid for by|washington|constituents?|democrats?|democratic|republicans?|conservative|"
                      r"progressive|polic(?:y|ies))\b", re.I)
SPAM = re.compile(r"\b(?:slots?|slot\d+|casino|judi|togel|gacor|sbobet|maxwin|poker|jackpot|viagra|cialis)\b", re.I)
SPAM_ONLY = re.compile(r"\b(?:slot\d+|togel|gacor|sbobet|maxwin)\b", re.I)
DEAD = re.compile(r"domain (?:is )?for sale|buy this domain|hosting provider|account (?:has been )?suspended|"
                  r"site (?:is )?(?:temporarily )?unavailable|this site can.t be reached|parked free", re.I)


def para_kind(p):
    """Paragraphs dropped before analysis: page code, spam, placeholder (lorem ipsum) and Spanish text.

    The English term list cannot read placeholder or Spanish text, and spam injected into a hacked
    campaign site is not the campaign's.
    """
    if len(re.findall(r"[{};]\s*-*[\w-]+\s*:", p)) >= 3 or len(re.findall(r"\.css-\w", p)) >= 3:
        return "page code"  # stylesheet fragments that strip_css could not parse
    hits = {m.lower() for m in SPAM.findall(p)}  # one hit alone may be a name such as Judi
    if len(hits) >= 2 or SPAM_ONLY.search(p):
        return "spam"
    w = re.findall(r"[a-záéíóúñ]+", p.lower())
    if len(w) >= 8 and sum(x in LATIN for x in w) / len(w) >= 0.15:
        return "placeholder text"
    es, en = sum(x in SPANISH for x in w), sum(x in ENGLISH for x in w)
    return "not English" if es >= 2 and es > en else ""


def load_texts(live2026=False, paras_out=None):
    """meta, texts, source, status and dropped: words removed per candidate-year by para_kind().

    paras_out, a list, receives (key, paragraph, para_kind) for every paragraph (check_language.py).
    """
    meta = {(r["year"], r["cand_key"]): r for r in csv.DictReader(open(DATA / "sites_input.csv", encoding="utf-8"))}
    site = {k: norm_site(r["website"])[0] for k, r in meta.items() if r["website"]}
    pages = defaultdict(lambda: defaultdict(list))
    status = defaultdict(dict)
    for mode in ("cc", "archived", "live"):
        p = DATA / f"pages_{mode}.jsonl"
        if not p.exists():
            continue
        for line in open(p, encoding="utf-8"):
            d = json.loads(line)
            k = (str(d["year"]), d["cand_key"])
            if d["kind"] == "status":
                status[k][mode] = d
            elif d.get("text") and k in site and main_host(d["url"], site[k]):  # pages of the current site only
                pages[k][mode].append(d)
    texts, source, dropped = {}, {}, defaultdict(Counter)
    for k, by_mode in pages.items():
        # Archived text pools Common Crawl and Wayback captures; Common Crawl wins for a page both hold.
        pool, keys = [], set()
        for d in by_mode.get("cc", []) + by_mode.get("archived", []):
            pk = re.sub(r"^https?://(www\d?\.)?", "", d["url"].lower()).rstrip("/")
            if pk not in keys:
                keys.add(pk)
                pool.append(d)
        by_mode["pool"] = pool
        mode = "live" if (live2026 and k[0] == "2026") else "pool"
        if not by_mode.get(mode):
            continue
        paras, seen = [], set()
        docs = by_mode[mode]
        docs = [d for d in docs if d["kind"] == "home"][:1] + [d for d in docs if d["kind"] != "home"][:MAX_PAGES]
        for d in docs:
            for para in d["text"].split("\n"):
                para = strip_css(normalize(para)).strip()
                if not para or para.lower() in seen:
                    continue
                seen.add(para.lower())
                kind = para_kind(para)
                if paras_out is not None:
                    paras_out.append((k, para, kind))
                if kind:
                    dropped[k][kind] += len(para.split())
                else:
                    paras.append(para)
        texts[k] = "\n".join(paras)
        source[k] = mode if mode == "live" else "+".join(sorted({d["mode"] for d in by_mode[mode]}))
    return meta, texts, source, status, dropped


REVIEWED_CAMPAIGN = {("2022", "H2NJ03308")}  # flagged, but hand review found genuine issue posts by the candidate
# Passed screen(), but hand review found only site-builder page titles, each with the same site description.
REVIEWED_NOT_CAMPAIGN = {("2026", "H4TX14111"): "site-builder page titles only",
                         ("2026", "H6IL01191"): "site-builder page titles only"}


def screen(text, row, key=None):
    """Why a candidate-year's text is not campaign content, or "" when it is.

    Hosting-error or parked pages, and text with neither the candidate's name nor any campaign or
    political word.
    """
    if key in REVIEWED_CAMPAIGN:
        return ""
    if DEAD.search(text) and len(text.split()) < 400:
        return "hosting error or parked domain"
    names = [t for t in toks(row["name"]) if len(t) >= 4][-2:] or toks(row["name"])[-1:]
    if not CAMPAIGN.search(text) and not any(re.search(rf"\b{t}\b", text, re.I) for t in names):
        return "no candidate name or campaign words"
    return ""


def tokens(line):
    """Lowercased word tokens of one paragraph, with the possessive 's removed (Porter2 step 0)."""
    return [re.sub(r"'s$", "", t) for t in re.findall(r"[a-z0-9][a-z0-9'-]*[a-z0-9]|[a-z0-9]", line.lower())]


def gram_counts(text):
    """Occurrence counts of words (n = 1) and two- and three-word phrases, each formed within one paragraph."""
    out = {1: Counter(), 2: Counter(), 3: Counter()}
    for line in text.split("\n"):
        t = tokens(line)
        for n in (1, 2, 3):
            out[n].update(" ".join(t[i:i + n]) for i in range(len(t) - n + 1))
    return out


def welch(a, b):
    """Welch's t statistic per feature from per-candidate relative frequencies (Lijffijt et al. 2016, eq. 4).

    a and b are (N, sums, sums of squares, users) for the two groups. Features no candidate in either
    group uses never appear, so every feature has a positive variance in at least one group.
    """
    (na, sa, qa, ua), (nb, sb, qb, ub) = a, b
    vocab = sorted(set(sa) | set(sb))
    arr = lambda d: np.fromiter((d.get(w, 0.0) for w in vocab), float, len(vocab))
    ma, mb = arr(sa) / na, arr(sb) / nb
    va = np.clip((arr(qa) - na * ma * ma) / (na - 1), 0, None)
    vb = np.clip((arr(qb) - nb * mb * mb) / (nb - 1), 0, None)
    t = (ma - mb) / np.sqrt(va / na + vb / nb)
    return vocab, t, ma, mb


TOP = 40  # features listed per year, kind and party


def distinctive(analyzed, meta):
    """Words and phrases that most separate Democratic and Republican candidates, by year.

    Each candidate-year is one text. A feature's frequency in a text is its count divided by the text's
    number of features of the same length (words, two-word or three-word phrases), and the two parties'
    mean frequencies are compared by Welch's t-test, which treats texts rather than words as independent
    (Lijffijt et al. 2016). No words are removed beforehand (Monroe, Colaresi and Quinn 2008, sec. 3.2.3).
    Features are ranked by t; two- and three-word phrases are ranked together.
    """
    groups = defaultdict(lambda: [0, {n: Counter() for n in (1, 2, 3)}, {n: Counter() for n in (1, 2, 3)},
                                  {n: Counter() for n in (1, 2, 3)}])
    for k in sorted(analyzed):
        g = meta[k]["party_group"]
        if g not in ("Democratic", "Republican"):
            continue
        cell = groups[(k[0], g)]
        cell[0] += 1
        for n, c in gram_counts(analyzed[k]).items():
            total = sum(c.values())
            for w, v in c.items():
                f = v / total
                cell[1][n][w] += f
                cell[2][n][w] += f * f
                cell[3][n][w] += 1
    rows = []
    for y in sorted({k[0] for k in groups}):
        d, r = groups.get((y, "Democratic")), groups.get((y, "Republican"))
        if not d or not r or d[0] < 2 or r[0] < 2:
            continue
        scored = {}
        for n in (1, 2, 3):
            vocab, t, md, mr = welch((d[0], d[1][n], d[2][n], d[3][n]), (r[0], r[1][n], r[2][n], r[3][n]))
            pick = lambda idx: [(float(t[i]), vocab[i], float(md[i]), float(mr[i])) for i in idx[:TOP]]
            # vocab is sorted, so a stable sort keeps ties in alphabetical order
            scored[n] = (pick(np.argsort(-t, kind="stable")), pick(np.argsort(t, kind="stable")))
        for kind, ns in (("word", (1,)), ("phrase", (2, 3))):
            for i, (side, sign) in enumerate((("Democratic", 1), ("Republican", -1))):
                top = sorted((x for n in ns for x in scored[n][i]), key=lambda x: (-sign * x[0], x[1]))[:TOP]
                for rank, (t, w, md, mr) in enumerate(top, 1):
                    n = len(w.split())
                    rows.append([y, kind, side, rank, w, round(t, 2), round(md * 1e4, 3), round(mr * 1e4, 3),
                                 d[3][n][w], r[3][n][w], d[0], r[0]])
    return rows


DISTINCT_HEADER = ["year", "kind", "favors", "rank", "term", "welch_t", "dem_mean_per_10k", "rep_mean_per_10k",
                   "dem_candidates_using", "rep_candidates_using", "dem_analyzed", "rep_analyzed"]


def share_rows(analyzed, meta, pats):
    hits, denom = defaultdict(Counter), Counter()
    for k, t in analyzed.items():
        r = meta[k]
        for office in (r["office"], "All"):
            cell = (k[0], office, r["party_group"])
            denom[cell] += 1
            for th, lab, p in pats:
                if p.search(t):
                    hits[cell][lab] += 1
    return [[th, lab, *cell, hits[cell][lab], denom[cell], round(hits[cell][lab] / denom[cell], 4)]
            for th, lab, _ in pats for cell in sorted(denom)]


SHARE_HEADER = ["theme", "term", "year", "office", "party_group", "candidates_using", "candidates_analyzed", "share"]


def distinct(ranked, k=40):
    """Top k terms, skipping one that overlaps a higher-ranked term (one contains the other) with similar use."""
    out = []
    for z, term, ya, yb in ranked:
        tt = f" {term} "
        if any((tt in f" {o[1]} " or f" {o[1]} " in tt) and abs(ya - o[2]) <= max(2, 0.25 * max(ya, o[2]))
               and abs(yb - o[3]) <= max(2, 0.25 * max(yb, o[3])) for o in out):
            continue
        out.append((z, term, ya, yb))
        if len(out) == k:
            break
    return out


def match_sample(analyzed, meta, pats, n=20):
    """n candidate-years per term drawn at random from those using it, each shown at one random match."""
    rows = []
    for _, lab, p in pats:
        rng = random.Random(f"precision {lab}")
        users = [k for k in sorted(analyzed) if p.search(analyzed[k])]
        for k in rng.sample(users, min(n, len(users))):
            t = analyzed[k].replace("\n", " ")
            m = rng.choice(list(p.finditer(t)))
            a = t.rfind(" ", 0, max(0, m.start() - 160)) + 1
            b = t.find(" ", m.end() + 160)
            r = meta[k]
            rows.append([lab, k[0], r["party_group"], k[1], r["name"], t[a:m.start()], m.group(0), t[m.end():b if b > 0 else None]])
    return rows


def close(dem_share):
    """Mayhew's narrow marginality band: 45 to under 55 percent Democratic of the two-party vote (Polity 1974)."""
    return 0.45 <= dem_share < 0.55


def selection(meta, analyzed):
    """Analyzed against unanalyzed candidates by year and party: incumbency, wins, vote share, race and seat partisanship."""
    res = {(r["year"], r["bp_url"]): r for r in csv.DictReader(open(DATA / "results.csv", encoding="utf-8"))}
    pres = {(r["year"], r["bp_url"]): r["pres_dem_two_party"]
            for r in csv.DictReader(open(DATA / "seat_pres.csv", encoding="utf-8")) if r["pres_dem_two_party"]}
    cells = defaultdict(list)
    for k, r in meta.items():
        if r["party_group"] in ("Democratic", "Republican"):
            cells[(k[0], r["party_group"], "analyzed" if k in analyzed else "not analyzed")].append(
                (r, res.get((k[0], r["bp_url"])), pres.get((k[0], r["bp_url"]))))
    out = []
    for (y, g, a), items in sorted(cells.items()):
        x = [v for _, v, _ in items if v and v["vote_share"] != ""]
        part = [float(v["dem_two_party"]) for v in x if v["dem_two_party"] not in ("", "0.0", "1.0")]
        seat = [float(p) for _, _, p in items if p]
        mean = lambda xs: round(sum(xs) / len(xs), 3) if xs else ""
        out.append([y, g, a, len(items), mean([int(r["incumbent"]) for r, _, _ in items]), len(x),
                    mean([int(v["won"]) for v in x]), mean([float(v["vote_share"]) for v in x]),
                    mean([close(p) for p in part]), mean([abs(p - 0.5) for p in part]),
                    len(seat), mean([close(p) for p in seat]), mean([abs(p - 0.5) for p in seat])])
    return out


SELECTION_HEADER = ["year", "party_group", "group", "candidates", "incumbent_share", "with_results", "won_share",
                    "mean_vote_share", "close_race_share", "mean_two_party_margin_from_even",
                    "with_seat_presidential", "close_seat_share", "mean_seat_presidential_margin_from_even"]


def analyzed_texts(min_words=MIN_WORDS, loaded=None):
    """meta, texts, source, dropped, words, excluded (key: reason) and analyzed (key: screened text).

    Every dict is in sorted key order, so outputs do not depend on the order of the page files.
    loaded reuses a load_texts() result; min_words other than MIN_WORDS serves the sensitivity check.
    """
    meta, texts, source, status, dropped = loaded or load_texts()
    texts = {k: texts[k] for k in sorted(texts) if k in meta}
    words = {k: len(t.split()) for k, t in texts.items()}
    # Excluded: text that reached min_words but is not campaign content, either as a whole (screen) or
    # because what remains after dropping spam, placeholder and Spanish paragraphs is under min_words.
    excluded = {}
    for k, t in texts.items():
        if words[k] >= min_words and dropped[k]["spam"] >= words[k]:
            excluded[k] = "spam"  # a spam domain, not a campaign site carrying some injected spam
        elif words[k] >= min_words:
            excluded[k] = REVIEWED_NOT_CAMPAIGN.get(k) or screen(t, meta[k], k)
        elif words[k] + sum(v for why, v in dropped[k].items() if why != "page code") >= min_words:
            excluded[k] = max(sorted(why for why in dropped[k] if why != "page code"), key=dropped[k].get)
    excluded = {k: why for k, why in excluded.items() if why}
    analyzed = {k: t for k, t in texts.items() if words[k] >= min_words and k not in excluded}
    return meta, texts, source, dropped, words, excluded, analyzed


def main():
    loaded = load_texts()
    meta, texts, source, dropped, words, excluded, analyzed = analyzed_texts(loaded=loaded)
    RESULTS.mkdir(exist_ok=True)
    long_enough = {k: t for k, t in texts.items() if words[k] >= MIN_WORDS or k in excluded}
    with open(RESULTS / "excluded_sites.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["year", "cand_key", "name", "party_group", "website", "reason", "words_collected", "words_kept",
                    "text_start"])
        for k in sorted(excluded):
            r, t = meta[k], texts[k]
            w.writerow([k[0], k[1], r["name"], r["party_group"], r["website"], excluded[k],
                        words[k] + sum(dropped[k].values()), words[k], t[:300].replace("\n", " | ")])
    pats = [(th, lab, re.compile(rx, re.I)) for th, lab, rx in TERMS]
    _, live_texts, _, _, _ = load_texts(live2026=True)
    live = {k: t for k, t in live_texts.items() if k[0] == "2026" and len(t.split()) >= MIN_WORDS and k in meta
            and not screen(t, meta[k], k)}

    with open(RESULTS / "term_matches_sample.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["term", "year", "party_group", "cand_key", "name", "before", "match", "after"])
        w.writerows(match_sample(analyzed, meta, pats))
    with open(RESULTS / "selection.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(SELECTION_HEADER)
        w.writerows(selection(meta, analyzed))
    # Candidates (by Ballotpedia page) analyzed in two or more of the four years.
    years_of = defaultdict(set)
    for k in analyzed:
        years_of[meta[k]["bp_url"]].add(k[0])
    panel = {k: t for k, t in analyzed.items() if len(years_of[meta[k]["bp_url"]]) >= 2}
    with open(RESULTS / "term_shares_panel.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(SHARE_HEADER)
        w.writerows(r for r in share_rows(panel, meta, pats) if r[3] == "All")
    with open(RESULTS / "term_shares_2026_live.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(SHARE_HEADER)
        w.writerows(share_rows(live, meta, pats))

    cov = Counter()
    for k, r in meta.items():
        g = (r["year"], r["office"], r["party_group"])
        cov[g + ("candidates",)] += 1
        cov[g + ("website_known",)] += bool(r["website"])
        cov[g + ("any_text",)] += k in texts
        cov[g + ("min_words_met",)] += k in long_enough
        cov[g + ("excluded",)] += k in excluded
        cov[g + ("analyzed",)] += k in analyzed
    cols = ("candidates", "website_known", "any_text", "min_words_met", "excluded", "analyzed")
    with open(RESULTS / "coverage.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["year", "office", "party_group", *cols])
        for y, o, g in sorted({k[:3] for k in cov}):
            w.writerow([y, o, g] + [cov[(y, o, g, m)] for m in cols])

    # Checks: term shares at other minimum lengths (screened by the same rules; exclusions at 100 words
    # were read by hand, the others were not), and site length by party and year.
    with open(RESULTS / "term_shares_min_words.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["min_words"] + SHARE_HEADER)
        for m in (50, MIN_WORDS, 200):
            sub = analyzed if m == MIN_WORDS else analyzed_texts(m, loaded)[-1]
            w.writerows([m] + r for r in share_rows(sub, meta, pats) if r[3] == "All")
    lengths = defaultdict(list)
    for k in analyzed:
        lengths[(k[0], meta[k]["party_group"])].append(words[k])
    with open(RESULTS / "site_length.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["year", "party_group", "analyzed", "words_p25", "words_median", "words_p75", "words_mean"])
        for (y, g), v in sorted(lengths.items()):
            v.sort()
            q = lambda p: v[min(len(v) - 1, int(p * len(v)))]
            w.writerow([y, g, len(v), q(0.25), q(0.5), q(0.75), round(sum(v) / len(v))])

    with open(RESULTS / "term_shares.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(SHARE_HEADER)
        w.writerows(share_rows(analyzed, meta, pats))

    added = [(th, lab, re.compile(rx, re.I)) for th, lab, rx in ADDED_TERMS]
    with open(RESULTS / "term_shares_added.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(SHARE_HEADER)
        w.writerows(share_rows(analyzed, meta, added))

    with open(RESULTS / "distinctive_terms.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(DISTINCT_HEADER)
        w.writerows(distinctive(analyzed, meta))

    # Keyword-in-context examples: up to 4 candidates per term, year and party, sampled reproducibly.
    rng = random.Random(11)
    kwic = defaultdict(list)
    keys = sorted(analyzed)
    rng.shuffle(keys)
    for k in keys:
        r = meta[k]
        if r["party_group"] not in ("Democratic", "Republican", "Independent"):
            continue
        t = analyzed[k].replace("\n", " ")
        for th, lab, p in pats:
            slot = kwic[(lab, k[0], r["party_group"])]
            if len(slot) >= 4:
                continue
            m = p.search(t)
            if not m:
                continue
            a, b = max(0, m.start() - 110), min(len(t), m.end() + 110)
            a = t.rfind(" ", 0, a) + 1 if a else 0
            b = t.find(" ", b) if t.find(" ", b) > 0 else len(t)
            where = f'{r["state"]}-{"Sen" if r["office"] == "Senate" else r["district"]}'
            slot.append(dict(name=r["name"], where=where, pre=t[a:m.start()], hit=m.group(0), post=t[m.end():b]))
    json.dump([dict(term=k[0], year=k[1], party_group=k[2], examples=v) for k, v in kwic.items()],
              open(RESULTS / "examples.json", "w", encoding="utf-8"), ensure_ascii=False)

    stats = {"live_2026_analyzed": len(live), "candidate_years_in_list": len(meta), "with_text": len(texts),
             "min_words_met": len(long_enough), "excluded_not_campaign": len(excluded), "analyzed": len(analyzed),
             "panel_candidates": sum(len(v) >= 2 for v in years_of.values()), "panel_candidate_years": len(panel),
             "min_words": MIN_WORDS, "source_counts": Counter(source[k] for k in analyzed),
             "median_words": sorted(len(t.split()) for t in analyzed.values())[len(analyzed) // 2] if analyzed else 0}
    json.dump(stats, open(RESULTS / "corpus_stats.json", "w"), indent=1, default=dict)
    print(json.dumps(stats, default=dict))


if __name__ == "__main__":
    main()
