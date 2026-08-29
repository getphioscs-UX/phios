export const CROSS_PERSPECTIVE_INPUT_IR_SCHEMA='PHI-OS-CROSS-PERSPECTIVE-INPUT-IR-v1.0.0';
const ENVELOPE_SCHEMA='PHI-OS-ACCEPTED-METHOD-READING-ENVELOPE-v1.0.0';
const CLAIM_COLLECTION_SCHEMA='PHI-OS-CUSTOMER-READING-CLAIM-IR-COLLECTION-v1.0.0';
const CLAIM_SCHEMA='PHI-OS-CUSTOMER-READING-CLAIM-IR-v1.0.0';
const XPF_SCHEMA='PHI-OS-CONFIRMED-EXTERNAL-PROFILE-v1.0.0';
const HDR_SCHEMA='PHI-OS-INTERNAL-OPERATING-READING-IR-v1.0.0';
const METHODS=new Set(['AST','BZR','ZWR','NUM','ECR']);
const ALLOWED_INPUT_KEYS=new Set(['acceptedMethodReadingEnvelopes','claimCollections','confirmedXpf','hdrInternalReading']);
const FORBIDDEN_SCHEMA_PREFIXES=[
 'PHI-OS-SINGLE-METHOD-READING-PRODUCTION-',
 'PHI-OS-CUSTOMER-READING-NARRATIVE-IR-',
 'PHI-OS-CUSTOMER-READING-IA-',
 'PHI-OS-SMR-R2-LAYOUT-',
 'PHI-OS-SMR-LAYOUT-'
];
const FORBIDDEN_KEYS=new Set(['singleMethodReading','narrativeIR','readingIA','layout','renderedHtml','smrProse','executiveReading','whyThisReading']);
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const uniq=values=>[...new Set((Array.isArray(values)?values:[]).filter(Boolean))];
function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}
function stable(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return `[${value.map(stable).join(',')}]`;return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`}
async function sha256(value){const bytes=new TextEncoder().encode(typeof value==='string'?value:stable(value));const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')}

export function assertNoSmrProseBackfeed(value,path='$'){
 if(!value||typeof value!=='object')return true;
 if(typeof value.schemaVersion==='string'&&FORBIDDEN_SCHEMA_PREFIXES.some(prefix=>value.schemaVersion.startsWith(prefix)))fail('CROSS_SMR_PROSE_SCHEMA_FORBIDDEN',{path,schemaVersion:value.schemaVersion});
 for(const [key,child] of Object.entries(value)){
  if(FORBIDDEN_KEYS.has(key))fail('CROSS_SMR_PROSE_FIELD_FORBIDDEN',{path:`${path}.${key}`});
  assertNoSmrProseBackfeed(child,`${path}.${key}`);
 }
 return true;
}

function admittedUnitText(unit){return unit?.summary||unit?.plainLanguageExplanation||unit?.body||null}
function normalizeClaim(claim,envelope){
 if(claim?.schemaVersion!==CLAIM_SCHEMA)fail('CROSS_CUSTOMER_PUBLISHABLE_CLAIM_SCHEMA_REQUIRED');
 if(claim.methodId!==envelope.methodId)fail('CROSS_CLAIM_METHOD_MISMATCH',{claimId:claim.claimId});
 const unitRefs=uniq(claim.interpretationUnitRefs);
 if(!unitRefs.length||unitRefs.some(ref=>!envelope.interpretationUnitRefs.includes(ref)))fail('CROSS_CLAIM_ENVELOPE_LINEAGE_REQUIRED',{claimId:claim.claimId});
 const units=unitRefs.map(ref=>envelope.acceptedUnits.find(unit=>unit.interpretationUnitId===ref)).filter(Boolean);
 if(units.length!==unitRefs.length)fail('CROSS_CLAIM_ACCEPTED_UNIT_REQUIRED',{claimId:claim.claimId});
 if(!units.some(unit=>unit.title===claim.headline&&admittedUnitText(unit)===claim.structuralMeaning))fail('CROSS_CLAIM_TEXT_MUST_MATCH_ACCEPTED_UNIT',{claimId:claim.claimId});
 const evidenceRefs=uniq(claim.evidenceRefs);if(!evidenceRefs.length)fail('CROSS_CLAIM_EVIDENCE_REQUIRED',{claimId:claim.claimId});
 return freeze({
  claimId:claim.claimId,methodId:claim.methodId,publicationState:'CUSTOMER_PUBLISHABLE',semanticDimension:claim.semanticDimension,claimType:claim.claimType,
  headline:claim.headline,structuralMeaning:claim.structuralMeaning,evidenceRefs,counterEvidenceRefs:uniq(claim.counterEvidenceRefs),
  conditionKinds:uniq((Array.isArray(claim.conditions)?claim.conditions:[]).map(item=>typeof item==='string'?item:item?.kind)),
  boundaryRefs:uniq(claim.boundaries),interpretationUnitRefs:unitRefs
 });
}
function normalizeMethodInput(envelope,claimCollection){
 if(envelope?.schemaVersion!==ENVELOPE_SCHEMA)fail('CROSS_ACCEPTED_METHOD_READING_ENVELOPE_REQUIRED');
 if(!METHODS.has(envelope.methodId))fail('CROSS_PUBLIC_METHOD_NOT_ALLOWED',{methodId:envelope?.methodId});
 if(envelope.boundary?.acceptedAuthorityOnly!==true||envelope.boundary?.newMeaningCreated!==false)fail('CROSS_ACCEPTED_METHOD_BOUNDARY_REQUIRED',{methodId:envelope.methodId});
 if(!envelope.productionAdmissionRef||!envelope.readingAuthorityRef||!envelope.semanticDigest)fail('CROSS_METHOD_PRODUCTION_LINEAGE_REQUIRED',{methodId:envelope.methodId});
 if(claimCollection?.schemaVersion!==CLAIM_COLLECTION_SCHEMA||claimCollection.methodId!==envelope.methodId)fail('CROSS_CLAIM_COLLECTION_REQUIRED',{methodId:envelope.methodId});
 if(claimCollection.readingAuthorityRef!==envelope.readingAuthorityRef||claimCollection.semanticDigest!==envelope.semanticDigest)fail('CROSS_CLAIM_COLLECTION_LINEAGE_MISMATCH',{methodId:envelope.methodId});
 const claims=(Array.isArray(claimCollection.claims)?claimCollection.claims:[]).map(claim=>normalizeClaim(claim,envelope));
 if(!claims.length)fail('CROSS_CUSTOMER_PUBLISHABLE_CLAIMS_REQUIRED',{methodId:envelope.methodId});
 return freeze({methodId:envelope.methodId,publicationState:'CUSTOMER_PUBLISHABLE',readingAuthorityRef:envelope.readingAuthorityRef,productionAdmissionRef:envelope.productionAdmissionRef,semanticDigest:envelope.semanticDigest,claimRefs:claims.map(c=>c.claimId),claims});
}
function normalizeXpf(profile){
 if(profile==null)return null;
 if(profile.schemaVersion!==XPF_SCHEMA||profile.methodId!=='XPF'||profile.authorityClass!=='CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT')fail('CROSS_XPF_CONFIRMED_PROFILE_REQUIRED');
 if(profile.provenance?.customerConfirmed!==true||profile.provenance?.phiosCalculated!==false||profile.boundary?.calculatedMethodConsensusEligible!==false)fail('CROSS_XPF_CONFIRMATION_BOUNDARY_REQUIRED');
 if(!profile.profileDigest||!profile.intakeId)fail('CROSS_XPF_LINEAGE_REQUIRED');
 const records=(Array.isArray(profile.records)?profile.records:[]).filter(record=>record?.customerConfirmed===true&&record?.field&&record?.value!=null).map(record=>freeze({ref:`XPF:${profile.intakeId}:${record.field}`,field:record.field,value:record.value,sourceType:record.sourceType||'CUSTOMER_CONFIRMED'}));
 if(!records.length)fail('CROSS_XPF_CONFIRMED_RECORD_REQUIRED');
 return freeze({methodId:'XPF',authorityClass:'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT',profileDigest:profile.profileDigest,intakeId:profile.intakeId,contextRecords:records,countsTowardMethodAgreement:false});
}
function normalizeHdr(reading){
 if(reading==null)return null;
 if(reading.schemaVersion!==HDR_SCHEMA||reading.visibility!=='INTERNAL_ONLY'||!reading.readingDigest)fail('CROSS_HDR_INTERNAL_READING_REQUIRED');
 if(reading.boundaries?.publicResultCreated!==false||reading.boundaries?.methodVotingCreated!==false)fail('CROSS_HDR_INTERNAL_BOUNDARY_REQUIRED');
 return freeze({schemaVersion:HDR_SCHEMA,visibility:'INTERNAL_ONLY',readingDigest:reading.readingDigest,contextRef:`HDR:${reading.readingDigest}`,countsTowardMethodAgreement:false,publicLeakAllowed:false});
}

export async function buildCrossPerspectiveInputIR(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))fail('CROSS_INPUT_OBJECT_REQUIRED');
 for(const key of Object.keys(input))if(!ALLOWED_INPUT_KEYS.has(key))fail('CROSS_INPUT_FIELD_NOT_ALLOWED',{key});
 assertNoSmrProseBackfeed(input);
 const envelopes=Array.isArray(input.acceptedMethodReadingEnvelopes)?input.acceptedMethodReadingEnvelopes:[];
 const claimCollections=Array.isArray(input.claimCollections)?input.claimCollections:[];
 if(envelopes.length<2||envelopes.length>5||claimCollections.length!==envelopes.length)fail('CROSS_REQUIRES_TWO_TO_FIVE_ACCEPTED_METHODS');
 const claimByMethod=new Map(claimCollections.map(collection=>[collection?.methodId,collection]));
 const methodInputs=envelopes.map(envelope=>normalizeMethodInput(envelope,claimByMethod.get(envelope?.methodId)));
 const methodIds=methodInputs.map(item=>item.methodId);if(new Set(methodIds).size!==methodIds.length)fail('CROSS_DUPLICATE_PUBLIC_METHOD');
 methodInputs.sort((a,b)=>a.methodId.localeCompare(b.methodId));
 const xpfContext=normalizeXpf(input.confirmedXpf??null),hdrInternalContext=normalizeHdr(input.hdrInternalReading??null);
 const sourceDigests=uniq([...methodInputs.map(item=>item.semanticDigest),xpfContext?.profileDigest,hdrInternalContext?.readingDigest]);
 const seed={schemaVersion:CROSS_PERSPECTIVE_INPUT_IR_SCHEMA,methodInputs,xpfContext,hdrInternalContext,sourceDigests,boundaries:{smrProseConsumed:false,rawProjectionConsumedAsCrossConclusion:false,rawSymbolMappedDirectly:false,allPublicMethodClaimsCustomerPublishable:true,xpfCountsTowardAgreement:false,hdrCountsTowardAgreement:false,hdrPublicLeakAllowed:false,currentRealityInputActivated:false,methodVotingAllowed:false}};
 const inputDigest=await sha256(seed);
 return freeze({...seed,inputDigest});
}
export default Object.freeze({assertNoSmrProseBackfeed,buildCrossPerspectiveInputIR});
