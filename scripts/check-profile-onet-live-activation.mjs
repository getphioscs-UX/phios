import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ONET_RESULT_SCHEMA, ONET_CAREER_DETAIL_SCHEMA, ONET_JOB_ZONE_SCHEMA,
  fetchOnetInterestProfilerQuestionSet, fetchOnetInterestProfilerResults,
  fetchOnetMatchingCareers, fetchOnetJobZones, fetchOnetCareerDetail,
  normalizeOnetInterestProfilerResult, normalizeOnetJobZones, normalizeOnetCareerDetail,
  buildOnetProfileSignals
} from '../functions/profile/academic-bridge-runtime.js';
import { buildProfileSignalEnvelope } from '../functions/profile/profile-foundation-runtime.js';
import { buildProfileCurrentRealityCorrelation, buildCrossSourcePerspective } from '../functions/profile/profile-context-runtime.js';
import { buildProgressiveProfileView, PROFILE_PROGRESSIVE_MODES } from '../functions/profile/profile-progressive-ux-runtime.js';
import { PROFILE_PRODUCTION_AUTHORITY } from '../functions/profile/profile-production-authority.js';

const ROOT=process.cwd(); const json=rel=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8')); const text=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');
const MODE=String(process.argv[2]||'ALL').toUpperCase(); const run=id=>MODE==='ALL'||MODE===id;
const BASE='92b30b95cf2f70af4ed2ee8e41401764b06fa8b5';
const contract=json('content/profile/academic/onet/contracts/onet-live-activation-contract-v1.json');
const normalizeContract=json('content/profile/academic/onet/contracts/onet-career-exploration-normalization-contract-v1.json');
const live=json('content/profile/academic/onet/live/onet-live-smoke-evidence-v1.json');
const admission=json('content/profile/academic/onet/live/onet-live-provider-admission-v1.json');
const registry=json('content/profile/academic/registries/academic-bridge-activation-registry-v2.json');
const current=json('content/profile/academic/current/academic-bridge-current-successor-v2.json');
const freeze=json('content/profile/academic/onet/freeze/onet-live-provider-production-freeze-v1.json');
const ux=json('content/profile/ux/profile-progressive-ux-contract-v2.json');
const crossRules=json('content/profile/cross-source/registries/cross-source-translation-rule-registry-v1.json');

const q30=Array.from({length:30},(_,i)=>({index:i+1,area:['realistic','investigative','artistic','social','enterprising','conventional'][i%6],text:`Provider question ${i+1}`}));
const q60=Array.from({length:60},(_,i)=>({index:i+1,area:['realistic','investigative','artistic','social','enterprising','conventional'][i%6],text:`Provider long question ${i+1}`}));
const answer_option=[1,2,3,4,5].map(value=>({value,name:['Strongly Dislike','Dislike','Unsure','Like','Strongly Like'][value-1]}));
const riasec=['realistic','investigative','artistic','social','enterprising','conventional'];
const calls=[];
const mockFetch=async(url,options={})=>{calls.push({url:String(url),options});const u=new URL(String(url));const start=Number(u.searchParams.get('start')||1),end=Number(u.searchParams.get('end')||12);let body;
  if(u.pathname.endsWith('/questions_30')) body={start,end,total:30,answer_option,question:q30.slice(start-1,end)};
  else if(u.pathname.endsWith('/questions')) body={start,end,total:60,answer_option,question:q60.slice(start-1,end)};
  else if(u.pathname.endsWith('/results')) {const n=(u.searchParams.get('answers')||'').length===60?20:10;body={result:riasec.map(code=>({code,title:code[0].toUpperCase()+code.slice(1),score:n}))};}
  else if(u.pathname.endsWith('/careers')) body={career:[{code:'13-2011.00',title:'Accountants & Auditors',fit:'Best'},{code:'27-2011.00',title:'Actors',fit:'Good'}]};
  else if(u.pathname.endsWith('/job_zones')) body=[{code:2,title:'Job Zone 1-2: Very Little to Some Preparation Needed'},{code:3,title:'Job Zone Three: Medium Preparation Needed'},{code:4,title:'Job Zone Four: High Preparation Needed'},{code:5,title:'Job Zone Five: Extensive Preparation Needed'}];
  else if(u.pathname.endsWith('/mnm/careers/13-2011.00/')) body={code:'13-2011.00',title:'Accountants & Auditors',what_they_do:'Examine, analyze, and interpret accounting records.',on_the_job:['Prepare accounting records.','Review accounts for discrepancies.']};
  else return new Response(JSON.stringify({error:'unknown'}),{status:404,headers:{'content-type':'application/json'}});
  return new Response(JSON.stringify(body),{status:200,headers:{'content-type':'application/json'}});
};

