# Methods record

This file records each method decision in the study, the standard it follows and the source: first
the tone measures, then the audit of the term-usage study.
It is the answer to "how was this done, and why." Sources marked unverified were not read in full;
claims from them are not relied on until they are. Research date: 2026-10-05.

## Sentiment

**Dictionary.** The Lexicoder Sentiment Dictionary, 2015 version (LSD2015), is the standard dictionary
for political text. Young and Soroka built it for political news and validated it against three
trained coders' codes of 900 New York Times articles. Among ten dictionaries tested, human codes
explained the most variance in LSD tone (14.3%, against 12.7% for LIWC and less for the rest). The
authors note it "does not distinguish especially well here between somewhat negative and neutral."

- Young, L., and Soroka, S. (2012). Affective news: The automated coding of sentiment in political
  texts. *Political Communication* 29(2), 205–231. doi:10.1080/10584609.2012.671234
- License: McGill agreement, academic research and education only, no modification of the
  dictionary, publications must acknowledge McGill. https://www.snsoroka.com/s/LSDagreement.pdf
  Download: https://www.snsoroka.com/s/LSDaug2015.zip

**Why not general-purpose lexicons.** VADER was built for microblog text (Hutto and Gilbert 2014),
AFINN on Twitter posts (Nielsen 2011), and the Hu and Liu lexicon on customer reviews (Hu and Liu
2004). Grimmer and Stewart warn that "applying dictionaries outside the domain for which they were
developed can lead to serious errors." On political headlines, van Atteveldt, van der Velden and Boukes
found that "none of the used dictionaries come close to acceptable levels of validity." Gale Digital
Scholar Lab's sentiment tool uses AFINN, so it inherits the same problem.

- Grimmer, J., and Stewart, B. M. (2013). Text as data. *Political Analysis* 21(3), 267–297.
  doi:10.1093/pan/mps028
- van Atteveldt, W., van der Velden, M. A. C. G., and Boukes, M. (2021). The validity of sentiment
  analysis. *Communication Methods and Measures* 15(2), 121–140. doi:10.1080/19312458.2020.1869198
- Rice, D. R., and Zorn, C. (2021). Corpus-based dictionaries for sentiment analysis of specialized
  vocabularies. *Political Science Research and Methods* 9(1), 20–35. doi:10.1017/psrm.2019.10
  (Their remedy builds dictionaries from word embeddings, which the method standard excludes.)

**Unit.** The LSD codebook (in LSDaug2015.zip) says: "We do not recommend analyzing text at the
sentence level, as it is much less likely to be reliable." Scores are computed per document, here
the candidate-year's campaign-site text.

**Preprocessing.** The official LSD preprocessing script, `LSDprep_dec2017.R` (from
https://www.snsoroka.com/s/LSDprep_dec2017R.zip), runs in order: contraction expansion, punctuation
false-hit fixes, spacing around punctuation, negation collapsing, and dictionary false-hit fixes.
quanteda does not run it; its documentation points to the script.

**Negation.** The LSD 2015 codebook rule: positive = Positive − Neg_Positive + Neg_Negative, and
negative = Negative − Neg_Negative + Neg_Positive. quanteda.sentiment's stored polarity (pos =
positive and neg_negative; neg = negative and neg_positive, with nested phrase matching) reproduces it
and is what `tone.py` follows (see "Counting" below).

**Score.** The logged ratio log((positive + 0.5) / (negative + 0.5)), quanteda.sentiment's default
(`sent_logit`, after Lowe et al. 2011), and the measure in Proksch et al.'s replication code. Young
and Soroka's percent positive minus percent negative is the alternative.

- Proksch, S.-O., Lowe, W., Wäckerle, J., and Soroka, S. (2019). Multilingual sentiment analysis.
  *Legislative Studies Quarterly* 44(1), 97–131. doi:10.1111/lsq.12218 (paper unverified; formula
  verified in replication code, doi:10.7910/DVN/ALFLK6)
- Lowe, W., Benoit, K., Mikhaylov, S., and Laver, M. (2011). *Legislative Studies Quarterly* 36(1),
  123–155. doi:10.1111/j.1939-9162.2010.00006.x (unverified)

**Implementation.** quanteda 4.5.0 (CRAN) holds `data_dictionary_LSD2015`; quanteda.sentiment 0.4
(GitHub only) holds the polarity-set copy and `textstat_polarity`. The Lexicoder site says: "We
strongly recommend using the quanteda implementation of the dictionary."

## Tone toward the other side (attack)

**Precedent.** Young and Soroka measured tone toward parties and leaders by the "co-occurrence of
party/leader names and positive or negative keywords in the same sentence," aggregated per article.
Duval and Bouchard used the same design with the French LSD (*Canadian Journal of Political Science*
54(3), 2021, doi:10.1017/S000842392100038X). No validated rule-based attack measure for U.S. campaign
text was found.

