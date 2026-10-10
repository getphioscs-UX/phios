import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {
  ACADEMIC_SIGNAL_BUNDLE_SCHEMA,
  FINANCIAL_CAPABILITY_RESULT_SCHEMA,
  IPIP_RESULT_SCHEMA,
  ONET_RESULT_SCHEMA,
  REASONING_RENDERER_SCHEMA,
  REASONING_SESSION_SCHEMA,
  buildAcademicProfileSignalBundle,
  fetchOnetInterestProfilerQuestions,
  fetchOnetInterestProfilerResults,
  fetchOnetMatchingCareers,
  normalizeOnetInterestProfilerResult,
  renderReasoningPerformance,
  scoreFinancialCapabilityAssessment,
  scoreIpipAssessment,
  scoreOriginalReasoningTaskBank,
  stableAcademicBridgeSnapshot
} from '../functions/profile/academic-bridge-runtime.js';

const ROOT = process.cwd();
const BASE = 'c259917fbc55b57d35402a591f0db2e7e7b7e8c3';
const MODE = String(process.argv[2] || 'ALL').toUpperCase();
const json = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const text = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const run = id => MODE === 'ALL' || MODE === id;

const statusModel = json('content/profile/academic/contracts/academic-instrument-status-model-v1.json');
const ipip50 = json('content/profile/academic/ipip/ipip-big-five-50-v1.json');
const ipip120 = json('content/profile/academic/ipip/ipip-neo-120-v1.json');
const ipipScoring = json('content/profile/academic/ipip/ipip-scoring-contract-v1.json');
const ipipLicense = json('content/profile/academic/ipip/ipip-license-admission-v1.json');
const reasoningBank = json('content/profile/academic/reasoning/original-reasoning-task-bank-v1.json');
const reasoningAuthority = json('content/profile/academic/reasoning/reasoning-bank-authority-v1.json');
const reasoningRendererContract = json('content/profile/academic/reasoning/reasoning-performance-renderer-contract-v1.json');
const onetContract = json('content/profile/academic/onet/onet-interest-profiler-adapter-contract-v1.json');
const onetLicense = json('content/profile/academic/onet/onet-license-attribution-v1.json');
const financeInstrument = json('content/profile/academic/financial/phi-financial-capability-instrument-v1.json');
const financeLicense = json('content/profile/academic/financial/oecd-infe-2026-license-admission-v1.json');
const financeScoring = json('content/profile/academic/financial/financial-capability-scoring-contract-v1.json');
const activation = json('content/profile/academic/registries/academic-bridge-activation-registry-v1.json');
const current = json('content/profile/academic/current/academic-bridge-current-successor-v1.json');
const acceptance = json('content/profile/academic/acceptance/profile-prf-w10a-w10f-machine-acceptance-v1.json');

const mustReject = async (fn, code) => {
  let error = null;
  try { await fn(); } catch (err) { error = err; }
  assert.ok(error, `Expected ${code}`);
  assert.equal(error.code, code);
};

if (run('W10A')) {
  assert.equal(statusModel.baselineCommit, BASE);
  assert.equal(statusModel.schemaVersion, 'PHI-OS-ACADEMIC-INSTRUMENT-STATUS-MODEL-v1.0.0');
  assert.ok(statusModel.axes.availabilityState.includes('AVAILABLE'));
  assert.ok(statusModel.axes.normingState.includes('NORMED'));
  assert.ok(statusModel.axes.scoringState.includes('EXTERNALLY_SCORED'));
  assert.ok(statusModel.axes.scoringState.includes('ADAPTED_SCORED'));
  assert.equal(statusModel.promotionRule.normingRequiredForAvailability, false);
  assert.equal(statusModel.governance.availableDoesNotMeanNormed, true);
  assert.equal(statusModel.governance.symbolicScientificValidationTransferAllowed, false);
  console.log('✓ PRF-W10A academic status model passed: availability, norming and scoring provenance remain orthogonal.');
}

