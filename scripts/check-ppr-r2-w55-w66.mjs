import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixtures} from './ppr-r2-w55-w66-fixtures.mjs';
import {
  FINAL_PERSONAL_READING_EXPERIENCE_SCHEMA,INPUT_PRECISION_BOUNDARY_SCHEMA,
  buildFinalPersonalReadingExperience,buildInputPrecisionBoundary,applyNarrativePrecisionBoundary,
  assertMethodNarrativeBoundary,normalizeSensitiveCurrentRealityBoundary,buildExplicitMyRealityHandoff
} from '../functions/personal-reading/customer-experience/final-personal-reading-experience.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8')),txt=p=>fs.readFileSync(p,'utf8');
const digest64=value=>/^[a-f0-9]{64}$/.test(String(value||''));
const contract=j('content/personal-reading/customer-experience/contracts/final-personal-reading-experience-contract-v1.json');
const boundary=j('content/personal-reading/customer-experience/contracts/method-narrative-boundary-contract-v1.json');
const sensitive=j('content/personal-reading/customer-experience/contracts/sensitive-current-reality-boundary-contract-v1.json');
const precisionContract=j('content/personal-reading/customer-experience/contracts/input-narrative-precision-boundary-contract-v1.json');
const handoff=j('content/personal-reading/customer-experience/contracts/my-reality-handoff-contract-v1.json');
const language=j('content/personal-reading/customer-experience/registries/customer-language-registry-v1.json');
const finalSchema=j('content/personal-reading/customer-experience/schemas/final-personal-reading-experience-v1.schema.json');
const precisionSchema=j('content/personal-reading/customer-experience/schemas/input-precision-boundary-v1.schema.json');
assert.equal(contract.outputSchema,FINAL_PERSONAL_READING_EXPERIENCE_SCHEMA);
assert.equal(precisionContract.outputSchema,INPUT_PRECISION_BOUNDARY_SCHEMA);
assert.equal(boundary.work,'W64');assert.equal(sensitive.work,'W65');assert.equal(handoff.work,'W63');assert.equal(language.work,'W61');
assert.equal(finalSchema.$id,'PHI-OS-FINAL-PERSONAL-READING-EXPERIENCE-v1');
assert.equal(precisionSchema.$id,'PHI-OS-INPUT-NARRATIVE-PRECISION-BOUNDARY-v1');
assert.ok(finalSchema.required.includes('semanticDigest'));assert.ok(precisionSchema.required.includes('overallPrecision'));

function assertPrecisionShape(value){
  assert.equal(value?.schemaVersion,INPUT_PRECISION_BOUNDARY_SCHEMA);
  assert.ok(['EXACT','HIGH','MEDIUM','LOW','UNKNOWN','NOT_APPLICABLE'].includes(value.overallPrecision));
  assert.ok(['QUALIFIED_DIRECT','QUALIFIED','TENTATIVE','WITHHOLD_HIGH_PRECISION'].includes(value.narrativeWordingPolicy));
  assert.equal(value.certaintyMayExceedInput,false);assert.equal(value.aiMayImproveReadabilityOnly,true);
  assert.ok(value.dimensions&&typeof value.dimensions==='object');assert.ok(Array.isArray(value.dependencies));
}
function assertFinalShape(value){
  assert.equal(value?.schemaVersion,FINAL_PERSONAL_READING_EXPERIENCE_SCHEMA);
  assert.ok(['en','zh-Hans'].includes(value.locale));assert.ok(Array.isArray(value.sections));assert.ok(value.sections.length>=10&&value.sections.length<=20);
  for(const section of value.sections){assert.equal(typeof section.sectionId,'string');assert.equal(typeof section.label,'string');assert.equal(typeof section.visible,'boolean');}
  assert.ok(Array.isArray(value.crossGroups)&&value.crossGroups.length>=7);assert.equal(new Set(value.crossGroups).size,value.crossGroups.length);
  assert.equal(value.technicalDrawer?.collapsedByDefault,true);assert.ok(Array.isArray(value.technicalDrawer?.fields));
  assert.equal(value.surfaces?.oneProductOneSemanticIr,true);assert.ok(digest64(value.semanticDigest));
  if(value.precisionBoundary)assertPrecisionShape(value.precisionBoundary);
}

