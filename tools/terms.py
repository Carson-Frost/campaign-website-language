"""Grid terms for the site.

Assembled in three deterministic layers:

1. The 57 pre-registered TERMS and 8 abortion wordings in terms_prespecified.py (verbatim audit
   trail, 65 entries). The spine.
2. Variant clusters from tools/output/proposed_clusters.json that are not already duplicates of a
   pre-registered entry. A cluster is a duplicate when any pre-registered pattern matches its name.
3. A hand-curated EXTRACTION_ADDITIONS list of substantive multi-word phrases that the extraction
   surfaced in tools/output/master_candidates.csv and that are not already covered by the first
   two layers. Themes are assigned by hand to each entry, so Programs and policy does not swallow
   everything the way a word-overlap heuristic would.

ADDED_TERMS keeps the 8 abortion wordings as a separate pre-registered set for scripts that read it.
"""
import json
import re
from pathlib import Path

from terms_prespecified import TERMS as PRE, ADDED_TERMS as ADDED_TERMS  # noqa: F401

ROOT = Path(__file__).resolve().parents[1]
CLUSTERS_JSON = ROOT / "tools" / "output" / "proposed_clusters.json"
FALLBACK_THEME = "Programs / Policy"


# Layer 3: curated multi-word additions motivated by master_candidates.csv ranks.
EXTRACTION_ADDITIONS = [
    ("Economy / Class", "economic growth", r"\beconomic growth\b"),
    ("Economy / Class", "special interests", r"\bspecial interests\b"),
    ("Economy / Class", "Citizens United", r"\bcitizens united\b"),
    ("Economy / Class", "future generations", r"\bfuture generations?\b"),
    ("Opponents / Politics", "elected officials", r"\belected officials?\b"),
    ("Rights / Values", "civil rights", r"\bcivil rights\b"),
    ("Rights / Values", "voting rights", r"\bvoting rights\b"),
    ("Rights / Values", "human rights", r"\bhuman rights\b"),
    ("Rights / Values", "bear arms", r"\bkeep and bear\b|\bbear arms\b"),
    ("Rights / Values", "American dream", r"\bamerican dream\b"),
    ("Rights / Values", "Supreme Court", r"\bsupreme court\b"),
    ("Security / Immigration", "national security", r"\bnational security\b"),
    ("Security / Immigration", "gun violence", r"\bgun violence\b"),
    ("Security / Immigration", "background checks", r"\bbackground checks?\b"),
    ("Security / Immigration", "criminal justice", r"\bcriminal justice\b"),
    ("Security / Immigration", "public safety", r"\bpublic safety\b"),
    ("Programs / Policy", "mental health", r"\bmental health\b"),
    ("Programs / Policy", "Affordable Care Act", r"\baffordable care act\b|\bobamacare\b"),
    ("Programs / Policy", "health insurance", r"\bhealth insurance\b"),
    ("Programs / Policy", "public schools", r"\bpublic schools?\b"),
    ("Programs / Policy", "renewable energy", r"\brenewable energy\b"),
    ("Programs / Policy", "foreign policy", r"\bforeign (?:policy|affairs)\b"),
    ("Programs / Policy", "school choice", r"\bschool choice\b"),
    ("Programs / Policy", "data centers", r"\bdata centers?\b"),
]

# Layer 4: interest-group endorsements. Each entry is a named organization that candidates mention
# as an endorser (of themselves) or an opponent frame. Counts are candidate-year presences in the
# corpus; all entries have at least 44 and most have at least 100. Carson named AIPAC explicitly.
ENDORSEMENT_GROUPS = [
    ("Endorsements", "Planned Parenthood", r"\bplanned parenthood\b"),
    ("Endorsements", "NRA", r"\bnra\b|\bnational rifle association\b"),
    ("Endorsements", "AFL-CIO", r"\bafl-?cio\b"),
    ("Endorsements", "Chamber of Commerce", r"\bchambers? of commerce\b"),
    ("Endorsements", "Sierra Club", r"\bsierra club\b"),
    ("Endorsements", "League of Conservation Voters", r"\bleague of conservation voters\b"),
    ("Endorsements", "NARAL", r"\bnaral\b|\breproductive freedom for all\b"),
    ("Endorsements", "Moms Demand Action", r"\bmoms demand action\b"),
    ("Endorsements", "Teamsters", r"\bteamsters\b"),
    ("Endorsements", "Teachers unions (NEA/AFT)", r"\bnational education association\b|\baft\b|\bamerican federation of teachers\b"),
    ("Endorsements", "SEIU", r"\bseiu\b"),
    ("Endorsements", "Giffords", r"\bgiffords\b"),
    ("Endorsements", "AFSCME", r"\bafscme\b"),
    ("Endorsements", "UAW", r"\buaw\b|\bunited auto workers\b"),
    ("Endorsements", "Human Rights Campaign", r"\bhuman rights campaign\b"),
    ("Endorsements", "National Right to Life", r"\bnational right to life\b"),
    ("Endorsements", "Susan B. Anthony List", r"\bsusan b\.? anthony\b|\bsba list\b"),
    ("Endorsements", "AIPAC", r"\baipac\b"),
]


