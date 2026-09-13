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


## Bands against a mixed Lancer/Marksman opponent

Both planned500 T7 Infantry versus250 T5 Lancer plus250 T5 Marksman fights report225 surviving Infantry. Current behavior matches both actual kernels; the frozen initial-Lancer-presence blanket-defense alternative predicts248 and fails both by23 survivors. All captured raw modifiers remain unchanged from the preceding pure controls. These two cases bring the local campaign to53 fixtures, alongside the original160.

Together with the pure-Lancer and pure-Marksman controls, this supports restricting Bands to incoming Lancer attacks against this specific alternative. It does not independently establish the exact10 coefficient, its damage bucket, every possible depletion rule, or hidden server scheduling. No combat code changed. Both distinct reports and all supplied observations are preserved; missing proc fields remain unknown and the model uses zero RNG calls.


## T9 Infantry profile background

Two new controls use250 T9 non-FC Infantry against250 T5 non-FC Marksmen, once each direction. Both kernels match195 Infantry survivors, zero Marksmen and the winner using the unchanged captured modifiers. All16 raw modifier fields per account and normalized stats match the preceding mixed Bands controls. No explicit chance-skill activation fields were supplied, and the model consumes zero RNG calls.

These reports extend observed compatibility to the T9 Infantry profile in this pair. They do not independently identify its individual stat cells or certify expert mechanics; experts remain present in the raw formations. The local collection now contains55 campaign fixtures plus the original160. No combat implementation changed.


## Ambusher before normal-hit Shield: first direction

Five new fights use500 T7 FC4 Lancers attacking500 T5 FC5 Infantry. Both unchanged actual kernels match all five winners,30 survivor values and15 explicit Ambusher/Lance/Shield counts. The frozen alternative assigning the normal-hit Shield draw before Ambusher matches none. The first chronological diagnostic passed before the four held-out reports were released for confirmation. Reverse-direction collection is still pending at this checkpoint.

Case `mk2-campaign-20260913-056` reports166 Lancer survivors and Ambusher21, Lance14, Shield53. The alternative also predicts166 Lancers and Lance14, but gives Ambusher25 and Shield52. These counts distinguish draw ownership even when final survivors agree. The alternative changes draw allocation only, keeping the existing hit and target application points. This constrains the specified alternative in the tested composition, rather than uniquely exposing all server scheduling.

The Infantry account's captured common defense modifier is five percentage points lower than its earlier background, consistently in all five reports. Replays use those live fields unchanged; the reason for the change is not inferred. All16 fields on the Lancer account are unchanged. Independent trigger joins on both devices produce seed offsets1,1,0,1,1, retaining the unresolved seeding-time limitation.

The collection now has60 new campaign fixtures plus160 original reports, all220 exact for available observations in both kernels. No combat rule or catalogue value changed for these additions.


## T9 Lancer profile: first direction

Five T9 non-FC Lancer attacks against T7 non-FC Infantry,500 troops per side, match both unchanged kernels:211 Lancer survivors each and Ambusher counts24,22,18,23,18. The first chronological diagnostic passed before the remaining four reports were released. All16 modifier fields and normalized stats match the preceding F27 controls. Distinct report identities remain separate despite matching survivor totals.

This extends combined profile compatibility and explicit proc-count checks. Only Infantry targets are present, so it does not independently test a new Ambusher targeting rule. The model makes110 probability calls per fight; underlying xoshiro outputs range177-194 because Lua integer-range rejection can consume more than one output per call. These model traces are not a server-call trace. Reverse confirmation is pending.

## Ambusher/Shield: reverse confirmation

Five reverse fights complete C1. Current draw ownership matches all10 winners,60 survivor values and30 explicit proc counts in both actual kernels. Shield-first matches0/10. The first chronological reverse diagnostic passed before four further reports were released; no seeds, captured modifiers or candidate rules changed. All16 modifiers for each account match the first C1 batch. All five independently joined reverse trigger offsets are+1, which does not remove the previously observed zero offsets.

