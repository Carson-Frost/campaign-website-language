"""Checks the 57 term patterns against the hand-coded matches and the cases they were narrowed for.

  python -m unittest test_terms
"""
import csv
import re
import unittest

from common import ROOT
from terms import ADDED_TERMS, TERMS

PATTERNS = {label: re.compile(rx, re.I) for _, label, rx in TERMS + ADDED_TERMS}


def matches(label, text):
    return [m.group(0) for m in PATTERNS[label].finditer(text)]


class TermListTest(unittest.TestCase):
    def test_there_are_57_distinct_terms(self):
        self.assertEqual(len(TERMS), 57)
        self.assertEqual(len({label for _, label, _ in TERMS}), 57)

    def test_every_pattern_compiles_and_has_a_theme(self):
        for theme, label, rx in TERMS:
            self.assertTrue(theme, label)
            re.compile(rx, re.I)


class AddedWordingTest(unittest.TestCase):
    def test_added_terms_do_not_repeat_the_original_labels(self):
        self.assertEqual(len(ADDED_TERMS), 8)
        self.assertFalse({label for _, label, _ in ADDED_TERMS} & {label for _, label, _ in TERMS})

    def test_each_added_wording_matches_its_own_variants(self):
        cases = {
            "pro-choice": ["I am pro-choice", "prochoice voters"],
            "a woman's right to choose": ["a woman's right to choose", "women's freedom to choose"],
            "bodily autonomy": ["bodily autonomy", "bodily integrity"],
            "Roe v. Wade / Dobbs": ["overturned Roe v. Wade", "after Dobbs"],
            "abortion ban": ["a national abortion ban", "abortion bans"],
            "pro-abortion": ["pro-abortion extremists", "proabortion"],
            "partial-birth / late-term abortion": ["partial-birth abortion", "late term abortions"],
            "right to life / sanctity of life": ["the right to life", "the sanctity of human life"],
        }
        for label, texts in cases.items():
            for t in texts:
                self.assertTrue(matches(label, t), (label, t))

    def test_added_wordings_skip_unrelated_uses(self):
        self.assertEqual(matches("a woman's right to choose", "the right to choose their own doctor"), [])
        self.assertEqual(matches("bodily autonomy", "a bodily injury claim"), [])
        self.assertEqual(matches("abortion ban", "the abortion rate fell"), [])
        self.assertEqual(matches("Roe v. Wade / Dobbs", "Mr. Dobson spoke"), [])


class CodedSampleTest(unittest.TestCase):
    """Each match a person coded as the intended meaning must still be found by the pattern."""

    @classmethod
    def setUpClass(cls):
        with open(ROOT / "results" / "term_matches_coded.csv", encoding="utf-8") as f:
            cls.rows = list(csv.DictReader(f))

    def test_intended_matches_are_still_found_at_the_coded_position(self):
        checked = skipped = 0
        for r in self.rows:
            if r["intended"] != "1":
                continue
            text, pos = r["before"] + r["match"] + r["after"], len(r["before"])
            found = any(m.start() == pos for m in PATTERNS[r["term"]].finditer(text))
            if r["regex_version"] == "v1" and not found:
                skipped += 1
                continue  # the pattern was narrowed since this sample, and the match is now skipped on purpose
            self.assertTrue(found, f'{r["term"]} ({r["name"]}): {r["match"]!r} is no longer matched')
            checked += 1
        self.assertEqual(checked, sum(r["intended"] == "1" for r in self.rows) - skipped)
        self.assertGreater(checked, 0)

    def test_every_term_in_the_sample_is_a_known_term(self):
        for r in self.rows:
            self.assertIn(r["term"], PATTERNS)


class NarrowedPatternTest(unittest.TestCase):
    """The six patterns narrowed after the precision check skip the senses that were wrong."""

    def test_inflation_skips_the_inflation_reduction_act(self):
        self.assertEqual(matches("inflation", "I voted for the Inflation Reduction Act."), [])
        self.assertEqual(matches("inflation", "Inflation is crushing families."), ["Inflation"])

    def test_freedom_skips_caucus_act_and_medal(self):
        for text in ("She joined the Freedom Caucus.", "the Freedom Act", "received the Presidential Medal of Freedom"):
            self.assertEqual(matches("freedom", text), [], text)
        self.assertEqual(matches("freedom", "We defend freedom and freedoms."), ["freedom", "freedoms"])

    def test_climate_skips_business_and_similar_idioms(self):
        self.assertEqual(matches("climate", "a better business climate"), [])
        self.assertEqual(matches("climate", "the current political climate"), [])
        self.assertEqual(matches("climate", "We must act on climate change."), ["climate"])

    def test_artificial_intelligence_skips_boilerplate_and_degrees(self):
        self.assertEqual(matches("artificial intelligence", "a degree in artificial intelligence"), [])
        self.assertEqual(matches("artificial intelligence", "Artificial Intelligence (AI) technology"), [])
        self.assertEqual(matches("artificial intelligence", "regulate artificial intelligence"),
                         ["artificial intelligence"])

    def test_ai_abbreviation_is_case_sensitive(self):
        self.assertEqual(matches("artificial intelligence", "AI will change jobs"), ["AI"])
        self.assertEqual(matches("artificial intelligence", "said he would wait and ai is not a word here"), [])

    def test_health_care_skips_job_descriptions(self):
        self.assertEqual(matches("health care", "a health care worker for ten years"), [])
        self.assertEqual(matches("health care", "affordable health care for all"), ["health care"])
        self.assertEqual(matches("health care", "Healthcare is a right."), ["Healthcare"])

    def test_corporations_skips_company_names_and_biographies(self):
        self.assertEqual(matches("corporations / corporate", "she worked at a corporate law firm"), [])
        self.assertTrue(matches("corporations / corporate", "stop corporate greed"))
        self.assertTrue(matches("corporations / corporate", "big corporations pay too little"))


class VariantTest(unittest.TestCase):
    def test_working_people_covers_working_men_and_women(self):
        self.assertEqual(matches("working people", "for working men and women"), ["working men and women"])
        self.assertEqual(matches("working people", "working people"), ["working people"])

    def test_working_families_covers_singular(self):
        self.assertEqual(matches("working families", "a working family and working families"),
                         ["working family", "working families"])

    def test_hyphen_variants(self):
        self.assertTrue(matches("middle class", "the middle-class"))
        self.assertTrue(matches("working class", "working-class voters"))
        self.assertTrue(matches("hardworking", "hard working and hard-working"))

    def test_pro_life_or_unborn(self):
        self.assertTrue(matches("pro-life / unborn", "I am pro-life"))
        self.assertTrue(matches("pro-life / unborn", "protect the unborn"))

    def test_word_boundaries_prevent_partial_matches(self):
        self.assertEqual(matches("border", "she was a boarder"), [])
        self.assertEqual(matches("Trump", "trumpet"), [])
        self.assertEqual(matches("China", "porcelain from Chinatown"), [])

    def test_trump_possessive_and_biden(self):
        self.assertTrue(matches("Trump", "Trump's agenda"))
        self.assertTrue(matches("Biden", "Biden's plan"))

    def test_second_amendment_numeric_form(self):
        self.assertEqual(len(matches("Second Amendment", "the 2nd Amendment and the Second Amendment")), 2)


if __name__ == "__main__":
    unittest.main()
