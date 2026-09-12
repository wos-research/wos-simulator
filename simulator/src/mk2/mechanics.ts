/** Explicit Mk2 troop profiles; the caller's legacy configuration stays unchanged. */
import {buildSimulatorConfig} from '../config';
import {createTroopStatsRecord, fireCrystalMultiplier, generateTroopStats} from '../troopStats';
import type {SimulatorConfig} from '../types';
import type {ShieldInteractionMode} from './crystal_shield';
import type {GunpowderTiming} from './gunpowder_timing';
import type {VolleyAfterDeath} from './volley_persistence';

export interface Mk2Mechanics {
  fcRounding?: 'nearest' | 'floor';
  gunpowderShield?: ShieldInteractionMode;
  lanceShield?: ShieldInteractionMode;
  volleyShield?: ShieldInteractionMode;
  attackScheduling?: 'side-local' | 'reference';
  volleyAfterDeath?: VolleyAfterDeath;
  gunpowderTiming?: GunpowderTiming;
}
export const DEFAULT_MK2_MECHANICS: Readonly<Required<Mk2Mechanics>> = Object.freeze({
  fcRounding: 'floor', gunpowderShield: 'per-hit', lanceShield: 'per-hit', volleyShield: 'per-hit',
  attackScheduling: 'side-local', volleyAfterDeath: 'roll', gunpowderTiming: 'after-volley'
});
const choices: {[K in keyof Mk2Mechanics]: readonly string[]} = {
  fcRounding: ['nearest', 'floor'], gunpowderShield: ['per-hit', 'reference'], lanceShield: ['per-hit', 'reference'],
  volleyShield: ['per-hit', 'reference'], attackScheduling: ['side-local', 'reference'],
  volleyAfterDeath: ['roll', 'skip'], gunpowderTiming: ['after-volley', 'reference']
};
export function normalizeMechanics(options: Mk2Mechanics = {}): Required<Mk2Mechanics> {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new Error('Mk2 mechanics must be an object');
  for (const [key, value] of Object.entries(options)) {
    if (!Object.hasOwn(choices, key)) throw new Error(`Unknown Mk2 mechanic: ${key}`);
    if (value !== undefined && !choices[key as keyof Mk2Mechanics]!.includes(value)) throw new Error(`Invalid Mk2 ${key}`);
  }
  const selected = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));
  return {...DEFAULT_MK2_MECHANICS, ...selected};
}
export function createMk2Config(config: SimulatorConfig, mechanics: Required<Mk2Mechanics>): SimulatorConfig {
  const troopSkills = structuredClone(config.troopSkills);
  if (mechanics.volleyShield === 'per-hit') {
    const effect = troopSkills.skills.Volley?.effects['Volley/1'];
    if (!effect) throw new Error('Mk2 requires the standard Volley troop definition');
    effect.type = 'extra_skill_attack';
    effect.trigger_damage_jobs = [{source: 'use.source', target: 'effect.applies_vs', damage_kind: 'skill'}];
    delete effect.duration;
  }
  const result = buildSimulatorConfig({heroDefinitions: structuredClone(config.heroDefinitions),
    heroGenerationStats: structuredClone(config.heroGenerationStats), troopSkills});
  result.troopStats = {...config.troopStats};
  if (mechanics.fcRounding === 'floor') {
    for (const [id, troop] of Object.entries(config.troopStats)) {
      if (troop.fc === 0 || troop.tier < 1 || troop.tier > 10) continue;
      const base = generateTroopStats(troop.type, troop.tier, 0).stats, factor = fireCrystalMultiplier(troop.fc);
      result.troopStats[id] = createTroopStatsRecord({...troop, stats: {...troop.stats,
        attack: Math.floor(base.attack * factor), health: Math.floor(base.health * factor)}});
    }
  }
  return result;
}
