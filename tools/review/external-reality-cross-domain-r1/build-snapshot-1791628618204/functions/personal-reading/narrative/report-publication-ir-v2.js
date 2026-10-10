import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';

export const REPORT_PUBLICATION_IR_V2='PHI-OS-PUBLICATION-IR-V2-v1.0.0';
const ALLOWED_OPERATORS=new Set(['ASSOCIATED_WITH','CO_OCCURS_WITH','MODIFIES','CONTEXTUALIZES','SUPPORTS','CONSTRAINS','TIMING_RELEVANCE','OPEN','QUESTION','CANDIDATE','ESTABLISHED','OBSERVED','CUSTOMER_SUPPLIED','CAUSES','PRECEDES','DEVELOPS_INTO','MANIFESTS_AS']);
const DEFAULT_FORBIDDEN=new Set(['CAUSES','PRECEDES','DEVELOPS_INTO','MANIFESTS_AS']);
function arr(v){return Array.isArray(v)?v:[];} function text(v){return String(v??'').trim();}
function fail(code,details={}){const e=new Error(code);e.code=code;e.details=details;throw e;}

export async function buildReportPublicationIrV2({methodId,reportVersion,sectionKey,locale,brief,candidate,semanticOwner,compositionOwner,snapshotLineage={}}={}){
 if(!text(methodId)||!text(reportVersion)||!text(sectionKey)||!['en','zh-Hans'].includes(locale))fail('RNT2_PUBLICATION_IR_IDENTITY_REQUIRED');
 if(brief?.sectionKey!==sectionKey||brief?.methodId!==methodId)fail('RNT2_PUBLICATION_IR_BRIEF_IDENTITY_MISMATCH');
 const claims=new Map(arr(brief.claims).map(c=>[c.claimId,c]));
 const blocks=[];
 for(const [index,b] of arr(candidate?.blocks).entries()){
  const claimRefs=arr(b.claimRefs).map(String);if(!claimRefs.length)fail('RNT2_PUBLICATION_IR_CLAIM_REFS_REQUIRED',{index});
  const sourceClaims=claimRefs.map(id=>claims.get(id));if(sourceClaims.some(x=>!x))fail('RNT2_PUBLICATION_IR_UNKNOWN_CLAIM',{index});
  const operators=[...new Set(sourceClaims.flatMap(c=>arr(c.semanticOperators)))];
  for(const op of operators)if(!ALLOWED_OPERATORS.has(op))fail('RNT2_PUBLICATION_IR_OPERATOR_INVALID',{op});
  for(const op of operators)if(DEFAULT_FORBIDDEN.has(op)&&!sourceClaims.some(c=>c?.license?.allowedSemanticOperators?.includes?.(op)))fail('RNT2_PUBLICATION_IR_OPERATOR_UNLICENSED',{op,index});
  const sourceRefs=[...new Set(sourceClaims.flatMap(c=>arr(c.sourceRefs)).map(String))];
  blocks.push({
   irVersion:REPORT_PUBLICATION_IR_V2,method:methodId,reportVersion,sectionId:sectionKey,
   blockId:`${sectionKey}:B${index+1}`,blockType:text(b.role),
   semanticOwner:text(semanticOwner)||brief.sourceAuthorityVersion||'METHOD_AUTHORITY',
   compositionOwner:text(compositionOwner)||'REPORT_NARRATIVE_T2_R1',
   sourceRefs,claimRefs,semanticOperators:operators,
   rank:null,direction:null,
   conditions:[...new Set(sourceClaims.flatMap(c=>arr(c.conditions)))],
   counterSignals:[...new Set(sourceClaims.flatMap(c=>arr(c.counterweights).map(x=>typeof x==='string'?x:JSON.stringify(x))))],
   openConditions:[...new Set(sourceClaims.flatMap(c=>String(c.certainty||'').toUpperCase()==='UNRESOLVED'?[c.claimId]:[]))],
   timing:sourceClaims.flatMap(c=>arr(c.timing)),
   boundaries:sourceClaims.filter(c=>c.claimType==='BOUNDARY').map(c=>c.text),
   technicalTerms:[],
   observableSignals:sourceClaims.flatMap(c=>arr(c.observableSignals)),
   locale,
   publicationMay:['PRESENT_VERIFIED_MEANING','LAYOUT','PAGINATE','LOCALIZE_WITH_PARITY'],
   publicationMayNot:['RECALCULATE_METHOD','CREATE_CLAIM','STRENGTHEN_CERTAINTY','INVENT_REALITY','ALTER_SEMANTIC_OPERATOR'],
   prose:text(b.text),
   provenance:{sourceBriefDigest:brief.briefSemanticDigest,sourceSemanticDigest:brief.sourceSemanticDigest},
   snapshotLineage
  });
 }
 const seed={schemaVersion:REPORT_PUBLICATION_IR_V2,methodId,reportVersion,sectionKey,locale,blocks};
 const publicationIrDigest=await sha256Stable(seed);
 return deepFreeze({...seed,publicationIrDigest});
}

export function assertPublicationIrV2Preservation({publicationIr,brief}={}){
 if(publicationIr?.schemaVersion!==REPORT_PUBLICATION_IR_V2)fail('RNT2_PUBLICATION_IR_V2_REQUIRED');
 const source=new Map(arr(brief?.claims).map(c=>[c.claimId,c])),reasons=[];
 for(const b of arr(publicationIr.blocks)){
  for(const ref of arr(b.claimRefs))if(!source.has(ref))reasons.push('SOURCE_LINEAGE_LOSS:'+ref);
  const expected=[...new Set(arr(b.claimRefs).flatMap(ref=>arr(source.get(ref)?.semanticOperators)))];
  if(JSON.stringify([...expected].sort())!==JSON.stringify([...arr(b.semanticOperators)].sort()))reasons.push('SEMANTIC_OPERATOR_DRIFT:'+b.blockId);
  const certaintyClaims=arr(b.claimRefs).map(ref=>source.get(ref)).filter(Boolean);
  if(certaintyClaims.some(c=>String(c.certainty||'').toUpperCase()==='UNRESOLVED')&&!arr(b.openConditions).length)reasons.push('OPEN_TO_CLOSED:'+b.blockId);
 }
 return deepFreeze({accepted:reasons.length===0,reasons});
}
export default Object.freeze({buildReportPublicationIrV2,assertPublicationIrV2Preservation});
