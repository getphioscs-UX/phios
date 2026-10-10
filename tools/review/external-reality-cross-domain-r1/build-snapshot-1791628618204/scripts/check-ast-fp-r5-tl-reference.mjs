import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,ref,digest,calculate,semantic,synthesis} from './build-ast-fp-r5-tl-reference.mjs';
import {buildAstR5CustomerAuthoringPack} from '../functions/ast-full-production/ast-r5-customer-authoring-pack.js';
const mode=process.argv[2],root='content/professional/ast-full-production/';
globalThis.fetch=()=>{throw Error('TL_CHECK_NETWORK_FORBIDDEN');};
const c=read(ref('canonical-projection')),r=read(ref('r4-professional-semantic')),s=read(ref('whole-chart-synthesis')),pack=read(ref('customer-authoring-pack')),loc=read(ref('location-resolution'));
const p=c.canonicalProjection,group=k=>p.calculation.structures.find(x=>x.code===k).items;
const authority=semantic(p),claims=read(root+'claims/ast-fp-r4a-professional-semantic-candidate-claims-v1.json'),admission=read(root+'admission/ast-fp-r4a-professional-semantic-human-admission-v1.json');
const {resolutionDigest,...snapshot}=loc;assert.equal(digest(snapshot),resolutionDigest);
assert.equal(c.locationResolutionDigest,resolutionDigest);assert.equal(c.projectionDigest,digest(p));assert.equal(r.canonicalProjectionDigest,c.projectionDigest);assert.equal(r.projectionDigest,digest(r.professionalSemanticProjection));assert.equal(s.R4ProjectionDigest,r.projectionDigest);
if(mode==='canonical'){
 assert.equal(c.canonicalInput.birthDate,'1989-11-15');assert.equal(c.canonicalInput.birthTime,'22:50:00');assert.equal(c.subjectPresentation.name,'TL');assert.deepEqual(c.canonicalInput.timezone,loc.resolvedPlace.timezone);for(const k of ['latitude','longitude','displayName','countryCode'])assert.equal(c.canonicalInput.birthPlace[k],loc.resolvedPlace[k]);
 assert.equal(loc.resolvedPlace.state,'CONFIRMED');assert.equal(loc.resolvedPlace.providerRef,loc.candidate.providerRef);assert.equal(loc.resolvedPlace.timezone.source,'GOVERNED_RESOLUTION');assert.equal(loc.resolvedPlace.timezone.confidence,'HIGH');assert.equal(p.projection.status,'COMPLETE');assert.equal(p.calculation.status,'COMPLETE');assert.equal(p.interpretation.included,false);
 assert.equal(p.calculation.positions.filter(x=>!x.code.includes('NODE')).length,10);assert(p.calculation.positions.some(x=>x.code==='NORTH_NODE'));assert.equal(group('ANGLES').length,4);assert.equal(group('HOUSE_CUSPS').length,12);assert(group('HOUSE_PLACEMENTS').length>=10);assert(group('HOUSE_CUSPS').every(x=>x.meta.houseSystemCode==='PLACIDUS_V1'));
 assert(p.calculation.positions.filter(x=>!x.code.includes('NODE')).every(x=>Number.isFinite(x.meta.speedLongitudeDegreesPerDay)));
 const policies=(await import('../functions/ast-production/ast-production-policy.js')).ASTA_ASPECT_POLICY;
 for(const x of group('ASPECTS')){const policy=policies.find(y=>y.aspectCode===x.meta.type);assert(policy);assert.equal(x.meta.authorizedOrbDegrees,policy.orbDegrees);assert(x.meta.orb<=policy.orbDegrees);}
 assert.equal(digest((await calculate()).canonicalProjection),c.projectionDigest,'real runtime replay must be stable');
}
if(mode==='r4-semantic'){
 assert.deepEqual(authority.projection,r.professionalSemanticProjection);assert.equal(digest(authority.authority),r.authorityDigest);for(const [k,v] of Object.entries(authority.registries))assert.equal(digest(v),r.registryDigests[k]);
 assert.equal(admission.status,'HUMAN_ADMITTED_21_OF_21');assert.equal(admission.pending,0);assert.equal(admission.claimBundleDigest,claims.bundleDigest);assert.equal(r.professionalSemanticProjection.sections.rulership.schoolPolicy.chainAuthority,'TRADITIONAL_SEVEN_PRIMARY_V1');assert.equal(r.professionalSemanticProjection.sections.elementModality.scope,'CORE_10_PLANETS_UNWEIGHTED');
 const missing=structuredClone(p);missing.calculation.positions.forEach(x=>x.meta.speedLongitudeDegreesPerDay=null);assert(semantic(missing).projection.sections.aspectDynamics.every(x=>['EXACT','UNDETERMINED'].includes(x.state)));
 assert.equal(digest(p),c.projectionDigest,'semantic build must not mutate canonical source');
}
if(mode==='synthesis'){
 assert.equal(s.compositionRuleDigest,digest(read(root+'registries/ast-r5-whole-chart-composition-rule-registry-v2.json')));assert.equal(s.meaningOntologyDigest,digest(read('content/professional/ast-production/meaning/ast-meaning-ontology-v1.json')));
 for(const locale of ['zh-Hans','en']){const ir=s.syntheses[locale];assert.equal(digest(ir),s.digests[locale]);assert.deepEqual(synthesis(p,authority.projection,locale),ir);assert(ir.coreThemes.length>=3&&ir.coreThemes.length<=5);assert.equal(new Set(ir.coreThemes.map(x=>x.themeKey)).size,ir.coreThemes.length);assert.equal(ir.customerIntent.intentId,'OPEN');assert.equal(ir.governance.wholeChartBeforeObjectDirectory,true);assert.equal(ir.governance.customerPublicationAllowed,false);assert.equal(ir.governance.customerIntentChangedUnderlyingMeaning,false);for(const signal of [...ir.supportSignals,...ir.tensionSignals])assert(group('ASPECTS').some(x=>x.code===signal.aspectCode&&x.meta.fromCode===signal.fromCode&&x.meta.toCode===signal.toCode));}
 assert.deepEqual(s.syntheses.en.coreThemes.map(x=>x.themeKey),s.syntheses['zh-Hans'].coreThemes.map(x=>x.themeKey));
}
if(['authoring-pack','authoring-source-coverage'].includes(mode)){
 const {authoringPackDigest,...body}=pack;assert.equal(digest(body),authoringPackDigest);assert.deepEqual(body,buildAstR5CustomerAuthoringPack({canonicalReference:c,r4Reference:r,r5Reference:s,claims,admission,locationSnapshot:loc,compositionRules:read(root+'registries/ast-r5-whole-chart-composition-rule-registry-v2.json')}));
 assert.equal(pack.canonicalProjectionDigest,c.projectionDigest);assert.equal(pack.R4ProjectionDigest,r.projectionDigest);assert.equal(pack.R5SynthesisDigest,s.digests['zh-Hans']);assert.equal(pack.R4AClaimBundleDigest,admission.claimBundleDigest);assert.equal(pack.customerIntent,'OPEN');assert.equal(pack.governance.customerManuscriptWritten,false);assert.equal(pack.governance.productionAllowed,false);
 const actualClaims=new Set(claims.claims.map(x=>x.claimCode)),actualBodies=new Set(p.calculation.positions.map(x=>x.code)),actualAspects=new Set(group('ASPECTS').map(x=>x.code));
 for(const t of pack.coreThemes)for(const source of t.evidenceRefs){assert(actualClaims.has(source)||actualAspects.has(source)||(source.startsWith('DISPOSITOR:')&&pack.rulershipSummary.dispositorChains.some(x=>'DISPOSITOR:'+x.bodyCode===source)),`Unbound theme source ${source}`);}
 const badAdmission={...admission,status:'PENDING'};assert.throws(()=>buildAstR5CustomerAuthoringPack({canonicalReference:c,r4Reference:r,r5Reference:s,claims,admission:badAdmission,locationSnapshot:loc,compositionRules:read(root+'registries/ast-r5-whole-chart-composition-rule-registry-v2.json')}),/ADMISSION_REQUIRED/);
 for(const t of pack.coreThemes){assert.equal(pack.themeOwnership.filter(x=>x.themeRef===t.themeKey).length,1);assert.equal(pack.sectionPlan.filter(x=>x.primaryThemeRefs.includes(t.themeKey)).length,1);assert.deepEqual(t,s.syntheses['zh-Hans'].coreThemes.find(x=>x.themeKey===t.themeKey));}
 for(const section of pack.sectionPlan){for(const x of section.allowedClaimRefs){assert(actualClaims.has(x));assert(pack.admittedClaims.some(y=>y.claimCode===x));}for(const x of section.allowedBodyRefs)assert(actualBodies.has(x));for(const x of section.allowedHouseRefs)assert(group('HOUSE_CUSPS').some(y=>y.meta.houseNumber===x));for(const x of section.allowedAspectRefs)assert(actualAspects.has(x));}
 for(const x of [...pack.supportSignals,...pack.tensionSignals])assert(pack.sectionPlan.some(y=>y.allowedAspectRefs.includes(x.aspectCode)));
 for(const x of pack.admittedClaims){assert(claims.claims.some(y=>y.claimCode===x.claimCode&&y.claimDigest===x.claimDigest&&admission.admittedClaimDigests.includes(x.claimDigest)));assert(pack.sectionPlan.some(y=>y.allowedClaimRefs.includes(x.claimCode)));}
 for(const [code,fact] of Object.entries(pack.bodyEvidence)){assert.deepEqual(fact,s.syntheses['zh-Hans'].bodyEvidence[code]);assert(pack.sectionPlan.some(x=>x.allowedBodyRefs.includes(code)));}
 for(const signal of [...pack.supportSignals,...pack.tensionSignals])assert.deepEqual(signal,[...s.syntheses['zh-Hans'].supportSignals,...s.syntheses['zh-Hans'].tensionSignals].find(x=>x.aspectCode===signal.aspectCode));
 assert.deepEqual(pack.rulershipSummary,r.professionalSemanticProjection.sections.rulership);assert.deepEqual(pack.angleSummary,r.professionalSemanticProjection.sections.angles);assert.deepEqual(pack.distributionSummary,r.professionalSemanticProjection.sections.elementModality);assert.deepEqual(pack.aspectPatterns,r.professionalSemanticProjection.sections.aspectPatterns);assert.deepEqual(pack.aspectDynamics,r.professionalSemanticProjection.sections.aspectDynamics);
 assert(!JSON.stringify(pack).includes('fixture'));assert(!('realityContext' in pack));const handoff=read('tools/review/AST-FP-R5-TL-CHAT-AUTHORING-HANDOFF.json');assert.equal(handoff.authoringPackDigest,authoringPackDigest);
 const builder=fs.readFileSync('scripts/build-ast-fp-r5-tl-reference.mjs','utf8');assert(!builder.includes('/fixtures/'));assert(!builder.includes('searchBirthPlaces'));
}
console.log(JSON.stringify({check:mode,status:'PASS',providerCalls:0,networkCalls:0}));
