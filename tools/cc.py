"""Collect archived campaign-website text from Common Crawl.

Uses the crawls that fall inside the 60 days before each general election and keeps only
captures dated inside that window. Page choice matches sites.py: the homepage plus up to
MAX_PAGES linked pages, preferring issue and biography pages.

Reads artifacts/data/sites_input.csv. Appends to artifacts/data/pages_cc.jsonl.
Usage: cc.py [years...]   (default 2020 2022 2024)
"""
import csv
import gzip
import hashlib
import json
import random
import sys
import threading
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta

import requests

from common import CACHE, DATA, GENERAL_DAY, OFFLINE, RESEARCH_UA
from sites import MAX_PAGES, WINDOW_DAYS, choose, extract, links, main_host, norm_site, page_key

CRAWLS = {
    2020: ["CC-MAIN-2020-40", "CC-MAIN-2020-45"],
    2022: ["CC-MAIN-2022-40"],
    2024: ["CC-MAIN-2024-38", "CC-MAIN-2024-42", "CC-MAIN-2024-46"],
    2026: ["CC-MAIN-2026-39"],
}
S = requests.Session()
S.headers["User-Agent"] = RESEARCH_UA
lock = threading.Lock()
_next = [0.0]


def pace(delay=1.0):
    with lock:
        t = max(time.time(), _next[0])
        _next[0] = t + delay
    time.sleep(max(0, t - time.time()))


def cached(kind, key, produce):
    d = CACHE / kind
    d.mkdir(parents=True, exist_ok=True)
    f = d / (hashlib.sha1(key.encode()).hexdigest() + ".txt")
    if f.exists():
        return f.read_text(encoding="utf-8")
    if OFFLINE:
        raise RuntimeError(f"offline: not cached {kind} {key}")
    text = produce()
    f.write_text(text, encoding="utf-8")
    return text


IDX = CACHE.parent / "ccindex"  # <crawl>.cluster.idx files from data.commoncrawl.org


def _line_at(f, pos):
    """The first full line starting at or after byte pos, and the offset after it."""
    f.seek(pos)
    if pos:
        f.readline()
    start = f.tell()
    return f.readline(), start


def blocks(coll, prefix):
    """cluster.idx entries whose index block may hold keys starting with prefix."""
    hi_key = prefix + "-"  # ")" and "," sort below "-", so every match lies in [prefix, prefix + "-")
    with open(IDX / f"{coll}.cluster.idx", "rb") as f:
        size = f.seek(0, 2)
        lo, hi = 0, size
        while hi - lo > 1:  # last line start whose key < prefix
            mid = (lo + hi) // 2
            line, start = _line_at(f, mid)
            if line and line.decode("utf-8", "replace").split(" ", 1)[0] < prefix:
                lo = mid
            else:
                hi = mid
        line, start = _line_at(f, lo)
        out = []
        while line:
            key = line.decode("utf-8", "replace").split(" ", 1)[0]
            if key >= hi_key and out:
                break
            out.append(line.decode("utf-8", "replace").rstrip("\n").split("\t"))
            if key >= hi_key:
                break
            line = f.readline()
        return out


def index(coll, domain):
    prefix = ",".join(reversed(domain.lower().split(".")))
    recs = []
    for _, shard, off, ln, *_ in blocks(coll, prefix):
        def produce():
            for i in range(5):
                try:
                    r = S.get(f"https://data.commoncrawl.org/cc-index/collections/{coll}/indexes/{shard}", timeout=120,
                              headers={"Range": f"bytes={off}-{int(off) + int(ln) - 1}"})
                    if r.status_code in (429, 500, 502, 503, 504):
                        time.sleep(10 * (i + 1))
                        continue
                    r.raise_for_status()
                    return gzip.decompress(r.content).decode("utf-8", "replace")
                except (requests.RequestException, OSError):
                    time.sleep(10 * (i + 1))
            raise RuntimeError(f"index block failed {coll} {shard} {off}")
        for line in cached("ccx", f"{coll} {shard} {off}", produce).splitlines():
            key, _, rest = line.partition(" ")
            if key.startswith(prefix + ")") or key.startswith(prefix + ","):
                ts, js = rest.split(" ", 1)
                rec = json.loads(js)
                rec["timestamp"] = ts
                if rec.get("status") == "200":
                    recs.append(rec)
    return recs


