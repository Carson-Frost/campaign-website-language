"""Checks the classification of terms for question 1 on small made-up counts and on the tracked results.

  python -m unittest test_questions
"""
import unittest

import inference as inf
import questions as qn


def counts_for(**shares):
    """Counts for terms given as name=((D2020, D2022, D2024), (R2020, R2022, R2024)), 300 candidates per cell."""
    counts, themes = {}, {}
    for term, (dem, rep) in shares.items():
        themes[term] = "Test"
        for y, d, r in zip(qn.YEARS, dem, rep):
            counts[(term, y, "Democratic")] = (round(d * 300), 300)
            counts[(term, y, "Republican")] = (round(r * 300), 300)
        counts[(term, "2026", "Democratic")] = (90, 300)
        counts[(term, "2026", "Republican")] = (90, 300)
    return counts, themes


def classes(**shares):
    counts, themes = counts_for(**shares)
    # inference.term_gaps reads the results files, so rows in its layout are built here from the same counts.
    early = []
    for t in themes:
        for y in qn.YEARS:
            kd, nd = counts[(t, y, "Democratic")]
            kr, nr = counts[(t, y, "Republican")]
            gap, lo, hi = inf.newcombe_difference(kd, nd, kr, nr)
            early.append([themes[t], t, y, kd, nd, kr, nr, 0, 0, 0, 0, 0, 0, gap, lo, hi,
                          inf.fisher_exact(kd, nd - kd, kr, nr - kr)])
    q = inf.benjamini_hochberg([r[16] for r in early])
    gap_rows = [[*r, x, 1.0] for r, x in zip(early, q)]
    out, _ = qn.classify(counts, themes, gap_rows)
    return {r["term"]: r for r in out}


class ClassificationTest(unittest.TestCase):
    def test_a_steady_gap_is_split_and_still(self):
        c = classes(climate=((0.48, 0.49, 0.47), (0.10, 0.08, 0.09)))["climate"]
        self.assertTrue(c["split"])
        self.assertEqual(c["favors"], "Democratic")
        self.assertFalse(c["moving"])
        self.assertEqual(c["label"], "split, still")

    def test_a_republican_gap_is_attributed_to_republicans(self):
        c = classes(border=((0.20, 0.15, 0.22), (0.58, 0.57, 0.60)))["border"]
        self.assertEqual((c["favors"], c["label"]), ("Republican", "split, still"))

    def test_a_persistent_gap_with_big_movement_is_split_and_moving(self):
        c = classes(border=((0.10, 0.20, 0.35), (0.50, 0.60, 0.75)))["border"]
        self.assertTrue(c["split"])
        self.assertTrue(c["moving"])
        self.assertEqual(c["label"], "split, moving")
        self.assertTrue(c["moves"])

    def test_a_gap_that_changes_sign_is_not_split(self):
        c = classes(abortion=((0.10, 0.45, 0.60), (0.40, 0.20, 0.15)))["abortion"]
        self.assertFalse(c["split"])
        self.assertEqual(c["favors"], "")
        self.assertTrue(c["moving"])
        self.assertEqual(c["label"], "not consistently split, moving")

    def test_no_gap_and_no_movement(self):
        c = classes(hardworking=((0.20, 0.21, 0.19), (0.20, 0.22, 0.20)))["hardworking"]
        self.assertFalse(c["split"])
        self.assertFalse(c["moving"])
        self.assertEqual(c["label"], "not consistently split, still")

    def test_a_gap_that_is_significant_in_only_two_years_is_not_split(self):
        c = classes(x=((0.30, 0.30, 0.22), (0.10, 0.10, 0.20)))["x"]
        self.assertFalse(c["split"])


class ChangeTest(unittest.TestCase):
    def test_changes_cover_every_party_and_pair_for_each_term(self):
        counts, themes = counts_for(a=((0.1, 0.2, 0.3), (0.3, 0.2, 0.1)), b=((0.5, 0.5, 0.5), (0.1, 0.1, 0.1)))
        rows = qn.changes(counts, sorted(themes))
        self.assertEqual(len(rows), 2 * 2 * 2)
        self.assertTrue(all(r["q"] >= r["p"] for r in rows))

    def test_tracked_results_give_a_row_for_every_term_and_the_expected_known_cases(self):
        counts, themes = qn.load_counts()
        out, chg = qn.classify(counts, themes, inf.term_gaps())
        self.assertEqual(len(out), 57)
        self.assertEqual(len(chg), 57 * 2 * 2)
        by = {r["term"]: r for r in out}
        self.assertEqual(by["climate"]["favors"], "Democratic")
        self.assertTrue(by["climate"]["split"])
        self.assertTrue(by["inflation"]["moving"])
        self.assertFalse(by["inflation"]["split"])
        self.assertTrue(by["abortion"]["moving"])
        self.assertFalse(by["abortion"]["split"])


if __name__ == "__main__":
    unittest.main()
