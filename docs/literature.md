# Literature record

Sources read for the study, with what each says and how it bears on the project. A source is marked
**full** if its full text or full official documentation was read, **abstract** if only an official
abstract or record page was read, and **lead** if it was not opened. Nothing marked abstract or lead is
cited for a claim beyond what its abstract says. Checked links and dates are noted where a second read
confirmed them. Part A covers studies and datasets of candidate websites, part B the standards for the
open measurement weaknesses, and part C the political science theory and candidate hypotheses.

## A. Studies and datasets of candidate-website content

Search record: a search of scholarly indexes (OpenAlex, Crossref), Harvard Dataverse, ICPSR, OSF,
arXiv and the web, in October 2026, using about 60 queries on candidate websites, campaign websites,
web archives, Common Crawl and third-party candidates. SSRN, SAGE, OUP, JAMA and University of Chicago
article pages, Google Scholar and Zenodo could not be opened. Kaggle, Hugging Face and GitHub were not
searched.

### Closest existing work

**Hilbig (2026).** *U.S. House (2018-2024) and Senate (2002-2024) Candidate Websites.* Harvard
Dataverse, doi:10.7910/DVN/BZ2JRS; project page hannohilbig.com/candidatewebsites. Read full (README,
codebooks, manifest, metadata); the data files were not downloaded. The deposit appeared 2026-08-19
(version 4.0 on 2026-10-02, confirmed from the Dataverse record). It archives text for Democratic,
Republican and Minnesota DFL candidates: House 2018 to 2024 and Senate in even years 2002 to 2024.
Candidates come from FEC files, and 7,348 of 15,041 candidate-years have captured text (about 49
percent). Pages come from the Wayback Machine, the homepage plus same-domain links one level deep, over
the election year and not a 60-day window (the median record spans 255 days). Its measures are text
length, lexical diversity, word rarity, shares of 31 Manifesto Project topics from a trained
classifier, and (version 4) extracted issue statements, biography facts and endorsements. It reports
no list of specific words or phrases, no independents or third parties and no 2026. The project page
shows descriptive plots of Democratic minus Republican topic attention by year. No accompanying paper
was found. This is the nearest existing resource and must be cited. It overlaps this study's 2020 to
2024 House and Senate Democrats and Republicans, and can serve as an outside comparison for their
party-by-year patterns.

**Porter, Case and Treul (2025).** CampaignView, a database of policy platforms and biographical
narratives for congressional candidates. *Scientific Data* 12, article 1237, doi:10.1038/s41597-025-05491-x;
data doi:10.7910/DVN/JIEAPT. Read full. House only, 2018, 2020 and 2022, Democratic and Republican
primary candidates (6,016 candidates, text found for 86.9 percent), collected by hand a week before each
primary. 43,465 platform points hand-labeled with one of 14 topic codes. A 20 percent relabeling check
gave 80 percent agreement and Cohen's kappa of 0.84. Its Figure 3 shows the share of candidates
addressing each topic by party and year. The paper states that there is currently no open database of
congressional candidate website text and that web archives yield reliable data for only about half of
primary candidates. The 2024 data are announced as forthcoming and the 2026 data for 2027 (University of
Iowa page, read). It is the closest peer-reviewed analogue to "share of candidates by party and year."

**Di Tella, Kotti, Le Pennec and Pons (2025).** Keep Your Enemies Closer: Strategic Platform Adjustments
during US and French Elections. *American Economic Review* 115(8): 2488-2528, doi:10.1257/aer.20231045;
earlier NBER Working Paper 31503; replication data openICPSR 226001 (not opened). Read full for the
working paper's data and methods and its sampling appendix; the empirical sections were not read in
full. U.S. House elections 2002 to 2016, Wayback-archived sites (the main page and pages one click
deep), 156,943 captures for 5,792 general-election candidates. The ideology word scores use Democratic and
Republican sites only. Candidates move toward the center between primary and general election. It is the
leading economics-side precedent for archive-based candidate site text, and it shows that large
existing datasets drop independent and third-party sites at the measurement stage.

**Bailey and Reese.** Ideological Moderation and Success in U.S. Elections, 2020-2022. Working paper
(October 9, 2024); a published version is listed at doi:10.1086/741076 (not opened). Read full for the
introduction and data section. Website and Twitter text for virtually all general-election House, Senate
and governor candidates of both major parties in 2020 and 2022, scored for ideology with a modified
wordfish model. Moderation was associated with higher vote shares. Replication files hold term-loading
tables and no raw text (Harvard Dataverse doi:10.7910/DVN/JWXTSH, abstract only). The closest published
use of 2020 and 2022 House and Senate candidate-site text, limited to the two major parties and to an
ideology score.

### The classic candidate-website literature, 2002 to 2017

**Druckman, Kifer and Parkin (2009).** Campaign Communications in U.S. Congressional Elections.
*American Political Science Review* 103(3): 343-366, doi:10.1017/S0003055409990037. Read full. 736
websites from 2002, 2004 and 2006: all Senate candidates and a stratified random sample of about 20
percent of House races, major-party candidates only. Student coders coded each whole site in the ten
days before election day, with second-coder reliability above 0.80 on about 30 percent of sites.
Findings: challengers are more negative, more interactive and more focused on issues, personal features
and party, while incumbents stress experience and district benefits and vary with how competitive the
race is. Websites are argued to be unmediated, holistic and representative, and a better sample than
television ads or newspapers (about 48 percent of sampled candidates ran no television ad). This is the
foundational justification for treating candidate sites as a record of campaign strategy. This study
differs in scale, cycles, party scope, and automated phrase counting in place of coders.

**Related papers by the same group, abstract only:**
- The Technological Development of Congressional Candidate Web Sites. *Social Science Computer Review*
  25(4), 2007, doi:10.1177/0894439307305623.
