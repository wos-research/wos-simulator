/** Exact captured RNG-order scope; no troop stats or chance probabilities changed. */
const canonical=(x:any):string=>x===null||typeof x!=='object'?(JSON.stringify(x)??'undefined'):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const assert=Object.assign((ok:any,message='Scoped Ambusher invariant failed')=>{if(!ok)throw new Error(message);},{equal:(a:any,b:any,message='Scoped Ambusher invariant failed')=>{if(a!==b)throw new Error(message);},deepEqual:(a:any,b:any,message='Scoped Ambusher invariant failed')=>{if(canonical(a)!==canonical(b))throw new Error(message);}});
const GUARD:any={"troops":{"mixed":{"lancer_t10_fc5":1,"marksman_t5_fc3":100},"pure":{"lancer_t5_fc5":100}},"mechanics":{"fcRounding":"floor","catalogueCorrections":"validated","gunpowderShield":"per-hit","lanceShield":"per-hit","volleyShield":"per-hit","attackScheduling":"side-local","volleyAfterDeath":"roll","gunpowderTiming":"after-volley","terminalVolleyShield":"roll"},"actors":{"mixed":{"allTypeStatsFromStatModel":{"infantry":{"attack":305.47,"defense":308.07,"lethality":193.66,"health":187.34},"lancer":{"attack":272.49,"defense":272.09,"lethality":186.69,"health":187.42},"marksman":{"attack":297.8,"defense":297.4,"lethality":192.34,"health":193.17}}},"pure":{"allTypeStatsFromStatModel":{"infantry":{"attack":299.59,"defense":303.77,"lethality":188.53,"health":188.46},"lancer":{"attack":264.11,"defense":265.79,"lethality":180.51,"health":179.22},"marksman":{"attack":291.92,"defense":292.1,"lethality":197.31,"health":195.47}}}},"baseStats":{"lancer_t10_fc5":{"attack":1790,"defense":10,"lethality":10,"health":597},"marksman_t5_fc3":{"attack":945,"defense":10,"lethality":10,"health":177},"lancer_t5_fc5":{"attack":782,"defense":10,"lethality":10,"health":260}},"skills":{"Ambusher":{"description":"Lancer attacks have a chance to strike Marksmen behind Infantry.","troop_type":"lancer","requirements":[{"level":1,"type":"tier","value":7}],"trigger":{"type":"turn","probability":[20]},"effects":{"Ambusher/1":{"type":"attack_order","value":["marksman","infantry","lancer"],"units":{"applies_to":["lancer"],"applies_vs":["marksman"]},"duration":{"turns":{"count":1}}}}},"Charge":{"description":"Increase Attack Damage to Marksmen by 10%","troop_type":"lancer","requirements":[{"level":1,"type":"tier","value":0}],"trigger":{"type":"battle_start"},"effects":{"Charge/1":{"type":"type.single_target.damage.up","value":[10],"units":{"applies_to":["lancer"],"applies_vs":["marksman"]}}}},"CrystalGunpowder":{"description":"Marksmen have a chance to make an extra skill attack for 50% damage, increased to 75% at FC8 and 87.5% at FC10.","troop_type":"marksman","requirements":[{"level":1,"type":"fc","value":3},{"level":2,"type":"fc","value":5},{"level":3,"type":"fc","value":8},{"level":4,"type":"fc","value":10}],"trigger":{"type":"attack","probability":[20,30,30,30],"source":"marksman"},"effects":{"CrystalGunpowder/1":{"type":"extra_skill_attack","value":[50,50,75,87.5],"units":{"applies_to":["marksman"],"applies_vs":"trigger.target"},"trigger_damage_jobs":[{"source":"use.source","target":"effect.applies_vs"}]}}},"CrystalLance":{"description":"Lancers have a chance to make an extra skill attack for 100% damage.","troop_type":"lancer","requirements":[{"level":1,"type":"fc","value":3},{"level":2,"type":"fc","value":5}],"trigger":{"type":"attack","probability":[10,15],"source":"lancer"},"effects":{"CrystalLance/1":{"type":"extra_skill_attack","value":[100,100],"units":{"applies_to":["lancer"],"applies_vs":"trigger.target"},"trigger_damage_jobs":[{"source":"use.source","target":"effect.applies_vs"}]}}},"RangedStrike":{"description":"Increase Attack Damage to Infantry by 10%","troop_type":"marksman","requirements":[{"level":1,"type":"tier","value":0}],"trigger":{"type":"battle_start"},"effects":{"RangedStrike/1":{"type":"type.single_target.damage.up","value":[10],"units":{"applies_to":["marksman"],"applies_vs":["infantry"]}}}}},"skillIds":{"mixed":["Ambusher","Charge","CrystalGunpowder","CrystalLance","RangedStrike"],"pure":["Charge","CrystalLance"]}};
export function exactScope(compiled:any,mechanics:any){
 if(canonical(mechanics)!==canonical(GUARD.mechanics))return null;
 const input=compiled.input;if(input.engagement_type!=='always'||Object.keys(input).some(k=>!['engagement_type','attacker','defender'].includes(k)&&!(k==='seed'&&input.seed===undefined)))return null;
 // Ten independent reports support the exact ten-Lancer mixed army in both roles.
 const next210Mixed={...GUARD.troops.mixed,lancer_t10_fc5:10};
 const mixed=(['attacker','defender']as const).find(s=>[GUARD.troops.mixed,next210Mixed].some(t=>canonical(input[s].troops)===canonical(t)));if(!mixed)return null;const other=mixed==='attacker'?'defender':'attacker';
 const expectedMixed=canonical(input[mixed].troops)===canonical(next210Mixed)?next210Mixed:GUARD.troops.mixed;
 for(const side of['attacker','defender']){const role=side===mixed?'mixed':'pure',f=compiled.fighters[side],a=input[side];if(canonical(a.troops)!==canonical(role==='mixed'?expectedMixed:GUARD.troops.pure)||canonical(a.heroes)!=='[]'||canonical(a.joiner_heroes)!=='[]'||f.heroes.length||f.diagnostics.length)return null;if(Object.keys(a).some(k=>!['name','troops','stats','heroes','joiner_heroes'].includes(k)))return null;
 const active=role==='mixed'?['lancer','marksman']:['lancer'],keys=Object.keys(a.stats??{}).sort();if(canonical(keys)!==canonical(active)&&canonical(keys)!==canonical(['infantry','lancer','marksman']))return null;for(const type of keys)if(canonical(a.stats[type])!==canonical(GUARD.actors[role].allTypeStatsFromStatModel[type]))return null;
 if(canonical(f.troopSkills.map((s:any)=>s.id).sort())!==canonical(GUARD.skillIds[role]))return null;}
 for(const[id,stats]of Object.entries(GUARD.baseStats))if(canonical(compiled.config.troopStats[id]?.stats)!==canonical(stats))return null;
 for(const[id,skill]of Object.entries(GUARD.skills))if(canonical(compiled.config.troopSkills.skills[id])!==canonical(skill))return null;
 const amb=compiled.fighters[mixed].troopSkills.filter((s:any)=>s.id==='Ambusher');if(amb.length!==1||amb[0].compiledTrigger.probabilityPct!==20)return null;return{mixedSide:mixed,otherSide:other,ambusher:amb[0]};
}
export type PhaseModel='G0'|'G1';
const plain=(x:any)=>JSON.parse(JSON.stringify(x));
export function createPhaseAdapter(compiled:any,native:any,mechanics:any,model:PhaseModel,inheritedEmpty?:any){
 assert(['G0','G1'].includes(model),'Unknown phase model');
 const scope=exactScope(compiled,mechanics);if(!scope)throw new Error('Outside exact observed Ambusher army/currentactor guard');
 assert(typeof native?.rng?.chance==='function'&&typeof native?.metadata==='function','Labelled native RNG required');
 const reservations:any[]=[],hooks:any[]=[],seen=new Set<string>();let pending:any=null,finished=false;
 const firstDrawByRound=new Map<number,number>();let ambusherDraws=0;
 const draw=(p:number,c:any)=>{const before=native.metadata().calls;const passed=native.rng.chance(p,c);const after=native.metadata().calls;if(after!==before){assert.equal(after,before+1);assert(Number.isInteger(c?.round),'Missing draw round');if(!firstDrawByRound.has(c.round))firstDrawByRound.set(c.round,after);if(c?.skill?.id==='Ambusher')ambusherDraws++;}return passed;};
 const rng:any=()=>{throw new Error('Unlabelled phase RNG call');};
 rng.chance=(p:number,c:any)=>{
  assert(!finished);
  if(c?.skill?.id==='Ambusher'){
   assert.equal(c.skill.side,scope.mixedSide);assert.equal(p,20);assert.equal(c.phase,'before_target');
   assert(pending&&pending.round===c.round&&pending.aliveAtRoundStart&&!pending.cacheConsumed,'Missing, stale, or reused live-source reservation');
   const calls=native.metadata().calls;pending.cacheConsumed=true;pending.consumedAtOriginalPhase=c.phase;pending.callsAtOriginalTrigger=calls;
   const passed=pending.passed;pending=null;assert.equal(native.metadata().calls,calls);return passed;
  }
  return draw(p,c);
 };
 const onEmptyUnit=(round:any,side:any,unit:any,runtime:any,recorder:any)=>{
  assert(!finished);const key=round+':'+side+':'+unit;assert(!seen.has(key),'Duplicate empty hook');seen.add(key);
  const firstForRound=!hooks.some(h=>h.round===round),before=plain(runtime.troops),calls=native.metadata().calls;
  inheritedEmpty?.(round,side,unit,runtime,recorder);
  hooks.push({round,side,unit,inheritedInvoked:Boolean(inheritedEmpty),callsBefore:calls,callsAfterInherited:native.metadata().calls});
  // Exact guard has no Volley and no inherited scoped callback; retain dispatch and verify inertness.
  assert.deepEqual(runtime.troops,before,'Inherited hook changed exact-scope troop state');
  assert.equal(native.metadata().calls,calls,'Inherited callback consumed an unexpected exact-scope draw');
  if(!firstForRound)return;
  assert.equal(side,'attacker');assert.equal(unit,'infantry');assert.equal(before.attacker.infantry,0);assert.equal(before.defender.infantry,0);
  assert(!pending,'Prior live reservation was never consumed');
  assert(!firstDrawByRound.has(round),'Global proxy was not before all same-round draws');
  assert(Object.values(before[scope.otherSide]).reduce((a:number,b:any)=>a+b,0)>0);
  const alive=before[scope.mixedSide].lancer>0;
  if(!alive)assert(before[scope.mixedSide].lancer===0&&before[scope.mixedSide].marksman>0);
  const passed=draw(20,{skill:scope.ambusher,round,phase:'empty_unit'});
  assert.equal(native.metadata().calls,calls+1);
  const event=native.metadata().events?plain(native.metadata().events.at(-1)):undefined;if(event){assert.equal(event.skillId,'Ambusher');assert.equal(event.side,scope.mixedSide);assert.equal(event.probabilityPct,20);}
  const reservation:any={round,physicalProxy:'attacker-empty-infantry-before-first-attack',phaseLabelIsNotProof:true,aliveAtRoundStart:alive,roundStartTroops:before,passed,call:calls+1,...(event?{event}:{}),cacheConsumed:false,credited:false};
  reservations.push(reservation);
  if(alive)pending=reservation;
  else{recorder.recordSkillTriggerAttempt(scope.ambusher);if(model==='G1'&&passed){recorder.recordSkillTriggered(scope.ambusher);reservation.credited=true;}}
  assert.deepEqual(runtime.troops,before,'Reservation must never change troops');
 };
 return{rng,onEmptyUnit,finish:(result:any)=>{
  assert(!finished);finished=true;assert(!pending,'Unconsumed live-source reservation at finish');
  assert.equal(reservations.length,result.rounds,'Require one Ambusher reservation in every simulated round');
  for(const r of reservations){
   assert.equal(r.cacheConsumed,r.aliveAtRoundStart);assert.equal(r.credited,!r.aliveAtRoundStart&&model==='G1'&&r.passed);
   const expected=['attacker','defender'].flatMap(side=>['infantry','lancer','marksman'].filter(unit=>r.roundStartTroops[side][unit]<=0).map(unit=>({side,unit})));
   assert.deepEqual(hooks.filter(h=>h.round===r.round).map(({side,unit})=>({side,unit})),expected,'Inherited empty-hook dispatch/order changed');
   assert.equal(firstDrawByRound.get(r.round),r.call,'Reserved Ambusher must be first draw of its round');
  }
  assert.equal(ambusherDraws,reservations.length);
  const aliveSuccesses=reservations.filter(r=>r.aliveAtRoundStart&&r.passed).length,credits=reservations.filter(r=>r.credited).length;
  assert.equal(result.skillReport[scope.mixedSide].find((s:any)=>s.skillId==='Ambusher').skillActivations,aliveSuccesses+credits);
  return{model,mixedSide:scope.mixedSide,placementHypothesis:'Alive-and-dead pre-first-attack reserve; original side-local live effect materialization',phaseLabelIsNotProof:true,reservations,hooks,aliveReservations:reservations.filter(r=>r.aliveAtRoundStart).length,aliveSuccesses,postDeathReservations:reservations.filter(r=>!r.aliveAtRoundStart).length,postDeathSuccesses:reservations.filter(r=>!r.aliveAtRoundStart&&r.passed).length,addedPostDeathCredits:credits,allLiveCachesConsumedExactlyOnce:true,allRoundsBeforeFirstChance:true,inheritedEmptyHookOrderVerified:true};
 }};
}

/** Normalize only the nine shared combat settings; backend-only options never enter guard equality. */
export function normalizeScopedAmbusherMechanics(m:any={}){
 if(m.rng!==undefined&&m.rng!=='lua54'||m.mixedStacks!==undefined&&m.mixedStacks!=='upstream'||m.channels!==undefined&&m.channels!=='literal-extra')return null;
 return Object.fromEntries(Object.entries(GUARD.mechanics).map(([key,value])=>[key,m[key]??value]));
}
export function createScopedGlobalAmbusher(compiled:any,native:any,mechanics:any,policy:'scoped'|'reference'='scoped',fallback?:any){
 if(!['scoped','reference'].includes(policy))throw new Error('Unknown scoped global Ambusher policy');
 if(policy==='reference'||!mechanics||!exactScope(compiled,mechanics))return null;
 return createPhaseAdapter(compiled,native,mechanics,'G1',fallback);
}
