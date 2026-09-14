# Source-stat restoration and RNG reconstruction â€” 14 September 2026

The user explicitly approved restoring Piddly's supplied T1â€“T10, FC0â€“FC5 catalogue and reconstructing the RNG conclusions from the first stat-altering study. That range is fixed. The restoration changes 156 attack/health cells by +1 and no values outside that range. No probabilities or RNG algorithms changed. Existing scoped rules retain their prior input boundaries through ten expected-base-stat updates; this is continuity for investigation, not renewed proof.

Historical replay checkpoint: `755bd728167a29e54d247ed3733363e3e1a6be11` (530/541 exact). Restored replay version: `expedition-mk2-lua54-catalogue-20-source-fc0-5`. Installed full-output comparison against the reviewed restoration passed all 541 reports; restored exactness is **324/541**, with 206 previously exact reports now mismatching. All captured observations remain unchanged.

## Reconstruction starting point

The first preserved floor candidate was frozen on 11 September at 19:13:45 UTC after a nine-report Gunpowder study. The first preserved shared implementation of floor defaults is commit `c8016817065c6186505eb56eb963acd11326d76f` on 12 September. These are distinct records; the exact first local edit is not established by tracked history.

An independent packet decode verifies all nine original raw reports and their captured inputs/seeds. Replaying them with the original core plus Lua RNG and with restored Mk2 produces identical RNG event streams on all nine. Both match all nine supplied attacker Gunpowder activation counts; both miss all nine survivor endpoints. First example: recorded seed1789153123 produces26 modeled checks and4 successes, with9095 Marksmen predicted versus9090 captured. The corresponding public cohort is `gunpowder_fc3_reported_seeds` in `testcases/mk2/controlled.json`; shared seeds alone do not establish unique battle identity.

The original artifacts do not independently establish battle timestamps or UI winners. Missing defender skill-count rows are unknown, not recorded zeroes. Full RNG traces are simulator diagnostics, not server traces.

## Existing deterministic controls

Four already captured controls use500 T5 FC1 Infantry against500 T5 non-FC Marksmen, both roles under two distinct modifier contexts. Their raw troop profiles,128 buff fields,32 populated input axes and24 survivor slots were independently checked against decoded packets. No random-skill statistics were recorded. Both modeled paths have zero chance sources, zero RNG calls and zero draws.

| Published case | Captured surviving Marksmen | Restored prediction |
|---|---:|---:|
|mk2-campaign-20260913-032|152|151|
|mk2-campaign-20260913-033|152|151|
|mk2-campaign-20260913-086|114|113|
|mk2-campaign-20260913-087|114|113|

The last two also have independently inspected report screenshots; screenshots for032/033 were not found in the bounded search. Reproducing the unchanged formula with70-digit decimal arithmetic gives the same151/113 results and round counts. Maximum per-attack difference from binary64 is below1.3e-13. Ordinary floating-point error in this calculation does not explain these endpoint discrepancies.

This means reconstructing RNG alone is insufficient to explain all current mismatches under the known skill model. Investigate input interpretation and damage application while keeping source stats fixed. Do not compensate by modifying seeds, stats or probabilities.

## Validation status and next work

All180 standard protected troop profiles are checked across legacy rounding/correction options; the Bear record and caller-supplied protected records remain preserved as well. All301 original reference outcomes and145 native Lua vectors remain passing. The shared suite now has 409 tests: 380 pass and 29 direct captured-outcome regressions remain visible, with zero skips. Six obsolete stat-policy assertions were updated; four tooling tests now use an unchanged still-exact captured control so loader behavior is checked independently. All 90 existing corpus source files remain byte-identical. Strict simulator and dashboard TypeScript checks pass, and all 104 dashboard unit tests pass.

Private count-participation diagnostics compare original ceiling, fractional and floor use of surviving dealers. These are retrospective candidates under unchanged source stats, not established mechanics; no such candidate is active. Any candidate needs independent separating in-game evidence and explicit approval before changing established damage behavior.

All original captures, historical snapshots and mismatches remain preserved. The five later T7 live-Marksman reports are still separate research evidence, not newly claimed active-kernel matches.

## Reproduce the restored corpus

From the repository root:

```sh
node --import ./simulator/node_modules/tsx/dist/loader.mjs research/mk2/replay-source-restoration.ts research/mk2/source-stat-restoration-results-20260914.json
```

The command checks normalized source hashes, executes every enumerated case without altering inputs, reports 324/541 exact and 540/541 correct winners, and deliberately exits 1 for the remaining mismatches. This is a reconstruction checkpoint, not a completed accuracy repair.

The private dealer-count follow-up reproduced all four deterministic controls with floor participation, but all nine original Gunpowder survivor predictions remained unchanged and incorrect. All 13 RNG streams remained identical. A synthetic positive sub-one-troop pair also exposed a possible stall. The candidate is not installed and cannot be generalized from the four retrospective matches.