- Issue Engagement on Congressional Candidate Web Sites, 2002-2006 (with Hennessy). *Social Science
  Computer Review*, 2009, doi:10.1177/0894439309335485. Candidates engage on issues that are salient in
  public opinion.
- Timeless Strategy Meets New Medium: Going Negative on Congressional Campaign Web Sites, 2002-2006.
  *Political Communication*, 2010, doi:10.1080/10584600903502607. Negativity on the web resembles
  television ads.
- U.S. Congressional Campaign Communications in an Internet Age. *Journal of Elections, Public Opinion
  and Parties*, 2013, doi:10.1080/17457289.2013.832255.
- An Inside View of Congressional Campaigning on the Web (with Montes). *Journal of Political Marketing*
  17(4), 2017, doi:10.1080/15377857.2016.1274279.
- Consistent and Cautious: Congressional Campaigning on the Web in 2016. Northwestern IPR Working Paper
  17-01, 2017. Abstract and the section on mentions of the presidential candidates were read: most
  congressional sites did not mention Clinton or Trump, and Democrats mentioned Clinton more.
- Dataset: Druckman, Parkin and Kifer, Congressional Candidate Websites, ICPSR 34895,
  doi:10.3886/ICPSR34895.v1 (abstract only). Content-coded, major-party House and Senate, 2002 to 2006.

**Gulati and Williams (2007).** Closing the Gap, Raising the Bar: Candidate Web Site Communication in the
2006 Campaigns for Congress. *Social Science Computer Review* 25(4): 443-465,
doi:10.1177/0894439307305624. Abstract only. A content analysis of the websites of every Senate and House
candidate in 2006, minor parties included. Web presence growth had slowed, minor-party candidates were
closing the gap in Senate races, baseline content had become standard, and money paid for the richest
sites. The one older study that covered every candidate. It coded features, not words, for one cycle.

**Xenos and Foot (2005).** Politics As Usual, or Politics Unusual? Position Taking and Dialogue on
Campaign Websites in the 2002 U.S. Elections. *Journal of Communication* 55(1): 169-185,
doi:10.1111/j.1460-2466.2005.tb02665.x. Abstract only. A random sample of 200 races in 2002.

**Others, abstract or lead:**
- Foot and Schneider (2006), *Web Campaigning*, MIT Press: lead. Described by Druckman and coauthors as
  the only other study approaching their breadth.
- Stromer-Galley and Foot (2002), *Journal of Computer-Mediated Communication* 8(1),
  doi:10.1111/j.1083-6101.2002.tb00161.x: abstract only, a focus-group study, no site text. Check the
  print year before citing.
- Sulkin, Moriarty and Hefner (2007), Congressional Candidates' Issue Agendas On- and Off-line,
  *Harvard International Journal of Press/Politics* 12(2), doi:10.1177/1081180x07299802: abstract only.
  129 House candidates in 2000, websites against television ads.
- Benning, Ashby and Chapp (2020), *JAMA Pediatrics* 174(8): 795, doi:10.1001/jamapediatrics.2020.0932:
  not opened. Uses a database of congressional candidates' website issue statements held by Christopher
  Chapp. Its years and availability are unknown.
- Bailey (2023), Measuring Candidate Ideology from Congressional Tweets and Websites, SSRN 4350550: not
  opened.
- Case (2026), Candidate Differentiation in Primary Elections, UNC dissertation,
  doi:10.17615/skqs-bm56, and Porter and Case (2025), Strategic Heterogeneity in Policy-Level
  Positioning, OSF, doi:10.31219/osf.io/zhrmv_v4: abstract only. House primary platform text, 2018 to
  2022.
- Porter (2023), data for "Changing the Dialogue," doi:10.7910/DVN/S6ZMEN: description only. About 5,000
  House primary campaign websites.
- Library of Congress, United States Elections Web Archive Data Package v1.1
  (data.labs.loc.gov/us-elections): read full. Index files only, no page text, 2000 to 2016. Later years
  are embargoed.
- Not opened: Foy-Sutherland and Ghosh (2024), Redboxing in Congressional Elections, *Election Law
  Journal*, doi:10.1089/elj.2023.0038; Meisels (2024), doi:10.7910/DVN/RDXYIR; Galantucci (2019), UNC
  dissertation, doi:10.17615/84jt-7g91; Felker (2022), Georgia State dissertation, doi:10.57709/7505254.

### Is this study new?

No study or dataset was found that collects House and Senate general-election candidate-website text for
Democratic and Republican candidates across 2020, 2022, 2024 and 2026 from one archive and reports the
share using specific words and phrases by party and year. (The study originally also planned to include
independents and third parties and later dropped them from its scope, so that difference no longer
counts toward novelty.) The claim that holds up is the combination below. It does not hold as "the
first dataset of candidate-website text" for any single piece.

| Feature | This study | Nearest existing work |
| --- | --- | --- |
| 2026 cycle | Included | None found |
| Source | Common Crawl, with a few Wayback captures | Wayback Machine (Hilbig, CampaignView fallback, Di Tella and coauthors); no candidate-site study using Common Crawl was found |
| Window | The 60 days before election day | Election year (Hilbig); ten days before (Druckman and coauthors); a week before the primary (CampaignView) |
| Measure | Share of candidates using each of 57 pre-chosen phrases; t-test ranking of distinctive phrases | Topic shares (Hilbig, CampaignView), feature codes (Druckman and coauthors), ideology scores (Bailey and Reese, Di Tella and coauthors) |

Confidence: about 90 percent that no peer-reviewed article reports this analysis, and about 70 to 75
percent that no unpublished dataset or preprint does. The Hilbig deposit appeared seven weeks before this
search, so the field is moving fast. A final search is needed before submission.

Two further consequences. First, the 2026 window ends on election day, so no Common Crawl release can
yet cover all of it. The Common Crawl crawls available must be checked before relying on them. Second,
Hilbig's House coverage of Democrats and Republicans for 2020 to 2024 is an outside check on this
study's party shares for those candidates.

