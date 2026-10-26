"""Build site data for the single-search UI.

Loads TERMS from tools/terms.py (28 clusters + top singletons from the extracted master list),
runs analyze.share_rows to compute per-party-cycle shares for every TERM, and adds a search index
of per-party-cycle shares for every term in tools/output/master_candidates.csv (so the UI can draw
a chart for any typed term that resolves to one). Candidate and excerpt tables are preserved for
the drawer.

Writes into the ignored artifacts/site-data/:
site.json (terms, candidates, shares, gaps, search_index, and empty arrays for the
tracked tables the old UI consumed) and excerpts/<n>.json (one short excerpt per candidate-year
using term n). Also writes site/terms-display.json so display names are regenerated from the live
TERMS list.
"""
import csv
import json
import re
import sys
from bisect import bisect_right
from collections import Counter, defaultdict
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
OUT = PROJECT / "site" / "data"
sys.path.insert(0, str(PROJECT / "tools"))

import analyze  # noqa: E402
from common import DATA  # noqa: E402
from sites import main_host, norm_site  # noqa: E402
from terms import TERMS, TOPIC_MAP, TOPICS_ORDER  # noqa: E402

PARTIES = ("Democratic", "Republican")
PCODE = {"Democratic": "D", "Republican": "R"}
MASTER_CSV = PROJECT / "tools" / "output" / "master_candidates.csv"
DISPLAY_PATH = PROJECT / "site" / "terms-display.json"


SMALL_WORDS = {"a", "an", "the", "and", "but", "or", "nor", "for", "of", "in", "on", "at", "to",
               "by", "as", "up", "with", "from", "into"}


def title_case(text):
    """Title case respecting workspace rules: every label starts with a capital."""
    words = text.split()
    out = []
    for i, w in enumerate(words):
        wl = w.lower()
        if 0 < i < len(words) - 1 and wl in SMALL_WORDS:
            out.append(wl)
        elif w and (w[0].isalpha() or w[0].isdigit()):
            out.append(w[0].upper() + w[1:])
        else:
            out.append(w)
    return " ".join(out)


def page_provenance(meta):
    """For each candidate-year, its analyzed paragraphs in order, each with the page that supplied it."""
    site = {k: norm_site(r["website"])[0] for k, r in meta.items() if r["website"]}
    pages = defaultdict(lambda: defaultdict(list))
    for mode, name in (("cc", f"pages_cc_{analyze.WINDOW}.jsonl"), ("archived", "pages_archived.jsonl")):
        p = DATA / name
        if not p.exists():
            continue
        for line in open(p, encoding="utf-8"):
            d = json.loads(line)
            k = (str(d["year"]), d["cand_key"])
            if d["kind"] != "status" and d.get("text") and k in site and main_host(d["url"], site[k]):
                pages[k][mode].append(d)
    out = {}
    for k, by_mode in pages.items():
        pool, keys = [], set()
        for d in by_mode.get("cc", []) + by_mode.get("archived", []):
            pk = re.sub(r"^https?://(www\d?\.)?", "", d["url"].lower()).rstrip("/")
            if pk not in keys:
                keys.add(pk)
                pool.append(d)
        docs = [d for d in pool if d["kind"] == "home"][:1] + [d for d in pool if d["kind"] != "home"][:analyze.MAX_PAGES]
        seen, paras = set(), []
        for d in docs:
            for para in d["text"].split("\n"):
                para = analyze.strip_css(analyze.normalize(para)).strip()
                if not para or para.lower() in seen:
                    continue
                seen.add(para.lower())
                if not analyze.para_kind(para):
                    paras.append((para, d))
        out[k] = paras
    return out


