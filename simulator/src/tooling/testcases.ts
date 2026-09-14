import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadCalibrationComparison,
  type CalibrationCaseComparison,
  type SampleStats,
  sampleStats
} from "./calibration";
import { compareOutcomeDistribution, type ParityComparisonMetrics } from "./parityMetrics";
import { prepareBattle, runPrepared } from "../simulator";
import { replayMk2, type Mk2ReplayOptions, type Mk2ReplayResult } from "../mk2/replay";
import { DamageAggregationError } from "../staticDamageProfile";
import type { BattleInput, BattleResult, FighterInput, SimulationMode, SimulatorConfig, StatBlock, UnitType } from "../types";

const DEFAULT_STOCHASTIC_REPEAT = 500;
const STAT_ROUNDING_MAX_ADJUSTMENT = 0.05;
const STAT_ROUNDING_SCAN_STEPS = 50;
const STAT_ROUNDING_INTERPOLATION_LIMIT = STAT_ROUNDING_SCAN_STEPS;
const DETERMINISTIC_BASE_TOLERANCE_TENTHS_PCT = 2;
const DETERMINISTIC_MAX_TOLERANCE_TENTHS_PCT = 7;

export interface TestcaseRunOptions {
  testcaseRoot?: string;
  calibrationReportPath?: string;
  matching?: string;
  includeDisabled?: boolean;
  repeat?: number;
  seed?: string | number;
  workers?: number;
  includeSamples?: boolean;
}

export interface TestcaseArmyDefinition {
  heroes: Record<string, Record<string, number>>;
  joinerHeroes: Record<string, Record<string, number>>;
  troops: Record<string, number>;
}

export interface TestcaseArmies {
  attacker: TestcaseArmyDefinition;
  defender: TestcaseArmyDefinition;
}

export interface Mk2ObservedOutcome {
  winner?: string | null;
  remaining?: Partial<Record<"attacker" | "defender", Partial<Record<UnitType, number>>>>;
  totals?: Partial<Record<"attacker" | "defender", number>>;
  /** Only explicitly reported counts belong here. An omitted count is unknown. */
  skillProcs?: Partial<Record<"attacker" | "defender", Record<string, number>>>;
}

export interface Mk2ExactComparison {
  exact: boolean;
  outcomeExact: boolean;
  complete: boolean;
  winnerChecked: boolean;
  survivorChecks: number;
  procChecks: Array<{ side: "attacker" | "defender"; reportSkillId: string; expected: number; actual: number | null; exact: boolean }>;
  differences: Array<{ field: string; expected: unknown; actual: unknown }>;
}

export interface TestcaseReplayFields {
  simulationMode?: "mk2";
  replayMetadata?: Mk2ReplayResult["replayMetadata"];
  replayWarnings?: string[];
  exactComparison?: Mk2ExactComparison;
}

export interface TestcaseCaseReport extends TestcaseReplayFields {
  file: string;
  testcaseId: string;
  index: number;
  detailArtifact?: string;
  diagnostics: string[];
  armies?: TestcaseArmies;
  armiesSource?: "testcase" | "retained-result";
  gameResult?: unknown;
  calibration?: CalibrationCaseComparison;
  result?: BattleResult;
  replayInput?: BattleInput;
  replayOptions?: Mk2ReplayOptions;
  simulatorScoreDelta?: number;
  simulatorStats?: SampleStats;
  comparisonSamples?: number[];
  simulatorSampleOutcomes?: TestcaseSampleOutcome[];
  simulatorSampleDeltas?: number[];
  gameStatAdjustment?: TestcaseStatAdjustment;
  deterministic?: boolean;
  sampleCount?: number;
  visibility: {
    attacker: CaseVisibility;
    defender: CaseVisibility;
  };
  error?: string;
  errorDetails?: TestcaseErrorDetails;
}

export interface TestcaseRunWarning {
  file: string;
  testcase_id: string;
  idx: number;
  stage: "parse" | "adapt" | "execute" | "game_comparison" | "baseline_comparison" | "artifact";
  reason: string;
  detailArtifact?: string;
}

export interface TestcaseSummaryEntry extends TestcaseReplayFields {
  file: string;
  testcase_id: string;
  idx: number;
  detailArtifact?: string;
  armies?: TestcaseArmies;
  armiesSource?: "testcase" | "retained-result";
  deterministic: boolean;
  sampleCount: number;
  game: ParityComparisonMetrics | null;
  baseline: ParityComparisonMetrics | null;
  gameStatAdjustment?: TestcaseStatAdjustment;
}

export interface TestcaseRunReport {
  reportKind: "simulator-parity-summary";
  schemaVersion: 1;
  createdAt: string;
  options: TestcaseRunOptions;
  calibrationReportPath?: string;
  artifactRoot?: string;
  chartsArtifact?: string;
  counts: {
    filesFound: number;
    testcasesFound: number;
    executed: number;
    warnings: number;
    errors: number;
    comparedToGame: number;
    comparedToBaseline: number;
  };
  warnings: TestcaseRunWarning[];
  errors: TestcaseRunWarning[];
  testcases: Record<string, TestcaseSummaryEntry>;
  details: TestcaseCaseReport[];
}

export type TestcaseSummaryOutput = Omit<TestcaseRunReport, "details">;

interface CaseVisibility {
  heroes: string[];
  troopSkillIds: string[];
  troops: Partial<Record<UnitType, number>>;
  skillEffectActivations: number;
}

interface TestcaseErrorDetails {
  type: string;
  [key: string]: unknown;
}

