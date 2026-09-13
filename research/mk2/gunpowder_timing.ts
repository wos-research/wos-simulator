/** Measured Volley/CrystalGunpowder timing, restricted to the tested troop context. */
import type {CompiledBattle} from './upstream/src/prepare';
import type {DeferAttackSkill} from './upstream/src/runtime';
import type {ResolvedSkill, SideId} from './upstream/src/types';

export type GunpowderTiming = 'after-volley' | 'reference';
type Options = {
  gunpowderTiming?: GunpowderTiming;
  gunpowderShield?: 'per-hit' | 'reference';
  volleyShield?: 'per-hit' | 'reference';
  attackScheduling?: 'side-local' | 'reference';
};
const sides = ['attacker', 'defender'] as const;

function measuredExtra(skill: ResolvedSkill | undefined, chance: number, value: number): boolean {
  if (!skill || skill.sourceKind !== 'troop_skill' || skill.troopType !== 'marksman' ||
      skill.compiledTrigger?.probabilityPct !== chance || skill.effects.length !== 1) return false;
  const effect = skill.effects[0], jobs = effect.trigger_damage_jobs;
  return effect.id === `${skill.id}/1` && effect.type === 'extra_skill_attack' && effect.value === value &&
    effect.duration === undefined && jobs?.length === 1 && jobs[0].source === 'use.source' &&
    jobs[0].target === 'effect.applies_vs' && (jobs[0].damage_kind ?? 'skill') === 'skill';
}

export function gunpowderTiming(compiled: CompiledBattle, options: Options = {}): {
  deferAttackSkill?: DeferAttackSkill; warnings: string[];
} {
  if (options.gunpowderTiming === 'reference') return {warnings: []};
  const eligible = new Set<SideId>(), warnings: string[] = [];
  for (const side of sides) {
    const other = side === 'attacker' ? 'defender' : 'attacker';
    const source = compiled.fighters[side], target = compiled.fighters[other];
    const volley = source.troopSkills.find(skill => skill.id === 'Volley');
    const gunpowder = source.troopSkills.find(skill => skill.id === 'CrystalGunpowder');
    if (!volley || !gunpowder) continue;
    const shield = target.troopSkills.find(skill => skill.id === 'CrystalShield');
    const ownChance = compiled.runtimeSkills.randomness.chanceSkillIds[side];
    const otherChance = compiled.runtimeSkills.randomness.chanceSkillIds[other];
    const supported = sides.every(s => compiled.fighters[s].heroes.length === 0 &&
      !compiled.fighters[s].heroSkills?.length && !Object.keys(compiled.input[s].passive ?? {}).length &&
      Object.values(compiled.input[s].troops).filter(count => count > 0).length === 1) &&
      source.initialTroops.marksman > 0 && target.initialTroops.infantry > 0 &&
      source.troopSkills.every(skill => ['RangedStrike', 'Volley', 'CrystalGunpowder'].includes(skill.id)) &&
      target.troopSkills.every(skill => ['MasterBrawler', 'CrystalShield'].includes(skill.id)) &&
      measuredExtra(volley, 10, 100) && measuredExtra(gunpowder, 20, 50) &&
      ownChance.length === 2 && ownChance.includes('Volley') && ownChance.includes('CrystalGunpowder') &&
      (shield ? otherChance.length === 1 && otherChance[0] === 'CrystalShield' &&
        shield.compiledTrigger?.probabilityPct === 37.5 && options.gunpowderShield !== 'reference' &&
        options.volleyShield !== 'reference' : otherChance.length === 0) &&
      options.attackScheduling !== 'reference';
    if (supported) eligible.add(side);
    else warnings.push(`${side}: delayed Gunpowder timing is unvalidated for this context; retaining reference timing. ` +
      'Measured scope is hero-free single-stack Marksmen versus Infantry, Volley 10%/100%, ' +
      'Gunpowder 20%/50%, optional Shield 37.5% with per-hit protection, no additional troop skills, and side-local scheduling.');
  }
  if (!eligible.size) return {warnings};
  return {warnings, deferAttackSkill: (prepared, intent) => eligible.has(intent.dealerSide) &&
    intent.dealerUnit === 'marksman' && intent.takerUnit === 'infantry' &&
    prepared.skill.side === intent.dealerSide && prepared.skill.sourceKind === 'troop_skill' &&
    prepared.skill.id === 'CrystalGunpowder'};
}