Reverse case `mk2-campaign-20260913-066` records168 defending Lancers, with Ambusher19, Lance16 and attacking Infantry Shield57. This confirms the tested Ambusher-before-normal-Shield allocation in both orientations against the frozen swap alternative. It does not uniquely identify every internal scheduling operation. No combat code change was needed.

The collection now contains70 campaign fixtures plus160 original reports:230 fights exact for all available observations in both actual kernels. The next mixed Lance/Volley/Gunpowder-versus-Shield experiment remains distinct from the now-completed C1 question.


## T9 Lancer reverse confirmation and casualty evidence

Five reverse T9 Lancer fights also match both unchanged kernels, with211 defending Lancers each and Ambusher counts24,17,25,20,22. Both orientations now supply10 exact winners,60 survivor values and10 explicit activation counts. All16 captured modifier fields per account remain unchanged. The first chronological reverse diagnostic passed before release of the remaining four. No additional targeting or isolated coefficient claim is inferred from this Infantry-only opponent.

The campaign now contains75 new fixtures alongside160 original reports:235 exact captured fights for available observations. The separate optional casualty evidence extends to40 fights and270 explicit category fields after ten C1 reports passed the unchanged projection with both kernels' predicted survivors. C1 hospital corroboration uses contemporaneous operator UI records and a no-healing attestation; archived before/after hospital images were unavailable. Full provenance limits are in `mk2-controlled-casualties.md`.


## T9 Marksman: both directions

Ten new hero-free fights use500 T9 non-FC Marksmen against500 T7 non-FC Infantry, five each direction. Both actual kernels reproduce every winner, all60 survivor fields and all10 explicit Volley activation counts with the captured inputs and recorded seeds unchanged. First-direction Marksman survivors are357,359,357,359,357 with Volley counts7,5,5,6,5; reverse survivors are352,368,360,353,366 with Volley counts4,8,5,3,7. The first chronological report gated the remaining four in each direction.

One account's common defense field10114 changes5331 to4831 between directions, reducing its Infantry defense96.31 to91.31. Other fields and the second account remain unchanged; each batch internally agrees on all16 fields. The cause is unknown. These are exact replays with the actual changed modifiers, not identical-background role swaps. No combat code changed. Experts remain present, and matching this composite profile does not uniquely identify individual stat cells or every internal timing detail.

The passing collection now contains85 campaign fights plus the original160:245 exact planned fights for their available observations. The campaign regression passes all85. The separate optional casualty collection remains40 fights; these new cases do not expand that claim.

## Unresolved mixed Lance / Volley / Gunpowder / Shield diagnostic

The first valid report from500 T5 FC4 Lancers plus500 T7 FC3 Marksmen versus1000 T5 FC5 Infantry does **not** match production. Its unmodified anonymized input, recorded seed and observed output are included separately in[`unresolved_c2_20260913.json`](../testcases/mk2/unresolved_c2_20260913.json), outside the passing campaign collection.

| Measurement | Observed | Current kernel | Private extended-Gunpowder hypothesis |
|---|---:|---:|---:|
| Lancer survivors |42|40|43|
| Marksman survivors |500|500|500|
| Infantry survivors |0|0|0|
| Lance activations |6|4|5|
| Volley activations |5|5|6|
| Gunpowder activations |11|14|12|
| Shield activations |55|50|47|

Both hypotheses fail. All captured modifiers match the preceding FC account controls. Four additional planned reports remain unused for confirmation while this first diagnostic is investigated. No speculative ordering change has been promoted. The245 passing reports do not mean every captured fight matches.

This collection also had one operator setup error: an80100-troop attacker was dispatched instead of the planned1000. That report was preserved privately and quarantined by army composition before model comparison, then replaced with a correctly configured fight. It is neither a passing test nor the unresolved diagnostic above. Final-army inspection and Deploy now use separate calls with archived screenshots.


To reproduce the unresolved report from the repository root:

```sh
node --import ./simulator/node_modules/tsx/dist/loader.mjs scripts/run_testcases.ts --testcase-root testcases/mk2 --matching unresolved_c2_20260913 --workers 1 --human
```

