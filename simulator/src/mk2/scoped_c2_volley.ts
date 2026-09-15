/** Scoped C2 order/accounting: 20 captured reports across both roles; 3 unused-success counter witnesses. No seed, report ID or outcome gates. */
const assert=Object.assign((ok:any,message='Scoped C2 invariant failed')=>{if(!ok)throw new Error(message);},{equal:(a:any,b:any,message='Scoped C2 invariant failed')=>{if(a!==b)throw new Error(message);}});
import{volleyAfterDeath}from'./volley_persistence';
function broadC2Scope(compiled:any){
 if(compiled.input.engagement_type!=='always')return null;
 const mixed=(['attacker','defender']as const).find(s=>compiled.input[s].troops.lancer_t5_fc5>0&&compiled.input[s].troops.marksman_t7_fc3>0);if(!mixed)return null;const inf=mixed==='attacker'?'defender':'attacker';
 for(const side of['attacker','defender']){const i=compiled.input[side],f=compiled.fighters[side],positive=Object.entries(i.troops).filter(([,n]:any)=>n>0);if(i.heroes?.length||i.joiner_heroes?.length||Object.keys(i.passive??{}).length||f.heroes.length||f.diagnostics.length||positive.some(([,n]:any)=>!Number.isSafeInteger(n)))return null;const expected=side===mixed?['lancer_t5_fc5','marksman_t7_fc3']:['infantry_t5_fc5'];if(positive.length!==expected.length||positive.some(([id])=>!expected.includes(id)))return null;}
 const expectedMixed=['CrystalGunpowder','CrystalLance','Volley'];if(JSON.stringify(compiled.runtimeSkills.randomness.chanceSkillIds[mixed].slice().sort())!==JSON.stringify(expectedMixed)||canonical(compiled.runtimeSkills.randomness.chanceSkillIds[inf].slice().sort())!==canonical(['CrystalShield']))return null;
 const shields=compiled.fighters[inf].troopSkills.filter((s:any)=>s.id==='CrystalShield');if(shields.length!==1||shields[0].compiledTrigger.probabilityPct!==37.5)return null;
 const skills=compiled.fighters[mixed].troopSkills;for(const[id,pct]of[['CrystalLance',15],['Volley',10],['CrystalGunpowder',20]]){const x=skills.filter((s:any)=>s.id===id);if(x.length!==1||x[0].compiledTrigger.probabilityPct!==pct)return null;}
 return{mixedSide:mixed,infantrySide:inf,volley:skills.find((s:any)=>s.id==='Volley')};
}

const GUARD:any={"troops":{"mixed":{"marksman_t7_fc3":5,"lancer_t5_fc5":500},"infantry":{"infantry_t5_fc5":1}},"stats":{"mixed":{"marksman":{"attack":304.36,"defense":303.89,"lethality":187.03,"health":184.12},"lancer":{"attack":279.05,"defense":277.58,"lethality":198.81,"health":194.59}},"infantry":{"infantry":{"attack":299.07,"defense":302.32,"lethality":184.71,"health":182.67}}},"baseStatConfigurations":[{"lancer_t5_fc5":{"attack":782,"defense":10,"lethality":10,"health":260},"marksman_t7_fc3":{"attack":1317,"defense":10,"lethality":10,"health":247},"infantry_t5_fc5":{"attack":260,"defense":10,"lethality":10,"health":782}}],"skills":{"MasterBrawler":{"description":"Increase Attack Damage to Lancers by 10%","troop_type":"infantry","requirements":[{"level":1,"type":"tier","value":0}],"trigger":{"type":"battle_start"},"effects":{"MasterBrawler/1":{"type":"type.single_target.damage.up","value":[10],"units":{"applies_to":["infantry"],"applies_vs":["lancer"]}}}},"Charge":{"description":"Increase Attack Damage to Marksmen by 10%","troop_type":"lancer","requirements":[{"level":1,"type":"tier","value":0}],"trigger":{"type":"battle_start"},"effects":{"Charge/1":{"type":"type.single_target.damage.up","value":[10],"units":{"applies_to":["lancer"],"applies_vs":["marksman"]}}}},"RangedStrike":{"description":"Increase Attack Damage to Infantry by 10%","troop_type":"marksman","requirements":[{"level":1,"type":"tier","value":0}],"trigger":{"type":"battle_start"},"effects":{"RangedStrike/1":{"type":"type.single_target.damage.up","value":[10],"units":{"applies_to":["marksman"],"applies_vs":["infantry"]}}}},"CrystalLance":{"description":"Lancers have a chance to make an extra skill attack for 100% damage.","troop_type":"lancer","requirements":[{"level":1,"type":"fc","value":3},{"level":2,"type":"fc","value":5}],"trigger":{"type":"attack","probability":[10,15],"source":"lancer"},"effects":{"CrystalLance/1":{"type":"extra_skill_attack","value":[100,100],"units":{"applies_to":["lancer"],"applies_vs":"trigger.target"},"trigger_damage_jobs":[{"source":"use.source","target":"effect.applies_vs"}]}}},"Volley":{"description":"Marksman attacks have a chance to make an extra skill attack for 100% damage.","troop_type":"marksman","requirements":[{"level":1,"type":"tier","value":7}],"trigger":{"type":"attack","probability":[10],"source":"marksman"},"effects":{"Volley/1":{"type":"extra_skill_attack","value":[100],"units":{"applies_to":"trigger.source","applies_vs":"trigger.target"},"trigger_damage_jobs":[{"source":"use.source","target":"effect.applies_vs","damage_kind":"skill"}]}}},"CrystalGunpowder":{"description":"Marksmen have a chance to make an extra skill attack for 50% damage, increased to 75% at FC8 and 87.5% at FC10.","troop_type":"marksman","requirements":[{"level":1,"type":"fc","value":3},{"level":2,"type":"fc","value":5},{"level":3,"type":"fc","value":8},{"level":4,"type":"fc","value":10}],"trigger":{"type":"attack","probability":[20,30,30,30],"source":"marksman"},"effects":{"CrystalGunpowder/1":{"type":"extra_skill_attack","value":[50,50,75,87.5],"units":{"applies_to":["marksman"],"applies_vs":"trigger.target"},"trigger_damage_jobs":[{"source":"use.source","target":"effect.applies_vs"}]}}},"CrystalShield":{"description":"The fire crystal energy attached to the surface makes the shield impregnable and grants it X% chance of offsetting 36 damage","troop_type":"infantry","requirements":[{"level":1,"type":"fc","value":3},{"level":2,"type":"fc","value":5}],"trigger":{"type":"attack","probability":[25,37.5],"source":"enemy.any","target":"self.infantry"},"effects":{"CrystalShield/1":{"type":"active.troop.damageTaken.down","value":[36,36],"units":{"applies_to":"trigger.target","applies_vs":"trigger.source"},"duration":{"attacks":{"count":1}}}}}}};

