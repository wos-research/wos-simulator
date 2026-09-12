/** Event-level diagnostics kept separate from outcome fitting. */
import {readFileSync,writeFileSync} from 'node:fs';
import {prepare} from './backend';
import {runPrepared} from './upstream/src/simulator';

const input=JSON.parse(readFileSync(process.argv[2],'utf8'));
const count=Number(process.argv[4]??128);
const unique=new Map<string,any>();
for(const r of input){const k=JSON.stringify({input:r.input,reportSkills:r.reportSkills});if(!unique.has(k))unique.set(k,r)}
const rows=[];
for(const request of unique.values()){
  const compiled=prepare(request);const sides:any={};
  for(const s of ['attacker','defender'])sides[s]={skills:{},sourceKills:{infantry:0,lancer:0,marksman:0},normalAttacks:{infantry:0,lancer:0,marksman:0}};
  for(let i=0;i<count;i++){
    const r=runPrepared(compiled,`expedition-v2-diagnostics:${i}`,{mode:'standard'});
    for(const s of ['attacker','defender'] as const){
      for(const skill of r.skillReport[s]){
        const key=skill.skillId;
        const record=sides[s].skills[key]??{activations:0,kills:0};
        record.activations+=skill.skillActivations/count;record.kills+=skill.skillKills/count;
        sides[s].skills[key]=record;
      }
    }
    for(const a of r.attacks){
      sides[a.dealerSide].sourceKills[a.dealerUnit]+=a.kills/count;
      if(a.kind==='normal'&&!a.cancelReason)sides[a.dealerSide].normalAttacks[a.dealerUnit]+=1/count;
    }
  }
  rows.push({id:request.id,n:count,sides});
}
writeFileSync(process.argv[3],JSON.stringify(rows,null,2)+'\n');
console.log('Event diagnostics',rows.length,'unique battles',count,'runs each');
