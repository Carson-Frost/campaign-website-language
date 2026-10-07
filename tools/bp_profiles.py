"""Read each candidate's Ballotpedia page: campaign website links, quoted website text and survey answers.

Writes artifacts/data/bp_profiles.jsonl, one JSON object per Ballotpedia page.
"""
import csv
import json
import re
import sys

from common import DATA, fetch, text_of

QUOTE_INTRO = re.compile(r"campaign website[^<.]{0,80}?(?:stated|listed|highlighted|said|included|featured)[^<:]{0,60}:", re.I)


def infobox_links(t):
    out = {}
    for href, label in re.findall(r'<div class="widget-row value-only white"><a href="([^"]+)"[^>]*>([^<]+)</a>', t):
        out.setdefault(label.strip(), []).append(href)
    return out


def footnote(t, note):
    i = t.find(f'id="cite_note-{note}"')
    if i < 0:
        return None, None
    li = t[i: t.find("</li>", i)]
    href = re.search(r'class="external[^"]*" [^>]*href="([^"]+)"|href="(https?://[^"]+)"[^>]*class="external', li)
    href = href and (href.group(1) or href.group(2))
    acc = re.search(r"accessed ([A-Z][a-z]+ \d{1,2}, \d{4})", text_of(li))
    return href, acc and acc.group(1)


def website_quotes(t, seg):
    out = []
    for m in QUOTE_INTRO.finditer(seg):
        rest = seg[m.end(): m.end() + 200000]
        bq, tb = rest.find("<blockquote"), rest.find("<table")
        if bq >= 0 and (tb < 0 or bq < tb):
            end = rest.find("</blockquote>", bq)
            body = rest[bq:end]
            attr = re.search(r'<a href="([^"]+)"[^>]*>campaign website</a>\s*\(([^)]*)\)', rest[end:end + 1500])
            url, when = (attr.group(1), attr.group(2)) if attr else (None, None)
        elif tb >= 0:
            end = rest.find("</table>", tb)
            body = rest[tb:end]
            note = re.search(r'href="#cite_note-([^"]+)"', rest[tb:end + 2000])
            url, when = footnote(t, note.group(1)) if note else (None, None)
            body = re.sub(r"<cite.*?</cite>", " ", body, flags=re.S)
        else:
            continue
        txt = text_of(body)
        if len(txt) > 40:
            out.append({"text": txt, "url": url, "when": when})
    return out


def survey(seg):
    out = []
    for q, a in re.findall(r'<p class="panel-title"[^>]*>(.*?)</p>.*?<div class="answers-container">(.*?)</div></div></div>', seg, re.S):
        out.append({"q": text_of(q), "a": text_of(a)})
    return out


def parse(t):
    prof = {"links": infobox_links(t), "years": {}}
    i = t.find('id="Campaign_themes"')
    if i < 0:
        return prof
    j = t.find("<h2>", i + 50)
    sec = t[i: j if j > 0 else None]
    heads = [(m.start(), m.group(1)) for m in re.finditer(r'<h3><span class="mw-headline" id="(\d{4})[^"]*"', sec)]
    segs = [(y, sec[s: heads[k + 1][0] if k + 1 < len(heads) else None]) for k, (s, y) in enumerate(heads)] or [("", sec)]
    for y, seg in segs:
        entry = {"website": website_quotes(t, seg), "survey": survey(seg)}
        if entry["website"] or entry["survey"]:
            prof["years"][y] = entry
    return prof


def main(lists):
    urls = []
    for r in (r for name in lists for r in csv.DictReader(open(DATA / name, encoding="utf-8"))):
        if r["bp_url"] not in urls:
            urls.append(r["bp_url"])
    done = set()
    out = DATA / "bp_profiles.jsonl"
    if out.exists():
        done = {json.loads(l)["bp_url"] for l in open(out, encoding="utf-8")}
    with open(out, "a", encoding="utf-8") as f:
        for n, u in enumerate(urls):
            if u in done:
                continue
            try:
                prof = parse(fetch(u, "bp", delay=6.0))
            except Exception as e:
                print("ERR", u, e, flush=True)
                continue
            prof["bp_url"] = u
            f.write(json.dumps(prof) + "\n")
            f.flush()
            if n % 100 == 0:
                print(n, "/", len(urls), flush=True)
    print("done", len(urls))


if __name__ == "__main__":
    main(sys.argv[1:] or ["candidates_bp_2026.csv"])
