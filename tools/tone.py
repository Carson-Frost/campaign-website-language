"""Sentiment and tone of the analyzed campaign texts by standard dictionary methods.

Each decision and its source is recorded in ../methods.md. No language model or trained classifier
scores the text; every file the method reads is checked against a SHA-256 hash, so a rerun on the same
texts gives the same output.

  python tone.py    -> artifacts/data/tone_sentences.jsonl and results/tone_scores.csv

Texts are exactly the screened texts analyze.py analyzes (analyze.analyzed_texts). Per candidate-year:

1. Lines (the extracted paragraphs) are kept or dropped by C4's line rules (Raffel et al. 2020): fewer
   than 5 words, or containing "javascript" or a cookie or policy string.
2. Each kept line is split into sentences with pysbd (paragraph breaks first, as in Read et al. 2012).
3. Each sentence is preprocessed with the Lexicoder Sentiment Dictionary's R preprocessing script
   (Luxon 2017), whose replacement rules are read from the distributed file and applied in order, and
   counted against LSD2015 and LSD2015_NEG (Young and Soroka 2012) as one dictionary, so that a
   negated phrase such as "not happy" counts only once, as a negated positive.
4. Counts are combined as quanteda.sentiment does: positive = Positive + Neg_Negative and negative =
   Negative + Neg_Positive, which equals the LSD codebook's subtraction rule whenever the negated
   phrase's base word would also have been counted. The document score is
   log((positive + 0.5) / (negative + 0.5)) (Proksch et al. 2019; quanteda.sentiment's default), and
   Young and Soroka's net tone, (positive - negative) / words, is also given.
5. Tone toward the opponents and toward the other party uses the same counts from only the sentences
   that name them (Young and Soroka 2012's party and leader co-occurrence measure).
6. Threat is the percentage of words that are in the threat dictionary (Choi et al. 2022).
"""
import csv
import hashlib
import json
import math
import re
import sys
import zipfile
from collections import Counter, defaultdict

from analyze import MIN_WORDS, RESULTS, analyzed_texts
from common import ART, DATA

SENTENCES = DATA / "tone_sentences.jsonl"
LEX = ART / "lexicons"
SOURCES = {  # file, URL, SHA-256
    "lsd": (LEX / "lsd" / "LSDaug2015.zip", "https://www.snsoroka.com/s/LSDaug2015.zip",
            "07416e15df7d04b3a3e0ff553a704fb16d25340ce045eda2a7ddecb53fe18907"),
    "lsdprep": (LEX / "lsd" / "LSDprep_dec2017R.zip", "https://www.snsoroka.com/s/LSDprep_dec2017R.zip",
                "7f11b5ad1a6defebe583928cac3ba9e02fbd6885d871aa9cbd1cda099a4333ad"),
    "threat": (LEX / "threat.txt",
               "https://www.michelegelfand.com/_files/ugd/6df109_fe3dfb71a3d24fbeb16a26e32b07738a.txt?dn=threat.txt",
               "325c926bf365481008f675e45802666b858cd67749bc75bb407f2740a1b8f922"),
}


def source_bytes(name):
    """Bytes of a source file, downloaded when missing, after checking its SHA-256 hash."""
    path, url, sha = SOURCES[name]
    if not path.exists():
        import requests
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=120).content)
    data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() != sha:
        sys.exit(f"{path} does not match its pinned SHA-256 hash; the measures would not be repeatable")
    return data


def zip_member(name, suffix):
    source_bytes(name)
    with zipfile.ZipFile(SOURCES[name][0]) as z:
        member, = [m for m in z.namelist() if m.endswith(suffix) and "__MACOSX" not in m]
        return z.read(member)


# ---- Line rules (C4) ----

C4_MIN_WORDS = 5
C4_POLICY = ("terms of use", "privacy policy", "cookie policy", "uses cookies", "use of cookies", "use cookies")