let onet30=null, signals=[];
if(run('W0')){
  assert.equal(contract.baselineCommit,BASE);assert.equal(contract.credentialAuthority.environmentVariable,'ONET_WEB_SERVICES_API_KEY');assert.equal(contract.credentialAuthority.serverSideOnly,true);assert.equal(contract.credentialAuthority.clientExposureAllowed,false);assert.equal(live.credential.organizationApproved,true);assert.equal(live.credential.apiKeyValid,true);assert.equal(live.credential.apiKeyRecordedInEvidence,false);assert.equal(admission.status,'LIVE_PROVIDER_ADMITTED');
  assert.match(text('functions/api/profile-progressive.js'),/context\?\.env\?\.ONET_WEB_SERVICES_API_KEY/);assert.doesNotMatch(text('functions/api/profile-progressive.js'),/ONET_WEB_SERVICES_API_KEY\s*=\s*['"][^'"]+['"]/);
  console.log('✓ PRF-ONET W0 credential authority passed: approved provider, server-only X-API-Key secret, no credential material in repo.');
}
if(run('W1')||MODE==='ALL'){
  const set30=await fetchOnetInterestProfilerQuestionSet({apiKey:'test-key',form:'MINI_30',fetchImpl:mockFetch});const set60=await fetchOnetInterestProfilerQuestionSet({apiKey:'test-key',form:'SHORT_60',fetchImpl:mockFetch});assert.equal(set30.questions.length,30);assert.equal(set60.questions.length,60);assert.equal(set30.answerOptions.length,5);assert.equal(set30.governance.providerQuestionTextAltered,false);assert.equal(live.checks.mini30Questions.status,'PASS_LIVE');assert.equal(live.limitations.liveShort60Observed,false);assert.ok(calls.filter(c=>c.url.includes('questions_30')).every(c=>c.options.headers['X-API-Key']==='test-key'));
  console.log('✓ PRF-ONET W1 questions passed: Mini-IP 30 live evidence admitted; Quick 30 + Deeper 60 runtime pagination machine-verified.');
}
if(run('W2')||MODE==='ALL'){
  const provider=await fetchOnetInterestProfilerResults({apiKey:'test-key',answers:'543215432154321543215432154321',fetchImpl:mockFetch});onet30=await normalizeOnetInterestProfilerResult({participantRef:'PERSON-A',assessmentDate:'2026-09-03',form:'MINI_30',providerResult:provider,careers:[]});assert.equal(onet30.schemaVersion,ONET_RESULT_SCHEMA);assert.equal(Object.keys(onet30.interests).length,6);assert.ok(Object.values(onet30.interests).every(x=>x.score===10));assert.equal(onet30.sourceClass,'STANDARDIZED_SELF_REPORT');assert.equal(onet30.scoringState,'EXTERNALLY_SCORED');assert.equal(onet30.normingState,'NOT_NORMED');assert.equal(live.checks.riaSecResults.status,'PASS_LIVE');assert.equal(live.checks.riaSecResults.interpretationAllowed,false);
  console.log('✓ PRF-ONET W2 RIASEC passed: external scoring preserved as standardized self-report; synthetic balanced smoke is not interpreted as customer evidence.');
}
if(run('W3')||MODE==='ALL'){
  const careers=await fetchOnetMatchingCareers({apiKey:'test-key',answers:'543215432154321543215432154321',zone:4,fetchImpl:mockFetch});assert.equal(careers.career.length,2);const zones=normalizeOnetJobZones(await fetchOnetJobZones({apiKey:'test-key',fetchImpl:mockFetch}));assert.equal(zones.schemaVersion,ONET_JOB_ZONE_SCHEMA);assert.deepEqual(zones.zones.map(x=>x.code),[2,3,4,5]);assert.equal(normalizeContract.customerFitTranslation.Best,'STRONG_INTEREST_MATCH');assert.equal(live.checks.careerMatching.status,'PASS_LIVE');assert.equal(live.checks.jobZones.status,'PASS_LIVE');
  console.log('✓ PRF-ONET W3 career matching + Job Zones passed: raw provider fit retained; PHI OS labels remain exploration language, not job-fit authority.');
}
if(run('W4')||MODE==='ALL'){
  const provider=await fetchOnetCareerDetail({apiKey:'test-key',code:'13-2011.00',fetchImpl:mockFetch});const detail=normalizeOnetCareerDetail(provider);assert.equal(detail.schemaVersion,ONET_CAREER_DETAIL_SCHEMA);assert.equal(detail.code,'13-2011.00');assert.ok(detail.onTheJob.length>=2);assert.equal(detail.governance.providerDataAltered,false);assert.equal(detail.governance.jobFitGuaranteeCreated,false);assert.equal(live.checks.careerDetail.status,'PASS_LIVE');
  console.log('✓ PRF-ONET W4 career detail normalization passed: occupational content preserved without employment recommendation authority.');
}
if(run('W5')||MODE==='ALL'){
  if(!onet30){const provider=await fetchOnetInterestProfilerResults({apiKey:'test-key',answers:'543215432154321543215432154321',fetchImpl:mockFetch});onet30=await normalizeOnetInterestProfilerResult({participantRef:'PERSON-A',assessmentDate:'2026-09-03',form:'MINI_30',providerResult:provider,careers:[]});}signals=await buildOnetProfileSignals(onet30);assert.equal(signals.length,6);assert.ok(signals.every(s=>s.sourceClass==='STANDARDIZED_SELF_REPORT'));assert.ok(signals.every(s=>s.domainId.startsWith('RIASEC::')));assert.ok(signals.every(s=>s.precisionBoundary.includes('CAREER_INTEREST_NOT_JOB_FIT_GUARANTEE')));assert.ok(signals.every(s=>s.governance.sourceClassErased===false));
  console.log('✓ PRF-ONET W5 ProfileSignalEnvelope passed: six RIASEC signals preserve source class, provider provenance and career-interest boundaries.');
}
if(run('W6')||MODE==='ALL'){
  assert.ok(PROFILE_PROGRESSIVE_MODES.includes('CAREER_INTERESTS'));assert.ok(ux.modes.some(x=>x.mode==='CAREER_INTERESTS'));assert.deepEqual(ux.modes.find(x=>x.mode==='CAREER_INTERESTS').submodes,['MINI_30','SHORT_60']);assert.match(text('perspectives/profile/index.html'),/data-prf-mode="CAREER_INTERESTS"/);assert.match(text('assets/customer-ui/js/surfaces/profile-progressive.js'),/Quick · 30 questions/);assert.match(text('assets/customer-ui/js/surfaces/profile-progressive.js'),/Deeper · 60 questions/);assert.match(text('assets/customer-ui/js/surfaces/profile-progressive.js'),/What does this role involve/);assert.match(text('assets/customer-ui/surfaces/profile-progressive.css'),/\.prf-interest-bars/);
  const apiSource=text('functions/api/profile-progressive.js');assert.match(apiSource,/mode==='CAREER_INTERESTS'/);assert.match(apiSource,/ONET_WEB_SERVICES_API_KEY/);assert.match(apiSource,/fetchOnetInterestProfilerQuestionSet/);assert.match(apiSource,/fetchOnetInterestProfilerResults/);assert.match(apiSource,/fetchOnetMatchingCareers/);assert.match(apiSource,/fetchOnetJobZones/);assert.match(apiSource,/fetchOnetCareerDetail/);assert.match(apiSource,/rawAnswersReturned:false/);assert.match(apiSource,/PRF_ONET_PROVIDER_NOT_CONFIGURED/);
  console.log('✓ PRF-ONET W6 customer UX passed: optional Career Interests mode, Quick 30 / Deeper 60, source-aware results and no client credential exposure.');
}
if(run('W7')||MODE==='ALL'){
  if(!signals.length){const provider=await fetchOnetInterestProfilerResults({apiKey:'test-key',answers:'543215432154321543215432154321',fetchImpl:mockFetch});onet30=await normalizeOnetInterestProfilerResult({participantRef:'PERSON-A',assessmentDate:'2026-09-03',form:'MINI_30',providerResult:provider,careers:[]});signals=await buildOnetProfileSignals(onet30);}const first=signals[0];const reality={schemaVersion:'PHI-OS-CURRENT-REALITY-OBSERVATION-v1',observations:[{observationId:'OBS-ONET-1',source:'CUSTOMER',confidence:'SELF_REPORTED',statement:'This interest is not currently visible in my work.'}]};const correlation=await buildProfileCurrentRealityCorrelation({profileSignals:[first],currentRealityIr:reality,responses:[{profileSignalId:first.profileSignalId,state:'CURRENTLY_NOT_RESONANT',observationRefs:['OBS-ONET-1']}],asOfDate:'2026-09-03'});assert.equal(correlation.correlations[0].state,'CURRENTLY_NOT_RESONANT');assert.equal(correlation.correlations[0].governance.currentRealityProvesProfileModel,false);const cross=await buildCrossSourcePerspective({profileSignals:[first],profileRealityCorrelation:correlation,translationRuleRegistry:crossRules,comparisons:[{ruleId:'PRF-XSR-CURRENT-REALITY-CONTEXT-v1',group:'CURRENTLY_CONTRADICTED',topicId:'CAREER_INTEREST_REALITY',signalRefs:[first.profileSignalId],realityCorrelationRefs:[correlation.correlations[0].correlationId],statement:'Current Reality does not presently show this reported interest.',explicitComparison:true}]});assert.equal(cross.perspectives[0].group,'CURRENTLY_CONTRADICTED');assert.equal(cross.perspectives[0].governance.consensusTruthCreated,false);const other=await buildProfileSignalEnvelope({participantRef:'PERSON-A',sourceClass:'CUSTOMER_SELF_REPORT',sourceRef:'SELF-1',domainId:'CAREER_DIRECTION',value:'OPEN',confidence:'CUSTOMER_CONFIRMED',assessmentDate:'2026-09-03',customerConfirmed:true});const parallel=await buildCrossSourcePerspective({profileSignals:[first,other],translationRuleRegistry:crossRules,comparisons:[{ruleId:'PRF-XSR-PARALLEL-SOURCE-COMPARISON-v1',group:'SOURCE_TENSION',topicId:'CAREER_DIRECTION',signalRefs:[first.profileSignalId,other.profileSignalId],statement:'Interest evidence and self-described direction remain different sources.',explicitComparison:true}]});assert.deepEqual(parallel.perspectives[0].sourceClasses,['CUSTOMER_SELF_REPORT','STANDARDIZED_SELF_REPORT']);assert.equal(parallel.governance.sourceConvergenceIsProof,false);const view=await buildProgressiveProfileView({mode:'CAREER_INTERESTS',profileSignals:signals,profileRealityCorrelation:null,crossSourcePerspective:null,participantRef:'PERSON-A',asOfDate:'2026-09-03',locale:'en',customerPublishable:true});assert.equal(view.careerInterest.axes.length,6);assert.equal(view.careerInterest.governance.automaticRealityMatching,false);
  console.log('✓ PRF-ONET W7 Current Reality + Cross-Source passed: explicit contradiction stays open evidence, source classes remain separate, no proof transfer.');
}
if(run('W8')||MODE==='ALL'){
  assert.equal(registry.status,'FOUR_LANE_PRODUCTION_WITH_ONET_LIVE_PROVIDER_BINDING_REQUIRED');assert.equal(registry.instruments.find(x=>x.priority==='P3').availabilityState,'AVAILABLE_WHEN_DEPLOYMENT_SECRET_BOUND');assert.equal(current.currentState,'ONET_LIVE_PROVIDER_ADMITTED_PRODUCTION_BINDING_REQUIRED');assert.equal(freeze.status,'PRODUCTION_FREEZE_PROVIDER_ADMITTED_BINDING_REQUIRED');assert.equal(freeze.customerExecutionAllowedWhenSecretBound,true);assert.equal(freeze.customerExecutionAllowedWithoutSecret,false);assert.equal(freeze.liveProductionCloudflareSecretBindingObserved,false);assert.equal(freeze.secretMaterialFrozenIntoArtifact,false);assert.equal(freeze.short60State,'RUNTIME_ADMITTED_NOT_DIRECTLY_LIVE_OBSERVED_IN_THIS_FREEZE');assert.equal(PROFILE_PRODUCTION_AUTHORITY.academicBridge.P3_ONET_RIASEC,'LIVE_PROVIDER_ADMITTED_BINDING_REQUIRED');assert.equal(PROFILE_PRODUCTION_AUTHORITY.modes.CAREER_INTERESTS,'LIVE_PROVIDER_ADMITTED_FAIL_CLOSED_UNTIL_SECRET_BOUND');
  console.log('✓ PRF-ONET W8 live activation freeze passed: user-observed provider evidence admitted; production execution remains fail-closed until the Cloudflare secret is bound; Short 60 limitation explicit.');
}
if(MODE==='ALL') console.log('✓ PRF-ONET-LIVE-ACTIVATION W0-W8 passed.');
