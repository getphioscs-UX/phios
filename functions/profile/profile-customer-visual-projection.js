import { buildProfileCustomerOutputSuccessor } from './profile-customer-output-successor.js';

const list=v=>Array.isArray(v)?v:[];
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const freeze=v=>Object.freeze(v);
const PFIG_ORDER=Object.freeze(['PFIG-001','PFIG-002','PFIG-003','PFIG-004','PFIG-005','PFIG-006','PFIG-007','PFIG-008','PFIG-009']);
const VALID_CONFIRMATIONS=new Set(['HELPS_ME','COSTS_ME','BOTH','NEUTRAL','UNSURE']);
const VALID_CONTEXTS=new Set(['WORK','RELATIONSHIP','CURRENT_REALITY','GENERAL']);

export const PROFILE_CUSTOMER_VISUAL_PROJECTION_SCHEMA='PHI-OS-PROFILE-CUSTOMER-VISUAL-PROJECTION-v1.0.0';
export const PROFILE_PFIG_ORDER=PFIG_ORDER;

const fig=(pfig,schemaVersion,customerLabel,data,state='READY',evidenceRefs=[],boundaries=[])=>freeze({pfig,schemaVersion,state,customerLabel,data:clone(data),evidenceRefs:[...new Set(evidenceRefs.filter(Boolean))],boundaries:[...boundaries]});
const unknown=(pfig,schemaVersion,customerLabel,boundaries=[])=>fig(pfig,schemaVersion,customerLabel,{},'UNKNOWN',[],boundaries);
const signalRef=x=>x?.signalRef||x?.id||x?.perspectiveRef||null;
const flatDimensions=output=>list(output.sourceScopedDimensions).flatMap(lane=>list(lane.dimensions).map(d=>({...d,sourceKey:lane.sourceKey,sourceClass:lane.sourceClass,providerFamily:lane.providerFamily})));
const numeric=v=>typeof v==='number'&&Number.isFinite(v)?v:(typeof v?.normalizedSelfReportIndex==='number'?v.normalizedSelfReportIndex:(typeof v?.score==='number'?v.score:null));
const validConfirmations=rows=>list(rows).filter(x=>VALID_CONFIRMATIONS.has(x?.confirmation)&&(!x.contextType||VALID_CONTEXTS.has(x.contextType)));
const contexts=rows=>[...new Set(rows.map(x=>x.contextType).filter(x=>VALID_CONTEXTS.has(x)))];

function mapCrossSourceState(p,contextEvidence){
  const native=p?.group||p?.nativeGroup||'OPEN';
  if(native==='SOURCE_ALIGNED') return 'CONVERGES';
  if(native==='SOURCE_CONTRADICTION') return 'DIVERGES';
  if(native==='OPEN') return 'UNKNOWN';
  if(native==='CURRENTLY_SUPPORTED'||native==='CURRENTLY_CONTRADICTED') return 'CONTEXT_DEPENDENT';
  const hasContext=list(p?.realityCorrelationRefs).length>0 || Boolean(contextEvidence?.currentReality);
  if(native==='SOURCE_TENSION') return hasContext?'CONTEXT_DEPENDENT':'UNKNOWN';
  if(native==='SOURCE_COMPLEMENTARY') return hasContext?'CONTEXT_DEPENDENT':'UNKNOWN';
  return 'UNKNOWN';
}

