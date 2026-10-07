"""Shared paths, HTTP fetching with an on-disk cache, and party normalization."""
import hashlib
import html
import os
import re
import threading
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "artifacts"
CACHE = ART / "cache"
DATA = ART / "data"
DATA.mkdir(parents=True, exist_ok=True)

YEARS = (2020, 2022, 2024, 2026)
GENERAL_DAY = {2020: "2020-11-03", 2022: "2022-11-08", 2024: "2024-11-05", 2026: "2026-11-03"}
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

STATES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
          "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
          "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
          "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
          "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
          "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
          "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"]
ABBR = dict(zip(STATES, "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV "
                        "NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split()))

RESEARCH_UA = "candidate-language-research/0.1 (python-requests; academic text study)"
OFFLINE = os.environ.get("OFFLINE") == "1"  # cache misses raise instead of fetching (re-extraction runs)
_session = requests.Session()
_session.headers["User-Agent"] = UA
_archive = requests.Session()  # archive.org throttles browser-like clients; identify honestly
_archive.headers["User-Agent"] = RESEARCH_UA
_last = {}
_lock = threading.Lock()


def _slot(host, delay):
    """Reserve the next request slot for host; threads share one schedule per host."""
    with _lock:
        t = max(time.time(), _last.get(host, 0) + delay)
        _last[host] = t
    if t > time.time():
        time.sleep(t - time.time())


def fetch(url, kind, delay=2.0, tries=6, timeout=60, backoff=300, valid=None):
    """Return text for url, caching under CACHE/kind. delay is the per-host minimum interval.

    A 404 is cached as an empty page. Rate limits and firewall challenges (202, 429, 503, empty
    bodies) wait backoff seconds per attempt. valid(text) may reject a response, which is retried
    and never cached.
    """
    d = CACHE / kind
    d.mkdir(parents=True, exist_ok=True)
    f = d / (hashlib.sha1(url.encode()).hexdigest() + ".html")
    if f.exists():
        return f.read_text(encoding="utf-8")
    if OFFLINE:
        raise RuntimeError(f"offline: not cached {url}")
    host = re.sub(r"^https?://([^/]+).*", r"\1", url)
    err = None
    for i in range(tries):
        _slot(host, delay)
        try:
            r = (_archive if "archive.org" in host else _session).get(url, timeout=timeout)
            if r.status_code == 404:
                f.write_text("", encoding="utf-8")
                return ""
            if r.status_code in (202, 429, 503) or (r.ok and not r.content):
                err = f"HTTP {r.status_code}"
                print(f"  {host} answered {r.status_code}; waiting", flush=True)
                time.sleep(backoff * (i + 1))
                continue
            r.raise_for_status()
            if "charset" not in r.headers.get("content-type", "").lower():
                r.encoding = r.apparent_encoding or "utf-8"
            if valid and not valid(r.text):
                err = "invalid response"
                time.sleep(min(backoff, 30) * (i + 1))
                continue
            f.write_text(r.text, encoding="utf-8")
            return r.text
        except requests.RequestException as e:
            err = e
            time.sleep(min(backoff, 5 if "archive.org" not in host else backoff) * (i + 1))
    raise RuntimeError(f"fetch failed {url}: {err}")


def text_of(fragment):
    fragment = re.sub(r"<(script|style)\b.*?</\1>", " ", fragment, flags=re.S | re.I)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


PARTY_GROUPS = {
    "Democratic": "Democratic", "D": "Democratic", "Democratic-Farmer-Labor": "Democratic", "DFL": "Democratic",
    "Republican": "Republican", "R": "Republican", "GOP": "Republican",
    "Independent": "Independent", "I": "Independent", "Nonpartisan": "Independent", "Unaffiliated": "Independent",
    "No Party Affiliation": "Independent", "No party preference": "Independent", "No Party Preference": "Independent",
    "Independent Party": "Independent", "Unenrolled": "Independent", "Non-Party": "Independent",
    "No Political Party": "Independent", "Undeclared": "Independent", "Independent Party of Oregon": "Third party",
}


def party_group(label):
    label = re.sub(r"\s+Party$", "", (label or "").strip())
    if label in PARTY_GROUPS:
        return PARTY_GROUPS[label]
    if re.search(r"democrat", label, re.I):
        return "Democratic"
    if re.search(r"republican", label, re.I):
        return "Republican"
    if re.fullmatch(r"(?i)(independent|no party.*|unaffiliated|nonpartisan|unenrolled|non-?party.*)", label):
        return "Independent"
    return "Third party" if label else "Unknown"