**Human-coding standard for campaign websites.** Druckman, Kifer and Parkin coded each of 736 House
and Senate campaign websites 0 or 1 for material about the opponent "that was negative or
critical--either in tone or explicitly," because "we found it highly unreliable to count the number of
negative statements." Reliability on about 30% of sites was "above .90 (adjusting for chance
agreement)." The Wesleyan Media Project codes each ad's primary purpose as promote, attack or contrast
(2022 codebook).

- Druckman, J. N., Kifer, M. J., and Parkin, M. (2010). *Political Communication* 27(1), 88–103.
  doi:10.1080/10584600903502607 (verified from working paper IPR WP-09-06)
- Fowler, E. F., Franz, M. M., Ridout, T. N., Baum, L. M., and Floyd, S. (2025). Political
  Advertising in 2022, v1.0. Wesleyan Media Project codebook.

## Threat

The threat dictionary (240 words) was built from word embeddings and validated only against
real-world events at aggregate levels, scored as the percentage of words that are threat words. It was
not validated against human coding of documents or sentences. Druckman, Kifer and Parkin's 2007 coding
of campaign websites included a "warning" code: "discussion of potentially dire consequences regarding
an issue."

- Choi, V. K., Shrestha, S., Pan, X., and Gelfand, M. J. (2022). When danger strikes. *PNAS* 119(4),
  e2113891119. doi:10.1073/pnas.2113891119. Free to use with citation.

## Incivility

Muddiman and Stroud's political incivility dictionary (2017, *Journal of Communication* 67(4),
586–609, doi:10.1111/jcom.12312; method in Muddiman, McGregor and Stroud 2019, *Political
Communication* 36(2), 214–226) is the field's published dictionary. Both papers are unverified
(closed access). A third-party copy (54 stems) is in Stolwijk et al.'s repository, where it scored
precision .94 and recall .12 on social-media comments, and the authors "cannot recommend" dictionary
measures of incivility (*Communication Methods and Measures* 20(1), 2025,
doi:10.1080/19312458.2025.2553300). Coe, Kenski and Rains (2014, *Journal of Communication* 64(4),
658–679) give the standard definition and five forms (name-calling, aspersion, lying, vulgarity,
pejorative for speech); unverified.

## Validation

- A dictionary must be validated against human coding in the target domain (Grimmer and Stewart
  2013; van Atteveldt et al. 2021).
- The gold standard "needs to be coded by at least two annotators to calculate inter-coder
  reliability," typically "between 100 and 300 units," and "any person involved in annotating the gold
  standard cannot contribute to creating the dictionary" (van Atteveldt et al. 2021).
- Intercoder reliability needs two or more coders, at least 50 units or 10% of the sample, rarely more
  than 300; .80 is acceptable in most situations and .70 in some exploratory studies (Lombard,
  Snyder-Duch and Bracken 2002, *Human Communication Research* 28(4), 587–604,
  doi:10.1111/j.1468-2958.2002.tb00826.x; guidance at matthewlombard.com/reliability).
- Random sampling is the documented norm. No political-communication source was found that
  sets a standard for oversampling flagged units and re-weighting.
- Automated measures are reported against the gold standard with precision, recall and F1 for binary
  codes, and correlation for continuous scores (Grimmer and Stewart 2013). No published F1
  acceptance threshold was found.

## Cleaning and segmentation

- Main-text extraction with trafilatura, the best overall extractor in an independent comparison of 8
  datasets (Bevendorff et al. 2023, *SIGIR*, doi:10.1145/3539618.3591920; Barbaresi 2021, *ACL
  System Demonstrations*, doi:10.18653/v1/2021.acl-demo.15).
- Sentences: text is split at extracted paragraph breaks first, which improved segmentation of web
  text (Read et al. 2012, *COLING Posters*, aclanthology.org/C12-2096), then by pysbd (Sadvilkar and
  Neumann 2020, *NLP-OSS*, aclanthology.org/2020.nlposs-1.15). No evaluation on campaign sites exists.
- Line rules with published precedent: C4 drops lines containing "javascript" or the strings "terms
  of use", "privacy policy", "cookie policy", "uses cookies", "use of cookies" or "use cookies", and
  lines under 5 words (Raffel et al. 2020, *JMLR* 21(140)). CCNet's cross-page paragraph
  deduplication (Wenzek et al. 2020, *LREC*) removes navigation and cookie text, but it was designed
  for language-model training and would also delete talking points that candidates share.

## Minimum length

No published minimum document length for dictionary sentiment on political text was found. The LSD
codebook says reliability "improves with the number of words analyzed." LIWC advises skepticism below
25–50 words, and the LIWC-22 development corpus required 100 words per file (Boyd et al. 2022). The
study's 100-word minimum follows that precedent and is stated as a limitation.

