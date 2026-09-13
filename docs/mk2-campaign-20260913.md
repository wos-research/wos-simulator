# Controlled testing campaign — September 13, 2026

The first automated workflow control is one independent battle, with attacker and defender report copies preserved locally. It uses 500 T5 FC3 Marksmen against 1,000 T5 FC1 Infantry, without heroes. The integrated kernel reproduces attacker victory, 352 surviving Marksmen, zero surviving Infantry, and nine Crystal Gunpowder activations using the recorded seed.

The separately identified campaign fixtures are in `testcases/mk2/campaign_20260913.json`; `simulator/src/mk2/campaign.test.ts` checks each winner, all six survivor values and all explicitly observed chance-skill activation counts. Captured troop counts and player modifiers are unchanged. No combat rule or coefficient was changed to match this control. The original 160-fixture collection is preserved.

Both devices independently recorded the matched battle-trigger time 1789275360; the report seed is 1789275361. This supports trigger plus one for this fight. It does not establish the general time-to-seed rule, since earlier captures had both zero and one offsets. The replay itself remains labeled as recorded-seed diagnostic.

Two report copies do not count as two fights. Raw packets, mail identities and timestamp joins remain in the local evidence archive; the shared testcase contains no account identities or device details. Casualty categories and skill-credited wounded are retained in the local report but are not certified by these survivor/proc checks. Additional campaign experiments enter this collection only after captured results are validated.

## Ambusher and Crystal Lance: first direction

Five additional independent battles use 500 T7 FC4 Lancers attacking 500 T5 FC1 Infantry plus 500 T5 non-FC Marksmen. All five reproduce the winner, all 30 survivor values, and all ten reported Ambusher/Crystal Lance activation counts in both the research and integrated kernels. These join the control as six new campaign fixtures; no combat rule, coefficient, seed, or player modifier was fitted or changed.

A separately frozen diagnostic candidate that reverses Ambusher/Crystal Lance draw ownership fails all five, with an activation-count mismatch in each. This supports Ambusher receiving its draw first for these battles. It does not identify every internal server timing detail. Neither joint agreement nor these tests independently determine T7 FC4 base statistics.

The current model traces never reach a phase with enemy Marksmen dead while enemy Infantry and own Lancers remain alive. The reverse-direction tests below subsequently supplied that condition.

For these five Ambusher/Lance fights, independent mail/trigger joins corroborated on both devices give recorded-seed minus trigger offsets of **1, 0, 0, 0, 1**. No seed was used to choose the matching event. A universal `trigger + 1` rule is therefore contradicted by these captures; the actual RNG seeding time remains unresolved.

A subsequent comparison used the previously frozen S1 alternative: replace only T7 FC4 Lancer attack/health 1037/345 with the original nearest-rounded 1038/346, keeping all other inputs unchanged. S1 gives exactly one extra surviving Lancer in each of the five fights (0/5 exact), while activation counts remain unchanged. This rules out that paired substitution within the current model for these captures. It does not independently identify attack and health, prove a universal flooring rule, or settle the separate T10 discrepancy. No coefficient changed in production.

## Reverse direction and depletion

Five mixed-army attacks complete ten independent Ambusher/Lance battles. Both kernels reproduce all ten winners, all 60 survivor counts, and all 20 explicitly observed Ambusher/Lance activation counts. The Ambusher/Lance subset plus the initial control comprises eleven new fights; the original 160 remain unchanged.

Three reverse traces reach enemy Marksman depletion while Infantry and Lancers still survive. The frozen alternative that skips Ambusher once Marksmen disappear fails two reverse fights, including activation-count differences; one predicts 321 surviving Lancers and 9/7 Ambusher/Lance activations instead of the observed 319 and 15/5. Current continuous draw consumption matches all ten. The planned lower-Marksman repeat was therefore skipped for this question.

The alternative making Lance choose the default frontline fails six of the ten fights, supporting reuse of Ambusher's selected target against that specific alternative. Reversing Ambusher/Lance draw ownership fails all ten. The paired T7 original-nearest substitution also fails all ten. These are scoped comparisons with fixed captured inputs, not proof of every internal implementation or each coefficient separately.

