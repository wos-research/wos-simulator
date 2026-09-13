import { buildSimulatorConfig } from "../config";
import type { CompiledBattle } from "../prepare";
import type { SimulationOptions, SimulatorConfig } from "../types";
import { createTroopStatsRecord, fireCrystalMultiplier, generateTroopStats } from "../troopStats";
import { crystalShieldExtraHits, orderCrystalShield } from "./crystal_shield";
import { gunpowderTiming } from "./gunpowder_timing";
import { volleyAfterDeath } from "./volley_persistence";
import { CALIBRATED_T12_LANCER, incandescentFieldExtraHit, isCalibratedLancerDuel, orderLancerDefense } from "./lancer_duel";

const configs = new WeakMap<SimulatorConfig, SimulatorConfig>();
/** Keep the legacy catalogue immutable; isolate Mk2 coefficients and provisional extensions. */
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
  config.troopStats = { [CALIBRATED_T12_LANCER.id]: CALIBRATED_T12_LANCER, ...source.troopStats };
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
  const lancerDuel = isCalibratedLancerDuel(compiled);
  if (lancerDuel) orderLancerDefense(compiled);
  const shield = crystalShieldExtraHits({});
  const warnings = [...timing.warnings];
  if ((["attacker", "defender"] as const).some(side => (compiled.input[side].troops[CALIBRATED_T12_LANCER.id] ?? 0) > 0)) {
    warnings.push("T12 FC10 lancer support is provisional: the six-report calibration does not uniquely identify game base stats.");
    if (!lancerDuel) warnings.push("Combined lancer skill timing is unvalidated for this army setup; retaining the previous timing.");
  }
  return { options: {
    beforeExtraAttack: lancerDuel ? (job, intent, runtime, recorder) => {
      shield?.(job, intent, runtime, recorder);
      incandescentFieldExtraHit(job, intent, runtime, recorder);
    } : shield,
    attackScheduling: "side-local",
    ...(lancerDuel ? { ambusherTiming: "round_start" as const } : {}),
    onEmptyUnit: volleyAfterDeath(compiled),
    deferAttackSkill: timing.deferAttackSkill,
  }, warnings };
}