export interface PreparedTestcaseCase {
  file: string;
  reportFile: string;
  entry: unknown;
  testcaseId: string;
  index: number;
  detail: TestcaseCaseReport;
  input?: BattleInput;
  replay?: Mk2ReplayOptions;
  key?: string;
  adaptError?: TestcaseRunWarning;
}

export interface TestcaseExecutionJob {
  file: string;
  reportFile: string;
  testcaseId: string;
  index: number;
  input: BattleInput;
  repeat: number;
  seed?: string | number;
  includeSamples?: boolean;
  simulationMode?: SimulationMode;
  replay?: Mk2ReplayOptions;
}

export interface TestcaseExecutionResult extends TestcaseReplayFields {
  testcaseId: string;
  index: number;
  result?: BattleResult;
  deterministic?: boolean;
  sampleCount?: number;
  simulatorStats?: SampleStats;
  simulatorSamples?: number[];
  simulatorScoreDelta?: number;
  simulatorSampleOutcomes?: TestcaseSampleOutcome[];
  simulatorSampleDeltas?: number[];
  diagnostics: string[];
  error?: string;
  errorDetails?: TestcaseErrorDetails;
}

export interface TestcaseSampleOutcome {
  run: number;
  attackerHeroes: string[];
  defenderHeroes: string[];
  attackerTroops: Partial<Record<UnitType, number>>;
  defenderTroops: Partial<Record<UnitType, number>>;
  attackerRemainingByType: Partial<Record<UnitType, number>>;
  defenderRemainingByType: Partial<Record<UnitType, number>>;
  attackerRemaining: number;
  defenderRemaining: number;
  scoreDelta: number;
}

export interface TestcaseStatAdjustment {
  value: number;
  mode: "deterministic_exact" | "deterministic_within_one" | "stochastic_tolerance" | "best_effort";
  unadjusted: ParityComparisonMetrics;
}

export function defaultTestcaseRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "testcases");
}

export function discoverTestcaseFiles(options: Pick<TestcaseRunOptions, "testcaseRoot" | "matching" | "includeDisabled"> = {}): string[] {
  const root = resolve(options.testcaseRoot ?? defaultTestcaseRoot());
  const files: string[] = [];
  walk(root, files);
  return files
    .filter((file) => isDiscoverableTestcaseFile(file, options.includeDisabled))
    .filter((file) => options.includeDisabled || (!file.endsWith(".disabled") && !file.endsWith(".stale_troops")))
    .filter((file) => !options.matching || normalizeReportPath(relative(root, file)).includes(normalizeReportPath(options.matching)))
    .sort();
}

export function runTestcases(options: TestcaseRunOptions, config: SimulatorConfig): TestcaseRunReport {
  const prepared = prepareTestcaseCases(options);
  return runPreparedTestcases(options, config, prepared, (job) => executeTestcaseCase(job, config));
}

export function prepareTestcaseCases(options: TestcaseRunOptions): { filesFound: number; cases: PreparedTestcaseCase[]; parseErrors: TestcaseRunWarning[] } {
  const files = discoverTestcaseFiles(options);
  const cases: PreparedTestcaseCase[] = [];
  const parseErrors: TestcaseRunWarning[] = [];
  for (const file of files) {
    const reportFile = normalizeReportPath(relative(process.cwd(), file));
    let entries: unknown[];
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8"));
      entries = Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      parseErrors.push({ file: reportFile, testcase_id: "(parse_error)", idx: 0, stage: "parse", reason: `Failed to parse JSON: ${errorMessage(error)}` });
      continue;
    }

    entries.forEach((entry, index) => {
      const testcaseId = testcaseIdFor(entry, index);
      const diagnostics: string[] = [];
      const detail = emptyCaseReport(reportFile, testcaseId, index, diagnostics, entry);
      const preparedCase: PreparedTestcaseCase = { file, reportFile, entry, testcaseId, index, detail };
      try {
        preparedCase.replay = testcaseReplayOptions(entry);
        preparedCase.input = adaptTestcaseEntry(entry, { seed: preparedCase.replay ? undefined : options.seed }, diagnostics);
        preparedCase.key = snapshotKey(reportFile, index);
      } catch (error) {
        detail.error = errorMessage(error);
        diagnostics.push(detail.error);
        preparedCase.adaptError = { file: reportFile, testcase_id: testcaseId, idx: index, stage: "adapt", reason: detail.error };
      }
      cases.push(preparedCase);
    });
  }
  return { filesFound: files.length, cases, parseErrors };
}

export function runPreparedTestcases(
  options: TestcaseRunOptions,
  config: SimulatorConfig,
  prepared: { filesFound: number; cases: PreparedTestcaseCase[]; parseErrors: TestcaseRunWarning[] },
  execute: (job: TestcaseExecutionJob, config: SimulatorConfig) => TestcaseExecutionResult
): TestcaseRunReport {
  const comparison = loadCalibrationComparison(options.calibrationReportPath);
  const repeat = normalizeRepeat(options.repeat);
  const report: TestcaseRunReport = {
    reportKind: "simulator-parity-summary",
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    options: { ...options, repeat },
    calibrationReportPath: comparison.reportPath,
    counts: { filesFound: prepared.filesFound, testcasesFound: prepared.cases.length, executed: 0, warnings: 0, errors: 0, comparedToGame: 0, comparedToBaseline: 0 },
    warnings: [],
    errors: [...prepared.parseErrors],
    testcases: {},
    details: []
  };

  for (const preparedCase of prepared.cases) {
    const { file, reportFile, testcaseId, index, detail } = preparedCase;
    if (!preparedCase.input || !preparedCase.key) {
      if (preparedCase.adaptError) report.errors.push(preparedCase.adaptError);
      report.details.push(detail);
      continue;
    }
    try {
      const execution = execute({ file, reportFile, testcaseId, index, input: preparedCase.input, repeat, seed: options.seed, includeSamples: options.includeSamples, replay: preparedCase.replay }, config);
      applyExecutionResult(report, comparison, preparedCase, execution, config);
    } catch (error) {
      detail.error = errorMessage(error);
      detail.errorDetails = errorDetails(error);
      detail.diagnostics.push(detail.error);
      report.errors.push({ file: reportFile, testcase_id: testcaseId, idx: index, stage: "execute", reason: detail.error });
    }
    report.details.push(detail);
  }

  finalizeReport(report);
  return report;
}

