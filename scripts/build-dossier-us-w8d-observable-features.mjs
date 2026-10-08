import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const source=read('content/civilization-atlas/reconfiguration/runtime-position-w8c-current-evidence-ir-v1.json');
const rows=(source.records||[]).filter(r=>r.dossierId==='DOSSIER-US'&&r.evidenceState==='CWA_ADMITTED'&&r.rreEligibility==='RRE_ELIGIBLE');
const classByLane={
 DEMOGRAPHY:'DEMOGRAPHIC_STATE',
 INDUSTRY:'INDUSTRY_ACTIVITY',
 INFRASTRUCTURE:'INFRASTRUCTURE_STATE',
 TECHNOLOGY:'TECHNOLOGY_CAPACITY',
 EXTERNAL_DEPENDENCY:'EXTERNAL_EXCHANGE',
 CARRIER_STRUCTURE:'CARRIER_STRUCTURE',
 PRESSURE_FIELD:'PRESSURE_AND_VULNERABILITY'
};
const features=rows.map((r,i)=>({
 featureId:'US-OBS-'+String(i+1).padStart(3,'0'),
 dossierId:r.dossierId,
 laneId:r.laneId,
 featureClass:classByLane[r.laneId]||'OBSERVED_CURRENT_FEATURE',
 observation:r.claimText,
 claimId:r.claimId,
 sourceId:r.sourceId,
 authorityClass:r.authorityClass,
 observedAt:r.retrievedAt,
 publishedAt:r.publishedAt??null,
 freshnessState:r.freshnessState,
 evidenceState:'DIRECT_CWA_OBSERVATION',
 supportLevel:r.supportLevel,
 provenance:{
   currentEvidenceIR:'content/civilization-atlas/reconfiguration/runtime-position-w8c-current-evidence-ir-v1.json',
   sourceVersion:r.sourceVersion,
   sourceLocator:r.sourceLocator
 },
 boundaries:{
   grammarAssigned:false,
   realityDomainAssigned:false,
   runtimePositionAssigned:false,
   predictionCreated:false,
   missingDataInferred:false
 }
}));
const required=['DEMOGRAPHY','INDUSTRY','INFRASTRUCTURE','TECHNOLOGY','EXTERNAL_DEPENDENCY','CARRIER_STRUCTURE','PRESSURE_FIELD'];
const covered=[...new Set(features.map(f=>f.laneId))].sort();
const missing=required.filter(x=>!covered.includes(x));
write('content/civilization-atlas/reconfiguration/dossier-us-w8d-observable-features-v1.json',{
 schemaVersion:'PHI-OS-DOSSIER-US-W8D-OBSERVABLE-FEATURES-v1.0.0',
 status:missing.length?'PARTIAL':'REQUIRED_LANES_COMPLETE',
 dossierId:'DOSSIER-US',
 stage:'W8-D',
 sourceClaimCount:rows.length,
 featureCount:features.length,
 requiredLaneIds:required,
 coveredLaneIds:covered,
 missingRequiredLanes:missing,
 features,
 boundary:'Observable features are evidence-preserving current observations only. Grammar/domain/RP semantics are prohibited at this stage.'
});
console.log(JSON.stringify({
 status:missing.length?'PARTIAL':'REQUIRED_LANES_COMPLETE',
 dossierId:'DOSSIER-US',
 features:features.length,
 coveredLaneIds:covered,
 missingRequiredLanes:missing,
 next:'W8-E RRE Derived Reading',
 canonicalMutation:false
},null,2));
