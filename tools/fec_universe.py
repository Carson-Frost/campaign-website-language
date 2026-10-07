"""General-election ballot candidates for 2020-2024 from official FEC publications.

Sources (artifacts/fec/): federalelections2020.xlsx and federalelections2022.xlsx (certified results;
a row counts when it has general-election votes or is marked unopposed) and 2024congressgecands.xlsx
(general-election ballot list). Candidates on several fusion lines are merged. Write-ins are dropped.
Louisiana's November all-party primary is the general-election row in these files.
Writes artifacts/data/candidates_fec.csv.
"""
import csv
import re
from collections import OrderedDict

import openpyxl

from common import ABBR, ART, DATA

DEM = {"D", "DEM", "DFL", "DNL", "D*"}
REP = {"R", "REP", "GOP", "R*"}
IND = {"IND", "I", "N", "NNI", "NOP", "NPA", "NPY", "UN", "UND", "NPD", "DTS", "NNE", "NPP", "NSF", "IP", "NON", "NP"}
STATE_ABBRS = set(ABBR.values())


def labels(code):
    out = []
    for tok in str(code or "").replace(" ", "").split("/"):
        m = re.fullmatch(r"W\((.+)\)", tok)
        out.append(m.group(1) if m else tok)
    return [t for t in out if t]


def group(codes):
    toks = [t for c in codes for t in labels(c)]
    real = [t for t in toks if t != "W"]
    if not real:
        return None
    if any(t in DEM for t in real):
        return "Democratic"
    if any(t in REP for t in real):
        return "Republican"
    if all(t in IND for t in real):
        return "Independent"
    return "Third party"


def add(store, year, office, st, dist, fec_id, inc, name, party):
    if st not in STATE_ABBRS or not fec_id or fec_id == "n/a":
        return
    key = (year, fec_id, dist)
    r = store.setdefault(key, dict(year=year, office=office, state=st, district=dist, name=name,
                                   parties=[], incumbent=0, fec_id=fec_id))
    r["parties"].append(str(party).strip())
    r["incumbent"] |= int(bool(inc and "I" in str(inc)))


def results(store, year, path, sheets):
    wb = openpyxl.load_workbook(path, read_only=True)
    for office, sheet in sheets:
        for r in wb[sheet].iter_rows(min_row=2, values_only=True):
            st, dist, fec_id, inc, name, party, gen = r[1], r[3], r[4], r[5], r[8], r[10], r[15]
            if gen in (None, "") or not name:
                continue
            if office == "Senate":
                dist = "S2" if dist and "UNEXPIRED" in str(dist).upper() else "S"
            else:
                dist = f"{int(dist):02d}" if str(dist).isdigit() else "00"
            add(store, year, office, st, dist, fec_id, inc, name, party)


def ballots2024(store, path):
    wb = openpyxl.load_workbook(path, read_only=True)
    for sheet in wb.sheetnames:
        special = "Spec" in sheet and "SEN" in sheet
        for r in wb[sheet].iter_rows(min_row=2, values_only=True):
            st, dist, fec_id, inc, name, party = r[0], r[2], r[3], r[4], r[7], r[8]
            if not name or not fec_id:
                continue
            if str(dist).upper().startswith("S"):
                office, dist = "Senate", "S2" if special else "S"
            elif "Special" in sheet:
                continue
            else:
                office, dist = "House", f"{int(dist):02d}" if str(dist).isdigit() else "00"
            add(store, 2024, office, st, dist, fec_id, inc, name, party)


def main():
    store = OrderedDict()
    fec = ART / "fec"
    results(store, 2020, fec / "federalelections2020.xlsx",
            [("Senate", "12. US Senate Results by State"), ("House", "13. US House Results by State")])
    results(store, 2022, fec / "federalelections2022.xlsx",
            [("Senate", "7. US Senate Results by State"), ("House", "8. US House Results by State")])
    ballots2024(store, fec / "2024congressgecands.xlsx")
    rows = []
    for r in store.values():
        g = group(r["parties"])
        if g is None:
            continue
        r["party"] = "/".join(OrderedDict.fromkeys(r.pop("parties")))
        r["party_group"] = g
        rows.append(r)
    fields = ["year", "office", "state", "district", "name", "party", "party_group", "incumbent", "fec_id"]
    with open(DATA / "candidates_fec.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    from collections import Counter
    print(Counter((r["year"], r["office"], r["party_group"]) for r in rows))


if __name__ == "__main__":
    main()