const canonical=(x:any):string=>x===null||typeof x!=='object'?(JSON.stringify(x)??'undefined'):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
export function exactC2Scope(compiled:any,mechanics:any={}){
 const m={gunpowderShield:'per-hit',lanceShield:'per-hit',volleyShield:'per-hit',attackScheduling:'side-local',volleyAfterDeath:'roll',gunpowderTiming:'after-volley',terminalVolleyShield:'roll',...mechanics};
 if(m.rng!==undefined&&m.rng!=='lua54')return null;
 if(m.gunpowderShield!=='per-hit'||m.lanceShield!=='per-hit'||m.volleyShield!=='per-hit'||m.attackScheduling!=='side-local'||m.volleyAfterDeath!=='roll'||m.gunpowderTiming!=='after-volley'||m.terminalVolleyShield!=='roll')return null;
 const scope=broadC2Scope(compiled);if(!scope)return null;
 for(const side of ['attacker','defender']){const expected=side===scope.mixedSide?['Charge','CrystalGunpowder','CrystalLance','RangedStrike','Volley']:['CrystalShield','MasterBrawler'];if(canonical(compiled.fighters[side].troopSkills.map((s:any)=>s.id).sort())!==canonical(expected))return null;}
 // The normal testcase adapter adds seed: undefined; it is equivalent to an absent seed.
 if(Object.keys(compiled.input).some(k=>!['engagement_type','attacker','defender'].includes(k)&&!(k==='seed'&&compiled.input.seed===undefined)))return null;
 for(const side of ['attacker','defender']){
  const role=side===scope.mixedSide?'mixed':'infantry',input=compiled.input[side];
  if(Object.keys(input).some(k=>!['name','troops','stats','heroes','joiner_heroes'].includes(k)))return null;
  if(canonical(input.heroes)!=='[]'||canonical(input.joiner_heroes)!=='[]')return null;
  if(canonical(input.troops)!==canonical(GUARD.troops[role])||canonical(input.stats)!==canonical(GUARD.stats[role]))return null;
 }
 const bases=Object.fromEntries(Object.keys(GUARD.baseStatConfigurations[0]).map(id=>[id,compiled.config.troopStats[id]?.stats]));
 if(!GUARD.baseStatConfigurations.some((g:any)=>canonical(g)===canonical(bases)))return null;
 for(const[id,definition]of Object.entries(GUARD.skills))if(canonical(compiled.config.troopSkills.skills[id])!==canonical(definition))return null;
 return scope;
}
export function createScopedC2Volley(compiled:any,native:any,mechanics:any={},policy:'scoped'|'reference'='scoped'){
 if(!['scoped','reference'].includes(policy))throw Error('Unknown scoped C2 policy');if(policy==='reference')return null;
 const scope=exactC2Scope(compiled,mechanics);if(!scope)return null;const enabled=true;
 assert(typeof native?.rng?.chance==='function'&&typeof native?.metadata==='function','Caller labelled RNG/metadata pair required');
 const originalEmpty=volleyAfterDeath(compiled,mechanics.volleyAfterDeath??'roll'),reservations:any[]=[],seen=new Set<string>();let pending:any=null,snapshot:any=null;
 const finishPending=(reason:string)=>{if(pending){pending.status='unused';pending.reason=reason;pending=null;}};
 const rng:any=()=>{throw Error('VL1 requires labelled chance calls')};
 rng.chance=(prob:number,context:any)=>{
  if(pending&&pending.round!==context?.round)finishPending('new round before actual MM trigger');
  // VS1: the same live outgoing Volley reservation precedes normal reactive Shield.
  if(enabled&&scope&&context?.phase==='attack_declared'&&context.skill?.id==='CrystalShield'&&context.skill.side===scope.infantrySide&&context.intent?.dealerSide===scope.mixedSide&&context.intent.dealerUnit==='lancer'&&context.intent.takerUnit==='infantry'){
   const key=context.round+':'+scope.mixedSide;assert(snapshot&&snapshot.round===context.round);
   if(snapshot.runtime.troops[scope.mixedSide].lancer>0&&snapshot.runtime.troops[scope.mixedSide].marksman>0&&!seen.has(key)){
    assert.equal(prob,37.5);assert(!pending);const logical={...context,skill:scope.volley,intent:{...context.intent,dealerUnit:'marksman'}};const call=native.metadata().calls+1,passed=native.rng.chance!(10,logical);
    pending={round:context.round,side:scope.mixedSide,call,passed,status:'pending',physicalHook:'normal-Lancer-Shield-chance-before-Shield-draw',logicalOwner:'live-Volley-at-original-MM-slot'};reservations.push(pending);seen.add(key);
   }
  }
  if(enabled&&scope&&context?.phase==='attack_declared'&&context.skill?.side===scope.mixedSide&&context.intent?.dealerSide===scope.mixedSide){
   const key=context.round+':'+scope.mixedSide;
   if(context.skill.id==='CrystalLance'&&context.intent.dealerUnit==='lancer'&&context.intent.takerSide===scope.infantrySide&&context.intent.takerUnit==='infantry'){
    assert(snapshot&&snapshot.round===context.round,'Expected current empty-Infantry slot runtime before normal Lance');
    if(snapshot.runtime.troops[scope.mixedSide].lancer>0&&snapshot.runtime.troops[scope.mixedSide].marksman>0&&!seen.has(key)){
     assert.equal(prob,15);assert(!pending);const logical={...context,skill:scope.volley,intent:{...context.intent,dealerUnit:'marksman'}};const call=native.metadata().calls+1,passed=native.rng.chance!(10,logical);
     pending={round:context.round,side:scope.mixedSide,call,passed,status:'pending',physicalHook:'normal-Lance-chance-before-Lance-draw',logicalOwner:'live-Volley-at-original-MM-slot'};reservations.push(pending);seen.add(key);
    }
   }else if(context.skill.id==='Volley'&&context.intent.dealerUnit==='marksman'){
    assert.equal(prob,10);seen.add(key);if(pending){assert.equal(pending.round,context.round);const passed=pending.passed;pending.status='applied-at-original-MM-slot';pending.applicationPhase=context.phase;pending=null;return passed;}
   }
  }
  return native.rng.chance!(prob,context);
 };
 const onEmptyUnit:any=(round:any,side:any,unit:any,runtime:any,recorder:any)=>{if(pending&&pending.round!==round)finishPending('new round before actual MM trigger');if(enabled&&scope&&side===scope.mixedSide&&unit==='infantry')snapshot={round,runtime};originalEmpty?.(round,side,unit,runtime,recorder);};
 return{rng,onEmptyUnit,adjustWarnings:(warnings:string[])=>{const original=scope.mixedSide+': delayed Gunpowder timing is unvalidated for this context; retaining reference timing. Measured scope is hero-free single-stack Marksmen versus Infantry, Volley 10%/100%, Gunpowder 20%/50%, optional Shield 37.5% with per-hit protection, no additional troop skills, and side-local scheduling.';return [...warnings.filter(w=>w!==original),'Measured exact-scope C2: pre-Shield Volley reservation, delayed Gunpowder and unused-success activation credit enabled; 20 captured reports across both roles, with 3 unused-success counter witnesses.'];},deferAttackSkill:(prepared:any,intent:any)=>intent.dealerSide===scope.mixedSide&&intent.dealerUnit==='marksman'&&intent.takerUnit==='infantry'&&prepared.skill.side===intent.dealerSide&&prepared.skill.sourceKind==='troop_skill'&&prepared.skill.id==='CrystalGunpowder',finish:(result:any)=>{
  finishPending('battle ended before actual MM trigger');
  const unused=reservations.filter(r=>r.status==='unused'),credits=unused.filter(r=>r.passed).length;
  if(credits){const rows=result.skillReport[scope.mixedSide].filter((r:any)=>r.skillId==='Volley');assert.equal(rows.length,1);rows[0].skillActivations+=credits;}
  return{policy:'scoped-u1',scope:'T5FC5LC500+T7FC3MM5-v-T5FC5Inf1; exact audited modifiers/current catalogue',validation:'twenty-observations-both-roles-three-unused-success-witnesses',unusedSuccessfulCredits:credits,unusedFailed:unused.length-credits,reservations};
 }};
}
