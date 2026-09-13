# Mk2 C2 checkpoint — September 13, 2026

Catalogue 16 reproduces 393 of 441 independently reviewed captured reports exactly. All 441 winners match; 35 incomplete matches differ only in explicit skill activation counts, and 13 also differ in Lancer survivors. The original 160 controlled reports remain 160/160. These totals exclude unseeded report-inbox exports and captures whose analysis is unfinished.

## Installed correction and exact scope

The new rule covers hero-free 500 T5 FC5 Lancers plus 5 T7 FC3 Marksmen against 1 T5 FC5 Infantry, in either role, with the exact captured normalized modifiers and current catalogue/skill definitions. It reserves live Volley before the normal Lancer hit's reactive Crystal Shield and Crystal Lance draws, applies that reserved result at the original Marksman attack slot, and defers Gunpowder in this exact context. A successful reservation whose attack never occurs receives one activation credit without another RNG draw or damage job.

All 20 reports match the installed rule, versus 0/20 under the retained reference behavior. The same ordering without unused-success credit matches 17/20. Two forward reports and one reverse report have explicit captured Volley totals that distinguish the credit alternatives. These counters are observed; internal reservation events are model explanations, not server event logs. The five forward and fifteen reverse reports do not establish this rule for different counts, modifiers, troop tiers/FC levels, heroes or skill combinations.

The production guard rejects those other inputs. Troop stats, probabilities, damage formulas and the original underlying engine were unchanged in this update. `replayMk2(..., {c2Volley: 'reference'})` retains the prior behavior for comparison; the research adapter exposes the corresponding mechanics option. Defined top-level seed fields and unexpected input keys remain outside the scoped guard. The normal testcase adapter's own undefined seed key is accepted as absent.

The user authorized additions established through testing while retaining explicit approval for changes to established original kernel items. This update adds missing RNG timing/accounting within the measured scope; it does not authorize catalogue changes or broader extrapolation.

## New reports and remaining research

The normal testcase directory includes the five new reverse accounting reports in `c2_one_infantry_reverse3_20260913.json`, alongside the prior three one-Infantry batches. Three public unused-success witnesses are forward004, forward005 and reverse3-004.

A separate five-report batch uses 100 T10 FC5 Lancers plus 100 T7 FC3 Marksmen against 500 T5 FC1 Infantry. Its four chance sources are Ambusher, Crystal Lance, Volley and Gunpowder. The active kernel matches 2/5. A candidate frozen before seeing these outcomes, reserving Volley after Ambusher and before Crystal Lance while retaining Gunpowder timing, matches 5/5. Reserving Volley before Ambusher matches 0/5. The first report and one confirmation do not distinguish active behavior from the successful candidate; three confirmations do. No successful unused reservation occurs under the matching candidate. Reverse-role confirmation and accounting boundaries remain unresolved, and this candidate is not installed.

All five reports, including the three mismatches, are in `four_skill_forward_pending_20260913.json`. Corresponding files under `research/mk2` preserve the historical v15 comparisons. Those historical results are intentionally not rewritten to look like v16 results.

The 48 active-kernel mismatches comprise 15 earlier FC4 mixed-skill reports, 30 FC5 five-Infantry reports, and 3 new four-source reports. Next experiments target missing five-Infantry unused-success accounting evidence and the reverse four-source combination. No unobserved scope is silently promoted.

## Validation and limitations

- 330 simulator tests pass, including all 160 original reports, 301 legacy reference outcomes and 45,440 native Lua vectors.
- Complete installed shared/research outputs were checked for all 441 captured inputs: 421 outside-scope reports retain identical full wrappers and RNG traces, apart from the shared version label15 to16. All 20 scoped reports match the frozen U1 battle, RNG and reservation outputs.
- 80 timestamp sampler checks and 4 legacy sampler checks pass. Eight scoped regression tests cover 20 observations, the three accounting witnesses, real testcase adaptation and scope/reference boundaries.
- TypeScript checking and the dashboard production build pass. The build required a project-local output directory for generated Next.js types; temporary generated tsconfig additions were removed.
- 239 pre-existing source/config files outside the intended integration/version files retain their recorded byte hashes. No stat or probability definitions changed.

An exact report match means winner, all six survivor counts and every relevant explicitly captured chance-skill activation count. Missing observations remain unknown. Recorded-seed replay is distinct from independently deriving the seed from battle time; seed-minus-one replay timestamps do not prove the server's clock rule. Matching these observations does not uniquely prove every internal combat mechanic or universal accuracy.
