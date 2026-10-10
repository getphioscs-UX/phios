import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {selectPaiRoute} from '../../functions/_lib/pai-r1-economics.js';
export const extractionClasses=Object.freeze({IDENTITY_MAPPING:'T0_DETERMINISTIC',OBJECT_ASSEMBLY:'T1_CANONICAL_ASSEMBLY',SHORT_SUMMARY:'T2_LIGHT_COMPOSITION',RELATIONSHIP_SYNTHESIS:'T3_DEEP_COMPOSITION'});
export function planExtraction(operation,registry={}){
 assert.ok(Object.hasOwn(extractionClasses,operation),'UNKNOWN_EXTRACTION_OPERATION');
 return {...selectPaiRoute({aiExecutionClass:extractionClasses[operation],deterministicFallbackAvailable:false},registry),authorityCreated:false,automaticApproval:false};
}
export function assembleExtractionCandidates({discovery,backlinks,readBytes}){
 const inputs=new Map(),cache=new Map();const read=path=>{if(cache.has(path))return cache.get(path);const bytes=readBytes(path);inputs.set(path,createHash('sha256').update(bytes).digest('hex'));const value=JSON.parse(bytes.toString());cache.set(path,value);return value;};
 assert.deepEqual(read('content/knowledge/structured/structured-knowledge-registry-v1.json'),discovery,'DISCOVERY_DRIFT');
 assert.deepEqual(read('content/knowledge/structured/structured-knowledge-backlinks-v1.json'),backlinks,'BACKLINK_DRIFT');
 const candidates=discovery.objects.map(entry=>{
  const registry=read(entry.registryPath);for(const [name,hash] of Object.entries(registry.sourceDigests||{})){const path=registry.sourcePaths[name];assert.ok(path,'MISSING_SOURCE_PATH');read(path);assert.equal(inputs.get(path),hash,`EXTRACTION_SOURCE_DRIFT:${path}`);}
  const key=['objects','patterns','entries'].find(k=>Array.isArray(registry[k]));const index=registry[key].findIndex(o=>o.objectId===entry.objectId),o=registry[key][index];assert.ok(o,'MISSING_STRUCTURED_SOURCE');assert.equal(o.bookCode,entry.bookCode,'OWNER_MISMATCH');
  const nodes=read(registry.sourcePaths.nodes).nodes;assert.ok(nodes.some(n=>n.nodeCode===o.nodeCode),'NODE_MISSING');
  const backlink=backlinks.backlinks.find(b=>b.objectId===o.objectId);assert.ok(backlink?.manuscriptSections.length,'MANUSCRIPT_REF_MISSING');assert.equal(backlink.bookCode,o.bookCode,'BACKLINK_OWNER_MISMATCH');
  let proposedMeaning=null,meaningKind='UNRESOLVED',pointer=null;
  if(typeof o.canonicalMeaning==='string'&&o.canonicalMeaning.trim()){proposedMeaning=o.canonicalMeaning;meaningKind='SOURCE_DEFINITION';pointer=`/${key}/${index}/canonicalMeaning`;}
  else {const articleIndex=o.articles?.findIndex(a=>a.locale==='zh-Hans'&&typeof a.summary==='string');if(articleIndex>=0){proposedMeaning=o.articles[articleIndex].summary;meaningKind='PUBLISHED_ARTICLE_SUMMARY';pointer=`/${key}/${index}/articles/${articleIndex}/summary`;}}
  const sourceQuoteRefs=pointer?[{path:entry.registryPath,pointer,sha256:inputs.get(entry.registryPath)}]:[];
  return {candidateId:`EXTRACT-${o.objectId}-V1`,bookCode:o.bookCode,partCode:o.partCode,nodeCode:o.nodeCode,manuscriptRef:backlink.manuscriptSections,candidateType:o.objectType,proposedTitle:o.title,proposedMeaning,meaningKind,proposedRelationships:[],sourceQuoteRefs,confidence:proposedMeaning?'SOURCE_BOUND':'UNRESOLVED',reviewState:'PENDING_HUMAN_REVIEW',sourceObjectId:o.objectId,sourceRegistry:entry.registryPath,
   executionClass:planExtraction('OBJECT_ASSEMBLY').aiExecutionClass,aiInvoked:false,canonicalAuthority:false,
   extractionOrder:[{stage:'CANONICAL_NODE_METADATA',path:registry.sourcePaths.nodes},{stage:'EXISTING_BLUEPRINT',path:registry.sourcePaths.blueprint||null},{stage:'APPROVED_MAPPING',path:registry.sourcePaths.bindings||null},{stage:'MANUSCRIPT_HEADINGS',path:registry.sourcePaths.sections||null},{stage:'EXISTING_FIGURE_METADATA',path:'content/registry/figures.json'}]};
 });
 read('content/registry/figures.json');
 return {version:'1.0.0',candidates,sourceDigests:Object.fromEntries([...inputs].sort()),aiInvoked:false,automaticRegistryWriteback:false,humanAcceptanceComplete:false};
}
