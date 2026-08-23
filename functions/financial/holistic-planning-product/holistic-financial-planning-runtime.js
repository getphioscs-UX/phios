import { sha256 } from '../calculation-runtime/stable-digest.js';

export const HFP_RUNTIME_VERSION = '1.0.0';
const PRODUCT_CODE = 'HFP';
const SECTION_ORDER = [
  'FINANCIAL_REALITY_SNAPSHOT','HOUSEHOLD','NET_WORTH','LIQUIDITY','CASH_FLOW','LIABILITIES','PROTECTION','GOALS','EDUCATION','RETIREMENT','INVESTMENT_STRUCTURE','BUSINESS_WEALTH','ESTATE_SUCCESSION','CROSS_BORDER','KEY_FINDINGS','SCENARIO_ANALYSIS','PROFESSIONAL_RECOMMENDATIONS','ALTERNATIVES_DISADVANTAGES','ACTION_PLAN','REVIEW_CONTINUITY','UNKNOWNS_MISSING_EVIDENCE','ASSUMPTIONS_BOUNDARIES'
];
const ENGINE_SECTION = Object.freeze({
  NET_WORTH:'NET_WORTH', LIQUIDITY:'LIQUIDITY', CASH_FLOW:'CASH_FLOW', DEBT:'LIABILITIES', CONTINGENT_EXPOSURE:'LIABILITIES', PROTECTION_NEED:'PROTECTION', EDUCATION_FUNDING:'EDUCATION', RETIREMENT:'RETIREMENT', INVESTMENT_PROJECTION:'INVESTMENT_STRUCTURE', ALLOCATION:'INVESTMENT_STRUCTURE', BUSINESS_WEALTH:'BUSINESS_WEALTH', ESTATE_LIQUIDITY:'ESTATE_SUCCESSION', CURRENCY:'CROSS_BORDER'
});
const UNKNOWN_DISCLOSURE = new Set(['NOT_YET_PROVIDED','DECLINED_TO_PROVIDE','UNKNOWN']);
const PROFESSIONAL_TYPES = new Set(['RECOMMENDATION','WARNING','SUITABILITY','ALTERNATIVE','DISADVANTAGE','ACTION']);
const VISUAL_ROLES = Object.freeze({NET_WORTH_STRUCTURE:'NET_WORTH',CASHFLOW:'CASH_FLOW',ASSET_ALLOCATION:'INVESTMENT_STRUCTURE',RETIREMENT_SCENARIO:'RETIREMENT',ACTION_TIMELINE:'ACTION_PLAN'});
const DAR_ALLOWED = new Set(['stateReference','sourceDigest','willStatus','estateReadiness','assetCoverage','nominationCompleteness']);