Reverse independent trigger offsets are 0, 1, 1, 0, 0, again corroborated on both devices. Neither these joins nor recorded-seed replay establish a universal timestamp-derived seed rule.

No combat rule was changed for these eleven fixtures. The separate T10 FC4 Lancer coefficient experiment is described below.

The separately frozen additional-Ambusher-roll-on-Lance-extra candidate also fails all ten Ambusher/Lance fights (nine include proc-count differences). That rules out this specific extra-hit reroll/retarget behavior. Terminal spill to another troop type remains unresolved: none of these ten fights has a successful Lance proc when its normal hit exhausts the target while another target remains alive. No extra repeat was requested solely for a condition the existing pair rarely reaches.

## T10 FC4 Lancer attack correction

At the Lancer correction checkpoint, the campaign included **21 new independent fights**, alongside the unchanged original 160. All 181 reproduced the winner, six survivor counts, and every explicitly observed chance-skill activation count with their recorded seeds.

Ten new fights use 1,000 T10 FC4 Lancers against 500 T5 FC1 Infantry, five in each direction. The former Mk2 floor profile matched eight; restoring the original catalogue attack value **1705 instead of 1704** matches all ten. One fight in each direction reports 991 surviving Lancers where the former profile predicts 990. Both alternatives already match their skill counts. The other eight are non-discriminating and are preserved.

The alternative was frozen before collection. After the first direction supplied a separating case, the unchanged candidate passed the sealed reverse-direction reports. Both actual kernels then passed all ten after the port. No seed, captured troop count, player modifier, health value, or other troop profile was adjusted.

`catalogueCorrections: "validated"` became the Mk2 default at that checkpoint, restoring the original T10 FC4 Lancer attack cell after the existing FC rounding step. `catalogueCorrections: "none"` retains the former profile for comparison. That checkpoint used replay version `expedition-mk2-lua54-catalogue-9`; the Infantry extension below advances it. The standalone legacy engine remains unchanged.

This is evidence for the specific correction within the tested model, not a general nearest-rounding rule or proof of every damage equation. T7 FC4 attack/health remain unchanged. FC5 Lancer health 596/597 is outside these characters' available troop-building levels. The separate T10 FC5 Infantry attack 596/597 experiment is described below.

Validation after the port: all 271 simulator tests and 104 dashboard tests pass; simulator typecheck passes. The simulator suite includes the original 160 controlled reports, all301 legacy reference cases, native Lua vectors, all21 new campaign fights, and the reversible two-case T10 discrepancy check. Raw captures, frozen alternative results, independent identities and private source hashes remain archived locally.


## T10 FC5 Infantry attack correction

The current collection contains **31 new independent campaign fights plus the original 160**, all 191 matching both kernels for winner, six survivor counts and every explicitly observed chance-skill activation count with recorded seeds.

Ten new battles use 500 T10 FC5 Infantry against 2,500 T5 non-FC Marksmen, five each direction. The candidate, frozen before collection, restores only the original Infantry attack **597 instead of596** while keeping health 1790. The previous profile matches 7/10; the unchanged candidate matches 10/10. Three first-direction reports distinguish the profiles. All five reverse reports match both and are preserved as nondiscriminating confirmations, not additional separating witnesses.

One first-direction report is especially useful: both profiles predict 354 surviving Infantry, but the previous profile produces 31 Shield activations instead of the observed 30. Its modeled battle lasts 80 rounds instead of 79, adding a successful Shield check. Correcting the attack value removes this discrepancy without altering the RNG algorithm, seed or ordering. Two other reports differ by one surviving Infantry. Survivor equality alone would have missed the first error.

Both actual kernels now restore exactly two original attack cells under `catalogueCorrections: "validated"`: T10 FC4 Lancer 1705 and T10 FC5 Infantry 597. Health, other axes, all other profiles and captured account modifiers remain unchanged. Explicit `catalogueCorrections: "none"` preserves the former floor comparison. Replay metadata now records version `expedition-mk2-lua54-catalogue-10`. Tests verify the complete two-cell difference and preserve the old survivor/proc failures.

