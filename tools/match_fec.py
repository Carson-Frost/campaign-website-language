"""Attach FEC candidate IDs to the Ballotpedia candidate lists for every year.

Matches within the same election year, state, office and district on last name, then first name,
against the FEC candidate master files artifacts/fec/cn{yy}.zip.
Reads artifacts/data/candidates_bp_2020_2022_2024.csv and candidates_bp_2026.csv.
Drops candidates the FEC's certified results list as unopposed in the general (see unopposed()).
Writes artifacts/data/candidates.csv (the study's candidate list) and, as a cross-check against the
FEC general-election lists for 2020-2024 (candidates_fec.csv), results/list_crosscheck.csv.
"""
import csv
import io
import re
import unicodedata
import zipfile
from collections import Counter

from common import ART, ROOT, DATA

SUFFIX = {"jr", "sr", "ii", "iii", "iv", "v", "md", "phd", "dr", "mr", "mrs", "ms"}
LISTS = ("candidates_bp_2020_2022_2024.csv", "candidates_bp_2026.csv")
GROUPS = ("Democratic", "Republican", "Independent", "Third party")


def toks(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return [t for t in re.findall(r"[a-z]+", s) if t not in SUFFIX]


def fec_pool(year):
    pool = {}
    z = zipfile.ZipFile(ART / "fec" / f"cn{year % 100}.zip")
    for line in io.TextIOWrapper(z.open("cn.txt"), encoding="latin-1"):
        f = line.rstrip("\n").split("|")
        if f[3] != str(year) or f[5] not in ("H", "S"):
            continue
        last, _, first = f[1].partition(",")
        key = (f[4], "Senate" if f[5] == "S" else "House", "S" if f[5] == "S" else f[6].zfill(2))
        pool.setdefault(key, []).append((f[0], toks(last), toks(first)))
    return pool


def match(pool, r):
    d = "S" if r["office"] == "Senate" else r["district"]
    cands = pool.get((r["state"], r["office"], d), [])
    nt = toks(r["name"])
    joined = "".join(nt)  # "GreyBull" on one list, "Grey Bull" on the other
    best = [c for c in cands if c[1] and (c[1][-1] in nt or "".join(c[1]) in joined)]
    if len(best) > 1:
        best = [c for c in best if c[2] and c[2][0] in nt] or best[:1]
    if not best:
        best = [c for c in cands if set(c[1]) & set(nt) and set(c[2]) & set(nt)]
    return best[0][0] if best else ""


def ballot_pool(fec):
    """The FEC general-election lists (2020-2024) as a match pool; a row may carry several IDs."""
    pool = {}
    for r in fec:
        last, _, first = r["name"].partition(",")
        d = "S" if r["office"] == "Senate" else r["district"]
        pool.setdefault((r["state"], r["office"], d), []).append((r["fec_id"], toks(last), toks(first)))
    return pool


def unopposed():
    """(year, FEC ID) of candidates whose general-election entry in the FEC's certified results reads
    "Unopposed" (2020 and 2022). Florida and Louisiana declare such candidates elected without printing
    the race on the November ballot, so they are outside the study's list of candidates on that ballot."""
    import openpyxl
    from vote_results import FEC_SHEETS
    out = set()
    for year, (name, *sheets) in FEC_SHEETS.items():
        wb = openpyxl.load_workbook(ART / "fec" / name, read_only=True)
        for sheet in sheets:
            for r in wb[sheet].iter_rows(min_row=3, values_only=True):
                if isinstance(r[15], str) and r[15].strip().lower() == "unopposed" and r[4]:
                    out.add((year, str(r[4]).strip()))
    return out


def main():
    rows = [r for name in LISTS for r in csv.DictReader(open(DATA / name, encoding="utf-8"))]
    fec = list(csv.DictReader(open(DATA / "candidates_fec.csv", encoding="utf-8")))
    for r in fec:
        r["fec_id"] = ",".join(i.strip() for i in r["fec_id"].split(",") if i.strip())
    ballot = {y: ballot_pool([r for r in fec if r["year"] == y]) for y in {r["year"] for r in fec}}
    pools = {}
    for r in rows:
        y = int(r["year"])
        pools.setdefault(y, fec_pool(y))
        master = match(pools[y], r)
        # Prefer the ID on FEC's own general-election list; the master file holds duplicate registrations.
        listed = [i for i in match(ballot[r["year"]], r).split(",") if i] if r["year"] in ballot else []
        r["fec_id"] = master if master in listed or not listed else listed[0]
    off_ballot = unopposed()
    print("not on the November ballot (unopposed):", [(r["year"], r["name"]) for r in rows
                                                      if (r["year"], r["fec_id"]) in off_ballot])
    rows = [r for r in rows if (r["year"], r["fec_id"]) not in off_ballot]
    cols = ["year", "office", "state", "district", "name", "party", "party_group", "incumbent", "fec_id", "bp_url", "ballot"]
    with open(DATA / "candidates.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print("matched", sum(bool(r["fec_id"]) for r in rows), "of", len(rows))

    bp_ids = {(r["year"], r["fec_id"]) for r in rows if r["fec_id"]}
    fec_ids = {(r["year"], i) for r in fec for i in r["fec_id"].split(",")}
    n_bp, n_fec = Counter(), Counter()
    both_bp, both_fec = Counter(), Counter()
    for r in rows:
        n_bp[(r["year"], r["party_group"])] += 1
        both_bp[(r["year"], r["party_group"])] += (r["year"], r["fec_id"]) in fec_ids
    for r in fec:
        n_fec[(r["year"], r["party_group"])] += 1
        both_fec[(r["year"], r["party_group"])] += any((r["year"], i) in bp_ids for i in r["fec_id"].split(","))
    (ROOT / "results").mkdir(exist_ok=True)
    with open(ROOT / "results" / "list_crosscheck.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["year", "party_group", "ballotpedia", "fec", "ballotpedia_on_fec_list", "fec_on_ballotpedia_list"])
        for y in sorted({r["year"] for r in rows}):
            for g in GROUPS:
                k = (y, g)
                w.writerow([y, g, n_bp[k], n_fec[k] if y != "2026" else "", both_bp[k] if y != "2026" else "",
                            both_fec[k] if y != "2026" else ""])
                print(y, g, "BP", n_bp[k], "FEC", n_fec[k], "BP on FEC", both_bp[k], "FEC on BP", both_fec[k])


if __name__ == "__main__":
    main()