def line_drop(line):
    """C4's line rules (Raffel et al. 2020, section 2.2). C4's further rule that a line must end in
    terminal punctuation is not applied: campaign platforms are often headings and bullets, which
    CampaignView (Porter, Case and Treul 2025) keeps as platform points."""
    low = line.lower()
    if len(line.split()) < C4_MIN_WORDS:
        return "under 5 words"
    if "javascript" in low or any(p in low for p in C4_POLICY):
        return "javascript or policy text"
    return ""


# ---- Lexicoder preprocessing, read from LSDprep_dec2017.R ----

# The script's functions in the order its instructions give: the two punctuation-dependent functions,
# the two optional functions that keep acronyms and abbreviations whole, punctuation spacing, negation,
# dictionary false hits, and the optional proper-noun marking that matches Young and Soroka's removal
# of capitalized words.
LSDPREP_ORDER = ["LSDprep_contr", "LSDprep_dict_punct", "remove_punctuation_from_acronyms",
                 "remove_punctuation_from_abbreviations", "LSDprep_punctspace", "LSDprep_negation", "LSDprep_dict",
                 "mark_proper_nouns"]
R_CALL = re.compile(r"\b(str_replace_all|str_replace|str_trim)\(x, (?:pattern|side) = ")
REPLACEMENT_ARG = re.compile(r"\s*,\s*replacement\s*=\s*")


def r_string(src, i):
    """Parse the R string literal starting at src[i]; return (value, index after it)."""
    q, out, i = src[i], [], i + 1
    while src[i] != q:
        if src[i] == "\\":
            out.append({"n": "\n", "t": "\t"}.get(src[i + 1], src[i + 1]))
            i += 2
        else:
            out.append(src[i])
            i += 1
    return "".join(out), i + 1


def icu_replacement(rep):
    """stringr replacement semantics: a backslash and digit is a group reference, and a backslash
    before any other character makes that character literal."""
    parts, i = [], 0
    while i < len(rep):
        if rep[i] == "\\" and i + 1 < len(rep):
            parts.append(int(rep[i + 1]) if rep[i + 1].isdigit() else rep[i + 1])
            i += 2
        else:
            parts.append(rep[i])
            i += 1
    return lambda m: "".join((m.group(p) or "") if isinstance(p, int) else p for p in parts)


def lsdprep_rules():
    """Ordered (function, regex, replacement, first_only) steps; a None regex is str_trim."""
    src = zip_member("lsdprep", "LSDprep_dec2017.R").decode("utf-8").replace("\r\n", "\n")
    steps = []
    for fn in LSDPREP_ORDER:
        start = src.index(f"\n{fn} <- function(x)")
        body = src[start:src.index("\n}", start)]
        for m in R_CALL.finditer(body):
            if m.group(1) == "str_trim":
                steps.append((fn, None, None, False))
                continue
            pat, j = r_string(body, m.end())
            sep = REPLACEMENT_ARG.match(body, j)
            assert sep, (fn, pat)
            rep, _ = r_string(body, sep.end())
            steps.append((fn, re.compile(pat), icu_replacement(rep), m.group(1) == "str_replace"))
        calls = len(re.findall(r"\bstr_(?:replace_all|replace|trim)\(", body))
        assert calls == sum(s[0] == fn for s in steps), f"{fn}: parsed {sum(s[0] == fn for s in steps)} of {calls}"
    return steps


def preprocess(text, steps):
    for _, rx, rep, first in steps:
        text = text.strip() if rx is None else rx.sub(rep, text, count=1 if first else 0)
    return text


# ---- LSD dictionaries ----

def lsd_dictionary(member, steps):
    """{category: [token patterns]} from an .lc3 file. Entries are tokenized by the same punctuation
    spacing as the text, so that entries such as "no man's land" align with preprocessed tokens. A
    trailing * matches any ending, as in Lexicoder and quanteda's glob patterns."""
    spacing = [s for s in steps if s[0] == "LSDprep_punctspace"]
    cats, cur = defaultdict(list), None
    for line in zip_member("lsd", member).decode("ascii").splitlines():
        if line.startswith("+"):
            cur = line[1:].split("#")[0]
        elif line.strip():
            toks = preprocess(line.strip(), spacing).split()
            cats[cur].append(tuple((t.rstrip("*"), t.endswith("*")) for t in toks))
    return dict(cats)


