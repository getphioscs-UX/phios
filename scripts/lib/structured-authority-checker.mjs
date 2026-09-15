import assert from 'node:assert/strict';
export function validateStructuredAuthority({contract,discovery,backlinks,registries,extraction,read}){
 assert.equal(contract.projectionOnly,true,'STRUCTURED_AUTHORITY_PROMOTION');
 for(const boundary of ['SECOND_KNOWLEDGE_MASTER','ARTICLE_ONLY_EXTRACTION_AUTHORITY','LLM_AUTHORITY'])assert.ok(contract.forbidden.includes(boundary),'AUTHORITY_BOUNDARY_REMOVED');
 assert.deepEqual(contract.authorityChain,['SOURCE_MANUSCRIPT','CANONICAL_NODE','STRUCTURED_EXTRACTION','BOOK_REGISTRY','SHARED_CONTRACT','INTERACTIVE_PROJECTION','EXISTING_CONSUMERS'],'AUTHORITY_CHAIN_CHANGED');
 for(const projection of [discovery,backlinks]){assert.equal(projection.role,'DISCOVERY_ONLY','SECOND_KNOWLEDGE_MASTER');assert.equal(projection.canonicalAuthority,false,'PROJECTION_AUTHORITY_PROMOTION');}
 assert.equal(extraction.automaticRegistryWriteback,false,'AUTOMATIC_WRITEBACK');
 assert.equal(extraction.aiInvoked,false,'UNREGISTERED_EXTRACTION_PROVIDER');
 const candidates=new Map(extraction.candidates.map(c=>[c.sourceObjectId,c]));let checked=0,articleSummaries=0,unresolved=0;
 assert.equal(candidates.size,extraction.candidates.length,'DUPLICATE_AUTHORITY_CANDIDATE');
 for(const {path,data} of registries){
  for(const o of data.objects||data.patterns||data.entries){
   checked++;
   const nodePath=contract.canonicalAuthorityByBook[o.bookCode];assert.ok(nodePath&&!nodePath.startsWith('content/knowledge/structured/'),'SECOND_CANONICAL_MASTER');
   assert.equal(data.sourcePaths.nodes,nodePath,'UNREGISTERED_CANONICAL_MASTER');
   assert.ok(read(nodePath).nodes.some(n=>n.nodeCode===o.nodeCode),'CANONICAL_SOURCE_MISSING');
   assert.ok(o.sourceRefs.canonicalNodeCodes.includes(o.nodeCode)&&o.sourceRefs.manuscriptSectionRefs.length,'ARTICLE_ONLY_SOURCE');
   assert.notEqual(o.canonicalAuthority,true,'OBJECT_AUTHORITY_PROMOTION');assert.notEqual(data.canonicalAuthority,true,'REGISTRY_AUTHORITY_PROMOTION');
   assert.ok(['IN_REVIEW'].includes(o.status),'UNREVIEWED_OBJECT_PROMOTION');
   const c=candidates.get(o.objectId);assert.ok(c,'CANDIDATE_MISSING');assert.equal(c.sourceRegistry,path,'CANDIDATE_SOURCE_MISMATCH');
   assert.equal(c.canonicalAuthority,false,'CANDIDATE_AUTHORITY_PROMOTION');assert.equal(c.aiInvoked,false,'LLM_AUTHORITY');assert.equal(c.reviewState,'PENDING_HUMAN_REVIEW','UNREVIEWED_CANDIDATE_PROMOTION');
   if(c.meaningKind==='PUBLISHED_ARTICLE_SUMMARY'){
    articleSummaries++;assert.equal(typeof o.canonicalMeaning,'undefined','ARTICLE_DEFINITION_PROMOTION');assert.ok(o.definition==null,'ARTICLE_DEFINITION_PROMOTION');
    assert.ok(o.articles?.some(a=>a.summary===c.proposedMeaning),'ARTICLE_SUMMARY_SOURCE_MISMATCH');
    assert.ok(c.sourceQuoteRefs.length&&c.sourceQuoteRefs.every(r=>/^\/objects\/\d+\/articles\/\d+\/summary$/.test(r.pointer)),'ARTICLE_SUMMARY_RELABELLED');
   }else if(c.meaningKind==='SOURCE_DEFINITION'){
    assert.equal(c.proposedMeaning,o.canonicalMeaning,'DEFINITION_SOURCE_MISMATCH');
    assert.ok(c.sourceQuoteRefs.length&&c.sourceQuoteRefs.every(r=>r.pointer.endsWith('/canonicalMeaning')),'DEFINITION_SOURCE_MISMATCH');
   }else{unresolved++;assert.equal(c.meaningKind,'UNRESOLVED','UNKNOWN_MEANING_AUTHORITY');assert.equal(c.proposedMeaning,null,'UNRESOLVED_MEANING_PROMOTION');assert.ok(o.definition==null&&o.canonicalMeaning==null,'UNRESOLVED_MEANING_PROMOTION');}
  }
 }
 assert.equal(checked,candidates.size,'ORPHAN_AUTHORITY_CANDIDATE');
 return {objects:checked,articleSummaries,unresolved};
}
