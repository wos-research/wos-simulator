/** Calibrated against six hero-free FC9/FC10 single-stack lancer reports.
 * See research/mk2/lancer-calibration.md for identifiability and scope limits.
 */
import type { CompiledBattle } from "../prepare";
import type { BeforeExtraAttack } from "../runtime";
import { triggerAttackSkills } from "../runtime";
import { damageJobShapeSlot } from "../effectIndex";
import { createTroopStatsRecord } from "../troopStats";
import type { ResolvedSkill } from "../types";

/** Representative fitted coefficients, not independently recovered game stats. */
export const CALIBRATED_T12_LANCER = createTroopStatsRecord({
  id: "lancer_t12_fc10", type: "lancer", tier: 12, fc: 10,
  stats: { attack: 3215, defense: 10, lethality: 10, health: 1008 },
});

function supportedSkill(skill: ResolvedSkill): boolean {
  if (skill.sourceKind !== "troop_skill" || skill.troopType !== "lancer" || skill.effects.length !== 1) return false;
  const effect = skill.effects[0], trigger = skill.trigger;
  if (effect.id !== `${skill.id}/1`) return false;
  switch (skill.id) {
    case "Charge":
      return trigger.type === "battle_start" && effect.type === "type.single_target.damage.up" &&
        effect.value === 10 && JSON.stringify(effect.units) === JSON.stringify({ applies_to: ["lancer"], applies_vs: ["marksman"] });
    case "Ambusher":
      return trigger.type === "turn" && effect.type === "attack_order" &&
        JSON.stringify(effect.value) === JSON.stringify(["marksman", "infantry", "lancer"]) &&
        effect.duration?.turns?.count === 1;
    case "CrystalLance":
      return trigger.type === "attack" && trigger.source === "lancer" && !trigger.target &&
        effect.type === "extra_skill_attack" && effect.value === 100 && effect.duration === undefined &&
        effect.trigger_damage_jobs?.length === 1 && effect.trigger_damage_jobs[0].source === "use.source" &&
        effect.trigger_damage_jobs[0].target === "effect.applies_vs" &&
        (effect.trigger_damage_jobs[0].damage_kind ?? "skill") === "skill" &&
        JSON.stringify(effect.units) === JSON.stringify({ applies_to: ["lancer"], applies_vs: "trigger.target" });
    case "IncandescentField":
      return trigger.type === "attack" && trigger.source === "enemy.any" && trigger.target === "self.lancer" &&
        effect.type === "active.troop.defense.up" && effect.value === 100 &&
        JSON.stringify(effect.duration) === JSON.stringify({ attacks: { count: 1 } }) &&
        JSON.stringify(effect.units) === JSON.stringify({ applies_to: "trigger.target", applies_vs: "trigger.source" });
    default: return false;
  }
}

export function isCalibratedLancerDuel(compiled: CompiledBattle): boolean {
  return (["attacker", "defender"] as const).every(side => {
    const fighter = compiled.fighters[side];
    if (fighter.heroes.length || fighter.heroSkills?.length || Object.keys(compiled.input[side].passive ?? {}).length ||
        Object.values(compiled.input[side].troops).filter(count => count > 0).length !== 1 ||
        fighter.initialTroops.lancer <= 0 || fighter.initialTroops.infantry > 0 || fighter.initialTroops.marksman > 0) return false;
    if (fighter.troopSkills.length !== 4 || !fighter.troopSkills.every(supportedSkill)) return false;
    const chance = (id: string) => fighter.troopSkills.find(skill => skill.id === id)?.compiledTrigger?.probabilityPct;
    return chance("Ambusher") === 20 && chance("CrystalLance") === 15 && [10, 15].includes(chance("IncandescentField") ?? -1);
  });
}

export function orderLancerDefense(compiled: CompiledBattle): void {
  // Roll the target's protection before the dealer's chance to schedule an extra hit.
  compiled.runtimeSkills = { ...compiled.runtimeSkills,
    attackDeclaredByJobShape: compiled.runtimeSkills.attackDeclaredByJobShape.map(slot => {
      if (!slot) return slot;
      const field = slot.findIndex(skill => skill.skill.id === "IncandescentField");
      const lance = slot.findIndex(skill => skill.skill.id === "CrystalLance");
      if (field < 0 || lance < 0 || field < lance) return slot;
      const ordered = [...slot];
      [ordered[field], ordered[lance]] = [ordered[lance], ordered[field]];
      return ordered;
    }),
  };
}

export const incandescentFieldExtraHit: BeforeExtraAttack = (job, intent, runtime, recorder) => {
  // Each actual extra hit consumes fresh protection; Lance itself does not recurse.
  if (job.kind !== "skill" || job.sourceEffectId !== "CrystalLance/1") return;
  const matching = runtime.skills.attackDeclaredByJobShape[
    damageJobShapeSlot("normal", job.dealerSide, job.dealerUnit, job.takerSide, job.takerUnit)
  ]?.filter(skill => skill.skill.id === "IncandescentField");
  if (matching?.length) triggerAttackSkills(job.round, matching, runtime, recorder, {
    ...intent, dealerSide: job.dealerSide, dealerUnit: job.dealerUnit,
    takerSide: job.takerSide, takerUnit: job.takerUnit,
  }, "extra_attack");
};
