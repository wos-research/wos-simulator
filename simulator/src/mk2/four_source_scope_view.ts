// Private representation adapter: does not mutate the prepared input or engine state.
export function scopeView(compiled:any){
 const old=compiled.input,input={...old};
 if(input.maxRounds===1500)delete input.maxRounds;
 if(input.engagement_type===undefined)input.engagement_type='always';
 for(const side of ['attacker','defender']){
  const f=old[side],view={...f,troops:{...f.troops},stats:{...f.stats}};
  if(view.passive===undefined)delete view.passive;
  if(view.heroes&& !Array.isArray(view.heroes)&&Object.getPrototypeOf(view.heroes)===Object.prototype&&Object.keys(view.heroes).length===0)view.heroes=[];
  for(const[id,n]of Object.entries(view.troops))if(n===0&&compiled.config.troopStats[id])delete view.troops[id];
  for(const type of ['infantry','lancer','marksman']){const block=view.stats[type];if(compiled.fighters[side].initialTroops[type]===0&&block&&Object.keys(block).sort().join(',')==='attack,defense,health,lethality'&&Object.values(block).every(v=>v===0))delete view.stats[type];}
  input[side]=view;
 }
 return {...compiled,input};
}