This supports these specific original catalogue values within the tested model. It does not establish a universal rounding rule, independent identification of every coefficient, or per-skill casualty attribution. The live Infantry descriptions also identify Master Brawler as 10% attack damage against Lancers and Bands of Steel as 10% defense against Lancers. The present Infantry/Marksman pair has no Lancers and does not test Bands' implementation or its damage bucket.

Across these ten Infantry fights, independent trigger joins corroborated on both devices give seven seed-minus-trigger offsets of +1 and three of 0. No seed was used to choose the joins. Recorded-seed replay remains distinct from independent timestamp-derived prediction.

After the Infantry port and additional casualty fixtures, all **292 simulator tests**, **104 dashboard tests**, and the simulator TypeScript check pass. The campaign now also has 30 confirmed-context casualty fixtures covering 210 explicitly encoded category values; this separate optional projection does not certify per-skill credit.


## FC2 background for same-side Ambusher/Volley testing

Two further independent controls use 500 T5 FC1 Infantry versus 500 T5 non-FC Marksmen, once each direction. Both actual kernels reproduce the winner, 152 surviving Marksmen and zero Infantry without changes. The model has zero chance sources and RNG calls. No explicit random-skill proc observations were available, so these controls make no proc-count claim.

The collection now contains **33 new campaign fights plus the original 160**, with exact checks restricted to each report's available observations. These controls also supply complete raw account modifiers for all three troop types, corroborated across reversed roles. Lancer modifiers came from the recorded per-type and common buff fields; they were not inferred from Infantry or copied from another account.

A prospective screen uses those captured modifiers for 500 T7 FC1 Lancers against 500 T7 FC1 Lancers plus 50 T7 non-FC Marksmen. Its frozen alternatives place the mixed side's dead-source Volley check before or after its own Ambusher. In a fixed arbitrary 20-seed panel, observable proc totals differ in 13/20 mixed-attacking and 15/20 mixed-defending runs; survivors tie in all 40. These are planning results, not live validation of either placement. They justify the next batch and the need to retain both sides' Ambusher counts and the mixed side's Volley count.


## Same-side Ambusher and Volley after Marksman depletion: first direction

Five new fights use 500 T7 FC1 Lancers attacking 500 T7 FC1 Lancers plus 50 T7 non-FC Marksmen. Current behavior reproduces every winner, all 30 survivor values and all 15 explicitly observed Ambusher/Volley activation counts in both kernels. The campaign now contains 38 new fights, alongside the original 160.

Four fights distinguish the frozen alternatives even though their survivor predictions agree. Keeping the dead-source Volley draw after the same side's Lancer Ambusher check matches all five. Moving that draw to the start of the side's turn matches only one, as does skipping it. The one nondiscriminating fight retains four Marksmen and never reaches the disputed phase.

For example, case `mk2-campaign-20260913-034` reports attacker Ambusher 5, defender Ambusher 8 and defender Volley 2. Moving dead Volley before the defender's Ambusher predicts 5, 6 and 5, respectively, while leaving 222 defending Lancers alive under both placements. This demonstrates why survivor equality alone is insufficient. The current implementation remains unchanged.

This constrains the tested pure/mixed Lancer composition and the specifically frozen timing alternatives; it does not uniquely reveal every internal server scheduling operation. Reverse-direction confirmation is pending at this checkpoint. Independent trigger offsets for the five fights are 0, 1, 0, 1, 1, preserving the distinction between recorded-seed replay and independent time-derived prediction.


## Same-side Ambusher/Volley: reverse confirmation

Five reverse fights complete ten independent B1 cases. Both actual kernels match all ten winners, all 60 survivor values and all 30 explicitly observed activation counts. The frozen side-start and skip alternatives each match only three cases. Those three retain Marksmen; all seven fights that reach Marksman depletion reject both alternatives through proc totals. Survivor predictions agree across all models in all ten fights.

