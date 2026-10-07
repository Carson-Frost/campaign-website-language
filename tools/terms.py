"""Prespecified terms, fixed before any results were examined (2026-10-02).

Each entry: (theme, label, regex). Matching is case-insensitive on normalized text
(curly quotes straightened, whitespace collapsed). A candidate "uses" a term when it occurs at
least once anywhere in that candidate-year's collected website text.

Revised 2026-10-03 after hand-coding 20 random matches per term in the report's findings
(results/term_matches_coded.csv). Six patterns now skip matches that are not the term's sense:
the Inflation Reduction Act; Freedom Caucus, Freedom Act and Medal of Freedom; "business climate" and
similar idioms; text-message consent boilerplate and degree names for artificial intelligence; health
care as a job or sector description; and "corporate" outside political phrases (corporate PACs, greed,
profits and so on), which had matched biographies and company names.
"""
TERMS = [
    ("Economy and class", "working people", r"\bworking (?:men and women|people)\b"),
    ("Economy and class", "working families", r"\bworking famil(?:y|ies)\b"),
    ("Economy and class", "working class", r"\bworking[- ]class\b"),
    ("Economy and class", "middle class", r"\bmiddle[- ]class\b"),
    ("Economy and class", "hardworking", r"\bhard[- ]?working\b"),
    ("Economy and class", "small business", r"\bsmall[- ]business(?:es)?\b"),
    ("Economy and class", "inflation", r"\binflation\b(?! reduction act)"),
    ("Economy and class", "cost of living", r"\bcosts? of living\b"),
    ("Economy and class", "affordable / affordability", r"\baffordab(?:le|ility)\b"),
    ("Economy and class", "unions", r"\b(?:labor |trade )?unions?\b"),
    ("Economy and class", "billionaires", r"\bbillionaires?\b"),
    ("Economy and class", "corporations / corporate",
     r"\b(?:big|large|giant|huge|massive|multinational|wealthy|greedy|powerful|mega-?) corporations?\b|\bcorporations\b|"
     r"\bcorporate (?:pacs?|greed|interests?|special[- ]interests|profits?|polluters?|landlords?|money|millions|donors?|"
     r"donations|contributions|welfare|tax(?:es|ation| rates?| breaks?| cuts?)?|income tax\w*|subsidies|lobby\w*|power|"
     r"executives|ceos?|monopol\w*|consolidation|price[- ]gouging|loopholes|handouts|bailouts|giveaways|accountability|"
     r"media|elites?|america|takeovers?|buyouts?|cash|dollars|influence|crime|fraud|control|owners|agenda)\b"),
    ("Economy and class", "Big Pharma", r"\bbig pharma\b"),
    ("Economy and class", "tariffs", r"\btariffs?\b"),
    ("Economy and class", "tax cuts", r"\btax cuts?\b"),
    ("Opponents and politics", "radical left", r"\bradical[- ]left\b"),
    ("Opponents and politics", "socialism / socialist", r"\bsocialis[mt]s?\b"),
    ("Opponents and politics", "woke", r"\bwoke\b"),
    ("Opponents and politics", "MAGA", r"\bmaga\b"),
    ("Opponents and politics", "extreme / extremist", r"\bextrem(?:e|ists?|ism)\b"),
    ("Opponents and politics", "Trump", r"\btrump(?:'s)?\b"),
    ("Opponents and politics", "Biden", r"\bbiden(?:'s)?\b"),
    ("Opponents and politics", "career politicians", r"\bcareer politicians?\b"),
    ("Opponents and politics", "the swamp", r"\b(?:the|drain the) swamp\b"),
    ("Opponents and politics", "elites", r"\belites?\b"),
    ("Opponents and politics", "corruption", r"\bcorrupt(?:ion)?\b"),
    ("Opponents and politics", "bipartisan", r"\bbi-?partisan(?:ship)?\b"),
    ("Opponents and politics", "common sense", r"\bcommon[- ]sense\b"),
    ("Opponents and politics", "term limits", r"\bterm limits?\b"),
    ("Rights and values", "freedom", r"(?<!medal of )\bfreedoms?\b(?! caucus\b| act\b)"),
    ("Rights and values", "liberty", r"\bliberty\b"),
    ("Rights and values", "democracy", r"\bdemocracy\b"),
    ("Rights and values", "Constitution", r"\bconstitution(?:al)?\b"),
    ("Rights and values", "Second Amendment", r"\b(?:second|2nd) amendment\b"),
    ("Rights and values", "faith / God", r"\b(?:faith|god)\b"),
    ("Rights and values", "parental rights", r"\bparent(?:s'?|al) rights\b"),
    ("Rights and values", "abortion", r"\babortions?\b"),
    ("Rights and values", "reproductive freedom / rights", r"\breproductive (?:freedom|rights|health ?care)\b"),
    ("Rights and values", "pro-life / unborn", r"\bpro-?life\b|\bunborn\b"),
    ("Rights and values", "election integrity", r"\belection integrity\b"),
    ("Security and immigration", "border", r"\bborders?\b"),
    ("Security and immigration", "illegal immigration / aliens", r"\billegal (?:immigra\w+|aliens?)\b"),
    ("Security and immigration", "open borders", r"\bopen borders?\b"),
    ("Security and immigration", "fentanyl", r"\bfentanyl\b"),
    ("Security and immigration", "cartels", r"\bcartels?\b"),
    ("Security and immigration", "law enforcement / police", r"\blaw enforcement\b|\bpolice\b"),
    ("Security and immigration", "China", r"\bchina\b|\bccp\b|\bchinese communist\b"),
    ("Programs and policy", "Social Security", r"\bsocial security\b"),
    ("Programs and policy", "Medicare", r"\bmedicare\b"),
    ("Programs and policy", "veterans", r"\bveterans?\b"),
    ("Programs and policy", "health care",
     r"\bhealth ?care\b(?! (?:workers?|professionals?|representative|executive|company|companies|career|background|field|"
     r"sector)\b)"),
    ("Programs and policy", "climate",
     r"(?<!business )(?<!political )(?<!economic )(?<!investment )(?<!regulatory )(?<!current )(?<!social )\bclimate\b"),
    ("Programs and policy", "clean energy", r"\bclean energy\b"),
    ("Programs and policy", "energy independence / dominance", r"\benergy (?:independen\w+|dominance)\b"),
    ("Programs and policy", "housing", r"\bhousing\b"),
    ("Programs and policy", "child care", r"\bchild ?care\b"),
    ("Programs and policy", "artificial intelligence",
     r"\bartificial intelligence\b(?! \(ai\) technology)(?<!degree in artificial intelligence)|(?-i:\bAI\b)(?!\) technology)"),
]