## Decisions in the current build

Each choice in `tools/tone.py`, with its basis. Choices with no published standard are marked as
limitations.

- **Language.** Python, a project decision. R's quanteda is the reference implementation of the
  dictionary but is not installed. `tools/test_tone.py` checks the Python code against the dictionary
  sizes in quanteda's documentation, the LSD codebook's worked negation example, and the examples in
  the preprocessing script's comments.
- **Preprocessing rules read, not retyped.** The LSD license forbids modifying or translating the
  software, so `tone.py` reads all 1,293 replacement rules from `LSDprep_dec2017.R` as distributed and
  applies them in the script's order, with stringr's replacement semantics. All eight functions are
  applied, including the three the script calls optional: two keep acronyms and abbreviations whole
  before punctuation spacing, and `mark_proper_nouns` matches Young and Soroka's removal of
  capitalized words (LSD codebook, "2-caps" module).
- **Dictionary entries tokenized like the text.** Entries are split by the script's own punctuation
  spacing, so that the three entries with apostrophes ("no man's land") align with preprocessed text.
  Limitation: no source describes how entries should be tokenized outside Lexicoder.
- **Counting.** LSD2015 and LSD2015_NEG are matched as one dictionary by greedy left-to-right longest
  match, each token counted once, so "not happy" counts only as a negated positive. Positive =
  Positive + Neg_Negative and negative = Negative + Neg_Positive, as quanteda.sentiment's LSD2015
  polarity sets them (lookup with nested_scope = "dictionary"). This equals the LSD codebook's rule
  (subtracting negated phrases from counts that included their base words) whenever the base word
  would have been counted. The codebook's subtraction, applied to separately counted dictionaries, gave
  a negative positive count for at least one candidate-year, because a longer LSD2015 phrase had
  already used the base word; the quanteda form cannot. Lexicoder's own matcher was not documented in
  the sources read. Counts are taken per sentence and summed per candidate-year, which equals
  document-level counting except for a phrase that spans a sentence boundary.
- **Score.** The logged ratio with 0.5 smoothing (quanteda.sentiment default; Proksch et al. 2019),
  with Young and Soroka's net tone also given.
- **Other-party names and leaders.** Party names (Democrat, Democrats, Democratic; Republican,
  Republicans, GOP) and national leaders from January 2019 to October 2026. Speakers: Pelosi,
  McCarthy, Johnson (history.house.gov/People/Office/Speakers-List/). House majority leaders: Hoyer,
  Scalise; minority leaders: McCarthy, Jeffries (history.house.gov Majority-Leaders and
  Minority-Leaders lists). Senate floor leaders: McConnell, Schumer, Thune
  (senate.gov/senators/majority-minority-leaders.htm). Presidents, vice presidents and the 2020 and
  2024 tickets: Trump, Biden, Pence, Harris, Vance, Walz (public record). Young and Soroka used party
  and leader names; the choice of these offices is a limitation, since no source fixes which leaders
  to include.
- **Name matching.** Leaders by surname, except Harris and Johnson, which need a first name or title
  because "Harris County" and other Johnsons are common. Opponents (every other candidate on the same
  ballot) by full name or surname. Limitations: a surname that is also a common word can match at the
  start of a sentence, and a sentence naming both the candidate's own side and the other side counts
  toward the other side, the error Soroka, Young and Bodet (2008) noted for sentences naming two
  parties.
- **Line rules.** C4's under-5-words and javascript or policy-string rules. C4's terminal-punctuation
  rule is not applied, because headings and bullets carry platform content (CampaignView stores each
  bullet as a platform point). Site furniture that matches none of these rules, such as donation
  prompts, remains in the text; limitation.
- **Minimum length.** The study's 100-word minimum, applied after the line rules (LIWC-22 precedent;
  no political-text standard).
- **Tone toward a target with few sentences.** Scores are given whenever at least one sentence names
  the target, with the sentence and word counts beside them. No source sets a minimum; limitation.
- **Incivility** is set aside, and **validation** is deferred, both as project decisions.

# Audit of the term-usage study (2026-10-05)

Every decision in the pipeline before the tone measures, checked against published standards from
primary sources. Each decision is placed in one of four groups: it meets a standard; it departs from
the standard and should change; it has no published standard and is stated as a limitation; or it
needs a check that has not been done. Sources marked unverified were read only in abstract or
secondary form.

## Meets a published standard

- **General-election candidates, House and Senate, one site per candidate-year.** Druckman, Kifer and
  Parkin coded one website per general-election candidate per year, House and Senate pooled, with
  Senate as a control (working paper IPR WP-07-11; *APSR* 103(3), 2009, 343–366,
  doi:10.1017/S0003055409990037, published text unverified). Gulati and Williams (2007, *Social
  Science Computer Review* 25(4), 443–465, doi:10.1177/0894439307305624) covered "every Senate and
  House candidate" including minor parties (abstract only).
