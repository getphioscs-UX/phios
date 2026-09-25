import {
  stableDigest,
  buildReadoutInput,
  extractObservableRuntime,
  buildRuntimeSignature,
  buildPatternRuntime
} from '../reality-readout-engine/rre-readout-foundation-v1.mjs';
import {
  buildConstraintReading,
  buildLoadReading,
  buildStabilityReading,
  buildDriftReading,
  buildRecoveryReading,
  buildUnknownResolutionLimit
} from '../reality-readout-engine/rre-readout-reading-v1.mjs';
import {
  buildConfidenceRuntime,
  buildReadoutLineage,
  buildCanonicalRuntimeReadout,
  buildCprReadoutProjection
} from '../reality-readout-engine/rre-canonical-readout-v1.mjs';

const uniq=values=>[...new Set((values||[]).filter(Boolean))].sort();
const token=value=>String(value||'').toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'UNKNOWN';
const isoAt=(date,seconds=0)=>{
  const value=/^\d{4}-\d{2}-\d{2}$/.test(String(date||''))?String(date):'2026-09-24';
  return new Date(`${value}T00:00:${String(seconds).padStart(2,'0')}.000Z`).toISOString();
};

export function buildBook6DossierRreProjection({dossier,cases=[],registries}={}){
  if(!dossier?.id)throw new Error('B6_RRE_DOSSIER_REQUIRED');
  if(!registries)throw new Error('B6_RRE_REGISTRIES_REQUIRED');

  const relatedCases=(cases||[]).filter(row=>(row.relatedDossiers||[]).includes(dossier.id));
  const knowledgeReferences=uniq(relatedCases.map(row=>row.id));
  const meaningReferences=uniq(relatedCases.flatMap(row=>row.relatedBookSections||[]));
  const observedAt=isoAt(dossier.lastReviewedAt||dossier.updatedAt||dossier.createdAt,0);
  const assessmentTime=isoAt(dossier.lastReviewedAt||dossier.updatedAt||dossier.createdAt,1);
  const suffix=token(dossier.id.replace(/^DOSSIER-/,''))+'-'+token(dossier.version||'V1');
  const realityDigest=stableDigest({
    dossierId:dossier.id,
    version:dossier.version,
    status:dossier.status,
    dataClass:dossier.dataClass,
    asOfDate:dossier.asOfDate,
    sourceDate:dossier.sourceDate,
    sourceFreshness:dossier.sourceFreshness,
    lastReviewedAt:dossier.lastReviewedAt
  });
  const realityReference={
    code:`B6-RUNTIME-${token(dossier.id)}`,
    version:String(dossier.version||'1.0.0'),
    digest:realityDigest
  };
  const input=buildReadoutInput({
    inputCode:`RRE-INPUT-B6-${suffix}`,
    realityReference,
    observationReferences:[],
    evidenceReferences:[],
    methodProjectionReferences:[],
    meaningReferences,
    knowledgeReferences,
    previousRealityReference:null,
    timeReference:{observedAt,timezone:'UTC'},
    dataQuality:'UNKNOWN',
    governanceReferences:[
      'PHI-OS-BOOK-VI-CURRENT-DATA-CONTRACT',
      'PHI-OS-RDG-RRE-READOUT-DATA-CONTRACT-SUCCESSOR-v1'
    ]
  },registries.inputContract);

  const observable=extractObservableRuntime(input,{realityReference,observables:[]},registries.dimensionRegistry);
  const signature=buildRuntimeSignature(observable,{
    signatureCode:`RRE-SIGNATURE-B6-${suffix}`,
    fragments:[]
  },registries.signatureRegistry);
  const patterns=buildPatternRuntime(observable,{
    patternRuntimeCode:`RRE-PATTERN-B6-${suffix}`,
    patterns:[]
  },registries.patternRegistry);
  const constraints=buildConstraintReading(observable,{
    readingCode:`RRE-CONSTRAINT-B6-${suffix}`,
    constraints:[]
  },registries.constraintRegistry,registries.rmoConstraintRegistry);
  const unknownFacet=()=>({state:'UNKNOWN',observableReferences:[],patternReferences:[]});
  const load=buildLoadReading(observable,patterns,{
    loadReadingCode:`RRE-LOAD-B6-${suffix}`,
    currentLoad:unknownFacet(),
    concentration:unknownFacet(),
    transfer:unknownFacet(),
    accumulation:unknownFacet(),
    sources:[]
  },registries.loadRegistry);
  const stability=buildStabilityReading(observable,signature,patterns,{
    stabilityReadingCode:`RRE-STABILITY-B6-${suffix}`,
    stabilityState:'UNKNOWN',
    descriptorCode:'CURRENT_DATA_NOT_ADMITTED',
    observableReferences:[],
    signatureReferences:[],
    patternReferences:[]
  },registries.stabilityRegistry);
  const drift=buildDriftReading(input,null,{
    driftReadingCode:`RRE-DRIFT-B6-${suffix}`,
    priorDiffReferences:[]
  },registries.driftRegistry);
  const recoveryFacet=()=>({state:'UNKNOWN',observableReferences:[],patternReferences:[],constraintReferences:[]});
  const recovery=buildRecoveryReading(observable,patterns,constraints,{
    recoveryReadingCode:`RRE-RECOVERY-B6-${suffix}`,
    availableRecoveryCapacity:recoveryFacet(),
    recentRecoverySignal:recoveryFacet(),
    recoveryConstraints:[],
    recoveryWindow:recoveryFacet(),
    uncertainty:recoveryFacet()
  },registries.recoveryRegistry);
  const unknownResolution=buildUnknownResolutionLimit(input,{unknowns:[]},registries.rmoUnknownRegistry,{
    unknownReadingCode:`RRE-UNKNOWN-B6-${suffix}`
  },registries.resolutionRegistry);
  const confidence=buildConfidenceRuntime(input,unknownResolution,{
    confidenceCode:`RRE-CONFIDENCE-B6-${suffix}`,
    assessmentTime
  },registries.confidenceRegistry);
  const components={observationSummary:observable,runtimeSignature:signature,patterns,constraints,load,stability,drift,recovery,unknownResolution,confidence};
  const lineage=buildReadoutLineage(input,components,{
    lineageCode:`RRE-LINEAGE-B6-${suffix}`,
    priorReadoutReferences:[]
  });
  const readout=buildCanonicalRuntimeReadout(input,components,confidence,lineage,{
    readoutCode:`RRE-READOUT-B6-${suffix}`,
    readoutVersion:String(dossier.version||'1.0.0'),
    authorityReference:'content/runtime/reality-readout-engine/contracts/canonical-runtime-readout-contract-v1.json',
    persistenceDecision:'DENY'
  },registries.successorRegistry);
  const cprProjection=buildCprReadoutProjection(readout,{
    projectionCode:`RRE-CPR-PROJECTION-B6-${suffix}`,
    projectionVersion:'1.0.0',
    targetCodes:['WPR']
  },registries.targetRegistry,registries.cprSurfaceRegistry);

  return {
    schemaVersion:'PHI-OS-BOOK-VI-RRE-CPR-ADAPTER-v1.0.0',
    dossierId:dossier.id,
    entity:dossier.entity,
    dataClass:'DERIVED_RUNTIME_READOUT',
    currentDataAdmitted:dossier.dataClass==='CURRENT_DATA'&&Boolean(dossier.asOfDate||dossier.sourceDate),
    readoutState:'EVIDENCE_GATE_OPEN',
    confidenceClass:readout.confidence.confidenceClass,
    observedAt,
    sourceFreshness:dossier.sourceFreshness,
    historicalKnowledgeReferences:knowledgeReferences,
    meaningReferences,
    resolutionLimitKinds:uniq(readout.resolutionLimits.map(row=>row.limitKind)),
    missingLineageDimensions:uniq(readout.lineage.conclusionFragments.flatMap(row=>row.missingLineageDimensions||[])),
    readoutReference:{code:readout.readoutCode,version:readout.readoutVersion,digest:readout.readoutDigest},
    cprHandoff:{
      sourceReadoutReference:cprProjection.sourceReadoutReference,
      target:cprProjection.targets[0],
      cprPresentationCreated:cprProjection.cprPresentationCreated,
      surfaceActivatedByRre:cprProjection.surfaceActivated
    },
    boundaries:{
      currentFactsInvented:false,
      missingEvidenceFilledByInference:false,
      rankingCreated:false,
      diagnosisCreated:readout.diagnosisCreated,
      professionalJudgmentCreated:readout.professionalJudgmentCreated,
      navigationDecisionCreated:readout.navigationDecisionCreated,
      metricCreated:readout.metricCreated
    }
  };
}
