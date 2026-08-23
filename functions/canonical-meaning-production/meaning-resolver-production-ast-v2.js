import { sha256Canonical } from './meaning-resolver-production.js';
const PROJECTION_SCHEMA='PHI-OS-CANONICAL-METHOD-PROJECTION-v2.0.0';
function fail(code,detail=''){const e=new Error(detail?`${code}: ${detail}`:code);e.code=code;throw e;}
function getPath(value,path){return String(path||'').split('.').filter(Boolean).reduce((c,k)=>c?.[k],value);}
function norm(v){const n=Number(v);if(!Number.isFinite(n))return null;return ((n%360)+360)%360;}
function matchSelector(projection,s){
 const value=getPath(projection,s?.path);
 if(s?.operator==='position_code_match') return Array.isArray(value)&&value.some(x=>x?.code===s.code);
 if(s?.operator==='position_longitude_segment') return Array.isArray(value)&&value.some(x=>{const n=norm(x?.value);return n!==null&&n>=s.minInclusive&&n<s.maxExclusive});
 if(s?.operator==='structure_item_code_match') return Array.isArray(value)&&value.some(g=>g?.code===s.groupCode&&Array.isArray(g.items)&&g.items.some(x=>x?.code===s.itemCode));
 if(s?.operator==='structure_item_meta_match') return Array.isArray(value)&&value.some(g=>g?.code===s.groupCode&&Array.isArray(g.items)&&g.items.some(x=>x?.meta?.[s.metaKey]===s.metaValue));
 fail('CMP_AST_SELECTOR_OPERATOR_UNSUPPORTED',s?.operator||'missing');
}
export function assertAstV2ProjectionBoundary(p){
 if(!p||p.schemaVersion!==PROJECTION_SCHEMA)fail('CMP_AST_V2_PROJECTION_SCHEMA_REQUIRED');
 if(p.method?.publicMethodCode!=='ASTROLOGY_PROJECTION')fail('CMP_AST_V2_METHOD_REQUIRED');
 if(p.projection?.productionResult!==true||p.projection?.clientRenderable!==true)fail('CMP_AST_V2_PRODUCTION_PROJECTION_REQUIRED');
 if(p.execution?.mpaDecision?.authorityOwner!=='MPA'||p.execution?.mpaDecision?.dispatchAllowed!==true)fail('CMP_AST_V2_MPA_AUTHORITY_REQUIRED');
 if(p.interpretation?.included!==false||p.interpretation?.meaningAuthorityCreated!==false||p.interpretation?.professionalJudgmentCreated!==false)fail('CMP_AST_V2_UPSTREAM_MEANING_BOUNDARY_INVALID');
 if(!p.projectionId)fail('CMP_AST_V2_PROJECTION_ID_REQUIRED'); return p;
}
export async function resolveAstV2MeaningItems({projection,admissionRegistry,mappingRegistry,activationRegistry,mode='production'}={}){
 assertAstV2ProjectionBoundary(projection);
 if(mode!=='production')fail('CMP_AST_V2_PRODUCTION_MODE_REQUIRED');
 const active=(activationRegistry?.methods||[]).find(x=>x.pluginCode==='AST'); if(!activationRegistry?.runtimeOperational||!active?.productionActivated||!active?.acceptancePassed)fail('CMP_METHOD_PRODUCTION_NOT_ACTIVATED','ASTROLOGY');
 const admissions=new Map((admissionRegistry?.admissions||[]).map(x=>[x.meaningCode,x]));
 const candidates=(mappingRegistry?.mappings||[]).filter(x=>x.sourcePluginCode==='AST'&&x.sourceProjectionSchemaVersion===PROJECTION_SCHEMA&&x.productionEligible===true&&x.productionActivated===true&&matchSelector(projection,x.selector)).sort((a,b)=>a.mappingCode.localeCompare(b.mappingCode));
 const projectionDigest=await sha256Canonical(projection); const items=[];
 for(const m of candidates){const a=admissions.get(m.targetMeaningCode);if(!a?.productionAdmitted)fail('CMP_MEANING_NOT_ADMITTED',m.targetMeaningCode);if(!a.knowledgeAuthority?.primaryNodeCodes?.length)fail('CMP_KNOWLEDGE_AUTHORITY_MISSING',m.targetMeaningCode);items.push(Object.freeze({meaningId:a.meaningId,meaningCode:a.meaningCode,meaningVersion:a.meaningVersion,meaningType:m.meaningType,canonicalTextKey:a.canonicalTextKey,sourceProjectionRef:Object.freeze({projectionId:projection.projectionId,projectionSchemaVersion:projection.schemaVersion,publicMethodCode:'ASTROLOGY_PROJECTION',projectionDigest,selector:structuredClone(m.selector)}),sourceFields:Object.freeze([...(m.sourceFields||[])]),mappingLineage:Object.freeze({mappingCode:m.mappingCode,mappingVersion:m.mappingVersion,mappingAuthority:m.mappingAuthority,predecessor:structuredClone(m.predecessorLineage)}),knowledgeAuthority:Object.freeze({primaryNodeCodes:Object.freeze([...(a.knowledgeAuthority.primaryNodeCodes||[])]),supportingNodeCodes:Object.freeze([...(a.knowledgeAuthority.supportingNodeCodes||[])])}),evidence:Object.freeze({meaningCanonicalDigest:a.meaningCanonicalDigest,semanticHash:a.semanticHash,knowledgeHash:a.knowledgeHash}),status:'PRODUCTION'}));}
 return Object.freeze({methodCode:'ASTROLOGY',publicMethodCode:'ASTROLOGY_PROJECTION',projectionDigest,items:Object.freeze(items),unmatched:items.length===0});
}
