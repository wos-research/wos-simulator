import { buildSimulatorConfig } from "../config";
import type { CompiledBattle } from "../prepare";
import type { SimulationOptions, SimulatorConfig } from "../types";
import { createTroopStatsRecord, fireCrystalMultiplier, generateTroopStats } from "../troopStats";
import { crystalShieldExtraHits, orderCrystalShield } from "./crystal_shield";
import { gunpowderTiming } from "./gunpowder_timing";
import { volleyAfterDeath } from "./volley_persistence";

const configs = new WeakMap<SimulatorConfig, SimulatorConfig>();
/** Keep the shared legacy catalogue immutable; only port the measured Mk2 changes. */
export function mk2Config(source: SimulatorConfig): SimulatorConfig {
  const cached = configs.get(source);
  if (cached) return cached;
  const troopSkills = structuredClone(source.troopSkills);
  const volley = troopSkills.skills.Volley?.effects["Volley/1"];
  if (volley) {
    volley.type = "extra_skill_attack";
    volley.trigger_damage_jobs = [{ source: "use.source", target: "effect.applies_vs", damage_kind: "skill" }];
    delete volley.duration;
  }
  const config = buildSimulatorConfig({ heroDefinitions: source.heroDefinitions,
    heroGenerationStats: source.heroGenerationStats, troopSkills });
  config.troopStats = { ...source.troopStats };
  for (const [id, troop] of Object.entries(config.troopStats)) {
    if (troop.fc === 0 || troop.tier > 10) continue;
    const base = generateTroopStats(troop.type, troop.tier, 0).stats;
    const factor = fireCrystalMultiplier(troop.fc);
    config.troopStats[id] = createTroopStatsRecord({ ...troop, stats: { ...troop.stats,
      attack: Math.floor(base.attack * factor), health: Math.floor(base.health * factor) } });
  }
  configs.set(source, config);
  return config;
}

export function prepareMk2(compiled: CompiledBattle): { options: SimulationOptions; warnings: string[] } {
  orderCrystalShield(compiled, {});
  const timing = gunpowderTiming(compiled);
  return { options: {
    beforeExtraAttack: crystalShieldExtraHits({}),
    attackScheduling: "side-local",
    onEmptyUnit: volleyAfterDeath(compiled),
    deferAttackSkill: timing.deferAttackSkill,
  }, warnings: timing.warnings };
}
