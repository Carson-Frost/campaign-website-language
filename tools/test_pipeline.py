"""Checks the screening, counting, ranking and address-handling rules on small made-up inputs.

  python -m unittest test_pipeline
"""
import math
import re
import unittest
from collections import Counter

import analyze
import common
import precision
import sites
from match_fec import toks


def words(n, word="garden"):
    return " ".join([word] * n)


class PartyGroupTest(unittest.TestCase):
    def test_labels_map_to_the_four_groups(self):
        cases = {
            "Democratic": "Democratic", "Democratic Party": "Democratic", "Democratic-Farmer-Labor": "Democratic",
            "Republican": "Republican", "Republican Party": "Republican",
            "No Party Affiliation": "Independent", "Independent": "Independent", "Unaffiliated": "Independent",
            "Libertarian Party": "Third party", "Green Party": "Third party", "Working Families Party": "Third party",
            "Independent Party of Oregon": "Third party",
            "": "Unknown",
        }
        for label, group in cases.items():
            self.assertEqual(common.party_group(label), group, label)


class AddressTest(unittest.TestCase):
    def test_wayback_links_are_unwrapped(self):
        self.assertEqual(sites.clean_site("https://web.archive.org/web/20200915id_/https://smithforcongress.com/"),
                         "https://smithforcongress.com/")

    def test_social_donation_reference_and_office_hosts_are_skipped(self):
        for url in ("https://www.facebook.com/smith", "https://secure.actblue.com/donate/smith",
                    "https://ballotpedia.org/Jane_Smith", "https://smith.house.gov/", "https://www.winred.com/x"):
            self.assertEqual(sites.clean_site(url), "", url)
        self.assertEqual(sites.clean_site("smithforcongress.com"), "smithforcongress.com")

    def test_norm_site_drops_www_and_adds_a_scheme(self):
        self.assertEqual(sites.norm_site("www.Example.com/about"), ("example.com", "www.example.com"))
        self.assertEqual(sites.norm_site("https://www2.example.com"), ("example.com", "www2.example.com"))

    def test_main_host_accepts_bare_and_www_only(self):
        self.assertTrue(sites.main_host("https://www.example.com/a", "example.com"))
        self.assertTrue(sites.main_host("https://example.com/a", "example.com"))
        self.assertFalse(sites.main_host("https://store.example.com/a", "example.com"))
        self.assertFalse(sites.main_host("https://example.com.evil.net/a", "example.com"))

    def test_page_key_ignores_trailing_slash_and_case(self):
        self.assertEqual(sites.page_key("https://example.com/Issues/"), "/issues")
        self.assertEqual(sites.page_key("https://example.com"), "/")

    def test_links_keep_same_site_content_pages_only(self):
        html = ('<a href="/issues">Issues</a> <a href="/donate">Give</a> <a href="https://other.com/x">x</a> '
                '<a href="/">Home</a> <a href="https://example.com/about#team">About</a> <a href="/shop/hats">Shop</a>')
        self.assertEqual(sites.links(html, "https://example.com/", "example.com"),
                         ["https://example.com/issues", "https://example.com/about"])

    def test_choose_prefers_linked_issue_and_biography_pages_and_stops_at_three(self):
        cands = {k: None for k in ("/about", "/issues", "/random", "/blog/post", "/priorities", "/zzz")}
        picked = sites.choose(cands, ["https://example.com/issues", "https://example.com/about"])
        self.assertEqual(len(picked), sites.MAX_PAGES)
        self.assertEqual(set(picked[:2]), {"/issues", "/about"})  # linked from the homepage, so first
        self.assertEqual(picked[2], "/priorities")  # a preferred name beats an unlinked page with a plain name
        self.assertNotIn("/blog/post", picked)