function required(value, field) {
  if (value === undefined || value === null || value === '') throw new TypeError(`${field} is required.`);
  return value;
}
function clone(value) { return value === undefined ? undefined : structuredClone(value); }
function emptySection(code,index) { return {sectionId:String(index+1).padStart(2,'0'),sectionCode:code,statements:[],sourceReferences:[],unknownReferences:[],limitationReferences:[],completionState:'NOT_APPLICABLE'}; }
function addStatement(section, statement) {
  section.statements.push(statement);
  if (statement.sourceReference && !section.sourceReferences.includes(statement.sourceReference)) section.sourceReferences.push(statement.sourceReference);
  section.completionState = 'AVAILABLE';
}
function statement(id,type,semanticCode,authority,reference,digest,payload,professionalAuthorship=null) {
  return {statementId:id,statementType:type,semanticCode,sourceAuthority:authority,sourceReference:reference,sourceDigest:digest ?? null,payload:clone(payload),professionalAuthorship:clone(professionalAuthorship)};
}
function collectUnknownDisclosure(node, path='snapshotPayload', out=[]) {
  if (!node || typeof node !== 'object') return out;
  if (!Array.isArray(node) && typeof node.disclosureState === 'string' && UNKNOWN_DISCLOSURE.has(node.disclosureState)) {
    out.push({reasonCode:node.disclosureState,sourceAuthority:'FDR',sourceReference:node.factId || path,affectedPath:path});
  }
  if (Array.isArray(node)) node.forEach((v,i)=>collectUnknownDisclosure(v,`${path}[${i}]`,out));
  else Object.entries(node).forEach(([k,v])=>collectUnknownDisclosure(v,`${path}.${k}`,out));
  return out;
}
function flattenFcrUnknowns(fcrResult,out=[]) {
  if (!fcrResult?.engines) return out;
  for (const [engineCode,engine] of Object.entries(fcrResult.engines)) for (const [metricCode,metric] of Object.entries(engine.metrics || {})) {
    if (metric?.value?.kind === 'UNKNOWN') out.push({reasonCode:'UPSTREAM_UNKNOWN',sourceAuthority:'FCR',sourceReference:`${fcrResult.calculationId}:${engineCode}:${metricCode}`,sourceDigest:fcrResult.resultDigest});
  }
  return out;
}
function validateLineage({fdrSnapshot,fcrResult,farResult,scenarioResults=[]}) {
  required(fdrSnapshot?.snapshotId,'fdrSnapshot.snapshotId'); required(fdrSnapshot?.digest,'fdrSnapshot.digest');
  if (fcrResult) {
    required(fcrResult.resultDigest,'fcrResult.resultDigest');
    if (fcrResult.fdrDigest !== fdrSnapshot.digest) throw new TypeError('FCR/FDR digest mismatch.');
  }
  if (farResult) {
    if (!fcrResult) throw new TypeError('FAR requires the primary FCR result.');
    if (farResult.fcrResultDigest !== fcrResult.resultDigest) throw new TypeError('FAR/FCR digest mismatch.');
    if (farResult.fdrDigest !== fdrSnapshot.digest) throw new TypeError('FAR/FDR digest mismatch.');
  }
  for (const result of scenarioResults) {
    required(result?.resultDigest,'scenarioResult.resultDigest');
    if (result.fdrDigest !== fdrSnapshot.digest) throw new TypeError('Scenario FCR/FDR digest mismatch.');
  }
}
function validateMode(mode,input) {
  if (!['PRELIMINARY','PLANNING','VERIFIED','PROFESSIONAL'].includes(mode)) throw new TypeError('Unsupported HFP mode.');
  if (mode !== 'PRELIMINARY' && (!input.fcrResult || !input.farResult)) throw new TypeError(`${mode} requires FCR and FAR.`);
  if (mode === 'VERIFIED' && input.verificationState !== 'VERIFIED') throw new TypeError('VERIFIED mode requires VERIFIED source state.');
  if (mode === 'PROFESSIONAL' && input.fixtureMode !== true) throw new TypeError('PFR_PRODUCTION_AUTHORITY_NOT_INSTALLED');
}
function validateDarState(state) {
  if (!state) return;
  for (const k of Object.keys(state)) if (!DAR_ALLOWED.has(k)) throw new TypeError(`DAR field not admissible in HFP: ${k}`);
  required(state.stateReference,'darEstateState.stateReference'); required(state.sourceDigest,'darEstateState.sourceDigest');
}
function validatePfrContribution(c,fixtureMode) {
  for (const f of ['contributionId','contributionType','sourceAuthority','sourceReference','sourceDigest','authorReference','authoredAt','content']) required(c?.[f],`pfrContribution.${f}`);
  if (!PROFESSIONAL_TYPES.has(c.contributionType)) throw new TypeError('Unsupported PFR contribution type.');
  const allowed = fixtureMode === true ? ['FIXTURE_PFR'] : ['PFR'];
  if (!allowed.includes(c.sourceAuthority)) throw new TypeError('Professional contribution source authority is not admissible.');
}
function professionalStatementType(type) {
  if (type === 'WARNING') return 'PROFESSIONAL_WARNING';
  if (type === 'ACTION') return 'ACTION';
  return 'PROFESSIONAL_RECOMMENDATION';
}
function pfrSection(type) {
  if (type === 'ALTERNATIVE' || type === 'DISADVANTAGE' || type === 'SUITABILITY') return 'ALTERNATIVES_DISADVANTAGES';
  if (type === 'ACTION') return 'ACTION_PLAN';
  return 'PROFESSIONAL_RECOMMENDATIONS';
}
function sourceLineage(input) {
  const out={
    FDR:{snapshotId:input.fdrSnapshot.snapshotId,digest:input.fdrSnapshot.digest},
    FCR: input.fcrResult ? [{calculationId:input.fcrResult.calculationId,resultDigest:input.fcrResult.resultDigest,fdrDigest:input.fcrResult.fdrDigest,assumptionDigest:input.fcrResult.assumptionDigest,scenarioCode:input.fcrResult.scenarioCode},...(input.scenarioResults||[]).map(r=>({calculationId:r.calculationId,resultDigest:r.resultDigest,fdrDigest:r.fdrDigest,assumptionDigest:r.assumptionDigest,scenarioCode:r.scenarioCode}))] : [],
    FAR: input.farResult ? {analysisId:input.farResult.analysisId,resultDigest:input.farResult.resultDigest,fcrResultDigest:input.farResult.fcrResultDigest,fdrDigest:input.farResult.fdrDigest} : null,
    PFR:(input.pfrContributions||[]).map(c=>({contributionId:c.contributionId,sourceReference:c.sourceReference,sourceDigest:c.sourceDigest,authorReference:c.authorReference,sourceAuthority:c.sourceAuthority})),
    DAR: input.darEstateState ? {stateReference:input.darEstateState.stateReference,sourceDigest:input.darEstateState.sourceDigest}:null,
    ACCOUNT:{accountReference:input.accountReference}
  };
  return out;
}
function fdrCollectionStatement(section,sourceDigest,key,value,id) {
  addStatement(section,statement(id,'FINANCIAL_FACT',`HFP.FDR.${key.toUpperCase()}`,'FDR',`FDR:${key}`,sourceDigest,{field:key,value}));
}
function sectionIndex(sections,code){ return sections.find(s=>s.sectionCode===code); }