- **Louisiana's November all-party election as the general.** The FEC: "In Louisiana, a
  Congressional primary election is not held… the election for candidates seeking Federal office was
  the General Election held on November 8, 2022" (Federal Elections 2022). MIT Election Lab codes the
  November contests as general elections. For 2026, the FEC reports that Executive Order 26-038
  suspended the House primaries
  (fec.gov/updates/louisiana-suspends-primary-elections-for-us-house-of-representatives/).
- **Minnesota DFL coded Democratic,** as MIT Election Lab's party_simplified does.
- **Close race: 45–55% Democratic share of the two-party vote.** Mayhew's narrow marginality band,
  "45-54.9 Democratic percentage of the major-party vote" (*Polity* 6(3), 1974, 295–317,
  doi:10.2307/3233931). Applied exactly since 2026-10-05; see "Changed after the audit."
- **District partisanship from the presidential two-party vote in the district.** "Presidential vote
  at the district level is typically employed as a measure of district preferences" (Carson, Koger,
  Lebo and Young 2010, *AJPS* 54(3), 598–616, doi:10.1111/j.1540-5907.2010.00449.x). CampaignView uses
  the same source, The Downballot. Limitation: presidential vote also reflects short-term and
  home-state effects (Levendusky, Pope and Jackman 2008, *JOP* 70(3), 736–753,
  doi:10.1017/S0022381608080729).
- **Selection check comparing analyzed and unanalyzed candidates** on incumbency, winning and seat
  partisanship. CampaignView models missing websites on candidate and district covariates (Table 5),
  and Di Tella et al. (2023, NBER WP 31503) test endogenous sample selection. It addresses observable
  differences only.
- **Campaign website from FEC Form 1 first.** Form 1 must list "the internet address of the
  committee's official website" (11 CFR 102.2(a)(1)(vii)), and the Library of Congress's U.S.
  Elections Web Archive builds its site list from this FEC field (data package README v1.1).
  Excluding official House and Senate sites follows Druckman et al.
- **Text extraction with trafilatura,** the best single extractor by mean F1 across 8 datasets
  (Bevendorff et al. 2023, *SIGIR*, doi:10.1145/3539618.3591920; Barbaresi 2021).
- **Binary presence (a candidate uses a term at least once).** Grimmer and Stewart list "an indicator
  that a word occurs in a document, rather than a count" as a standard representation (2013); King,
  Lam and Roberts rank keywords by "the proportion of documents in which each keyword appears at least
  once" (2017, *AJPS* 61(4), 971–988, doi:10.1111/ajps.12291); Druckman et al. coded a dichotomous
  variable for material "on any page." Limitation: presence depends on site length (Manning, Raghavan
  and Schütze 2008, *Introduction to Information Retrieval*, §13.3), so length by party should be
  reported.
- **95% Wilson score intervals,** recommended for proportions (Brown, Cai and DasGupta 2001,
  *Statistical Science* 16(2), 101–133, doi:10.1214/ss/1009213286; Wilson 1927).
- **Findings labeled exploratory** because they were chosen after viewing all terms (Gelman and Loken
  2013; Nosek et al. 2018, *PNAS* 115(11), 2600–2606, doi:10.1073/pnas.1708274114). Gelman and Loken
  advise analyzing "all relevant comparisons"; all 57 terms are published in `results/term_shares.csv`
  and the report.
- **Placeholder (lorem ipsum) screening** follows C4 (Raffel et al. 2020).

## Changed after the audit

The five departures the audit found, and what was done about each on 2026-10-05.

1. **Trafilatura's cross-page deduplication is off.** Without a cache passed per call, trafilatura 2.3.0
   uses one module-wide cache (`deduplication.LRU_TEST`) for every page in a run. It drops any text
   block or page body over 100 characters once that text has been seen more than twice
   (MIN_DUPLCHECK_SIZE = 100, MAX_REPETITIONS = 2; confirmed in the installed `deduplication.py`,
   `htmlprocessing.py` and `core.py`). Text that candidates shared was therefore removed after its third
   appearance, in an order set by the shuffled, multithreaded collection. The stored text was neither
   scoped to a candidate-year nor repeatable. `sites.extract` now leaves deduplication off, which is
   trafilatura's default; `analyze.py` already removes repeated paragraphs within a candidate-year.
   Two supporting changes make the rebuild checkable. The collectors (`cc.py`, `sites.py`) now write
   each candidate-year's lines in the fixed shuffled input order instead of in thread-completion order,
   and `OFFLINE=1` makes every cache miss raise an error instead of fetching. A preview on 150 random
   candidate-years took 7 seconds with no cache misses, raw words rose 5%, and 2 of the 150 crossed the
   100-word minimum, both upward. Status: done. All page text was re-extracted offline on 2026-10-05,
   with extraction serialized after one live page came out differently in one of the first two
   threaded runs (trafilatura parses every page with one shared parser). Two further complete runs
   gave byte-identical page text and results (SHA-256). The rebuild read the
   same pages and captures as before. Analyzed candidate-years rose from 2,731 to 2,755: 24 crossed
   the 100-word minimum, 2 fell below it, and Randy Weber's 2020 and 2022 sites, whose homepage and
   biography pages had extracted as empty, now pass the screen on campaign text. Two of the new
   sites (Rhonda Hart and Christian Maxwell, 2026) held only site-builder page titles and were
   then excluded by hand, leaving 2,753.
