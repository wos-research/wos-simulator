/** Compare the integration branch and one isolated FC5 Lancer health diagnostic. */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadSimulatorConfig} from '../../simulator/src/config-node';
import {createTroopStatsRecord, generateTroopStats} from '../../simulator/src/troopStats';
import {createMk2Config, normalizeMechanics} from '../../simulator/src/mk2/mechanics';
import {MK2_VERSION} from '../../simulator/src/mk2/replay';
import {executeTestcaseCase, prepareTestcaseCases, runPreparedTestcases} from '../../simulator/src/tooling/testcases';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const options = {testcaseRoot: resolve(root, 'testcases/mk2'), repeat: 5, includeSamples: true};
const config = loadSimulatorConfig();
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const corpus = prepareTestcaseCases(options);
const fixtureHashes = Object.fromEntries([...new Set(corpus.cases.map(c => c.file))].map(file =>
  [relative(root, file), createHash('sha256').update(readFileSync(file)).digest('hex')]));

function run(variant: 'current' | 'fc5-lancer-health-597' | 'fc3-lancer-attack-1624' | 't10-fc1-5-nearest') {
  const prepared = prepareTestcaseCases(options);
  let candidate = config;
  if (variant !== 'current') {
    candidate = createMk2Config(config, normalizeMechanics());
    for (const [id, troop] of Object.entries(candidate.troopStats)) {
      if (variant === 'fc5-lancer-health-597' && id === 'lancer_t10_fc5') {
        candidate.troopStats[id] = createTroopStatsRecord({...troop, stats: {...troop.stats, health: 597}});
      } else if (variant === 'fc3-lancer-attack-1624' && id === 'lancer_t10_fc3') {
        candidate.troopStats[id] = createTroopStatsRecord({...troop, stats: {...troop.stats, attack: 1624}});
      } else if (variant === 't10-fc1-5-nearest' && troop.tier === 10 && troop.fc >= 1 && troop.fc <= 5) {
        const original = generateTroopStats(troop.type, troop.tier, troop.fc).stats;
        candidate.troopStats[id] = createTroopStatsRecord({...troop, stats: {...troop.stats,
          attack: original.attack, health: original.health}});
      }
    }
    // The candidate already contains Mk2's effective catalogue. Prevent re-flooring
    // only; preserve every other per-case option and the captured seed/timestamp.
    for (const c of prepared.cases) if (c.replay) c.replay.mechanics = {
      ...c.replay.mechanics, fcRounding: 'nearest', catalogueCorrections: 'none'
    };
  }
  const report = runPreparedTestcases(options, candidate, prepared, executeTestcaseCase);
  const cases = report.details.map((detail, i) => {
    const entry = prepared.cases[i].entry as {observed?: {totals?: Record<string, number>}; cohort?: string};
    const expected = entry.observed?.totals;
    const result = detail.result;
    const totals = result && Object.fromEntries(['attacker', 'defender'].map(side =>
      [side, Object.values(result.remaining[side as 'attacker' | 'defender']).reduce((a, b) => a + b, 0)]));
    const absoluteSurvivorError = expected && totals && ['attacker', 'defender'].reduce((n, side) => n + Math.abs(expected[side] - totals[side]), 0);
    return {file: relative(root, prepared.cases[i].file), testId: detail.testcaseId, cohort: entry.cohort,
      error: detail.error ?? null, exact: detail.exactComparison?.exact ?? false,
      complete: detail.exactComparison?.complete ?? false, expectedTotals: expected, actualTotals: totals,
      absoluteSurvivorError, sampleCount: detail.sampleCount, differences: detail.exactComparison?.differences,
      procChecks: detail.exactComparison?.procChecks.length ?? 0,
      metadata: detail.replayMetadata, warnings: detail.replayWarnings,
      battleHash: result ? hash({winner: result.winner, rounds: result.rounds, remaining: result.remaining,
        skillReport: result.skillReport, rng: (result as any).rng}) : null};
  });
  const files = [...new Set(cases.map(c => c.file))].map(file => {
    const group = cases.filter(c => c.file === file);
    return {file, cases: group.length, exact: group.filter(c => c.exact).length,
      errors: group.filter(c => c.error).length, absoluteSurvivorError: group.reduce((n, c) => n + (c.absoluteSurvivorError ?? 0), 0)};
  });
  return {variant, counts: report.counts, files, cases};
}

const variants = [run('current'), run('fc5-lancer-health-597'), run('fc3-lancer-attack-1624'), run('t10-fc1-5-nearest')];
const current = variants[0];
const comparisons = variants.slice(1).map(v => ({variant: v.variant,
  changed: v.cases.flatMap((c, i) => c.battleHash !== current.cases[i].battleHash
    ? [{file: c.file, testId: c.testId, beforeExact: current.cases[i].exact, afterExact: c.exact,
      before: current.cases[i].actualTotals, after: c.actualTotals, expected: c.expectedTotals}] : []),
  regressions: v.cases.filter((c, i) => current.cases[i].exact && !c.exact).map(c => c.testId)
}));
const output = {version: MK2_VERSION, reviewedCommit: process.env.REVIEW_COMMIT ?? execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(), seedRule: 'timestamp + 1 when no independently recorded seed is supplied',
  fixtureHashes, variants: variants.map(v => ({...v, cases: v.cases.filter(c => c.file.includes('report_inbox') || !c.exact)})), comparisons};
writeFileSync(resolve(root, 'research/mk2/integration-review-results.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({version: MK2_VERSION, variants: variants.map(({variant, counts, files}) => ({variant, counts, files})), comparisons}, null, 2));
