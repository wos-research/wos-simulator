/** Timestamp-seeded FC4/5 controls and T10/T11 FC10 diagnostics. No production mutations. */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { findBestEnemyBaseStats, type ParsedLabReport } from "../../scripts/fit_enemy_base_stats";
import { loadSimulatorConfig } from "../../simulator/src/config-node";
import type { Rng } from "../../simulator/src/effects";
import { Lua54Random } from "../../simulator/src/mk2/lua54_rng";
import { mk2Config } from "../../simulator/src/mk2/mechanics";
import { prepareBattle, runPrepared } from "../../simulator/src/simulator";
import { adaptTestcaseEntry } from "../../simulator/src/tooling/testcases";
import { createTroopStatsRecord, fireCrystalMultiplier } from "../../simulator/src/troopStats";
import type { SimulationOptions, SimulatorConfig } from "../../simulator/src/types";

type Row = any;
const fixtureBytes = readFileSync(new URL("fixtures/lancer-fc45-controls.json", import.meta.url));
const rows: Row[] = JSON.parse(fixtureBytes.toString("utf8"));
const previousBytes = readFileSync(new URL("fixtures/lancer-followup.json", import.meta.url));
const previous: Row[] = JSON.parse(previousBytes.toString("utf8"));
const config = loadSimulatorConfig();
const total = (troops: Record<string, number>) => Object.values(troops).reduce((a, b) => a + b, 0);
const defenderId = (row: Row): string => Object.keys(row.defender.troops)[0];
const expectedScore = (row: Row): number => row.game_report_result[0].attacker - row.game_report_result[0].defender;

function run(row: Row, source = config, options: SimulationOptions = {}) {
  const compiled = prepareBattle(adaptTestcaseEntry(row), source);
  const result = runPrepared(compiled, options.rng ? String(BigInt(row.timestamp) + 1n) : undefined,
    { mode: "fast", ...options });
  const actual = { attacker: total(result.remaining.attacker), defender: total(result.remaining.defender) };
  const expected = row.game_report_result[0];
  if (!options.rng && result.execution?.seed !== String(BigInt(row.timestamp) + 1n)) throw new Error("Seed mismatch");
  const diagnostics = [...compiled.fighters.attacker.diagnostics, ...compiled.fighters.defender.diagnostics];
  if (diagnostics.length) throw new Error(`${row.test_id}: unresolved input: ${JSON.stringify(diagnostics)}`);
  return { id: row.test_id, troop: defenderId(row), expected, actual, remaining: result.remaining,
    exact: actual.attacker === expected.attacker && actual.defender === expected.defender,
    error: actual.attacker - actual.defender - expectedScore(row), rounds: result.rounds,
    execution: result.execution };
}

/** Explicitly override the normalized research config: Mk2 otherwise floors T10 FC coefficients. */
function withCoefficients(id: string, attack: number, health: number): SimulatorConfig {
  const source = { ...config };
  const normalized = mk2Config(source), troop = normalized.troopStats[id];
  normalized.troopStats[id] = createTroopStatsRecord({ ...troop,
    stats: { ...troop.stats, attack, health } });
  return source;
}

const projected = new Map<string, number[]>();
function stream(row: Row): number[] {
  const timestamp = String(row.timestamp);
  let values = projected.get(timestamp);
  if (!values) {
    const generator = new Lua54Random(BigInt(timestamp) + 1n);
    values = Array.from({ length: 4500 }, () => generator.random(0, 9999));
    projected.set(timestamp, values);
  }
  return values;
}

