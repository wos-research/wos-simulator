import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadSimulatorConfig} from '../config-node';
import {prepareBattle} from '../simulator';
import type {BattleInput} from '../types';
import {adaptTestcaseEntry,testcaseReplayOptions,compareMk2Outcome} from '../tooling/testcases';
import {createMk2Config,normalizeMechanics} from './mechanics';
import {exactScope} from './scoped_own_infantry_ambusher';
import {replayMk2} from './replay';

const config=loadSimulatorConfig();
const newCohorts=['mk2-asymmetric-infantry-forward','mk2-asymmetric-infantry-new-context-reverse','mk2-asymmetric-infantry-new-context-forward'];
const oldCohorts=['mk2-own-infantry-250-forward','mk2-own-infantry-250-reverse'];
const load=(cohort:string)=>Array.from({length:5},(_,i)=>JSON.parse(readFileSync(new URL('../../../testcases/mk2/'+cohort+'-20260914-'+String(i+1).padStart(3,'0')+'.json',import.meta.url),'utf8')));
const newCases=newCohorts.flatMap(load),oldCases=oldCohorts.flatMap(load),cases=[...newCases,...oldCases];
const knownWinnerMismatch='mk2-asymmetric-infantry-new-context-reverse-20260914-004';
const options=(row:any,trace:boolean)=>({...testcaseReplayOptions(row),trace});
const results=new Map(cases.map(row=>[row.test_id,{trace:replayMk2(adaptTestcaseEntry(row),config,options(row,true)),standard:replayMk2(adaptTestcaseEntry(row),config,options(row,false))}]));