## B. Methods standards for the six open weaknesses

Status marks as above, with **partial** for full text read in the sections named. Statements marked
"inference" are reasoning from the sources and are not claimed by them. The Wilson intervals below were
recomputed with the project's own `precision.wilson` and match.

### 1. Archive coverage: about 56 percent of candidate-years, skewed to incumbents and winners

No source offers a clean fix. The standards are to describe who is missing, weight by observed
characteristics, bound the rest, and word every claim as "of candidates whose sites were archived."

Actions: (1) a coverage table by year, party, chamber, incumbency and win or loss, comparing analyzed
and unanalyzed candidates on incumbency, margin, spending and district lean; (2) phrase every result as
"of candidates whose sites were archived"; (3) weighted estimates beside unweighted ones, from a model of
the chance a candidate-year is in the sample, with stabilized or truncated weights and diagnostics, which
works only if selection depends on what is observed; (4) worst-case bounds: with 56 percent coverage, an
observed share p implies a population share between 0.56p and 0.56p + 0.44 (arithmetic from Manski's
bound; for p = 0.30 that is 0.17 to 0.61), tightened only within strata such as incumbents only; (5) party
gaps within incumbent and challenger strata and within winner and loser strata; (6) look for ways to
raise coverage, as Di Tella and coauthors did by combining the Library of Congress election archive with
Wayback searches (inference: also check whether a site existed and went unarchived or never existed).

- Baack (2024), A Critical Analysis of the Largest Source for Generative AI Training Data: Common Crawl.
  FAccT '24, doi:10.1145/3630106.3659033. Full. Common Crawl says it is not the entire web or a
  representative sample. Since 2017 it has chosen domains by harmonic centrality, a score from how many
  direct and indirect links point to a domain, so better-linked domains are crawled more and more
  deeply. It samples pages within a domain, its crawls are discontinuous, sites blocking it through
  robots.txt are excluded, and content is mostly English. Baack concludes the samples are necessarily
  biased. Nothing in it concerns candidates; that link prominence tracks incumbency and winning is
  inference, plausible but untested.
- Ainsworth, AlSum, SalahEldeen, Weigle and Nelson, How Much of the Web Is Archived? arXiv:1212.6177.
  Full text of the arXiv version. 35 to 90 percent of the web has at least one archived copy depending on
  the sample, and each sample set provides its own bias, so no archive-coverage rate can be borrowed to
  correct this study's. The version read names no venue; the conference citation in `METHODS.md` must be
  checked before use.
- Thelwall and Vaughan (2004), A fair history of the Web? Examining country balance in the Internet
  Archive. *Library and Information Science Research* 26: 162-176, doi:10.1016/j.lisr.2003.12.009.
  Partial. Archive coverage differs by country, with site age and link structure as plausible causes.
- Di Tella, Kotti, Le Pennec and Pons, NBER Working Paper 31503. Partial. The closest precedent. They
  found 3,649 of 4,600 targeted primary sites, collected winners' and losers' sites by separate
  procedures so as not to gather more winners than losers, and tested for selection by checking whether
  the chance of having a website jumps at the qualification threshold.
- Manski (1988), Anatomy of the Selection Problem, IRP Discussion Paper 873-88. Partial. With a bounded
  outcome, observed data bound the population mean, and the width is the outcome's range times the
  unselected probability. For a yes-or-no outcome the width equals the missing fraction.
- Lee (2009), Training, Wages, and Sample Selection, *Review of Economic Studies* 76(3): 1071-1102 (NBER
  Working Paper 11721 read, partial). Trimming bounds need random assignment of the group variable and
  monotone selection. Party is not randomly assigned, so any trimming analysis here is an adaptation and
  must be called a sensitivity analysis.
- Seaman and White (2013), Review of inverse probability weighting for dealing with missing data.
  *Statistical Methods in Medical Research* 22(3): 278-295, doi:10.1177/0962280210395740. Abstract only.
  Supports weighting, truncation and stabilization.
- Li, Shen, Li and Robins (2013), On weighting approaches for missing data. *Statistical Methods in
  Medical Research*, doi:10.1177/0962280211403597. Abstract and introduction. Weighting works when data
  are missing at random given what is observed.

### 2. Recall: the 57-term list was never checked for missed terms

Recall matters only for claims about a concept, such as "mentions health care." A claim about a specific
word has no recall problem, so the paper must say which kind each claim is.

Actions: for concept claims, run a computer-assisted keyword discovery step following King, Lam and
Roberts, with humans accepting or rejecting each suggested term. Estimate recall from a random sample of
sites or paragraphs coded blind to the term list: recall is the share of concept-positive items matched
by at least one term, with a Wilson interval (this is an adaptation, not a procedure the papers
prescribe). Keep the human-coded evaluation set apart from the term-discovery material.

- King, Lam and Roberts (2017), Computer-Assisted Keyword and Document Set Discovery from Unstructured
  Text. *American Journal of Political Science*, doi:10.1111/ajps.12291. Full. Researchers pick keywords
  in ad hoc ways that are far from optimal and usually biased. In their experiment 43 students listed
  keywords for Obamacare, 149 unique words came up, 66 percent were named by one person, and no two lists
  matched. Incomplete keyword sets can cause severe selection bias.
- Grimmer and Stewart (2013), Text as Data. *Political Analysis*, doi:10.1093/pan/mps028. Full. Methods
  augment humans and do not replace them, there is no globally best method, and results must be
  validated. Dictionaries should be used with substantial caution or with explicit validation.
- van Atteveldt, van der Velden and Boukes (2021), The Validity of Sentiment Analysis. *Communication
  Methods and Measures* 15(2): 121-140, doi:10.1080/19312458.2020.1869198. Full. A dictionary can have
  high precision and low recall. The people who annotate the gold standard should not help build the
  dictionary.

### 3. Precision: 20 matches per term, checked by one coder