class DictionaryCounter:
    """Counts a dictionary's categories by greedy left-to-right longest match, so each token counts
    at most once (as quanteda's lookup with nested_scope = "dictionary" does)."""

    def __init__(self, dictionary):
        self.exact, self.prefix = defaultdict(list), defaultdict(list)
        for cat, pats in dictionary.items():
            for p in pats:
                (self.prefix if p[0][1] else self.exact)[p[0][0]].append((p, cat))

    def count(self, toks):
        out, i = Counter(), 0
        while i < len(toks):
            t = toks[i]
            cands = self.exact.get(t, []) + [c for n in range(1, len(t) + 1) for c in self.prefix.get(t[:n], [])]
            best = None
            for p, cat in cands:
                if (best is None or len(p) > len(best[0])) and i + len(p) <= len(toks) and all(
                        toks[i + j].startswith(w) if star else toks[i + j] == w for j, (w, star) in enumerate(p)):
                    best = (p, cat)
            if best:
                out[best[1]] += 1
                i += len(best[0])
            else:
                i += 1
        return out


CATS = ("positive", "negative", "neg_positive", "neg_negative")


def adjusted(c):
    """Positive and negative counts with negations, as quanteda.sentiment's LSD2015 polarity sets them."""
    return c["positive"] + c["neg_negative"], c["negative"] + c["neg_positive"]


def logit(pos, neg):
    return round(math.log(pos + 0.5) - math.log(neg + 0.5), 4)


# ---- Other side: opponents and the other party ----

# Party names, and each party's national leaders from January 2019 to October 2026: presidents, vice
# presidents and the 2020 and 2024 presidential tickets, Speakers, and the House and Senate floor
# leaders (official House and Senate lists; see methods.md). Harris and Johnson alone also name places
# and many other people (Harris County, other Johnsons), so they need a first name or title.
PARTY_NAMES = {"Democratic": r"\bDemocrats?\b|\bDemocratic\b", "Republican": r"\bRepublicans?\b|\bGOP\b"}
LEADERS = {
    "Democratic": r"\bBiden\b|\bKamala\b|\b(?:Vice President|Senator|Sen\.) Harris\b|\bWalz\b|\bPelosi\b|"
                  r"\bHoyer\b|\bJeffries\b|\bSchumer\b",
    "Republican": r"\bTrump\b|\bPence\b|\bVance\b|\bMcCarthy\b|\b(?:Mike|Speaker) Johnson\b|\bScalise\b|"
                  r"\bMcConnell\b|\bThune\b",
}
SUFFIXES = {"jr", "sr", "ii", "iii", "iv"}
WORD = re.compile(r"[a-z0-9]+(?:['’-][a-z0-9]+)*")


def surname(name):
    parts = [p for p in re.findall(r"[A-Za-z][A-Za-z'-]*", name) if p.lower().strip(".") not in SUFFIXES]
    return parts[-1] if parts else ""


def target_patterns(meta):
    """Per candidate-year: a pattern for its opponents (every other candidate on the same ballot, by
    full name or surname) and one for the other party (names and leaders of each major party that is
    not the candidate's own, so both for independents and third parties)."""
    races = defaultdict(list)
    for k, r in meta.items():
        races[(r["year"], r["state"], r["office"], r["district"])].append(k)
    out = {}
    for k, r in meta.items():
        own = surname(r["name"])
        names = set()
        for o in races[(r["year"], r["state"], r["office"], r["district"])]:
            if o != k:
                names |= {meta[o]["name"].strip(), surname(meta[o]["name"])}
        names = sorted(n for n in names if len(n) >= 3 and n != own)
        opp = re.compile("|".join(rf"\b{re.escape(n)}\b" for n in names)) if names else None
        party = re.compile("|".join(PARTY_NAMES[p] + "|" + LEADERS[p] for p in PARTY_NAMES if p != r["party_group"]))
        out[k] = (opp, party)
    return out