export async function runPreparedTestcasesAsync(
  options: TestcaseRunOptions,
  config: SimulatorConfig,
  prepared: { filesFound: number; cases: PreparedTestcaseCase[]; parseErrors: TestcaseRunWarning[] },
  execute: (job: TestcaseExecutionJob) => Promise<TestcaseExecutionResult>
): Promise<TestcaseRunReport> {
  const comparison = loadCalibrationComparison(options.calibrationReportPath);
  const repeat = normalizeRepeat(options.repeat);
  const report: TestcaseRunReport = {
    reportKind: "simulator-parity-summary",
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    options: { ...options, repeat },
    calibrationReportPath: comparison.reportPath,
    counts: { filesFound: prepared.filesFound, testcasesFound: prepared.cases.length, executed: 0, warnings: 0, errors: 0, comparedToGame: 0, comparedToBaseline: 0 },
    warnings: [],
    errors: [...prepared.parseErrors],
    testcases: {},
    details: []
  };

  const jobs = prepared.cases.map(async (preparedCase) => {
    if (!preparedCase.input || !preparedCase.key) return { preparedCase };
    try {
      const execution = await execute({
        file: preparedCase.file,
        reportFile: preparedCase.reportFile,
        testcaseId: preparedCase.testcaseId,
        index: preparedCase.index,
        input: preparedCase.input,
        repeat,
        seed: options.seed,
        includeSamples: options.includeSamples,
        replay: preparedCase.replay
      });
      return { preparedCase, execution };
    } catch (error) {
      return { preparedCase, error };
    }
  });

  for (const { preparedCase, execution, error } of await Promise.all(jobs)) {
    const { reportFile, testcaseId, index, detail } = preparedCase;
    if (!preparedCase.input || !preparedCase.key) {
      if (preparedCase.adaptError) report.errors.push(preparedCase.adaptError);
      report.details.push(detail);
      continue;
    }
    if (error !== undefined) {
      detail.error = errorMessage(error);
      detail.errorDetails = errorDetails(error);
      detail.diagnostics.push(detail.error);
      report.errors.push({ file: reportFile, testcase_id: testcaseId, idx: index, stage: "execute", reason: detail.error });
    } else {
      applyExecutionResult(report, comparison, preparedCase, execution!, config);
    }
    report.details.push(detail);
  }

  finalizeReport(report);
  return report;
}

