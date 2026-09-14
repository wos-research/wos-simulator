/** Explicit Mk2 troop profiles; the caller's legacy configuration stays unchanged. */
import {buildSimulatorConfig} from '../config';
import {createTroopStatsRecord, fireCrystalMultiplier, generateTroopStats} from '../troopStats';
import type {SimulatorConfig} from '../types';
import type {ShieldInteractionMode} from './crystal_shield';
import type {GunpowderTiming} from './gunpowder_timing';
import type {VolleyAfterDeath} from './volley_persistence';

export interface Mk2Mechanics {
  fcRounding?: 'nearest' | 'floor';
  catalogueCorrections?: 'validated' | 'none';
  gunpowderShield?: ShieldInteractionMode;
  lanceShield?: ShieldInteractionMode;
  volleyShield?: ShieldInteractionMode;
  attackScheduling?: 'side-local' | 'reference';
  volleyAfterDeath?: VolleyAfterDeath;
  gunpowderTiming?: GunpowderTiming;
  terminalVolleyShield?: 'roll' | 'skip';
}
export const DEFAULT_MK2_MECHANICS: Readonly<Required<Mk2Mechanics>> = Object.freeze({
  fcRounding: 'floor', catalogueCorrections: 'validated', gunpowderShield: 'per-hit', lanceShield: 'per-hit', volleyShield: 'per-hit',
  attackScheduling: 'side-local', volleyAfterDeath: 'roll', gunpowderTiming: 'after-volley', terminalVolleyShield: 'roll'
});
const choices: {[K in keyof Mk2Mechanics]: readonly string[]} = {
  fcRounding: ['nearest', 'floor'], catalogueCorrections: ['validated', 'none'], gunpowderShield: ['per-hit', 'reference'], lanceShield: ['per-hit', 'reference'],
  volleyShield: ['per-hit', 'reference'], attackScheduling: ['side-local', 'reference'],
  volleyAfterDeath: ['roll', 'skip'], gunpowderTiming: ['after-volley', 'reference'], terminalVolleyShield: ['roll', 'skip']
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
  if (mechanics.catalogueCorrections === 'validated') {
    // Separate captured controls support these specific original catalogue cells.
    // Unlisted profiles and axes retain the configured rounding policy.
    // `none` preserves the former floor reference for reproducible comparisons.
    for (const [id, type, fc] of [
      ['lancer_t10_fc4', 'lancer', 4], ['infantry_t10_fc5', 'infantry', 5]
    ] as const) {
      const troop = result.troopStats[id];
      if (troop) result.troopStats[id] = createTroopStatsRecord({...troop, stats: {...troop.stats,
        attack: generateTroopStats(type, 10, fc).stats.attack}});
    }
    // T10 FC1 Infantry: both original attack and health are required by two controls.
    const fc1 = result.troopStats.infantry_t10_fc1;
    if (fc1) {
      const original = generateTroopStats('infantry', 10, 1).stats;
      result.troopStats.infantry_t10_fc1 = createTroopStatsRecord({...fc1, stats: {...fc1.stats,
        attack: original.attack, health: original.health}});
    }
    // Scope-specific original cells; not a blanket rounding-policy change.
    for (const [id, type, fc] of [
      ['lancer_t10_fc1', 'lancer', 1], ['marksman_t10_fc3', 'marksman', 3]
    ] as const) {
      const troop = result.troopStats[id];
      if (troop) {
        const original = generateTroopStats(type, 10, fc).stats;
        result.troopStats[id] = createTroopStatsRecord({...troop, stats: {...troop.stats,
          attack: original.attack, health: original.health}});
      }
    }
    // Ten hero-free T10 FC5 Lancer controls distinguish the original health cell.
    const fc5Lancer = result.troopStats.lancer_t10_fc5;
    if (fc5Lancer) result.troopStats.lancer_t10_fc5 = createTroopStatsRecord({...fc5Lancer, stats: {...fc5Lancer.stats,
      health: generateTroopStats('lancer', 10, 5).stats.health}});
  }
  // Preserve source stats in the user-locked T1-T10 / FC0-FC5 range.
  for (const [id, troop] of Object.entries(config.troopStats)) {
    if (troop.tier >= 1 && troop.tier <= 10 && troop.fc >= 0 && troop.fc <= 5) result.troopStats[id] = troop;
  }
  return result;
}
