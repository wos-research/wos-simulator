# Integration branch review and report-inbox handoff

Reviewed `codex/mk2-engine-integration` at `d008aa8b6ff796f7fc2e4590204939fb8288382b` on 2026-09-13, using the branch's own simulator and normal testcase loader. The preceding growth/rounding investigation was committed separately as `968e64f` on `codex/mk2-controlled-replay` before switching branches. This handoff adds evidence and reproducible diagnostics; it does not change production mechanics.

## What agrees with our findings

- All **319 previously passing captured reports** match the winner, six survivor counts and every supplied activation count: 160 controlled, 154 campaign and five historical D1 reports. The 15 published C2/E1 mixed-skill reports still fail, as that branch documents.
- The eight restored stat cells across five T10 profiles agree with our Points-column audit. Keeping these corrections scoped is consistent with our finding that globally restoring nearest rounding damages lower-tier controls.
- The existing Ambusher/Lance ordering reproduces all nine FC4 inbox reports. Our cases support Ambusher being checked before Lance; they do not independently distinguish every possible round-start scheduling rule.
- The new terminal Volley/Shield rule is narrowly guarded and passes the branch's captured confirmations and scope tests. It concerns a Shield RNG check when Volley damage is canceled. It does not establish the equivalent rule for Incandescent Field or T12 Lance.
- Seed metadata separates recorded-seed replay from timestamp-derived replay. Our exports are replayed with the user-supplied `timestamp + 1` rule; no independent recorded seed or proc count has been invented.
- T11 base values and FC growth remain unchanged. The branch has not promoted an unproven T12 catalogue or the provisional lancer-duel calibration from our other branch.

## Two missing T10 corrections have discriminating inbox reports

The committed diagnostic changes each candidate separately, with captured inputs, probabilities, timestamps and the rest of the engine fixed:

| Candidate | Inbox report | Observed survivors | Current prediction | Candidate prediction |
|---|---|---:|---:|---:|
| FC5 T10 Lancer health 596 → 597 | testcase-000041 | 687 Infantry | 688 | 687 |
| FC5 T10 Lancer health 596 → 597 | testcase-000042 | 685 Infantry | 686 | 685 |
| FC3 T10 Lancer attack 1623 → 1624 | testcase-000020 | 1552 Marksmen | 1553 | 1552 |
| FC3 T10 Lancer attack 1623 → 1624 | testcase-000021 | 1843 Infantry | 1844 | 1843 |

The opposing side has zero survivors in each row. Each isolated correction preserves all 319 previous passing reports, including supplied proc counts, and adds two inbox matches with no existing exact result becoming a mismatch. FC5 report 43 also remains exact. These four reports have timestamps and survivor totals but no independently recorded seeds or chance-skill counters, so their evidential scope differs from the branch's direct captured-seed controls.

Restoring original nearest-rounded attack and health **only for T10 FC1–FC5** adds all four matches and still preserves the 319 reports. All 17 low-FC supported inbox cases then match. That broader experiment does not independently validate every restored cell. The narrow FC3 attack and FC5 health corrections are the actionable follow-up; they are diagnostic options here, not production changes. Some battle/skill-report hashes change even when all observed outcomes remain exact; the result artifact records that distinction.

## Current inbox result and remaining gaps

| Model | Supported inbox cases exact | Supported cases mismatching | T12 cases rejected |
|---|---:|---:|---:|
| Current integration branch | 14/29 | 15 | 27 |
| Only FC5 Lancer health 597 | 16/29 | 13 | 27 |
| Only FC3 Lancer attack 1624 | 16/29 | 13 | 27 |
| Original T10 FC1–FC5 rounding | 18/29 | 11 | 27 |

The remaining 11 supported failures involve high-FC T10 or T11 troops. For example, cases 33/35/37 still predict 13000/34603/12631 Infantry against observed 12951/34573/12489. Cases 59/61/62 still predict 14024/14289/14256 against observed 13796/14204/13972. These errors exist without T12 and must not be attributed solely to T12 stats.

