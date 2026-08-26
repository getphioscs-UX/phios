import {executeIChingProductRuntime} from './iching-product-runtime-v1.js';

const encoder=new TextEncoder();
const clone=value=>structuredClone(value);
const arr=value=>Array.isArray(value)?value:[];
const text=value=>String(value??'').normalize('NFKC').trim();

async function digest(value){
  const bytes=await globalThis.crypto.subtle.digest('SHA-256',encoder.encode(JSON.stringify(value)));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

function questionFor(session){
  return session.locale==='zh-Hans'?text(session.questionZhHans):text(session.questionEn);
}

export function buildIChingHumanReviewRequest(session={}){
  if(!text(session.sessionId)||!Array.isArray(session.lineValues)||session.lineValues.length!==6) throw new TypeError('ICHING_HUMAN_REVIEW_FIXED_SESSION_REQUIRED');
  return Object.freeze({
    method:'I_CHING',
    question:questionFor(session),
    inputMode:'MANUAL_LINES',
    lines:Object.freeze(session.lineValues.map(Number)),
    sessionId:session.sessionId,
    timestamp:'2026-08-25T00:00:00.000Z',
    projectionVersion:'1.0.0',
    contextDisclosure:clone(session.contextDisclosure||{currentRealityContextUsed:false,contextUseWasExplicit:true}),
    realityEvidence:clone(session.realityEvidence||{})
  });
}

function sourceSummary(readingIr){
  return arr(readingIr?.sourceInterpretation?.commentaryCandidates).map(item=>Object.freeze({
    claimId:item.claimId,
    hexagramId:item.hexagramId,
    hexagramRole:item.hexagramRole,
    scope:item.scope,
    linePosition:item.linePosition||null,
    selectedBecauseChanging:item.selectedBecauseChanging===true,
    sourceId:item.sourceId,
    perspectiveId:item.perspectiveId,
    sourceLocator:item.provenance?.sourceLocator||null
  }));
}

function counts(readingIr){
  const rcc=readingIr.rcc;
  return Object.freeze({
    supporting:rcc.supportingEvidence.length,
    contradictory:rcc.contradictoryEvidence.length,
    unknown:rcc.unknown.length,
    observation:rcc.observation.length
  });
}

export async function executeIChingHumanReviewSession(session={},authorities={}){
  const request=buildIChingHumanReviewRequest(session);
  const result=await executeIChingProductRuntime(request,authorities);
  const readingIr=result.readingIr;
  const projection=readingIr.structuralProjection;
  const claims=sourceSummary(readingIr);
  const sourceIds=[...new Set(claims.map(x=>x.sourceId))].sort();
  const requestDigest=await digest(request);
  const publicViewDigest=await digest(result.publicView);
  const snapshot=Object.freeze({
    sessionId:session.sessionId,
    group:session.group,
    scenario:session.scenario,
    questionDomain:session.questionDomain,
    locale:session.locale,
    accountMode:session.accountMode,
    question:request.question,
    lineValues:Object.freeze([...request.lines]),
    actualProjection:Object.freeze({
      primaryHexagramId:projection.primary.hexagramId,
      changingLines:Object.freeze([...projection.changingLines]),
      relatingHexagramId:projection.relating.hexagramId
    }),
    expectedProjection:Object.freeze({
      primaryHexagramId:session.expected.primaryHexagramId,
      changingLines:Object.freeze([...session.expected.changingLines]),
      relatingHexagramId:session.expected.relatingHexagramId
    }),
    sourceCoverage:Object.freeze({
      primary:readingIr.sourceInterpretation.coverage.primary,
      relating:readingIr.sourceInterpretation.coverage.relating,
      partialCorpus:readingIr.sourceInterpretation.coverage.partialCorpus
    }),
    sourceIds:Object.freeze(sourceIds),
    sourceClaims:Object.freeze(claims),
    rcc:counts(readingIr),
    uncertainty:Object.freeze(readingIr.uncertainty.states.map(x=>x.status)),
    contextDisclosure:clone(readingIr.contextDisclosure),
    boundaries:Object.freeze({
      aiSelected:readingIr.methodEvidence.aiSelected,
      rerolledInsideCalculation:readingIr.methodEvidence.rerolledInsideCalculation,
      noSourceVoting:readingIr.sourceInterpretation.noSourceVoting,
      noUniversalMeaning:readingIr.sourceInterpretation.noUniversalMeaning,
      noPrediction:readingIr.sourceInterpretation.noPrediction,
      noDiagnosis:readingIr.sourceInterpretation.noDiagnosis,
      noHiddenStateCertainty:readingIr.sourceInterpretation.noHiddenStateCertainty,
      decisionAuthority:readingIr.agency.decisionAuthority,
      ichingMayDecide:readingIr.agency.ichingMayDecide,
      realityMayContradictReading:readingIr.rcc.rules.realityMayContradictReading,
      sourceGapMayBeFilledByModel:readingIr.authority.sourceGapMayBeFilledByModel,
      automaticPersistence:result.execution.automaticPersistence,
      providerUsed:result.execution.providerUsed,
      publicRunAllowed:result.publicView.production.runAllowed,
      productionCapabilityPromoted:result.publicView.production.productionCapabilityPromoted,
      complexHandoffVisible:result.publicView.complexCaseHandoff?.show===true
    }),
    requestDigest,
    publicViewDigest
  });
  const machineEvidenceDigest=await digest(snapshot);
  return Object.freeze({snapshot:Object.freeze({...snapshot,machineEvidenceDigest}),result});
}

export async function runIChingHumanReviewPreflight(campaign={},authorities={}){
  const snapshots=[];
  for(const session of arr(campaign.sessions)) snapshots.push((await executeIChingHumanReviewSession(session,authorities)).snapshot);
  return Object.freeze(snapshots);
}