class ParagraphScreenTest(unittest.TestCase):
    def test_ordinary_english_is_kept(self):
        self.assertEqual(analyze.para_kind("We will fight for lower prices and better schools in our district."), "")

    def test_page_code_is_dropped(self):
        self.assertEqual(analyze.para_kind("a{color:red;margin:0;padding:1px} b{font-size:12px;top:0}"), "page code")

    def test_spam_needs_two_spam_words_or_a_spam_only_word(self):
        self.assertEqual(analyze.para_kind("Best slot gacor online casino jackpot"), "spam")
        self.assertEqual(analyze.para_kind("Thank you to Judi for her years of service to our community."), "")

    def test_placeholder_latin_is_dropped(self):
        self.assertEqual(analyze.para_kind("Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor"),
                         "placeholder text")

    def test_spanish_is_dropped_only_when_it_outweighs_english(self):
        self.assertEqual(analyze.para_kind("Nuestra campaña es por una comunidad que trabaja para su familia y con los demás"),
                         "not English")
        self.assertEqual(analyze.para_kind("We say que sera sera because the people of our state deserve a hearing"), "")

    def test_css_rules_leaked_into_text_are_removed(self):
        out = analyze.strip_css(".btn { color: red; } We fight for jobs")
        self.assertEqual(out.strip(), "We fight for jobs")
        self.assertEqual(analyze.strip_css("Plain text, no braces."), "Plain text, no braces.")

    def test_normalize_straightens_quotes_and_collapses_space(self):
        self.assertEqual(analyze.normalize("It’s  “time”\n now"), "It's \"time\" now")


class TokenTest(unittest.TestCase):
    def test_possessive_is_removed_and_hyphens_kept(self):
        self.assertEqual(analyze.tokens("Candidate's plan, 2nd-term"), ["candidate", "plan", "2nd-term"])

    def test_phrases_never_span_a_paragraph_break(self):
        c = analyze.gram_counts("a b c\nd e")
        self.assertEqual(set(c[2]), {"a b", "b c", "d e"})
        self.assertEqual(sum(c[1].values()), 5)
        self.assertEqual(set(c[3]), {"a b c"})

    def test_name_tokens_drop_suffixes(self):
        self.assertEqual(toks("Mary-Ann O'Neil Jr."), ["mary", "ann", "o", "neil"])


class ExclusionTest(unittest.TestCase):
    """analyzed_texts keeps 100-word campaign sites and records why it drops the others."""

    def run_case(self, text, dropped=None, name="Jane Smith"):
        key = ("2024", "H0XX00000")
        meta = {key: {"name": name, "year": "2024", "cand_key": key[1], "office": "House",
                      "party_group": "Democratic", "website": "x.com"}}
        loaded = (meta, {key: text}, {key: "cc"}, {}, {key: Counter(dropped or {})})
        _, _, _, _, _, excluded, analyzed = analyze.analyzed_texts(loaded=loaded)
        return key, excluded, analyzed

    def test_campaign_site_of_enough_words_is_analyzed(self):
        key, excluded, analyzed = self.run_case("voters " + words(120))
        self.assertIn(key, analyzed)
        self.assertEqual(excluded, {})

    def test_short_site_is_neither_analyzed_nor_excluded(self):
        key, excluded, analyzed = self.run_case("voters " + words(50))
        self.assertNotIn(key, analyzed)
        self.assertNotIn(key, excluded)

    def test_site_below_the_minimum_after_dropping_spanish_is_excluded(self):
        key, excluded, analyzed = self.run_case("voters " + words(60), {"not English": 80})
        self.assertEqual(excluded[key], "not English")
        self.assertNotIn(key, analyzed)

    def test_spam_domain_is_excluded(self):
        key, excluded, _ = self.run_case("voters " + words(120), {"spam": 300})
        self.assertEqual(excluded[key], "spam")

    def test_parked_domain_is_excluded(self):
        key, excluded, _ = self.run_case("This domain is for sale. " + words(120))
        self.assertEqual(excluded[key], "hosting error or parked domain")

    def test_text_with_no_name_and_no_campaign_word_is_excluded(self):
        key, excluded, _ = self.run_case(words(120, "tomato"))
        self.assertEqual(excluded[key], "no candidate name or campaign words")

    def test_candidate_surname_alone_is_enough(self):
        key, excluded, analyzed = self.run_case("Smith " + words(120, "tomato"))
        self.assertIn(key, analyzed)

    def test_hand_reviewed_sites_follow_the_review(self):
        meta = {("2026", "H4TX14111"): {"name": "Test Person", "year": "2026", "cand_key": "H4TX14111",
                                        "office": "House", "party_group": "Republican", "website": "x.com"}}
        key = ("2026", "H4TX14111")
        loaded = (meta, {key: "voters " + words(150)}, {key: "cc"}, {}, {key: Counter()})
        _, _, _, _, _, excluded, analyzed = analyze.analyzed_texts(loaded=loaded)
        self.assertEqual(excluded[key], "site-builder page titles only")