Our prior growth probe in commit `968e64f` found that `round(round(T10_base * 1.20) * FC_multiplier)` improved the eight T11 reports' aggregate absolute survivor error from 1372 to 400 under the existing FC curve, but did not fully fit them. Omitting the inner rounding was also competitive, so the rounding order is unresolved. The proposed 5% growth at FC6–8 and 2.5% at FC9–10 worsened the three high-FC T10 reports in that earlier corpus, from error 516 to 1004. Labyrinth-only T11 FC0 calibration must be distinguished from player T11 extrapolation. Another 20% for T12 remains a hypothesis, not a measured baseline. The integration branch neither confirms nor resolves these questions.

All 27 enabled T12 reports stop at `unsupported troop`: the branch intentionally has no T12 definition. They are committed for future investigation, including the mixed-army/hero cases; they are not counted as numerical mismatches or fitted using substitute stats. T12 troops in these exports are FC10 only. The old six-report T12 calibration and guarded timing implementation remain available on `codex/mk2-controlled-replay` but have not been merged here.

## Testcase import and provenance

- `testcases/mk2/report_inbox_20260913.json`: **56 enabled reports**, retaining the original `testcase-000NNN` IDs.
- `testcases/mk2/report_inbox_20260913.json.disabled`: the existing disabled case 9, preserved with its disabled status. Its original disabling reason is not recorded here; it was not newly excluded based on a replay result.
- `report-inbox-manifest.json`: all 57 source filenames, disabled flags and integrity hashes of the anonymized source records. Each hash uses Python `json.dumps(record, sort_keys=True, separators=(',', ':'), ensure_ascii=False)` encoded as UTF-8, after removing only `attacker.name` and `defender.name`.

The 57 records preserve every original troop count, hero/joiner entry, stat number, timestamp and `game_report_result`. Account names are removed. Native `simulation_mode`, `replay`, `observed` and cohort fields are additive. The current exports revise the displayed stat precision in the six original T12 reports relative to the frozen research fixtures; these current values are preserved verbatim. The other 37 previously curated reports have unchanged army inputs, and 14 additional exports are included here. Historical fixture versions remain in the other branch rather than being counted again as independent reports.

Pure-type armies allow each side's survivor total to determine all three unit counts. For mixed surviving armies, only known zeroes and the total are recorded; the missing split is left unknown. No skill activation counts are present in the inbox exports. Thus an inbox exact result means exact agreement with its available winner/survivor observations, not confirmation of the complete RNG trace.

**Loader migration:** this branch requires `simulation_mode: "mk2"` or a `replay` object to opt in. A raw export's top-level `timestamp` alone stays on the legacy path, and Mk2 comparison reads `observed`, not `game_report_result`. The imported files explicitly populate both replay settings and observations so they run deterministically and are actually compared. `reportedSeed` remains absent; successful executions report `seedSource: "timestamp"` and a null recorded-seed comparison. Even with `--repeat 5`, each Mk2 case runs once.

## Reproduce and validation

From the repository root, with the simulator's dependencies installed:

```sh
node --import ./simulator/node_modules/tsx/dist/loader.mjs scripts/run_testcases.ts --testcase-root testcases/mk2 --matching report_inbox_20260913 --workers 1 --repeat 5 --human
node --import ./simulator/node_modules/tsx/dist/loader.mjs research/mk2/integration-review.ts
```

The first command intentionally exits 1: 29 cases execute, 14 match, 15 mismatch and 27 have unsupported-T12 errors. The disabled report is excluded unless explicitly enabled. The second command writes `integration-review-results.json`, containing fixture hashes, per-file counts, inbox/failure details, seed provenance and candidate changes. Its comparisons use the same normal loader and execution entry point with isolated catalogue overrides in memory. It does not modify source stats or fit reported outcomes.

A full `testcases/mk2` directory scan also picks up the existing `controlled_casualties_20260913.json` aggregate sidecar, which lacks root armies and produces one pre-existing adaptation error. It is not another battle. The diagnostic deliberately exposes that loader issue separately: 391 discovered entries = 334 existing battles + 56 enabled inbox battles + one sidecar. There are 28 processing errors overall (27 T12 + one sidecar), in addition to the known outcome mismatches. A future loader cleanup should exclude that sidecar or relocate it without removing battle evidence.

Validation on the reviewed source: **313/313 simulator tests, 104/104 dashboard tests**, both TypeScript checks, and the diagnostic's standalone TypeScript check passed. The simulator suite includes legacy reference and native Lua RNG regressions. The native CLI independently reproduced the inbox results. This review did not rerun the dashboard production build or collect additional game reports.
