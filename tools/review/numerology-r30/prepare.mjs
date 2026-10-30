import fs from 'node:fs';
import {calculateNumPublicationSnapshot,composeNumR20Pages} from '../../../functions/personal-reading/narrative/numerology-publication-adapter.js';
import {projectNumR28ForLocalDelivery} from '../../../functions/personal-reading/narrative/numerology-publication-system.js';
import {buildNumEditorialRequests} from '../../../functions/personal-reading/narrative/numerology-editorial-adapter.js';
import {sha256Stable} from '../../../functions/interpretation-runtime/mir7-utils.js';
const dir='tools/review/numerology-r30',tmp='.tmp/numerology-r30';
const baseline=JSON.parse(fs.readFileSync('.tmp/numerology-r27/PUBLICATION-SNAPSHOT.json'));
const fixtures=[{id:'A',birthDate:'1989-11-15',targetDate:'2026-10-27',name:'John Michael Smith'},{id:'B',birthDate:'2001-03-09',targetDate:'2026-04-08',name:'Alice Rose Clark'},{id:'C',birthDate:'1970-07-22',targetDate:'2027-08-16'},{id:'D',birthDate:'1980-01-03',targetDate:'2026-12-09',name:'Mary Jane Smith'}];
const index=[];
for(const f of fixtures){
 const snapshot=f.id==='A'?baseline:await calculateNumPublicationSnapshot({canonicalInput:{...baseline.canonicalInput,birthDate:f.birthDate,consent:{recordId:'R30-SYNTHETIC-'+f.id,granted:true}},expansionInput:{birthDate:f.birthDate,targetDate:f.targetDate,...(f.name?{identityInput:{...baseline.expansionInput.identityInput,fullBirthName:f.name}}:{})},localReview:true});
 const pub=await projectNumR28ForLocalDelivery({snapshot,refinement:'R30_PILOT'}),pages=composeNumR20Pages(snapshot),catalog={};
 // Catalog from exact existing, eligible native units for THIS subject. No web
 // claims and no new numeric meanings. Preserve per-role IDs and source paths.
 for(const p of pages)for(const u of p.languages.en.units){if(!u.sourceClaimId&&u.kind!=='STRUCTURAL_INTERPRETATION')continue;const id=u.sourceClaimId||u.sourceRef,zu=p.languages['zh-Hans'].units.find(x=>x.unitId===u.unitId);if(!zu)throw Error('BILINGUAL_SOURCE_MISSING');catalog[id]={id,role:u.unitId,school:u.school||'MODERN_WESTERN_PYTHAGOREAN_PRACTITIONER_LAYER',scope:u.kind,sourceDigest:await sha256Stable({en:u.text,zhHans:zu.text,sourceVersions:snapshot.sourceVersions}),sourcePath:u.sourceRef.split('#')[0],sourceLocator:u.sourceRef,sourceVersion:snapshot.sourceVersions,sourceText:{en:u.text,zhHans:zu.text},runtimeUseAllowed:true,sourceClaimId:u.sourceClaimId};}
 const requests=await buildNumEditorialRequests({snapshot,accountId:'R30-SYNTHETIC-'+f.id,entitlementId:'R30-ISOLATED-'+f.id,sourceCatalog:catalog,localReview:true});
 for(const [name,value]of Object.entries({SNAPSHOT:snapshot,PUBLICATION:pub,REQUESTS:requests,SOURCES:catalog}))fs.writeFileSync(tmp+'/'+f.id+'-'+name+'.json',JSON.stringify(value,null,2));
 const detail=pub.chartModels.en.publicationDetail;
 index.push({...f,synthetic:true,snapshotDigest:snapshot.snapshotDigest,birth:pub.sourceView.birthRoles.map(x=>({role:x.role,value:x.value})),nameRoles:pub.sourceView.name.roles.map(x=>({role:x.role,value:x.value})),nameAvailability:pub.sourceView.name.availability,selection:detail.westernTimeline.selection,energy:detail.energyCombinations,calendar:pub.sourceView.timing.calendar,sourceRefs:Object.keys(catalog)});
}
fs.writeFileSync(dir+'/FIXTURES.json',JSON.stringify({fixtures:index,providerCalls:0,productionWrites:0},null,2));
console.log(JSON.stringify(index.map(x=>({id:x.id,birth:x.birth,name:x.nameRoles,nameAvailability:x.nameAvailability,phase:x.selection,energy:x.energy.map(e=>({pattern:e.pattern,text:e.meaning?.text})),calendar:x.calendar.map(y=>[y.code,y.value])})),null,2));
