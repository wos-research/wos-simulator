/** Reproduce the six-report calibration using the main engine, without outcome-driven simulation. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadSimulatorConfig } from "../../simulator/src/config-node";
import { prepareBattle, runPrepared } from "../../simulator/src/simulator";
import { adaptTestcaseEntry } from "../../simulator/src/tooling/testcases";
import { createTroopStatsRecord } from "../../simulator/src/troopStats";
import { createBattleRng } from "../../simulator/src/mk2/battle_rng";
import { CALIBRATED_T12_LANCER } from "../../simulator/src/mk2/lancer_duel";
import type { SimulatorConfig } from "../../simulator/src/types";
import { findBestEnemyBaseStats } from "../../scripts/fit_enemy_base_stats";
import type { ParsedLabReport } from "../../scripts/fit_enemy_base_stats";

const fixture = new URL("fixtures/lancer-fc10.json", import.meta.url);
const bytes = readFileSync(fixture);
const cases = JSON.parse(bytes.toString("utf8"));
const inputs = cases.map((row: unknown) => adaptTestcaseEntry(row));
const source = loadSimulatorConfig();
function configFor(attack: number, health: number): SimulatorConfig {
  return { ...source, troopStats: { ...source.troopStats,
    lancer_t12_fc10: createTroopStatsRecord({ ...CALIBRATED_T12_LANCER,
      stats: { attack, health, defense: 10, lethality: 10 } }) } };
}
function evaluate(config: SimulatorConfig) {
  return inputs.map((input: ReturnType<typeof adaptTestcaseEntry>, i: number) => {
    const result = runPrepared(prepareBattle(input, config), undefined, { mode: "fast" });
    const expected = cases[i].game_report_result[0];
    return { id: cases[i].test_id, expected, remaining: result.remaining, winner: result.winner,
      rounds: result.rounds, execution: result.execution,
      exact: result.winner === "attacker" && result.remaining.attacker.lancer === expected.attacker &&
        result.remaining.defender.lancer === expected.defender &&
        result.remaining.attacker.infantry === 0 && result.remaining.attacker.marksman === 0 &&
        result.remaining.defender.infantry === 0 && result.remaining.defender.marksman === 0 };
  });
}
const prior = source.troopStats.lancer_t11_fc10.stats;
const priorAttack = Math.round(prior.attack * 1.2), priorHealth = Math.round(prior.health * 1.2);
const exactFor = (config: SimulatorConfig) => evaluate(config).every((r: { exact: boolean }) => r.exact);
const report: Record<string, unknown> = {
  evidence: "Six calibration reports, two troop-count profiles, no recorded skill activation counts. Exact outcomes do not uniquely identify mechanics or base stats.",
  fixtureSha256: createHash("sha256").update(bytes).digest("hex"),
  seedRule: "timestamp + 1; no seed offsets or case-specific adjustments",
  fittedStats: CALIBRATED_T12_LANCER.stats,
  cases: evaluate(source),
  twentyPercent: { stats: configFor(priorAttack, priorHealth).troopStats.lancer_t12_fc10.stats,
    cases: evaluate(configFor(priorAttack, priorHealth)) },
  alternativeExactStats: { attack: 3220, health: 1007, defense: 10, lethality: 10,
    allExact: exactFor(configFor(3220, 1007)) },
  predictedTraces: inputs.map((input: ReturnType<typeof adaptTestcaseEntry>, i: number) => {
    const rng = createBattleRng(input.timestamp, true);
    const result = runPrepared(prepareBattle(input, source), undefined, { mode: "trace", rng: rng.rng });
    return { id: cases[i].test_id, rng: rng.metadata(), skillReport: result.skillReport };
  }),
};
if (process.argv.includes("--fit")) {
  const matches: { attack: number; health: number }[] = [];
  let pairs = 0;
  for (let attack = 2970; attack <= 3300; attack += 5) {
    for (let health = 975; health <= 1100; health++) {
      pairs++;
      if (exactFor(configFor(attack, health))) matches.push({ attack, health });
    }
  }
  const distance = (v: { attack: number; health: number }) => (v.attack / priorAttack - 1) ** 2 + (v.health / priorHealth - 1) ** 2;
  matches.sort((a, b) => distance(a) - distance(b));
  let uniformExact = 0;
  for (let step = 11000; step <= 13000; step++) {
    const factor = step / 10000;
    if (exactFor(configFor(Math.round(prior.attack * factor), Math.round(prior.health * factor)))) uniformExact++;
  }
  report.fit = { attack: { min: 2970, max: 3300, step: 5 }, health: { min: 975, max: 1100, step: 1 },
    pairs, exactPairs: matches.length, matches,
    selection: "Nearest tested exact pair to rounded +20% prior, by squared relative distance in attack and health",
    uniformMultiplier: { min: 1.1, max: 1.3, step: 0.0001, samples: 2001, exact: uniformExact } };
  // Reuse the author's search and objective, replacing only its PNG/legacy-sampling scorer
  // with the already-parsed reports and their timestamp-seeded main-engine replays.
  const reports: ParsedLabReport[] = cases.map((row: any, i: number) => {
    const side = (s: "attacker" | "defender") => ({
      troops: { infantry: 0, lancer: Object.values(row[s].troops)[0] as number, marksman: 0 },
      troopTypes: { infantry: "", lancer: Object.keys(row[s].troops)[0], marksman: "" },
      stats: row[s].stats,
    });
    return { file: String(i), expectedOutcome: row.game_report_result[0].attacker - row.game_report_result[0].defender,
      attacker: side("attacker"), defender: side("defender") };
  });
  report.originalFitter = {
    note: "Author's unchanged attack = 3 * health search; no rounding of candidate stats; timestamp-seeded scorer; MAE objective",
    health: { min: 950, max: 1150, step: 0.1 },
    result: findBestEnemyBaseStats(reports, {
      lancerHealth: { min: 950, max: 1150, step: 0.1 }, objective: "mae",
      scoreCandidate: (candidate, report) => {
        const result = runPrepared(prepareBattle(inputs[Number(report.file)], configFor(candidate.lancerAttack, candidate.lancerHealth)),
          undefined, { mode: "fast" });
        return result.remaining.attacker.lancer - result.remaining.defender.lancer;
      },
    }),
  };
}
const output = new URL(`reports/lancer-calibration${process.argv.includes("--fit") ? "-fit" : ""}.json`, import.meta.url);
mkdirSync(new URL("reports/", import.meta.url), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(evaluate(source).map((r: { id: string; remaining: unknown; exact: boolean }) => ({ id: r.id, remaining: r.remaining, exact: r.exact })));
console.log(fileURLToPath(output));