function applyExecutionResult(
  report: TestcaseRunReport,
  comparison: ReturnType<typeof loadCalibrationComparison>,
  preparedCase: PreparedTestcaseCase,
  execution: TestcaseExecutionResult,
  config: SimulatorConfig
): void {
  const { reportFile, entry, testcaseId, index, detail } = preparedCase;
  if (execution.error) {
    detail.error = execution.error;
    detail.errorDetails = execution.errorDetails;
    detail.diagnostics.push(execution.error);
    report.errors.push({ file: reportFile, testcase_id: testcaseId, idx: index, stage: "execute", reason: execution.error });
    return;
  }
  const result = execution.result;
  if (!result || !execution.simulatorStats || !execution.simulatorSamples || execution.deterministic === undefined || execution.sampleCount === undefined) {
    const reason = "Worker returned incomplete testcase execution result";
    detail.error = reason;
    detail.errorDetails = { type: "IncompleteExecutionResult" };
    detail.diagnostics.push(reason);
    report.errors.push({ file: reportFile, testcase_id: testcaseId, idx: index, stage: "execute", reason });
    return;
  }
  const stats = execution.simulatorStats;
  const gameResult = (entry as { game_report_result?: unknown }).game_report_result;
  const attackerTroops = totalInputTroops(preparedCase.input!.attacker);
  const defenderTroops = totalInputTroops(preparedCase.input!.defender);
  const initialTroops = attackerTroops + defenderTroops;
  const simulatorSamples = execution.simulatorSamples;
  const isMk2 = preparedCase.replay !== undefined;
  const observed = asObject(entry).observed as Mk2ObservedOutcome | undefined;
  const exactComparison = isMk2 ? compareMk2Outcome(observed, result) : undefined;
  const observedScore = isMk2 ? observedOutcomeScore(observed) : undefined;
  const gameSamples = isMk2 ? (observedScore === undefined ? [] : [observedScore]) : extractOutcomeScores(gameResult);
  let game = gameSamples.length > 0
    ? compareOutcomeDistribution({
        candidate: { samples: simulatorSamples },
        reference: { samples: gameSamples },
        initialTroops,
        outcomeRange: { min: -defenderTroops, max: attackerTroops },
        deterministic: isMk2 || result.randomness.deterministic,
        thresholds: comparison.thresholds
      })
    : null;
  if (game && !isMk2) {
    const unroundedBiasRaw = stats.mu - mean(gameSamples);
    game = adjustedForRoundingRules(game, result.randomness.deterministic, initialTroops, result.rounds, unroundedBiasRaw);
  }
  if (game && exactComparison) game = { ...game, passes: exactComparison.exact };
  const gameStatAdjustment = !isMk2 && game && preparedCase.input
    ? findGameStatAdjustment({
        game,
        input: preparedCase.input,
        config,
        job: { file: preparedCase.file, reportFile, testcaseId, index, input: preparedCase.input, repeat: execution.sampleCount, seed: undefined },
        reference: gameSamples,
        initialTroops,
        averageRounds: result.rounds,
        deterministic: result.randomness.deterministic,
        thresholds: comparison.thresholds
      })
    : undefined;
  if (gameStatAdjustment) game = gameStatAdjustment.adjusted;

  detail.result = result;
  if (isMk2) {
    detail.simulationMode = "mk2";
    detail.replayMetadata = execution.replayMetadata;
    detail.replayWarnings = execution.replayWarnings;
    detail.exactComparison = exactComparison;
    detail.replayInput = structuredClone(preparedCase.input!);
    detail.replayOptions = structuredClone(preparedCase.replay!);
    for (const reason of execution.replayWarnings ?? []) {
      report.warnings.push({ file: reportFile, testcase_id: testcaseId, idx: index, stage: "execute", reason });
    }
  }
  detail.deterministic = execution.deterministic;
  detail.sampleCount = execution.sampleCount;
  detail.simulatorStats = stats;
  if (report.options.includeSamples) {
    detail.comparisonSamples = [...(gameStatAdjustment?.samples ?? simulatorSamples)];
  }
  detail.simulatorScoreDelta = execution.simulatorScoreDelta;
  detail.simulatorSampleOutcomes = execution.simulatorSampleOutcomes;
  detail.simulatorSampleDeltas = execution.simulatorSampleDeltas;
  detail.gameStatAdjustment = gameStatAdjustment ? statAdjustmentForReport(gameStatAdjustment) : undefined;
  detail.gameResult = gameResult;
  detail.visibility = visibilityFromResult(result);
  detail.diagnostics.push(...execution.diagnostics);
  if (!game) {
    report.warnings.push({ file: reportFile, testcase_id: testcaseId, idx: index, stage: "game_comparison", reason: isMk2 ? "Missing observed survivors for exact Mk2 comparison" : "Missing game_report_result" });
  }
  report.counts.executed += 1;
  report.testcases[preparedCase.key!] = {
    file: reportFile,
    testcase_id: testcaseId,
    idx: index,
    armies: detail.armies,
    armiesSource: detail.armiesSource,
    deterministic: execution.deterministic,
    sampleCount: execution.sampleCount,
    game,
    baseline: null,
    ...(isMk2 ? {
      simulationMode: "mk2" as const,
      replayMetadata: execution.replayMetadata,
      replayWarnings: execution.replayWarnings,
      exactComparison,
    } : {}),
    ...(gameStatAdjustment ? { gameStatAdjustment: statAdjustmentForReport(gameStatAdjustment) } : {})
  };
}

interface InternalStatAdjustment {
  value: number;
  mode: TestcaseStatAdjustment["mode"];
  unadjusted: ParityComparisonMetrics;
  adjusted: ParityComparisonMetrics;
  samples: number[];
}

function findGameStatAdjustment(options: {
  game: ParityComparisonMetrics;
  input: BattleInput;
  config: SimulatorConfig;
  job: TestcaseExecutionJob;
  reference: number[];
  initialTroops: number;
  averageRounds: number;
  deterministic: boolean;
  thresholds?: Record<string, number>;
}): InternalStatAdjustment | undefined {
  // Deterministic cases correct any nonzero bias; stochastic cases correct only outright misses.
  // Either way a nonzero bias is needed to pick a search direction.
  const shouldCorrect = options.deterministic ? options.game.bias_raw !== 0 : !options.game.passes;
  if (!shouldCorrect || options.game.bias_raw === 0) return undefined;
  const direction = -Math.sign(options.game.bias_raw);
  const maxCandidate = evaluateStatAdjustment(options, direction * STAT_ROUNDING_MAX_ADJUSTMENT);
  let best = maxCandidate;
  if (maxCandidate.mode === "deterministic_exact") return maxCandidate;

  let low = { value: 0, bias: options.game.bias_raw };
  let high = { value: maxCandidate.value, bias: maxCandidate.adjusted.bias_raw };
  if (!biasesBracketZero(low.bias, high.bias)) return maxCandidate;

  const tested = new Set<number>([maxCandidate.value]);
  for (let iteration = 0; iteration < STAT_ROUNDING_INTERPOLATION_LIMIT; iteration += 1) {
    const value = interpolatedZeroAdjustment(low, high);
    if (value === undefined || tested.has(value)) break;
    tested.add(value);

    const candidate = evaluateStatAdjustment(options, value);
    if (correctionScore(candidate.adjusted, options.deterministic) < correctionScore(best.adjusted, options.deterministic)) best = candidate;
    if (candidate.mode === "deterministic_exact") return candidate;

    if (Math.sign(candidate.adjusted.bias_raw) === Math.sign(low.bias)) {
      low = { value: candidate.value, bias: candidate.adjusted.bias_raw };
    } else {
      high = { value: candidate.value, bias: candidate.adjusted.bias_raw };
    }
  }

  return best;
}

