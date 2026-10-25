"""One-shot: emits tools/output/proposed_clusters.json and proposed_clusters.md.

Hand-curated clusters from the top-ranked master candidates. Pair-rule (overlap >= 0.5 AND
plausible meaning) applied by eye against tools/output/overlaps.csv, extended with obvious synonym
families (where terms are synonyms, co-occurrence is often low because the author picked one).
Each cluster carries a single partisan lean; terms with opposed lean never merge.

Not a reusable library. Re-run after master_candidates.csv or overlaps.csv change.
"""
import csv
import json
from collections import defaultdict
from pathlib import Path

from analyze import analyzed_texts, gram_counts

HERE = Path(__file__).parent
OUT = HERE / "output"

CLUSTERS = [
    {
        "name": "Trump identity",
        "theme": "Opponents and politics",
        "lean": "neutral",
        "patterns": [r"\btrump(?:'s)?\b"],
        "members": ["trump", "president trump", "donald trump", "president donald trump",
                    "trump administration", "president donald", "donald j trump"],
        "note": "Both parties name Trump; valence is set by surrounding text, not the token."
    },
    {
        "name": "Biden identity",
        "theme": "Opponents and politics",
        "lean": "neutral",
        "patterns": [r"\bbiden(?:'s)?\b"],
        "members": ["biden", "joe biden", "biden administration"]
    },
    {
        "name": "Working people",
        "theme": "Economy and class",
        "lean": "D",
        "patterns": [r"\bworking (?:people|families|class|men and women)\b",
                     r"\bmiddle[- ]class\b", r"\bworkers\b"],
        "members": ["working families", "middle class", "workers"]
    },
    {
        "name": "Small business",
        "theme": "Economy and class",
        "lean": "neutral",
        "patterns": [r"\bsmall business(?:es)?\b", r"\b(?:small )?business owners?\b"],
        "members": ["small business", "small businesses", "small business owners", "business owners"]
    },
    {
        "name": "Cost of living and affordability",
        "theme": "Economy and class",
        "lean": "neutral",
        "patterns": [r"\baffordab(?:le|ility)\b", r"\bcost of living\b",
                     r"\bmake ends meet\b", r"\blower the cost\b"],
        "members": ["affordable", "cost of living", "make ends meet", "lower the cost",
                    "access to affordable"]
    },
    {
        "name": "Minimum wage",
        "theme": "Economy and class",
        "lean": "D",
        "patterns": [r"\b(?:federal )?minimum wage\b"],
        "members": ["minimum wage", "federal minimum wage"]
    },
    {
        "name": "Jobs and economic growth",
        "theme": "Economy and class",
        "lean": "neutral",
        "patterns": [r"\bjobs?\b", r"\beconomy\b", r"\beconomic growth\b",
                     r"\bjob creation\b", r"\bgood[- ]paying jobs?\b"],
        "members": ["jobs", "economy", "economic growth", "job creation", "good-paying jobs"]
    },
    {
        "name": "Second Amendment / gun rights",
        "theme": "Rights and values",
        "lean": "R",
        "patterns": [r"\b(?:second|2nd) amendment\b", r"\bbear arms\b", r"\bkeep and bear\b"],
        "members": ["second amendment", "2nd amendment", "bear arms", "keep and bear"]
    },
    {
        "name": "Gun violence prevention",
        "theme": "Rights and values",
        "lean": "D",
        "patterns": [r"\bgun violence\b", r"\bbackground checks\b", r"\bmoms demand action\b"],
        "members": ["gun violence", "gun violence prevention", "background checks",
                    "moms demand action"]
    },
    {
        "name": "Reproductive rights",
        "theme": "Rights and values",
        "lean": "D",
        "patterns": [r"\bplanned parenthood\b", r"\broe v\.? wade\b", r"\bright to choose\b"],
        "members": ["planned parenthood", "roe v wade", "right to choose"]
    },
    {
        "name": "Border security",
        "theme": "Security and immigration",
        "lean": "R",
        "patterns": [r"\bborders?\b", r"\bsouthern border\b", r"\billegal immigration\b",
                     r"\bsecure the border\b"],
        "members": ["border", "border security", "southern border", "secure the border",
                    "illegal immigration"]
    },
    {
        "name": "Law enforcement",
        "theme": "Security and immigration",
        "lean": "neutral",
        "patterns": [r"\blaw enforcement\b", r"\bpolice\b", r"\bfirst responders?\b"],
        "members": ["law enforcement", "police", "law enforcement officers", "first responders",
                    "enforcement"]
    },
    {
        "name": "National defense",
        "theme": "Security and immigration",
        "lean": "R",
        "patterns": [r"\bnational security\b", r"\bmilitary\b", r"\barmed forces\b",
                     r"\bmarine corps\b", r"\bu\.?s\.? army\b"],
        "members": ["national security", "military", "marine corps", "u s army"]
    },
    {
        "name": "Health care access",
        "theme": "Programs and policy",
        "lean": "D",
        "patterns": [r"\bhealth ?care\b", r"\baffordable care act\b", r"\bhealth insurance\b",
                     r"\bpre-?existing conditions?\b"],
        "members": ["health care", "healthcare", "affordable care act", "affordable health care",
                    "health insurance", "pre-existing conditions"]
    },
    {
        "name": "Prescription drug costs",
        "theme": "Programs and policy",
        "lean": "D",
        "patterns": [r"\bprescription drugs?\b", r"\bprescription drug prices?\b"],
        "members": ["prescription drugs", "prescription drug", "prescription drug prices"]
    },
    {
        "name": "Climate and clean energy",
        "theme": "Programs and policy",
        "lean": "D",
        "patterns": [r"\bclimate(?: change)?\b", r"\bclean energy\b", r"\brenewable energy\b"],
        "members": ["climate change", "climate", "clean energy", "renewable energy"]
    },
    {
        "name": "Energy independence and oil",
        "theme": "Programs and policy",
        "lean": "R",
        "patterns": [r"\benergy (?:independence|dominance)\b", r"\boil and gas\b"],
        "members": ["energy independence", "oil and gas"]
    },
    {
        "name": "Education and schools",
        "theme": "Programs and policy",
        "lean": "neutral",
        "patterns": [r"\beducation\b", r"\bpublic schools\b", r"\bhigher education\b",
                     r"\bschool boards?\b"],
        "members": ["education", "public schools", "higher education", "students", "school board"]
    },
    {
        "name": "Rural and agriculture",
        "theme": "Programs and policy",
        "lean": "R",
        "patterns": [r"\brural\b", r"\bfarmers and ranchers\b", r"\bagriculture\b"],
        "members": ["rural", "rural communities", "farmers and ranchers"]
    },
    {
        "name": "Politicians and establishment",
        "theme": "Opponents and politics",
        "lean": "neutral",
        "patterns": [r"\bpoliticians?\b", r"\belected officials?\b", r"\bcareer politicians?\b"],
        "members": ["politicians", "elected officials", "political"]
    },
    {
        "name": "Republican Party",
        "theme": "Opponents and politics",
        "lean": "R",
        "patterns": [r"\brepublican(?:s|\s+party)?\b"],
        "members": ["republican", "republican party"]
    },
    {
        "name": "Democratic Party",
        "theme": "Opponents and politics",
        "lean": "D",
        "patterns": [r"\bdemocrat(?:s|ic(?:\s+party)?)?\b"],
        "members": ["democratic", "democratic party", "democrats"]
    },
    {
        "name": "Voting and civil rights",
        "theme": "Rights and values",
        "lean": "D",
        "patterns": [r"\bvoting rights\b", r"\bcivil rights\b"],
        "members": ["voting rights", "civil rights"]
    },
    {
        "name": "Common sense bipartisanship",
        "theme": "Opponents and politics",
        "lean": "neutral",
        "patterns": [r"\bcommon[- ]sense\b", r"\bacross the aisle\b", r"\bbi-?partisan(?:ship)?\b"],
        "members": ["common sense", "across the aisle"]
    },
    {
        "name": "Special interests and corporate influence",
        "theme": "Economy and class",
        "lean": "D",
        "patterns": [r"\bspecial interests\b", r"\bcitizens united\b", r"\bwall street\b"],
        "members": ["special interests", "citizens united", "wall street"]
    },
    {
        "name": "American identity",
        "theme": "Rights and values",
        "lean": "neutral",
        "patterns": [r"\bamericans?\b", r"\bamerica\b", r"\bnation\b"],
        "members": ["american", "americans", "america", "nation"]
    },
    {
        "name": "Foreign policy",
        "theme": "Security and immigration",
        "lean": "neutral",
        "patterns": [r"\bforeign (?:policy|affairs)\b", r"\bmiddle east\b"],
        "members": ["foreign policy", "foreign", "middle east"]
    },
    {
        "name": "Government spending and debt",
        "theme": "Economy and class",
        "lean": "R",
        "patterns": [r"\b(?:government |federal )?spending\b", r"\bdebt\b",
                     r"\bfiscal responsibility\b"],
        "members": ["spending", "debt", "fiscal responsibility"]
    },
    # America First / MAGA dropped: only "america first" surfaced in the top 300, singleton rule.
]

