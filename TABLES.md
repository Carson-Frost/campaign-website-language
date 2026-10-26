# Tables

A reference for the result tables in `results/`. `results/` holds 25 files in all; the 11 described here are the ones the study's results rest on.

Each file is a CSV, a plain-text table that opens in a spreadsheet. They hold counts, shares, gaps, p-values and words per site, never a site's full text, and cover Democratic and Republican candidates only. Rows for 2026 will change until election day. Every column name is written as it appears in the file and is explained under [Column names](#column-names).

## Files

### term_shares.csv

Share of each term by year, office and party, with the counts.

Columns: `theme, term, year, office, party_group, candidates_using, candidates_analyzed, share`

### term_gaps.csv

Gap between the parties for each term and year, with intervals and adjusted p-values.

Columns: `theme, term, year, dem_using, dem_analyzed, rep_using, rep_analyzed, dem_share, dem_low, dem_high, rep_share, rep_low, rep_high, gap_dem_minus_rep, gap_low, gap_high, fisher_p, q_benjamini_hochberg, q_benjamini_yekutieli, family`

### term_classes.csv

Class of each term by whether its gap is consistent and whether it moved, 2020 to 2024.

Columns: `theme, term, class, favors, gap_2020, gap_2022, gap_2024, gap_q_2020, gap_q_2022, gap_q_2024, significant_changes`

### term_bounds.csv

Each share with its Possible Range among candidates with a known website and among all on the ballot.

Columns: `theme, term, year, party_group, using, analyzed, with_known_website, on_ballot, share_of_analyzed, low_among_known_website, high_among_known_website, low_among_ballot, high_among_ballot`

### term_shares_panel.csv

Shares for candidates analyzed in two or more years.

Columns: `theme, term, year, office, party_group, candidates_using, candidates_analyzed, share`

### term_shares_windows.csv

Shares from copies saved in the election year, the last 120 days and the last 60 days, for all candidates analyzed in each and for those analyzed in all three.

Columns: `window, sample, theme, term, year, office, party_group, candidates_using, candidates_analyzed, share`

### coverage.csv

Candidates at each step from the ballot to analyzed, by year, office and party.

Columns: `year, office, party_group, candidates, website_known, any_text, min_words_met, excluded, analyzed`

### selection.csv

Incumbency, results and closeness of analyzed and not analyzed candidates.

Columns: `year, party_group, group, candidates, incumbent_share, with_results, won_share, mean_vote_share, close_race_share, mean_two_party_margin_from_even, with_seat_presidential, close_seat_share, mean_seat_presidential_margin_from_even`

### site_length.csv

Words per analyzed site by year and party.

Columns: `year, party_group, analyzed, words_p25, words_median, words_p75, words_mean`

### distinctive_terms.csv

Words and phrases that most separate the parties, by year.

Columns: `year, kind, favors, rank, term, welch_t, dem_mean_per_10k, rep_mean_per_10k, dem_candidates_using, rep_candidates_using, dem_analyzed, rep_analyzed`

### term_precision.csv

Hand-coded matches used as intended, by term.

Columns: `term, sample, coded, intended, precision, wilson_low, wilson_high`

## Column names

The column names a reader meets in the files, in plain words, in the order the files first use them. A name is kept as written because it is what the reader looks for in the file.

### theme, term

The theme a term belongs to, one of five, and the term itself, as the study's code spells it, which can differ in capitals and quotation marks from how this site shows it.

### year, office, party_group

The election year; House, Senate, or All offices together; and Democratic or Republican.

### candidates_using, candidates_analyzed

How many analyzed candidates used the term and how many were analyzed. The share is the first divided by the second.

### share

The candidates using a term divided by the candidates analyzed, as a fraction of 1, so 0.25 is 25%.

### dem_ and rep_

A prefix for Democratic and Republican candidates: dem_using is how many analyzed Democratic candidates used the term.

### _low and _high

