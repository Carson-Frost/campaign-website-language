"""Merge the candidate list and website sources into artifacts/data/sites_input.csv.

The candidate list is Ballotpedia's for every year, with FEC IDs attached (candidates.csv from
match_fec.py). Website choice per candidate-year, in order: the FEC Statement of Organization website
in force at that election; the campaign-website page Ballotpedia quoted for that election year; the
campaign website currently linked on the candidate's Ballotpedia page. Text is only ever taken from
captures inside that election's window, so a later link yields text only if the site existed then.
Social-media, donation, reference and official-office addresses are skipped (sites.clean_site).
A candidate on two ballots in one year (a regular and a special Senate race) is one candidate-year.
Rows: year, cand_key, office, state, district, name, party, party_group, incumbent, fec_id, bp_url,
website, website_source. cand_key is the FEC ID, or the Ballotpedia page name when there is none.
"""
import csv
import json
from collections import Counter

from common import DATA
from sites import clean_site


def main():
    rows = list(csv.DictReader(open(DATA / "candidates.csv", encoding="utf-8")))
    fec = {(r["year"], r["fec_id"]): clean_site(r["website"])
           for r in csv.DictReader(open(DATA / "websites_fec.csv", encoding="utf-8"))}
    bp, bp_year = {}, {}
    for line in open(DATA / "bp_profiles.jsonl", encoding="utf-8"):
        d = json.loads(line)
        site = clean_site((d["links"].get("Campaign website") or [""])[0])
        if site:
            bp[d["bp_url"]] = site
        for y, e in d["years"].items():
            quoted = [s for s in (clean_site(w.get("url") or "") for w in e["website"]) if s]
            if quoted:
                bp_year[(d["bp_url"], y)] = quoted[0]
    out, seen = [], set()
    for r in rows:
        key = r["fec_id"] or r["bp_url"].rsplit("/", 1)[-1]
        if (r["year"], key) in seen:
            continue
        seen.add((r["year"], key))
        site, src = fec.get((r["year"], r["fec_id"]), ""), "fec_form1"
        if not site and (r["bp_url"], r["year"]) in bp_year:
            site, src = bp_year[(r["bp_url"], r["year"])], "ballotpedia_quote"
        if not site and r["bp_url"] in bp:
            site, src = bp[r["bp_url"]], "ballotpedia_link"
        out.append(dict(year=r["year"], cand_key=key, office=r["office"], state=r["state"], district=r["district"],
                        name=r["name"], party=r["party"], party_group=r["party_group"], incumbent=r["incumbent"],
                        fec_id=r["fec_id"], bp_url=r["bp_url"], website=site, website_source=src if site else ""))
    with open(DATA / "sites_input.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(out[0]))
        w.writeheader()
        w.writerows(out)
    print(sorted(Counter((o["year"], o["website_source"] or "none") for o in out).items()))


if __name__ == "__main__":
    main()