export async function composeHolisticFinancialPlan(input={}) {
  const mode=required(input.mode,'mode');
  required(input.planCandidateId,'planCandidateId'); required(input.caseReference,'caseReference'); required(input.customerReference,'customerReference'); required(input.accountReference,'accountReference');
  required(input.fdrSnapshot,'fdrSnapshot'); validateMode(mode,input); validateLineage(input); validateDarState(input.darEstateState);
  for (const c of input.pfrContributions || []) validatePfrContribution(c,input.fixtureMode);

  const sections=SECTION_ORDER.map(emptySection);
  const fdr=input.fdrSnapshot; const payload=fdr.snapshotPayload || {};
  const snapshot=sectionIndex(sections,'FINANCIAL_REALITY_SNAPSHOT');
  addStatement(snapshot,statement('HFP-ST-SNAPSHOT','FINANCIAL_FACT','HFP.SNAPSHOT.REFERENCE','FDR',fdr.snapshotId,fdr.digest,{snapshotId:fdr.snapshotId,financialRealityId:fdr.financialRealityId,sequence:fdr.sequence,timepoint:fdr.timepoint,asOfDate:fdr.asOfDate,currencyContext:clone(payload.currencyContext)}));
  if (input.fcrResult) addStatement(snapshot,statement('HFP-ST-SNAPSHOT-FCR','CALCULATED_RESULT','HFP.SNAPSHOT.FCR_REFERENCE','FCR',input.fcrResult.calculationId,input.fcrResult.resultDigest,{scenarioCode:input.fcrResult.scenarioCode,baseCurrency:input.fcrResult.baseCurrency}));
  if (input.farResult) addStatement(snapshot,statement('HFP-ST-SNAPSHOT-FAR','ANALYTICAL_FINDING','HFP.SNAPSHOT.FAR_REFERENCE','FAR',input.farResult.analysisId,input.farResult.resultDigest,{findingCount:(input.farResult.findings||[]).length}));

  const fdrMap={HOUSEHOLD:['householdReference','people'],LIABILITIES:['liabilities','guarantees'],PROTECTION:['policies'],GOALS:['goals'],BUSINESS_WEALTH:['entities'],ESTATE_SUCCESSION:['estateFacts'],CROSS_BORDER:['currencyContext','assets','entities']};
  for (const [sectionCode,keys] of Object.entries(fdrMap)) {
    const s=sectionIndex(sections,sectionCode); let i=0;
    for (const key of keys) if (payload[key] !== undefined) fdrCollectionStatement(s,fdr.digest,key,payload[key],`HFP-ST-${sectionCode}-FDR-${++i}`);
  }

  if (input.fcrResult) {
    let i=0;
    for (const [engineCode,engine] of Object.entries(input.fcrResult.engines||{})) {
      const sectionCode=ENGINE_SECTION[engineCode]; if (!sectionCode) continue; const s=sectionIndex(sections,sectionCode);
      for (const [metricCode,metric] of Object.entries(engine.metrics||{})) addStatement(s,statement(`HFP-ST-FCR-${++i}`,'CALCULATED_RESULT',`HFP.FCR.${engineCode}.${metricCode}`,'FCR',`${input.fcrResult.calculationId}:${engineCode}:${metricCode}`,input.fcrResult.resultDigest,{engineCode,metricCode,value:clone(metric.value),traceId:metric.traceId}));
    }
  }

  const findings=input.farResult?.findings || [];
  const keyFindings=sectionIndex(sections,'KEY_FINDINGS');
  for (const [i,f] of findings.entries()) addStatement(keyFindings,statement(`HFP-ST-FAR-${i+1}`,'ANALYTICAL_FINDING',`HFP.FAR.${f.findingCode}`,'FAR',f.findingId,input.farResult.resultDigest,{findingCode:f.findingCode,findingType:f.findingType,domain:f.domain,severityState:f.severityState,confidence:clone(f.confidence),evidenceState:f.evidenceState,limitations:clone(f.limitations),sourceCalculationReferences:clone(f.sourceCalculationReferences),factReferences:clone(f.factReferences)}));

  const scenarioSection=sectionIndex(sections,'SCENARIO_ANALYSIS');
  const scenarioResults=[...(input.fcrResult ? [input.fcrResult] : []),...(input.scenarioResults||[])];
  for (const [i,r] of scenarioResults.entries()) addStatement(scenarioSection,statement(`HFP-ST-SCENARIO-${i+1}`,'SCENARIO_RESULT',`HFP.SCENARIO.${r.scenarioCode}`,'FCR',r.calculationId,r.resultDigest,{scenarioCode:r.scenarioCode,baseCurrency:r.baseCurrency,assumptionSetId:r.assumptionSetId,assumptionDigest:r.assumptionDigest,resultDigest:r.resultDigest,engines:clone(r.engines)}));

  if (input.darEstateState) addStatement(sectionIndex(sections,'ESTATE_SUCCESSION'),statement('HFP-ST-DAR-ESTATE','FINANCIAL_FACT','HFP.DAR.ESTATE_STATE','DAR',input.darEstateState.stateReference,input.darEstateState.sourceDigest,clone(input.darEstateState)));

  const professionalContributions=input.pfrContributions || [];
  for (const [i,c] of professionalContributions.entries()) {
    const target=sectionIndex(sections,pfrSection(c.contributionType));
    addStatement(target,statement(`HFP-ST-PFR-${i+1}`,professionalStatementType(c.contributionType),`HFP.PFR.${c.contributionType}`,c.sourceAuthority,c.sourceReference,c.sourceDigest,{contributionId:c.contributionId,contributionType:c.contributionType,content:clone(c.content)},{authorReference:c.authorReference,authoredAt:c.authoredAt,sourceAuthority:c.sourceAuthority}));
  }

  for (const [i,a] of (input.actions||[]).entries()) {
    for (const f of ['actionId','owner','due','dependency','status','relatedGoal','sourceAuthority','sourceReference']) required(a?.[f],`action.${f}`);
    if (!['PFR','CUSTOMER','ACCOUNT','FIXTURE_PFR'].includes(a.sourceAuthority)) throw new TypeError('Unsupported action source authority.');
    if ((a.professionalSource || a.sourceAuthority==='PFR' || a.sourceAuthority==='FIXTURE_PFR') && !['PFR','FIXTURE_PFR'].includes(a.sourceAuthority)) throw new TypeError('Professional action requires PFR source.');
    addStatement(sectionIndex(sections,'ACTION_PLAN'),statement(`HFP-ST-ACTION-${i+1}`,'ACTION',`HFP.ACTION.${a.actionId}`,a.sourceAuthority,a.sourceReference,a.sourceDigest || null,clone(a),a.professionalSource ? clone(a.professionalSource):null));
  }

  if (input.continuity) {
    const c=input.continuity;
    for (const f of ['snapshotReferences','changeEventReferences','goalProgressReferences','actionProgressReferences','stalenessState']) required(c?.[f],`continuity.${f}`);
    if (!['CURRENT','STALE','UNKNOWN'].includes(c.stalenessState)) throw new TypeError('Unsupported continuity staleness state.');
    addStatement(sectionIndex(sections,'REVIEW_CONTINUITY'),statement('HFP-ST-CONTINUITY','FINANCIAL_FACT','HFP.CONTINUITY.SOURCE_BOUND','FDR',`HFP-CONTINUITY:${input.planCandidateId}`,fdr.digest,clone(c)));
  }

  const assumptionsSection=sectionIndex(sections,'ASSUMPTIONS_BOUNDARIES');
  if (input.fcrAssumptionSet) addStatement(assumptionsSection,statement('HFP-ST-ASSUMPTIONS','BOUNDARY','HFP.ASSUMPTIONS.FCR','FCR',input.fcrAssumptionSet.assumptionSetId,input.fcrAssumptionSet.digest,clone(input.fcrAssumptionSet)));
  if (input.farPolicySet && input.farResult) addStatement(assumptionsSection,statement('HFP-ST-FAR-POLICY','BOUNDARY','HFP.BOUNDARY.FAR_POLICY','FAR',input.farPolicySet.policySetId || input.farResult.analysisPolicySetId,input.farResult.analysisPolicyDigest,clone(input.farPolicySet)));
  addStatement(assumptionsSection,statement('HFP-ST-BOUNDARY','BOUNDARY','HFP.BOUNDARY.AUTHORITY','HFP','HFP:AUTHORITY',null,{noIndependentCalculation:true,noIndependentAnalysis:true,noRecommendationGeneration:true,rrOwnsReport:true,cprCustOwnsPresentation:true,darOwnsWillInstructions:true,jrOwnsJourneyState:true}));

  const unknowns=[];
  for (const u of collectUnknownDisclosure(payload)) unknowns.push({...u,unknownId:`HFP-U-${unknowns.length+1}`});
  if (input.fcrResult) for (const u of flattenFcrUnknowns(input.fcrResult)) unknowns.push({...u,unknownId:`HFP-U-${unknowns.length+1}`});
  for (const f of findings) if (['UNKNOWN','MISSING_EVIDENCE','CONTRADICTION'].includes(f.findingType)) unknowns.push({unknownId:`HFP-U-${unknowns.length+1}`,reasonCode:f.findingType,sourceAuthority:'FAR',sourceReference:f.findingId,sourceDigest:input.farResult.resultDigest});
  if (!input.fcrResult) unknowns.push({unknownId:`HFP-U-${unknowns.length+1}`,reasonCode:'SOURCE_NOT_PROVIDED',sourceAuthority:'FCR',sourceReference:null});
  if (!input.farResult) unknowns.push({unknownId:`HFP-U-${unknowns.length+1}`,reasonCode:'SOURCE_NOT_PROVIDED',sourceAuthority:'FAR',sourceReference:null});
  if (!input.darEstateState) unknowns.push({unknownId:`HFP-U-${unknowns.length+1}`,reasonCode:'DAR_STATE_NOT_AVAILABLE',sourceAuthority:'DAR',sourceReference:null});
  if (mode==='PROFESSIONAL' && professionalContributions.length===0) unknowns.push({unknownId:`HFP-U-${unknowns.length+1}`,reasonCode:'PFR_NOT_AVAILABLE',sourceAuthority:'PFR',sourceReference:null});
  const unknownSection=sectionIndex(sections,'UNKNOWNS_MISSING_EVIDENCE');
  for (const u of unknowns) addStatement(unknownSection,statement(`HFP-ST-${u.unknownId}`,'UNKNOWN',`HFP.UNKNOWN.${u.reasonCode}`,u.sourceAuthority,u.sourceReference,u.sourceDigest||null,clone(u)));
  unknownSection.unknownReferences=unknowns.map(u=>u.unknownId);

  const limitations=[
    ...(findings.flatMap(f=>(f.limitations||[]).map(x=>({sourceAuthority:'FAR',sourceReference:f.findingId,limitation:x})))),
    ...(input.limitations||[]).map(x=>clone(x))
  ];
  for (const s of sections) if (s.statements.length===0 && s.completionState==='NOT_APPLICABLE') s.completionState='UNAVAILABLE';

  const visualSemanticReferences=Object.entries(VISUAL_ROLES).map(([role,sectionCode],i)=>{
    const s=sectionIndex(sections,sectionCode); return {visualReferenceId:`HFP-VIS-${i+1}`,visualRole:role,sectionCode,sourceReferences:clone(s.sourceReferences),state:s.sourceReferences.length?'AVAILABLE':'UNAVAILABLE'};
  });

  const fixturePfrUsed=professionalContributions.some(c=>c.sourceAuthority==='FIXTURE_PFR');
  const professionalCompletionRequired = mode==='PROFESSIONAL' && (professionalContributions.length===0 || fixturePfrUsed);
  const professionalCompletionReasons=[];
  if (mode==='PROFESSIONAL' && professionalContributions.length===0) professionalCompletionReasons.push('PFR_CONTRIBUTION_REQUIRED');
  if (fixturePfrUsed) professionalCompletionReasons.push('FIXTURE_PFR_NOT_PRODUCTION_AUTHORITY');
  const productionEligible=!fixturePfrUsed;
  const candidate={schemaVersion:'PHI-OS-HFP-CANDIDATE-v1.0.0',runtimeCode:'HFP',runtimeVersion:HFP_RUNTIME_VERSION,planCandidateId:input.planCandidateId,productCode:PRODUCT_CODE,productVersion:'1.0.0',mode,caseReference:input.caseReference,customerReference:input.customerReference,accountReference:input.accountReference,verificationState:input.verificationState || 'UNVERIFIED',sourceLineage:sourceLineage(input),sections,unknowns,limitations,visualSemanticReferences,professionalCompletionRequired,professionalCompletionReasons,productionEligible,terminalState:'CANDIDATE',candidateDigest:null};
  const basis=clone(candidate); delete basis.candidateDigest; candidate.candidateDigest=await sha256(basis);
  return Object.freeze(candidate);
}

