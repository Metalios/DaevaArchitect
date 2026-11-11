/* AION 2 Global manastone/soulstone roll tables.
 * Values are recorded engraving outcomes, not player-selectable in-game rolls.
 * Source: https://aion.xtopolis.com/gear-enhancement/manastones/
 * Cross-check: https://aion2.gaming.tools/items/513560004
 */
const StoneRollRules = (() => {
  'use strict';
  const CORE = {
    'Attack': [[1,3],[2,4,8],[3,5,10]],
    'Defense': [[10,30],[20,40,75],[30,50,100]],
    'Accuracy Bonus': [[5,7],[6,9,13],[7,10,15]],
    'Evasion Bonus': [[5,7],[6,9,13],[7,10,15]],
    'Critical Hit': [[5,7],[6,9,13],[7,10,15]],
    'Critical Hit Resist': [[5,7],[6,9,13],[7,10,15]],
    'Block': [[7,10],[9,13,18],[10,15,20]],
    'HP': [[30,60],[45,80,130],[50,100,160]],
    'MP': [[15,30],[23,40,65],[30,50,80]]
  };
  const DAMAGE = {
    'Damage Boost': [0.1,0.3,1],
    'Weapon Damage Boost': [0.1,0.3,1],
    'Critical Damage Boost': [0.1,0.3,1],
    'Back Attack Damage Boost': [0.1,0.3,1],
    'Front Attack Damage Boost': [0.1,0.3,1]
  };
  const PVP = {
    'PvP Attack': [[2,6,10],[4,8,16],[6,10,20]],
    'PvP Defense': [[20,60,100],[40,80,150],[60,100,200]],
    'PvP Accuracy': [[10,14,20],[12,18,26],[14,20,30]],
    'PvP Evasion': [[10,14,20],[12,18,26],[14,20,30]],
    'PvP Critical Hit': [[10,14,20],[12,18,26],[14,20,30]],
    'PvP Block': [[10,14,20],[12,18,26],[20,30,40]],
    'PvP Critical Hit Resist': [[10,14,20],[12,18,26],[14,20,30]]
  };
  const TIERS=['Lesser','Intermediate','Superior','Lesser Abyssal','Intermediate Abyssal','Superior Abyssal'];
  const isAbyssal=type=>/Abyssal$/.test(type||'');
  const tierIndex=type=>Math.max(0,['Lesser','Intermediate','Superior'].indexOf(String(type||'').replace(' Abyssal','')));
  const values=(type,stat)=>{
    if(!TIERS.includes(type))return [];
    const tier=tierIndex(type), abyss=isAbyssal(type);
    if(CORE[stat])return CORE[stat][tier];
    if(DAMAGE[stat]&&tier===2)return DAMAGE[stat];
    if(abyss&&PVP[stat])return PVP[stat][tier];
    if(abyss&&tier===2&&stat==='PvP Damage Boost')return [0.2,0.6,2];
    return [];
  };
  const stats=type=>!TIERS.includes(type)?[]:[
    ...Object.keys(CORE),
    ...(tierIndex(type)===2?Object.keys(DAMAGE):[]),
    ...(isAbyssal(type)?Object.keys(PVP):[]),
    ...(isAbyssal(type)&&tierIndex(type)===2?['PvP Damage Boost']:[])
  ];
  const unit=stat=>Object.hasOwn(DAMAGE,stat)||stat==='PvP Damage Boost'?'%':'';
  const grades=type=>type==='Lesser'?['Common','Rare']:tierIndex(type)===2?['Rare','Epic','Unique']:['Common','Rare','Epic'];
  const equivalent=(a,b)=>Math.abs(Number(a)-Number(b))<0.0000001;
  function outcome(type,stat,value,expectedUnit){
    if(!stats(type).includes(stat)||unit(stat)!==(expectedUnit||''))return null;
    const index=values(type,stat).findIndex(candidate=>equivalent(candidate,value));
    if(index<0)return null;
    return {stat,value:values(type,stat)[index],unit:unit(stat),grade:grades(type)[index]};
  }
  function rollOptions(type,stat,selectedValue,selectedUnit){
    const choices=values(type,stat),suffix=unit(stat);
    const options='<option value="">No recorded roll</option>'+choices.map((value,i)=>
      '<option value="'+value+'"' + (equivalent(value,selectedValue) && suffix===(selectedUnit||'')?' selected':'') +
      '>'+value+suffix+' · '+grades(type)[i]+'</option>').join('');
    return options;
  }
  return Object.freeze({TIERS,stats,values,unit,grades,outcome,rollOptions});
})();
