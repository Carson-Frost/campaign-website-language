"""Washington voter-guide statements for U.S. House and Senate candidates, general elections 2020-2026.

Source: the public JSON API behind voter.votewa.gov (statewide county code XX).
Writes artifacts/data/wa_statements.jsonl.
"""
import json

from common import DATA, fetch, party_group, text_of

API = "https://voter.votewa.gov/elections"
GENERALS = {2020: 866, 2022: 877, 2024: 889, 2026: 899}


def main():
    with open(DATA / "wa_statements.jsonl", "w", encoding="utf-8") as f:
        for year, e in GENERALS.items():
            guide = json.loads(fetch(f"{API}/voterguide.ashx?e={e}&la=en&c=XX&p=XX", "wa", delay=1.0))
            races = {r["RaceID"]: r for c in guide["Categories"] if c["CategoryCode"] == "FED" for r in c["Races"]}
            n = 0
            for rid, race in races.items():
                for item in json.loads(fetch(f"{API}/candidate.ashx?e={e}&r={rid}&b=0&la=en&c=XX", "wa", delay=1.0)):
                    s = item["statement"]
                    pref = (s.get("PartyName") or "").strip("() ")
                    pref = pref.replace("Prefers ", "").replace("States No Party Preference", "No party preference")
                    text = text_of(s.get("Statement") or s.get("CandidateStatementText") or "")
                    f.write(json.dumps(dict(year=year, office="Senate" if "Senator" in race["Name"] else "House",
                                            district=s.get("RaceJurisdictionName", ""), name=s["BallotName"],
                                            party=pref, party_group=party_group(pref), website=s.get("OrgWebsite", ""),
                                            text=text)) + "\n")
                    n += 1
            print(year, n, "candidates")


if __name__ == "__main__":
    main()
