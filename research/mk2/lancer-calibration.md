# FC10 T12 lancer calibration — 2026-09-12

**Follow-up:** [21 additional lower-tier reports](lancer-followup.md) expose limits of this six-report calibration. Neither the provisional coefficients nor the +20% retry reproduce the broader cohort exactly. The original six remain calibration cases, not independent validation.

The main Mk2 simulator reproduces all six supplied report outcomes exactly with one common RNG schedule and one common, **provisional** T12 stat pair. This is a fit to six calibration reports, not independent validation of the true server mechanics or troop stats. There are only two distinct troop-count profiles and no recorded skill activation counts in the exports.

## Results and seed

The user confirmed `seed = timestamp + 1`. Every run keeps that seed unchanged. There are no per-report offsets, branches on testcase IDs, or reads of expected outcomes in combat execution. The reports contain timestamps but no separately recorded seeds, so execution metadata correctly remains `timestampStatus: "unverified"`; it does not manufacture seed evidence from the timestamp. Curated fixtures mark the timestamp source as `report-inbox`.

All defenders start with 1,000 T10 FC9 lancers. Both sides are hero-free and have the same bonuses across all six reports. All six battles end with an attacker win and zero defender survivors. Infantry and marksman survivors are zero on both sides.

| Case | Timestamp | Seed | Starting T12 lancers | Report survivors | Candidate timing, +20% stats | Candidate timing, fitted stats |
|---|---:|---:|---:|---:|---:|---:|
| 000001 | 1789240021 | 1789240022 | 1000 | 992 | 992 | 992 |
| 000002 | 1789240014 | 1789240015 | 1000 | 991 | 991 | 991 |
| 000003 | 1789239988 | 1789239989 | 200 | 180 | 180 | 180 |
| 000005 | 1789239891 | 1789239892 | 1000 | 992 | 993 | 992 |
| 000006 | 1789239885 | 1789239886 | 1000 | 991 | 991 | 991 |
| 000007 | 1789239872 | 1789239873 | 1000 | 990 | 990 | 990 |

Exactness means integer equality, with no comparison tolerance. These are deterministic replays, so five repeat requests still execute one historical seed. The original inbox files are unchanged; [the curated fixture](fixtures/lancer-fc10.json) removes army names and retains input stats, timestamps, troop counts and observed totals.

## Candidate RNG mechanics

Incandescent Field is a third chance skill in these fights, alongside Ambusher and Crystal Lance. Ignoring its draws prevents alignment. The fitted procedural schedule is:

1. At round start, roll attacker Ambusher, then defender Ambusher, even though neither army has marksmen. Both use 20%.
2. For the attacker normal hit, roll the defender's Incandescent Field (10%), then the attacker's Crystal Lance (15%). Resolve the hit.
3. If Lance produces an actual extra hit, roll the defender's Field again before resolving it. The extra hit does not roll Lance or Ambusher again. An extra hit skipped because its target is exhausted consumes no Field roll.
4. Repeat for the defender's normal attack: attacker's Field (15%), defender's Lance (15%), then a fresh Field check for an actual Lance extra hit.

Field grants 100% active defense for one incoming hit, halving that hit's damage in the current damage equations. Crystal Lance supplies a separate 100% skill hit. Lua 5.4 `math.random(0, 9999)` projection, including rejection draws, is unchanged; each chance passes when `roll < probability * 100`.

For case 000001, the first six chance calls are Ambusher A: 8225, Ambusher D: 2939, Field D: 9459, Lance A: 2328, Field A: 5043, Lance D: 6136. These consume eight raw draws because the integer projection rejects two values. Full **predicted**, not observed, activation counts and RNG traces are in [the fit artifact](reports/lancer-calibration-fit.json).

Local game Lua descriptions corroborate the three skill purposes and FC8/FC10 Field chances; they do not establish the server's RNG call order. Earlier controls tested Ambusher and Lance separately and did not include Field. The combined ordering above is an inference from outcomes and remains a candidate until independent reports discriminate alternatives.

## What the troop-stat search establishes

| Stat model | Attack | Defense | Lethality | Health | Exact reports |
|---|---:|---:|---:|---:|---:|
| Existing T11 FC10 baseline | 2591 | 10 | 10 | 864 | — |
| T11 +20%, rounded attack/health | 3109 | 10 | 10 | 1037 | 5/6 |
| Representative fitted T12 FC10 | 3215 | 10 | 10 | 1008 | 6/6 |
| Another equally exact pair | 3220 | 10 | 10 | 1007 | 6/6 |