2. **Trafilatura's default settings, with comments excluded.** `favor_recall=True` had no supporting
   evidence. The developer's benchmark (990 documents, trafilatura 2.3.0, checked 2026-10-05 at
   trafilatura.readthedocs.io/en/latest/evaluation.html) gives the default settings an F-score of 0.926
   against 0.919 for the recall preset, and accuracy of 0.924 against 0.917. The audit's earlier figure
   of 0.924 for the default F-score was the accuracy figure. `sites.extract` now passes only
   `include_comments=False`, because visitor comments are not the candidate's text; tables are included
   by default. In a test on four 2026 sites whose stored text carried leaked stylesheet gradients and
   tracking scripts, the default settings dropped all of that code.
3. **Precision of narrowed patterns comes from the fresh sample alone.** A sample used to revise a
   measure understates its error (Hastie, Tibshirani and Friedman 2009, *Elements of Statistical
   Learning*, sec. 7.2). `precision.py` now reports each narrowed term from its second-round sample
   only, and every term with a 95% Wilson score interval (Brown, Cai and DasGupta 2001). The six
   narrowed terms on their fresh samples: artificial intelligence, corporations, health care and
   inflation 19 of 20 (95%, interval 76–99%), climate 18 of 20 (90%, 70–97%), and freedom 17 of 20 (85%,
   64–95%). "Freedom" falls below the study's 90% cutoff. Its three misses are two award names and one
   endorsing group's name. It was not narrowed again, because a new pattern would need its own fresh
   hand-coded sample. Limitation: the coded samples were drawn from the text before re-extraction.
4. **Distinctive phrases are ranked by Welch's t-test with candidates as the units.** The audit asked
   that the rankings follow Monroe, Colaresi and Quinn (2008): occurrence counts instead of candidate
   counts, no stopword list, and the prior scaled to the data. That version was built and run. Monroe
   et al. set the prior from corpus-wide word proportions and scaled it to "a 'prior sample' of 500
   words per party every day, roughly the average number of words per day used per party on each
   topic" (sec. 3.5.1), which here meant the mean of the two parties' token counts in the year. Their
   model treats every word occurrence as an independent draw. On campaign sites that let one site top
   a list. The leading Democratic phrase for 2026 was "judy chu", which appears 268 times on her site
   and on no other, and several leading phrases were stylesheet code from one site builder. Lijffijt
   et al. show that tests treating words as independent "may lead to spurious conclusions",
   overstating differences for words concentrated in few texts. For corpora of at least 100 texts
   each, they recommend tests that treat texts as independent: Welch's t-test, the Wilcoxon rank-sum
   test or a bootstrap test, each run on per-text normalized frequencies (Lijffijt, Nevalainen, Säily,
   Papapetrou, Puolamäki and Mannila 2016, *Digital Scholarship in the Humanities* 31(2), 374–397,
   doi:10.1093/llc/fqu064; accepted manuscript at users.ics.aalto.fi/lijffijt/articles/lijffijt2015a.pdf).
   The study uses a text-level test, provided it was the best of these. Welch's t-test was chosen for
   four reasons:
   - It gives a continuous statistic to rank by.
   - It needs no random resampling, unlike the bootstrap test.
   - It flagged the fewest words of the three tests in the authors' comparison (their Fig. 7).
   - The Wilcoxon test gives tied ranks to the many texts where a phrase never appears (their sec. 3.5).

   Each party has 251 to 344 analyzed candidates a year, inside the authors' scope. Implementation
   (`analyze.distinctive`): each candidate-year is one text. A feature's frequency in a text is its
   count divided by the text's number of features of the same length (words, two-word or three-word
   phrases), and the statistic is their equation 4, the difference of the parties' mean frequencies
   over the square root of the sum of each group's variance divided by its size. No words are removed
   beforehand (Monroe et al. sec. 3.2.3, citing Manning, Raghavan and Schütze 2008), and there is no
   minimum count, since a phrase used by few candidates gets a small t. Limitations:
   - Lijffijt et al. use the test to judge significance, not to rank features. Ranking by t, and
     listing the top 40 without a multiple-comparison correction, is the study's own use.
   - Two- and three-word phrases are ranked together on one list.
   - Phrases are formed within each extracted paragraph.
   - Overlapping phrases ("affordable care", "affordable care act") are not merged.
   - Tokens are the study's own lowercased words. The only stemming is removal of the possessive 's
     (Porter2 step 0), not Monroe et al.'s full stemming.
