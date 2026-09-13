# Mk2 main-engine integration validation

Applied 37 source/documentation files to `/Users/pcb/Documents/wos-simulator` on `codex/mk2-controlled-replay`, based on `680c8dd1c7c930adc27f41aa480019e53af64cc4`. Changes remain uncommitted. The manifest records before/after hashes; every installed file matches the tested source.

## Results

- Main engine suite, run from the actual checkout: **227/227 passed**.
- Dashboard suite: **104/104 passed**.
- Simulator and dashboard TypeScript checks passed.
- Dashboard production build passed.
- All **160 controlled battle outcomes** match all six survivor counts and the winner; all **275 recorded skill counts** match.
- All **301 legacy reference outcomes**, including rounds, remain unchanged.
- All **145 stored native Lua RNG vectors** match.
- The testcase reporting CLI's exported `main` was invoked explicitly with one worker and repeat 5: 160 passes, zero errors, one execution per replay. Every saved summary retains `derived-from-reported-seed` status. See `cli.log` and `controlled-parity-summary.json`.
- Browser verification: a timestamp/report-seed pair showed the matching status, exact seed, one replay, winner/survivor/round cards, and the same seed and outcome in the example trace. Reloading the saved result preserved its execution status.

The dashboard suite was run with tsx 4.23.12, as used by the Mk2 research package; the simulator suite used its locked tsx dependency. Validation used an isolated export with installed locked dependencies; those dependencies were not copied into the repository.

## Behavior and limits

Old testcase formats and inputs without replay fields retain Legacy behavior. Fresh dashboard forms select Mk2, with Legacy available explicitly. Timestamp-only runs are unverified. Agreement with a supplied report seed is shown separately from a timestamp derived from that seed; mismatches fail before execution. Replay data never silently substitutes seed 1 for a missing timestamp. Saved results and parity reports preserve the status.

Recorded replays run once and bypass testcase stat fitting. The delayed Gunpowder timing rule retains the measured troop-only guards and reports fallback outside that scope. Newer-hero/T12 provisional definitions were not integrated. These results establish agreement with the existing controlled corpus, not general accuracy for untested army setups.

See [the integration guide](../integration.md) for input fields and examples.

Raw validation logs, JSON results, and the original installation manifest are retained in `/Users/pcb/Documents/wos_projects/artifacts/wos-mk2-integration-20260912`. The manifest describes the installation before documentation was relocated into this folder.