Actions: (1) sample the unit that matters, a candidate-and-term pair drawn at random. The study's
sample already does this: `match_sample` draws 20 distinct candidates per term and shows one random
match each, so no site contributes twice; (2) at least two independent coders blind to party, with a
stated rule for disagreements; (3) a reliability sample of at least 50 units or 10 percent, rarely more
than 300, after a pilot of about 30 (Lombard); (4) Krippendorff's alpha with a bootstrap interval, plus
percent agreement and the prevalence and bias indices, because almost all matches are true positives
and kappa or alpha can be low despite high raw agreement (that last reasoning is inference); (5)
precision per term as correct over n with a Wilson interval.

Arithmetic that matters: 20 of 20 correct gives a Wilson interval of 0.84 to 1.00 and 18 of 20 gives
0.70 to 0.97, so 20 matches per term cannot show precision of 0.90 even with no errors. About 35
error-free checks are needed for a lower bound near 0.90. The study's 90 percent cutoff has no source,
and with 20 per term it cannot be met with confidence.

- Lombard, Snyder-Duch and Bracken (2002), *Human Communication Research* 28(4): 587-604,
  doi:10.1111/j.1468-2958.2002.tb00826.x. Not opened. The authors' companion guidelines at
  matthewlombard.com/reliability were read in full: choose and justify the index in advance, do not rely
  on percent agreement alone, .90 is nearly always acceptable, .80 acceptable in most situations, .70
  may do in exploratory work, a pilot of about 30, a reliability sample of at least 50 units or 10
  percent and rarely above 300, at least two coders and preferably not the researcher. There is no
  consensus on a single best index, and reporting two is suggested.
- Hayes and Krippendorff (2007), Answering the Call for a Standard Reliability Measure for Coding Data.
  *Communication Methods and Measures* 1(1): 77-89. Full. Proposes Krippendorff's alpha as the standard,
  argues kappa takes each coder's own category use as the baseline and so can reward systematic
  disagreement, and says alpha's sampling distribution should be bootstrapped. It gives no universal
  minimum, and the .80 and .667 convention does not appear in it.
- Byrt, Bishop and Carlin (1993), Bias, prevalence and kappa. *Journal of Clinical Epidemiology* 46(5):
  423-429. Abstract only. Kappa alone can mislead.
- Feinstein and Cicchetti (1990), High agreement but low kappa. *Journal of Clinical Epidemiology* 43(6):
  543-549. Abstract only.
- Song and coauthors (2020), In validations we trust? *Political Communication*. Abstract only; volume,
  pages and DOI unconfirmed. Imperfect human annotation raises the risk of wrong conclusions about
  automated methods.
- Krippendorff (2004), *Human Communication Research* 30(3): 411-433. Not opened.
- Brown, Cai and DasGupta (2001): see section 5.

### 4. Many terms examined, findings picked afterward

Actions: (1) count the whole family of tests honestly, every term, year, subgroup and comparison looked
at; (2) control the false discovery rate with Benjamini and Hochberg, reporting raw p-values and adjusted
q-values, and also run the conservative variant for arbitrary dependence, because words that co-occur
may not satisfy the independence or positive-dependence conditions; (3) a permutation null: reassign
party labels among candidates at random, recompute the ranking many times, and show how many terms pass
the cutoff by chance; (4) fix the minimum-frequency filter for the vocabulary ranking in advance, on
pooled counts (inference); (5) fix a dated analysis plan and say what has already been seen; label
everything chosen after viewing results exploratory in text and tables; (6) confirm on held-out data
where possible. The 2026 text could serve as a held-out test only if hypotheses are fixed before it is
analyzed, and the early 2026 results have already been seen, so this depends on what exactly is held out.

- Benjamini and Hochberg (1995), *Journal of the Royal Statistical Society B* 57(1): 289-300,
  doi:10.1111/j.2517-6161.1995.tb02031.x. Partial (pages 289 to 293 of a scan). Researchers tend to
  select the significant results for emphasis. The procedure orders the p-values and rejects through the
  largest i with p(i) at most (i/m)q, which controls the false discovery rate for independent tests.
- Benjamini and Yekutieli (2001), *Annals of Statistics* 29(4): 1165-1188, doi:10.1214/aos/1013699998.
  Abstract only. The same procedure controls the rate under positive regression dependency, and a
  conservative modification covers any dependence.
- Lijffijt, Nevalainen, Säily, Papapetrou, Puolamäki and Mannila (2016), Significance testing of word
  frequencies in corpora. *Digital Scholarship in the Humanities* 31(2): 374-397, doi:10.1093/llc/fqu064.
  Read through page-text queries only, so quoted wording is unverified until the PDF is checked.
  Independence should be assumed at the level of texts. Recommended tests are the t-test, the Wilcoxon
  rank-sum test and a bootstrap test, with Welch's version of the t-test. They behave well for frequent,
  well-dispersed words, and the authors say a frequency of 50 is often too low and advise at least 100
  texts per corpus. Their own application controls the false discovery rate at 0.05. Caution (inference):
  this study's share measure is a yes-or-no indicator that is often rare, outside the regime they
  validated, so for rare terms a Fisher exact or permutation test is safer than a t-test on yes-or-no
  data.
- Monroe, Colaresi and Quinn (2008), Fightin' Words. *Political Analysis* 16(4): 372-403,
  doi:10.1093/pan/mpn018. Full. Simple ranking statistics have no stated model and no confidence
  statement, raw differences put rare words at the top, and z-scores of log-odds ratios with Dirichlet
  shrinkage are recommended. Their data are word tokens pooled by party, a different unit from this
  study's candidates. The paper does not prescribe a multiplicity correction and must not be cited for
  one.
