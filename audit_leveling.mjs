import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('.', import.meta.url);
const read = name => JSON.parse(fs.readFileSync(new URL(name, root), 'utf8'));
const source = fs.readFileSync(new URL('app.js', root), 'utf8');
const context = {
  DATA: read('classes_data.json'),
  ROUTES: read('context_routes.json'),
  AZPHEL: read('azphel_data.json'),
  SKILL_UNLOCKS: read('skill_unlocks.json'),
  LEVEL_REWARDS: read('level_rewards.json'),
  STIGMAS: read('stigmas.json'),
  PROFILES: vm.runInNewContext(fs.readFileSync(new URL('profiles.js', root), 'utf8')+'\nPROFILES'),
  localStorage: {getItem:()=>null},
  console
};
vm.createContext(context);
vm.runInContext(source.slice(0, source.indexOf('function render(){'))+`
globalThis.inspect = (cls,level,mode) => {
  state.class=cls;
  const a=account();
  a.journey='leveling';
  a.context=mode;
  a.leveling.level=level;
  a.leveling.extra={mastery:0,stigma:0,crystals:0};
  const m=model();
  return {budget:budget('mastery'),spent:m.mastery.spent,levels:m.mastery.levels,next:m.mastery.next,cap:Object.fromEntries(skillNames().map(n=>[n,masteryRankCap(n)]))};
};`,context);

for(const cls of Object.keys(context.DATA)){
  for(const mode of ['solo','party']){
    for(let level=1;level<=45;level++){
      const plan=context.inspect(cls,level,mode);
      assert(plan.spent<=plan.budget,`${cls} ${mode} ${level}: overspent`);
      for(const [skill,rank] of Object.entries(plan.levels)){
        assert(rank<=plan.cap[skill],`${cls} ${mode} ${level}: ${skill} rank ${rank} exceeds cap ${plan.cap[skill]}`);
        if(context.SKILL_UNLOCKS[cls][skill]>level)assert.equal(rank,1,`${cls} ${mode} ${level}: ${skill} leveled before unlock`);
      }
      if(level>=4)assert(plan.spent>0,`${cls} ${mode} ${level}: no mastery used`);
    }
  }
}
const sorcerer=context.inspect('sorcerer',11,'solo');
assert.equal(sorcerer.budget,20);
assert(sorcerer.levels['Flame Arrow']>=5,'Sorcerer 11: Flame Arrow should be a primary early upgrade');
assert(sorcerer.levels['Ice Chain']>=5,'Sorcerer 11: Ice Chain should be a primary early upgrade');
assert(sorcerer.levels.Firestorm>=5,'Sorcerer 11: Firestorm should be a primary early upgrade');
assert(context.inspect('cleric',11,'party').levels['Healing Light']>1,'Cleric group 11: Healing Light needs points after unlock');
assert(context.inspect('chanter',11,'party').levels.Recuperation>1,'Chanter group 11: Recuperation needs points after unlock');
console.log('Sorcerer level 11:', Object.fromEntries(['Flame Arrow','Ice Chain','Firestorm','Blaze','Bittercold Wind'].map(n=>[n,sorcerer.levels[n]])),`${sorcerer.spent}/${sorcerer.budget} Mastery`);
for(const cls of Object.keys(context.DATA)){
  const plan=context.inspect(cls,11,cls==='cleric'?'party':'solo');
  const skills=Object.entries(plan.levels).filter(([,rank])=>rank>1).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([name,rank])=>`${name} ${rank}`);
  console.log(`${cls} Lv 11: ${skills.join(' · ')} (${plan.spent}/${plan.budget})`);
  const finish=context.inspect(cls,45,cls==='cleric'?'party':'solo');
  console.log(`${cls} Lv 45 leveling: ${finish.spent}/${finish.budget} Mastery planned`);
}
console.log('Checked 720 class, mode, and level combinations against skill unlocks, rank gates, and point budgets.');

// Point totals entered later in the journey must never inflate an earlier build.
vm.runInContext(`
  state.class='sorcerer';
  account().journey='leveling';
  account().leveling={level:11,extraByLevel:{}};
  setLevelingBudget('mastery',25);
`,context);
assert.equal(vm.runInContext("budget('mastery')",context),25);
assert.equal(vm.runInContext("account().leveling.level=12;budget('mastery')",context),29);
vm.runInContext("account().leveling.level=45;setLevelingBudget('mastery',400)",context);
assert.equal(vm.runInContext("account().leveling.level=11;budget('mastery')",context),25);
assert.equal(vm.runInContext("account().leveling.level=45;budget('mastery')",context),400);
vm.runInContext("account().leveling={level:11,extra:{mastery:200,stigma:0,crystals:0}}",context);
assert.equal(vm.runInContext("budget('mastery')",context),20);
assert.equal(vm.runInContext("account().leveling.level=45;budget('mastery')",context),403);
console.log('Checked earned-point history and migration from older saved accounts.');