const results=[];
for(const f of fixtures){
  assertPrecisionShape(f.precision);
  const a=buildFinalPersonalReadingExperience({view:f.view,locale:Number(f.caseId.slice(-2))%2?'en':'zh-Hans',inputPrecision:f.precision});
  const b=buildFinalPersonalReadingExperience({view:f.view,locale:a.locale,inputPrecision:f.precision});
  assert.deepEqual(a,b);assertFinalShape(a);
  assert.equal(a.surfaces.free.web,a.surfaces.free.print);assert.equal(a.surfaces.free.web,a.surfaces.free.pdf);
  assert.equal(a.surfaces.paid.web,a.surfaces.paid.print);assert.equal(a.surfaces.paid.web,a.surfaces.paid.pdf);
  assert.equal(a.governance.newMeaningAuthorityCreated,false);assert.equal(a.governance.specialistProductsRemainMethodNative,true);
  const visible=new Set(a.sections.filter(x=>x.visible).map(x=>x.sectionId));
  assert.equal(visible.has('PROFILE_ASSESSMENT'),f.profile);assert.equal(visible.has('RELATIONSHIP'),f.relationship);assert.equal(visible.has('METHOD_HD'),f.hd);assert.equal(visible.has('CROSS_PERSPECTIVE'),f.cross);
  assert.ok(a.crossGroups.includes('NON_CONVERGENCE'));assert.ok(a.crossGroups.includes('REALITY_CONTRADICTED'));if(f.profile)assert.ok(a.crossGroups.includes('SOURCE_TENSION'));
  results.push({profile:f.profile,relationship:f.relationship,cross:f.cross,hd:f.hd,precision:f.precision.overallPrecision});
}

function rejects(fn,code){let e=null;try{fn()}catch(err){e=err}assert.equal(e?.code,code,`${code} should fail closed`)}
for(const cls of ['MEDICAL_DIAGNOSIS','MENTAL_HEALTH_DIAGNOSIS','FINANCIAL_RECOMMENDATION','LEGAL_CONCLUSION','GUARANTEED_FUTURE_EVENT','OBJECTIVE_RELATIONSHIP_FACT','OBJECTIVE_PERSONALITY_FACT'])rejects(()=>assertMethodNarrativeBoundary({claimClass:cls}),`W64_FORBIDDEN_${cls}`);
assert.equal(assertMethodNarrativeBoundary({claimClass:'SUPPORTED_SYNTHESIS',supportRefs:['A']}).allowed,true);
rejects(()=>normalizeSensitiveCurrentRealityBoundary({observations:[{statement:'sensitive',sensitive:true}],purposeCode:'REALITY_COMPARISON',consent:true,sensitiveConsent:false}),'W65_SENSITIVE_CONSENT_REQUIRED');
rejects(()=>normalizeSensitiveCurrentRealityBoundary({observations:[{statement:'x'}],purposeCode:'REALITY_COMPARISON',consent:true,persistence:'SESSION'}),'W65_HIDDEN_PERSISTENCE_FORBIDDEN');
const bounded=normalizeSensitiveCurrentRealityBoundary({observations:[{statement:'customer said this',sensitive:true}],purposeCode:'REALITY_COMPARISON',consent:true,sensitiveConsent:true,persistence:'NONE'});assert.equal(bounded.automaticPersistence,false);assert.equal(bounded.governance.aiNarrativeIsEvidence,false);
rejects(()=>buildExplicitMyRealityHandoff({selectedInsight:'x',consent:false}),'W63_HANDOFF_EXPLICIT_CONSENT_REQUIRED');rejects(()=>buildExplicitMyRealityHandoff({consent:true}),'W63_HANDOFF_SELECTION_REQUIRED');const minimal=buildExplicitMyRealityHandoff({selectedInsight:'one selected insight',consent:true});assert.equal(minimal.automaticPersistence,false);assert.equal(Object.hasOwn(minimal,'fullReading'),false);
const low=buildInputPrecisionBoundary({birthTime:'LOW',timezone:'HIGH',location:'HIGH',dependencies:['birthTime','timezone','location']});assert.equal(low.overallPrecision,'LOW');assert.equal(applyNarrativePrecisionBoundary({inputPrecision:low,claimPrecision:'HIGH'}).outputCertainty,'WITHHOLD');assert.equal(low.certaintyMayExceedInput,false);

