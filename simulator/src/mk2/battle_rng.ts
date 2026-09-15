/** One labelled Lua 5.4 stream shared by every chance check in a replay. */
import {Lua54Random} from './lua54_rng';
import type {RandomContext, Rng} from '../effects';
import type {SideId, UnitType} from '../types';

export interface Mk2RandomEvent {
  call: number;
  firstRawDraw: number;
  lastRawDraw: number;
  round?: number;
  phase?: RandomContext['phase'];
  side?: SideId;
  skillId?: string;
  heroInstanceId?: string;
  sourceKind?: 'hero_skill' | 'troop_skill';
  troopType?: UnitType;
  dealerSide?: SideId;
  dealerUnit?: UnitType;
  takerSide?: SideId;
  takerUnit?: UnitType;
  probabilityPct: number;
  roll: number;
  passed: boolean;
}
export interface Mk2RngMetadata {
  algorithm: 'lua54-xoshiro256**';
  seed: string;
  secondSeed: '0';
  integerRange: [0, 9999];
  comparison: 'roll < probabilityPct * 100';
  calls: number;
  draws: number;
  events?: Mk2RandomEvent[];
}
export function createBattleRng(seed: string, trace = false): {rng: Rng; metadata: () => Mk2RngMetadata} {
  const generator = new Lua54Random(BigInt(seed));
  const events: Mk2RandomEvent[] = [];
  let calls = 0;
  const rng: Rng = () => {throw new Error('Unlabelled random call in Mk2 replay');};
  rng.chance = (probabilityPct, context) => {
    if (probabilityPct <= 0) return false;
    if (probabilityPct >= 100) return true;
    const firstRawDraw = generator.rawDraws + 1;
    const roll = generator.random(0, 9999), passed = roll < probabilityPct * 100;
    calls++;
    if (trace) {
      const skill = context?.skill;
      events.push({call: calls, firstRawDraw, lastRawDraw: generator.rawDraws,
        round: context?.round, phase: context?.phase, side: skill?.side,
        skillId: skill?.id, heroInstanceId: skill?.heroInstanceId, sourceKind: skill?.sourceKind, troopType: skill?.troopType,
        dealerSide: context?.intent?.dealerSide, dealerUnit: context?.intent?.dealerUnit,
        takerSide: context?.intent?.takerSide, takerUnit: context?.intent?.takerUnit, probabilityPct, roll, passed});
    }
    return passed;
  };
  return {rng, metadata: () => ({algorithm: 'lua54-xoshiro256**', seed, secondSeed: '0', integerRange: [0, 9999],
    comparison: 'roll < probabilityPct * 100', calls, draws: generator.rawDraws, ...(trace ? {events} : {})})};
}