This command was checked through the normal loader: one report, zero processing errors, one unsupported-timing warning, and an expected mismatch with exit status1. It preserves the captured input and recorded seed. Running the entire Mk2 testcase directory also includes this known unresolved report; the passing campaign regression intentionally targets its named collection.

Two further private candidates reserved live Volley's draw before an actual Lance-extra Shield check, delivering its cached result at the unchanged Marksman slot, with either reference or extended Gunpowder timing. Both fail this diagnostic:47 and41 Lancer survivors respectively, with activation-count mismatches. Their scope/parity checks preserve the original160, ten Ambusher/Volley and ten Ambusher/Shield controls. This rules out these particular candidates on the diagnostic; it supplies no production fix and the four confirmation reports remain unused.


## Unresolved T10 FC3 Marksman catalogue cohort

Five new reports use2000 T10 FC3 Marksmen attacking4000 T5 FC5 Infantry. They are included unchanged in[`unresolved_d1_20260913.json`](../testcases/mk2/unresolved_d1_20260913.json), outside the passing campaign collection. All16 modifiers for both accounts agree with the preceding controls; all15 chance-skill counts were checked directly against encoded report fields. Heroes and extra battle effects are absent; existing experts remain unchanged.

| Frozen T10 FC3 Marksman variant | Attack | Health | Exact reports, including procs |
|---|---:|---:|---:|
| Current |2164|405|0/5|
| Original attack only |2165|405|0/5|
| Original health only |2164|406|3/5|
| Both original |2165|406|4/5|

The first chronological diagnostic matched both health406 variants before the four confirmation reports were released. The combined original values reproduce all five survivor outcomes, but the third report has38 Shield activations while every frozen variant produces37. Volley11 and Gunpowder15 agree. The38 is explicitly encoded in the report, not inferred from a missing field. Because no variant matches the complete cohort, no new catalogue correction has been applied and the reverse repeat was not dispatched.

Under the combined-original diagnostic, that third fight ends with a successful Volley whose normal shot exhausts the remaining Infantry; the model suppresses the extra shot and its Shield check. This is a candidate boundary to investigate against prior reports, not proof that the game rolls Shield there.

The ordinary CLI was checked on all five records with `--matching unresolved_d1_20260913` using the command above: zero processing errors/warnings and five expected current-kernel mismatches. The245 passing planned fights remain unchanged. Together with C2, the shared evidence now also exposes six unresolved reports. Survivor-only agreement is not counted as a complete match.


## Second FC2 account-pair background

Two new controls use500 T5 FC1 Infantry versus500 T5 non-FC Marksmen, one each direction, on the second account pair. Both actual kernels reproduce114 Marksman survivors, zero Infantry and the winner. The complete16 captured modifier fields for each account agree across roles and were used unchanged. Both kernels consume zero RNG calls; absent activation fields remain unknown. This establishes a new account background for future catalogue tests, not a second independent proof of each troop mechanic.

The passing collection now contains87 campaign reports plus the original160:247 planned fights exact for their available observations. The separate unresolved collections retain one C2 and five D1 reports; they are not counted as passes. No combat implementation changed at this checkpoint.


## T10 FC1 Infantry: original attack and health restored

Two new controls use 500 T10 FC1 Infantry versus 2,000 T5 non-FC Marksmen, one each direction, on the second FC2 account pair. Before collection, the four alternatives below were fixed and this army size was chosen because it separates every alternative without a modeled RNG draw. The first chronological report uniquely supported both original values before the reverse report was released for confirmation. All 16 captured modifier fields for each account match the preceding FC2 background controls.

| T10 FC1 Infantry alternative | Attack | Health | Predicted surviving Marksmen, each direction | Exact reports |
|---|---:|---:|---:|---:|
| Previous Mk2 flooring | 490 | 1472 | 1110 | 0/2 |
| Original attack only | 491 | 1472 | 1108 | 0/2 |
| Original health only | 490 | 1473 | 1109 | 0/2 |
| Both original values | 491 | 1473 | 1107 | 2/2 |