function evaluateStatAdjustment(options: {
  game: ParityComparisonMetrics;
  input: BattleInput;
  config: SimulatorConfig;
  job: TestcaseExecutionJob;
  reference: number[];
  initialTroops: number;
  averageRounds: number;
  deterministic: boolean;
  thresholds?: Record<string, number>;
}, value: number): InternalStatAdjustment {
  const adjustedInput = inputWithStatAdjustment(options.input, value);
  const candidateSamples = simulateAdjustedOutcomes(adjustedInput, options.job, options.config);
  const adjusted = compareOutcomeDistribution({
    candidate: { samples: candidateSamples },
    reference: { samples: options.reference },
    initialTroops: options.initialTroops,
    outcomeRange: {
      min: -totalInputTroops(options.input.defender),
      max: totalInputTroops(options.input.attacker)
    },
    deterministic: options.deterministic,
    thresholds: options.thresholds
  });
  return {
    value: roundStatAdjustment(value),
    mode: adjustmentMode(adjusted, options.deterministic),
    unadjusted: options.game,
    adjusted: adjustedForRoundingRules(
      adjusted,
      options.deterministic,
      options.initialTroops,
      options.averageRounds,
      mean(candidateSamples) - mean(options.reference)
    ),
    samples: candidateSamples
  };
}

function biasesBracketZero(first: number, second: number): boolean {
  return first === 0 || second === 0 || Math.sign(first) !== Math.sign(second);
}

function interpolatedZeroAdjustment(low: { value: number; bias: number }, high: { value: number; bias: number }): number | undefined {
  const biasRange = high.bias - low.bias;
  if (biasRange === 0) return undefined;
  const value = low.value - (low.bias * (high.value - low.value)) / biasRange;
  const min = Math.min(low.value, high.value);
  const max = Math.max(low.value, high.value);
  if (value < min || value > max) return undefined;
  return roundStatAdjustment(value);
}

function simulateAdjustedOutcomes(input: BattleInput, job: TestcaseExecutionJob, config: SimulatorConfig): number[] {
  const samples: number[] = [];
  const compiled = prepareBattle(input, config);
  for (let iteration = 0; iteration < job.repeat; iteration += 1) {
    const seed = sampleSeed(job.seed ?? input.seed, job.file, job.testcaseId, job.index, iteration);
    const result = runPrepared(compiled, seed, { mode: "fast" });
    const score = battleScoreDelta(result);
    if (score !== undefined) samples.push(score);
  }
  return samples;
}

function inputWithStatAdjustment(input: BattleInput, value: number): BattleInput {
  const adjusted = structuredClone(input);
  adjustFighterStats(adjusted.attacker, value);
  adjustFighterStats(adjusted.defender, -value);
  return adjusted;
}

function adjustFighterStats(fighter: FighterInput, value: number): void {
  for (const stats of Object.values(fighter.stats ?? {}) as Array<Partial<StatBlock>>) {
    for (const key of ["attack", "defense", "lethality", "health"] as Array<keyof StatBlock>) {
      if (stats[key] === undefined) continue;
      stats[key] = roundStatAdjustment(Number(stats[key]) + value);
    }
  }
}

function adjustmentMode(adjusted: ParityComparisonMetrics, deterministic: boolean): TestcaseStatAdjustment["mode"] {
  if (deterministic) {
    if (adjusted.bias_raw === 0) return "deterministic_exact";
    if (Math.abs(adjusted.bias_raw) <= 1) return "deterministic_within_one";
    return "best_effort";
  }
  return adjusted.passes ? "stochastic_tolerance" : "best_effort";
}

function adjustedForRoundingRules(
  metric: ParityComparisonMetrics,
  deterministic: boolean,
  initialTroops: number,
  averageRounds: number,
  unroundedBiasRaw: number
): ParityComparisonMetrics {
  if (!deterministic) return metric;
  const unroundedBiasPct = Math.abs(unroundedBiasRaw / (initialTroops || 1)) * 100;
  return { ...metric, passes: unroundedBiasPct <= deterministicRoundTolerancePct(averageRounds) };
}

export function deterministicRoundTolerancePct(averageRounds: number): number {
  const completedTenRoundBlocks = Math.max(0, Math.floor(averageRounds / 10));
  const toleranceTenthsPct = DETERMINISTIC_BASE_TOLERANCE_TENTHS_PCT + completedTenRoundBlocks;
  return Math.min(DETERMINISTIC_MAX_TOLERANCE_TENTHS_PCT, toleranceTenthsPct) / 10;
}

function correctionScore(metric: ParityComparisonMetrics, deterministic: boolean): number {
  if (deterministic) return Math.abs(metric.bias_raw);
  if (metric.stat !== null && Number.isFinite(metric.stat)) return Math.abs(metric.stat);
  return Math.abs(metric.bias_raw);
}

function statAdjustmentForReport(adjustment: InternalStatAdjustment): TestcaseStatAdjustment {
  return {
    value: adjustment.value,
    mode: adjustment.mode,
    unadjusted: adjustment.unadjusted
  };
}

function roundStatAdjustment(value: number): number {
  return Number(value.toFixed(3));
}

function finalizeReport(report: TestcaseRunReport): void {
  report.counts.warnings = report.warnings.length;
  report.counts.errors = report.errors.length;
  report.counts.comparedToGame = Object.values(report.testcases).filter((entry) => entry.game).length;
  report.counts.comparedToBaseline = Object.values(report.testcases).filter((entry) => entry.baseline).length;
}

function normalizeRepeat(repeat: number | undefined): number {
  return Math.max(1, repeat ?? DEFAULT_STOCHASTIC_REPEAT);
}

