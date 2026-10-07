"""Campaign website per candidate-year from the principal committee's FEC Statement of Organization.

For each candidate-year, uses the latest Form 1 (new or amended) filed on or before that year's
general election day that lists a website; if none does, the earliest later one.
Usage: fec_websites.py [candidate list] [output], both in artifacts/data; defaults
candidates.csv and websites_fec.csv. Uses the FEC candidate master files artifacts/fec/cn{yy}.zip.
"""
import csv
import io
import re
import sys
import zipfile
from datetime import date

from common import ART, DATA, GENERAL_DAY, fetch

DQ = "https://docquery.fec.gov"
DOMAIN = re.compile(r"^(?:https?://)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,})(?:[/:?#].*)?$", re.I)


def pcc_map():
    out = {}
    for yy in ("20", "22", "24", "26"):
        z = zipfile.ZipFile(ART / "fec" / f"cn{yy}.zip")
        for line in io.TextIOWrapper(z.open("cn.txt"), encoding="latin-1"):
            f = line.rstrip("\n").split("|")
            if len(f) > 9 and f[9]:
                out[(f[0], 2000 + int(yy))] = f[9]
    return out


def form1s(cmte):
    t = fetch(f"{DQ}/cgi-bin/forms/{cmte}/", "fec", delay=0.6)
    out = []
    for m in re.finditer(r"<A HREF='(\d+)/'>(F1[NA]?)</A>(.{0,400}?)(\d{2})/(\d{2})/(\d{4})", t, re.S):
        out.append((date(int(m.group(6)), int(m.group(4)), int(m.group(5))), m.group(1)))
    return sorted(out)


def url_in(fid):
    t = fetch(f"{DQ}/dcdev/posted/{fid}.fec", "fec", delay=0.6)
    for line in t.split("\n"):
        sep = "\x1c" if "\x1c" in line else ","
        f = [x.strip().strip('"') for x in line.split(sep)]
        if not f or not f[0].upper().startswith("F1") or f[0].upper().startswith("F1S"):
            continue
        cands = ([f[13]] if len(f) > 13 else []) + f[10:20]
        for x in cands:
            if x and "@" not in x and DOMAIN.match(x):
                return x
        return ""
    return ""


def main(src="candidates.csv", dst="websites_fec.csv"):
    rows = [r for r in csv.DictReader(open(DATA / src, encoding="utf-8")) if r.get("fec_id")]
    pcc = pcc_map()
    out = []
    for n, r in enumerate(rows):
        y = int(r["year"])
        cmte = pcc.get((r["fec_id"], y)) or pcc.get((r["fec_id"], y + 2)) or pcc.get((r["fec_id"], y - 2))
        site, fid, filed = "", "", ""
        if cmte:
            try:
                forms = form1s(cmte)
                day = date.fromisoformat(GENERAL_DAY[y])
                before = [x for x in forms if x[0] <= day][::-1]
                after = [x for x in forms if x[0] > day]
                for d, i in before + after:
                    u = url_in(i)
                    if u:
                        site, fid, filed = u, i, d.isoformat()
                        break
            except Exception as e:
                print("ERR", r["fec_id"], cmte, e, flush=True)
        out.append(dict(year=y, fec_id=r["fec_id"], committee=cmte or "", website=site, form1=fid, form1_date=filed))
        if n % 200 == 0:
            print(n, "/", len(rows), flush=True)
    with open(DATA / dst, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(out[0]))
        w.writeheader()
        w.writerows(out)
    print("with website:", sum(bool(o["website"]) for o in out), "of", len(out))


if __name__ == "__main__":
    main(*sys.argv[1:3])
