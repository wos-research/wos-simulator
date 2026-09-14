# Mk2 dashboard and CLI compatibility repair

PCB reviewed commit `31a3bee900e6455702e037c4c50a4cb8ebd3ec10`. That checkpoint reproduced its 516 recorded-seed controlled reports through the tested CLI path, but did not establish parity for equivalent dashboard inputs.

## Repairs

- Preserve explicit `e1Volley` and `c2Volley` reference-policy requests through testcase loading. They previously disappeared before replay.
- Treat an explicitly supplied default `maxRounds: 1500` as equivalent to an omitted default when selecting existing scoped RNG rules. The actual battle retains its original input and round limit.
- Recognize equivalent hero-free dashboard representations: empty hero/joiner collections, known zero-count troop entries, zero passive fields and complete zero stats for absent troop types. A missing engagement value is eligible only after checking all relevant troop skill definitions, including filtered-out definitions, for engagement requirements.
- Require exact agreement of compiled battle products, including object-reference structure, before using the comparison view. The original compiled battle still runs. Existing exact army/modifier/config guards remain authoritative; no troop stats, probabilities, seeds or skill algorithms change.

Nonempty heroes, nonzero passive effects, nonzero inactive stats, changed positive troop counts, changed modifiers and supplied nondefault engagement values are not normalized into a measured scope. Unknown or unsupported structures fall back to the original guard path. Both full results and original input immutability are tested.

## Validation

The installed repair passes 400 simulator tests, simulator and dashboard TypeScript checks, 104 dashboard tests and the production dashboard build. Portable tests cover all eight installed guard families in both roles. Forty previously published cases agree through actual dashboard simulation/trace functions and the normal CLI wrapper, including saved JSON/gzip inputs, complete results and native RNG traces. Separate full-corpus checks preserve complete standard and trace/native results for all 536 reviewed reports, including unresolved cases. No seed/stat fitting or outcome filtering was used.

Two old tests treated empty passive fields and zero troop entries as reasons to disable scoped behavior. Those representation expectations now have explicit full-result equivalence tests; changed-army, modifier, hero and configuration rejection checks remain. The initial failing suite is retained in the private audit history. Browser rendering and HTTP routing were not exercised by the function-level parity panel; the build is a separate check.

## Round-cap correction and remaining findings

The original 1,500-round default exists. With the user's explicit approval, Mk2 now returns the engine's capped draw with `termination: {reason: "round-cap", rounds: ...}` instead of throwing when both armies remain alive. The round limit, troop stats and RNG consumption are unchanged. Tests cover default and explicit limits, unchanged complete no-damage battle results, and preservation of decisive and both-zero results. This does not change how a winner is chosen for an ordinary battle.

The current Mk2 stat catalogue still differs from Piddly's original in 156 cells across 109 profiles within T1-T10, FC1-FC5. Every difference is minus one: 79 attack and 77 health cells. These are remaining effects of the earlier flooring override; no new stat deviations are introduced here. The abandoned broad rollback remains unapplied.

Two published reports have captured seed equal to independently captured battle time, while the other reports in their cohorts satisfy seed = time + 1. Preserve both records and their warnings. Recorded-seed replay remains distinct from independently deriving seeds from timestamps; no timestamp is rewritten to force agreement.

A separate newly reviewed report has an in-game defender victory with both rounded survivor totals zero. Its fixture uses the UI-supported winner and preserves the former inferred-draw history. No general winner rule is inferred from that single case.