export function executeTestcaseCase(job: TestcaseExecutionJob, config: SimulatorConfig): TestcaseExecutionResult {
  try {
    const samples: number[] = [];
    const sampleOutcomes: TestcaseSampleOutcome[] = [];
    const sampleDeltas: number[] = [];
    if (job.replay !== undefined) {
      // Captured-input replay never samples alternate seeds or adjusts stats to observations.
      const result = replayMk2(job.input, config, job.replay);
      const score = battleScoreDelta(result)!;
      return {
        testcaseId: job.testcaseId, index: job.index, result,
        simulationMode: "mk2", replayMetadata: result.replayMetadata, replayWarnings: result.warnings,
        deterministic: result.randomness.deterministic, sampleCount: 1,
        simulatorStats: sampleStats([score], { includeSamples: job.includeSamples }),
        simulatorSamples: [score], simulatorScoreDelta: score,
        simulatorSampleOutcomes: [sampleOutcome(1, result, score)], simulatorSampleDeltas: [score],
        diagnostics: [...result.resolved.attacker.diagnostics, ...result.resolved.defender.diagnostics],
      };
    }
    // Resolve the battle once and reuse it across every seeded sample of this case.
    const compiled = prepareBattle(job.input, config);
    const baseSeed = job.seed ?? job.input.seed;
    const sample = (iteration: number) => runPrepared(
      compiled,
      sampleSeed(baseSeed, job.file, job.testcaseId, job.index, iteration),
      job.simulationMode ? { mode: job.simulationMode } : {}
    );
    let result = sample(0);
    const firstScore = battleScoreDelta(result);
    if (firstScore !== undefined) {
      samples.push(firstScore);
      sampleOutcomes.push(sampleOutcome(1, result, firstScore));
      sampleDeltas.push(firstScore);
    }
    const sampleCount = result.randomness.deterministic ? 1 : job.repeat;
    for (let iteration = 1; iteration < sampleCount; iteration += 1) {
      result = sample(iteration);
      const score = battleScoreDelta(result);
      if (score !== undefined) {
        samples.push(score);
        if (sampleDeltas.length < 10) {
          sampleOutcomes.push(sampleOutcome(iteration + 1, result, score));
          sampleDeltas.push(score);
        }
      }
    }
    return {
      testcaseId: job.testcaseId,
      index: job.index,
      result,
      deterministic: result.randomness.deterministic,
      sampleCount,
      simulatorStats: sampleStats(samples, { includeSamples: job.includeSamples }),
      simulatorSamples: samples,
      simulatorScoreDelta: battleScoreDelta(result),
      simulatorSampleOutcomes: sampleOutcomes,
      simulatorSampleDeltas: sampleDeltas,
      diagnostics: [...result.resolved.attacker.diagnostics, ...result.resolved.defender.diagnostics]
    };
  } catch (error) {
    return {
      testcaseId: job.testcaseId,
      index: job.index,
      diagnostics: [errorMessage(error)],
      error: errorMessage(error),
      errorDetails: errorDetails(error)
    };
  }
}

export function assignDetailArtifactPaths(report: TestcaseRunReport, artifactRoot: string): void {
  report.artifactRoot = artifactRoot;
  report.details.forEach((detail, index) => {
    const detailArtifact = `${artifactRoot}/cases/${String(index + 1).padStart(6, "0")}.json`;
    detail.detailArtifact = detailArtifact;
    const testcase = report.testcases[snapshotKey(detail.file, detail.index)];
    if (testcase) testcase.detailArtifact = detailArtifact;
    for (const issue of [...report.warnings, ...report.errors]) {
      if (issue.file === detail.file && issue.idx === detail.index && issue.testcase_id === detail.testcaseId) {
        issue.detailArtifact = detailArtifact;
      }
    }
  });
}

export function buildSummaryForOutput(report: TestcaseRunReport): TestcaseSummaryOutput {
  const { details: _details, ...summary } = report;
  return summary;
}

export function adaptTestcaseEntry(
  entry: unknown,
  options: { seed?: string | number } = {},
  diagnostics: string[] = []
): BattleInput {
  const object = entry as {
    attacker?: FighterInput;
    defender?: FighterInput;
    test_id?: string;
    mechanics?: { engagement_type?: unknown; engagementType?: unknown };
    engagement_type?: unknown;
    engagementType?: unknown;
    maxRounds?: unknown;
    max_rounds?: unknown;
  };
  if (!object.attacker || !object.defender) throw new Error(`Testcase ${object.test_id ?? "(unknown)"} is missing attacker or defender`);
  diagnostics.push(...diagnoseFighterShape("attacker", object.attacker), ...diagnoseFighterShape("defender", object.defender));
  const engagementType = engagementTypeFromEntry(object);
  const maxRounds = optionalNumber(object.maxRounds ?? object.max_rounds);
  return {
    attacker: object.attacker,
    defender: object.defender,
    seed: options.seed,
    ...(maxRounds !== undefined ? { maxRounds } : {}),
    ...(engagementType !== undefined ? { engagement_type: engagementType } : {})
  };
}