let ipip50Result;
let ipip120Result;
if (run('W10B') || MODE === 'ALL') {
  assert.equal(ipip50.baselineCommit, BASE);
  assert.equal(ipip120.baselineCommit, BASE);
  assert.equal(ipip50.items.length, 50);
  assert.equal(ipip120.items.length, 120);
  assert.equal(ipip120.facets.length, 30);
  assert.equal(ipip120.domains.length, 5);
  assert.equal(new Set(ipip50.items.map(i => i.itemId)).size, 50);
  assert.equal(new Set(ipip120.items.map(i => i.itemId)).size, 120);
  assert.ok(ipip50.items.every(i => typeof i.prompt.en === 'string' && typeof i.prompt['zh-Hans'] === 'string'));
  assert.ok(ipip120.items.every(i => typeof i.prompt.en === 'string' && typeof i.prompt['zh-Hans'] === 'string'));
  assert.equal(ipipLicense.status, 'ADMITTED_FOR_FIRST_PARTY_USE');
  assert.equal(ipipLicense.publicDomainUse.commercial, true);
  assert.equal(ipipScoring.availabilityState, 'AVAILABLE');
  assert.equal(ipipScoring.normingState, 'NOT_NORMED');
  assert.equal(ipipScoring.scoringState, 'FIRST_PARTY_SCORED');

  const responses50 = Object.fromEntries(ipip50.items.map(i => [i.itemId, 3]));
  ipip50Result = await scoreIpipAssessment({ instrument: ipip50, responses: responses50, participantRef: 'PERSON-A', assessmentDate: '2026-09-01', consent: true, customerConfirmed: true });
  assert.equal(ipip50Result.schemaVersion, IPIP_RESULT_SCHEMA);
  assert.equal(Object.keys(ipip50Result.scores.factors).length, 5);
  assert.ok(Object.values(ipip50Result.scores.factors).every(v => v.rawTotal === 30 && v.rawMean === 3));
  assert.equal(ipip50Result.governance.percentileCreated, false);

  const responses120 = Object.fromEntries(ipip120.items.map(i => [i.itemId, 3]));
  await mustReject(() => scoreIpipAssessment({ instrument: ipip120, responses: responses120, participantRef: 'PERSON-A', assessmentDate: '2026-09-01', consent: true }), 'PRF_W10B_IPIP_SENSITIVE_CONSENT_REQUIRED');
  ipip120Result = await scoreIpipAssessment({ instrument: ipip120, responses: responses120, participantRef: 'PERSON-A', assessmentDate: '2026-09-01', consent: true, sensitiveConsent: true });
  assert.equal(Object.keys(ipip120Result.scores.facets).length, 30);
  assert.equal(Object.keys(ipip120Result.scores.domains).length, 5);
  assert.ok(Object.values(ipip120Result.scores.facets).every(v => v.rawTotal === 12 && v.rawMean === 3));
  assert.ok(Object.values(ipip120Result.scores.domains).every(v => v.rawTotal === 72));
  assert.equal(ipip120.governance.politicalInferenceBeyondAnsweredItems, false);
  console.log('✓ PRF-W10B IPIP passed: 50 + 120 item banks, bilingual candidate, keyed scoring, no invented percentile or diagnosis.');
}

