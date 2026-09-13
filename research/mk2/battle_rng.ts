/** Per-battle Lua RNG with an inspectable, shared stream across all skills. */
import {Lua54Random} from './lua54_rng';
import {normalizeTimestamp, type Timestamp} from './timestamp';
import type {RandomContext, Rng} from './upstream/src/effects';

export function createBattleRng(timestamp?: Timestamp, trace = false) {
  const normalized = normalizeTimestamp(timestamp);
  const seed = BigInt(normalized) + 1n;
  const generator = new Lua54Random(seed);
  const events: Record<string, unknown>[] = [];
  let calls = 0;
  const rng: Rng = () => { throw new Error('Unlabelled random call in Mk2 replay'); };
  rng.chance = (probabilityPct: number, context?: RandomContext) => {
    if (probabilityPct <= 0) return false;
    if (probabilityPct >= 100) return true;
    const firstRawDraw = generator.rawDraws + 1;
    const roll = generator.random(0, 9999);
    const passed = roll < probabilityPct * 100;
    calls++;
    if (trace) {
      const skill = context?.skill;
      events.push({call: calls, firstRawDraw, lastRawDraw: generator.rawDraws,
        round: context?.round, phase: context?.phase, side: skill?.side,
        skillId: skill?.id, heroInstanceId: skill?.heroInstanceId,
        sourceKind: skill?.sourceKind, troopType: skill?.troopType,
        dealerSide: context?.intent?.dealerSide, dealerUnit: context?.intent?.dealerUnit,
        takerSide: context?.intent?.takerSide, takerUnit: context?.intent?.takerUnit,
        probabilityPct, roll, passed});
    }
    return passed;
  };
  return {rng, metadata: () => ({algorithm: 'lua54-xoshiro256**', timestamp: normalized,
    seed: seed.toString(), secondSeed: '0', integerRange: [0, 9999],
    comparison: 'roll < probabilityPct * 100', calls, draws: generator.rawDraws,
    ...(trace ? {events} : {})})};
}
