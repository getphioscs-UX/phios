import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {executeAndProjectAstV2} from '../functions/method-client-delivery/canonical-projection-runtime-ast-v2.js';
import {validateCanonicalBirthInput} from '../functions/method-client-delivery/canonical-birth-input-runtime.js';
import {buildAstProfessionalSemanticProjection} from '../functions/ast-full-production/ast-professional-semantic-runtime.js';
import {buildAstWholeChartSynthesis} from '../functions/ast-full-production/ast-whole-chart-synthesis-runtime.js';
const root='content/professional/ast-full-production/';
export const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
export const save=(p,x)=>{fs.mkdirSync(p.slice(0,p.lastIndexOf('/')),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');};
export const ref=n=>root+'reference/ast-fp-r5-tl-'+n+'-v1.json';
export async function calculate(){
 const snapshot=read(ref('location-resolution'));const {resolutionDigest,...body}=snapshot;assert.equal(digest(body),resolutionDigest);
 const p=snapshot.resolvedPlace;
 const canonicalInput={birthDate:'1989-11-15',birthTime:'22:50:00',birthPlace:{displayName:p.displayName,countryCode:p.countryCode,latitude:p.latitude,longitude:p.longitude},timezone:p.timezone,timeAccuracy:'EXACT',locale:'zh-Hans',consent:{recordId:'AST-TL-CONTROLLED-REFERENCE-CONSENT-W1',granted:true,purposeCode:'AST_FP_R5_TL_REAL_REFERENCE',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
 assert.equal(validateCanonicalBirthInput(canonicalInput).valid,true);
 const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ASTROLOGY',methodVersion:'0.1.0',capability:'CALCULATION',purposeCode:'AST_FP_R5_TL_REAL_REFERENCE',canonicalInput,executionParameters:{houseSystemCode:'PLACIDUS_V1'},consentRecordId:canonicalInput.consent.recordId,requestId:'AST-FP-R5-TL-REAL-REFERENCE-W1'};
 const result=await executeAndProjectAstV2(request,{astronomyModuleLoader:async()=>import('astronomy-engine')});
 const projection=structuredClone(result.canonicalProjection);
 assert.equal(projection?.projection.status,'COMPLETE');assert.equal(projection.calculation.status,'COMPLETE');
 const upstream=result.execution.partialExecution.coreResults.find(x=>x.algorithmCode==='AST_PLANET_EPHEMERIS').output.bodies;
 for(const body of upstream){const projected=projection.calculation.positions.find(x=>x.code===body.bodyCode);assert(Number.isFinite(body.speedLongitudeDegreesPerDay));assert.equal(projected.meta.speedLongitudeDegreesPerDay,body.speedLongitudeDegreesPerDay,'canonical adapter must preserve governed upstream speed');}
 // Runtime wall-clock metadata is not calculation authority. Freeze reference evidence time.
 projection.execution.executedAt=p.resolvedAt;
 return {canonicalInput,request,canonicalProjection:projection};
}
export function semantic(canonicalProjection){const authority=read(root+'authority/ast-fp-r4-professional-semantic-authority-v1.json');const registries=Object.fromEntries(Object.entries(authority.registryRefs).map(([k,p])=>[k,read(p)]));return {authority,registries,projection:buildAstProfessionalSemanticProjection({canonicalProjection,authority,registries})};}
export function synthesis(canonicalProjection,professionalSemanticProjection,locale){return buildAstWholeChartSynthesis({canonicalProjection,professionalSemanticProjection,meaningOntology:read('content/professional/ast-production/meaning/ast-meaning-ontology-v1.json'),r4aClaims:read(root+'claims/ast-fp-r4a-professional-semantic-candidate-claims-v1.json'),r4aAdmission:read(root+'admission/ast-fp-r4a-professional-semantic-human-admission-v1.json'),compositionRules:read(root+'registries/ast-r5-whole-chart-composition-rule-registry-v2.json'),locale,customerIntent:{intentId:'OPEN'}});}
export async function build(){
 const c=await calculate();const p=c.canonicalProjection;
 save(ref('canonical-projection'),{schemaVersion:'PHI-OS-AST-R5-CONTROLLED-REFERENCE-v1.0.0',workCode:'AST-FP-R5-TL-REAL-REFERENCE-W1',referenceCaseId:'TL-REFERENCE-01',subjectPresentation:{name:'TL'},...c,locationResolutionDigest:read(ref('location-resolution')).resolutionDigest,calculationHouseSystem:'PLACIDUS_V1',projectionDigest:digest(p),generatedByRuntimeVersion:p.version.runtimeVersion,r3CertificationRef:root+'acceptance/ast-fp-r3-independent-calculation-certification-v1.json'});
 const r=semantic(p);const admission=read(root+'admission/ast-fp-r4a-professional-semantic-human-admission-v1.json');
 save(ref('r4-professional-semantic'),{canonicalProjectionId:p.projectionId,canonicalProjectionDigest:digest(p),authorityDigest:digest(r.authority),registryDigests:Object.fromEntries(Object.entries(r.registries).map(([k,v])=>[k,digest(v)])),r4aClaimBundleDigest:admission.claimBundleDigest,r4aAdmissionRef:root+'admission/ast-fp-r4a-professional-semantic-human-admission-v1.json',professionalSemanticProjection:r.projection,projectionDigest:digest(r.projection)});
 const zh=synthesis(p,r.projection,'zh-Hans'),en=synthesis(p,r.projection,'en');
 save(ref('whole-chart-synthesis'),{state:'R4A_HUMAN_ADMITTED_R5_REFERENCE',canonicalProjectionDigest:digest(p),R4ProjectionDigest:digest(r.projection),R4AClaimBundleDigest:admission.claimBundleDigest,R4AAdmissionStatus:admission.status,meaningOntologyDigest:digest(read('content/professional/ast-production/meaning/ast-meaning-ontology-v1.json')),compositionRuleDigest:digest(read(root+'registries/ast-r5-whole-chart-composition-rule-registry-v2.json')),meaningOntologyVersion:zh.technicalLineage.meaningOntologyVersion,compositionRuleVersion:zh.technicalLineage.compositionRuleVersion,customerIntent:'OPEN',syntheses:{'zh-Hans':zh,en},digests:{'zh-Hans':digest(zh),en:digest(en)}});
 console.log('TL canonical/R4/R5 reference built',p.projectionId);
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/build-ast-fp-r5-tl-reference.mjs'))await build();