# ---- Build ----

SCORE_HEADER = ["year", "cand_key", "name", "party_group", "office", "state", "district", "incumbent",
                "lines", "lines_dropped_under_5_words", "lines_dropped_javascript_policy", "sentences", "words",
                "below_min_words", "lsd_positive", "lsd_negative", "lsd_logit", "lsd_net_tone",
                "threat_words", "threat_pct",
                "opponent_sentences", "opponent_words", "opponent_lsd_positive", "opponent_lsd_negative",
                "opponent_lsd_logit", "other_party_sentences", "other_party_words", "other_party_lsd_positive",
                "other_party_lsd_negative", "other_party_lsd_logit"]


def score_row(k, m, lines, ld, doc):
    nw = doc[("all", "words")]
    row = [*k, m["name"], m["party_group"], m["office"], m["state"], m["district"], m["incumbent"], len(lines),
           ld["under 5 words"], ld["javascript or policy text"], doc[("all", "sentences")], nw, int(nw < MIN_WORDS)]
    if nw < MIN_WORDS:
        return row + [""] * (len(SCORE_HEADER) - len(row))
    pos, neg = adjusted({c: doc[("all", c)] for c in CATS})
    row += [pos, neg, logit(pos, neg), round((pos - neg) / nw, 5), doc[("all", "threat")],
            round(100 * doc[("all", "threat")] / nw, 4)]
    for scope in ("opponent", "other_party"):
        if doc[(scope, "sentences")]:
            pos, neg = adjusted({c: doc[(scope, c)] for c in CATS})
            row += [doc[(scope, "sentences")], doc[(scope, "words")], pos, neg, logit(pos, neg)]
        else:
            row += [0, 0, "", "", ""]
    return row


def build():
    import pysbd
    steps = lsdprep_rules()
    lsd = DictionaryCounter({**lsd_dictionary("LSD2015.lc3", steps), **lsd_dictionary("LSD2015_NEG.lc3", steps)})
    threat = {w.strip().lower() for w in source_bytes("threat").decode("utf-8").splitlines() if w.strip()}
    seg = pysbd.Segmenter(language="en", clean=False)
    meta, texts, source, dropped, words, excluded, analyzed = analyzed_texts()
    targets = target_patterns(meta)
    rows = []
    with open(SENTENCES, "w", encoding="utf-8") as f:
        for k in sorted(analyzed):
            opp, party = targets[k]
            lines = analyzed[k].split("\n")
            ld = Counter(line_drop(line) for line in lines)
            doc = Counter()
            for line in lines:
                if line_drop(line):
                    continue
                for s in filter(None, (s.strip() for s in seg.segment(line))):
                    toks = preprocess(s, steps).lower().split()
                    c = lsd.count(toks)
                    w = WORD.findall(s.lower())
                    r = dict(year=k[0], cand_key=k[1], text=s, words=len(w), threat=sum(t in threat for t in w),
                             opponent=int(bool(opp and opp.search(s))), other_party=int(bool(party.search(s))),
                             **{cat: c[cat] for cat in CATS})
                    f.write(json.dumps(r, ensure_ascii=False) + "\n")
                    for scope in ("all", "opponent", "other_party"):
                        if scope == "all" or r[scope]:
                            doc[(scope, "sentences")] += 1
                            for key in ("words", "threat", *CATS):
                                doc[(scope, key)] += r[key]
            rows.append(score_row(k, meta[k], lines, ld, doc))
    with open(RESULTS / "tone_scores.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(SCORE_HEADER)
        w.writerows(rows)
    below = sum(r[SCORE_HEADER.index("below_min_words")] for r in rows)
    print(f"{len(rows)} candidate-years scored; {below} below {MIN_WORDS} words after the line rules")


if __name__ == "__main__":
    build()
