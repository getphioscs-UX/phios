// Transport normalization only. Source existence and authority are resolved server-side.
export function normalizeAskContext(input={}) {
 const get=k=>String(typeof input.get==='function'?input.get(k)||'':input[k]||'').trim();
 let contextRef=get('contextRef')||get('contextId');
 const kind=(get('entrySurface')||get('contextType')).toUpperCase().replace('PUBLISHED_ARTICLE','ARTICLE');
 if(contextRef&&!contextRef.includes(':')&&['ARTICLE','BOOK','FIGURE','CONCEPT','NODE'].includes(kind))contextRef=`${kind}:${contextRef}`;
 if(contextRef.startsWith('ARTICLE:'))contextRef='ARTICLE:'+contextRef.slice(8).toLowerCase();
 const publicRef=/^(ARTICLE|BOOK|FIGURE|CONCEPT|NODE):[a-zA-Z0-9_-]+$/.test(contextRef);
 const route=get('contextRoute')||get('entryRoute');
 return {entrySurface:get('entrySurface'),contextType:publicRef?'KNOWLEDGE':get('contextType'),contextRef,contextId:contextRef,contextLabel:get('contextLabel').slice(0,160),contextRoute:route.startsWith('/')&&!route.startsWith('//')?route:'/knowledge/',contextSummary:get('contextSummary').slice(0,320),readingPath:get('readingPath'),relatedKnowledgeRef:get('relatedKnowledgeRef'),retrievalScope:get('retrievalScope'),locale:get('locale'),fallbackPolicy:contextRef?'EXPLICIT_SOURCE_ONLY':'GENERAL_KNOWLEDGE'};
}