// New-scope goldens come from independently checked frozen attacker-first A archives.
// Old 250 controls come from unchanged installed results. Only wrapper replay metadata
// and the frozen model's diagnostic container are excluded; all combat fields, warnings,
// skill reports, traces and every native RNG event remain in the complete-result hash.
const goldens:Record<string,{trace:string;standard:string;rngTrace:string;rngStandard:string}>={
  "mk2-asymmetric-infantry-forward-20260914-001": {
    "trace": "663af6b3d7000129929268fbeb6f0d15b33dea5fe5007cef9e50f8571c4fac0b",
    "standard": "acdb64e6979a2437cf7b91ba85d346356768c18cd3e2be76a26f69453f958c02",
    "rngTrace": "ad7145ab28b0e5bd566e2e6d31c342d83419fa1c83b64deabfc2ef776203002b",
    "rngStandard": "42f1fcbcc08c88e957b2b2af69c706fc48fc617fa4fb4e0cbc460b2cc3162fdf"
  },
  "mk2-asymmetric-infantry-forward-20260914-002": {
    "trace": "b855137758c34db928e124530e5d42ce7bd64d5df806b6e092b26bd48381f53c",
    "standard": "f15fa4179ef213c0e6ee0ee9975bc69bc606c9f402d710d740ae296b301461ba",
    "rngTrace": "05d7e7447749bb0e8b62e7d38a4c93d379e6f3f1ff44a9431fe62612b0e76975",
    "rngStandard": "f3771917b3ab33a1d905715a2b086fe320bd36f7a17c1d1329f2b6fb391fd2c9"
  },
  "mk2-asymmetric-infantry-forward-20260914-003": {
    "trace": "39c5af5dc5f2635035e5b905a47664400d1f44bbd748c5472eaa10c6e6d43b97",
    "standard": "229ddf5c55007e94d77598f03a23b1a91cbb5608b6405c0c3c160981efed7586",
    "rngTrace": "1bdabb1741975a79285741ccdd3526702c8dd327e8255e883b870373801c01ff",
    "rngStandard": "e8fcfbea0935b967ed1672b7d7e511d035c9fe13870dcfa951367a64eba021d1"
  },
  "mk2-asymmetric-infantry-forward-20260914-004": {
    "trace": "1595efec2f5319f71d705e7f371d1f3c3af402b061050880b5f6b842f4300ed8",
    "standard": "be442378ceadddc5840be7bdfdee5f2d9344c51d166514ea4aaa5fd6a84e70c8",
    "rngTrace": "4906c3f06d7900e226815b36ae608e5892f6c8a3b408a2a995d882ec6bb9bab2",
    "rngStandard": "13bf2beff4e1f461d5aa88b02cd084125d4e2eb726f4ca9a78f49b5cadb8ee1a"
  },
  "mk2-asymmetric-infantry-forward-20260914-005": {
    "trace": "60708bc27e3ba0eb006cee0ce98d6fc06bbd489f4bb969f7fadbdd5ed5a3d613",
    "standard": "a07a46c689d256870e1f890f0e2389755686d4f7d5802ef9db4347d3c86ecf42",
    "rngTrace": "f704ae005e5d55ed03a49b16a8ae620fdef3b20545fe9564d530381b4acc6618",
    "rngStandard": "99133e9bf127664e75c41d720d93a0499f7060b5add2cf6c1fa65ad9c5c620a0"
  },
  "mk2-asymmetric-infantry-new-context-forward-20260914-001": {
    "trace": "b8eaba74988d4129005e77541d1e0c57913fc6979a12be62f976a976cc000eb1",
    "standard": "eb2052e82ef2a8f431a2d5de9dd7a55aed5caad069fa3b56665841d621d31012",
    "rngTrace": "be935798ced15245c87b93b377f687868653c9883010d1e54fd280bf71208a2f",
    "rngStandard": "aad1b208c5fd73264cd02e546b81c5c9574be95979377dba449b01e49b056d58"
  },
  "mk2-asymmetric-infantry-new-context-forward-20260914-002": {
    "trace": "eb3d17549e4b505114de1ae853c8930d61937022b84aec57c9dc2be592e86c32",
    "standard": "10a786b96590f568e1f20b014aa5ab1579c6ba4a243704939aed8ef8951b141c",
    "rngTrace": "5673c3310b8222cfc13298f600e7b466db5a4355150e3808712cec0cd790fbc4",
    "rngStandard": "d4adcf8c9e1efed59e2d77dfbf7bed0f86e403a742427673b32e46bfaaa660cb"
  },
  "mk2-asymmetric-infantry-new-context-forward-20260914-003": {
    "trace": "af9871d1ba6dc9e44692052cc1505dfa6a775221287a29474e9944ad2eb68a6c",
    "standard": "be22b92bdaba8271d570fa55371ada776f6097ed9a192b80ee1bca1b5620f152",
    "rngTrace": "8600086d203a555d82eb2d2c77e44d8ea94488b1016a426124b4c6eb63b9082f",
    "rngStandard": "9f4564d8fa3ad1d92bc17fb82bf50900fdafee718d2d49b3c3fc157c3cecc23e"
  },
  "mk2-asymmetric-infantry-new-context-forward-20260914-004": {
    "trace": "b8eb8490810db3d99d44f46340ab3e1ea66701d340243787cbc8fb3a2198627b",
    "standard": "d1203063d6ea5525adfacfa81c02dc16f60924fa12357e9fdb0b1bab667e74c1",
    "rngTrace": "1068a140f589143f342513010250c02a5db76992932a0b90226a73030de81a55",
    "rngStandard": "8b73f2419803225682cfb931ce14600f86cc1e1e3bfbeb27535370200fd35f2d"
  },
  "mk2-asymmetric-infantry-new-context-forward-20260914-005": {
    "trace": "6069bdc3cf49a93b75674893647148087fdca13bd87917a10d1e81f18b8d1ab8",
    "standard": "2c4897ad9217b270be982ab5f256990d8adb741dab7525a78feb3d602fa56983",
    "rngTrace": "9544d8a9cc4fc52170999ddef8ce9216b1979ebe346fad16891ece4700323956",
    "rngStandard": "ff461ff8eef0fb4ff721b0f9df36a851f7e0d5e28ce5b7826f3d87275577e7b4"
  },
  "mk2-asymmetric-infantry-new-context-reverse-20260914-001": {
    "trace": "1e9e1e469660098b8975e08e5d95ac4f52259c4bbe135e19ec3775357762a8d2",
    "standard": "b6826d68028b2bd1ec8d37c057b5e963adba2458e04d78ecc2e474008a6c30d3",
    "rngTrace": "fffebb5cd481112d38636847d89915315d0a174ebb9ac2471331e65957c66878",
    "rngStandard": "d5003b36f699ebf3be029d39b19e863e9278cf72e878a59f9ff514d1d317acb2"
  },
  "mk2-asymmetric-infantry-new-context-reverse-20260914-002": {
    "trace": "779ec02b3081403e8ac5cf15d1db4b7a26f579da2ad4bc6d498f62861b166d0b",
    "standard": "a3ea0eb56824bf25c3777f2db497aca3a1bfe3cdb0359661fa965a46260f817c",
    "rngTrace": "ead05f39631d7227a609b7c4c75c2c1d3e558d91d5486b94705dbf907f61cc3a",
    "rngStandard": "528ba5e275a7856a4c178f66fe2ffc2fc87745e2341a03ed4e26cf9e3d380ed2"
  },
  "mk2-asymmetric-infantry-new-context-reverse-20260914-003": {
    "trace": "56faf7c25a2d74d57c019a315144dc6406aca1f844491920cc137a91216da770",
    "standard": "63fe5aed35adaead906763386912a9bbaa30218b4b45e6d4d9d78392e15282e6",
    "rngTrace": "9cda2b8385e7daa999718e76c4618d959d153c24b808dccd60510538dc1152f6",
    "rngStandard": "35140cfc12309b87f29f1b230ac6366f97c1bb18b136dac8938e8adc5d260fe2"
  },
  "mk2-asymmetric-infantry-new-context-reverse-20260914-004": {
    "trace": "d293e99601496f30934ae4b30eb4edd3fa0c97386a4c4d7086ed0c49e18d1d64",
    "standard": "a3b45d8c1e75758df95820e663648fc7fedf7c667774223f5a07bfb3c844d98d",
    "rngTrace": "271be1bfe2b2403a2e1e747b49c0fce70665f3b247c59fef9f346a000e761610",
    "rngStandard": "4bb518a317b664e81dba0eb821068b243af7c8a21fd446cb67e831b6fe214e80"
  },
  "mk2-asymmetric-infantry-new-context-reverse-20260914-005": {
    "trace": "e909fa23b129f3c9f172a480c24a2e3a400098e0778f984cb860a79b19740949",
    "standard": "5a5e60591955ccf73184dce51cc813bba703a875c184d7ae54fc9be211bec4a4",
    "rngTrace": "5e46dc1dd7571d4862ecf61aef7bcfaa5c81854f0789e4aa81979f3cca3a8abc",
    "rngStandard": "cfbdc48acf320ce14b1bddb7d3390248b346e5e5aa9906fa05a1f43951f2946d"
  },
  "mk2-own-infantry-250-forward-20260914-001": {
    "trace": "dfb17367e35e554dd9deacb5ee564193d39d979839bbc3e5d13b558ac0eb9924",
    "standard": "74270aad5454e5f6064727e770507506d4f94752e6c510de1062ae1c3039f224",
    "rngTrace": "82e09f367276f2b47ca5c5b64ad471a7ab5f6a5e8adc768cae34c2eb8c52ad35",
    "rngStandard": "5587b13b88b61a5463bf7a1d83d02f708a9e286c36ebb3dc23574dc3d1f66915"
  },
  "mk2-own-infantry-250-forward-20260914-002": {
    "trace": "666b782cc00ff6f75a2a76891e5182b953c9c51698342df9f21677126ae55165",
    "standard": "345495c6afcce524bda691d8cb1948e066553b7f2688fa08917aeaee8172ca4c",
    "rngTrace": "075eace408ae35a19fe67669d0913df3ae8c0116f44f7839c919e2424a1447c5",
    "rngStandard": "7c8d15f3a34507d582b2776ab8a855f5656f298b38d7476c75c9dd22cd76e3b6"
  },
  "mk2-own-infantry-250-forward-20260914-003": {
    "trace": "e460babfdc89d62c05fe84260bf61758d945d8cab94949ceb4fedd984dd8dc06",
    "standard": "d1894341a2749b2610a621ebb0c6be27b8a6d07d05c3ce94ad75c2d2ece8f365",
    "rngTrace": "c99200f5955884834632cafcf6584a60db7e7a4e5379708a37a944f0d62967a6",
    "rngStandard": "78508c91021503fd3b157c1cb7a04e0064e40e8c25dd9fccd24809d7f5b71989"
  },
  "mk2-own-infantry-250-forward-20260914-004": {
    "trace": "b1cdd6a11e60b92ec4863637ac4776d4ec43395fe6c7e44e66666efe629e61a8",
    "standard": "10568911136370661775dc860611a208ed59dd6aea420d742266372758e08e84",
    "rngTrace": "2a3b653f03e71df159f8e1b83d39c2581a5469faa9581ac364a37eca128b1676",
    "rngStandard": "e7c55f756796e7ff5aa34a379a1951d30177fad29a71abfcc43bccb474de9342"
  },
  "mk2-own-infantry-250-forward-20260914-005": {
    "trace": "7d713d82100aab673908892ad5ec333eac01763b6c145ea8e7500fb70eabb99a",
    "standard": "b288991c18b31f656e54110a598024176aca895e2e6c616e8beebd6a549f4ee2",
    "rngTrace": "f57c5c218e95b86010ec104bf5f69baa84afdfeebfaf606362a2f3dd666ee1ea",
    "rngStandard": "92dd0bbd6ae88629155041c561b57b12f7a706c3c68fca34b80ad8bd78d34005"
  },
  "mk2-own-infantry-250-reverse-20260914-001": {
    "trace": "48c3c4b0f59f1d1b63aad00229d1246da1e6e61f861e4c5a3968fb0c4da28fe5",
    "standard": "994bbb0b1e2284d2ffb9cec6be0e40ab9b0df1d4b7b2e02af3666b5cad2faf72",
    "rngTrace": "821e814fb9b7e3139a9b77f5b2f6c3721be31c684b483fb6017d42c8659e0472",
    "rngStandard": "74551425a3d32126cbd74ea96d0cf9f248ac5b42a9aa7a5f5eb8dc32bc493133"
  },
  "mk2-own-infantry-250-reverse-20260914-002": {
    "trace": "9398b65f51ee592b5928ccb4e2fa07febcf5b5dbe6abd503edb9d6d5366d8588",
    "standard": "3206d5150b0720e33a886fb578d1cfb5155a1b9266e46cac6ad2b5bfd7994a56",
    "rngTrace": "37d78dff2f626a5a6d3cad13b25c5e50fde189ea4aa33e13f74c7b71e72640e1",
    "rngStandard": "8a951e019606cc27800b9b53339b2bab9f52cf3978aa42e2fb704a5b892b65f5"
  },
  "mk2-own-infantry-250-reverse-20260914-003": {
    "trace": "98926766915f35e5a2867eaeff635b753fbc1c6af778aa8f1bcf50bc7bf3f75b",
    "standard": "d05dd9514e0d6e1302fe3e171ff3e2ec8f5dfae9bb43d36994fc7fc296909e88",
    "rngTrace": "75190f8d9df06443c4f50d9b5fb25eb5c9aab3389d37eb90b2ee363a75ebd741",
    "rngStandard": "39a2390dbf2b9bd233d9682254df08778ca469ec6a0deb2fad16bce44f2f393e"
  },
  "mk2-own-infantry-250-reverse-20260914-004": {
    "trace": "f4756b4826ff4a5908e9725b5de252ddec7604c0da2c3dc2efbdf49b04228f9d",
    "standard": "0b787257d4d45c41f0f9ce1563155c0ae6a62a545e1b7eb7bb6d78f5bba71c00",
    "rngTrace": "cf0e6d0ae076f004f04c17b1628805a6e36efd5b41254d6e62c67a4a5f1cfdde",
    "rngStandard": "01ddcc76e891ca6a7d15b82588cc2840e283ef3c7cb82d42a6d86e94b855952a"
  },
  "mk2-own-infantry-250-reverse-20260914-005": {
    "trace": "8c537e9db1ecb3b4cf716fe43c85c489f7231c67f7feb405bc21a04466833e60",
    "standard": "b66f1f7b083198e4242932220543d1dd4ea2727f088e5941269c01d843e2b697",
    "rngTrace": "3b5dd9c497d36c6f52bebf0f2e08d66f499215849f240d0475364a29ae6d578d",
    "rngStandard": "7d97597af19603847aca6a0ddee39af71604dd4bead9a53b4e03b0bf02847ad8"
  }
};
const canonical=(x:any):string=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const hash=(x:any)=>createHash('sha256').update(canonical(JSON.parse(JSON.stringify(x)))).digest('hex');
function numerical(result:any){const x=JSON.parse(JSON.stringify(result));delete x.replayMetadata;delete x.experimentalOwnInfantry;return x;}

