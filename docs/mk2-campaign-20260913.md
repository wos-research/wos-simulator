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

Validation after the port: all 271 simulator tests and 104 dashboard tests pass; simulator typecheck passes. The simulator suite includes the original160 controlled reports, all301 legacy reference cases, native Lua vectors, all21 new campaign fights, and the reversible two-case T10 discrepancy check. Raw captures, frozen alternative results, independent identities and private source hashes remain archived locally.


## T10 FC5 Infantry attack correction

The current collection contains **31 new independent campaign fights plus the original 160**, all 191 matching both kernels for winner, six survivor counts and every explicitly observed chance-skill activation count with recorded seeds.

Ten new battles use 500 T10 FC5 Infantry against 2,500 T5 non-FC Marksmen, five each direction. The candidate, frozen before collection, restores only the original Infantry attack **597 instead of596** while keeping health 1790. The previous profile matches 7/10; the unchanged candidate matches 10/10. Three first-direction reports distinguish the profiles. All five reverse reports match both and are preserved as nondiscriminating confirmations, not additional separating witnesses.

One first-direction report is especially useful: both profiles predict 354 surviving Infantry, but the previous profile produces 31 Shield activations instead of the observed 30. Its modeled battle lasts 80 rounds instead of 79, adding a successful Shield check. Correcting the attack value removes this discrepancy without altering the RNG algorithm, seed or ordering. Two other reports differ by one surviving Infantry. Survivor equality alone would have missed the first error.

Both actual kernels now restore exactly two original attack cells under `catalogueCorrections: "validated"`: T10 FC4 Lancer 1705 and T10 FC5 Infantry 597. Health, other axes, all other profiles and captured account modifiers remain unchanged. Explicit `catalogueCorrections: "none"` preserves the former floor comparison. Replay metadata now records version `expedition-mk2-lua54-catalogue-10`. Tests verify the complete two-cell difference and preserve the old survivor/proc failures.

This supports these specific original catalogue values within the tested model. It does not establish a universal rounding rule, independent identification of every coefficient, or per-skill casualty attribution. The live Infantry descriptions also identify Master Brawler as 10% attack damage against Lancers and Bands of Steel as 10% defense against Lancers. The present Infantry/Marksman pair has no Lancers and does not test Bands' implementation or its damage bucket.

Across these ten Infantry fights, independent trigger joins corroborated on both devices give seven seed-minus-trigger offsets of +1 and three of 0. No seed was used to choose the joins. Recorded-seed replay remains distinct from independent timestamp-derived prediction.

After the Infantry port and additional casualty fixtures, all **292 simulator tests**, **104 dashboard tests**, and the simulator TypeScript check pass. The campaign now also has 30 confirmed-context casualty fixtures covering 210 explicitly encoded category values; this separate optional projection does not certify per-skill credit.
