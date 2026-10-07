// TEST FIXTURE ONLY. No production runtime owner or public UI.
(function(scope){
  'use strict';
  const modes=['LEARN','DEMO','CURRENT_REALITY_REFERENCE','PROFESSIONAL_REFERENCE'];
  function buildAskRequest({mode='DEMO',question,selectedNodeRefs=[],contextSummary='',authorizedContext=null}={}){
    if(!modes.includes(mode))throw Error('MODE_NOT_SUPPORTED');
    if(!String(question||'').trim())throw Error('QUESTION_REQUIRED');
    if(!selectedNodeRefs.length||selectedNodeRefs.some(n=>!/^KN-B7-14-(?:00[1-9]|0[1-9][0-9]|100)$/.test(n)))throw Error('EXISTING_CANONICAL_NODE_REQUIRED');
    const referenceMode=mode==='CURRENT_REALITY_REFERENCE'||mode==='PROFESSIONAL_REFERENCE';
    if(referenceMode&&(!authorizedContext||authorizedContext.source!=='EXISTING_SERVER_RESOLVED_CONTEXT'||!authorizedContext.contextRef||authorizedContext.contextType!==(mode==='CURRENT_REALITY_REFERENCE'?'CURRENT_REALITY':'PROFESSIONAL_CASE_CONTEXT')))throw Error('AUTHORIZED_WORKSPACE_CONTEXT_REQUIRED');
    const contexts=[{contextType:'KNOWLEDGE',contextRef:'BOOK:BOOK-7',label:'第七册观察知识'}];
    if(referenceMode)contexts.push({contextType:authorizedContext.contextType,contextRef:authorizedContext.contextRef});
    return {question:String(question).trim(),locale:'zh-Hans',guidedRouting:true,methodGuidanceRequested:false,contexts,knowledgeContext:{contextRef:'BOOK:BOOK-7',contextRoute:'/books/reality-observation/',contextLabel:'第七册观察知识',contextSummary:String(contextSummary).slice(0,240),readingPath:selectedNodeRefs.join(',').slice(0,240),relatedKnowledgeRef:'BOOK:BOOK-7'}};
  }
  async function askExisting(options,fetcher=scope.fetch){
    const body=buildAskRequest(options);
    const response=await fetcher('/api/customer-contextual-ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const payload=await response.json();if(!response.ok||payload.ok!==true)throw Error('EXISTING_ASK_UNAVAILABLE');return payload;
  }
  scope.ObservationInteractionFixture={buildAskRequest,askExisting};

})(globalThis);