test('15 asymmetric reports match all 90 survivor slots and 75 explicit procs; the UI winner discrepancy remains visible',()=>{
 assert.equal(newCases.length,15);assert.equal(new Set(newCases.map(c=>c.test_id)).size,15);
 let winnerMatches=0,survivors=0,procs=0;
 for(const row of newCases){const result=results.get(row.test_id)!.trace,comparison=compareMk2Outcome(row.observed,result);assert.deepEqual(result.remaining,row.observed.remaining,row.test_id);survivors+=comparison.survivorChecks;procs+=comparison.procChecks.length;assert.ok(comparison.procChecks.every(c=>c.exact),row.test_id);
  if(row.test_id===knownWinnerMismatch){assert.equal(row.observed.winner,'defender');assert.equal(result.winner,'draw');assert.deepEqual(result.remaining,{attacker:{infantry:0,lancer:0,marksman:0},defender:{infantry:0,lancer:0,marksman:0}});assert.equal(comparison.exact,false);assert.deepEqual(comparison.differences,[{field:'winner',expected:'defender',actual:'draw'}]);}
  else{assert.equal(comparison.exact,true,row.test_id);assert.equal(result.winner,row.observed.winner);winnerMatches++;}
  assert.equal(result.replayMetadata.seedSource,'recorded-seed');assert.equal(result.rng.seed,String(row.replay.reportedSeed));
 }
 assert.equal(winnerMatches,14);assert.equal(survivors,90);assert.equal(procs,75);
});