/** Each order assigns the same projected Lua stream to labelled checks within each round. */
function scheduled(row: Row, source: SimulatorConfig, order: string) {
  const hasField = Number(defenderId(row).match(/_fc(\d+)$/)?.[1] ?? 0) >= 8;
  const values = stream(row), events: { round: number; skill: string; passed: boolean }[] = [];
  const seen = new Set<string>();
  const rng: Rng = () => { throw new Error("Unlabelled RNG call"); };
  rng.chance = (probability, context) => {
    const skill = ({ Ambusher: "A", CrystalLance: "L", IncandescentField: "F" } as Record<string, string>)[context!.skill!.id];
    const round = context!.round!;
    if (!skill || round < 1 || seen.has(`${round}:${skill}`)) throw new Error("Unexpected skill schedule");
    seen.add(`${round}:${skill}`);
    const slot = order.indexOf(skill), index = (round - 1) * order.length + slot;
    if (slot >= 0 && index >= values.length) throw new Error("RNG buffer exhausted");
    // Omitting A explicitly tests whether Ambusher skips both its draw and proc without a marksman.
    const passed = slot >= 0 && values[index] < probability * 100;
    events.push({ round, skill, passed });
    return passed;
  };
  const result = run(row, source, { rng });
  if (events.length !== result.rounds * (hasField ? 3 : 2)) throw new Error("Unexpected number of checks per round");
  return { ...result, order, randomSchedule: { algorithm: "lua54-xoshiro256**", seed: String(BigInt(row.timestamp) + 1n),
    projectedRolls: result.rounds * order.length, checks: events.length,
    procs: Object.fromEntries(["A", "F", "L"].map(k => [k, events.filter(e => e.skill === k && e.passed).length])) } };
}

function summarize(results: ReturnType<typeof run>[]) {
  return { cases: results.length, exact: results.filter(r => r.exact).length,
    absoluteError: results.reduce((sum, r) => sum + Math.abs(r.error), 0) };
}

const baseline = ["current", "round-start"].map(timing => {
  const results = rows.map(row => run(row, config, timing === "round-start" ? { ambusherTiming: "round_start" } : {}));
  const groups = Object.fromEntries([...new Set(results.map(r => r.troop))].map(troop =>
    [troop, summarize(results.filter(r => r.troop === troop))]));
  return { timing, ...summarize(results), groups, results };
});
console.log("Baseline", baseline.map(({ timing, groups }) => ({ timing, groups })));

const permutationRows = [...rows, ...previous.filter(row => row.attacker.troops.infantry_t10 &&
  Object.keys(row.attacker.troops).length === 1 && Object.keys(row.defender.troops).length === 1 &&
  defenderId(row).startsWith("lancer_") && !row.attacker.heroes?.length && !row.defender.heroes?.length)];
const schedules = permutationRows.map(row => {
  const hasField = Number(defenderId(row).match(/_fc(\d+)$/)?.[1] ?? 0) >= 8;
  const orders = hasField ? ["FAL", "AFL", "ALF", "FLA", "LAF", "LFA", "FL", "LF"] : ["AL", "LA", "L"];
  const results = orders.map(order => scheduled(row, config, order));
  const current = run(row);
  if (results[0].actual.attacker !== current.actual.attacker || results[0].actual.defender !== current.actual.defender ||
      results[0].rounds !== current.rounds) throw new Error("Schedule harness disagrees with production baseline");
  return { id: row.test_id, troop: defenderId(row), results };
});

const probeRows = [...rows, ...previous.filter(row => ["testcase-000033", "testcase-000034", "testcase-000035", "testcase-000037"].includes(row.test_id))];
const coefficientProbes = probeRows.map(row => {
  const id = defenderId(row), troop = mk2Config(config).troopStats[id];
  const variants = ["base", "round", "ceil", "t10-fc5-health-rounded", "fc8-five-percent",
    "scale-1.01", "scale-1.02", "scale-1.03", "display-upper-defender", "display-upper-attacker"];
  const results = variants.flatMap(variant => {
    let { attack, health } = troop.stats;
    if (variant === "round" || variant === "ceil" || variant === "fc8-five-percent" && troop.fc >= 8) {
      const factor = variant === "fc8-five-percent" ? 1.04 * 1.05 ** (troop.fc - 1) : fireCrystalMultiplier(troop.fc);
      const round = variant === "ceil" ? Math.ceil : variant === "fc8-five-percent" && troop.tier <= 10 ? Math.floor : Math.round;
      const base = troop.tier === 11 ? 551 : 472;
      attack = round(base * (troop.type === "lancer" ? 3 : 1) * factor);
      health = round(base * (troop.type === "lancer" ? 1 : 3) * factor);
    }
    if (variant === "t10-fc5-health-rounded" && id === "lancer_t10_fc5") health = 597;
    if (variant.startsWith("scale-")) { const factor = Number(variant.slice(6)); attack *= factor; health *= factor; }
    const source = withCoefficients(id, attack, health), input = structuredClone(row);
    if (variant.startsWith("display-upper-")) {
      const side = variant.slice("display-upper-".length);
      for (const stats of Object.values(input[side].stats) as Record<string, number>[])
        for (const key of Object.keys(stats)) stats[key] += 0.009999;
    }
    return ["current", "round-start"].map(timing => ({ variant, timing, attack, health,
      ...run(input, source, timing === "round-start" ? { ambusherTiming: "round_start" } : {}) }));
  });
  return { id: row.test_id, troop: id, results };
});