def record(rec):
    def produce():
        off, ln = int(rec["offset"]), int(rec["length"])
        for i in range(5):
            try:
                r = S.get(f"https://data.commoncrawl.org/{rec['filename']}", timeout=120,
                          headers={"Range": f"bytes={off}-{off + ln - 1}"})
                if r.status_code in (429, 500, 502, 503, 504):
                    time.sleep(10 * (i + 1))
                    continue
                r.raise_for_status()
                raw = gzip.decompress(r.content)
                break
            except (requests.RequestException, OSError):
                time.sleep(10 * (i + 1))
        else:
            raise RuntimeError("warc fetch failed")
        parts = raw.split(b"\r\n\r\n", 2)
        if len(parts) < 3:
            return ""
        http_head, body = parts[1].decode("latin-1"), parts[2]
        cs = "utf-8"
        for line in http_head.split("\r\n"):
            if line.lower().startswith("content-type") and "charset=" in line.lower():
                cs = line.lower().split("charset=")[-1].split(";")[0].strip() or "utf-8"
        try:
            return body.decode(cs, errors="replace")
        except LookupError:
            return body.decode("utf-8", errors="replace")
    return cached("ccw", f"{rec['filename']} {rec['offset']}", produce)


def collect(row):
    year = int(row["year"])
    domain, _ = norm_site(row["website"])
    end = date.fromisoformat(GENERAL_DAY[year])
    lo, hi = (end - timedelta(days=WINDOW_DAYS)).strftime("%Y%m%d"), end.strftime("%Y%m%d") + "235959"
    latest = {}
    for coll in CRAWLS[year]:
        for rec in index(coll, domain):
            if "html" not in rec.get("mime", "") or not (lo <= rec["timestamp"] <= hi) or not main_host(rec["url"], domain):
                continue
            k = page_key(rec["url"])
            if k not in latest or rec["timestamp"] > latest[k]["timestamp"]:
                latest[k] = rec
    if not latest:
        return []
    out, home_links = [], []
    home = latest.get("/") or latest.get("/home") or latest.get("/index.html")
    if home:
        html = record(home)
        home_links = links(html, home["url"], domain)
        out.append(("home", home, html))
    for k in choose(latest, home_links):
        out.append(("page", latest[k], record(latest[k])))
    return out


def work(row):
    """JSON lines for one candidate-year (its pages, then a status line), or [] to retry later."""
    try:
        pages = collect(row)
    except Exception as e:
        print("retry later:", row["year"], row["cand_key"], str(e)[:120], flush=True)
        return []
    recs = []
    for kind, rec, html in pages:
        if html:
            txt, title = extract(html, rec["url"])
            recs.append(dict(year=row["year"], cand_key=row["cand_key"], mode="cc", kind=kind, url=rec["url"],
                             timestamp=rec["timestamp"], title=title, text=txt))
    recs.append(dict(year=row["year"], cand_key=row["cand_key"], mode="cc", kind="status",
                     site=norm_site(row["website"])[0], pages=len(recs), error=""))
    return [json.dumps(r) + "\n" for r in recs]


def main(years):
    rows = [r for r in csv.DictReader(open(DATA / "sites_input.csv", encoding="utf-8"))
            if r["website"] and int(r["year"]) in years]
    out = DATA / "pages_cc.jsonl"
    done = set()
    if out.exists():
        done = {(d["year"], d["cand_key"], d.get("site")) for d in map(json.loads, open(out, encoding="utf-8"))
                if d["kind"] == "status"}
    todo = [r for r in rows if (r["year"], r["cand_key"], norm_site(r["website"])[0]) not in done]
    random.Random(7).shuffle(todo)
    print(f"cc: {len(todo)} of {len(rows)} candidate-years to do", flush=True)
    with open(out, "a", encoding="utf-8") as sink, ThreadPoolExecutor(3) as ex:
        for i, lines in enumerate(ex.map(work, todo)):  # map yields in input order, so the file order is fixed
            sink.writelines(lines)
            sink.flush()
            if i % 100 == 0:
                print(i, flush=True)
    print("done")


if __name__ == "__main__":
    main([int(a) for a in sys.argv[1:]] or [2020, 2022, 2024])
