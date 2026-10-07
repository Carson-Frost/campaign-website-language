# Analysis plan

This file fixes what will be tested, how, and which results count as confirmatory, before any further
analysis is run on the collected text. Its commit date is its date. A later change is written in the
"Amendments" section at the end, with the reason, and never by editing the plan above it.

Each hypothesis states a predicted direction and the published work that motivates it. A result is **confirmatory** only
if the hypothesis and test were fixed here and the result had not been seen when they were fixed. Every
other result, including everything chosen after looking, is reported as **exploratory**.

## 1. Scope and order of work

The analysis covers 2020, 2022 and 2024 first. 2026 is added afterward by applying this same plan to the
final 2026 capture, which is not complete until election day, November 3, 2026.

## 2. Research questions

1. **Stable and changing words.** Which words stay split between Democratic and Republican candidates in
   2020, 2022 and 2024, and which change from one election to the next?
2. **Who changed.** For each change in a party's use of a word, how much comes from candidates who ran
   in both years changing their sites, and how much from a different set of candidates running?
3. **Seat and office.** Is a candidate's use of a word related to whether the candidate already held the
   seat, and to how closely contested the seat was?
4. **Tone, only if validated.** Tone measures are excluded from every analysis until two coders have
   validated them against a human-coded sample, as described in `METHODS.md`. This question is dropped
   from the paper if that does not happen.

## 3. What has already been seen

Fixing this list is what keeps the confirmatory label honest.

**Seen before this plan:**
- Share of each party's analyzed candidates using each of the 57 terms, for 2020, 2022, 2024 and a
  provisional 2026 (`results/term_shares.csv`), and the same shares for candidates analyzed in more than
  one year (`results/term_shares_panel.csv`).
- Phrases most distinctive of each party by year (`results/distinctive_terms.csv`).
- Analyzed candidates compared with unanalyzed candidates on incumbency, wins, vote share, race margin and
  seat partisanship (`results/selection.csv`).
- Intervals, exact tests and adjusted p-values for every party gap in 57 terms and four years
  (`results/term_gaps.csv`), and the worst-case ranges (`results/term_bounds.csv`).

**Not seen before this plan:**
- Any use of a term by incumbents compared with non-incumbents, or in close seats compared with safe seats.
- The split of any change into same-candidate change and turnover.
- Weighted estimates.
- Any of the added wordings in section 6.
- Any comparison with Hilbig's data.
- Any second-coder check, and any recall check.

Consequences. The party gaps and year-to-year changes in the 57 terms are descriptive and exploratory.
Questions 2 and 3 and the added wordings are confirmatory for the hypotheses below, with one exception:
for the 2026 words, the provisional results were seen, so 2026 hypotheses are exploratory.

## 4. Hypotheses

Directions are fixed. "Higher" means a higher share of candidates using the word.

- **H1, owned issues stay split.** "Climate" is higher among Democrats and "border" is higher among
  Republicans in every year, with an adjusted p-value below 0.05 in each. (Petrocik 1996, as quoted by
  Stubager and Slothuus 2013; Egan 2013.) Exploratory: these gaps were seen.
- **H2, salient performance issues draw both parties, led by the party out of power.** "Inflation" rises
  in both parties from 2020 to 2022, and by more among Republicans. (Druckman and coauthors 2010; Sides
  2006; Petrocik, Benoit and Hansen 2003, as described by Druckman and coauthors.) Exploratory: seen.
- **H3, wording after Dobbs.** From 2020 to 2024 the share of Democrats using the word "abortion" rises,
  the share of Republicans does not rise, and part of the Democratic rise in "abortion" reflects a switch
  from the wordings in section 6. (Meisels 2025.) The first two parts are exploratory (seen). The
  wording part is confirmatory: among Democratic sites, the share using "abortion", any wording in group
  A or "reproductive freedom / rights" exceeds the share using "abortion" alone by more in 2020 than in
  2024.
- **H4, competition and salient issues.** In 2022, Democratic candidates in close seats use "inflation"
  more than Democratic candidates in safe seats. (Minozzi 2012; Druckman and coauthors 2010.) Confirmatory.
  A second part, that Republican candidates in close seats use "abortion" less than Republicans in safe
  seats, has no direct support in the sources and is exploratory.