/** Legacy rows remain legacy; a replay object or explicit mode opts into Mk2. */
export function testcaseReplayOptions(entry: unknown): Mk2ReplayOptions | undefined {
  const object = asObject(entry);
  const mode = object.simulation_mode;
  if (mode !== undefined && mode !== "legacy" && mode !== "mk2") throw new Error(`Unknown simulation_mode: ${String(mode)}`);
  const hasReplay = object.replay !== undefined;
  if (mode === "legacy" && hasReplay) throw new Error("Legacy testcase cannot include Mk2 replay options");
  if (!hasReplay && mode !== "mk2") return undefined;
  if (hasReplay && (!object.replay || typeof object.replay !== "object" || Array.isArray(object.replay))) {
    throw new Error("Testcase replay must be an object");
  }
  const replay = asObject(object.replay);
  // Whitelist options: expected outcomes and arbitrary row fields cannot reach the engine.
  return structuredClone({
    ...(replay.timestamp !== undefined ? { timestamp: replay.timestamp } : {}),
    ...(replay.reportedSeed !== undefined ? { reportedSeed: replay.reportedSeed } : {}),
    ...(replay.timestampSource !== undefined ? { timestampSource: replay.timestampSource } : {}),
    ...(replay.trace !== undefined ? { trace: replay.trace } : {}),
    ...(replay.fc4Volley !== undefined ? { fc4Volley: replay.fc4Volley } : {}),
    ...(replay.fourSourceVolley !== undefined ? { fourSourceVolley: replay.fourSourceVolley } : {}),
    ...(replay.inf5Volley !== undefined ? { inf5Volley: replay.inf5Volley } : {}),
    ...(replay.t10Ambusher !== undefined ? { t10Ambusher: replay.t10Ambusher } : {}),
    ...(replay.globalAmbusher !== undefined ? { globalAmbusher: replay.globalAmbusher } : {}),
    ...(replay.mechanics !== undefined ? { mechanics: replay.mechanics } : {}),
  }) as Mk2ReplayOptions;
}

const REPORT_SKILL_IDS: Record<string, string> = {
  MasterBrawler: "90001", BandsOfSteel: "90002", Charge: "90003", Ambusher: "90004",
  RangedStrike: "90005", Volley: "90006", CrystalShield: "90007", CrystalLance: "90008",
  CrystalGunpowder: "90009", BodyOfLight: "90010", IncandescentField: "90012", FlameCharge: "90013",
};

export function compareMk2Outcome(observed: Mk2ObservedOutcome | undefined, result: BattleResult): Mk2ExactComparison {
  const differences: Mk2ExactComparison["differences"] = [];
  let survivorChecks = 0;
  for (const side of ["attacker", "defender"] as const) for (const unit of ["infantry", "lancer", "marksman"] as const) {
    const expected = observed?.remaining?.[side]?.[unit];
    if (expected === undefined) continue;
    survivorChecks++;
    if (expected !== result.remaining[side][unit]) differences.push({ field: `remaining.${side}.${unit}`, expected, actual: result.remaining[side][unit] });
  }
  const winnerChecked = observed?.winner !== undefined && observed.winner !== null;
  if (winnerChecked && observed!.winner !== result.winner) differences.push({ field: "winner", expected: observed!.winner, actual: result.winner });
  const complete = survivorChecks === 6 && winnerChecked;
  const outcomeExact = complete && differences.length === 0;
  const procChecks: Mk2ExactComparison["procChecks"] = [];
  for (const side of ["attacker", "defender"] as const) {
    for (const [reportSkillId, expected] of Object.entries(observed?.skillProcs?.[side] ?? {})) {
      const skillId = Object.keys(REPORT_SKILL_IDS).find((id) => REPORT_SKILL_IDS[id] === reportSkillId);
      const matched = result.skillReport[side].filter((skill) => skill.skillId === reportSkillId || skill.skillId === skillId);
      const actual = skillId || matched.length ? matched.reduce((n, skill) => n + skill.skillActivations, 0) : null;
      const exact = actual !== null && expected === actual;
      procChecks.push({ side, reportSkillId, expected, actual, exact });
      if (!exact) differences.push({ field: `skillProcs.${side}.${reportSkillId}`, expected, actual });
    }
  }
  return { exact: outcomeExact && differences.length === 0, outcomeExact, complete, winnerChecked, survivorChecks, procChecks, differences };
}

function observedOutcomeScore(observed: Mk2ObservedOutcome | undefined): number | undefined {
  if (!observed?.remaining) return undefined;
  const values = ["attacker", "defender"].map((side) => {
    const units = observed.remaining?.[side as "attacker" | "defender"];
    const counts = [units?.infantry, units?.lancer, units?.marksman];
    return counts.every((count) => typeof count === "number" && Number.isFinite(count))
      ? (counts as number[]).reduce((sum, count) => sum + count, 0) : undefined;
  });
  return values[0] !== undefined && values[1] !== undefined ? values[0] - values[1] : undefined;
}

export function battleScoreDelta(value: unknown): number | undefined {
  if (isBattleResult(value)) return totalSide(value.remaining.attacker) - totalSide(value.remaining.defender);
  const gameResult = Array.isArray(value) ? value[0] : value;
  if (!gameResult || typeof gameResult !== "object") return undefined;
  const attacker = Number((gameResult as { attacker?: unknown }).attacker);
  const defender = Number((gameResult as { defender?: unknown }).defender);
  if (!Number.isFinite(attacker) || !Number.isFinite(defender)) return undefined;
  return attacker - defender;
}

function sampleOutcome(run: number, result: BattleResult, scoreDelta: number): TestcaseSampleOutcome {
  return {
    run,
    attackerHeroes: result.resolved.attacker.heroes.map((hero) => hero.name),
    defenderHeroes: result.resolved.defender.heroes.map((hero) => hero.name),
    attackerTroops: result.resolved.attacker.troops,
    defenderTroops: result.resolved.defender.troops,
    attackerRemainingByType: result.remaining.attacker,
    defenderRemainingByType: result.remaining.defender,
    attackerRemaining: totalSide(result.remaining.attacker),
    defenderRemaining: totalSide(result.remaining.defender),
    scoreDelta
  };
}