export async function createHfpRrSubmission(candidate, options={}) {
  required(candidate?.candidateDigest,'candidate.candidateDigest'); required(options.submittedAt,'submittedAt');
  if (candidate.terminalState !== 'CANDIDATE') throw new TypeError('HFP can hand off only CANDIDATE state.');
  return Object.freeze({schemaVersion:'PHI-OS-HFP-RR-SUBMISSION-v1.0.0',hfpCandidateReference:candidate.planCandidateId,hfpCandidateDigest:candidate.candidateDigest,caseReference:candidate.caseReference,customerReference:candidate.customerReference,reportProductCode:'HFP',productVersion:candidate.productVersion,sectionCount:candidate.sections.length,sourceAuthorityReferences:clone(candidate.sourceLineage),professionalCompletionRequired:candidate.professionalCompletionRequired,unknownCount:candidate.unknowns.length,limitationCount:candidate.limitations.length,visualSemanticReferences:clone(candidate.visualSemanticReferences),submittedAt:options.submittedAt});
}

export function createHfpJourneyHandoff(candidate, intentCodes=['OBSERVE','ACT','REVIEW','CONTINUE']) {
  required(candidate?.candidateDigest,'candidate.candidateDigest');
  for (const code of intentCodes) if (!['OBSERVE','ACT','REVIEW','CONTINUE'].includes(code)) throw new TypeError('Unsupported HFP Journey intent.');
  const actionSection=candidate.sections.find(s=>s.sectionCode==='ACTION_PLAN');
  return Object.freeze({schemaVersion:'PHI-OS-HFP-JR-HANDOFF-v1.0.0',planCandidateReference:candidate.planCandidateId,planCandidateDigest:candidate.candidateDigest,customerReference:candidate.customerReference,actionReferences:(actionSection?.statements||[]).map(s=>s.sourceReference),unknownReferences:candidate.unknowns.map(u=>u.unknownId),intentCodes:[...intentCodes],targetRuntime:'JR'});
}