test('all 15 frozen A complete-result/RNG goldens and 10 unchanged 250 controls pass in trace and standard modes',()=>{
 assert.equal(Object.keys(goldens).length,25);
 for(const row of cases){const r=results.get(row.test_id)!,g=goldens[row.test_id];assert.ok(g,row.test_id);assert.equal(hash(numerical(r.trace)),g.trace,row.test_id+' full trace');assert.equal(hash(numerical(r.standard)),g.standard,row.test_id+' full standard');assert.equal(hash(r.trace.rng),g.rngTrace,row.test_id+' RNG trace');assert.equal(hash(r.standard.rng),g.rngStandard,row.test_id+' RNG standard');}
});

test('attacker-first reservations are consumed once without moving normal attack slots; standard mode preserves success credit',()=>{
 const order=['attacker:infantry','attacker:lancer','attacker:marksman','defender:infantry','defender:lancer','defender:marksman'];
 for(const row of cases){const {trace:r,standard:off}=results.get(row.test_id)!,m:any=r.replayMetadata.ownInfantryAmbusher;assert.ok(m);assert.equal(m.reservations.length,r.rounds*2);assert.ok(m.reservations.every((x:any)=>x.status==='consumed-at-original-trigger'));assert.equal(m.physicalServerPhaseProven,false);
  assert.equal(off.winner,r.winner);assert.deepEqual(off.remaining,r.remaining);assert.equal(off.rng.calls,r.rng.calls);assert.equal(off.rng.draws,r.rng.draws);assert.equal(off.rng.events,undefined);
  for(const side of ['attacker','defender']as const){assert.deepEqual(off.skillReport[side].map(x=>[x.skillId,x.skillActivations]),r.skillReport[side].map(x=>[x.skillId,x.skillActivations]));assert.equal(r.skillReport[side].find(x=>x.skillId==='Ambusher')!.skillActivations,m.reservations.filter((x:any)=>x.side===side&&x.passed).length);}
  for(let round=1;round<=r.rounds;round++){assert.deepEqual(r.rng.events!.filter(x=>x.round===round).slice(0,2).map(x=>[x.side,x.skillId,x.phase]),[['attacker','Ambusher','round_start'],['defender','Ambusher','round_start']]);const actual=r.attacks.filter(x=>x.round===round&&x.kind==='normal').map(x=>x.dealerSide+':'+x.dealerUnit);assert.deepEqual(actual,[...actual].sort((a,b)=>order.indexOf(a)-order.indexOf(b)));}
 }
});

