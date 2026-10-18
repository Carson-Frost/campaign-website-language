"""Build the data files the public-site mockups read, from the study's own code and tracked results.

Run with the project's virtual environment, from the project root:

    artifacts/.venv/Scripts/python design/mockups/build_data.py

It writes into the ignored artifacts/mockup-data/:
site.json (the tracked results tables the pages show, plus one row per Democratic or Republican
candidate-year with its attributes, its status at each step and which of the 57 terms it used) and
excerpts/<n>.json (one short excerpt per candidate-year using term n, with the day its page was saved,
and the archive when that is not Common Crawl). The candidate table is the derived table the brief calls
for; it holds counts and short excerpts, never page text.

Two columns are added to the tracked tables so that the page rounds every printed figure once, from an
exact value. term_gaps.csv holds each adjusted p-value to three significant figures, so each gap row also
carries q_benjamini_hochberg_exact, the value before that rounding. Each selection row carries the counts
(incumbents, winners) behind its two shares. Both are checked against the tracked tables as they are made.

Two more things are added, each computed from the study's own files and checked against the tracked table:
the true median of the words on the analyzed sites of each party and year (site_length.csv holds the upper of
the two middle values where the count is even, so words_median in site.json is replaced by the mean of the two),
and, from the candidate list, how many candidate-years the build leaves out of the major parties by a party
label it does not recognize and by a repeated FEC candidate number (candidate_list).
"""
import csv
import json
import re
import sys
from bisect import bisect_right
from collections import Counter, defaultdict
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[2]
OUT = PROJECT / "artifacts" / "mockup-data"
sys.path.insert(0, str(PROJECT / "tools"))

import analyze  # noqa: E402
import inference  # noqa: E402
from common import DATA  # noqa: E402
from sites import main_host, norm_site  # noqa: E402
from terms import TERMS  # noqa: E402

PARTIES = ("Democratic", "Republican")
RES = PROJECT / "results"
# "Working Families Tax Cut(s)" is a bill's name: a site whose every match of the working-families pattern is
# inside that name is flagged (the candidate's "bill" field), so the page can mark the share it affects.
WORKING_FAMILIES = next(i for i, (_, lab, _) in enumerate(TERMS) if lab == "working families")
BILL_NAME = re.compile(r"\bworking famil(?:y|ies)\b(?=['’]?s?\s+tax\s+cuts?\b)", re.I)


def rows(name):
    return list(csv.DictReader(open(RES / name, encoding="utf-8")))


def num(v):
    if v == "":
        return None
    try:
        f = float(v)
    except ValueError:
        return v
    return int(f) if f.is_integer() and "." not in v and "e" not in v else f


def table(name, keep=None):
    out = []
    for r in rows(name):
        if keep and not keep(r):
            continue
        out.append({k: num(v) for k, v in r.items()})
    return out


def exact_adjusted_q():
    """Benjamini-Hochberg q for every gap, before term_gaps.csv rounds it to three significant figures.

    Repeats inference.term_gaps: the Fisher p-value of each term and year from term_shares.csv, adjusted
    within its wave of years. Stops the build if the three-figure rounding of any value differs from the
    tracked table, so the exact values are those of the table's own run.
    """
    cells = {}
    for r in rows("term_shares.csv"):
        if r["office"] == "All" and r["party_group"] in PARTIES:
            cells[(r["term"], r["year"], r["party_group"])] = (int(r["candidates_using"]), int(r["candidates_analyzed"]))
    keys = sorted({(t, y) for t, y, _ in cells})
    p = {}
    for t, y in keys:
        (kd, nd), (kr, nr) = cells[(t, y, "Democratic")], cells[(t, y, "Republican")]
        p[(t, y)] = inference.fisher_exact(kd, nd - kd, kr, nr - kr)
    q = {}
    for wave in sorted({inference.wave_of(y) for _, y in keys}):
        ks = [k for k in keys if inference.wave_of(k[1]) == wave]
        q.update(zip(ks, inference.benjamini_hochberg([p[k] for k in ks])))
    for r in rows("term_gaps.csv"):
        assert f"{q[(r['term'], r['year'])]:.3g}" == r["q_benjamini_hochberg"], (r["term"], r["year"])
    assert len(q) == len(rows("term_gaps.csv"))
    return q


