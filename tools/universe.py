"""Build the general-election candidate list for U.S. House and Senate from Ballotpedia.

Writes artifacts/data/candidates_bp_<years>.csv with one row per candidate per race.
Louisiana held all-party November primaries through 2024, and again for the House in 2026 after
Louisiana v. Callais canceled its new partisan House primaries; those ballots stand in for the general.
"""
import csv
import re
import urllib.parse

from common import ABBR, DATA, STATES, YEARS, fetch, party_group, text_of

BP = "https://ballotpedia.org/"
LI = re.compile(r'<li><a href="(https://ballotpedia\.org/[^"]+)">([^<]+)</a>(.*?)</li>', re.S)


def page(title):
    return fetch(BP + urllib.parse.quote(title.replace(" ", "_"), safe="_,()'%"), "bp", delay=6.0)


def list_after(section, label):
    i = section.find(f'font-weight: bold">{label}')
    if i < 0:
        return None
    rest = section[i:]
    stop = re.search(r'font-weight: bold[^"]*">(?!' + re.escape(label) + ')', rest[10:])
    block = rest[: stop.start() + 10] if stop else rest
    if "election was canceled" in block[:400]:
        return "canceled"
    ul = re.search(r"<ul>(.*?)</ul>", block, re.S)
    return ul.group(1) if ul else ""


def house(year, state):
    t = page(f"United States House of Representatives elections in {state}, {year}")
    rows = district_lists(year, state, t) if 'id="Candidates"' in t else []
    if not rows:  # at-large states: a single race page with vote boxes
        jungle = state == "Louisiana" and year <= 2024
        want = (r"Nonpartisan primary" if jungle else r"General election") + r" for U\.S\. House " + re.escape(state) + r" At-large District"
        return [dict(year=year, office="House", state=ABBR[state], district="00", name=n, party=p,
                     party_group=party_group(p), incumbent=i, bp_url=u, ballot="general")
                for n, u, p, i in votebox(t, want)]
    return rows


def district_lists(year, state, t):
    start = t.find('id="Candidates"')
    end = t.find('id="Voting_information"', start)
    body = t[start:end if end > 0 else None]
    heads = list(re.finditer(r'<h3><span class="mw-headline" id="([^"]+)"', body))
    rows = []
    for k, h in enumerate(heads):
        sec = body[h.start(): heads[k + 1].start() if k + 1 < len(heads) else None]
        dist = h.group(1).replace("_", " ")
        m = re.search(r"(\d+)", dist)
        district = f"{int(m.group(1)):02d}" if m else "00"
        jungle = state == "Louisiana"  # 2026 too: Callais canceled the new partisan House primaries
        ul = list_after(sec, "Primary candidates" if jungle else "General election candidates")
        if ul in (None, "canceled"):
            continue
        for url, name, tail in LI.findall(ul):
            tail_t = text_of(tail)
            if "Write-in" in tail_t:
                continue
            parties = re.findall(r"\(([^()]*)\)", tail_t)
            party = next((p for p in parties if p != "Incumbent"), "")
            rows.append(dict(year=year, office="House", state=ABBR[state], district=district,
                             name=name.strip(), party=party, party_group=party_group(party),
                             incumbent=int("Incumbent" in parties), bp_url=url,
                             ballot="November all-party primary" if jungle else "general"))
    return rows




def votebox(t, want):
    """Candidates in the earliest votebox (plain or ranked-choice) whose header fully matches want."""
    boxes = []
    for m in re.finditer(r'<div class="(votebox|rcvvotebox)"', t):
        blk = t[m.start(): m.start() + 200000]
        nxt = re.search(r'<div class="(?:votebox|rcvvotebox)"', blk[20:])
        blk = blk[: nxt.start() + 20] if nxt else blk
        if m.group(1) == "votebox":
            head = re.search(r'votebox-header-election-type">([^<]+)<', blk)
        else:
            head = re.search(r'class="rcvrace_header[^"]*">(.*?)</h5>', blk, re.S)
        if head and re.fullmatch(want, text_of(head.group(1))):
            boxes.append(blk)
    if not boxes:
        return []
    out = {}
    cells = re.findall(r'image-candidate-thumbnail-wrapper ?([^"]*)".*?votebox-results-cell--text">(.*?)</td>', boxes[0], re.S)
    if not cells:  # some older vote boxes have no candidate thumbnails
        cells = [("", c) for c in re.findall(r'votebox-results-cell--text">(.*?)</td>', boxes[0], re.S)]
    for wrap, cell in cells:
        link = re.search(r'href="(https://ballotpedia\.org/[^"#]+)"[^>]*>(.*?)</a>', cell)
        tail = text_of(cell)
        if not link or "Write-in" in tail:
            continue
        pm = re.findall(r"\(([^()]*)\)", tail)
        out.setdefault(link.group(1), (text_of(link.group(2)), link.group(1), pm[-1] if pm else wrap.strip(),
                                       int("<u>" in cell)))
    return list(out.values())


def senate(year):
    idx = page(f"United States Senate elections, {year}")
    pages = sorted(set(urllib.parse.unquote(m) for m in re.findall(
        r'href="(?:https://ballotpedia\.org)?/(United_States_Senate_(?:special_)?election_in_[A-Za-z_]+,_' + str(year) + ')"', idx)))
    rows = []
    for title in pages:
        st = re.search(r"election_in_(.+),_\d{4}", title).group(1).replace("_", " ")
        if st not in ABBR:
            continue
        special = "_special_" in title
        t = page(title.replace("_", " "))
        jungle = st == "Louisiana" and year <= 2024
        want = (r"(?:Nonpartisan primary|Special nonpartisan primary)" if jungle
                else r"(?:Special general|General) election") + r" for U\.S\. Senate " + re.escape(st)
        for name, url, party, inc in votebox(t, want):
            rows.append(dict(year=year, office="Senate", state=ABBR[st], district="S2" if special else "S",
                             name=name, party=party, party_group=party_group(party), incumbent=inc, bp_url=url,
                             ballot="November all-party primary" if jungle else "general"))
    return rows


def main(years):
    rows = []
    for year in years:
        for st in STATES:
            got = house(year, st)
            if not got:
                print("no House candidates parsed:", year, st, flush=True)
            rows += got
        s = senate(year)
        print(year, "House", sum(r["year"] == year and r["office"] == "House" for r in rows), "Senate", len(s), flush=True)
        rows += s
    with open(DATA / f"candidates_bp_{'_'.join(map(str, years))}.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    print("wrote", len(rows))


if __name__ == "__main__":
    import sys
    main([int(a) for a in sys.argv[1:]] or list(YEARS))
