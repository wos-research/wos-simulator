/** Independent follow-up reports and shared-coefficient fitting through the main engine. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { findBestEnemyBaseStats } from "../../scripts/fit_enemy_base_stats";
import type { ParsedLabReport } from "../../scripts/fit_enemy_base_stats";
import { loadSimulatorConfig } from "../../simulator/src/config-node";
import { prepareBattle, runPrepared } from "../../simulator/src/simulator";
import { adaptTestcaseEntry } from "../../simulator/src/tooling/testcases";
import { createTroopStatsRecord, fireCrystalMultiplier } from "../../simulator/src/troopStats";
import type { BattleInput, SimulatorConfig } from "../../simulator/src/types";

const bytes = readFileSync(new URL("fixtures/lancer-followup.json", import.meta.url));
const cases = JSON.parse(bytes.toString("utf8"));
const original = JSON.parse(readFileSync(new URL("fixtures/lancer-fc10.json", import.meta.url), "utf8"));
const config = loadSimulatorConfig();
type Timing = "current" | "round-start";
function withStats(attack: number, health: number): SimulatorConfig {
  return { ...config, troopStats: { ...config.troopStats,
    lancer_t12_fc10: createTroopStatsRecord({ id: "lancer_t12_fc10", type: "lancer", tier: 12, fc: 10,
      stats: { attack, defense: 10, lethality: 10, health } }) } };
}
function group(row: any): string {
  const a = row.attacker, d = row.defender;
  if (a.heroes?.length || d.heroes?.length) return "heroes";
  if (Object.values(a.troops).filter(x => Number(x) > 0).length !== 1 ||
      Object.values(d.troops).filter(x => Number(x) > 0).length !== 1) return "mixed";
  if (!a.troops.lancer_t12_fc10 && !d.troops.lancer_t12_fc10) return "known-troop-control";
  if (a.troops.infantry_t10 && d.troops.lancer_t12_fc10) return "infantry-vs-t12";
  return "lancer-vs-t12";
}
function run(row: any, source: SimulatorConfig, timing: Timing) {
  const input = adaptTestcaseEntry(row);
  const compiled = prepareBattle(input, source);
  const result = runPrepared(compiled, undefined, { mode: "fast",
    ...(timing === "round-start" ? { ambusherTiming: "round_start" as const } : {}) });
  const sum = (troops: Record<string, number>) => Object.values(troops).reduce((a, b) => a + b, 0);
  const actual = { attacker: sum(result.remaining.attacker), defender: sum(result.remaining.defender) };
  const expected = row.game_report_result[0];
  return { id: row.test_id, group: group(row), timestamp: input.timestamp, seed: result.execution?.seed,
    troopSetup: { attacker: input.attacker.troops, defender: input.defender.troops },
    expected, actual, remaining: result.remaining, rounds: result.rounds,
    exact: actual.attacker === expected.attacker && actual.defender === expected.defender,
    error: actual.attacker - actual.defender - (expected.attacker - expected.defender),
    diagnostics: [...compiled.fighters.attacker.diagnostics, ...compiled.fighters.defender.diagnostics] };
}
function evaluate(source: SimulatorConfig, timing: Timing, rows = cases) {
  const results = rows.map((row: any) => run(row, source, timing));
  const groups: Record<string, { cases: number; exact: number; absoluteError: number }> = {};
  for (const row of results) {
    const g = groups[row.group] ??= { cases: 0, exact: 0, absoluteError: 0 };
    g.cases++; g.exact += Number(row.exact); g.absoluteError += Math.abs(row.error);
  }
  return { groups, exact: results.filter((r: { exact: boolean }) => r.exact).length, cases: results };
}
const t11 = config.troopStats.lancer_t11_fc10.stats;
const fc = fireCrystalMultiplier(10);
const models = [
  { name: "previous-six-report-fit", attack: 3215, health: 1008 },
  { name: "twenty-percent-rounded", attack: Math.round(t11.attack * 1.2), health: Math.round(t11.health * 1.2) },
  { name: "twenty-percent-floor", attack: Math.floor(t11.attack * 1.2), health: Math.floor(t11.health * 1.2) },
  { name: "twenty-percent-unrounded", attack: t11.attack * 1.2, health: t11.health * 1.2 },
  { name: "twenty-percent-before-FC-round", attack: Math.round(1653 * 1.2 * fc), health: Math.round(551 * 1.2 * fc) },
];
const baseline = models.flatMap(model => (["current", "round-start"] as const).map(timing => ({ ...model, timing,
  ...evaluate(withStats(model.attack, model.health), timing) })));
const report: Record<string, unknown> = {
  fixtureSha256: createHash("sha256").update(bytes).digest("hex"),
  evidence: "21 newly enabled reports. Experts affect displayed stats according to the user; no extra Expert combat effect is inferred from old collector flags. Hero and mixed cases are excluded from fitting.",
  seedRule: "timestamp + 1, unchanged for every model and candidate",
  timing: { current: "Existing production behavior, no timing override",
    "round-start": "Experimental Ambusher at round start; main engine otherwise unchanged" },
  baseline,
};
if (process.argv.includes("--fit")) {
  const pure = cases.filter((row: any) => group(row) === "infantry-vs-t12");
  const inputs: BattleInput[] = pure.map((row: any) => adaptTestcaseEntry(row));
  const reports: ParsedLabReport[] = pure.map((row: any, i: number) => ({
    file: String(i), expectedOutcome: row.game_report_result[0].attacker - row.game_report_result[0].defender,
    attacker: { troops: { infantry: row.attacker.troops.infantry_t10, lancer: 0, marksman: 0 },
      troopTypes: { infantry: "infantry_t10", lancer: "", marksman: "" }, stats: row.attacker.stats },
    defender: { troops: { infantry: 0, lancer: row.defender.troops.lancer_t12_fc10, marksman: 0 },
      troopTypes: { infantry: "", lancer: "lancer_t12_fc10", marksman: "" }, stats: row.defender.stats },
  }));
  const fits = [];
  for (const timing of ["current", "round-start"] as const) {
    const scores = new Map<string, number[]>();
    const scoreCandidate = (candidate: { lancerAttack: number; lancerHealth: number }, report: ParsedLabReport) => {
      const key = `${candidate.lancerAttack}:${candidate.lancerHealth}`;
      let values = scores.get(key);
      if (!values) {
        const source = withStats(candidate.lancerAttack, candidate.lancerHealth);
        values = inputs.map(input => {
          const result = runPrepared(prepareBattle(input, source), undefined, { mode: "fast",
            ...(timing === "round-start" ? { ambusherTiming: "round_start" as const } : {}) });
          return result.remaining.attacker.infantry - result.remaining.defender.lancer;
        });
        scores.set(key, values);
      }
      return values[Number(report.file)];
    };
    for (const objective of ["mae", "bias"] as const) {
      const coarse = findBestEnemyBaseStats(reports, {
        lancerHealth: { min: 950, max: 1150, step: 0.1 }, objective, scoreCandidate,
      });
      const center = coarse.best.lancerHealth;
      const refined = findBestEnemyBaseStats(reports, {
        lancerHealth: { min: center - 0.1, max: center + 0.1, step: 0.001 }, objective, scoreCandidate,
      });
      const best = refined.best;
      const source = withStats(best.lancerAttack, best.lancerHealth);
      fits.push({ timing, objective, coarse, refined,
        followup: evaluate(source, timing), originalSix: evaluate(source, timing, original) });
    }
  }
  const known = cases.filter((row: any) => ["testcase-000033", "testcase-000035", "testcase-000037"].includes(row.test_id));
  const knownReports: ParsedLabReport[] = known.map((row: any, i: number) => ({
    file: String(i), expectedOutcome: row.game_report_result[0].attacker,
    attacker: { troops: { infantry: row.attacker.troops.infantry_t10, lancer: 0, marksman: 0 },
      troopTypes: { infantry: "infantry_t10", lancer: "", marksman: "" }, stats: row.attacker.stats },
    defender: { troops: { infantry: row.defender.troops.infantry_t11_fc9, lancer: 0, marksman: 0 },
      troopTypes: { infantry: "infantry_t11_fc9", lancer: "", marksman: "" }, stats: row.defender.stats },
  }));
  const knownFit = findBestEnemyBaseStats(knownReports, {
    lancerHealth: { min: 800, max: 880, step: 0.05 }, objective: "mae",
    scoreCandidate: (candidate, report) => {
      const source = { ...config, troopStats: { ...config.troopStats,
        infantry_t11_fc9: createTroopStatsRecord({ id: "infantry_t11_fc9", type: "infantry", tier: 11, fc: 9,
          stats: { attack: candidate.lancerHealth, health: candidate.lancerAttack, defense: 10, lethality: 10 } }) } };
      const result = run(known[Number(report.file)], source, "current");
      return result.actual.attacker - result.actual.defender;
    },
  });
  report.knownTroopCheck = { caseIds: known.map((r: any) => r.test_id),
    sourceStats: config.troopStats.infantry_t11_fc9.stats,
    fittedStats: { attack: knownFit.best.lancerHealth, health: knownFit.best.lancerAttack, defense: 10, lethality: 10 },
    note: "A diagnostic effective-coefficient fit to three reports; not adopted as catalogue truth. No T12 troops are present.",
    result: knownFit };
  report.authorFitter = { script: "scripts/fit_enemy_base_stats.ts", constraint: "lancer attack = 3 * health; defense/lethality = 10",
    calibrationCases: pure.map((r: any) => r.test_id), coarseHealth: { min: 950, max: 1150, step: 0.1 },
    refinement: "Each optimum +/- 0.1 health in steps of 0.001", fits };
}
const output = new URL(`reports/lancer-followup${process.argv.includes("--fit") ? "-fit" : ""}.json`, import.meta.url);
mkdirSync(new URL("reports/", import.meta.url), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(baseline.map(({ name, attack, health, timing, groups }) => ({ name, attack, health, timing, groups })));
console.log(output.pathname);