function isDiscoverableTestcaseFile(file: string, includeDisabled?: boolean): boolean {
  if (file.endsWith(".json")) return true;
  return !!includeDisabled && (file.endsWith(".json.disabled") || file.endsWith(".json.stale_troops"));
}

function walk(path: string, files: string[]): void {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const child of readdirSync(path)) walk(resolve(path, child), files);
  } else if (stat.isFile()) {
    files.push(path);
  }
}

function emptyCaseReport(
  file: string,
  testcaseId: string,
  index: number,
  diagnostics: string[],
  entry: unknown,
): TestcaseCaseReport {
  return {
    file,
    testcaseId,
    index,
    diagnostics,
    armies: testcaseArmiesFromEntry(entry),
    armiesSource: "testcase",
    visibility: {
      attacker: { heroes: [], troopSkillIds: [], troops: {}, skillEffectActivations: 0 },
      defender: { heroes: [], troopSkillIds: [], troops: {}, skillEffectActivations: 0 }
    }
  };
}

export function testcaseArmiesFromEntry(entry: unknown): TestcaseArmies {
  const testcase = asObject(entry);
  return {
    attacker: armyDefinition(testcase.attacker),
    defender: armyDefinition(testcase.defender),
  };
}

function armyDefinition(value: unknown): TestcaseArmyDefinition {
  const army = asObject(value);
  const heroes: Record<string, Record<string, number>> = {};
  const joinerHeroes: Record<string, Record<string, number>> = {};
  for (const [name, skills] of Object.entries(asObject(army.heroes))) {
    heroes[name] = numericRecord(skills);
  }
  for (const [name, skills] of Object.entries(asObject(army.joiner_heroes))) {
    joinerHeroes[name] = numericRecord(skills);
  }
  return {
    heroes,
    joinerHeroes,
    troops: numericRecord(army.troops),
  };
}

function numericRecord(value: unknown): Record<string, number> {
  const numbers: Record<string, number> = {};
  for (const [key, candidate] of Object.entries(asObject(value))) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      numbers[key] = candidate;
    }
  }
  return numbers;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function testcaseIdFor(entry: unknown, index: number): string {
  const id = (entry as { test_id?: unknown; id?: unknown }).test_id ?? (entry as { id?: unknown }).id;
  return id === undefined ? `case_${index}` : String(id);
}

function diagnoseFighterShape(side: string, fighter: FighterInput): string[] {
  const diagnostics: string[] = [];
  if (!fighter.troops || Object.keys(fighter.troops).length === 0) diagnostics.push(`${side} has no troops`);
  if (!fighter.stats) diagnostics.push(`${side} has no stats block`);
  return diagnostics;
}

function engagementTypeFromEntry(entry: {
  mechanics?: { engagement_type?: unknown; engagementType?: unknown };
  engagement_type?: unknown;
  engagementType?: unknown;
}): string | undefined {
  const value =
    entry.engagement_type ?? entry.engagementType ?? entry.mechanics?.engagement_type ?? entry.mechanics?.engagementType;
  return value === undefined ? undefined : String(value);
}

function visibilityFromResult(result: BattleResult | undefined): TestcaseCaseReport["visibility"] {
  if (!result) {
    return {
      attacker: { heroes: [], troopSkillIds: [], troops: {}, skillEffectActivations: 0 },
      defender: { heroes: [], troopSkillIds: [], troops: {}, skillEffectActivations: 0 }
    };
  }
  return {
    attacker: {
      heroes: result.resolved.attacker.heroes.map((hero) => hero.name),
      troopSkillIds: result.resolved.attacker.troopSkillIds,
      troops: result.resolved.attacker.troops,
      skillEffectActivations: result.effectActivationCounts.attacker
    },
    defender: {
      heroes: result.resolved.defender.heroes.map((hero) => hero.name),
      troopSkillIds: result.resolved.defender.troopSkillIds,
      troops: result.resolved.defender.troops,
      skillEffectActivations: result.effectActivationCounts.defender
    }
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function errorDetails(error: unknown): TestcaseErrorDetails | undefined {
  if (error instanceof DamageAggregationError) {
    return {
      type: error.name,
      groupId: error.groupId,
      netPct: error.netPct,
      factor: error.factor,
      contributors: error.contributors
    };
  }
  if (error instanceof Error) return { type: error.name };
  return undefined;
}

function optionalNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function isBattleResult(value: unknown): value is BattleResult {
  return !!value && typeof value === "object" && "remaining" in value;
}

function totalSide(troops: Record<UnitType, number>): number {
  return (troops.infantry ?? 0) + (troops.lancer ?? 0) + (troops.marksman ?? 0);
}

function sampleSeed(baseSeed: string | number | undefined, file: string, testcaseId: string, index: number, iteration: number): string {
  return `${baseSeed ?? "simulator-default"}:${relative(process.cwd(), file)}:${testcaseId}:${index}:${iteration}`;
}

function snapshotKey(filePath: string, index: number): string {
  return `${normalizeReportPath(filePath)}#${index}`;
}

function normalizeReportPath(filePath: string): string {
  const normalized = filePath.replaceAll("\\", "/");
  const testcaseIndex = normalized.indexOf("testcases/");
  return testcaseIndex >= 0 ? normalized.slice(testcaseIndex) : normalized;
}

function extractOutcomeScores(value: unknown): number[] {
  const rows = Array.isArray(value) ? value : value ? [value] : [];
  return rows
    .map((row) => battleScoreDelta(row))
    .filter((score): score is number => score !== undefined);
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function totalInputTroops(fighter: FighterInput): number {
  return Object.values(fighter.troops ?? {}).reduce((sum, count) => sum + Number(count || 0), 0);
}