def search_index(analyzed, meta):
    """Per-party-cycle k and n for every term in tools/output/master_candidates.csv.

    Set-membership against gram_counts, so no regex is run per term.
    """
    terms = [r["term"] for r in csv.DictReader(open(MASTER_CSV, encoding="utf-8"))]
    want_by_n = {1: set(), 2: set(), 3: set()}
    for t in terms:
        n = len(t.split())
        if 1 <= n <= 3:
            want_by_n[n].add(t)
    cand_grams = {}
    for k, text in analyzed.items():
        gc = analyze.gram_counts(text)
        s = set()
        for n in (1, 2, 3):
            s |= want_by_n[n] & set(gc[n])
        cand_grams[k] = s
    denom = Counter()
    users = defaultdict(Counter)
    for k in analyzed:
        p = PCODE.get(meta[k]["party_group"])
        if not p:
            continue
        y = int(k[0])
        denom[(y, p)] += 1
        for t in cand_grams[k]:
            users[t][(y, p)] += 1
    out = []
    for t in terms:
        shares = []
        for y in (2020, 2022, 2024, 2026):
            for p in ("D", "R"):
                shares.append({"year": y, "party": p,
                               "k": users[t].get((y, p), 0),
                               "n": denom.get((y, p), 0)})
        out.append({"term": t, "shares": shares})
    return out


