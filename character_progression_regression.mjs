// AION 2 Global collection data integrity and input validation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const window={};
const context=vm.createContext({window,document:{getElementById:()=>null},console});
vm.runInContext(read('js/collections_data.js')+'\nglobalThis.catalog=CHARACTER_COLLECTION_DATA;',context);
vm.runInContext(read('js/character_progression.js'),context);
const {catalog}=context,tracker=window.CharacterProgression;
assert.equal(catalog.pets.length,211,'Global source pet roster mismatch');
assert.equal(new Set(catalog.pets.map(x=>x.id)).size,211,'Duplicate pet IDs');
assert.deepEqual(Object.assign({},...Object.entries(catalog.genusTotals).map(([name,count])=>({[name]:count}))),
 {Fera:65,Cogni:41,Natura:48,Special:11,Varian:46});
assert(catalog.pets.every(p=>p.name&&p.genus&&Number.isInteger(p.id)));
const empty=tracker.normalize({});
assert.equal(Object.keys(empty.genus).length,5);
assert.equal(Object.keys(empty.pantheon.slots).length,17);
assert.equal(Object.keys(empty.skins.categories).length,17);
for(const g of Object.keys(catalog.genusTotals)){
 assert.equal(empty.genus[g].level,0);
 assert.equal(empty.genus[g].lines.length,9);
}
const malicious=JSON.parse(JSON.stringify({
 pets:{1002:3,1001:2,999999:3},
 extraPets:[{name:'My New Pet',genus:'Cogni',level:3},{name:'Unknown Genus',genus:'nonsense',level:1}],
 genus:{Cogni:{level:30,lines:[{stat:'Damage Boost',value:'4.5%',grade:'Unique'}]}},
 wings:{owned:{'Dark Veil Wings':{enhancement:90}},equipped:'Dark Veil Wings'},
 monolith:{faction:999,reshanta:-2,other:2,notes:'Recorded'},
 pantheon:{slots:{1:{owned:false,equipped:true},2:{owned:true,equipped:true}}},
 skins:{registered:17,collectionPoints:1800,categories:{1:{name:'Armor',complete:true}}}
}));
const safe=tracker.normalize(malicious);
assert.equal(safe.pets['1002'],3);
assert.equal(safe.pets['1001'],2);
assert.equal(safe.pets['999999'],undefined);
assert.equal(safe.extraPets.length,1);
assert.equal(safe.genus.Cogni.level,10);
assert.equal(safe.genus.Cogni.lines[0].grade,'Unique');
assert.equal(safe.genus.Cogni.lines[0].value,'4.5%');
assert.equal(safe.wings.owned['Dark Veil Wings'].enhancement,10);
assert.equal(safe.wings.equipped,'Dark Veil Wings');
assert.equal(safe.monolith.faction,30);
assert.equal(safe.monolith.reshanta,0);
assert.equal(safe.pantheon.slots[1].equipped,false);
assert.equal(safe.pantheon.slots[2].equipped,true);
assert.equal(safe.skins.categories[1].complete,true);
const copy=tracker.normalize(JSON.parse(JSON.stringify(safe)));
assert.equal(copy.pets['1002'],3,'JSON round-trip lost owned pets');
assert.equal(copy.pantheon.slots[2].equipped,true,'JSON round-trip lost Pantheon artwork');
console.log('PASS Global collections: 211 pets, 5 genera, 17 Pantheon slots, wings, Monolith, skins, validation and JSON round-trip.');