let reasoningSession;
if (run('W10C') || MODE === 'ALL') {
  assert.equal(reasoningBank.baselineCommit, BASE);
  assert.equal(reasoningBank.items.length, 25);
  assert.equal(reasoningBank.families.length, 5);
  assert.deepEqual([...new Set(reasoningBank.items.map(i => i.difficultyTier))].sort(), [1,2,3,4,5]);
  assert.ok(reasoningBank.families.every(f => reasoningBank.items.filter(i => i.family === f).length === 5));
  assert.ok(reasoningBank.items.every(i => i.source === 'PHI_OS_ORIGINAL' && i.publicItem === false));
  assert.equal(reasoningAuthority.status, 'ADMITTED');
  assert.equal(reasoningBank.scoring.iqAuthority, false);
  assert.equal(reasoningBank.scoring.percentileAuthority, false);
  const correctResponses = Object.fromEntries(reasoningBank.items.map(i => [i.taskId, i.correctOptionId]));
  reasoningSession = scoreOriginalReasoningTaskBank({ bank: reasoningBank, bankAuthority: reasoningAuthority, responses: correctResponses, participantRef: 'PERSON-A', assessmentDate: '2026-09-01' });
  assert.equal(reasoningSession.schemaVersion, REASONING_SESSION_SCHEMA);
  assert.equal(reasoningSession.performance.rawCorrect, 25);
  assert.equal(reasoningSession.performance.rawAttempted, 25);
  assert.equal(reasoningSession.difficultyContext.localTaskSampleIndex, 100);
  const renderer = renderReasoningPerformance(reasoningSession, { locale: 'zh-Hans' });
  assert.equal(renderer.schemaVersion, REASONING_RENDERER_SCHEMA);
  assert.equal(renderer.familyPerformance.length, 5);
  assert.doesNotMatch(JSON.stringify(renderer), /\bIQ\s*\d|percentile\s*\d|diagnosis\s*:/i);
  assert.ok(reasoningRendererContract.forbiddenLabels.includes('IQ'));
  console.log('✓ PRF-W10C original reasoning bank passed: 25 original items, five families/tier coverage, raw performance renderer only.');
}

let onetResult;
if (run('W10D') || MODE === 'ALL') {
  assert.equal(onetContract.baselineCommit, BASE);
  assert.equal(onetContract.scoringState, 'EXTERNALLY_SCORED');
  assert.equal(onetContract.availabilityState, 'AVAILABLE_WHEN_CONFIGURED');
  assert.equal(onetContract.authentication.header, 'X-API-Key');
  assert.equal(onetLicense.webServices.accountRequired, true);
  assert.equal(onetLicense.webServices.apiDataMustNotBeAltered, true);
  assert.match(onetLicense.attributionText, /O\*NET Web Services/);

  const calls = [];
  const mockFetch = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('questions_30')) return { ok: true, status: 200, json: async () => ({ total: 30, question: Array.from({length:30},(_,i)=>({index:i+1,area:['realistic','investigative','artistic','social','enterprising','conventional'][i%6],text:`Q${i+1}`})), answer_option: [1,2,3,4,5].map(v=>({value:v,name:String(v)})) }) };
    if (url.includes('/results?')) return { ok: true, status: 200, json: async () => ({ result: ['realistic','investigative','artistic','social','enterprising','conventional'].map((code,i)=>({ code, title: code, description: `${code} description`, score: 10+i })) }) };
    if (url.includes('/careers?')) return { ok: true, status: 200, json: async () => ({ total: 2, career: [{code:'11-1011.00',title:'Example A',fit:'Best',tags:{bright_outlook:true}},{code:'13-0000.00',title:'Example B',fit:'Good',tags:{}}] }) };
    return { ok: false, status: 404, json: async()=>({}) };
  };
  const questions = await fetchOnetInterestProfilerQuestions({ apiKey: 'test-key', form: 'MINI_30', start: 1, end: 30, fetchImpl: mockFetch });
  assert.equal(questions.total, 30);
  const answers = '3'.repeat(30);
  const provider = await fetchOnetInterestProfilerResults({ apiKey: 'test-key', answers, fetchImpl: mockFetch });
  const careers = await fetchOnetMatchingCareers({ apiKey: 'test-key', answers, fetchImpl: mockFetch });
  assert.ok(calls.every(c => c.options.headers['X-API-Key'] === 'test-key'));
  onetResult = await normalizeOnetInterestProfilerResult({ participantRef:'PERSON-A', assessmentDate:'2026-09-01', form:'MINI_30', providerResult:provider, careers, customerConfirmed:true });
  assert.equal(onetResult.schemaVersion, ONET_RESULT_SCHEMA);
  assert.equal(Object.keys(onetResult.interests).length, 6);
  assert.equal(onetResult.careers.length, 2);
  assert.equal(onetResult.scoringState, 'EXTERNALLY_SCORED');
  assert.equal(onetResult.governance.providerDataAltered, false);
  assert.equal(onetResult.governance.careerFitGuaranteeCreated, false);
  await mustReject(() => fetchOnetInterestProfilerResults({ apiKey:'', answers, fetchImpl:mockFetch }), 'PRF_W10D_ONET_API_KEY_REQUIRED');
  console.log('✓ PRF-W10D O*NET adapter passed: v2 X-API-Key, 30/60 forms, external RIASEC scoring, attribution and career bridge boundaries.');
}