Both reports observe 1107 Marksmen and zero Infantry. The validated catalogue now restores only this profile's attack491 and health1473 in both kernels. `catalogueCorrections: "none"` retains490/1472. These are original catalogue values, not fitted replacements. This evidence distinguishes the four tested alternatives in this context; it does not prove every term of the damage formula or authorize a blanket rounding change.

The replay version is `expedition-mk2-lua54-catalogue-11`. Together with the earlier T10 FC4 Lancer attack and T10 FC5 Infantry attack corrections, four stat cells across three profiles are restored. No Marksman stat or terminal Volley/Shield hypothesis is promoted.

The passing collection now contains89 campaign reports plus the original160:249 reports exact for all available observations in both actual kernels. The full simulator suite passes303 tests, including all301 legacy reference outcomes and45,440 native Lua RNG values; its TypeScript check passes. The research catalogue suite passes6 tests, and a fresh research replay checks all249 reports with zero errors. The two new anonymized fixtures preserve every battle input, observed field and recorded seed. Six previously shared unresolved reports remain separate. The optional casualty evidence remains40 fights; dashboard checks were not rerun for this catalogue-only change.


## Unresolved mixed skills without Shield

The first report from500 T5 FC4 Lancers plus500 T7 FC3 Marksmen versus1000 T5 FC1 Infantry is now included in[`unresolved_e1_20260913.json`](../testcases/mk2/unresolved_e1_20260913.json). Both current kernels reproduce436 Lancer and500 Marksman survivors, with zero Infantry. However, the report explicitly records Lance4, Volley3 and Gunpowder1; current replay predicts3,4 and1. Direct encoded-field checks confirm the counts, and all16 captured modifiers per actor and their experts match their respective preceding controls. No heroes or extra battle effects are present.

This isolates an ordering discrepancy without Crystal Shield. The swapped counts do not by themselves establish a replacement ordering. Four further reports remain unused for confirmation; no new candidate or production change is inferred from survivor agreement. The normal CLI reproduces the mismatch with zero processing errors and one existing unsupported mixed-context timing warning. Use the earlier command with `--matching unresolved_e1_20260913`.

There are now seven shared unresolved reports, separate from249 passing reports. The unresolved collections are intended to expose known failures for review, so a run over the entire Mk2 directory will report their expected mismatches.


## Terminal Volley and Shield: fresh independent confirmation

Ten fresh battles use 500 T7 FC3 Marksmen versus 500 T5 FC5 Infantry, five each direction. The terminal-Shield candidate was frozen before these captures; the first chronological report in each direction gated four further confirmations. All ten match the winner, six survivors, and all 30 explicitly encoded Volley/Gunpowder/Shield counts. The previous kernel matches 9/10. All 16 player modifiers and expert metadata were unchanged by actor across directions.

Case `mk2-campaign-20260913-093` distinguishes the rule: both versions leave 306 Marksmen, with 10 Volley and 8 Gunpowder activations, but the game records 24 Shield activations while the old kernel gives 23. In round 57, the normal shot exhausts the Infantry and the generated Volley damage is canceled. The new hook performs the reactive Shield check before that cancellation, without scheduling or applying the canceled damage. Two reverse cases reach an eligible boundary but do not change observed totals; they are confirmations, not additional discriminating witnesses.

The production option `terminalVolleyShield: "roll"` is now the default in replay version `expedition-mk2-lua54-terminal-shield-12`; `"skip"` preserves the prior comparison. The rule is guarded to pure, hero-free single-profile Marksmen/Infantry with canonical Volley 10%/100%, Gunpowder 20%/50%, Shield 37.5%/36%, side-local scheduling and per-hit protection. It is not extended to mixed armies, heroes, non-Volley extra attacks, pending/snapshotted damage, or altered skill definitions. Damage equations, catalogue cells, probabilities, player modifiers and recorded seeds are unchanged. The D1 T10 Marksman coefficients and E1 mixed-source ordering remain separate unresolved production questions.

