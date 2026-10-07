"""Checks tone.py against the Lexicoder documentation's own examples.

  python -m unittest test_tone
"""
import unittest

import tone


class LexicoderTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.steps = tone.lsdprep_rules()
        cls.lsd = tone.DictionaryCounter({**tone.lsd_dictionary("LSD2015.lc3", cls.steps),
                                          **tone.lsd_dictionary("LSD2015_NEG.lc3", cls.steps)})

    def counts(self, text):
        return self.lsd.count(tone.preprocess(text, self.steps).lower().split())

    def test_dictionary_sizes_match_the_documentation(self):
        # quanteda's data_dictionary_LSD2015 documentation: 2,858 negative, 1,709 positive,
        # 1,721 negated positive and 2,860 negated negative patterns.
        d = tone.lsd_dictionary("LSD2015.lc3", self.steps)
        n = tone.lsd_dictionary("LSD2015_NEG.lc3", self.steps)
        self.assertEqual((len(d["negative"]), len(d["positive"])), (2858, 1709))
        self.assertEqual((len(n["neg_positive"]), len(n["neg_negative"])), (1721, 2860))

    def test_codebook_negation_example(self):
        # LSD codebook: 10 positive and 5 negative words, 3 of the positives negated, give 7 and 8. With
        # one-dictionary matching the 3 negated phrases are not also counted as positive words.
        self.assertEqual(tone.adjusted(dict(positive=7, negative=5, neg_positive=3, neg_negative=0)), (7, 8))

    def test_script_examples(self):
        # Examples given in the comments of LSDprep_dec2017.R.
        self.assertIn("am not", tone.preprocess("They ain't here.", self.steps))
        self.assertIn("xwell", tone.preprocess("He said, well, that was it.", self.steps))
        self.assertIn("may very xwell", tone.preprocess("It may very well rain.", self.steps))

    def test_negated_positive_counts_as_negative(self):
        pos, neg = tone.adjusted(self.counts("The voters are not happy."))
        self.assertEqual((pos, neg), (0, 1))

    def test_proper_nouns_are_not_counted(self):
        # Young and Soroka remove capitalized words; "Hope" inside a sentence is a name.
        self.assertEqual(sum(self.counts("We met Joy Hope today.").values()), 0)
        self.assertEqual(self.counts("We hope for joy.")["positive"], 2)

    def test_logit_scale(self):
        self.assertAlmostEqual(tone.logit(3, 1), round(__import__("math").log(3.5 / 1.5), 4))


class LineRuleTest(unittest.TestCase):
    def test_c4_rules(self):
        self.assertEqual(tone.line_drop("Donate today"), "under 5 words")
        self.assertEqual(tone.line_drop("This site uses cookies to improve your experience."),
                         "javascript or policy text")
        self.assertEqual(tone.line_drop("Protecting Social Security and Medicare for every senior"), "")


if __name__ == "__main__":
    unittest.main()