# Layer 1: pre-registered spine (abortion wordings carry their original "Abortion" theme).
_terms = list(PRE) + list(ADDED_TERMS)
_patterns = [re.compile(rx, re.I) for _, _, rx in _terms]


def _covered(term):
    return any(p.search(term) for p in _patterns)


# Layer 2: variant clusters that are not pre-registered duplicates.
for _c in json.loads(CLUSTERS_JSON.read_text(encoding="utf-8")):
    if _covered(_c["name"]):
        continue
    _pat = "|".join(_c["patterns"])
    _entry = (_c.get("theme", FALLBACK_THEME), _c["name"], _pat)
    _terms.append(_entry)
    _patterns.append(re.compile(_pat, re.I))

# Layer 3: curated extraction additions. Themes assigned by hand; skip any whose pattern a prior
# layer already matches, to keep the audit trail honest.
for _th, _lab, _rx in EXTRACTION_ADDITIONS:
    if _covered(_lab):
        continue
    _terms.append((_th, _lab, _rx))
    _patterns.append(re.compile(_rx, re.I))

# Layer 4: interest-group endorsements. Independent of prior-layer coverage because a group name
# (e.g. "Planned Parenthood") can serve both as endorsement signal and as policy wording; the
# endorsement chart counts the full group-name mention regardless.
for _th, _lab, _rx in ENDORSEMENT_GROUPS:
    _terms.append((_th, _lab, _rx))
    _patterns.append(re.compile(_rx, re.I))

TERMS = _terms


# Topic chips group the grid into narrower user-facing categories than the five pre-registered themes.
# Each term is tagged with at least one topic. Topics_order lists the chips Carson wants on screen,
# Guns first because it is the use case he named, then the rest alphabetically.
_TOPICS = {
    "Guns": ["Second Amendment", "bear arms", "gun violence", "background checks",
             "NRA", "Moms Demand Action", "Giffords"],
    "Abortion": ["abortion", "reproductive freedom / rights", "pro-life / unborn",
                 "Planned Parenthood", "NARAL", "National Right to Life", "Susan B. Anthony List",
                 "pro-choice", "a woman's right to choose", "bodily autonomy",
                 "Roe v. Wade / Dobbs", "abortion ban", "pro-abortion",
                 "partial-birth / late-term abortion", "right to life / sanctity of life"],
    "Immigration": ["border", "illegal immigration / aliens", "open borders", "fentanyl", "cartels"],
    "Healthcare": ["health care", "Big Pharma", "Medicare", "Social Security", "mental health",
                   "Affordable Care Act", "health insurance", "Prescription drugs"],
    "Economy": ["working people", "working families", "working class", "middle class", "hardworking",
                "small business", "inflation", "cost of living", "affordable / affordability",
                "billionaires", "corporations / corporate", "housing", "economic growth",
                "special interests", "future generations", "Rural communities", "Chamber of Commerce"],
    "Labor": ["unions", "Minimum wage", "AFL-CIO", "Teamsters", "Teachers unions (NEA/AFT)",
              "SEIU", "AFSCME", "UAW"],
    "Taxes": ["tariffs", "tax cuts"],
    "Education": ["parental rights", "school choice", "public schools"],
    "Energy": ["climate", "clean energy", "energy independence / dominance", "renewable energy",
               "Sierra Club", "League of Conservation Voters"],
    "Opposition": ["Trump", "Biden", "MAGA", "radical left", "socialism / socialist", "woke",
                   "extreme / extremist", "career politicians", "the swamp", "elites", "corruption",
                   "Republican Party", "Democratic Party", "Citizens United"],
    "Elections": ["democracy", "election integrity", "voting rights", "civil rights", "term limits",
                  "elected officials"],
    "Foreign Policy": ["China", "national security", "foreign policy", "AIPAC"],
    "Public Safety": ["law enforcement / police", "criminal justice", "public safety"],
    "Values": ["freedom", "liberty", "Constitution", "faith / God", "American dream",
               "bipartisan", "common sense", "Human Rights Campaign", "human rights"],
    "Veterans": ["veterans"],
    "Other": ["child care", "Supreme Court"],
    "AI": ["artificial intelligence", "data centers"],
}

TOPIC_MAP = {}
for _topic, _labels in _TOPICS.items():
    for _lab in _labels:
        TOPIC_MAP.setdefault(_lab, []).append(_topic)

# Any TERMS label missing from the explicit lists falls to Other, so no chart leaves the grid.
for _th, _lab, _ in TERMS:
    TOPIC_MAP.setdefault(_lab, ["Other"])

TOPICS_ORDER = ["Guns"] + sorted(k for k in _TOPICS if k != "Guns")