const report: Record<string, unknown> = {
  fixtureSha256: createHash("sha256").update(fixtureBytes).digest("hex"),
  previousFixtureSha256: createHash("sha256").update(previousBytes).digest("hex"),
  seedRule: "timestamp + 1; no seed shifts, simulation averaging, or invented recorded seeds",
  scope: "16 new reports: seven T10 FC4, two T10 FC5, two T10 FC10, five T11 FC10 lancer defenders. All attackers are T10 FC0 infantry.",
  limitations: "Survivor totals only. Custom order hypotheses retain explicitly labelled custom-RNG execution metadata. Research coefficient overrides are not production changes.",
  baseline, schedules, coefficientProbes,
};

if (process.argv.includes("--fit")) {
  const fits = [];
  for (const tier of [10, 11]) {
    const id = `lancer_t${tier}_fc10`, cohort = rows.filter(row => row.defender.troops[id]);
    const reports: ParsedLabReport[] = cohort.map((row, index) => ({ file: String(index), expectedOutcome: expectedScore(row),
      attacker: { troops: { infantry: row.attacker.troops.infantry_t10, lancer: 0, marksman: 0 },
        troopTypes: { infantry: "infantry_t10", lancer: "", marksman: "" }, stats: row.attacker.stats },
      defender: { troops: { infantry: 0, lancer: row.defender.troops[id], marksman: 0 },
        troopTypes: { infantry: "", lancer: id, marksman: "" }, stats: row.defender.stats } }));
    for (const order of ["FAL", "AFL", "ALF", "FLA", "LAF", "LFA"]) {
      const scoreCandidate = (candidate: { lancerAttack: number; lancerHealth: number }, entry: ParsedLabReport) => {
        const row = cohort[Number(entry.file)];
        const result = scheduled(row, withCoefficients(id, candidate.lancerAttack, candidate.lancerHealth), order);
        return result.actual.attacker - result.actual.defender;
      };
      const range = tier === 10 ? { min: 720, max: 810, step: 0.1 } : { min: 830, max: 960, step: 0.1 };
      const coarse = findBestEnemyBaseStats(reports, { lancerHealth: range, objective: "mae", scoreCandidate });
      const h = coarse.best.lancerHealth;
      const refined = findBestEnemyBaseStats(reports, { lancerHealth: { min: h - 0.1, max: h + 0.1, step: 0.001 }, objective: "mae", scoreCandidate });
      fits.push({ tier, order, caseIds: cohort.map(row => row.test_id), range, coarse, refined });
      console.log("Author fit", tier, order, refined.best.lancerAttack, refined.best.lancerHealth, refined.best.reports.map(r => r.error));
    }
  }
  report.authorFits = { script: "scripts/fit_enemy_base_stats.ts", constraint: "attack = 3 * health; defense/lethality = 10",
    objective: "MAE", refinement: "Each coarse optimum +/- 0.1 health, step 0.001", fits };
}

mkdirSync(new URL("reports/", import.meta.url), { recursive: true });
const output = new URL(`reports/lancer-controls${process.argv.includes("--fit") ? "-fit" : ""}.json`, import.meta.url);
writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(output.pathname);
