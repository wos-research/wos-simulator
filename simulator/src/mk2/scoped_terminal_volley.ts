import {TERMINAL_CONTEXTS, TERMINAL_CONFIG, TERMINAL_PROFILES} from './terminal_volley_guard_data';
const canonical=(x:any):string=>x===null||typeof x!=='object'?(JSON.stringify(x)??'undefined'):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const equal=(a:any,b:any)=>canonical(a)===canonical(b);
const requireState=(ok:unknown,message:string)=>{if(!ok)throw new Error('Terminal Volley invariant: '+message);};
/** Raw decoded battle context is mandatory. Callers lacking it retain baseline behavior. */
export function createScopedTerminalVolley(compiled:any,native:any,mechanics:any,evidence:unknown,inheritedEmpty?:any){
 if(!evidence||!equal(mechanics,TERMINAL_CONFIG.mechanics))return null;
 const input=structuredClone(compiled.input);delete input.attacker.name;delete input.defender.name;
 // Loader owns an undefined seed key; it has no numerical meaning. Defined/unknown keys still refuse.
 if(input.seed===undefined)delete input.seed;
 // Explicit default cap is numerically identical; every nondefault cap is outside evidence scope.
 if(input.maxRounds===1500)delete input.maxRounds;
 const context=TERMINAL_CONTEXTS.find(c=>equal(c.input,input)&&equal(c.evidence,evidence));if(!context)return null;
 for(const[id,profile]of Object.entries(TERMINAL_PROFILES))if(!equal(compiled.config.troopStats[id],profile))return null;
 for(const[id,skill]of Object.entries(TERMINAL_CONFIG.skills))if(!equal(compiled.config.troopSkills.skills[id],skill))return null;
 const mixedSide=input.attacker.troops.marksman_t7_fc3?'attacker':'defender',otherSide=mixedSide==='attacker'?'defender':'attacker';
 for(const side of ['attacker','defender']){const f=compiled.fighters[side],role=side===mixedSide?'mixed':'pure';if(f.heroes.length||f.diagnostics.length||!equal(f.troopSkills.map((s:any)=>s.id).sort(),TERMINAL_CONFIG.skillIds[role]))return null;}
 const ambusher=compiled.fighters[mixedSide].troopSkills.find((s:any)=>s.id==='Ambusher'),volley=compiled.fighters[mixedSide].troopSkills.find((s:any)=>s.id==='Volley');
 requireState(ambusher.compiledTrigger.probabilityPct===20&&volley.compiledTrigger.probabilityPct===10,'unchanged probabilities');
 let roundNow=0,ambPending:any=null,volleyPending:any=null;const reservations:any[]=[],volleyReservations:any[]=[];
 const expire=(reason:string,recorder:any)=>{if(!volleyPending)return;volleyPending.status='unused';volleyPending.reason=reason;recorder.recordSkillTriggerAttempt(volley);if(volleyPending.passed){recorder.recordSkillTriggered(volley);volleyPending.credited=true;}volleyPending=null;};
 const rng:any=()=>{throw new Error('Unlabelled terminal Volley RNG draw');};
 rng.chance=(p:number,c:any)=>{
  if(c?.skill?.side===mixedSide&&c.skill.id==='Ambusher'){requireState(p===20&&c.phase==='before_target'&&ambPending?.round===c.round,'Ambusher cached trigger');const passed=ambPending.passed;ambPending.cacheConsumed=true;ambPending=null;return passed;}
  if(c?.skill?.side===mixedSide&&c.skill.id==='Volley'&&c.phase==='attack_declared'&&volleyPending){requireState(p===10&&volleyPending.round===c.round,'Volley cached trigger');const passed=volleyPending.passed;volleyPending.status='applied-at-original-MM-slot';volleyPending=null;return passed;}
  return native.rng.chance(p,c);
 };
 const onEmptyUnit=(round:any,side:any,unit:any,runtime:any,recorder:any)=>{
  if(round!==roundNow){
   requireState(side==='attacker'&&unit==='infantry'&&!ambPending,'round boundary');expire('new round',recorder);roundNow=round;
   const before=structuredClone(runtime.troops),alive=before[mixedSide].lancer>0;
   const passed=native.rng.chance(20,{skill:ambusher,round,phase:'empty_unit'}),a={round,aliveAtRoundStart:alive,roundStartTroops:before,passed,call:native.metadata().calls,cacheConsumed:false,credited:false};reservations.push(a);
   if(alive)ambPending=a;else{recorder.recordSkillTriggerAttempt(ambusher);if(passed){recorder.recordSkillTriggered(ambusher);a.credited=true;}}
   if(before[mixedSide].marksman>0){const passed=native.rng.chance(10,{skill:volley,round,phase:'attack_declared',intent:{round,dealerSide:mixedSide,dealerUnit:'marksman',takerSide:otherSide,takerUnit:'lancer'}});volleyPending={round,passed,call:native.metadata().calls,status:'pending',physicalHook:'after-global-Ambusher',credited:false};volleyReservations.push(volleyPending);}
   requireState(equal(runtime.troops,before),'no troop mutation at reservation');
  }
  inheritedEmpty?.(round,side,unit,runtime,recorder);
 };
 const onBattleEnd=(rounds:number,_runtime:any,recorder:any)=>{requireState(!ambPending,'Ambusher consumed');expire('battle ended',recorder);requireState(reservations.length===rounds,'one reservation per round');};
 return {rng,onEmptyUnit,onBattleEnd,finish:()=>({scope:('scope' in context?context.scope:'terminal38-and40-exact-context-v1'),mixedSide,reservations,volleyReservations,successfulUnusedCredited:volleyReservations.filter(v=>v.credited).length,accounting:'engine-recorder-before-result',normalAttackSlotsUnchanged:true})};
}
