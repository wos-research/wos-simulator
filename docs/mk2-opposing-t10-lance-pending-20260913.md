# Opposing T10 Lancers: five new pending reports

Five new hero-free occupied-tile battles use 100 T10 FC5 Lancers against 100 T10 FC5 Lancers. Current catalogue17 side-local scheduling matches zero of these reports exactly; the predeclared reference scheduling matches all five. Every current-kernel mismatch includes survivor and skill-counter differences, while all five winners are correct. The reverse direction is still pending. No correction is installed.

The previously verified 471 reports remain unchanged and exact. The reviewed controlled corpus is now **476 reports: 471 exact and 5 pending**, with all 476 winners correct. This additive checkpoint is not a new full-corpus rerun. The separate external inbox retains its previously documented unsupported cases and mismatches.

Both schedules were frozen before the fights. The first chronological report was analyzed before releasing the other four. Independent raw review checked five recorded seeds, 30 survivor values, 20 explicit Ambusher/Lance counters, 160 raw modifier values, 120 normalized stat axes, empty hero/extra context and unchanged experts. No seeds, stats or probabilities were fitted.

For the first report, the game recorded 42 defending Lancers remaining; the active kernel gives 35. Reference scheduling gives 42 and matches all four explicit skill counters. This distinguishes these schedules within the tested inputs; it does not uniquely establish a server phase or justify a global scheduling change.

The fixtures retain side-local scheduling so the mismatch remains reproducible. The results file includes both frozen comparisons. Run from the repository root:

```sh
node --import ./simulator/node_modules/tsx/dist/loader.mjs scripts/run_testcases.ts --testcase-root testcases/mk2 --matching mk2-opposing-t10-lance-forward --workers 1 --human
```

Expected current result: five mismatches, zero processing errors or warnings, exit status 1. Fixture timestamps derive from recorded seed minus one and do not independently establish seeding time. Identifying packets and account mappings remain private.

The [prior 471-report checkpoint](mk2-opposing-lance-checkpoint-20260913.md) documents the unchanged passing evidence.