const html=txt('perspectives/personal/index.html'),client=txt('assets/customer-ui/js/surfaces/personal-reality.js'),finalClient=txt('assets/customer-ui/js/personal-products/final-personal-reading-experience.js'),css=txt('assets/customer-ui/surfaces/final-personal-reading-experience.css'),handoffApi=txt('functions/api/customer-reality-handoff.js'),writer=txt('functions/personal-reading/narrative/narrative-writer.js'),verifier=txt('functions/personal-reading/narrative/narrative-claim-verifier.js');
assert.match(html,/data-cx-final-reading-experience/);assert.match(html,/data-cx-personal-handoff-options/);assert.match(html,/href="\/assets\/customer-ui\/surfaces\/final-personal-reading-experience\.css"/);
for(const internal of ['CUSTOMER_PUBLISHABLE','SOURCE_ADMITTED','MACHINE_VERIFIED','HUMAN_ADMITTED'])assert.equal(html.includes(internal),false,`${internal} must not be customer-default HTML text`);
assert.match(client,/mountFinalPersonalReadingExperience\(view\)/);assert.match(client,/buildClientInputPrecision/);assert.doesNotMatch(client,/viewModel:\{\.\.\.view/);assert.match(client,/PHI-OS-MY-REALITY-HANDOFF-SELECTION-v1\.0\.0/);
assert.match(finalClient,/How to read this perspective/);assert.match(finalClient,/Profile & Assessment/);assert.match(finalClient,/Relationship/);assert.match(finalClient,/NON_CONVERGENCE/);assert.match(finalClient,/window\.print\(\)/);assert.match(css,/@media print/);assert.match(css,/cx-final-reading-nav/);
assert.match(handoffApi,/PHI-OS-MY-REALITY-HANDOFF-SELECTION-v1\.0\.0/);assert.match(handoffApi,/projectionReferences:\[\]/);assert.match(writer,/financial recommendations or legal conclusions/);assert.match(writer,/never certainty/);assert.match(verifier,/FINANCIAL_RECOMMENDATION/);assert.match(verifier,/LEGAL_CONCLUSION/);assert.match(verifier,/INPUT_PRECISION_OVERCLAIM/);

const campaign={requiredCases:24,passedCases:results.length,profilePresent:results.filter(x=>x.profile).length,relationshipPresent:results.filter(x=>x.relationship).length,crossPresent:results.filter(x=>x.cross).length,humanDesignPresent:results.filter(x=>x.hd).length,lowPrecision:results.filter(x=>x.precision==='LOW').length};
assert.equal(campaign.passedCases,24);assert.ok(campaign.profilePresent>0&&campaign.profilePresent<24);assert.ok(campaign.relationshipPresent>0&&campaign.relationshipPresent<24);assert.ok(campaign.lowPrecision>0);
console.log(`✓ W55–W66 Customer Experience / Boundary / Precision passed ${campaign.passedCases}/${campaign.requiredCases}.`);
console.log(`  Profile ${campaign.profilePresent}; Relationship ${campaign.relationshipPresent}; Cross ${campaign.crossPresent}; HD ${campaign.humanDesignPresent}; low-precision cases ${campaign.lowPrecision}.`);
console.log('  One semantic IR across Web/Print/PDF, explicit My Reality handoff, sensitive consent and narrative precision boundaries are fail-closed.');