- Gentzkow, Shapiro and Taddy (2019), Measuring Group Differences in High-Dimensional Choices.
  *Econometrica* 87(4): 1307-1340, doi:10.3982/ECTA16566. Full. A plug-in estimate of partisanship is
  biased upward in finite samples, and the bias can be many orders of magnitude larger than the true
  signal. Fixes are a leave-out estimator and a penalized model. Their diagnostic is a permutation test
  that reassigns party at random. The bias is a property of an aggregate index over the whole
  vocabulary, not of one phrase's test, and it bears on this study only by analogy, for rankings of
  distinctive phrases chosen from many.
- Gelman, Hill and Yajima, Why we (usually) don't have to worry about multiple comparisons,
  arXiv:0907.2478. Partial. A multilevel model with partial pooling is the alternative to corrections,
  and the paper used must say which approach it takes.
- Egami, Fong, Grimmer, Roberts and Stewart, How to Make Causal Inferences Using Texts, arXiv:1802.02163
  (version 1). Partial. Discovering a measure and testing it on the same documents overfits. Split the
  data at random, explore the training half freely, and access the test half once, with a 50-50 default.
  It is a causal paper, and applying it to a descriptive ranking is an extension.
- Fong and Grimmer (2016), Discovery of Treatments from Text Corpora. ACL 54: 1600-1609. Abstract only.
- Nosek, Ebersole, DeHaven and Mellor (2018), The preregistration revolution. *PNAS* 115(11): 2600-2606,
  doi:10.1073/pnas.1708274114. Full. Mistaking postdiction for prediction reduces credibility. With data
  already seen, the strength of a test depends on whether analysis decisions are blind to the data, and
  deviations must be reported. Exploratory analysis is valuable if labeled and followed by a test.
- van den Akker and coauthors (2021), Preregistration of secondary data analysis: A template and
  tutorial. *Meta-Psychology* 5, doi:10.15626/MP.2020.2625. Partial. The template asks what is already
  known about the data and who has seen it. It gives the format for a plan that discloses the 57 results
  already seen.
- Chan and coauthors (2021), Four best practices for measuring news sentiment using off-the-shelf
  dictionaries. *Computational Communication Research* 3(1): 1-27, doi:10.5117/CCR2021.1.001.CHAN. Full.
  Thirty-seven dictionary scores on one corpus gave a spread of significance levels. Do not shop among
  dictionaries; report all or fix one in advance, and check text length.
- Leads not opened: Monogan (2013), registering a House-election study, *Political Analysis* 21(1);
  Humphreys, Sanchez de la Sierra and Van der Windt (2013); Wagenmakers and coauthors (2012).

### 5. Shares need proper uncertainty intervals

Actions: Wilson score intervals for every share, not the Wald interval; the Wilson-based Newcombe interval
or a bootstrap for party gaps, never two subtracted intervals; state that these cover sampling error only
and not archive selection; resample by candidate when bootstrapping, because a candidate in several
cycles is not independent (inference).

- Brown, Cai and DasGupta (2001), Interval Estimation for a Binomial Proportion. *Statistical Science*
  16(2): 101-133, doi:10.1214/ss/1009213286. Full. The Wald interval has chaotic coverage that is far
  more persistent than appreciated: the nominal 95 percent interval covers 0.952 at p = 0.106 but 0.911 at
  p = 0.107. Wilson is recommended and is a safe default at every sample size here.
- Newcombe (1998), Interval estimation for the difference between independent proportions: comparison of
  eleven methods. *Statistics in Medicine* 17(8): 873-890. Abstract excerpt only. Cite the independent
  proportions paper, not Newcombe's paired-proportions paper from the same journal.

### 6. Tone measures need validation against human coding