In reverse case `mk2-campaign-20260913-040`, the mixed attacker reports Ambusher 12 and Volley 4, with defender Ambusher 9. Moving dead Volley before its own Ambusher predicts 11, 7 and 9, while both placements predict 175 surviving attacking Lancers. The first chronological reverse diagnostic was nondiscriminating and was preserved; the later separating cases were not selected by seed or outcome.

The current ordering remains unchanged. Support is limited to the tested pure/mixed Lancer composition and the defined alternatives. The reverse trigger offsets are 0, 1, 1, 1, 0; independently deriving the seeding time remains unresolved.

## F27 non-FC background controls

Two additional fights use 500 T5 non-FC Infantry against 500 T5 non-FC Lancers, one each direction on the new account pair. Both actual kernels reproduce 179 surviving Infantry and zero Lancers using unchanged captured modifiers. The model consumes zero RNG calls; the reports contain no explicit chance-skill activation observations, so none are manufactured.

Complete per-type and common buff fields are recorded and corroborated across both directions. Raw reports include experts in the formations. These checks do not imply expert-free armies or independently establish expert mechanics; they validate the available outcomes with the supplied modifiers and current model. Both reports were opened on the same participant, but their independent mail identities and battle times establish two distinct fights.

The collection now contains **45 new campaign fights plus the original 160**, all 205 exact for their available observations. The campaign regression passes all 45 records. No combat code changed for the ten B1 cases or these two F27 controls; the last full suite remains 292 simulator tests and 104 dashboard tests at the preceding catalogue-correction checkpoint.

The prospective next step uses 500 T7 non-FC Infantry against 500 T5 non-FC Marksmen to check the new Infantry profile without Lancers. Only after that background passes will the same Infantry face 500 T5 non-FC Lancers to test Bands of Steel. With the currently captured modifiers, the frozen model and Bands-absent alternative predict 367 versus 353 surviving Infantry in the latter pair. These are planning predictions, not new game evidence or proof of the exact defense bucket.


## T7 Infantry background and Bands of Steel

The two planned T7 non-FC Infantry versus T5 non-FC Marksman controls both reproduce268 surviving Infantry and zero Marksmen in both actual kernels. Subsequent T7 Infantry versus T5 non-FC Lancer reports both reproduce367 Infantry and zero Lancers. Every march starts with500 troops per side. All captured per-type and common modifiers remain unchanged across these controls, despite an intervening alliance notification. Raw reports remain authoritative.

The previously frozen Bands-absent alternative predicts353 surviving Infantry in each pure-Lancer fight, fourteen below the observed367. Combined with the no-Lancer T7 background and lower-tier Infantry/Lancer controls, this supports the existing Bands effect in this tested context. It does not independently identify its exact10 coefficient, defense bucket, or mixed-opponent eligibility. Both actual kernels are unchanged. These four reports supply no explicit chance-skill activation counts; the model uses zero RNG calls.

The next prospective mixed-opponent comparison uses500 T7 Infantry versus250 T5 Lancers plus250 T5 Marksmen. The existing per-incoming-Lancer restriction predicts225 surviving Infantry; a frozen diagnostic alternative applying the same defense bonus to all attacks whenever enemy Lancers started present predicts248. The pure controls cannot distinguish those definitions. Those are planning predictions only; no mixed result is claimed at this checkpoint.

## Current FC5 account background before Ambusher/Shield

Two additional hero-free controls use500 T5 FC4 Lancers versus500 T5 FC5 Infantry, one each direction on the FC5 account pair. Both actual kernels match:261 and253 surviving Infantry, zero Lancers, and every explicitly recorded Lance/Shield proc count. Current complete modifiers are corroborated across both roles. This establishes the account background before adding T7 Ambusher; it does not count as a new independent proof of each previously tested Lance/Shield mechanic.

The current collection contains **51 new campaign fights plus the original160**, all211 exact for their available observations. All51 campaign fixtures pass the replay regression. The last full simulator/dashboard suites remain292/104 at the catalogue-correction checkpoint; subsequent additions change evidence and documentation only.
