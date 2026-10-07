"""Collect campaign-website text for each candidate-year.

Archived mode (any year): Wayback Machine captures from the 60 days before that year's general
election. Live mode (2026 only, run before election day): the site as served now.
Pages per site: the homepage plus up to MAX_PAGES (3) linked pages on the same site, preferring
issue and biography pages and skipping donation, volunteer, contact, shop and event pages.

Reads artifacts/data/sites_input.csv (year, cand_key, website). Appends one JSON line per page to
artifacts/data/pages_<mode>.jsonl; raw HTML stays in the fetch cache.
"""
import csv
import json
import random
import re
import sys
import threading
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta

import trafilatura

from common import DATA, GENERAL_DAY, fetch

MAX_PAGES = 3  # Wayback blocks clients that exceed roughly 10-15 requests per minute
WINDOW_DAYS = 60
PREFER = re.compile(r"issue|priorit|platform|polic|position|plan|agenda|vision|values|stand|fight|believe|"
                    r"about|meet|bio|story|who-|why|record|accomplish|endorse", re.I)
SKIP = re.compile(r"donat|contribut|give|volunteer|contact|shop|store|merch|event|calendar|privacy|terms|"
                  r"login|signup|sign-up|join|subscribe|cart|checkout|wp-|feed|\.pdf$|\.jpe?g$|\.png$|"
                  r"/tag/|/category/|/author/|/page/\d|news/.+|press/.+|blog/.+|media/.+|actblue|winred|"
                  r"anedot|facebook|twitter|instagram|youtube|mailto:|tel:", re.I)


NOT_CAMPAIGN_HOST = re.compile(r"(^|\.)(facebook|instagram|twitter|x|youtube|tiktok|linkedin|linktr|actblue|winred|"
                               r"anedot|ballotpedia|house|senate)\.(com|ee|org|gov)$", re.I)


def clean_site(site):
    """A campaign site address, or "" for a social, donation, reference or official-office host.

    Ballotpedia sometimes quotes a Wayback Machine copy; the original address is used instead.
    """
    site = re.sub(r"^(?:https?://)?web\.archive\.org/web/\d+(?:id_)?/", "", site.strip(), flags=re.I)
    if not site:
        return ""
    return "" if NOT_CAMPAIGN_HOST.search(norm_site(site)[0]) else site


def norm_site(site):
    site = site.strip()
    if not re.match(r"https?://", site, re.I):
        site = "http://" + site
    p = urllib.parse.urlsplit(site)
    host = p.netloc.lower()
    return re.sub(r"^www\d?\.", "", host), host


def same_site(url, domain):
    host = urllib.parse.urlsplit(url).netloc.lower().split(":")[0]
    if re.match(r"(store|shop|secure|donate|give|act|join|events?|merch)\.", host):
        return False
    return host == domain or host.endswith("." + domain)


def main_host(url, domain):
    """True for the site's own host (bare or www); other subdomains are separate services."""
    host = urllib.parse.urlsplit(url).netloc.lower().split(":")[0]
    return re.sub(r"^www\d?\.", "", host) == domain


def page_key(url):
    p = urllib.parse.urlsplit(url)
    path = re.sub(r"/+$", "", p.path) or "/"
    return path.lower()


def links(html, base, domain):
    out = []
    for href in re.findall(r'<a\b[^>]*href=["\']([^"\'#]+)', html, re.I):
        u = urllib.parse.urljoin(base, href.strip())
        u = re.sub(r"^https?://web\.archive\.org/web/\d+(?:id_)?/", "", u)
        if main_host(u, domain) and not SKIP.search(u) and page_key(u) != "/":
            out.append(u)
    return list(dict.fromkeys(out))


_extract_lock = threading.Lock()


def extract(html, url):
    """Main text of one page by trafilatura's default settings, without visitor comments.

    Cross-page deduplication stays off (the default): its cache spans every page in a run, so it
    would remove text shared between candidates in collection order (methods.md, audit fix 1).
    Extraction runs one page at a time: trafilatura parses every page with one shared lxml parser
    (utils.HTML_PARSER), and one page extracted differently in one of three threaded runs.
    """
    with _extract_lock:
        txt = trafilatura.extract(html, url=url, include_comments=False) or ""
    title = re.search(r"<title[^>]*>(.*?)</title>", html, re.S | re.I)
    return txt, (re.sub(r"\s+", " ", title.group(1)).strip() if title else "")