def main():
    loaded = analyze.load_texts()
    meta, texts, _, dropped, words, excluded, analyzed = analyze.analyzed_texts(loaded=loaded)
    pats = [(th, lab, re.compile(rx, re.I)) for th, lab, rx in TERMS]
    prov = page_provenance(meta)

    site = {k: norm_site(r["website"])[0] for k, r in meta.items() if r["website"]}
    pages, latest = Counter(), {}
    for line in open(DATA / "pages_cc_year.jsonl", encoding="utf-8"):
        d = json.loads(line)
        k = (str(d["year"]), d["cand_key"])
        if d["kind"] != "status" and d.get("text") and k in site and main_host(d["url"], site[k]):
            pages[k] += 1
            latest[k] = max(latest.get(k, ""), d["timestamp"][:8])

    res = {(r["year"], r["bp_url"]): r for r in csv.DictReader(open(DATA / "results.csv", encoding="utf-8"))}
    pres = {(r["year"], r["bp_url"]): r["pres_dem_two_party"]
            for r in csv.DictReader(open(DATA / "seat_pres.csv", encoding="utf-8")) if r["pres_dem_two_party"]}

    years_of = defaultdict(set)
    for k in analyzed:
        years_of[meta[k]["bp_url"]].add(k[0])

    cands, excerpts = [], defaultdict(dict)
    pats_only = [p for _, _, p in pats]
    for k in sorted(meta):
        r = meta[k]
        if r["party_group"] not in PARTIES:
            continue
        if not r["website"]:
            status = "no website"
        elif k not in texts:
            status = "no saved text"
        elif k in excluded:
            status = "excluded"
        elif k not in analyzed:
            status = "under 100 words"
        else:
            status = "analyzed"
        v = res.get((k[0], r["bp_url"]))
        p_pres = pres.get((k[0], r["bp_url"]))
        c = dict(id=f"{k[0]}-{k[1]}", year=int(k[0]), name=r["name"], party=r["party_group"][0],
                 office=r["office"], state=r["state"], district=r["district"], inc=int(r["incumbent"]),
                 won=(int(v["won"]) if v and v["won"] != "" else None),
                 seat=(None if not p_pres else ("close" if analyze.close(float(p_pres)) else "safe")),
                 site=(norm_site(r["website"])[0] if r["website"] else ""), src=r["website_source"],
                 status=status, why=excluded.get(k, ""), pages=pages.get(k, 0), latest=latest.get(k, ""),
                 words=words.get(k, 0), dropped=sum(dropped[k].values()) if k in dropped else 0,
                 returning=int(len(years_of[r["bp_url"]]) >= 2))
        if status == "analyzed":
            t = analyzed[k]
            flat = t.replace("\n", " ")
            spans, at = [], 0
            for para, d in prov[k]:
                spans.append((at, at + len(para), d))
                at += len(para) + 1
            starts = [s for s, _, _ in spans]
            used = []
            for i, pat in enumerate(pats_only):
                m = pat.search(t)
                if not m:
                    continue
                used.append(i)
                j = bisect_right(starts, m.start()) - 1
                day = spans[j][2]["timestamp"][:8]
                lo, hi = j, j
                while lo > 0 and spans[lo - 1][2]["timestamp"][:8] == day:
                    lo -= 1
                while hi + 1 < len(spans) and spans[hi + 1][2]["timestamp"][:8] == day:
                    hi += 1
                a, b = max(0, m.start() - 90), min(len(t), m.end() + 90)
                a = flat.rfind(" ", 0, a) + 1 if a else 0
                b = flat.find(" ", b) if flat.find(" ", b) > 0 else len(t)
                a, b = max(a, spans[lo][0]), min(b, spans[hi][1])
                page = spans[j][2]
                e = [flat[a:m.start()], m.group(0), flat[m.end():b], day]
                if page["mode"] != "cc":
                    e.append(page["mode"])
                excerpts[i][c["id"]] = e
            c["terms"] = used
        cands.append(c)

    shares_rows = analyze.share_rows(analyzed, meta, pats)
    shares_json = [
        dict(theme=r[0], term=r[1], year=int(r[2]), office=r[3], party_group=r[4],
             candidates_using=r[5], candidates_analyzed=r[6], share=r[7])
        for r in shares_rows if r[4] in PARTIES
    ]

    cov = Counter()
    for k, r in meta.items():
        if r["party_group"] not in PARTIES:
            continue
        g = (int(k[0]), r["office"], r["party_group"])
        cov[g + ("candidates",)] += 1
        cov[g + ("website_known",)] += bool(r["website"])
        cov[g + ("any_text",)] += k in texts
        cov[g + ("analyzed",)] += k in analyzed
    coverage_json = []
    for y, o, pg in sorted({k[:3] for k in cov}):
        coverage_json.append(dict(year=y, office=o, party_group=pg,
                                  candidates=cov[(y, o, pg, "candidates")],
                                  website_known=cov[(y, o, pg, "website_known")],
                                  any_text=cov[(y, o, pg, "any_text")],
                                  analyzed=cov[(y, o, pg, "analyzed")]))

    index = search_index(analyzed, meta)

    out = dict(
        terms=[dict(theme=th, term=lab, topics=TOPIC_MAP.get(lab, ["Other"])) for th, lab, _ in TERMS],
        topics_list=TOPICS_ORDER,
        candidates=cands,
        shares=shares_json,
        gaps=[],         # inference tables not recomputed for the discovery UI
        classes=[],
        bounds=[],
        panel=[],
        windows=[],
        min_words=[],
        coverage=coverage_json,
        coverage_windows=[],
        selection=[],
        site_length=[],
        precision=[],
        excluded=[],
        crosscheck=[],
        distinctive=[],
        candidate_list=dict(label=0, repeated=0),
        returning_people=sum(1 for v in years_of.values() if len(v) >= 2),
        search_index=index,
    )

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "excerpts").mkdir(exist_ok=True)
    json.dump(out, open(OUT / "site.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    for i in range(len(TERMS)):
        json.dump(excerpts[i], open(OUT / "excerpts" / f"{i}.json", "w", encoding="utf-8"),
                  ensure_ascii=False, separators=(",", ":"))

    # Regenerate display names so every TERM has a chart title ready: quoted title-cased label.
    display = {"terms": {lab: f"“{title_case(lab)}”" for _, lab, _ in TERMS}}
    DISPLAY_PATH.write_text(json.dumps(display, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    print(f"TERMS: {len(TERMS)}")
    print(f"candidates: {len(cands)} ({Counter(c['status'] for c in cands)})")
    print(f"shares rows: {len(shares_json)}")
    print(f"search_index: {len(index)}")


if __name__ == "__main__":
    main()