let financeResult;
if (run('W10E') || MODE === 'ALL') {
  assert.equal(financeLicense.status, 'CC_BY_4_0_ADMITTED_FOR_ADAPTATION');
  assert.equal(financeLicense.rights.adapt, true);
  assert.equal(financeLicense.rights.translate, true);
  assert.equal(financeLicense.conditions.oecdLogoUseGranted, false);
  assert.equal(financeInstrument.items.length, 16);
  assert.ok(financeInstrument.items.every(i => typeof i.prompt.en === 'string' && typeof i.prompt['zh-Hans'] === 'string'));
  assert.deepEqual([...new Set(financeInstrument.items.map(i => i.sourceClass))].sort(), ['MEASURED_TASK_PERFORMANCE','STANDARDIZED_SELF_REPORT']);
  assert.equal(financeInstrument.scoringState, 'ADAPTED_SCORED');
  assert.equal(financeInstrument.governance.officialOecdScoreClaimed, false);
  assert.equal(financeScoring.boundaries.officialOecdComposite, false);
  const responses = {};
  for (const item of financeInstrument.items) {
    if (item.response === 'LIKERT_1_5') responses[item.itemId] = item.scoring.goodIf[0];
    else responses[item.itemId] = item.scoring.correct;
  }
  await mustReject(() => scoreFinancialCapabilityAssessment({ instrument:financeInstrument,responses,participantRef:'PERSON-A',assessmentDate:'2026-09-01' }), 'PRF_W10E_FINANCIAL_EXPLICIT_CONSENT_REQUIRED');
  financeResult = await scoreFinancialCapabilityAssessment({ instrument:financeInstrument,responses,participantRef:'PERSON-A',assessmentDate:'2026-09-01',consent:true,customerConfirmed:true });
  assert.equal(financeResult.schemaVersion, FINANCIAL_CAPABILITY_RESULT_SCHEMA);
  assert.equal(Object.keys(financeResult.sections).length, 5);
  assert.ok(Object.values(financeResult.sections).every(s => s.adaptedIndex === 100));
  assert.equal(financeResult.governance.officialOecdCompositeCreated, false);
  assert.equal(financeResult.governance.professionalFinancialAdviceCreated, false);
  console.log('✓ PRF-W10E OECD/INFE-adapted financial capability passed: CC BY admission, bilingual adaptation, separated knowledge/self-report scoring, no official OECD-score claim.');
}

