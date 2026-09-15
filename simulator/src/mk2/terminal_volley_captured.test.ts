import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

import { loadSimulatorConfig } from "../config-node";
import { prepareBattle } from "../prepare";
import { adaptTestcaseEntry, compareMk2Outcome, testcaseReplayOptions } from "../tooling/testcases";
import { createBattleRng } from "./battle_rng";
import { createMk2Config, normalizeMechanics } from "./mechanics";
import { replayMk2 } from "./replay";
import { createScopedTerminalVolley } from "./scoped_terminal_volley";

// These observations constrain only the exact captured contexts, not a universal rule.
const fixtureDir = new URL("../../../testcases/mk2/", import.meta.url);
const prefix = "mk2-locked-terminal-20260914-";
const fixtureFiles = readdirSync(fixtureDir).filter(name => /^mk2-locked-terminal-20260914-\d{3}\.json$/.test(name)).sort();
assert.equal(fixtureFiles.length, 30);
const fixtures = fixtureFiles.map(name => JSON.parse(readFileSync(new URL(name, fixtureDir), "utf8")));
assert.deepEqual(fixtures.map(f => f.test_id), Array.from({ length: 30 }, (_, i) => prefix + String(i + 1).padStart(3, "0")));
const config = loadSimulatorConfig();
const runs = fixtures.map(fixture => {
  const input = adaptTestcaseEntry(fixture);
  const options = testcaseReplayOptions(fixture)!;
  return { fixture, input, options };
});
const cached = new Map<string, { trace: ReturnType<typeof replayMk2>; standard: ReturnType<typeof replayMk2> }>();
function results(row: typeof runs[number]) {
  let result = cached.get(row.fixture.test_id);
  if (!result) {
    const before = structuredClone({ fixture: row.fixture, input: row.input, options: row.options, config });
    result = {
      trace: replayMk2(row.input, config, { ...row.options, trace: true }),
      standard: replayMk2(row.input, config, { ...row.options, trace: false }),
    };
    assert.deepEqual({ fixture: row.fixture, input: row.input, options: row.options, config }, before, "preserve complete original request and configuration");
    cached.set(row.fixture.test_id, result);
  }
  return result;
}
function terminal(result: ReturnType<typeof replayMk2>): any {
  const metadata = (result.replayMetadata as any).terminalVolley;
  assert.ok(metadata, "exact captured context must activate the scoped adapter");
  return metadata;
}

test("30 captured terminal/source-death reports: winner, six survivors and 150 explicit counters in both modes", () => {
  const explicitChecks = { trace: 0, standard: 0 };
  for (const row of runs) {
    const { trace, standard } = results(row);
    for (const [mode, result] of Object.entries({ trace, standard })) {
      const comparison = compareMk2Outcome(row.fixture.observed, result);
      assert.equal(comparison.complete, true, row.fixture.test_id);
      assert.equal(comparison.winnerChecked, true);
      assert.equal(comparison.survivorChecks, 6);
      assert.equal(comparison.procChecks.length, 5);
      assert.equal(comparison.exact, true, JSON.stringify({ id: row.fixture.test_id, mode, comparison }));
      assert.ok(comparison.procChecks.every(check => check.exact));
      explicitChecks[mode as keyof typeof explicitChecks] += comparison.procChecks.length;
      const metadata = terminal(result);
      assert.equal(metadata.normalAttackSlotsUnchanged, true);
      assert.equal(metadata.reservations.length, result.rounds);
      assert.ok(metadata.volleyReservations.every((reservation: any) => reservation.status !== "pending"));
    }
    for (const key of ["winner", "rounds", "remaining", "effectActivationCounts", "extraSkillAttackJobsByEffect", "attackControlCounts"] as const) {
      assert.deepEqual(trace[key], standard[key], row.fixture.test_id + " mode parity: " + key);
    }
    // Event lists and triggersSeen are intentionally trace-only; native totals and accounting are not.
    const { events: traceEvents, ...traceRng } = trace.rng;
    const { events: standardEvents, ...standardRng } = standard.rng;
    assert.deepEqual(traceRng, standardRng, "full native RNG metadata excluding trace-only events");
    assert.deepEqual(terminal(trace), terminal(standard));
  }
  assert.deepEqual(explicitChecks, { trace: 150, standard: 150 });
});