test('existing 250 captured controls retain exact observations and their original scope metadata',()=>{
 for(const row of oldCases){const r=results.get(row.test_id)!.trace;assert.equal(compareMk2Outcome(row.observed,r).exact,true,row.test_id);assert.equal((r.replayMetadata.ownInfantryAmbusher as any).scope,'exact250troop25Inf+100LCeach/currenttwoactorroles');}
});

function assertFallback(input:BattleInput,row:any,cfg=config){for(const trace of [false,true]){const actual=replayMk2(input,cfg,options(row,trace)),reference=replayMk2(input,cfg,{...options(row,trace),ownInfantryAmbusher:'reference'});assert.equal(actual.replayMetadata.ownInfantryAmbusher,undefined);assert.deepEqual(actual,reference);}}
test('the unvalidated original reverse profile remains excluded',()=>{
 const row=newCases[0],x=adaptTestcaseEntry(row);[x.attacker,x.defender]=[x.defender,x.attacker];assertFallback(x,row);
});

test('changed counts and modifiers use the reference fallback in each added context',()=>{
 for(const cohort of newCohorts){const row=newCases.find(c=>c.test_id.startsWith(cohort+'-20260914-'))!;for(const side of ['attacker','defender']as const){for(const mutate of [(x:any)=>x[side].troops.lancer_t10_fc5++,(x:any)=>x[side].stats.lancer.defense+=0.01]){const x=structuredClone(adaptTestcaseEntry(row));mutate(x);assertFallback(x,row);}}}
});

test('guard rejects changed skill definitions, base stats, mechanics and compiled heroes',()=>{
 for(const cohort of newCohorts){const row=newCases.find(c=>c.test_id.startsWith(cohort+'-20260914-'))!,input=adaptTestcaseEntry(row),mechanics=normalizeMechanics(options(row,true).mechanics),compile=()=>prepareBattle(input,createMk2Config(config,mechanics));assert.equal(exactScope(compile(),mechanics),true);
  const skill=compile();(skill.config.troopSkills.skills.Ambusher.trigger as any).probability=[21];assert.equal(exactScope(skill,mechanics),false);
  const stats=compile(),troop=stats.config.troopStats.lancer_t10_fc5;stats.config.troopStats.lancer_t10_fc5={...troop,stats:{...troop.stats,attack:troop.stats.attack+1}};assert.equal(exactScope(stats,mechanics),false);
  for(const key of Object.keys(mechanics))assert.equal(exactScope(compile(),{...mechanics,[key]:'unsupported'}),false,key);
  const heroes=compile();(heroes.fighters.attacker.heroes as any[]).push({});assert.equal(exactScope(heroes,mechanics),false);
 }
});