class ShareTest(unittest.TestCase):
    def test_share_is_candidates_using_over_candidates_analyzed(self):
        meta = {("2020", f"c{i}"): {"office": "House" if i < 3 else "Senate", "party_group": "Democratic"} for i in range(4)}
        analyzed = {("2020", "c0"): "working families first", ("2020", "c1"): "nothing here",
                    ("2020", "c2"): "Working Family tax relief", ("2020", "c3"): "working families, again and again"}
        pats = [("Economy and class", "working families", re.compile(r"\bworking famil(?:y|ies)\b", re.I))]
        rows = {(r[2], r[3], r[4]): r for r in analyze.share_rows(analyzed, meta, pats)}
        house = rows[("2020", "House", "Democratic")]
        self.assertEqual((house[5], house[6], house[7]), (2, 3, round(2 / 3, 4)))
        total = rows[("2020", "All", "Democratic")]
        self.assertEqual((total[5], total[6], total[7]), (3, 4, 0.75))

    def test_a_term_used_many_times_still_counts_once(self):
        meta = {("2020", "c0"): {"office": "House", "party_group": "Republican"}}
        pats = [("t", "border", re.compile(r"\bborder\b", re.I))]
        rows = analyze.share_rows({("2020", "c0"): "border " * 50}, meta, pats)
        self.assertEqual(rows[0][5], 1)


class StatisticsTest(unittest.TestCase):
    def test_welch_t_matches_the_formula_by_hand(self):
        # Group a: relative frequencies 0.1, 0.3, 0.2 and group b: 0.0, 0.1 for one feature.
        a = (3, {"x": 0.6}, {"x": 0.01 + 0.09 + 0.04}, {"x": 3})
        b = (2, {"x": 0.1}, {"x": 0.01}, {"x": 1})
        vocab, t, ma, mb = analyze.welch(a, b)
        va = (0.14 - 3 * 0.2 ** 2) / 2
        vb = (0.01 - 2 * 0.05 ** 2) / 1
        expected = (0.2 - 0.05) / math.sqrt(va / 3 + vb / 2)
        self.assertEqual(vocab, ["x"])
        self.assertAlmostEqual(float(t[0]), expected, places=9)
        self.assertAlmostEqual(float(ma[0]), 0.2)
        self.assertAlmostEqual(float(mb[0]), 0.05)

    def test_welch_t_is_negative_when_the_second_group_is_higher(self):
        a = (3, {"x": 0.1}, {"x": 0.005}, {"x": 2})
        b = (3, {"x": 0.9}, {"x": 0.30}, {"x": 3})
        self.assertLess(float(analyze.welch(a, b)[1][0]), 0)

    def test_close_race_band_is_45_to_under_55(self):
        self.assertTrue(analyze.close(0.45))
        self.assertTrue(analyze.close(0.5))
        self.assertTrue(analyze.close(0.5499))
        self.assertFalse(analyze.close(0.55))
        self.assertFalse(analyze.close(0.4499))

    def test_wilson_interval_matches_the_published_example(self):
        lo, hi = precision.wilson(18, 20)
        self.assertEqual((round(lo, 2), round(hi, 2)), (0.70, 0.97))
        lo, hi = precision.wilson(20, 20)
        self.assertEqual((round(lo, 2), round(hi, 2)), (0.84, 1.0))
        self.assertEqual(precision.wilson(0, 20)[0], 0.0)


class WindowTest(unittest.TestCase):
    def test_windows_end_on_election_day_and_start_where_named(self):
        import cc
        self.assertEqual(cc.bounds(2020, "60"), ("20200904", "20201103235959"))
        self.assertEqual(cc.bounds(2022, "120"), ("20220711", "20221108235959"))
        self.assertEqual(cc.bounds(2024, "year"), ("20240101", "20241105235959"))

    def test_every_window_crawl_list_holds_the_60_day_crawls(self):
        import cc
        for year, crawls in cc.CRAWLS.items():
            self.assertTrue(set(crawls) <= set(cc.YEAR_CRAWLS[year]))
            self.assertTrue(all(c.startswith(f"CC-MAIN-{year}-") for c in cc.YEAR_CRAWLS[year]))


if __name__ == "__main__":
    unittest.main()
