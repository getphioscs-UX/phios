const OWNERS={
 'BOOK-1':['book-1/book-1-mechanism-registry-v1.json','objects'],
 'BOOK-2':['book-2/book-2-runtime-pattern-registry-v1.json','patterns'],
 'BOOK-3':['book-3/book-3-maintenance-signal-registry-v1.json','entries'],
 'BOOK-4':['book-4/book-4-expansion-mode-registry-v1.json','objects']
};
export function normalizeStructuredScope(value){
 if(value?.scopeType!=='STRUCTURED_KNOWLEDGE'||!OWNERS[value.bookCode]||!/^SK-B[1-4]-[A-Z0-9-]{1,80}$/.test(value.objectId||'')||!value.objectId.startsWith(`SK-B${value.bookCode.slice(-1)}-`))return null;
 return {scopeType:'STRUCTURED_KNOWLEDGE',bookCode:value.bookCode,objectId:value.objectId};
}
async function load(env,path){try{const r=await env?.ASSETS?.fetch(new Request('https://assets.local/content/knowledge/structured/'+path));return r?.ok?await r.json():null;}catch{return null;}}
export async function loadStructuredObject(env,scope){const s=normalizeStructuredScope(scope);if(!s)return null;const [path,key]=OWNERS[s.bookCode],data=await load(env,path);const object=data?.[key]?.find(o=>o.objectId===s.objectId&&o.bookCode===s.bookCode);if(!object||!['IN_REVIEW','ACCEPTED','ACTIVE'].includes(object.status)||!object.sourceRefs?.canonicalNodeCodes?.includes(object.nodeCode)||!object.sourceRefs?.manuscriptSectionRefs?.length||object.projectionState==='WITHHELD')return null;return {object,data};}
export async function resolveStructuredEntry(ref,env){const id=String(ref).replace(/^CONCEPT:/,'').toUpperCase();const bookCode=`BOOK-${id[4]}`;const result=await loadStructuredObject(env,{scopeType:'STRUCTURED_KNOWLEDGE',bookCode,objectId:id});return result?{bookCode,partCode:result.object.partCode,retrievalScope:{scopeType:'STRUCTURED_KNOWLEDGE',bookCode,objectId:id}}:null;}
export function classifyStructuredIntent(question){
 const q=String(question||'').toLowerCase();
 for(const [intent,re] of [['SCALE_TRANSITION',/scale (?:shift|transition)|尺度(?:转|跨)/],['PATTERN_COMPARISON',/compar|\bversus\b|\bvs\b|比较|对比/],['RUNTIME_INTERACTION',/relationship|interaction|关系|互动/],['RECOVERY',/recover|restore|恢复|修复/],['DEGRADATION',/degrad|failure|退化|失效/],['CONTINUITY',/continuity|continuous|连续|持续/],['EXPANSION',/expan|扩展/],['CONSTRAINT_ANALYSIS',/constraint|限制|约束/],['STATE_TRANSITION',/transition|状态.*变|转换/]])if(re.test(q))return intent;
 return 'MECHANISM_EXPLANATION';
}
export function structuredIntentRelevant(intent,source){
 const tags=String(source.structuredTags||'');
 const rules={RECOVERY:/RECOVERY|ADAPTATION|恢复|修复/,DEGRADATION:/DEGRADATION|FAILURE|退化|失效/,CONTINUITY:/CONTINUITY|连续|持续/,EXPANSION:/EXPANSION|REPLICATION|DISTRIBUTION|扩展/,SCALE_TRANSITION:/SCALE_SHIFT|尺度转换/,CONSTRAINT_ANALYSIS:/CONSTRAINT|约束|限制/,RUNTIME_INTERACTION:/RELATIONSHIP|COORDINATION|FEEDBACK|关系|互动/,STATE_TRANSITION:/TRANSITION|STATE|状态/};
 if(intent==='PATTERN_COMPARISON')return false; // One selected object cannot establish a comparison.
 if(intent==='EXPANSION'&&source.bookCode==='BOOK-4'&&/\b(?:MAINTENANCE_COST|SCALE_SHIFT)\b/.test(tags))return true;
 return !rules[intent]||rules[intent].test(tags);
}
export async function retrieveStructuredObject({env,scope,locale='zh-Hans'}){
 const found=await loadStructuredObject(env,scope);if(!found)return {sources:[],nodeCodes:[],chain:[]};const {object:o}=found;
 // Source-index entries intentionally contain no definition; never answer from their titles.
 const text=o.canonicalMeaning||o.articles?.find(a=>a.locale===locale)?.summary||o.definition;
 if(!text)return {sources:[],nodeCodes:[],chain:[{stage:'SELECTED_STRUCTURED_OBJECT',status:'SEMANTIC_CONTENT_UNAVAILABLE'}]};
 const discovery=await load(env,'structured-knowledge-registry-v1.json');const href=discovery?.objects?.find(x=>x.objectId===o.objectId)?.explorerHref;
 if(!href)return {sources:[],nodeCodes:[],chain:[]};
 return {sources:[{sourceId:`STRUCTURED:${o.objectId}`,sourceType:'STRUCTURED_KNOWLEDGE_OBJECT',authorityClass:'GOVERNED_PROJECTION',bookCode:o.bookCode,partCode:o.partCode,nodeCode:o.nodeCode,structuredObjectId:o.objectId,structuredTags:`${o.objectType} ${o.family||''} ${o.title}`,scopeMatch:true,selected:true,href,text,sourceRefs:o.sourceRefs,humanAcceptanceComplete:false}],nodeCodes:[o.nodeCode],chain:[{stage:'SELECTED_STRUCTURED_OBJECT',status:'MATCHED'},{stage:'RELATED_STRUCTURED_OBJECTS',status:'NO_ADMITTED_EDGES'},{stage:'CANONICAL_NODE',status:'SOURCE_REFS_BOUND'},{stage:'MANUSCRIPT_OR_PUBLISHED_ARTICLE',status:'EXISTING_RETRIEVAL_FALLBACK'},{stage:'BROADER_KNOWLEDGE',status:'RELEVANCE_GATED'}]};
}
export function structuredAnswerShape(bundle,directAnswer){const source=bundle?.sources?.find(s=>s.sourceType==='STRUCTURED_KNOWLEDGE_OBJECT'&&s.selected);if(!source)return null;return {directAnswer,mechanismOrState:source.text,conditions:[],relatedFactors:[],possibleTransition:null,boundaryUnknown:bundle.question?.locale==='en'?'Structured classification awaits review; conditions and transitions are not established.':'结构化分类待审核；条件与转换关系尚未确立。',exploreInBook:source.href,sourceIds:[source.sourceId]};}
