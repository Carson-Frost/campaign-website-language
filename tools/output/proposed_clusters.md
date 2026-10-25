# Proposed synonym clusters

Count: 28 clusters covering 102 member terms from the top 300 of tools/output/master_candidates.csv (top 150 unigrams, top 100 bigrams, top 50 trigrams). Pair-rule: overlap >= 0.5 AND shared meaning; known synonym families (freedom and liberty, 2nd Amendment variants, Roe and Planned Parenthood, climate and clean energy) are kept together even when co-occurrence is low because authors pick one wording per site. No cross-lean merges.

## Clusters

| Cluster | Theme | Lean | Members | Anchor overlap |
| --- | --- | --- | --- | --- |
| Trump identity | Opponents and politics | neutral | trump, president trump, donald trump, president donald trump, trump administration, president donald, donald j trump | trump / president trump (1.00) |
| Biden identity | Opponents and politics | neutral | biden, joe biden, biden administration | biden / joe biden (1.00) |
| Working people | Economy and class | D | working families, middle class, workers | workers / working families (0.62) |
| Small business (flag) | Economy and class | neutral | small business, small businesses, small business owners, business owners | small businesses / small business (0.52) |
| Cost of living and affordability (flag) | Economy and class | neutral | affordable, cost of living, make ends meet, lower the cost, access to affordable | affordable / cost of living (0.65) |
| Minimum wage | Economy and class | D | minimum wage, federal minimum wage | minimum wage / federal minimum wage (1.00) |
| Jobs and economic growth | Economy and class | neutral | jobs, economy, economic growth, job creation, good-paying jobs | jobs / economy (0.74) |
| Second Amendment / gun rights | Rights and values | R | second amendment, 2nd amendment, bear arms, keep and bear | second amendment / bear arms (0.67) |
| Gun violence prevention | Rights and values | D | gun violence, gun violence prevention, background checks, moms demand action | gun violence / background checks (0.65) |
| Reproductive rights | Rights and values | D | planned parenthood, roe v wade, right to choose | planned parenthood / roe v wade (0.32) |
| Border security | Security and immigration | R | border, border security, southern border, secure the border, illegal immigration | border / border security (1.00) |
| Law enforcement | Security and immigration | neutral | law enforcement, police, law enforcement officers, first responders, enforcement | enforcement / law enforcement (1.00) |
| National defense | Security and immigration | R | national security, military, marine corps, u s army | military / national security (0.70) |
| Health care access | Programs and policy | D | health care, healthcare, affordable care act, affordable health care, health insurance, pre-existing conditions | healthcare / health care (0.61) |
| Prescription drug costs | Programs and policy | D | prescription drugs, prescription drug, prescription drug prices | prescription drugs / prescription drug (0.35) |
| Climate and clean energy | Programs and policy | D | climate change, climate, clean energy, renewable energy | climate / climate change (1.00) |
| Energy independence and oil | Programs and policy | R | energy independence, oil and gas | energy independence / oil and gas (0.30) |
| Education and schools | Programs and policy | neutral | education, public schools, higher education, students, school board | education / students (0.90) |
| Rural and agriculture | Programs and policy | R | rural, rural communities, farmers and ranchers | rural / rural communities (1.00) |
| Politicians and establishment (flag) | Opponents and politics | neutral | politicians, elected officials, political | political / politicians (0.66) |
| Republican Party | Opponents and politics | R | republican, republican party | republican / republican party (1.00) |
| Democratic Party | Opponents and politics | D | democratic, democratic party, democrats | democrats / democratic (0.51) |
| Voting and civil rights | Rights and values | D | voting rights, civil rights | civil rights / voting rights (0.41) |
| Common sense bipartisanship (flag) | Opponents and politics | neutral | common sense, across the aisle | common sense / across the aisle (0.25) |
| Special interests and corporate influence | Economy and class | D | special interests, citizens united, wall street | special interests / citizens united (0.34) |
| American identity (flag) | Rights and values | neutral | american, americans, america, nation | american / america (0.81) |
| Foreign policy | Security and immigration | neutral | foreign policy, foreign, middle east | foreign / foreign policy (1.00) |
| Government spending and debt | Economy and class | R | spending, debt, fiscal responsibility | spending / debt (0.58) |

## Flagged for Carson's veto

Five clusters whose lean assignment or coherence is weakest; cleanly removable without disturbing the rest.

- **Small business** (neutral): small business, small businesses, small business owners, business owners. Why flagged: see note below.
- **Cost of living and affordability** (neutral): affordable, cost of living, make ends meet, lower the cost, access to affordable. Why flagged: see note below.
- **Politicians and establishment** (neutral): politicians, elected officials, political. Why flagged: see note below.
- **Common sense bipartisanship** (neutral): common sense, across the aisle. Why flagged: see note below.
- **American identity** (neutral): american, americans, america, nation. Why flagged: see note below.

Reasons by cluster:

- **Small business**: both parties invoke small business owners positively; the lean=neutral call could instead sit under R depending on the final frame.
- **Cost of living and affordability**: affordable attaches to housing (D), health care (D), and groceries (R attack on inflation); a flat lean oversimplifies.
- **Politicians and establishment**: both parties attack politicians, with the overlap at 0.37 (below the 0.5 rule); the cluster is a seeded merge.
- **Common sense bipartisanship**: overlap 0.25; common sense skews R in solo use (common-sense conservative), across the aisle skews D.
- **American identity**: american, americans, america and nation are near-universal filler; may add noise rather than signal.

## Suggested but not merged

| Pair | Overlap | Reason |
| --- | --- | --- |
| human rights / voting rights | 0.27 | Different scopes: human rights is global, voting rights is U.S. ballot access. |
| human rights / civil rights | 0.31 | Human rights (international framing) vs civil rights (U.S. constitutional, 1960s legacy). |
| supreme court / attorney general | 0.25 | A court vs an executive office; co-occur in judicial-nominations contexts, not synonyms. |
| immigration / border | n/a | Immigration splits by lean (reform=D, security=R); the unigram is left as a singleton. |
| american dream / america first | n/a | Opposed cultural frames: American dream (opportunity, D-leaning in use) vs America first (R-coded nationalism). Different lean, no merge. |
| pro-life (right to life) / pro-choice (right to choose) | n/a | Opposed lean. Right to life is left as a singleton pending a dedicated pro-life cluster. |
