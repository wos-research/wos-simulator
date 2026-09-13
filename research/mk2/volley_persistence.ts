/** Volley chance/count checks persist after its Marksman line is depleted. */
import type {CompiledBattle} from './upstream/src/prepare';
import type {OnEmptyUnit} from './upstream/src/runtime';
import {chancePasses} from './upstream/src/effects';

export type VolleyAfterDeath = 'roll' | 'skip';
export function volleyAfterDeath(compiled: CompiledBattle, mode: VolleyAfterDeath = 'roll'): OnEmptyUnit | undefined {
  if (mode === 'skip') return undefined;
  const skills = {
    attacker: compiled.fighters.attacker.troopSkills.filter(skill => skill.id === 'Volley'),
    defender: compiled.fighters.defender.troopSkills.filter(skill => skill.id === 'Volley')
  };
  if (!skills.attacker.length && !skills.defender.length) return undefined;
  return (round, side, unit, runtime, recorder) => {
    if (unit !== 'marksman') return;
    for (const skill of skills[side]) {
      recorder.recordSkillTriggerAttempt(skill);
      if (chancePasses(skill, runtime.rng, {skill, round, phase: 'empty_unit'}))
        recorder.recordSkillTriggered(skill);
    }
    // No source troops: never activate an effect, schedule a hit, or advance
    // attack counters. Other depleted troop skills retain their prior behavior.
  };
}