- **H5, incumbents against challengers.** Challengers use more of the 57 terms than incumbents do, and the
  difference is smaller in close seats. (Druckman, Kifer and Parkin 2009.) Confirmatory. The outcome is
  the number of different terms a site uses, compared within terciles of site length.
- **H6, safe own-party seats.** Candidates in seats safe for their own party use more of their party's
  most distinctive terms. (Grimmer 2013.) Confirmatory, for each party's ten terms with the largest
  gap favoring that party in 2020. H6 and H5 can disagree, and both are reported.
- **H8, rival wordings.** For the pairs in section 6, the partisan gap in the rival wordings taken
  together is larger than the gap in the single word "abortion." (Gentzkow, Shapiro and Taddy 2019;
  Peterson and Spirling 2018.) Confirmatory.
- **H10, event words move through candidates, slow words through who runs.** For "inflation" and
  "abortion" the same-candidate component of the change from 2020 to 2022 is larger than the turnover
  component, and for "working families" and "climate" it is smaller. (Theriault 2006; Thomsen 2014.) This
  extends the cited work to vocabulary and is a speculative test. Confirmatory.
- **H7 and H9** (more similarity within parties across districts over time, and the out-party's economic
  words in 2026) are not tested in the pre-2026 analysis. H9 uses 2026 results that were seen, so it
  would be exploratory.

## 5. Data, unit and variables

- **Unit:** the candidate-year, with the inclusion and exclusion rules in `README.md`. A candidate in
  several years contributes several observations.
- **Outcome:** a candidate-year uses a term if its pattern matches the collected text at least once.
- **Parties:** Democratic and Republican for all tests. Independents and third parties are described and
  never tested, because fewer than 30 independents were analyzed in every year before 2026.
- **Incumbent:** the `incumbent` field of the candidate list.
- **Competitiveness:** the primary measure is the Democratic share of the two-party presidential vote in
  the seat, which does not depend on the candidates, and a seat is close if that share is between 45 and
  55 percent (Mayhew 1974). It is available for all of 2022, and for 2020 only for Senate and at-large
  seats and for 2024 only for Senate and 41 states, so competitiveness tests use 2022 first and the other
  years where complete. The race's own two-party result is a secondary measure and is called after the
  fact, because it depends on how the campaign went.
- **Site length:** words after cleaning.

## 6. Added wordings

These patterns are fixed here, before any of them has been counted, and are kept apart from the 57
terms. They are first candidates, to be expanded by the keyword-discovery step below and checked for
precision before any result is reported.

Group A, wordings for the abortion topic other than the word "abortion" and the existing "reproductive
freedom / rights" and "pro-life / unborn" terms:

| Label | Pattern |
| --- | --- |
| pro-choice | `\bpro-?choice\b` |
| a woman's right to choose | `\bwom[ae]n'?s? (?:right\|freedom) to choose\b` |
| bodily autonomy | `\bbodily (?:autonomy\|integrity)\b` |
| Roe v. Wade or Dobbs | `\broe v\.? wade\b\|\bdobbs\b` |
| abortion ban | `\babortion bans?\b` |
| pro-abortion | `\bpro-?abortion\b` |
| partial-birth or late-term abortion | `\b(?:partial[- ]birth\|late[- ]term) abortions?\b` |
| right to life or sanctity of life | `\bright to life\b\|\bsanctity of (?:human )?life\b` |

Rival-wording pairs for H8 are Democratic-leaning group A wordings (pro-choice, a woman's right to
choose, bodily autonomy, reproductive freedom and rights) against Republican-leaning ones (pro-life or
unborn, right to life, pro-abortion, late-term abortion), taken as two sets.

**Keyword discovery and recall.** Following King, Lam and Roberts (2017), a reference set of sites that
clearly discuss a concept is chosen, a classifier trained on it suggests terms not on the list, and a
person accepts or rejects each. Recall is estimated from a random sample of sites coded blind to the
term list. The people who code the evaluation sample do not take part in building the list.

**Precision.** Each added wording and each existing finding term is checked on at least 50 randomly drawn
candidate-and-term pairs by two coders blind to party, reporting percent agreement and Krippendorff's
alpha with a bootstrap interval and precision with a Wilson interval.

## 7. Estimators and tests

- **Shares and gaps:** Wilson intervals for shares, Newcombe intervals for gaps, Fisher's exact test
  (two-sided) for gaps and for differences between groups or years (`tools/inference.py`).
- **Multiple comparisons:** Benjamini-Hochberg adjustment, with Benjamini-Yekutieli beside it, over the
  whole family of tests reported in a section: all 57 terms in every comparison made for that
  question, and not only those that are reported. A hypothesis with one test is reported with its raw
  p-value and counted in the family of the question it belongs to.
- **Question 1:** for each term, the gap in each of 2020, 2022 and 2024, and the change within each
  party from 2020 to 2022 and from 2022 to 2024. A word is **stable and split** if its gap has the same
  sign with an adjusted p-value below 0.05 in all three years and no within-party change has an adjusted
  p-value below 0.05. A word is **changing** if at least one within-party change has an adjusted p-value
  below 0.05. These definitions are fixed here. Year-to-year comparisons treat the two years' candidates
  as independent, which understates the uncertainty for candidates who ran in both, and that is stated.
- **Question 2:** for each party and consecutive pair of years, let a0 and a1 be the shares of that
  party's analyzed candidates in each year who were also analyzed in the other year ("stayers"), and
  s0 and s1 the shares of stayers using the word in each year. The same-candidate component is the mean
  of a0 and a1 times (s1 minus s0), and the turnover component is the total change in the party's share
  minus that. This is an accounting split and not a causal one. Stayers' change is tested with the
  exact McNemar test. Stayers are analyzed in both years, so they are more often incumbents and winners.
- **Question 3:** within each party and year, each term's use is compared for incumbents against
  non-incumbents and for close seats against safe seats, by Newcombe intervals and Fisher's exact test.
  H5's outcome, the number of different terms used, is compared by a permutation test of the difference
  in means, within terciles of site length and averaged across terciles with equal weights.
- **Permutation null for the vocabulary ranking:** party labels are reassigned among candidates at random
  1,000 times, the ranking of distinctive phrases is recomputed each time, and the number of phrases
  passing the reporting cutoff by chance is reported beside the observed number. A phrase must be used
  by at least 100 candidates of the pooled sample to be ranked, a filter based on pooled counts and fixed
  here (Lijffijt and coauthors 2016 advise at least 100 texts per group).

## 8. Selection

Every headline share is reported three ways: as observed among analyzed candidates, as an inverse
probability weighted estimate, and as the worst-case range (`results/term_bounds.csv`).

The weights come from a logistic regression of being analyzed on year, party group, office, incumbency,
whether the candidate won, vote share and seat partisanship where available, and state, fitted for
Democratic and Republican candidates together. Weights are stabilized and truncated at their 99th
percentile, and their distribution and effective sample size are reported. They correct for selection on
what is observed, which Common Crawl's link-based selection may not satisfy, so they supplement and do
not replace the ranges (Seaman and White 2013; Baack 2024). Party gaps are also reported separately for
incumbents and non-incumbents and for winners and losers.

## 9. Outside check

Hilbig's candidate-websites dataset (posted in 2026; Democrats and Republicans, House 2018 to 2024) is used only as an external check:
its coverage of the study's candidate-years, whether its covered candidates skew toward incumbents as
this study's do, and whether the direction of party differences in its topic shares agrees with the
direction of this study's term gaps for matching topics. The comparison is described after the data
documentation is read in full, and is exploratory.

## 10. Reporting rules

- Every result carries its interval and, for comparisons, its adjusted p-value.
- Every result is marked confirmatory or exploratory, in the text and in the tables.
- Every term in every comparison is reported in a supplementary table, not only those that stand out.
- Results state that they describe candidates whose sites were archived.
- An intended test that is not run, and any test run that is not listed here, is reported as such.

## Amendments

None.