# Flagged clusters: the five Carson should sanity-check first.
FLAGGED = {
    "Small business",
    "Cost of living and affordability",
    "Politicians and establishment",
    "Common sense bipartisanship",
    "American identity",
}

# Pairs the overlap data suggested but we did not merge, and why.
NOT_MERGED = [
    ("human rights", "voting rights", 0.266,
     "Different scopes: human rights is global, voting rights is U.S. ballot access."),
    ("human rights", "civil rights", 0.312,
     "Human rights (international framing) vs civil rights (U.S. constitutional, 1960s legacy)."),
    ("supreme court", "attorney general", 0.248,
     "A court vs an executive office; co-occur in judicial-nominations contexts, not synonyms."),
    ("immigration", "border", None,
     "Immigration splits by lean (reform=D, security=R); the unigram is left as a singleton."),
    ("american dream", "america first", None,
     "Opposed cultural frames: American dream (opportunity, D-leaning in use) vs America first (R-coded nationalism). Different lean, no merge."),
    ("pro-life (right to life)", "pro-choice (right to choose)", None,
     "Opposed lean. Right to life is left as a singleton pending a dedicated pro-life cluster."),
]


def main():
    _, _, _, _, _, _, analyzed = analyzed_texts()

    # Doc sets for every member term, so the MD can show the anchor overlap honestly.
    needed = {1: set(), 2: set(), 3: set()}
    for c in CLUSTERS:
        for m in c["members"]:
            n = len(m.split())
            if 1 <= n <= 3:
                needed[n].add(m)
    sets = defaultdict(set)
    for k, text in analyzed.items():
        gc = gram_counts(text)
        for n in (1, 2, 3):
            for g in needed[n] & set(gc[n]):
                sets[g].add(k)

    def pair_overlap(a, b):
        sa, sb = sets.get(a, set()), sets.get(b, set())
        if not sa or not sb:
            return None
        return len(sa & sb) / min(len(sa), len(sb))

    out_json = []
    rows_md = []
    for c in CLUSTERS:
        members_with_counts = sorted(c["members"], key=lambda m: -len(sets.get(m, set())))
        if len(members_with_counts) >= 2:
            a, b = members_with_counts[0], members_with_counts[1]
            ov = pair_overlap(a, b)
            anchor = f"{a} / {b}" + (f" ({ov:.2f})" if ov is not None else " (n/a)")
        else:
            anchor = f"{members_with_counts[0]} (singleton)" if members_with_counts else "(empty)"
        out_json.append({k: v for k, v in c.items() if k != "note"} | ({"note": c["note"]} if "note" in c else {}))
        rows_md.append((c["name"], c["theme"], c["lean"], ", ".join(c["members"]), anchor))

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "proposed_clusters.json").write_text(
        json.dumps(out_json, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = []
    lines.append("# Proposed synonym clusters")
    lines.append("")
    lines.append(f"Count: {len(CLUSTERS)} clusters covering {sum(len(c['members']) for c in CLUSTERS)} "
                 "member terms from the top 300 of tools/output/master_candidates.csv (top 150 unigrams, "
                 "top 100 bigrams, top 50 trigrams). Pair-rule: overlap >= 0.5 AND shared meaning; known "
                 "synonym families (freedom and liberty, 2nd Amendment variants, Roe and Planned "
                 "Parenthood, climate and clean energy) are kept together even when co-occurrence is low "
                 "because authors pick one wording per site. No cross-lean merges.")
    lines.append("")
    lines.append("## Clusters")
    lines.append("")
    lines.append("| Cluster | Theme | Lean | Members | Anchor overlap |")
    lines.append("| --- | --- | --- | --- | --- |")
    for name, theme, lean, members, anchor in rows_md:
        marker = " (flag)" if name in FLAGGED else ""
        lines.append(f"| {name}{marker} | {theme} | {lean} | {members} | {anchor} |")
    lines.append("")
    lines.append("## Flagged for Carson's veto")
    lines.append("")
    lines.append("Five clusters whose lean assignment or coherence is weakest; cleanly removable without "
                 "disturbing the rest.")
    lines.append("")
    for name, theme, lean, members, anchor in rows_md:
        if name in FLAGGED:
            lines.append(f"- **{name}** ({lean}): {members}. Why flagged: see note below.")
    lines.append("")
    lines.append("Reasons by cluster:")
    lines.append("")
    lines.append("- **Small business**: both parties invoke small business owners positively; "
                 "the lean=neutral call could instead sit under R depending on the final frame.")
    lines.append("- **Cost of living and affordability**: affordable attaches to housing (D), "
                 "health care (D), and groceries (R attack on inflation); a flat lean oversimplifies.")
    lines.append("- **Politicians and establishment**: both parties attack politicians, with the "
                 "overlap at 0.37 (below the 0.5 rule); the cluster is a seeded merge.")
    lines.append("- **Common sense bipartisanship**: overlap 0.25; common sense skews R in solo "
                 "use (common-sense conservative), across the aisle skews D.")
    lines.append("- **American identity**: american, americans, america and nation are near-"
                 "universal filler; may add noise rather than signal.")
    lines.append("")
    lines.append("## Suggested but not merged")
    lines.append("")
    lines.append("| Pair | Overlap | Reason |")
    lines.append("| --- | --- | --- |")
    for a, b, ov, why in NOT_MERGED:
        ov_s = f"{ov:.2f}" if isinstance(ov, float) else "n/a"
        lines.append(f"| {a} / {b} | {ov_s} | {why} |")
    lines.append("")

    (OUT / "proposed_clusters.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT / 'proposed_clusters.json'}")
    print(f"wrote {OUT / 'proposed_clusters.md'}")
    print(f"clusters: {len(CLUSTERS)}")
    print(f"flagged:  {len(FLAGGED)}")


if __name__ == "__main__":
    main()