def captures(domain, start, end):
    q = urllib.parse.urlencode({"url": domain, "matchType": "domain", "from": start.strftime("%Y%m%d"),
                                "to": end.strftime("%Y%m%d"), "filter": ["statuscode:200", "mimetype:text/html"],
                                "fl": "timestamp,original", "output": "json", "limit": "20000"}, doseq=True)
    t = fetch("https://web.archive.org/cdx/search/cdx?" + q, "cdx", delay=6.0, timeout=180, backoff=600,
              valid=lambda x: not x.lstrip().startswith("<"))
    rows = json.loads(t) if t.strip() else []
    latest = {}
    for ts, orig in rows[1:]:
        if not main_host(orig, domain):
            continue
        k = page_key(orig)
        if k not in latest or ts > latest[k][0]:
            latest[k] = (ts, orig)
    return latest


def choose(cands, home_links):
    """Order candidate page keys: linked from the homepage first, preferred names first."""
    linked = [page_key(u) for u in home_links]
    keys = [k for k in dict.fromkeys(linked + sorted(cands)) if k in cands and k != "/"]
    keys = [k for k in keys if not SKIP.search(k)]
    keys.sort(key=lambda k: (k not in linked, not PREFER.search(k), k.count("/"), len(k)))
    return keys[:MAX_PAGES]


def archived(row):
    domain, _ = norm_site(row["website"])
    end = date.fromisoformat(GENERAL_DAY[int(row["year"])])
    caps = captures(domain, end - timedelta(days=WINDOW_DAYS), end)
    if not caps:
        return []
    out = []
    home = caps.get("/") or caps.get("/home") or caps.get("/index.html")
    home_links = []
    if home:
        html = fetch(f"https://web.archive.org/web/{home[0]}id_/{home[1]}", "wb", delay=6.0, backoff=600, tries=4)
        home_links = links(html, home[1], domain)
        out.append(("home", home, html))
    for k in choose(caps, home_links):
        ts, orig = caps[k]
        html = fetch(f"https://web.archive.org/web/{ts}id_/{orig}", "wb", delay=6.0, backoff=600, tries=4)
        out.append(("page", (ts, orig), html))
    return out


def live(row):
    domain, host = norm_site(row["website"])
    root = f"https://{host}/"
    try:
        html = fetch(root, "live", delay=1.0, tries=2, timeout=40, backoff=5)
    except Exception:
        root = f"http://{host}/"
        html = fetch(root, "live", delay=1.0, tries=2, timeout=40, backoff=5)
    out = [("home", ("live", root), html)]
    for u in sorted(links(html, root, domain), key=lambda u: (not PREFER.search(u), u.count("/"), len(u)))[:MAX_PAGES]:
        try:
            out.append(("page", ("live", u), fetch(u, "live", delay=1.0, tries=2, timeout=40, backoff=5)))
        except Exception:
            pass
    return out


def work(row, mode):
    """JSON lines for one candidate-year (its pages, then a status line), or [] to retry later."""
    try:
        pages = (live if mode == "live" else archived)(row)
    except Exception as e:
        pages, err = [], str(e)[:200]
    else:
        err = ""
    recs = []
    for kind, (ts, url), html in pages:
        if not html:
            continue
        txt, title = extract(html, url)
        recs.append(dict(year=row["year"], cand_key=row["cand_key"], mode=mode, kind=kind, url=url,
                         timestamp=ts, title=title, text=txt))
    if err:
        print("retry later:", row["year"], row["cand_key"], err[:120], flush=True)
        return []
    recs.append(dict(year=row["year"], cand_key=row["cand_key"], mode=mode, kind="status",
                     site=norm_site(row["website"])[0], pages=len(recs), error=err))
    return [json.dumps(r) + "\n" for r in recs]


def main(mode, workers=None):
    workers = workers or (1 if mode == "archived" else 6)
    rows = [r for r in csv.DictReader(open(DATA / "sites_input.csv", encoding="utf-8")) if r["website"]]
    if mode == "live":
        rows = [r for r in rows if r["year"] == "2026"]
    out = DATA / f"pages_{mode}.jsonl"
    done = set()
    if out.exists():
        for line in open(out, encoding="utf-8"):
            d = json.loads(line)
            if d["kind"] == "status":
                done.add((d["year"], d["cand_key"], d.get("site")))
    todo = [r for r in rows if (r["year"], r["cand_key"], norm_site(r["website"])[0]) not in done]
    random.Random(7).shuffle(todo)  # any prefix of the run is a random sample of candidate-years
    todo.sort(key=lambda r: r["party_group"] == "Third party")  # third parties last; stable sort keeps the shuffle
    print(f"{mode}: {len(todo)} of {len(rows)} candidate-years to do", flush=True)
    with open(out, "a", encoding="utf-8") as sink, ThreadPoolExecutor(workers) as ex:
        for i, lines in enumerate(ex.map(lambda r: work(r, mode), todo)):  # input order, so the file order is fixed
            sink.writelines(lines)
            sink.flush()
            if i % 50 == 0:
                print(i, flush=True)
    print("done")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "archived")