5. **Close race uses Mayhew's band exactly:** 45 to under 55 percent Democratic of the two-party vote
   (`analyze.close`). In the current data no race or seat falls exactly on either endpoint, so no value
   changed.

## No published standard: stated limitations

- Ballotpedia as the candidate list. It has been used in peer-reviewed work (Hua, Ristenpart and
  Naaman 2020, *ICWSM*, doi:10.1609/icwsm.v14i1.7298) but not validated; the FEC Federal Elections
  tables and MIT Election Lab files come from official returns. The study's cross-check against FEC
  lists (`results/list_crosscheck.csv`) is the evidence of its accuracy.
- Including all minor-party candidates, and splitting them into Independent and Third party. Only
  Gulati and Williams included minor parties, and no source separates the two groups (MIT Election
  Lab codes both as OTHER).
- Ballotpedia's quoted and linked websites as fallbacks when Form 1 has none.
- The collection window, now the election year up to election day (see "Collection window" below).
  Druckman et al. coded in the last ten days and found little change from Labor Day; CampaignView used
  one month.
- The homepage plus at most three linked pages, chosen by URL pattern. Di Tella et al. took every page
  one click from the homepage; CampaignView took biography and issues pages.
- The latest capture of each page in the window, and Common Crawl's copy preferred over the Wayback
  Machine's.
- Common Crawl as the main archive (no political-science precedent), and archive coverage bias.
  Common Crawl samples "a randomly selected subset" of each site and favors well-linked domains (Baack
  2024, *FAccT*, doi:10.1145/3630106.3659033); 35–90% of web addresses have any archived copy
  (Ainsworth et al. 2011, *JCDL*, doi:10.1145/1998076.1998100).
- Paragraph de-duplication within a candidate-year (CampaignView stores each unique platform point).
- The spam, page-code and Spanish paragraph rules. They belong to recognized method families (C4's
  page filters; function-word language identification) but use the study's own thresholds.
- Excluding candidate-years as not campaign content. Off-topic archived captures are a recognized
  problem (Jones, Weigle and Nelson 2018, arXiv:1806.06870), but the rules are the study's own; every
  exclusion was read by hand.
- The 100-word minimum. Gopher drops documents under 50 words; there is no political-text standard.
- The 57-term list, chosen by the researcher before results were examined but not preregistered, and
  never checked for recall. King, Lam and Roberts show that hand-picked keywords miss synonyms.
- Precision checked on 20 matches per term by one coder with a 90% cutoff. No source sets either
  number, and standard practice uses two or more coders.

## Checks

First run on 2026-10-05. The three checks that depend on the page text were rerun on 2026-10-09 on the
election-year text by `analyze.py` and `check_language.py`, and the figures below come from that run
except where a step is marked as done on the earlier text.

- **Minimum length and site length** (`results/term_shares_min_words.csv`, `results/site_length.csv`).
  - At 50 or 200 words instead of 100, no term's share for either major party in any year moves by
    more than 1.8 points: 0.9 at 50 words and 1.8 at 200.
  - Candidate-years admitted only at 50 words pass the same automatic screen but were not read by hand.
  - Median analyzed site length: Democrats 1,349–1,484 words a year. Republicans 1,236–1,281 in
    2020–2024 and 1,155 in 2026. Because presence depends on length (Manning, Raghavan and Schütze 2008, sec. 13.3),
    part of any 2026 Republican decline may reflect shorter sites.
- **Spanish paragraph rule against langid.py 1.1.6** (Lui and Baldwin 2012, *ACL System
  Demonstrations*, aclanthology.org/P12-3005; `tools/check_language.py`, `results/language_check.csv`).
  langid.py is a naive Bayes identifier with a fixed distributed model, so its labels are repeatable.
  - Paragraphs of 8 or more words: langid labeled 856 of the 878 that the rule dropped as Spanish.
  - The 29 dropped paragraphs that langid does not label Spanish, of any length, were all read.
    Twenty-four are not English: 13 Spanish lines that langid misreads (mostly upper-case headings), 6
    Portuguese and 5 Vietnamese. The rule drops them as intended, since its label is "not English". The
    other 5 are English and wrongly dropped: one endorsement list of names on one candidate's site in
    four years, which holds no study term, and one news line on Robert Aderholt's 2026 site that names
    Trump; that site names Trump 18 more times, so no count changes.
  - langid labels 4,925 kept paragraphs Spanish (21,683 words, 0.40% of kept words). On the 2026-10-05
    text, a random 40 of the 4,303 then labelled held 2 Spanish lines (a slogan and a policy line); the
    rest were English, mostly names, places and short headings such as "Endorsements".
  - Conclusion: the rule matches langid closely, and no change was made.