Actions: report no dictionary tone result until it is checked against a human-coded sample of this
study's own text. Build the gold standard with at least two annotators and Krippendorff's alpha. van
Atteveldt and coauthors used 300 headlines and cite 100 to 300 units as typical (secondhand; check
Krippendorff's book before citing numbers). Grimmer and Stewart suggest binary categories, because human
coders cannot reliably produce fine scales. Compare dictionary and human labels with accuracy, per-class
precision, recall, F1 and alpha. Check whether the score depends on text length. Do not try several
dictionaries and report the one that works. If none validates, drop the tone claim. Keep the gold
standard out of any dictionary customization.

- van Atteveldt, van der Velden and Boukes (2021). Full. None of the dictionaries tested came close to
  acceptable validity, machine learning did better but fell short of human coders, and every automatic
  text analysis project should start with coding a validation set. It is one Dutch economic-headline
  test, so it shows dictionaries can fail and does not show that this one does.
- Grimmer and Stewart (2013). Full. Measures from dictionaries are rarely validated, and applying a
  dictionary outside its domain can lead to serious errors.
- Chan and coauthors (2021). Full. Supplies the text-length and no-dictionary-shopping practices.
- Boukes, van de Velde, Araujo and Vliegenthart (2020), What's the Tone? Easy Doesn't Do It.
  *Communication Methods and Measures*, doi:10.1080/19312458.2019.1671966. Not opened.

### To check before citing

- The venue of Ainsworth and coauthors (`METHODS.md` says a 2011 conference) and the volume, pages and
  DOI of Song and coauthors.
- The Lijffijt quotations, against the PDF.
- Krippendorff (2004) and Lombard and coauthors (2002), which were not opened.
- The published versions of Egami and coauthors and of Gelman, Hill and Yajima, which may differ from the
  arXiv versions read.

### What the literature does not provide

No political-science paper was found that gives multiple-comparison guidance for exploratory text
analysis, so the plan rests on the general false-discovery-rate literature, Lijffijt's use of it, and the
split-sample and preregistration literature. No established standard was found for bounding selection
from an incomplete web archive. Manski bounds and inverse probability weighting are general methods
applied here, and the trimming analysis is a sensitivity analysis and is described as one.

## C. Political science theory

Status marks as above. A source marked abstract or lead is cited only for what its abstract says, and
the sources most worth reading in full are listed at the end of this part. The works by Mayhew (1974)
and Fenno (1978) were not opened and are cited only as framing.

### Addition to part A: Meisels (2025)

Meisels, Mellissa (2025). Strategic campaign attention to abortion before and after *Dobbs*. *Proceedings
of the National Academy of Sciences* 122(20): e2503080122, doi:10.1073/pnas.2503080122. The title,
author, date and abstract were confirmed from the Crossref record, and the full text was read by the
research pass. It uses campaign-platform data from 4,703 House primary candidates, 2016 to 2024. Before
2022 Republicans campaigned on abortion more than Democrats, in 2022 the two shares were equal, and by
2024 Democrats were far more likely to (14 points in 2022 and 31 points in 2024 above their 2016 to 2020
level), while fewer than half of Republicans campaigned on abortion and Republicans increasingly
obscured their position. Before *Dobbs* Democrats used euphemisms such as "choice" and "reproductive
rights," and by 2024 they used the word "abortion" more than Republican candidates did. The divergence
was largest in states with trigger laws or pre-*Roe* bans, and attention to seven other issues did not
show the change. It is the closest published analogue to this study's abortion finding and must be cited.
It bears directly on measurement: the share of sites using the word "abortion" can rise because candidates
switched wording and not because more of them addressed the topic, so euphemism terms must be added to
any claim about attention to the topic.

### 1. Issue ownership

- Petrocik (1996), Issue Ownership in Presidential Elections, with a 1980 Case Study. *American Journal
  of Political Science* 40(3): 825-850, doi:10.2307/2111797. Not opened. Its definition is quoted in
  papers that were read. Ownership is a voter perception that a party is better able to handle a problem,
  built on a history of attention and commitment, and parties gain by making their owned issues the
  criteria for the vote.
- Petrocik, Benoit and Hansen (2003), *Political Science Quarterly* 118(4): 599-626,
  doi:10.1002/j.1538-165x.2003.tb00407.x. Not opened. Druckman and coauthors (2010) report that it treats
  the economy as a performance issue, which changes hands according to who is judged to be doing well.
- Egan (2013), *Partisan Priorities: How Issue Ownership Drives and Distorts American Politics*.
  Cambridge University Press, doi:10.1017/CBO9781107337138. Abstract of chapter 3 only. Each party has
  long-term trust on particular issues that is not explained by public preferences, and representatives
  use that trust to be less responsive on owned issues.
- Stubager and Slothuus (2013), What Are the Sources of Political Parties' Issue Ownership? *Political
  Behavior* 35: 567-588, doi:10.1007/s11109-012-9204-2. Full. Partisanship, attitudes, perceived
  performance and a party's constituency each matter independently.
- Walgrave, Tresch and Lefevere (2015), The Conceptualisation and Measurement of Issue Ownership. *West
  European Politics* 38(4): 778-796, doi:10.1080/01402382.2015.1039381. Full. Ownership has a competence
  dimension and an associative dimension, evidence that parties favor owned issues is mixed, and
  trespassing and convergence are frequent. A word count is not a measure of ownership.
- Lefevere, Tresch and Walgrave (2015), Introduction: Issue Ownership. *West European Politics* 38(4):
  755-760, doi:10.1080/01402382.2015.1039375. Full. There is no consensus on the effects of ownership.
- Abstract only: Walgrave, Lefevere and Tresch (2012), *Public Opinion Quarterly* (associative
  dimension); Walgrave and De Swert (2007), *International Journal of Press/Politics* 12(1): 37-67,
  doi:10.1177/1081180X06297572 (ownership comes from party communication and media coverage); Sides
  (2006), The Origins of Campaign Agendas, *British Journal of Political Science* 36(3): 407-436,
  doi:10.1017/S0007123406000226 (1998 House and Senate ads; candidates trespass on the other party's
  issues more than earlier work found); Sides (2007), The Consequences of Campaign Agendas, *American
  Politics Research* 35(4): 465-488, doi:10.1177/1532673X07300648 (candidates did not consistently stress
  owned or salient issues, and agendas barely affected outcomes); Damore (2004), *Political Research
  Quarterly* 57(3): 391-397, doi:10.1177/106591290405700304 (trespassing depends on competitive
  standing, partisanship, issue importance and tone).
- Leads, not opened: Damore (2005), *Political Behavior* 27(1): 71-97; Holian (2004), *Political
  Behavior* 26(2): 95-124.

### 2. Convergence versus talking past each other

- Druckman, Hennessy, Kifer and Parkin (2010), Issue Engagement on Congressional Candidate Web Sites,
  2002-2006. *Social Science Computer Review* 28(1): 3-23, doi:10.1177/0894439309335485. Full. The
  closest match to this project's data. It uses the 736 House and Senate sites. Engagement means both
  candidates in a race mentioned the same issue. Engagement is much higher than a random baseline and
  tracks public salience (correlation .66), while its correlation with issue ownership is about zero
  (-.01). Competitive races have more engagement. In a survey of 137 campaign web staff the website was
  rated the best representation of the campaign's overall message, above speeches, television ads and
  direct mail.
- Minozzi (2012 draft), Conditions for Dialogue and Dominance in Political Campaigns, published in
  *Political Communication* 31(1), doi:10.1080/10584609.2012.747191. Full, of the 2012 draft. Using
  2000 to 2004 House and Senate ads, salience raises convergence and convergence is higher in competitive
  races. Ownership dominance appears only once races are split by competitiveness. Competition drives
  dialogue on very salient issues but leads to dominance on low-salience issues.
- Sigelman and Buell (2004), Avoidance or Engagement? *American Journal of Political Science* 48(4):
  650-661, doi:10.1111/j.0092-5853.2004.00093.x. Abstract only. Across 1960 to 2000 the two sides' issue
  emphases were highly similar.
- Simon (2002), *The Winning Message*, Cambridge University Press, doi:10.1017/CBO9780511613524.
  Publisher blurb only.
- Not opened: Kaplan, Park and Ridout (2006), Dialogue in American Political Campaigns?, *American
  Journal of Political Science* 50(3): 724-736, doi:10.1111/j.1540-5907.2006.00212.x, known only through
  Minozzi's description (Senate ads, salience raises convergence, no ownership dominance). Sides and
  Karch (2008) is about issue publics and turnout and is not part of this literature.

### 3. Nationalization

- Hopkins (2018), *The Increasingly United States*. University of Chicago Press. Full for the
  introduction chapter only. Nationalization has two dimensions: vote choice follows national lines, and
  engagement shifts toward national politics. Causes include parties offering the same package everywhere
  and a decline in local news.
- Carson and Hitefield (2023), A Red Wave or a Ripple? Nationalized Politics and the 2022 Midterm
  Elections. *The Forum* 21(1): 3-25, doi:10.1515/for-2023-2002. Abstract only, though it is a POLS 308
  reading. The same authors wrote parallel pieces for 2018 (doi:10.1515/for-2018-0035) and 2024
  (doi:10.1515/for-2025-2008, with Wall).
- Jacobson (2015), It's Nothing Personal: The Decline of the Incumbency Advantage in US House Elections.
  *Journal of Politics* 77(3): 861-873, doi:10.1086/681670. Abstract only. The incumbency advantage fell as
  party loyalty and president-centered nationalization rose.
- Abstract only: Sievert and McKee, *American Politics Research* 47(5): 1055-1080,
  doi:10.1177/1532673x18792694; Dunphy (2023), SSRN, doi:10.2139/ssrn.4366054 (candidates nationalize
  strategically, most in nationally competitive districts); Neiheisel and Niebler (2013), *Legislative
  Studies Quarterly* 38(3): 377-403, doi:10.1111/lsq.12019 (strategic use of party brand labels).
- Leads: Jacobson (2019), *Political Science Quarterly* 134(1): 9-38, doi:10.1002/polq.12866; Abramowitz
  and Webster (2016), *Electoral Studies* 41: 12-22, doi:10.1016/j.electstud.2015.11.001; Johnston (2024),
  *The Nationalization of Congressional Politics*, Palgrave, doi:10.1007/978-3-031-74929-2.

### 4. Candidate-centered and party-centered messaging, incumbency and competitiveness

- Druckman, Kifer and Parkin (2009), described in part A. In the most competitive races incumbents were
  52, 28 and 16 percent more likely than challengers to highlight district benefits, familiarity and
  prior office, and in the least competitive races there was no significant difference. Samples limited to
  television ads or news coverage would have hidden several of these differences.
- Grimmer (2013), Appropriators not Position Takers. *American Journal of Political Science* 57(3):
  624-642, doi:10.1111/ajps.12000. Abstract only. Marginal representatives stress appropriations, and
  aligned representatives in safe own-party districts build their home style on position taking.
- Not opened: Mayhew (1974), *Congress: The Electoral Connection*, Yale University Press; Fenno (1978),
  *Home Style*; Lee (2016), *Insecure Majorities*, doi:10.7208/chicago/9780226409184.001.0001.

### 5. Partisan language and vocabulary over time

- Gentzkow, Shapiro and Taddy (2019), described in part B. The chance of guessing a speaker's party from
  one minute of House speech was 54 percent in 1873 to 1875 and 57 percent in 1989 to 1990, and rose to
  73 percent by 2007 to 2009 (NBER Working Paper 22423 read, full). Naive estimates miss the rise because
  of small-sample bias. The rise is driven more by how the parties talk about the same topic than by which
  topics they choose ("death tax" against "estate tax"). "Middle class" is among the 110th Congress's
  Democratic phrases.
- Peterson and Spirling (2018), Classification Accuracy as a Substantive Quantity of Interest. *Political
  Analysis* 26(1): 120-128, doi:10.1017/pan.2017.39. Full. Polarization claims make sense when parties
  talk about the same topics differently and not when they only raise different topics. A count of words
  therefore conflates topic emphasis with wording.
- Jensen, Kaplan, Naidu and Wilse-Samson (2012), Political Polarization and the Dynamics of Political
  Language. *Brookings Papers on Economic Activity*, Fall 2012. Abstract and introduction. Language
  polarization in Congress tracks DW-NOMINATE after 1930, with strong momentum in phrase use from one
  Congress to the next.
- Card and coauthors (2022), *PNAS* 119(31): e2120510119, doi:10.1073/pnas.2120510119. Abstract only. It
  studies the framing of immigration in congressional and presidential speech from 1880, not the language
  of Congress in general. The party split on immigration began around 1978.
- Monroe, Colaresi and Quinn (2008): see part B. Hofmarcher and coauthors, arXiv:2206.10877, abstract
  only. Lead: Gentzkow and Shapiro (2010), *Econometrica* 78(1): 35-71, doi:10.3982/ecta7195.

### 6. Class and economic language

No primary academic study of the phrase "working families" was found, and this is the thinnest part of
the search. What exists: "middle class" among Democratic phrases in Gentzkow, Shapiro and Taddy; leads
not opened: Bonikowski and Gidron (2016), The Populist Style in American Politics, *Social Forces* 94(4):
1593-1621, doi:10.1093/sf/sov120, and Lakoff (1996), *Moral Politics*, University of Chicago Press.
Journalism and think-tank claims about "working class" language were not opened and are not cited.

### 7. *Dobbs* and inflation

- Meisels (2025), above.
- Wesleyan Media Project, 2022 summary, mediaproject.wesleyan.edu/2022-summary-022223. Read, and the two
  figures below were confirmed on a second read. In ads aired September 5 to November 8, 2022, 40.2
  percent of pro-Republican House ads mentioned inflation and 38.8 percent of pro-Democratic House ads
  mentioned abortion. In Senate ads the figures were 34.5 and 26.9 percent. These sit close to this
  study's 2022 and 2024 shares of Republican candidates using "inflation" (39 and 40 percent) and
  Democratic candidates using "abortion" (29 and 38 percent). The units differ: an ad count against a
  candidate count.
- Mutz and Mansfield (2024), Inflation in 2022 did not affect congressional voting, but abortion did.
  *PNAS* 121(21), doi:10.1073/pnas.2319512121. Abstract and introduction. A statement about voters, so the
  paper's claims must stay with what candidates chose to say.
- Franz, Ridout and Fowler (2023), Television Advertising in the 2022 Midterms, *The Forum* 21(1): 27-51,
  doi:10.1515/for-2023-2005. Abstract only. The agenda shifted to abortion and inflation.
- Evans (2026), Issue Framing After Dobbs: Tweets During the 2022 Midterm Elections. *PS: Political
  Science and Politics* 59(3): 421-429, doi:10.1017/s1049096525101820. Abstract only.

### 8. Websites as a measure of campaign messaging

Druckman and coauthors (2009, 2010) supply the case: a site is the campaign's own, unmediated text,
nearly every campaign has one, so coverage is far more complete than television ads or news, and the
137 campaign web staff surveyed rated it the best single picture of the campaign's message. Limits to
state in the paper: sites change, most voters do not read them, and they mostly reach already-engaged
supporters. No scholarly source was found for the term "owned media," which is practitioner language.

### 9. Who runs versus how candidates change

- Theriault (2006), Party Polarization in the US Congress. *Party Politics* 12(4): 483-503,
  doi:10.1177/1354068806064730. Abstract only. Member replacement accounts for about two-thirds of
  polarization since 1973 and member adaptation for about one-third. The standard way to frame who runs
  against how the same people change, and the returning-candidate panel is the adaptation side of it.
- Thomsen (2014), Ideological Moderates Won't Run. *Journal of Politics* 76(3): 786-797,
  doi:10.1017/s0022381614000243. Abstract only.

### Unread sources worth reading in full

Petrocik (1996), Kaplan, Park and Ridout (2006), the later chapters of Hopkins (2018) and the full text
of Carson and Hitefield (2023) are the most important. A library with JSTOR and Wiley access can open
the first three, and Carson and Hitefield is already a course reading.

### Concepts the paper must define

Issue ownership (competence against associative, and performance issues separately); trespassing,
convergence, engagement and dialogue, including whether both parties using a word counts as dialogue;
salience, at district or national level; nationalization, in Hopkins's two dimensions; competitiveness
and incumbency, with one rating source chosen; partisan language, in the sense of how well party can be
guessed from speech.

### Candidate hypotheses with predicted direction

These are candidates for the research questions and analysis plan. Each states the sources that motivate
it. H9 is a forecast, and H7, H10 and the abortion half of H4 extend the literature in directions no
source tests, as marked. None is a finding. The results already seen (abortion and inflation shares and
the panel) cannot count as tests of H2, H3 or H10 and must be disclosed as already seen.

- **H1.** Long-owned issue words stay split by party in all four years: "climate" higher among Democrats
  and "border" higher among Republicans. Motivated by Petrocik, Egan, Walgrave and coauthors, and the
  ownership table of Druckman and coauthors (2010).
- **H2.** A salient performance issue draws both parties, with the out-party using it far more:
  "inflation" near 3 percent in 2020 and about 40 percent of Republicans and 15 percent of Democrats in
  2022 to 2024. Motivated by Druckman and coauthors (2010, salience and not ownership drives
  engagement), Sides (2006), Minozzi, and Petrocik and coauthors (2003, as described by Druckman and
  coauthors).
- **H3.** After *Dobbs* the Democratic share using abortion terms rises and the Republican share stays flat
  or falls by 2024, and part of the Democratic rise in the word "abortion" is a switch from euphemisms.
  Test with added terms such as "choice" and "reproductive rights." Motivated by Meisels (2025).
- **H4.** Competitiveness raises convergence on very salient issues and leaves low-salience issues owned,
  so Democratic use of "inflation" is higher in competitive seats than safe ones. Motivated by Minozzi
  and Druckman and coauthors (2010). The abortion half, that Republicans use it less in competitive seats,
  has no direct test in any source and is less certain.
- **H5.** Incumbents use fewer issue words than challengers, and the gap closes in competitive seats.
  Motivated by Druckman, Kifer and Parkin (2009).
- **H6.** Candidates in safe own-party seats use the most party-distinctive words. Motivated by Grimmer
  (2013). It pulls against H5, and both must be reported.
- **H7.** Within-party similarity across districts rises from 2020 to 2026. Motivated by Hopkins, Jacobson
  (2015), Dunphy and Carson and Hitefield. It extends nationalization from voting to vocabulary, which no
  source tests.
- **H8.** Rival wordings for one issue are more partisan than the topic word itself: "pro-life" against
  "reproductive rights" more than "abortion." Motivated by Gentzkow, Shapiro and Taddy (2019) and
  Peterson and Spirling (2018). This either adds rival terms to the list or states plainly that the
  57 terms measure emphasis.
- **H9.** In the 2026 midterm, with a Republican president, Democratic use of cost-of-living words rises
  and Republican use of "inflation" falls. Motivated by the performance-issue idea. A forecast, to be
  fixed before the 2026 data are analyzed.
- **H10.** Event-driven words such as "inflation" and "abortion" change mostly through candidates adapting,
  and slow partisan words such as "working families" and "climate" change mostly through who runs.
  Motivated by Theriault and Thomsen. Speculative, with no source testing it for vocabulary.
- **H11.** Website shares are at least as high as advertising shares for most issues. Motivated by
  Druckman and coauthors (2009, 2010) and the Wesleyan figures. The units differ and must be stated.

### Gaps

Every ownership and engagement dataset above is from 2002 to 2006, 2016 to 2020, or advertising, and none
covers 2026. No peer-reviewed treatment of "working families" was found.