Both actual kernels match all ten new reports. All 249 previous passing reports still match in the research replay, and the shared complete suite passes 311 tests, including 259 captured cases, 301 unchanged legacy reference outcomes, 45,440 native Lua values, and eight new boundary/scope tests. The shared TypeScript check passes. Scope tests verify implementation exclusions; they are not new in-game evidence for heroes or pending damage. The five generic source files remain reversibly traceable to their original baseline hashes.

The collection now contains 99 campaign reports plus 160 original reports: 259 passing reports. Seven shared unresolved reports stay separate. Anonymized fixtures 090-099 preserve the actual predictive inputs, observed fields and recorded seeds. Raw packets and identifying capture metadata remain private. Independent timestamp-to-seed derivation and skill-credited wound attribution remain unresolved.


## T10 FC1 Lancer and T10 FC3 Marksman: original catalogue values restored

Version `expedition-mk2-lua54-catalogue-13` restores four additional cells after independent confirmation in both directions. These values come from the original catalogue, not fitted replacements. Mk2's floor conversion had lowered each by one; the tested correction is limited to these two profiles.

| Profile | Previous Mk2 attack / health | Restored attack / health | Fresh confirming pair |
|---|---:|---:|---|
| T10 FC1 Lancer | 1472 / 490 | 1473 / 491 | 500 Lancers versus 1,050 T5 FC1 Infantry |
| T10 FC3 Marksman | 2164 / 405 | 2165 / 406 | 500 Marksmen versus 1,500 T5 FC5 Infantry |

The earlier G1 Lancer pair used 1,000 Infantry. Its ten reports distinguish health 491 from 490, but leave attack 1472/1473 tied. The subsequent G2 pair's ten reports, five each direction, match only attack 1473/health 491 among four alternatives fixed before collection. Each other combination fails all ten. All ten observe 152 Lancers; their explicitly encoded Ambusher counts also match. G1 and G2 are included as 20 separate reports, rather than discarding identical survivor outcomes.

The D2 Marksman pair likewise supplies ten new reports, five each direction. Both original values match 10/10; previous values and attack-only restoration each match 0/10, while health-only restoration matches 3/10. The first chronological report in each direction gated release of the remaining four. All 30 explicitly encoded Volley/Gunpowder/Shield counts were checked directly, and all 16 player modifier fields and expert metadata were unchanged by actor across directions.

These corrections also resolve the five previously shared D1 development reports under the independently confirmed terminal Volley/Shield rule. They remain unchanged in [`unresolved_d1_20260913.json`](../testcases/mk2/unresolved_d1_20260913.json), retaining their original IDs and historical filename; current replay now passes all five. They are counted once and are not copied into the campaign collection. Their earlier mismatches remain documented above; they are not reclassified as fresh confirmation. The normal testcase CLI verifies five passes with zero processing errors or warnings.

New anonymized campaign fixtures 100-129 contain G1, G2 and D2, ten each. The passing evidence now comprises 160 original reports, 129 campaign reports and the five existing D1 reports: **294 reports**, representing290 distinct predictive requests. The separately published C2 and E1 reports remain unresolved, for 296 published report records overall. Four C2 confirmation reports remain unused. No mixed-source ordering hypothesis is included in this correction.

Both actual kernels reproduce all 294 eligible reports, including 1,764 survivor checks and 505 explicitly supplied chance-skill counts. The previous 259 complete battle outputs, RNG traces and warnings match their archived pre-port hashes. All 30 new reports and five existing D1 reports have complete battle/RNG parity between the actual research and shared kernels. The full simulator suite passes 313 tests, including 301 legacy reference outcomes and 45,440 native Lua values; six research catalogue tests and the shared TypeScript check pass. Fixture integrity checks preserve each captured input, observation and seed and exclude private capture/account identifiers.

The validated policy now restores eight cells across five profiles. `catalogueCorrections: "none"` retains the earlier floor policy for comparison. Other catalogue cells, probabilities, damage equations and generic engine hooks are unchanged; their existing baseline provenance remains intact. The older T7 evidence still rejects a blanket restoration of the original table. No new claim is made about independently deriving seeds from timestamps, skill-credited wounds, heroes, untested FC skill levels or T12.
