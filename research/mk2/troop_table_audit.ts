/** Compare user-supplied Points tables with the original generator and Mk2 normalization. */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { loadSimulatorConfig } from "../../simulator/src/config-node";
import { mk2Config } from "../../simulator/src/mk2/mechanics";
import { prepareBattle, runPrepared } from "../../simulator/src/simulator";
import { adaptTestcaseEntry } from "../../simulator/src/tooling/testcases";
import { createTroopStatsRecord, fireCrystalMultiplier, generateTroopStats } from "../../simulator/src/troopStats";
import type { StatBlock, UnitType } from "../../simulator/src/types";

type TableRow = { type: UnitType; tableLevel: string; tier: number; fc: number; points: StatBlock };
const bytes = readFileSync(new URL("fixtures/troop-table-points.json", import.meta.url));
const fixture = JSON.parse(bytes.toString("utf8")) as { source: string; levelInterpretation: string; rows: TableRow[] };
const config = loadSimulatorConfig(), normalized = mk2Config(config);
const keys = ["attack", "defense", "health", "lethality"] as const;
const difference = (actual: StatBlock, expected: StatBlock) => Object.fromEntries(keys
  .filter(key => actual[key] !== expected[key]).map(key => [key, { table: expected[key], simulator: actual[key], delta: actual[key] - expected[key] }]));
const rows = fixture.rows.map(row => {
  const generated = generateTroopStats(row.type, row.tier, row.fc);
  const original = config.troopStats[generated.id], mk2 = normalized.troopStats[generated.id];
  const tableBase = fixture.rows.find(base => base.type === row.type && base.tier === row.tier && base.fc === 0)!;
  const tableBaseReconstruction = { ...tableBase.points,
    attack: Math.round(tableBase.points.attack * fireCrystalMultiplier(row.fc)),
    health: Math.round(tableBase.points.health * fireCrystalMultiplier(row.fc)) };
  return { ...row, id: generated.id, catalogued: Boolean(original),
    generated: generated.stats, generatedDifferences: difference(generated.stats, row.points),
    mk2: mk2?.stats ?? null, mk2Differences: mk2 ? difference(mk2.stats, row.points) : null,
    tableBaseReconstruction, tableBaseReconstructionDifferences: difference(tableBaseReconstruction, row.points) };
});
function summary(selected: typeof rows) {
  return { tableRows: selected.length, cataloguedRows: selected.filter(row => row.catalogued).length,
    generatorMismatchingRows: selected.filter(row => Object.keys(row.generatedDifferences).length).length,
    generatorMismatchingCells: selected.reduce((sum, row) => sum + Object.keys(row.generatedDifferences).length, 0),
    mk2MismatchingRows: selected.filter(row => row.mk2Differences && Object.keys(row.mk2Differences).length).length,
    mk2MismatchingCells: selected.reduce((sum, row) => sum + Object.keys(row.mk2Differences ?? {}).length, 0) };
}
const summaries = {
  tiers1to10FC0: summary(rows.filter(row => row.tier <= 10 && row.fc === 0)),
  t10FC1to5: summary(rows.filter(row => row.tier === 10 && row.fc > 0)),
  t11: summary(rows.filter(row => row.tier === 11)),
};
console.log(summaries);
for (const row of rows.filter(row => row.mk2Differences && Object.keys(row.mk2Differences).length))
  console.log(row.id, "table", row.points.attack, row.points.health, "generator", row.generated.attack, row.generated.health, "mk2", row.mk2?.attack, row.mk2?.health);

const controls = JSON.parse(readFileSync(new URL("fixtures/controlled.json", import.meta.url), "utf8"));
const newReports = JSON.parse(readFileSync(new URL("fixtures/lancer-fc45-controls.json", import.meta.url), "utf8"));
const previous = JSON.parse(readFileSync(new URL("fixtures/lancer-followup.json", import.meta.url), "utf8"));
const sum = (x: Record<string, number>) => Object.values(x).reduce((a, b) => a + b, 0);
const replayChecks = ["current", "t10-table-only", "all-tiers-rounded"].map(variant => {
  const source = { ...config }, adjusted = mk2Config(source);
  if (variant === "t10-table-only") {
    for (const row of rows.filter(row => row.tier === 10 && row.fc > 0)) {
      const troop = adjusted.troopStats[row.id];
      adjusted.troopStats[row.id] = createTroopStatsRecord({ ...troop, stats: row.points });
    }
  } else if (variant === "all-tiers-rounded") {
    for (const [id, troop] of Object.entries(adjusted.troopStats)) {
      if (troop.tier > 10 || troop.fc === 0) continue;
      adjusted.troopStats[id] = config.troopStats[id];
    }
  }
  const cohort = (data: any[], controlled: boolean) => {
    const results = data.map(row => {
      const result = runPrepared(prepareBattle(adaptTestcaseEntry(row), source), undefined, { mode: "fast" });
      const expected = controlled ? row.observed.totals : row.game_report_result[0];
      const actual = { attacker: sum(result.remaining.attacker), defender: sum(result.remaining.defender) };
      const exactTotals = actual.attacker === expected.attacker && actual.defender === expected.defender;
      const exact = exactTotals && (!controlled || (["attacker", "defender"] as const).every(side =>
        (["infantry", "lancer", "marksman"] as const).every(unit => result.remaining[side][unit] === row.observed.remaining[side][unit])));
      return { id: row.id ?? row.test_id, expected, actual, exact,
        error: actual.attacker - actual.defender - expected.attacker + expected.defender,
        execution: result.execution };
    });
    return { cases: results.length, exact: results.filter(row => row.exact).length,
      absoluteError: results.reduce((a, row) => a + Math.abs(row.error), 0), results };
  };
  const result = { variant, controlled: cohort(controls, true), newReports: cohort(newReports, false), previousReports: cohort(previous, false) };
  console.log("Replay", variant, "controlled", result.controlled.exact, "new", result.newReports.exact, "previous", result.previousReports.exact);
  return result;
});
const report = { fixtureSha256: createHash("sha256").update(bytes).digest("hex"),
  source: fixture.source, levelInterpretation: fixture.levelInterpretation,
  notes: ["Comparisons are against the supplied screenshots, not proof of universal game constants.",
    "No table rows above FC5 or for T12 are supplied.",
    "T11 FC0 is explicitly Labyrinth-only in the catalogue; generated T11 FC1-FC4 values are hypothetical and not catalogued.",
    "Replay checks compare survivor counts, not recorded skill-proc counts. No production coefficients are changed by this script."],
  summaries, rows, replayChecks };
writeFileSync(new URL("reports/troop-table-audit.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
