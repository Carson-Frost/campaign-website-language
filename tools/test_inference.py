"""Checks inference.py against published and hand-worked values.

  python -m unittest test_inference
"""
import csv
import unittest

import inference as inf
from common import ROOT

# The fifteen p-values of Benjamini and Hochberg (1995), their worked example.
BH_1995 = [0.0001, 0.0004, 0.0019, 0.0095, 0.0201, 0.0278, 0.0298, 0.0344, 0.0459, 0.3240, 0.4262, 0.5719,
           0.6528, 0.7590, 1.0000]


class IntervalTest(unittest.TestCase):
    def test_wilson_matches_the_values_worked_for_the_precision_check(self):
        for (k, n), expected in {(18, 20): (0.70, 0.97), (20, 20): (0.84, 1.00), (50, 50): (0.93, 1.00),
                                 (90, 100): (0.83, 0.94)}.items():
            lo, hi = inf.wilson(k, n)
            self.assertEqual((round(lo, 2), round(hi, 2)), expected, (k, n))

    def test_thirty_five_error_free_checks_are_the_fewest_that_support_ninety_percent(self):
        self.assertLess(inf.wilson(34, 34)[0], 0.90)
        self.assertGreaterEqual(inf.wilson(35, 35)[0], 0.90)

    def test_wilson_stays_inside_zero_and_one(self):
        for k, n in ((0, 5), (5, 5), (0, 400), (400, 400)):
            lo, hi = inf.wilson(k, n)
            self.assertGreaterEqual(lo, 0.0)
            self.assertLessEqual(hi, 1.0)

    def test_newcombe_matches_the_published_example(self):
        # Newcombe (1998), 56/70 against 48/80: difference 0.2000 with method 10 interval 0.0524 to 0.3339.
        d, lo, hi = inf.newcombe_difference(56, 70, 48, 80)
        self.assertAlmostEqual(d, 0.2, places=9)
        self.assertEqual((round(lo, 4), round(hi, 4)), (0.0524, 0.3339))

    def test_newcombe_swapping_the_groups_negates_the_interval(self):
        d, lo, hi = inf.newcombe_difference(30, 100, 45, 120)
        d2, lo2, hi2 = inf.newcombe_difference(45, 120, 30, 100)
        self.assertAlmostEqual(d, -d2)
        self.assertAlmostEqual(lo, -hi2)
        self.assertAlmostEqual(hi, -lo2)

    def test_newcombe_interval_for_equal_groups_is_centered_on_zero(self):
        d, lo, hi = inf.newcombe_difference(10, 50, 10, 50)
        self.assertEqual(d, 0.0)
        self.assertAlmostEqual(lo, -hi)


class ExactTestTest(unittest.TestCase):
    def test_fisher_tea_tasting_example(self):
        # Four of eight cups: 34 of the 70 equally weighted tables are no more likely than [[3, 1], [1, 3]].
        self.assertAlmostEqual(inf.fisher_exact(3, 1, 1, 3), 34 / 70)

    def test_fisher_identical_groups_give_one(self):
        self.assertEqual(inf.fisher_exact(5, 5, 5, 5), 1.0)

    def test_fisher_is_unchanged_by_swapping_rows_or_columns(self):
        p = inf.fisher_exact(12, 38, 3, 47)
        self.assertAlmostEqual(p, inf.fisher_exact(3, 47, 12, 38))
        self.assertAlmostEqual(p, inf.fisher_exact(38, 12, 47, 3))

    def test_fisher_clear_difference_is_very_small(self):
        self.assertLess(inf.fisher_exact(114, 230, 32, 287), 1e-9)

    def test_fisher_never_exceeds_one(self):
        self.assertLessEqual(inf.fisher_exact(0, 10, 0, 10), 1.0)


class MultipleTestingTest(unittest.TestCase):
    def test_benjamini_hochberg_rejects_four_of_the_1995_example_at_five_percent(self):
        q = inf.benjamini_hochberg(BH_1995)
        self.assertEqual(sum(x <= 0.05 for x in q), 4)

    def test_benjamini_hochberg_adjusted_values_by_hand(self):
        q = inf.benjamini_hochberg(BH_1995)
        self.assertAlmostEqual(q[0], 0.0001 * 15)
        self.assertAlmostEqual(q[1], 0.0004 * 15 / 2)
        self.assertAlmostEqual(q[2], 0.0019 * 15 / 3)
        self.assertAlmostEqual(q[3], 0.0095 * 15 / 4)

    def test_adjusted_values_are_in_the_original_order_and_never_below_the_raw_value(self):
        shuffled = [BH_1995[i] for i in (7, 2, 14, 0, 9, 3, 5, 11, 1, 6, 13, 4, 10, 8, 12)]
        q = inf.benjamini_hochberg(shuffled)
        for raw, adjusted in zip(shuffled, q):
            self.assertGreaterEqual(adjusted, raw)
        self.assertEqual(q[3], inf.benjamini_hochberg(BH_1995)[0])

    def test_benjamini_yekutieli_is_the_harmonic_sum_times_benjamini_hochberg(self):
        c = sum(1 / i for i in range(1, 16))
        by, bh = inf.benjamini_yekutieli(BH_1995), inf.benjamini_hochberg(BH_1995)
        self.assertAlmostEqual(by[0], bh[0] * c)
        self.assertTrue(all(y >= h for y, h in zip(by, bh)))
        self.assertTrue(all(y <= 1.0 for y in by))

    def test_a_single_test_is_unchanged(self):
        self.assertEqual(inf.benjamini_hochberg([0.03]), [0.03])