def page_provenance(meta):
    """For each candidate-year, its analyzed paragraphs in order, each with the page that supplied it.

    Repeats the page selection and paragraph order of analyze.load_texts for the election-year window
    (pages_cc_year.jsonl pooled with pages_archived.jsonl, a Common Crawl page winning over a Wayback
    copy of the same address, the home page and up to MAX_PAGES others in file order, a paragraph kept
    once by its lower-cased text). main() checks that the paragraphs rejoin to exactly the text
    analyze.analyzed_texts returns, so any drift in analyze.py stops the build.
    """
    site = {k: norm_site(r["website"])[0] for k, r in meta.items() if r["website"]}
    pages = defaultdict(lambda: defaultdict(list))
    for mode, name in (("cc", f"pages_cc_{analyze.WINDOW}.jsonl"), ("archived", "pages_archived.jsonl")):
        for line in open(DATA / name, encoding="utf-8"):
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


LABEL_LETTER = re.compile(r"^[DR]\s*/")


def candidate_list_losses(meta):
    """Major-party candidate-years the build leaves out, counted from the candidate files.

    label: candidate-years in the candidate-year table (sites_input.csv) grouped as third party although the
    label begins with D or R and a slash, as in "D / Working Families Party" (common.party_group does not
    read a single letter before a slash).
    repeated: candidate-years in candidates.csv that build_input.main drops because an earlier row of the same
    year has the same FEC candidate number (the key) and belongs to another candidate (another Ballotpedia page);
    a candidate on two ballots in one year shares a page and is rightly one candidate-year. Counted when the
    label is a Democratic or Republican one, whatever the group the label was given.
    """
    label = [r for r in meta.values() if r["party_group"] == "Third party" and LABEL_LETTER.match(r["party"] or "")]
    first, repeated = {}, []
    for r in csv.DictReader(open(DATA / "candidates.csv", encoding="utf-8")):
        key = (r["year"], r["fec_id"] or r["bp_url"].rsplit("/", 1)[-1])
        if key not in first:
            first[key] = r
        elif first[key]["bp_url"] != r["bp_url"] and (r["party_group"] in PARTIES or LABEL_LETTER.match(r["party"] or "")):
            repeated.append(r)
    assert len(meta) == len(first)  # the table build_input.py wrote is the first row of each key
    return dict(label=len(label), repeated=len(repeated))


