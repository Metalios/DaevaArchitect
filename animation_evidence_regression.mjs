// Illustrative test values below are not live AION 2 animation measurements.
// Regression asserts the *evidence selection and uncertainty rules* only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const context=vm.createContext({});
vm.runInContext(read('js/engine/animation_evidence.js')+'\n'+
  read('js/engine/combat_timeline.js')+
  '\nglobalThis.api={GlobalAnimationEvidence,GlobalTimelineEngine};',context);
const {GlobalAnimationEvidence:evidence,GlobalTimelineEngine:timeline}=context.api;
const target={classId:'templar',skill:'Judgment',mode:'basic-weave',
  combatSpeedPct:20,skillSpeedPct:0,skillVariant:'default'};
const basic={...target,kind:'input-to-next-usable',samples:14,seconds:.7,
  source:'https://example.invalid/fixture',clientVersion:'test-build'};
const kr={...basic,region:'KR',seconds:.5,rulesMatchGlobal:false};
const tw={...basic,region:'TW',seconds:.6,rulesMatchGlobal:true};
const global={...basic,region:'Global',seconds:.75};
assert.equal(evidence.resolve(target,[]).available,false);
assert.equal(evidence.resolve(target,[kr,tw]).available,false);
const verified=evidence.resolve(target,[kr,tw],{allowRegionalTransfer:true});
assert.equal(verified.provenance,'regional-validated-transfer');
assert.equal(verified.seconds,.6);
const uncertain=evidence.resolve(target,[kr],{
  allowRegionalTransfer:true,allowUnverifiedScenario:true});
assert.equal(uncertain.provenance,'regional-sensitivity-only');
const first=evidence.resolve(target,[kr,tw,global],{
  allowRegionalTransfer:true,allowUnverifiedScenario:true});
assert.equal(first.seconds,.75,'Prefer Global timing over later region regardless of speed');
assert.equal(first.provenance,'global-measured');
const hitGap={...global,kind:'observed-hit-gap',seconds:.3};
assert.equal(evidence.resolve(target,[hitGap]).available,false,
  'Server-observed hit intervals cannot be used as animation locks');
const speedMismatch={...global,combatSpeedPct:10};
assert.equal(evidence.resolve(target,[speedMismatch]).available,false);
const styleMismatch={...global,mode:'normal'};
assert.equal(evidence.resolve(target,[styleMismatch]).available,false);
const invalid={...global,samples:1};
assert.equal(evidence.resolve(target,[invalid]).available,false);
const missing=evidence.enrich([{id:'Judgment',cooldown:5}],target,[]);
assert.equal(missing[0].timingMissing,true);
const populated=evidence.enrich([{id:'Judgment',cooldown:5}],target,[global]);
assert.equal(populated[0].lockSeconds,.75);
assert.equal(populated[0].timingSource,'global-measured');
assert.equal(evidence.REFERENCE_CHARGES.sorcerer.Hellfire.stageSeconds[2],1.5);
assert.equal(evidence.resolve({classId:'sorcerer',skill:'Hellfire',mode:'normal'},[])
  .available,false,'Charge timing does not describe full action lock');
const ability={id:'Judgment',cooldown:5,flatDamage:100,attackCoefficient:0,
  hits:1,damageSource:'scenario'};
const absent=timeline.simulate({abilities:[ability],priority:['Judgment'],
  duration:12,attack:0,timingContext:target,timingRecords:[hitGap]});
assert.equal(absent.ok,false,'Hit-gap is insufficient to generate a valid timeline');
const simulated=timeline.simulate({abilities:[ability],priority:['Judgment'],
  duration:12,attack:0,timingContext:target,timingRecords:[global]});
assert.equal(simulated.ok,true);
assert.equal(simulated.timingProvenance.Judgment.region,'Global');
assert(simulated.limitations.some(l=>l.includes('uncalibrated')),
  'Illustrative damage coefficients cannot be described as measured Global DPS');
const regional=timeline.simulate({abilities:[ability],priority:['Judgment'],
  duration:12,attack:0,timingContext:target,timingRecords:[kr],
  timingOptions:{allowRegionalTransfer:true,allowUnverifiedScenario:true}});
assert.equal(regional.ok,true);
assert(regional.limitations.some(l=>l.includes('Regional timing transfers')));
console.log('Verified Global-first animation timing selection, regional patch-parity, data quality, and event simulation integration.');
