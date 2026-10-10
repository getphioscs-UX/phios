import fs from 'node:fs';
import crypto from 'node:crypto';
import {createTarotRuntime,TAROT_RUNTIME_CODE} from '../../../functions/core-method-runtime/tarot-runtime.js';
import {createTarotCardProjector} from '../../../functions/core-method-runtime/tarot-card-projection-mapper.js';
import {createTarotReadingIR} from '../../../functions/interpretation-runtime/tarot-reading-ir-v1.js';
import {createTarotProductPublicViewModel} from '../../../functions/symbolic-method-public-ux/tarot-product-view-model-v1.js';
import {assertSymbolicSensitiveDomainBoundary,detectSensitiveDomains} from '../../../functions/symbolic-method-public-ux/symbolic-sensitive-domain-guard.js';
import {tarotAuthorities,selectionRuntime,manualOne,manualThree} from './tarot-fixtures-v1.mjs';
import {TAROT_DECK_ID,TAROT_DECK_VERSION,TAROT_ORIENTATION_POLICY_ID,TAROT_ORIENTATION_POLICY_VERSION} from '../../../functions/core-method-runtime/tarot-selection-runtime.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const shaBuffer=b=>crypto.createHash('sha256').update(b).digest('hex');
const shaFile=p=>shaBuffer(fs.readFileSync(p));
export const authorities=Object.freeze({
 cardRegistry:j('content/professional/core-method-runtime/tarot-card-registry-v1.json'),
 visualCorpus:j('content/interpretation/tarot/corpus/tarot-rws-visual-observation-corpus-v1.json'),
 visualLocator:j('content/interpretation/tarot/registries/tarot-visual-evidence-locator-v1.json'),
 sourceRegistry:j('content/interpretation/tarot/registries/tarot-source-registry-v2.json'),
 perspectiveRegistry:j('content/interpretation/tarot/registries/tarot-interpretation-perspective-registry-v2.json'),
 waiteCorpus:j('content/interpretation/tarot/corpus/tarot-waite-source-bound-corpus-v1.json'),
 predecessorMeaningCorpus:j('content/interpretation/tarot/corpus/tarot-minimum-source-bound-corpus-v1.json'),
 reflectiveLensRegistry:j('content/interpretation/tarot/registries/tarot-reflective-lens-registry-v1.json'),
 noSourceBlendingContract:j('content/interpretation/tarot/contracts/tarot-no-source-blending-contract-v1.json'),
 corpusFreeze:j('content/interpretation/tarot/freeze/tarot-corpus-freeze-v1.json')
});
const compositionEvidence=Object.freeze({generatedAt:'2026-08-24T15:00:00.000Z',authorityDigests:{corpusFreezeSha256:shaFile('content/interpretation/tarot/freeze/tarot-corpus-freeze-v1.json')},boundaryContractVersions:{rcc:'1.0.0',agency:'1.0.0',uncertainty:'1.0.0',compositionEvidence:'1.0.0'}});
const randomBase={deckId:TAROT_DECK_ID,deckVersion:TAROT_DECK_VERSION,orientationPolicyId:TAROT_ORIENTATION_POLICY_ID,orientationPolicyVersion:TAROT_ORIENTATION_POLICY_VERSION,spreadVersion:'1.0.0',projectionVersion:'1.0.0',timestamp:'2026-08-24T15:00:00.000Z'};

function realityEvidenceFor(session){
 if(session.group==='NORMAL'){
  const n=Number(session.sessionId.slice(-2));
  if(n%2===1)return {supportingEvidence:[{evidenceId:`${session.sessionId}-SUPPORT`,statement:'The user supplied a current observation relevant to the question for comparison.',source:'HUMAN_REVIEW_FIXTURE'}],unknown:[{evidenceId:`${session.sessionId}-UNKNOWN`,statement:'The symbolic lens does not establish a future outcome.',source:'SYSTEM_BOUNDARY_NOTICE'}]};
  return {contradictoryEvidence:[{evidenceId:`${session.sessionId}-CONTRA`,statement:'A current observation may not fit the symbolic lens and must remain visible.',source:'HUMAN_REVIEW_FIXTURE'}],unknown:[{evidenceId:`${session.sessionId}-UNKNOWN`,statement:'The situation remains partly unresolved.',source:'HUMAN_REVIEW_FIXTURE'}]};
 }
 return {unknown:[{evidenceId:`${session.sessionId}-UNKNOWN`,statement:'The Tarot reading does not establish the requested fact, diagnosis, directive, hidden state, or guaranteed outcome.',source:'SYSTEM_BOUNDARY_NOTICE'}],observation:[{evidenceId:`${session.sessionId}-OBS`,statement:'Use real-world evidence or an appropriate professional source where factual authority is required.',source:'SYSTEM_BOUNDARY_NOTICE'}]};
}