def main():
    loaded = analyze.load_texts()
    meta, texts, source, dropped, words, excluded, analyzed = analyze.analyzed_texts(loaded=loaded)
    pats = [re.compile(rx, re.I) for _, _, rx in TERMS]
    prov = page_provenance(meta)
    for k, t in texts.items():  # every candidate-year, not only the analyzed ones
        assert "\n".join(p for p, _ in prov.get(k, [])) == t, f"page provenance does not rebuild the text of {k}"

    # Pages and latest capture per candidate-year, as the analysis reads them.
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

    # Returning candidates, as analyze.py defines its panel: analyzed in two or more years, any party.
    years_of = defaultdict(set)
    for k in analyzed:
        years_of[meta[k]["bp_url"]].add(k[0])

    cands, excerpts = [], defaultdict(dict)
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
        p = pres.get((k[0], r["bp_url"]))
        c = dict(id=f"{k[0]}-{k[1]}", year=int(k[0]), name=r["name"], party=r["party_group"][0],
                 office=r["office"], state=r["state"], district=r["district"], inc=int(r["incumbent"]),
                 won=(int(v["won"]) if v and v["won"] != "" else None),
                 seat=(None if not p else ("close" if analyze.close(float(p)) else "safe")),
                 site=(norm_site(r["website"])[0] if r["website"] else ""), src=r["website_source"],
                 status=status, why=excluded.get(k, ""), pages=pages.get(k, 0), latest=latest.get(k, ""),
                 words=words.get(k, 0), dropped=sum(dropped[k].values()) if k in dropped else 0,
                 returning=int(len(years_of[r["bp_url"]]) >= 2))
        if status == "analyzed":
            t = analyzed[k]  # matched as the analysis matches it, within paragraphs
            flat = t.replace("\n", " ")
            # Each paragraph's span in t and the page that supplied it.
            spans, at = [], 0
            for para, d in prov[k]:
                spans.append((at, at + len(para), d))
                at += len(para) + 1
            starts = [s for s, _, _ in spans]
            used = []
            for i, pat in enumerate(pats):
                m = pat.search(t)
                if not m:
                    continue
                used.append(i)
                assert "\n" not in m.group(0)  # a match lies inside one paragraph, so inside one page
                j = bisect_right(starts, m.start()) - 1
                day = spans[j][2]["timestamp"][:8]
                # The window may take in neighboring paragraphs, but only those of a page saved the same day,
                # so the day printed under the excerpt is true of all of its text.
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
                assert main_host(page["url"], c["site"])  # the page is of the site named under the excerpt
                e = [flat[a:m.start()], m.group(0), flat[m.end():b], day]
                if page["mode"] != "cc":
                    e.append(page["mode"])  # "archived": a Wayback Machine copy, not Common Crawl
                excerpts[i][c["id"]] = e
            c["terms"] = used
            if WORKING_FAMILIES in used and all(BILL_NAME.match(t, m.start()) for m in pats[WORKING_FAMILIES].finditer(t)):
                c["bill"] = 1
        cands.append(c)

    out = dict(
        terms=[dict(theme=th, term=lab) for th, lab, _ in TERMS],
        candidates=cands,
        shares=table("term_shares.csv", lambda r: r["party_group"] in PARTIES),
        gaps=table("term_gaps.csv"),
        classes=table("term_classes.csv"),
        bounds=table("term_bounds.csv", lambda r: r["party_group"] in PARTIES),
        panel=table("term_shares_panel.csv", lambda r: r["party_group"] in PARTIES),
        windows=table("term_shares_windows.csv"),
        min_words=table("term_shares_min_words.csv", lambda r: r["party_group"] in PARTIES),
        coverage=table("coverage.csv", lambda r: r["party_group"] in PARTIES),
        coverage_windows=table("coverage_windows.csv"),
        selection=table("selection.csv"),
        site_length=table("site_length.csv", lambda r: r["party_group"] in PARTIES),
        precision=table("term_precision.csv"),
        excluded=table("excluded_sites.csv", lambda r: r["party_group"] in PARTIES),
        crosscheck=table("list_crosscheck.csv", lambda r: r["party_group"] in PARTIES),
        distinctive=table("distinctive_terms.csv"),
        returning_people=len({meta[k]["bp_url"] for k in analyzed
                              if meta[k]["party_group"] in PARTIES and len(years_of[meta[k]["bp_url"]]) >= 2}),
    )
    for e in out["excluded"]:
        e.pop("text_start", None)
    # The true median of each party and year's analyzed site lengths, from the same words that site_length.csv
    # summarizes: its words_median is the upper of the two middle values (v[n // 2]) wherever n is even.
    lengths = defaultdict(list)
    for k in analyzed:
        lengths[(int(k[0]), meta[k]["party_group"])].append(words[k])
    for row in out["site_length"]:
        v = sorted(lengths[(row["year"], row["party_group"])])
        n = len(v)
        assert (n, round(sum(v) / n), v[n // 2]) == (row["analyzed"], row["words_mean"], row["words_median"]), row
        mid = (v[(n - 1) // 2] + v[n // 2]) / 2
        row["words_median"] = int(mid) if mid == int(mid) else mid
    out["candidate_list"] = candidate_list_losses(meta)
    exact = exact_adjusted_q()
    for g in out["gaps"]:
        g["q_benjamini_hochberg_exact"] = exact[(g["term"], str(g["year"]))]
    # The counts behind each selection share: incumbents among the group, winners among those with a result.
    for s in out["selection"]:
        if s["party_group"] not in PARTIES:
            continue
        grp = [c for c in cands if c["year"] == s["year"] and c["party"] == s["party_group"][0]
               and (c["status"] == "analyzed") == (s["group"] == "analyzed")]
        done = [c for c in grp if c["won"] is not None]
        s["incumbents"], s["winners"] = sum(c["inc"] for c in grp), sum(c["won"] for c in done)
        assert (len(grp), len(done)) == (s["candidates"], s["with_results"]), s
        assert round(s["incumbents"] / len(grp), 3) == s["incumbent_share"], s
        assert (round(s["winners"] / len(done), 3) if done else None) == s["won_share"], s
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "excerpts").mkdir(exist_ok=True)
    json.dump(out, open(OUT / "site.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    for i in range(len(TERMS)):
        json.dump(excerpts[i], open(OUT / "excerpts" / f"{i}.json", "w", encoding="utf-8"), ensure_ascii=False,
                  separators=(",", ":"))
    print(Counter(c["status"] for c in cands), len(cands))


if __name__ == "__main__":
    main()
