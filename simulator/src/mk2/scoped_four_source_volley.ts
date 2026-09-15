import{scopeView}from'./four_source_scope_view';
/** UNAPPLIED exact-scope AV ordering proposal. Inherited trigger-only accounting retained; successful-unused credit unvalidated. */
const assert=Object.assign((ok:any,message='Scoped four-source invariant failed')=>{if(!ok)throw new Error(message);},{equal:(a:any,b:any,message='Scoped four-source invariant failed')=>{if(a!==b)throw new Error(message);}});
import{volleyAfterDeath}from'./volley_persistence';
const G:any={"troops":{"mixed":{"lancer_t10_fc5":100,"marksman_t7_fc3":100},"infantry":{"infantry_t5_fc1":500}},"stats":{"mixed":{"lancer":{"attack":272.49,"defense":272.09,"lethality":186.69,"health":187.42},"marksman":{"attack":297.8,"defense":297.4,"lethality":192.34,"health":193.17}},"infantry":{"infantry":{"attack":153.16,"defense":151.16,"lethality":118.28,"health":113.62}}},"baseStats":{"lancer_t10_fc5":{"attack":1790,"defense":10,"lethality":10,"health":597},"marksman_t7_fc3":{"attack":1317,"defense":10,"lethality":10,"health":247},"infantry_t5_fc1":{"attack":214,"defense":10,"lethality":10,"health":644}},"skills":{"Ambusher":{"description":"Lancer attacks have a chance to strike Marksmen behind Infantry.","troop_type":"lancer","requirements":[{"level":1,"type":"tier","value":7}],"trigger":{"type":"turn","probability":[20]},"effects":{"Ambusher/1":{"type":"attack_order","value":["marksman","infantry","lancer"],"units":{"applies_to":["lancer"],"applies_vs":["marksman"]},"duration":{"turns":{"count":1}}}}},"MasterBrawler":{"description":"Increase Attack Damage to Lancers by 10%","troop_type":"infantry","requirements":[{"level":1,"type":"tier","value":0}],"trigger":{"type":"battle_start"},"effects":{"MasterBrawler/1":{"type":"type.single_target.damage.up","value":[10],"units":{"applies_to":["infantry"],"applies_vs":["lancer"]}}}},"Charge":{"description":"Increase Attack Damage to Marksmen by 10%","troop_type":"lancer","requirements":[{"level":1,"type":"tier","value":0}],"trigger":{"type":"battle_start"},"effects":{"Charge/1":{"type":"type.single_target.damage.up","value":[10],"units":{"applies_to":["lancer"],"applies_vs":["marksman"]}}}},"RangedStrike":{"description":"Increase Attack Damage to Infantry by 10%","troop_type":"marksman","requirements":[{"level":1,"type":"tier","value":0}],"trigger":{"type":"battle_start"},"effects":{"RangedStrike/1":{"type":"type.single_target.damage.up","value":[10],"units":{"applies_to":["marksman"],"applies_vs":["infantry"]}}}},"CrystalLance":{"description":"Lancers have a chance to make an extra skill attack for 100% damage.","troop_type":"lancer","requirements":[{"level":1,"type":"fc","value":3},{"level":2,"type":"fc","value":5}],"trigger":{"type":"attack","probability":[10,15],"source":"lancer"},"effects":{"CrystalLance/1":{"type":"extra_skill_attack","value":[100,100],"units":{"applies_to":["lancer"],"applies_vs":"trigger.target"},"trigger_damage_jobs":[{"source":"use.source","target":"effect.applies_vs"}]}}},"Volley":{"description":"Marksman attacks have a chance to make an extra skill attack for 100% damage.","troop_type":"marksman","requirements":[{"level":1,"type":"tier","value":7}],"trigger":{"type":"attack","probability":[10],"source":"marksman"},"effects":{"Volley/1":{"type":"extra_skill_attack","value":[100],"units":{"applies_to":"trigger.source","applies_vs":"trigger.target"},"trigger_damage_jobs":[{"source":"use.source","target":"effect.applies_vs","damage_kind":"skill"}]}}},"CrystalGunpowder":{"description":"Marksmen have a chance to make an extra skill attack for 50% damage, increased to 75% at FC8 and 87.5% at FC10.","troop_type":"marksman","requirements":[{"level":1,"type":"fc","value":3},{"level":2,"type":"fc","value":5},{"level":3,"type":"fc","value":8},{"level":4,"type":"fc","value":10}],"trigger":{"type":"attack","probability":[20,30,30,30],"source":"marksman"},"effects":{"CrystalGunpowder/1":{"type":"extra_skill_attack","value":[50,50,75,87.5],"units":{"applies_to":["marksman"],"applies_vs":"trigger.target"},"trigger_damage_jobs":[{"source":"use.source","target":"effect.applies_vs"}]}}}}};
const canon=(x:any):string=>x===null||typeof x!=='object'?(JSON.stringify(x)??'undefined'):Array.isArray(x)?'['+x.map(canon).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canon(x[k])).join(',')+'}';
export function scope(compiled:any,mechanics:any={}){
 compiled=scopeView(compiled);
 const m={attackScheduling:'side-local',volleyAfterDeath:'roll',gunpowderTiming:'after-volley',terminalVolleyShield:'roll',gunpowderShield:'per-hit',lanceShield:'per-hit',volleyShield:'per-hit',...mechanics};
 if(m.rng!==undefined&&m.rng!=='lua54')return null;
 for(const [k,v]of Object.entries({attackScheduling:'side-local',volleyAfterDeath:'roll',gunpowderTiming:'after-volley',terminalVolleyShield:'roll',gunpowderShield:'per-hit',lanceShield:'per-hit',volleyShield:'per-hit'}))if(m[k]!==v)return null;
 const input=compiled.input;if(input.engagement_type!=='always'||Object.keys(input).some(k=>!['attacker','defender','engagement_type'].includes(k)&&!(k==='seed'&&input[k]===undefined)))return null;
 const mixed=(['attacker','defender']as const).find(s=>input[s]?.troops?.lancer_t10_fc5===100);if(!mixed)return null;const inf=mixed==='attacker'?'defender':'attacker';
 for(const side of ['attacker','defender']){const i=input[side],f=compiled.fighters[side],r=side===mixed?'mixed':'infantry';
  if(Object.keys(i).some(k=>!['name','troops','stats','heroes','joiner_heroes'].includes(k))||canon(i.heroes)!=='[]'||canon(i.joiner_heroes)!=='[]'||f.heroes.length||f.heroSkills?.length||f.diagnostics.length)return null;
  if(canon(i.troops)!==canon(G.troops[r])||canon(i.stats)!==canon(G.stats[r]))return null;
  const expected=side===mixed?['Ambusher','Charge','CrystalGunpowder','CrystalLance','RangedStrike','Volley']:['MasterBrawler'];
  if(canon(f.troopSkills.map((s:any)=>s.id).sort())!==canon(expected))return null;
 }
 for(const[id,stats]of Object.entries(G.baseStats))if(canon(compiled.config.troopStats[id]?.stats)!==canon(stats))return null;
 for(const[id,skill]of Object.entries(G.skills))if(canon(compiled.config.troopSkills.skills[id])!==canon(skill))return null;
 const skills=compiled.fighters[mixed].troopSkills;for(const[id,p]of [['Ambusher',20],['CrystalLance',15],['Volley',10],['CrystalGunpowder',20]])if(skills.filter((s:any)=>s.id===id&&s.compiledTrigger.probabilityPct===p).length!==1)return null;
 if(canon(compiled.runtimeSkills.randomness.chanceSkillIds[mixed].slice().sort())!==canon(['Ambusher','CrystalGunpowder','CrystalLance','Volley'])||compiled.runtimeSkills.randomness.chanceSkillIds[inf].length)return null;
 return{mixed,inf,volley:skills.find((s:any)=>s.id==='Volley')};
}
export function createScopedFourSourceVolley(compiled:any,native:any,mechanics:any={},policy:'scoped'|'reference'='scoped'){
 assert(['scoped','reference'].includes(policy),'Unknown scoped four-source policy');if(policy==='reference')return null;const mode='AV',fallback=volleyAfterDeath(compiled,mechanics.volleyAfterDeath??'roll');
 const s=scope(compiled,mechanics);if(!s)return null;
 assert(typeof native?.rng?.chance==='function'&&typeof native?.metadata==='function','Caller RNG/metadata pair required');
 let snapshot:any=null,pending:any=null,finished=false;const reservations:any[]=[],checkpoints:any[]=[],seen=new Set<string>();
 const expire=(reason:string)=>{if(pending){pending.status='unused';pending.reason=reason;pending=null;}};
 const draw=(p:number,c:any)=>{const before=native.metadata().calls,result=native.rng.chance(p,c),after=native.metadata().calls;assert.equal(after-before,p>0&&p<100?1:0,'Caller stream metadata mismatch');return result;};
 const rng:any=()=>{throw Error('Private order probe requires labelled calls');};
 rng.chance=(p:number,c:any)=>{
  if(pending&&pending.round!==c?.round)expire('new round before actual MM trigger');
  const own=c?.skill?.side===s.mixed;
  const amb=own&&c.skill.id==='Ambusher'&&c.phase==='before_target';
  const lance=own&&c.skill.id==='CrystalLance'&&c.phase==='attack_declared'&&c.intent?.dealerSide===s.mixed&&c.intent.dealerUnit==='lancer'&&c.intent.takerSide===s.inf&&c.intent.takerUnit==='infantry';
  if(amb||lance){assert(snapshot&&snapshot.round===c.round,'Missing same-round empty Infantry snapshot');
   const alive=snapshot.runtime.troops[s.mixed].lancer>0&&snapshot.runtime.troops[s.mixed].marksman>0&&snapshot.runtime.troops[s.inf].infantry>0;
   checkpoints.push({round:c.round,kind:amb?'Ambusher':'Lance',alive});
   const key=c.round+':'+s.mixed;
   if(alive&&!seen.has(key)&&(mode==='AV'&&lance)){
    assert(!pending);const logical={...c,phase:'attack_declared',skill:s.volley,intent:{...(c.intent??{}),round:c.round,dealerSide:s.mixed,dealerUnit:'marksman',takerSide:s.inf,takerUnit:'infantry'}};
    const call=native.metadata().calls+1,passed=draw(10,logical);
    pending={round:c.round,side:s.mixed,call,passed,status:'pending',physicalHook:amb?'before-Ambusher':'before-Lance',logicalOwner:'Volley-at-original-MM-slot'};reservations.push(pending);seen.add(key);
   }
  }
  if(own&&c.skill.id==='Volley'&&c.phase==='attack_declared'&&c.intent?.dealerSide===s.mixed&&c.intent.dealerUnit==='marksman'){
   assert.equal(p,10);seen.add(c.round+':'+s.mixed);if(pending){assert.equal(pending.round,c.round);const result=pending.passed;pending.status='applied-at-original-MM-slot';pending=null;return result;}
  }
  return draw(p,c);
 };
 const onEmptyUnit=(round:any,side:any,unit:any,runtime:any,recorder:any)=>{if(pending&&pending.round!==round)expire('new round before actual MM trigger');if(side===s.mixed&&unit==='infantry')snapshot={round,runtime};fallback?.(round,side,unit,runtime,recorder);};
 return{rng,onEmptyUnit,reservations,checkpoints,finish:(result:any)=>{assert(!finished,'finish called twice');finished=true;expire('battle ended before actual MM trigger');const credits=reservations.filter(r=>r.status==='unused'&&r.passed).length;
  const row=result.skillReport[s.mixed].filter((r:any)=>r.skillId==='Volley');assert.equal(row.length,1);const u0=row[0].skillActivations; // No finish-time credit: retain activation only at the actual MM trigger.
  return{mode,policy:'scoped-order-only-u0',orderingEvidence:'ten-captured-matches-both-roles-not-unique-server-proof',mixedSide:s.mixed,reservations,checkpoints,unusedSuccessful:credits,unusedFailed:reservations.filter(r=>r.status==='unused'&&!r.passed).length,accounting:{selected:'inherited-trigger-only-U0',actual:u0,U0:u0,U1:u0+credits,unusedSuccessRuleValidated:false,activationProjectionOnly:true},gunpowder:'unchanged-current',eligibilityWarning:'Exact tested AV scope only; unused-success accounting remains unvalidated'};
 }};
}
