const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};

function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}
function claimTypeFor(unit,envelope){
  const temporal=list(envelope.temporalClaims).some(item=>item.interpretationUnitRef===unit.interpretationUnitId);
  if(temporal)return 'TEMPORAL_ACTIVATION';
  if(unit.relationType==='SUPPORT'||unit.relationType==='REINFORCEMENT')return 'SUPPORT';
  if(unit.relationType==='TENSION'||unit.relationType==='FRICTION')return 'TENSION';
  if(unit.relationType==='DEPENDENCY')return 'CONDITION';
  if(unit.relationType==='OPEN')return 'OPEN';
  return 'CORE_PATTERN';
}
function semanticDimensionFor(unit,envelope){
  const subject=String(unit.subject||unit.semanticTags?.[1]||'UNSPECIFIED').replace(/[^A-Za-z0-9_-]+/g,'_').toUpperCase();
  return `METHOD_NATIVE:${envelope.methodId}:${subject}`;
}
function questionRelevance(customerIntent){
  if(!customerIntent)return freeze({state:'NOT_PROVIDED',intentId:null,reason:'No customer intent supplied to W2.'});
  const intentId=typeof customerIntent==='object'?(customerIntent.intentId||null):null;
  return freeze({state:'UNRESOLVED_PENDING_W3_PRIORITY',intentId,reason:'W2 preserves the accepted claim before customer-priority resolution.'});
}

export function buildCustomerClaimIR({acceptedMethodReadingEnvelope,customerIntent=null}={}){
  const envelope=acceptedMethodReadingEnvelope;
  if(envelope?.schemaVersion!=='PHI-OS-ACCEPTED-METHOD-READING-ENVELOPE-v1.0.0')fail('SMR_R2_ACCEPTED_METHOD_READING_ENVELOPE_REQUIRED');
  if(envelope?.boundary?.acceptedAuthorityOnly!==true||envelope?.boundary?.newMeaningCreated!==false)fail('SMR_R2_ACCEPTED_AUTHORITY_BOUNDARY_REQUIRED');
  const units=list(envelope.acceptedUnits);
  if(!units.length)fail('SMR_R2_ACCEPTED_UNITS_REQUIRED');

  return freeze({
    schemaVersion:'PHI-OS-CUSTOMER-READING-CLAIM-IR-COLLECTION-v1.0.0',
    methodId:envelope.methodId,
    readingAuthorityRef:envelope.readingAuthorityRef,
    semanticDigest:envelope.semanticDigest,
    claims:units.map(unit=>{
      if(!unit.interpretationUnitId||!unit.title||!(unit.summary||unit.plainLanguageExplanation||unit.body))fail('SMR_R2_ACCEPTED_UNIT_TEXT_REQUIRED',{interpretationUnitId:unit.interpretationUnitId});
      const evidenceRefs=uniq([...list(unit.projectionRefs),...list(unit.meaningRefs)]);
      if(!evidenceRefs.length)fail('SMR_R2_CLAIM_EVIDENCE_REQUIRED',{interpretationUnitId:unit.interpretationUnitId});
      const boundaries=uniq([...list(unit.boundaryRefs),unit.confidenceBoundary].filter(Boolean));
      return freeze({
        schemaVersion:'PHI-OS-CUSTOMER-READING-CLAIM-IR-v1.0.0',
        claimId:`SMR2-CLAIM-${envelope.methodId}-${unit.interpretationUnitId}`,
        methodId:envelope.methodId,
        semanticDimension:semanticDimensionFor(unit,envelope),
        claimType:claimTypeFor(unit,envelope),
        headline:unit.title,
        structuralMeaning:unit.summary||unit.plainLanguageExplanation||unit.body,
        findingRefs:uniq(envelope.findingRefs),
        interpretationUnitRefs:[unit.interpretationUnitId],
        evidenceRefs,
        counterEvidenceRefs:[],
        priorityClass:unit.priorityClass||'UNSPECIFIED',
        noveltyClass:'UNASSESSED',
        confidenceClass:boundaries.length?'ADMITTED_WITH_BOUNDARY':'ADMITTED_AUTHORITY',
        conditions:[],
        boundaries,
        questionRelevance:questionRelevance(customerIntent),
        sectionCandidates:[],
        lineage:{
          productionAdmissionRef:envelope.productionAdmissionRef,
          readingAuthorityRef:envelope.readingAuthorityRef,
          interpretationUnitRefs:[unit.interpretationUnitId],
          projectionRefs:uniq(unit.projectionRefs),
          meaningRefs:uniq(unit.meaningRefs),
          ruleRefs:uniq(unit.derivationRefs),
          boundaryRefs:uniq(unit.boundaryRefs),
          semanticDigest:envelope.semanticDigest
        }
      });
    }),
    boundary:{
      acceptedMethodAuthorityOnly:true,
      rawProjectionUsedAsConclusion:false,
      newMeaningCreated:false,
      rendererCreatedClaim:false,
      questionPriorityResolved:false,
      sectionPlacementResolved:false,
      confidenceIsPredictionAccuracy:false
    }
  });
}
