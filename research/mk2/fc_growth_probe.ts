/** Compare proposed FC6-8 +5%, FC9-10 +2.5%, and tier-before-FC rounding. */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { loadSimulatorConfig } from "../../simulator/src/config-node";
import { mk2Config } from "../../simulator/src/mk2/mechanics";
import { prepareBattle, runPrepared } from "../../simulator/src/simulator";
import { adaptTestcaseEntry } from "../../simulator/src/tooling/testcases";
import { createTroopStatsRecord, fireCrystalMultiplier, generateTroopStats } from "../../simulator/src/troopStats";
import type { SimulatorConfig, UnitType } from "../../simulator/src/types";

type Curve = "current" | "proposed";
type Rounding = "native" | "round-final" | "fc5-anchor-final-round" | "fc5-anchor-each-round";
type T12 = "provisional" | "20-after-fc" | "20-before-fc" | "round-tier-before-fc";
type T11 = "labyrinth" | "t10-times-1.2-rounded" | "t10-times-1.2-unrounded";
type Model = { curve: Curve; rounding: Rounding; t11: T11; t12: T12 };
const config = loadSimulatorConfig(), originalConfig = JSON.stringify(config);
const fixtureHashes: Record<string, string> = {};
const fixture = (name: string): any => {
  const bytes = readFileSync(new URL(`fixtures/${name}.json`, import.meta.url));
  fixtureHashes[name] = createHash("sha256").update(bytes).digest("hex");
  return JSON.parse(bytes.toString("utf8"));
};
const original = fixture("lancer-fc10"), prior = fixture("lancer-followup"), latest = fixture("lancer-fc45-controls");
const points = fixture("troop-table-points").rows;
const cases = [...original, ...prior, ...latest];
const factor = (fc: number, curve: Curve) => curve === "current" || fc <= 5 ? fireCrystalMultiplier(fc) :
  fireCrystalMultiplier(5) * 1.05 ** (Math.min(fc, 8) - 5) * 1.025 ** Math.max(fc - 8, 0);
function tierBase(type: UnitType, tier: number, model: Model) {
  if (tier !== 11 || model.t11 === "labyrinth") return generateTroopStats(type, tier, 0).stats;
  const base = generateTroopStats(type, 10, 0).stats;
  const round = model.t11 === "t10-times-1.2-rounded" ? Math.round : (x: number) => x;
  return { ...base, attack: round(base.attack * 1.2), health: round(base.health * 1.2) };
}
function sourceFor(model: Model): SimulatorConfig {
  const source = { ...config }, normalized = mk2Config(source);
  for (const [id, troop] of Object.entries(normalized.troopStats)) {
    if (troop.fc === 0 || troop.tier > 11) continue;
    const base = tierBase(troop.type, troop.tier, model);
    const round = model.rounding === "native" && troop.tier <= 10 ? Math.floor : Math.round;
    let attack = round(base.attack * factor(troop.fc, model.curve));
    let health = round(base.health * factor(troop.fc, model.curve));
    if (model.rounding.startsWith("fc5-anchor") && troop.fc > 5) {
      const table = points.find((row: any) => row.type === troop.type && row.tier === troop.tier && row.fc === 5 && row.tier <= 10);
      const anchor = table?.points ?? { attack: Math.round(base.attack * fireCrystalMultiplier(5)), health: Math.round(base.health * fireCrystalMultiplier(5)) };
      attack = anchor.attack; health = anchor.health;
      for (let level = 6; level <= troop.fc; level++) {
        const step = model.curve === "proposed" ? level <= 8 ? 1.05 : 1.025 : level <= 7 ? 1.05 : 1.04;
        attack *= step; health *= step;
        if (model.rounding === "fc5-anchor-each-round") { attack = Math.round(attack); health = Math.round(health); }
      }
      attack = Math.round(attack); health = Math.round(health);
    }
    normalized.troopStats[id] = createTroopStatsRecord({ ...troop, stats: { ...troop.stats, attack, health } });
  }
  if (model.t12 !== "provisional") {
    const base = tierBase("lancer", 11, model);
    const t11 = normalized.troopStats.lancer_t11_fc10.stats;
    const f = factor(10, model.curve);
    let attack: number, health: number;
    if (model.t12 === "20-after-fc") {
      attack = Math.round(t11.attack * 1.2); health = Math.round(t11.health * 1.2);
    } else if (model.t12 === "20-before-fc") {
      attack = Math.round(base.attack * 1.2 * f); health = Math.round(base.health * 1.2 * f);
    } else {
      attack = Math.round(Math.round(base.attack * 1.2) * f);
      health = Math.round(Math.round(base.health * 1.2) * f);
    }
    const troop = normalized.troopStats.lancer_t12_fc10;
    normalized.troopStats[troop.id] = createTroopStatsRecord({ ...troop, stats: { ...troop.stats, attack, health } });
  }
  return source;
}
function group(row: any): string {
  if (original.some((r: any) => r.test_id === row.test_id)) return "original-six";
  if (row.attacker.heroes?.length || row.defender.heroes?.length) return "heroes";
  if (Object.keys(row.attacker.troops).length > 1 || Object.keys(row.defender.troops).length > 1) return "mixed";
  const id = Object.keys(row.defender.troops)[0];
  if (id === "lancer_t12_fc10") return row.attacker.troops.infantry_t10 ? "prior-t12-infantry" : "prior-t12-lancer";
  return id;
}
const models: Model[] = [];
for (const curve of ["current", "proposed"] as const)
  for (const rounding of ["native", "round-final"] as const)
    for (const t12 of ["provisional", "20-after-fc", "20-before-fc", "round-tier-before-fc"] as const)
      models.push({ curve, rounding, t11: "labyrinth", t12 });
