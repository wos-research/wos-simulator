# Opposing Lance: ten-report checkpoint

Ten distinct hero-free occupied-tile reports add five tests in each orientation of **100 T5 FC5 Lancers versus 100 T5 FC5 Lancers**. Both sides have the canonical 15% Lance source; there is no Ambusher source in these armies. The captured modifiers are preserved, with actor roles swapped between batches.

Current catalogue17 H0 matches all ten reports through the normal testcase CLI: ten recorded seeds, ten winners, 60 survivor values and 20 explicit Lance activation counters. The companion results preserve 320 raw modifier values and 240 normalized stat axes. Expert context matched the frozen baseline; heroes and extras were explicitly empty. Each five-report CLI run completed with zero warnings or errors. No kernel, stat, probability or seed changes were made.

Added to the separately verified 461-report v17 checkpoint, this gives **471/471 controlled reports exact**, with 2,826 survivor checks and 1,024 explicit supported chance-counter checks. This is an additive checkpoint, not a newly rerun 471-report suite. The preexisting external report inbox is excluded from this controlled corpus and retains its separately documented errors and mismatches.

These tests establish compatibility for the captured opposing-Lance context. They do not uniquely identify the server's internal RNG ordering, independently validate catalogue values or probabilities, or establish opposing Ambusher/Lance behavior. Replay timestamps are derived from recorded seed minus one and are not independent seeding-time evidence. Distinct report identities remain distinct even if observations match; identifying raw evidence stays private.

The four fixture/results files are the public evidence payload. Private identity mappings, local paths and audit logs are not publication artifacts.

A separate identity-based timing review found all ten new Lance seeds equal to the independently joined integer attacker-trigger timestamp plus one, corroborated across both recording endpoints. Joins used exact report identity and the unique preceding attacker march in the same stream, without selecting by seed. Earlier opposing-Marksman reports included six plus-one and four equal offsets, so this batch does not establish a universal formula. Fixture timestamps and their `derived-report-seed-minus-one` source labels remain unchanged.

The [previous v17 checkpoint](mk2-ordering-v17-checkpoint-20260913.md) documents the installed ordering rules and full runtime validation. Run both new fixture files from the repository root:

```sh
node --import ./simulator/node_modules/tsx/dist/loader.mjs scripts/run_testcases.ts --testcase-root testcases/mk2 --matching mk2-opposing-lance --workers 1 --human
```