if (run('W10F') || MODE === 'ALL') {
  assert.equal(activation.baselineCommit, BASE);
  assert.deepEqual(activation.instruments.map(i=>i.priority), ['P1','P2','P3','P4']);
  assert.equal(activation.instruments.find(i=>i.priority==='P1').availabilityState, 'AVAILABLE');
  assert.equal(activation.instruments.find(i=>i.priority==='P2').availabilityState, 'AVAILABLE');
  assert.equal(activation.instruments.find(i=>i.priority==='P3').availabilityState, 'AVAILABLE_WHEN_CONFIGURED');
  assert.equal(activation.instruments.find(i=>i.priority==='P3').scoringState, 'EXTERNALLY_SCORED');
  assert.equal(activation.instruments.find(i=>i.priority==='P4').availabilityState, 'AVAILABLE');
  assert.equal(activation.instruments.find(i=>i.priority==='P4').scoringState, 'ADAPTED_SCORED');
  assert.equal(current.predecessorState, 'HISTORICAL_FOUNDATION_PRESERVED');
  assert.equal(current.customerPublication, 'BLOCKED_UNTIL_PRF_W12');

  if (!ipip50Result) ipip50Result = await scoreIpipAssessment({ instrument:ipip50,responses:Object.fromEntries(ipip50.items.map(i=>[i.itemId,3])),participantRef:'PERSON-A',assessmentDate:'2026-09-01',consent:true });
  if (!reasoningSession) reasoningSession = scoreOriginalReasoningTaskBank({bank:reasoningBank,bankAuthority:reasoningAuthority,responses:Object.fromEntries(reasoningBank.items.slice(0,10).map(i=>[i.taskId,i.correctOptionId])),participantRef:'PERSON-A',assessmentDate:'2026-09-01'});
  if (!onetResult) onetResult = await normalizeOnetInterestProfilerResult({participantRef:'PERSON-A',assessmentDate:'2026-09-01',providerResult:{result:['realistic','investigative','artistic','social','enterprising','conventional'].map((code,i)=>({code,score:10+i,title:code,description:null}))},careers:[]});
  if (!financeResult) {
    const responses={}; for (const item of financeInstrument.items) responses[item.itemId]=item.response==='LIKERT_1_5'?item.scoring.goodIf[0]:item.scoring.correct;
    financeResult=await scoreFinancialCapabilityAssessment({instrument:financeInstrument,responses,participantRef:'PERSON-A',assessmentDate:'2026-09-01',consent:true});
  }
  const bundle = await buildAcademicProfileSignalBundle({ ipipResult:ipip50Result, reasoningSession, onetResult, financialResult:financeResult });
  assert.equal(bundle.schemaVersion, ACADEMIC_SIGNAL_BUNDLE_SCHEMA);
  assert.ok(bundle.signals.length >= 20);
  assert.ok(bundle.sourceClassIndex.STANDARDIZED_SELF_REPORT.length > 0);
  assert.ok(bundle.sourceClassIndex.MEASURED_TASK_PERFORMANCE.length > 0);
  assert.ok(bundle.signals.every(signal => signal.governance.sourceClassErased === false));
  assert.equal(bundle.governance.crossLaneAveragingAllowed, false);
  assert.equal(bundle.governance.universalMasterScoreCreated, false);
  assert.equal(bundle.governance.symbolicScientificValidationCreated, false);
  assert.equal(stableAcademicBridgeSnapshot(bundle), stableAcademicBridgeSnapshot(bundle));
  console.log(`✓ PRF-W10F unified ProfileSignalEnvelope integration passed: ${bundle.signals.length} signals, source classes preserved, no master-score flattening.`);
}

if (MODE === 'ALL') {
  assert.equal(acceptance.baselineCommit, BASE);
  assert.deepEqual(acceptance.scope, ['PRF-W10A','PRF-W10B','PRF-W10C','PRF-W10D','PRF-W10E','PRF-W10F']);
  assert.equal(acceptance.customerPublication.allowed, false);
  assert.equal(acceptance.customerPublication.nextRequiredGate, 'PRF-W11_W12');
  assert.match(text('functions/profile/academic-bridge-runtime.js'), /sourceClassesPreserved:\s*true/);
  assert.match(text('functions/profile/academic-bridge-runtime.js'), /universalMasterScoreCreated:\s*false/);
  console.log('✓ PRF-W10A–W10F academic bridge full-activation tranche passed; customer cutover remains closed pending PRF-W11/W12.');
}