class BoundsTest(unittest.TestCase):
    def test_bounds_for_fifty_six_percent_coverage_and_a_thirty_percent_share(self):
        lo, hi = inf.manski_bounds(168, 560, 1000)
        self.assertAlmostEqual(lo, 0.168)
        self.assertAlmostEqual(hi, 0.608)

    def test_bounds_width_equals_the_unobserved_fraction(self):
        lo, hi = inf.manski_bounds(40, 100, 250)
        self.assertAlmostEqual(hi - lo, 150 / 250)

    def test_full_coverage_gives_a_point(self):
        lo, hi = inf.manski_bounds(40, 100, 100)
        self.assertEqual(lo, hi)


class AgreementTest(unittest.TestCase):
    def test_perfect_agreement_gives_alpha_one(self):
        self.assertEqual(inf.krippendorff_alpha_binary([(1, 1)] * 10 + [(0, 0)] * 10), 1.0)

    def test_alpha_by_hand(self):
        # 40 units coded 1 by both, 5 coded 0 by both, 5 split. 100 values: 85 ones, 15 zeros, observed
        # disagreement 2 * 5 / 100, expected disagreement 2 * 85 * 15 / (100 * 99).
        pairs = [(1, 1)] * 40 + [(0, 0)] * 5 + [(1, 0)] * 3 + [(0, 1)] * 2
        expected = 1 - (10 / 100) / (2550 / 9900)
        self.assertAlmostEqual(inf.krippendorff_alpha_binary(pairs), expected)
        self.assertAlmostEqual(inf.percent_agreement(pairs), 0.9)

    def test_alpha_is_low_when_nearly_all_codes_are_the_same_even_if_agreement_is_high(self):
        pairs = [(1, 1)] * 97 + [(1, 0), (0, 1), (0, 0)]
        self.assertGreater(inf.percent_agreement(pairs), 0.97)
        self.assertLess(inf.krippendorff_alpha_binary(pairs), 0.5)

    def test_systematic_disagreement_gives_negative_alpha(self):
        self.assertLess(inf.krippendorff_alpha_binary([(1, 0)] * 10 + [(0, 1)] * 10), 0)


class TableTest(unittest.TestCase):
    """The tables built from the tracked results agree with the counts in them."""

    @classmethod
    def setUpClass(cls):
        cls.gaps = inf.term_gaps()
        cls.bounds = inf.term_bounds()

    def test_every_term_and_year_has_a_row(self):
        with open(ROOT / "results" / "term_shares.csv", encoding="utf-8") as f:
            terms = {r["term"] for r in csv.DictReader(f)}
        years = {"2020", "2022", "2024", "2026"}
        self.assertEqual({(r[1], r[2]) for r in self.gaps}, {(t, y) for t in terms for y in years})
        self.assertEqual(len(self.gaps), 57 * 4)

    def test_working_families_2020_matches_the_walkthrough_example(self):
        row = next(r for r in self.gaps if r[1] == "working families" and r[2] == "2020")
        self.assertEqual((row[3], row[4]), (114, 344))
        self.assertAlmostEqual(row[7], 114 / 344, places=4)

    def test_intervals_contain_their_estimates(self):
        for r in self.gaps:
            self.assertLessEqual(r[8], r[7])
            self.assertGreaterEqual(r[9], r[7])
            self.assertLessEqual(r[14], r[13])
            self.assertGreaterEqual(r[15], r[13])

    def test_q_values_are_not_smaller_than_p_values_and_by_is_not_smaller_than_bh(self):
        for r in self.gaps:
            p, bh, by = float(r[16]), float(r[17]), float(r[18])
            self.assertGreaterEqual(bh, p * 0.999)
            self.assertGreaterEqual(by, bh * 0.999)

    def test_bounds_contain_the_observed_share_and_are_wider_for_the_ballot(self):
        for r in self.bounds:
            share, lo_s, hi_s, lo_b, hi_b = r[8], r[9], r[10], r[11], r[12]
            self.assertLessEqual(lo_s, share + 1e-4)
            self.assertGreaterEqual(hi_s, share - 1e-4)
            self.assertLessEqual(lo_b, lo_s + 1e-4)
            self.assertGreaterEqual(hi_b, hi_s - 1e-4)


if __name__ == "__main__":
    unittest.main()