- **Exclusions and coverage by party and year** (`results/coverage.csv`, now with min_words_met and
  excluded columns). The 20 exclusions are 12 Democratic, 7 Republican, 1 independent and no
  third-party candidate-years, and no party-year has more than 4.
- **Candidates not printed on the ballot.**
  - Florida and Louisiana declare an unopposed candidate elected without printing the race. The FEC's
    certified results mark these "Unopposed" in the general-vote column. In 2020 and 2022 these were
    Mario Diaz-Balart (FL-25, 2020), John Rutherford (FL-05, 2022) and Mike Johnson (LA-04, 2022).
    Ballotpedia's lists omit the two Floridians but list Johnson.
  - `match_fec.unopposed` now drops every candidate so marked. That removes Johnson's 2022
    candidate-year (project decision, 2026-10-05), leaving 4,899 candidacies and 4,889 candidate-years.
  - Every 2024 major-party candidate on the list is on the FEC's 2024 general ballot list
    (`2024congressgecands.xlsx`).
  - 2026 has no FEC list yet. Limitation: an unopposed 2026 Florida or Louisiana candidate who is
    listed by Ballotpedia would not be caught. No 2026 Florida or Louisiana race has a single candidate
    on the list.
- **Fusion candidates.** New York and Connecticut candidates on several party lines appear once, with
  every line in one party label ("Democratic Party, Working Families Party"), so none is counted twice.
  The FEC's Federal Elections tables likewise give a fusion candidate one total across lines (their
  "COMBINED GE PARTY TOTALS (CT, NY)" column). Grouping such a candidate with their major party is the
  study's own choice and a limitation; MIT Election Lab instead lists each line as a separate row. A
  candidate on a minor line alone ("Conservative Party", "Working Families Party") counts as third
  party.
- **Louisiana's December runoffs.** Rule: the candidate-year is defined by the November ballot, and
  text comes from the 60 days before that November election day. A December runoff adds no
  candidate-year and no text. Basis: the FEC's Federal Elections tables report Louisiana's November
  contest as the general election and the December contest in a separate "GE Runoff" column, as they
  do for Georgia. The FEC's 2020 and 2022 results show one House runoff in those years, Louisiana's 5th
  District in 2020 (Letlow against Harris). Both runoff candidates are on the November list.

# Uncertainty, multiple testing and bounds

Added after the audit. Every choice below is in `tools/inference.py`, which writes
`results/term_gaps.csv` and `results/term_bounds.csv` from the tracked share and coverage tables, and is
checked by `tools/test_inference.py` against published and hand-worked values.

- **Interval for each share: the Wilson score interval, 95 percent.** The ordinary Wald interval has
  coverage that varies erratically with the sample size and the true share, and the Wilson interval is a
  safe default at every sample size used here (Brown, Cai and DasGupta 2001, *Statistical Science*
  16(2): 101-133, doi:10.1214/ss/1009213286; read in full). The same function gives the precision
  intervals. Limitation: it measures chance variation among the candidates analyzed. It does not cover
  the candidate-years that could not be analyzed, and it treats a candidate in several years as separate
  observations.
- **Interval for a party gap: Newcombe's hybrid score interval for a difference of independent
  proportions (method 10).** It is built from the two Wilson intervals, and it is not the difference of
  two intervals (Newcombe 1998, *Statistics in Medicine* 17(8): 873-890; only an abstract excerpt was
  read). The test of the implementation uses 56 of 70 against 48 of 80, a difference of 0.2000 with
  interval 0.0524 to 0.3339. That example is recalled from the paper and has not been checked against
  it, so the match is unverified until the paper is opened.
- **Test of each gap: Fisher's exact test, two-sided.** It makes no large-sample approximation. It is
  chosen because many terms are rare, and Lijffijt and coauthors (2016) validated the t-test for
  frequent words only. The p-value sums the probability of every table with the same margins that is no
  more likely than the observed one, with the relative tolerance R uses. Limitation: the test treats
  candidates as independent and the sample as random, which the archive coverage does not support, so the
  p-values describe chance variation among the analyzed candidates only.