Only attack and health vary. Defense and lethality remain 10. The chosen pair is about +24.08% attack and +16.67% health relative to the existing T11 coefficients. It is **not** a claim that the real game uses those upgrades.

The independent scan tests attack 2970–3300 in steps of 5 and health 975–1100 in steps of 1: **62 of 8,442 pairs match all six reports**. The selected pair minimizes squared relative distance from the rounded +20% prior among those tested exact pairs. This is a documented selection rule, not an uncertainty interval or unique recovery. A common attack/health multiplier from 1.1 to 1.3, in steps of 0.0001, has no exact fit under this candidate schedule. That finding does not by itself disprove the 20% hypothesis: an incorrect damage model or RNG ordering could also account for the residual.

The reproduction script also calls the original author's unchanged `scripts/fit_enemy_base_stats.ts` search. That fitter derives lancer attack as `3 * health`; its original CLI ingests labyrinth PNGs and averages ordinary simulations. Here its `scoreCandidate` callback instead uses the parsed lancer reports and their fixed timestamp seeds. With health 950–1150 in steps of 0.1 and MAE as the objective, its best candidate is attack 3072 / health 1024: five exact reports and one survivor of error in case 000005. There is no rounding of candidate coefficients in that constrained run. The original fitter itself is unchanged.

Six largely one-sided reports cannot justify the author's stated confidence from 10–20 informative reports. No held-out validation set is present.

## Implementation scope and compatibility

- `simulator/src/mk2/lancer_duel.ts` contains the guarded schedule and provisional T12 FC10 lancer record. It supports hero-free single-stack lancer duels with Charge, Ambusher 20%, Lance 15% and Field 10%/15%, with the expected effect shapes. Heroes, passive bonuses, mixed stacks, additional skills, and changed skill effects do not enter this path.
- A separate `ambusherTiming` option allows the combined lancer schedule without changing side-local attack scheduling or the Ambusher behavior validated by older controls.
- Only Mk2 adds the `lancer_t12_fc10` record. Explicit custom catalogue entries take precedence, allowing independent fitting. T12 use emits an execution warning about provisional support; unsupported army combinations also report a timing fallback. T12 troops exist only at FC10. This change adds the lancer record; it does not add the other T12 troop types or a new dashboard troop selector.
- Old inputs without replay fields retain Legacy. Legacy's existing unsupported-T12 diagnostic is unchanged. Source catalogues and report inputs remain immutable.
- The pinned research backend and its hashes remain unchanged. Run this new experiment through the main engine, not the snapshot's `backend.ts`.

Validation: 234 engine tests pass, including all six new exact outcomes, all 160 older controlled outcomes and 275 recorded skill counts, and all 301 legacy reference outcomes. The dashboard's 104 tests and both TypeScript checks pass. New tests also cover RNG ordering, independent extra-hit Field checks, scope guards, custom stat overrides, timestamp provenance, and independence from testcase IDs/expected results.

## Reproduce

From the repository root, after installing simulator dependencies:

```sh
simulator/node_modules/.bin/tsx research/mk2/lancer_calibration.ts
simulator/node_modules/.bin/tsx research/mk2/lancer_calibration.ts --fit
cd simulator
npm test
npm run typecheck
```

The first command writes the six comparisons and predicted traces to `research/mk2/reports/lancer-calibration.json`. `--fit` additionally runs both stat searches and the author's constrained fitter, writing `research/mk2/reports/lancer-calibration-fit.json`. The artifact includes the input fixture SHA-256. All paths are repository-relative.

## Most useful additional reports

Collect 10–20 hero-free fights with **T12 FC10 lancers** against one known troop type, ideally **T10 or T11 FC0 infantry**, with the lancers both attacking and defending. FC0 refers only to the known infantry opponent; T12 lancers remain FC10 in every fight. FC0 infantry removes the opponent's random troop skills. Keep player bonuses fixed and record the exact troop IDs and timestamps. Vary counts to include close wins and losses as well as one-sided outcomes; broad variation exposes attack/health tradeoffs that these six reports leave unresolved. Include visible skill activation counts if available. New fights should first be evaluated against these saved predictions before any refitting, to provide independent validation.
