# Reviewed controlled evidence: 486 reports

The reviewed controlled corpus contains **486 reports: 471 exact and 15 pending against active catalogue17**, with 481 correct winners. This is an additive evidence checkpoint, carrying forward the previously verified 471 exact reports. No full-corpus rerun or active-kernel change is claimed here. The separate external inbox remains unchanged.

| Cohort | Reports | Active exact | Active correct winners | Frozen private exact |
|---|---:|---:|---:|---:|
| Previously published opposing T10 Lancers, original context, forward | 5 | 0 | 5 | 5 |
| Opposing T10 Lancers, new context, reverse | 5 | 0 | 3 | 5 |
| Ambusher source death, mixed defender | 5 | 0 | 2 | 5 |

All fifteen mismatches remain pending. The frozen private candidates match these reports but are not installed. Existing fixtures retain their original contents. These observations concern the exact exported troop counts, roles, modifiers, hero-free context and unchanged experts; they do not establish a universal phase or support untested profiles.

The ten new fixtures each preserve the independently recorded seed, all six survivor slots and all four explicit activation counts, including zero counts. They include normalized troop/stat inputs and anonymized raw modifier, expert and profile evidence. Account names, UIDs, coordinates, original report/mail identifiers, private paths and packet captures are excluded. There was no seed, stat or probability fitting.

The T10 cohort uses 100 T10 FC5 Lancers on each side. Frozen candidate and reference scheduling match all five; active H0 matches none. Collection UI summaries were seen before the prospective freeze; model-level seeds and counters were inspected only after the diagnostic and confirmation releases. This is a different modifier context from the original forward cohort, not a same-context reverse proof.

The source-death cohort uses 100 attacking T5 FC5 Lancers against 100 T5 FC3 Marksmen and one T10 FC5 Lancer. The frozen G1 comparison matches all five reports. G0 matches all winners and survivors but misses the Ambusher activation count in every report. The G0/G1 follow-up was designed after review of the first diagnostic, based on a source audit predating that outcome; the four confirmation outcomes were released afterward. No alternative model is made the default by these fixtures.

Replay uses each original reported seed as an explicit override. The public timestamp is the independently captured linked notification/march field. The timestamp-plus-one relation holds in 8 of the ten new reports, and fails in:

| Fixture suffix | Reported seed | Captured timestamp | Relation |
|---|---:|---:|---|
| opposing-t10-lance-reverse-20260914-004 | 1789350951 | 1789350951 | delta zero |
| ambusher-source-death-forward-20260914-005 | 1789351354 | 1789351354 | delta zero |

Both failures remain visible and are excluded from the timestamp-plus-one claim. Source-death input adapters originally used seed-minus-one values; those values are retained only in explicitly labeled provenance fields, never described as independently captured times. Exact server initialization phase, subsecond rounding and notification timing remain unresolved.

The exported ten cases reproduce all original H0 comparison outcomes and proc counts using the unchanged shared kernel. Verification checked ten native recorded seeds, 60 survivor fields and 40 explicit counters. The regular CLI finds ten files and reports ten mismatches, zero errors and two expected timestamp/seed warnings, with exit status 1.

Run each cohort from the repository root:

```sh
node --import ./simulator/node_modules/tsx/dist/loader.mjs scripts/run_testcases.ts --testcase-root testcases/mk2 --matching mk2-opposing-t10-lance-reverse-20260914 --workers 1 --human
node --import ./simulator/node_modules/tsx/dist/loader.mjs scripts/run_testcases.ts --testcase-root testcases/mk2 --matching mk2-ambusher-source-death-forward-20260914 --workers 1 --human
```

Each command is expected to report five mismatches and one timestamp warning against catalogue17. See the [machine-readable checkpoint](../research/mk2/reviewed-checkpoint-486-20260914.json), [active export replay](../research/mk2/new-ten-active-replay-20260914.json), [T10 comparisons](../research/mk2/mk2-opposing-t10-lance-reverse-20260914_results.json), [source-death comparisons](../research/mk2/mk2-ambusher-source-death-forward-20260914_results.json), and [prior 476-report checkpoint](mk2-opposing-t10-lance-pending-20260913.md).