The lower and upper ends of a 95% Interval, as fractions of 1: a Wilson Interval for a share and a Newcombe Interval for a gap.

### gap_dem_minus_rep

The Democratic share minus the Republican share, as a fraction of 1, so 0.05 is Democratic higher by 5 points.

### fisher_p

The p-value of the Fisher Exact Test of a gap, before any adjustment for testing many terms.

### q_benjamini_hochberg

Here q is an adjusted p-value: the p-value of a gap after the Benjamini-Hochberg Adjustment for testing many terms, to three significant figures. It is the one this site prints. The site rounds the unrounded value, so it can differ by one in the last place from the file's value rounded again.

### q_benjamini_yekutieli

The same q after the more cautious Benjamini-Yekutieli Adjustment, which allows for terms that are related, so it is larger.

### family

The tests adjusted together: 2020-2024 for the three earlier years, and 2026 alone.

### class

Whether a term's gap points the same way with an adjusted p-value under 0.05 in 2020, 2022 and 2024 (split or not consistently split), and whether either party's share changed between elections by the same test (moving) or did not (still).

### favors

The party with the higher share, given only for terms that are split.

### gap_2020, gap_q_2020

A year's gap, as a fraction of 1, and its q, the adjusted p-value; gap_2022, gap_q_2022, gap_2024 and gap_q_2024 are the same for the later years.

### significant_changes

The changes within one party between consecutive elections that have an adjusted p-value under 0.05.

### using, analyzed

In term_bounds.csv, the candidates using the term and the candidates analyzed; share_of_analyzed is their ratio.

### with_known_website, on_ballot

In term_bounds.csv, the candidates with a known website and all candidates on the ballot.

### low_among_known_website, high_among_known_website, low_among_ballot, high_among_ballot

The Possible Range of the share for each of those two groups: its lowest value if no candidate who was not analyzed used the term, and its highest if every one did.

### window

The span of saved copies used: year for the election year, 120 for the last 120 days and 60 for the last 60 days before election day.

### sample

In term_shares_windows.csv, all means every candidate analyzed in that window and common means only the candidates analyzed under all three windows. In term_precision.csv, v1 is the original pattern and v2 the revised pattern.

### candidates

In coverage.csv, the candidates on the ballot. In selection.csv, the candidates in the group.

### website_known, any_text, min_words_met, excluded

In coverage.csv, the candidates with a known website, with any saved text, with at least 100 words, and removed as not campaign content.

### group

In selection.csv, analyzed or not analyzed.

### incumbent_share, won_share

The share of the group who held the seat before the election, and the share of those with a result who won.

### with_results

The candidates in the group with a result for the election. 2026 has none.

### mean_vote_share

The group's average share of all votes cast in the race, as a fraction of 1.

### close_race_share, close_seat_share

The share of races, or of seats by their presidential vote, that were close: the Democratic share of the two-party vote was 45% to under 55%.

### mean_two_party_margin_from_even

The average distance of the Democratic share of the two-party vote from 50%, as a fraction of 1; the seat version uses the presidential vote.

### with_seat_presidential

The candidates in the group whose seat has a presidential vote.

### words_median, words_mean

The median and the mean number of words on an analyzed site. Where the count of sites is even, words_median is the higher of the two middle counts, so it can be a few words above the midpoint of those two counts.

### words_p25, words_p75

The words on the site at the 25th and 75th percentile: a quarter of analyzed sites are shorter than the first and a quarter longer than the second.

### kind, rank

Word or phrase, and the place in that year's list for the party in favors, ranked by welch_t.

### welch_t

The Welch's T Statistic, comparing the parties' average use of a term or phrase across candidates. Positive favors Democratic candidates, negative Republican, and a larger size is a stronger split.

### dem_mean_per_10k

The average number of times a term or phrase appears per 10,000 words or phrases of the same length on a Democratic candidate's site; rep_mean_per_10k is the same for Republican candidates.

### coded, intended, precision

The matches coded by hand, how many were used as intended, and the second divided by the first.