- **Multiple comparisons: Benjamini and Hochberg's false discovery rate adjustment, with Benjamini and
  Yekutieli's conservative version beside it.** Each wave of years is its own family: the 171 gap tests of
  2020, 2022 and 2024 together (57 terms, three years), and the 57 gap tests of 2026 separately, so adding
  a later year never changes earlier values. The within-party change tests are adjusted over their own
  family of 228 (57 terms, two parties, two pairs of elections). Every term is included, and not only the
  ones reported. Benjamini and Hochberg proved control for
  independent tests (1995, *Journal of the Royal Statistical Society B* 57(1): 289-300; pages 289 to 293
  read). Words that co-occur may not be independent, so the Benjamini-Yekutieli version, which controls the
  rate under any dependence, is reported as well (2001, *Annals of Statistics* 29(4): 1165-1188; abstract
  read). The test of the implementation uses the fifteen p-values recalled as the 1995 paper's worked example,
  where four are rejected at 5 percent. The recollection has not been checked against the paper, and the
  hand-worked adjusted values in the test are checked independently. The adjusted values do not remove the exploratory label from results chosen after viewing.
- **Worst-case bounds for the unanalyzed candidates.** If k of n analyzed candidates use a term and the
  population has N candidates, the share in the population is at least k over N and at most k plus the
  N minus n unanalyzed, over N. The width equals the unanalyzed fraction. This follows Manski's treatment
  of selection with a bounded outcome (1988, IRP Discussion Paper 873-88; abstract, introduction and
  section 2 read). Two populations are used: all candidates on the ballot, and candidates with a known
  website. The bounds are very wide, which is their point. Narrowing them needs an assumption about the
  unanalyzed, such as weighting by incumbency and race, and that analysis is separate.
- **Agreement between two coders: Krippendorff's alpha for two coders and 0/1 codes, with percent
  agreement beside it.** Alpha is the standard coefficient proposed by Hayes and Krippendorff (2007,
  *Communication Methods and Measures* 1(1): 77-89; read in full). With almost every match correct, alpha
  and kappa can be low although raw agreement is high, so both are reported (Byrt, Bishop and Carlin 1993,
  abstract read). A bootstrap interval for alpha is not yet implemented.
- **Precision samples.** With 20 matches per term, even 20 correct supports only a lower bound of 84
  percent. Thirty-five error-free checks are the fewest that support a lower bound of 90 percent, so the
  90 percent cutoff in the earlier precision check could not be met with confidence. Future samples are
  at least 50 matches per term, drawn as candidate-and-term pairs, and coded by two coders.

# Collection window (2026-10-09)

**Decision.** A site's text comes from the Common Crawl captures made between January 1 of the election
year and election day, the latest capture of each page in that span (cc.py --window year). The 60-day
and 120-day windows are collected the same way and compared in 	ools/windows.py. This applies the rule
in Amendment 4 of `ANALYSIS_PLAN.md`: the window that saves the most campaign sites, within the election
year and ending on election day.

**Standard.** None is published. Druckman, Kifer and Parkin coded the ten days before election day,
CampaignView a week before each primary, and Hilbig's dataset spans the election year (median record 255
days). The choice is stated as a limitation.

**Evidence from the comparison** (Democratic and Republican candidates, 2020, 2022 and 2024):

- Every candidate-year analyzed under the 60-day window is also analyzed under the wider ones. The
  election-year window analyzes 2,013 candidate-years against 1,828, which raises each party's coverage
  of the ballot from 63 to 71 percent to 70 to 77 percent (`results/coverage_windows.csv`).
- The 60-day window holds one crawl in 2022 (CC-MAIN-2022-40) and two or three in 2020 and 2024. For the
  candidate-years analyzed under both windows, the median analyzed site in 2022 had 1,062 words
  (Republican) and 1,253 (Democratic) under the 60-day window and 1,334 and 1,481 under the election-year
  window; in 2020 and 2024 the medians rose by 6 to 14 percent. Pages per collected site were 3.36 in
  the 60-day 2022 collection against 3.48 to 3.52 in 2020 and 2024, and 3.63 to 3.67 in every year under
  the election-year window.
- Because a candidate counts as using a term if it appears anywhere in the collected text, shorter text
  lowers shares. For the same candidates, the largest moves from the 60-day to the election-year window
  are 2022 Republican terms: "Second Amendment" 34.5 to 46.2 percent, "veterans" 48.6 to 60.3, "health
  care" 39.0 to 48.3. Across all terms the mean move is 1.6 points on the same candidates. Between the
  120-day and election-year windows, no share of all analyzed candidates moves more than 3.8 points.
- So the 60-day results partly reflect how often the archive visited each year. The election-year window
  narrows the differences in site length between years.

**Limitation.** A page saved months before election day can differ from what the campaign showed at the
end, and a site captured early in the year may still carry an earlier campaign's text. The latest capture
of each page is used to limit this, and the 60-day and 120-day shares are reported beside every headline
figure so the effect is visible.