export function buildProfileCustomerVisualProjection({progressiveView=null,customerOutput=null,confirmations=[],participantRef=null,asOfDate=null}={}){
  const output=customerOutput||buildProfileCustomerOutputSuccessor(progressiveView||{});
  const dims=flatDimensions(output);
  const confirms=validConfirmations(confirmations);
  const evidenceRefs=dims.map(signalRef).filter(Boolean);

  const p001=dims.length?fig('PFIG-001','PHI-OS-PFIG-001-PROFILE-DIMENSION-MAP-IR-v1.0.0',{en:'Profile dimensions', 'zh-Hans':'Profile 维度'},
    {lanes:clone(output.sourceScopedDimensions)},'READY',evidenceRefs,['SOURCE_SCOPED_ONLY','NO_UNIVERSAL_DIMENSION_SCORE']):unknown('PFIG-001','PHI-OS-PFIG-001-PROFILE-DIMENSION-MAP-IR-v1.0.0',{en:'Profile dimensions','zh-Hans':'Profile 维度'},['MISSING_EVIDENCE_REMAINS_UNKNOWN']);

  const radarSeries=list(output.sourceScopedDimensions).map(lane=>({sourceKey:lane.sourceKey,sourceClass:lane.sourceClass,providerFamily:lane.providerFamily,points:list(lane.dimensions).map(d=>({axis:d.facetId||d.domainId,signalRef:d.signalRef,value:numeric(d.value),nativeValue:clone(d.value),assessmentDate:d.assessmentDate||null})).filter(x=>x.value!=null)})).filter(s=>s.points.length>=2);
  const p002=radarSeries.length?fig('PFIG-002','PHI-OS-PFIG-002-PROFILE-PATTERN-RADAR-IR-v1.0.0',{en:'Pattern radar','zh-Hans':'模式雷达'},{series:radarSeries},'READY',radarSeries.flatMap(s=>s.points.map(x=>x.signalRef)),['ONE_SOURCE_PER_SERIES','NO_SYNTHETIC_MASTER_POLYGON','NO_CROSS_INSTRUMENT_EQUIVALENCE']):unknown('PFIG-002','PHI-OS-PFIG-002-PROFILE-PATTERN-RADAR-IR-v1.0.0',{en:'Pattern radar','zh-Hans':'模式雷达'},['NO_RENDERABLE_SOURCE_NATIVE_SERIES']);

  const resources=confirms.filter(x=>x.confirmation==='HELPS_ME'||x.confirmation==='BOTH').map(x=>clone(x));
  const confirmedCosts=confirms.filter(x=>x.confirmation==='COSTS_ME'||x.confirmation==='BOTH').map(x=>clone(x));
  const tensionCosts=list(output.tensionSignals).map(x=>({...clone(x),confirmation:'ADMITTED_TENSION_EVIDENCE'}));
  const costs=[...confirmedCosts,...tensionCosts];
  const p003=(resources.length||costs.length)?fig('PFIG-003','PHI-OS-PFIG-003-PROFILE-STRENGTH-COST-MAP-IR-v1.0.0',{en:'Resources & costs','zh-Hans':'资源与成本'},{resources,costs},'READY',[...resources,...costs].map(signalRef),['OBSERVED_RESOURCE_NOT_OBJECTIVE_STRENGTH','NO_HIGH_LOW_SCORE_INFERENCE']):unknown('PFIG-003','PHI-OS-PFIG-003-PROFILE-STRENGTH-COST-MAP-IR-v1.0.0',{en:'Resources & costs','zh-Hans':'资源与成本'},['CONFIRMATION_OR_TENSION_EVIDENCE_REQUIRED']);

  const contextConfirms=confirms.filter(x=>x.contextType&&x.contextType!=='GENERAL');
  const ctxs=contexts(contextConfirms);
  const hasContext=Boolean(output.contextEvidence)||contextConfirms.length>0;
  const p004=hasContext?fig('PFIG-004','PHI-OS-PFIG-004-PROFILE-CONTEXT-VARIATION-IR-v1.0.0',{en:'Context variation','zh-Hans':'情境变化'},{contexts:ctxs,observations:clone(contextConfirms),contextEvidence:clone(output.contextEvidence)},'READY',contextConfirms.map(signalRef),['NO_CONTEXT_PERSONALITY_TYPE','UNOBSERVED_CONTEXTS_UNKNOWN']):unknown('PFIG-004','PHI-OS-PFIG-004-PROFILE-CONTEXT-VARIATION-IR-v1.0.0',{en:'Context variation','zh-Hans':'情境变化'},['EXPLICIT_CONTEXT_EVIDENCE_REQUIRED']);

  const cross=list(progressiveView?.crossSource?.perspectives||output.contextEvidence?.currentReality?.crossSource?.perspectives||output.contextEvidence?.crossSource?.perspectives);
  const mapped=cross.map(p=>({perspectiveRef:p.id||p.perspectiveRef||null,nativeGroup:p.group||p.nativeGroup||'OPEN',projectionState:mapCrossSourceState(p,output.contextEvidence),sourceClasses:clone(p.sourceClasses||[]),signalRefs:clone(p.signalRefs||[]),realityCorrelationRefs:clone(p.realityCorrelationRefs||[]),statement:p.statement||null}));
  const p005=mapped.length?fig('PFIG-005','PHI-OS-PFIG-005-PROFILE-CONVERGENCE-DIVERGENCE-IR-v1.0.0',{en:'Cross-source view','zh-Hans':'跨来源视图'},{perspectives:mapped},'READY',mapped.flatMap(x=>[x.perspectiveRef,...x.signalRefs,...x.realityCorrelationRefs]),['NATIVE_GROUP_PRESERVED','OWNER_MAPPING_ONLY','FALLBACK_UNKNOWN']):unknown('PFIG-005','PHI-OS-PFIG-005-PROFILE-CONVERGENCE-DIVERGENCE-IR-v1.0.0',{en:'Cross-source view','zh-Hans':'跨来源视图'},['EXPLICIT_CROSS_SOURCE_COMPARISON_REQUIRED']);

  const workObs=confirms.filter(x=>x.contextType==='WORK');
  const workReady=Boolean(output.careerInterest)||workObs.length>0;
  const p006=workReady?fig('PFIG-006','PHI-OS-PFIG-006-PROFILE-WORK-MAP-IR-v1.0.0',{en:'Work interest & expression','zh-Hans':'工作兴趣与表达'},{interestEvidence:clone(output.careerInterest),observedExpression:clone(workObs)},'READY',workObs.map(signalRef),['INTEREST_NOT_JOB_FIT','NO_ABILITY_OR_EMPLOYMENT_GUARANTEE']):unknown('PFIG-006','PHI-OS-PFIG-006-PROFILE-WORK-MAP-IR-v1.0.0',{en:'Work interest & expression','zh-Hans':'工作兴趣与表达'},['WORK_EVIDENCE_REQUIRED']);

  const relObs=confirms.filter(x=>x.contextType==='RELATIONSHIP');
  const relReady=Boolean(output.relationshipEvidence)||relObs.length>0;
  const p007=relReady?fig('PFIG-007','PHI-OS-PFIG-007-PROFILE-RELATIONSHIP-MAP-IR-v1.0.0',{en:'Relationship interaction','zh-Hans':'关系互动'},{relationshipEvidence:clone(output.relationshipEvidence),observations:clone(relObs)},'READY',relObs.map(signalRef),['NOT_FIXED_RELATIONSHIP_STYLE','NO_COMPATIBILITY_PERCENTAGE','NO_PARTNER_HIDDEN_STATE']):unknown('PFIG-007','PHI-OS-PFIG-007-PROFILE-RELATIONSHIP-MAP-IR-v1.0.0',{en:'Relationship interaction','zh-Hans':'关系互动'},['RELATIONSHIP_EVIDENCE_REQUIRED']);

  const decisionDims=dims.filter(d=>/PLANNING|RISK_AWARENESS|DECISION_DISCIPLINE|DECISION/i.test(`${d.domainId||''} ${d.facetId||''}`));
  const decisionObs=confirms.filter(x=>x.contextType==='CURRENT_REALITY'||x.contextType==='GENERAL').filter(x=>/DECISION|PLANNING|RISK/i.test(`${x.lensId||''} ${x.signalRef||''} ${x.note||''}`));
  const p008=(decisionDims.length||decisionObs.length)?fig('PFIG-008','PHI-OS-PFIG-008-PROFILE-DECISION-MAP-IR-v1.0.0',{en:'Decision evidence','zh-Hans':'决策证据'},{decisionEvidence:clone(decisionDims),currentPattern:clone(decisionObs)},'READY',[...decisionDims,...decisionObs].map(signalRef),['NOT_FIXED_DECISION_TYPE','NO_FINANCIAL_ADVICE']):unknown('PFIG-008','PHI-OS-PFIG-008-PROFILE-DECISION-MAP-IR-v1.0.0',{en:'Decision evidence','zh-Hans':'决策证据'},['DECISION_EVIDENCE_REQUIRED']);

  const bridgeReady=Boolean(output.contextEvidence)||list(output.contradictions).length>0||list(output.realityQuestions).length>0;
  const p009=bridgeReady?fig('PFIG-009','PHI-OS-PFIG-009-PROFILE-REALITY-BRIDGE-IR-v1.0.0',{en:'Reality bridge','zh-Hans':'现实桥接'},{contextEvidence:clone(output.contextEvidence),contradictions:clone(output.contradictions),questions:clone(output.realityQuestions)},'READY',[...list(output.contradictions),...list(output.realityQuestions)].map(signalRef),['CURRENT_REALITY_CONTEXTUALIZES_NOT_VALIDATES','QUESTIONS_NOT_DIRECTIVES']):unknown('PFIG-009','PHI-OS-PFIG-009-PROFILE-REALITY-BRIDGE-IR-v1.0.0',{en:'Reality bridge','zh-Hans':'现实桥接'},['CURRENT_REALITY_OR_QUESTION_EVIDENCE_REQUIRED']);

  const figures=freeze([p001,p002,p003,p004,p005,p006,p007,p008,p009]);
  return freeze({schemaVersion:PROFILE_CUSTOMER_VISUAL_PROJECTION_SCHEMA,participantRef:participantRef||progressiveView?.participantRef||null,asOfDate:asOfDate||progressiveView?.asOfDate||null,figures,governance:{truthOwner:'PROFILE_PPR',projectionOwner:'PVP_R1',pvpMeaningAuthorityCreated:false,universalMasterScoreCreated:false,crossInstrumentNormalizationCreated:false,missingEvidenceInvented:false}});
}