test("real unused Volley and dead-Lancer witnesses retain report credits without inventing attacks", () => {
  const unused = new Map([[12, 1], [26, 1]]);
  const dead = new Map([[2, 2], [3, 5], [4, 3], [5, 2], [6, 4], [7, 1], [8, 4], [9, 2], [10, 2]]);
  let unusedTotal = 0;
  let deadTotal = 0;
  for (const [index, row] of runs.entries()) {
    const result = results(row).trace;
    const metadata = terminal(result);
    const unusedCredits = metadata.volleyReservations.filter((reservation: any) => reservation.status === "unused" && reservation.passed && reservation.credited);
    assert.equal(unusedCredits.length, unused.get(index + 1) ?? 0, row.fixture.test_id);
    assert.equal(metadata.successfulUnusedCredited, unusedCredits.length);
    unusedTotal += unusedCredits.length;
    const deadCredits = metadata.reservations.filter((reservation: any) => !reservation.aliveAtRoundStart && reservation.credited);
    assert.equal(deadCredits.length, dead.get(index + 1) ?? 0, row.fixture.test_id);
    deadTotal += deadCredits.length;
    for (const reservation of deadCredits) {
      assert.equal(reservation.passed, true);
      assert.equal(reservation.cacheConsumed, false);
      assert.equal(reservation.roundStartTroops[metadata.mixedSide].lancer, 0);
      assert.ok(!(result.attacks ?? []).some(attack => attack.round === reservation.round && attack.dealerSide === metadata.mixedSide && attack.dealerUnit === "lancer"), "no Lancer attack after source death");
    }
    for (const reservation of unusedCredits) {
      assert.ok(!(result.attacks ?? []).some(attack => attack.round === reservation.round && attack.dealerSide === metadata.mixedSide && attack.dealerUnit === "marksman"), "unused Volley has no Marksman attack slot");
    }
  }
  assert.equal(unusedTotal, 2);
  assert.equal(deadTotal, 25);
});

test("missing or unrecognized raw context falls back; default 1500 preserves the full scoped result", () => {
  let missingContextExact = 0;
  let missingContextCounterMatches = 0;
  for (const row of runs) {
    const scoped = results(row).trace;
    const before = structuredClone({ input: row.input, options: row.options });
    const missing = replayMk2(row.input, config, { ...row.options, trace: true, terminalVolleyEvidence: undefined });
    const unrecognized = replayMk2(row.input, config, { ...row.options, trace: true, terminalVolleyEvidence: { unrecognized: true } });
    assert.equal((missing.replayMetadata as any).terminalVolley, undefined);
    assert.deepEqual(unrecognized, missing, "unrecognized evidence must not select another algorithm");
    const comparison = compareMk2Outcome(row.fixture.observed, missing);
    missingContextExact += Number(comparison.exact);
    missingContextCounterMatches += comparison.procChecks.filter(check => check.exact).length;
    assert.deepEqual(replayMk2({ ...row.input, maxRounds: 1500 }, config, { ...row.options, trace: true }), scoped);
    assert.deepEqual({ input: row.input, options: row.options }, before);
  }
  // Preserved locked-kernel behavior, including its failures when the required evidence is absent.
  assert.equal(missingContextExact, 3);
  assert.equal(missingContextCounterMatches, 68);
});

test("full troop-profile FC metadata is part of the exact scope, even when numeric stats are unchanged", () => {
  const mechanics = normalizeMechanics(undefined);
  const effective = createMk2Config(config, mechanics);
  for (const row of runs) {
    const scope = (candidate: typeof effective) => createScopedTerminalVolley(prepareBattle(row.input, candidate), createBattleRng("100001", true), mechanics, row.options.terminalVolleyEvidence);
    assert.ok(scope(effective));
    for (const [profile, fc] of [["lancer_t5_fc5", 3], ["marksman_t7_fc3", 5]] as const) {
      const altered = { ...effective, troopStats: { ...effective.troopStats, [profile]: { ...effective.troopStats[profile], fc } } };
      assert.deepEqual(altered.troopStats[profile].stats, effective.troopStats[profile].stats);
      assert.equal(scope(altered), null, row.fixture.test_id + " changed FC: " + profile);
    }
  }
});