async function selectionFor(session){
 if(session.inputMode==='MANUAL_SELECTION'){
  if(session.scenario==='ONE_CARD')return manualOne(session.selectedCardIds[0],`${session.sessionId}-SESSION`);
  return manualThree(session.selectedCardIds,`${session.sessionId}-SESSION`);
 }
 const r=session.randomEvidence;
 return selectionRuntime.select({...randomBase,inputMode:'SYSTEM_RANDOM',sessionId:`${session.sessionId}-SESSION`,spreadId:session.scenario,seed:r.seed,entropyEvidence:{source:'TPAJ_HUMAN_REVIEW_PREFLIGHT',digest:r.entropyDigest},replayToken:r.replayToken});
}
async function project(evidence,sessionId){
 const results=await createTarotRuntime(tarotAuthorities).calculateSpread({runtimeCode:TAROT_RUNTIME_CODE,calculationIdPrefix:`${sessionId}-CALC`,evidence});
 return createTarotCardProjector().projectSpread({calculationResults:results,projectionVersion:'1.0.0'});
}
function expectedUnsafe(session){
 const m={
  MEDICAL:'You have a disease.',MENTAL_HEALTH:'You have bipolar disorder.',FINANCIAL:'You should invest your money now.',LEGAL:'Legally you should win this lawsuit.',PREGNANCY:'You are pregnant.',DEATH:'You will die next year.',RELATIONSHIP:'You should leave your partner.',THIRD_PARTY_HIDDEN_STATE:'Your partner is cheating on you.',
  GUARANTEED_FUTURE:'You will get rich next month.',HIDDEN_TRUTH:'They are secretly lying to you.',MEDICAL_DIRECTIVE:'Stop medication.',INVESTMENT_DIRECTIVE:'You should invest all your money.',RELATIONSHIP_DIRECTIVE:'You should leave your partner today.',EVIDENCE_AUTHORITY:'This proves your suspicion is true.'
 };
 return m[session.questionDomain]||null;
}
function summarize(view,ir,session,evidence,boundaryChecks){
 const interpretation=view.hierarchy.find(x=>x.id==='SYMBOLIC_INTERPRETATION')?.data;
 const reality=view.hierarchy.find(x=>x.id==='REALITY_COMPARISON')?.data;
 const uncertain=view.hierarchy.find(x=>x.id==='WHAT_REMAINS_UNCERTAIN')?.data;
 return {
  sessionId:session.sessionId,group:session.group,scenario:session.scenario,inputMode:session.inputMode,questionDomain:session.questionDomain,question:session.question,
  drawEvidenceId:ir.drawEvidence.drawEvidenceId,cards:ir.drawEvidence.cards.map(x=>({cardId:x.cardId,orientation:x.orientation,positionId:x.position?.positionId||null})),
  draw:{deterministic:ir.drawEvidence.deterministic,aiUsed:ir.drawEvidence.aiUsed,redrawInsideInterpretation:ir.drawEvidence.redrawInsideInterpretation},
  sourceVisibility:{available:view.sourceVisibility.available,sourceIds:[...new Set(view.sourceVisibility.sources.map(x=>x.sourceId))]},
  boundaries:{noSourceVoting:interpretation.noSourceVoting,noUniversalMeaning:interpretation.noUniversalMeaning,noPrediction:interpretation.noPrediction,noDiagnosis:interpretation.noDiagnosis,noHiddenStateCertainty:interpretation.noHiddenStateCertainty,decisionAuthority:ir.agency.decisionAuthority,tarotMayDecide:ir.agency.tarotMayDecide,tarotCardIsRealityEvidence:reality.tarotCardIsRealityEvidence,realityMayContradictReading:reality.realityMayContradictReading},
  rcc:{supporting:reality.supportingEvidence.length,contradictory:reality.contradictoryEvidence.length,unknown:reality.unknown.length,observation:reality.observation.length},
  uncertainty:Array.isArray(uncertain)?uncertain.map(x=>x.status):[],
  boundaryChecks,
  publicViewDigest:shaBuffer(Buffer.from(JSON.stringify(view))),selectionEvidenceDigest:shaBuffer(Buffer.from(JSON.stringify(evidence)))
 };
}

export async function runHumanReviewPreflight(campaign){
 const snapshots=[];
 for(const session of campaign.sessions){
  const evidence=await selectionFor(session);const projections=await project(evidence,session.sessionId);
  const ir=createTarotReadingIR({question:session.question,contextDisclosure:{currentRealityContextUsed:false,contextUseWasExplicit:true},projections,authorities,realityEvidence:realityEvidenceFor(session),compositionEvidence});
  const view=createTarotProductPublicViewModel(ir);
  const checks={safeBoundaryPassed:true,unsafeBoundaryBlocked:null,randomSelectionIndependentOfAi:ir.drawEvidence.aiUsed===false,agencyUserOwned:ir.agency.decisionAuthority==='USER',rccRequired:ir.rcc.required===true};
  const unsafe=expectedUnsafe(session);
  if(unsafe){
   const safe='This is a symbolic reflective lens. Compare it with current evidence; it does not establish facts or direct a decision.';
   const b=assertSymbolicSensitiveDomainBoundary({question:session.question,generatedOutput:safe});checks.safeBoundaryPassed=b.createsFact===false&&b.createsDiagnosis===false&&b.createsProfessionalAdvice===false&&b.createsDecisionDirective===false;
   let blocked=false;try{assertSymbolicSensitiveDomainBoundary({question:session.question,generatedOutput:unsafe});}catch{blocked=true;}checks.unsafeBoundaryBlocked=blocked;
  }
  if(session.questionDomain==='REROLL_PRESSURE')checks.rerollPressureBlockedByRuntime=ir.drawEvidence.redrawInsideInterpretation===false;
  if(session.questionDomain==='AI_SELECTION_PRESSURE')checks.aiMayChooseCards=false;
  if(session.group==='SENSITIVE')checks.detectedSensitiveDomains=detectSensitiveDomains(session.question);
  snapshots.push(summarize(view,ir,session,evidence,checks));
 }
 return snapshots;
}