for (const rounding of ["fc5-anchor-final-round", "fc5-anchor-each-round"] as const)
  models.push({ curve: "proposed", rounding, t11: "labyrinth", t12: "provisional" });
for (const curve of ["current", "proposed"] as const) {
  for (const t11 of ["t10-times-1.2-rounded", "t10-times-1.2-unrounded"] as const)
    for (const t12 of ["provisional", "round-tier-before-fc"] as const)
      models.push({ curve, rounding: "native", t11, t12 });
  models.push({ curve, rounding: "round-final", t11: "t10-times-1.2-rounded", t12: "round-tier-before-fc" });
  models.push({ curve, rounding: "round-final", t11: "t10-times-1.2-unrounded", t12: "20-before-fc" });
}
const simulations = models.flatMap(model => {
  const source = sourceFor(model), normalized = mk2Config(source);
  const coefficients = Object.fromEntries(["lancer_t10_fc8", "lancer_t10_fc9", "lancer_t10_fc10", "infantry_t11_fc9", "lancer_t11_fc10", "lancer_t12_fc10"]
    .map(id => [id, normalized.troopStats[id].stats]));
  return (["current", "round-start"] as const).map(timing => {
    const results = cases.map(row => {
      const compiled = prepareBattle(adaptTestcaseEntry(row), source);
      const result = runPrepared(compiled, undefined, { mode: "fast", ...(timing === "round-start" ? { ambusherTiming: "round_start" as const } : {}) });
      const sum = (x: Record<string, number>) => Object.values(x).reduce((a, b) => a + b, 0);
      const actual = { attacker: sum(result.remaining.attacker), defender: sum(result.remaining.defender) }, expected = row.game_report_result[0];
      if (result.execution?.seed !== String(BigInt(row.timestamp) + 1n)) throw new Error("Seed mismatch");
      if (compiled.fighters.attacker.diagnostics.length || compiled.fighters.defender.diagnostics.length) throw new Error("Input diagnostics");
      return { id: row.test_id, group: group(row), expected, actual, rounds: result.rounds,
        exact: expected.attacker === actual.attacker && expected.defender === actual.defender,
        error: actual.attacker - actual.defender - expected.attacker + expected.defender,
        seed: result.execution.seed, timestampStatus: result.execution.timestampStatus };
    });
    const summary = (data: typeof results) => ({ cases: data.length, exact: data.filter(r => r.exact).length,
      absoluteError: data.reduce((a, r) => a + Math.abs(r.error), 0) });
    const groups = Object.fromEntries([...new Set(results.map(r => r.group))].map(g => [g, summary(results.filter(r => r.group === g))]));
    const knownHighFC = summary(results.filter(r => ["lancer_t10_fc9", "lancer_t10_fc10", "infantry_t11_fc9", "lancer_t11_fc10"].includes(r.group)));
    const knownT11 = summary(results.filter(r => ["infantry_t11_fc9", "lancer_t11_fc10"].includes(r.group)));
    const knownT10 = summary(results.filter(r => ["lancer_t10_fc9", "lancer_t10_fc10"].includes(r.group)));
    console.log(model.curve, model.rounding, model.t11, model.t12, timing, "known FC9/10", knownHighFC, "T12 infantry", groups["prior-t12-infantry"], "original", groups["original-six"]);
    return { ...model, timing, coefficients, groups, knownHighFC, knownT11, knownT10, results };
  });
});
if (JSON.stringify(config) !== originalConfig) throw new Error("Source config mutated");
const factors = Array.from({ length: 6 }, (_, i) => i + 5).map(fc => ({ fc, current: factor(fc, "current"), proposed: factor(fc, "proposed"), relativeChangePct: 100 * (factor(fc, "proposed") / factor(fc, "current") - 1) }));
writeFileSync(new URL("reports/fc-growth-probe.json", import.meta.url), JSON.stringify({ fixtureHashes,
  interpretation: "FC1-FC5 growth retained; FC6-FC8 +5% per level; FC9-FC10 +2.5%. User clarified tier multiplier means T11 = T10 x1.20. Models compare the Labyrinth anchor with rounded/unrounded T10 x1.20, then optionally T12 = another x1.20. Rounded tier values are formed before the FC multiplier; unrounded variants test omitting that inner rounding. The Labyrinth FC0 catalogue entry itself is retained for compatibility.",
  limitations: "Rounding and curve hypotheses only; current and round-start Ambusher timings are evaluated, without fitting coefficients or altering seeds. Table T11 values are not substituted. FC5 anchor variants use supplied T10 FC5 Points and the selected T11 model. Round-final variants also restore the original generator's rounding for lower FC tiers; these are diagnostic, not production changes.",
  factors, simulations }, null, 2) + "\n");
