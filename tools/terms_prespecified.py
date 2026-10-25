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
    ("Economy / Class", "working people", r"\bworking (?:men and women|people)\b"),
    ("Economy / Class", "working families", r"\bworking famil(?:y|ies)\b"),
    ("Economy / Class", "working class", r"\bworking[- ]class\b"),
    ("Economy / Class", "middle class", r"\bmiddle[- ]class\b"),
    ("Economy / Class", "hardworking", r"\bhard[- ]?working\b"),
    ("Economy / Class", "small business", r"\bsmall[- ]business(?:es)?\b"),
    ("Economy / Class", "inflation", r"\binflation\b(?! reduction act)"),
    ("Economy / Class", "cost of living", r"\bcosts? of living\b"),
    ("Economy / Class", "affordable / affordability", r"\baffordab(?:le|ility)\b"),
    ("Economy / Class", "unions", r"\b(?:labor |trade )?unions?\b"),
    ("Economy / Class", "billionaires", r"\bbillionaires?\b"),
    ("Economy / Class", "corporations / corporate",
     r"\b(?:big|large|giant|huge|massive|multinational|wealthy|greedy|powerful|mega-?) corporations?\b|\bcorporations\b|"
     r"\bcorporate (?:pacs?|greed|interests?|special[- ]interests|profits?|polluters?|landlords?|money|millions|donors?|"
     r"donations|contributions|welfare|tax(?:es|ation| rates?| breaks?| cuts?)?|income tax\w*|subsidies|lobby\w*|power|"
     r"executives|ceos?|monopol\w*|consolidation|price[- ]gouging|loopholes|handouts|bailouts|giveaways|accountability|"
     r"media|elites?|america|takeovers?|buyouts?|cash|dollars|influence|crime|fraud|control|owners|agenda)\b"),
    ("Economy / Class", "Big Pharma", r"\bbig pharma\b"),
    ("Economy / Class", "tariffs", r"\btariffs?\b"),
    ("Economy / Class", "tax cuts", r"\btax cuts?\b"),
    ("Opponents / Politics", "radical left", r"\bradical[- ]left\b"),
    ("Opponents / Politics", "socialism / socialist", r"\bsocialis[mt]s?\b"),
    ("Opponents / Politics", "woke", r"\bwoke\b"),
    ("Opponents / Politics", "MAGA", r"\bmaga\b"),
    ("Opponents / Politics", "extreme / extremist", r"\bextrem(?:e|ists?|ism)\b"),
    ("Opponents / Politics", "Trump", r"\btrump(?:'s)?\b"),
    ("Opponents / Politics", "Biden", r"\bbiden(?:'s)?\b"),
    ("Opponents / Politics", "career politicians", r"\bcareer politicians?\b"),
    ("Opponents / Politics", "the swamp", r"\b(?:the|drain the) swamp\b"),
    ("Opponents / Politics", "elites", r"\belites?\b"),
    ("Opponents / Politics", "corruption", r"\bcorrupt(?:ion)?\b"),
    ("Opponents / Politics", "bipartisan", r"\bbi-?partisan(?:ship)?\b"),
    ("Opponents / Politics", "common sense", r"\bcommon[- ]sense\b"),
    ("Opponents / Politics", "term limits", r"\bterm limits?\b"),
    ("Rights / Values", "freedom", r"(?<!medal of )\bfreedoms?\b(?! caucus\b| act\b)"),
    ("Rights / Values", "liberty", r"\bliberty\b"),
    ("Rights / Values", "democracy", r"\bdemocracy\b"),
    ("Rights / Values", "Constitution", r"\bconstitution(?:al)?\b"),
    ("Rights / Values", "Second Amendment", r"\b(?:second|2nd) amendment\b"),
    ("Rights / Values", "faith / God", r"\b(?:faith|god)\b"),
    ("Rights / Values", "parental rights", r"\bparent(?:s'?|al) rights\b"),
    ("Rights / Values", "abortion", r"\babortions?\b"),
    ("Rights / Values", "reproductive freedom / rights", r"\breproductive (?:freedom|rights|health ?care)\b"),
    ("Rights / Values", "pro-life / unborn", r"\bpro-?life\b|\bunborn\b"),
    ("Rights / Values", "election integrity", r"\belection integrity\b"),
    ("Security / Immigration", "border", r"\bborders?\b"),
    ("Security / Immigration", "illegal immigration / aliens", r"\billegal (?:immigra\w+|aliens?)\b"),
    ("Security / Immigration", "open borders", r"\bopen borders?\b"),
    ("Security / Immigration", "fentanyl", r"\bfentanyl\b"),
    ("Security / Immigration", "cartels", r"\bcartels?\b"),
    ("Security / Immigration", "law enforcement / police", r"\blaw enforcement\b|\bpolice\b"),
    ("Security / Immigration", "China", r"\bchina\b|\bccp\b|\bchinese communist\b"),
    ("Programs / Policy", "Social Security", r"\bsocial security\b"),
    ("Programs / Policy", "Medicare", r"\bmedicare\b"),
    ("Programs / Policy", "veterans", r"\bveterans?\b"),
    ("Programs / Policy", "health care",
     r"\bhealth ?care\b(?! (?:workers?|professionals?|representative|executive|company|companies|career|background|field|"
     r"sector)\b)"),
    ("Programs / Policy", "climate",
     r"(?<!business )(?<!political )(?<!economic )(?<!investment )(?<!regulatory )(?<!current )(?<!social )\bclimate\b"),
    ("Programs / Policy", "clean energy", r"\bclean energy\b"),
    ("Programs / Policy", "energy independence / dominance", r"\benergy (?:independen\w+|dominance)\b"),
    ("Programs / Policy", "housing", r"\bhousing\b"),
    ("Programs / Policy", "child care", r"\bchild ?care\b"),
    ("Programs / Policy", "artificial intelligence",
     r"\bartificial intelligence\b(?! \(ai\) technology)(?<!degree in artificial intelligence)|(?-i:(?<![A-Za-z])(?:AI|A\.I\.?)(?![A-Za-z]))(?!\) technology)"),
]


# Wordings for the abortion topic other than the word "abortion" and the terms above. Fixed in
# ANALYSIS_PLAN.md before any of them was counted, so they are kept apart from TERMS, and they are first
# candidates: each needs a precision check by two coders before a result is reported.
ADDED_TERMS = [
    ("Abortion", "pro-choice", r"\bpro-?choice\b"),
    ("Abortion", "a woman's right to choose", r"\bwom[ae]n'?s? (?:right|freedom) to choose\b"),
    ("Abortion", "bodily autonomy", r"\bbodily (?:autonomy|integrity)\b"),
    ("Abortion", "Roe v. Wade / Dobbs", r"\broe v\.? wade\b|\bdobbs\b"),
    ("Abortion", "abortion ban", r"\babortion bans?\b"),
    ("Abortion", "pro-abortion", r"\bpro-?abortion\b"),
    ("Abortion", "partial-birth / late-term abortion", r"\b(?:partial[- ]birth|late[- ]term) abortions?\b"),
    ("Abortion", "right to life / sanctity of life", r"\bright to life\b|\bsanctity of (?:human )?life\b"),
]
