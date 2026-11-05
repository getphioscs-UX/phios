import {resolveSelectedArticle,PUBLIC_ARTICLE_MANIFEST_PATHS} from '../contextual-ask/contextual-ask-runtime.js';
import {loadBookViiPublishedAdmission,appendBookViiProjection} from './book-vii-published-admission.js';
const SUPPORTED_LOCALES = new Set(['zh-Hans', 'en']);
const SUPPORTED_MODES = new Set(['auto', 'overview', 'focused', 'full_article', 'continuity']);
const MAX_QUERY_LENGTH = 500;

const jsonResponse = (body, status = 200, cache = 'no-store') => Response.json(body, {
  status,
  headers: {
    'Cache-Control': cache,
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff'
  }
});

const normalize = value => String(value ?? '')
  .normalize('NFKC')
  .trim()
  .toLocaleLowerCase()
  .replace(/\s+/g, ' ');

const stopWords = new Set('the a an is are was were be been being do does did what which who why how when where and or but of for to in on at by with from as it its that this those these my your our their me we you they can could would should will may might have has had than then into about please explain tell between difference information needed each'.split(' '));
const tokens = value => normalize(value)
  .split(/[^\p{L}\p{N}-]+/u)
  .filter(token => token.length > 1 && !stopWords.has(token));

async function readProjection(env, name) {
  if (!env?.ASSETS?.fetch) throw new Error('PUBLIC_KNOWLEDGE_ASSETS_UNAVAILABLE');
  const response = await env.ASSETS.fetch(new Request(`https://assets.local/content/knowledge/public/retrieval/${name}.json`));
  if (!response.ok) throw new Error(`PUBLIC_KNOWLEDGE_PROJECTION_UNAVAILABLE:${name}`);
  const original=await response.json();
  if(name==='published-retrieval-index')return original;
  const release=await loadBookViiPublishedAdmission(async path=>{const r=await env.ASSETS.fetch(new Request(`https://assets.local/${path}`));if(!r.ok)return null;return r.json();});
  return appendBookViiProjection(original,name,release);
}

function scoreNode({ query, node, aliases, questions, fragments }) {
  const q = normalize(query);
  const qTokens = new Set(tokens(query));
  let score = 0;
  const evidence = [];
  const add = (points, type, value) => { score += points; evidence.push({ type, value }); };
  if (normalize(node.title) === q) add(1000, 'exact_title', node.title);
  for (const item of questions) {
    if (normalize(item.question) === q) add(item.questionType === 'canonical' ? 950 : 700, 'exact_question', item.question);
  }
  for (const item of aliases) {
    if (normalize(item.value) === q || normalize(item.normalized) === q) add(900, 'exact_alias', item.value);
  }
  // A term counts once per field. Repeating paragraphs/aliases must not turn a
  // tangential article into direct support for a multi-entity question.
  const overlap = value => {
    const valueTokens = new Set(tokens(value));
    return [...qTokens].filter(token => valueTokens.has(token)).length;
  };
  const candidates = [node.title, node.summary, ...questions.map(x => x.question), ...aliases.map(x => x.value)];
  const primaryMatches = Math.max(0,...candidates.map(overlap));
  const fragmentMatches = Math.max(0,...fragments.map(f=>overlap(f.text)));
  if(primaryMatches) add(primaryMatches*25,'token_match',node.nodeCode);
  if(fragmentMatches) add(fragmentMatches*5,'fragment_match',node.nodeCode);
  const directSupport = qTokens.size>=2 && primaryMatches/qTokens.size>=0.8 && fragmentMatches/qTokens.size>=0.8;
  return { score, evidence, directSupport };
}

function coverageFor(score, exact, directSupport) {
  if (exact) return 'exact';
  if (directSupport) return 'strong';
  if (score >= 100) return 'partial';
  if (score > 0) return 'limited';
  return 'none';
}

function selectFragments(mode, fragments, query) {
  const ordered = [...fragments].sort((a,b) => a.ordinal-b.ordinal);
  if (mode === 'full_article') return ordered;
  if (mode === 'continuity') return ordered.length <= 3 ? ordered : [ordered[0], ...ordered.slice(-2)];
  if (mode === 'overview') return ordered.length <= 3 ? ordered : [ordered[0], ordered[1], ordered.at(-1)];
  if (mode === 'focused') {
    const qTokens = new Set(tokens(query));
    let bestIndex = 0, bestScore = -1;
    ordered.forEach((fragment,index) => {
      const fTokens = new Set(tokens(fragment.text));
      const score = [...qTokens].filter(token => fTokens.has(token)).length;
      if (score > bestScore) { bestScore=score; bestIndex=index; }
    });
    return ordered.filter((_,index) => Math.abs(index-bestIndex)<=1 || index===0);
  }
  return ordered.length <= 5 ? ordered : [ordered[0], ordered[1], ordered[2], ordered.at(-1)];
}

// Search the existing publication owners without creating canonical node identities.
const articleTerms=value=>[...new Set([...normalize(value).replace(/请解释|为什么|为何|如何|怎样|怎么/g,' ').matchAll(/[a-z]{3,}|[\u3400-\u9fff]{2,}/g)].flatMap(m=>/[\u3400-\u9fff]/.test(m[0])?Array.from({length:m[0].length-1},(_,i)=>m[0].slice(i,i+2)):[m[0].replace(/ies$/,'y').replace(/s$/,'')]).filter(t=>!stopWords.has(t)))];
async function publishedArticleMatch(env,query,locale,selectedSlug=null){
 if(!env?.ASSETS?.fetch)return null;const terms=articleTerms(query);if(!selectedSlug&&terms.length<2)return null;const read=async path=>{const r=await env.ASSETS.fetch(new Request('https://assets.local'+path));return r.ok?r.json():null;};const manifests=await Promise.all(PUBLIC_ARTICLE_MANIFEST_PATHS.map(read)),candidates=manifests.flatMap((m,i)=>(m?.records||[]).filter(r=>r.locale===locale&&r.status==='published').map(r=>({...r,manifestPath:PUBLIC_ARTICLE_MANIFEST_PATHS[i]}))).map(row=>{const title=new Set(articleTerms(row.title+' '+(row.searchAliases||[]).join(' '))),matched=terms.filter(t=>title.has(t)).length;return{row,score:matched/terms.length};}).filter(x=>selectedSlug?x.row.slug===selectedSlug:x.score>=.45&&x.score*terms.length>=3).sort((a,b)=>b.score-a.score);for(const c of candidates.slice(0,3)){const article=await resolveSelectedArticle(env,c.row.slug,locale);if(!article)continue;const body=new Set(articleTerms(article.sources.map(s=>s.text).join(' '))),support=terms.filter(t=>body.has(t)).length/terms.length;if(!selectedSlug&&support<.65)continue;const r=await env.ASSETS.fetch(new Request('https://assets.local'+c.row.path));if(!r.ok)continue;const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');return{article,row:c.row,digest,score:c.score,bodyCoverage:support};}return null;
}
export async function handlePublicKnowledgeRequest(request, env = {}) {
  if (request.method !== 'GET') return jsonResponse({ ok:false, error:{ code:'METHOD_NOT_ALLOWED' } },405);
  const url = new URL(request.url);
  const selectedSlug=url.searchParams.get('article');
  if(selectedSlug&&!/^[a-zA-Z0-9_-]{1,150}$/.test(selectedSlug))return jsonResponse({ok:false,error:{code:'ARTICLE_INVALID'}},400);
  const query = (url.searchParams.get('q') || selectedSlug || '').trim();
  const locale = url.searchParams.get('locale') || 'en';
  const requestedMode = url.searchParams.get('mode') || 'auto';
  if (!query || query.length > MAX_QUERY_LENGTH) return jsonResponse({ ok:false,error:{code:'QUERY_INVALID'} },400);
  if (!SUPPORTED_LOCALES.has(locale)) return jsonResponse({ ok:false,error:{code:'LOCALE_UNSUPPORTED'} },400);
  if (!SUPPORTED_MODES.has(requestedMode)) return jsonResponse({ ok:false,error:{code:'MODE_UNSUPPORTED'} },400);

  const [nodesP,aliasesP,questionsP,fragmentsP,relationshipsP,localeP,index] = await Promise.all([
    readProjection(env,'nodes'), readProjection(env,'aliases'), readProjection(env,'questions'),
    readProjection(env,'fragments'), readProjection(env,'relationships'), readProjection(env,'locale-availability'),
    readProjection(env,'published-retrieval-index')
  ]);
  const nodes = nodesP.records.filter(x=>x.locale===locale);
  const ranked = nodes.map(node => {
    const aliases=aliasesP.records.filter(x=>x.locale===locale&&x.nodeCode===node.nodeCode);
    const questions=questionsP.records.filter(x=>x.locale===locale&&x.nodeCode===node.nodeCode);
    const fragments=fragmentsP.records.filter(x=>x.locale===locale&&x.nodeCode===node.nodeCode&&(!x.questionScope||x.questionScope.some(q=>normalize(q)===normalize(query))));
    const scored=scoreNode({query,node,aliases,questions,fragments});
    return {node,aliases,questions,fragments,...scored};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.node.nodeCode.localeCompare(b.node.nodeCode));
  const publication=selectedSlug?await publishedArticleMatch(env,query,locale,selectedSlug):(!ranked[0]||(!ranked[0].directSupport&&!ranked[0].evidence.some(e=>e.type.startsWith('exact_'))))?await publishedArticleMatch(env,query,locale):null;if(publication){const {article,row,digest}=publication;return jsonResponse({ok:true,query:{text:query,locale,mode:requestedMode},coverage:{level:'strong',basis:'EXISTING_PUBLISHED_ARTICLE_BODY_MATCH_NOT_SEMANTIC_PROOF',answerGenerationAllowed:false},results:[{nodeCode:row.nodeCode,articleId:row.articleId,identityClass:row.identityClass||'PUBLICATION_ARTICLE_NOT_CANONICAL_NODE',locale,title:article.title,summary:null,href:article.href,score:publication.score}],projection:{nodeCode:row.nodeCode,locale,sourceClass:'PUBLISHED_ARTICLE_AUTHORITY',mode:'SOURCE_BOUND_EXCERPTS',fragments:await Promise.all(article.sources.map(async(f,i)=>({fragmentCode:f.fragmentCode,nodeCode:row.nodeCode,ordinal:i+1,kind:'paragraph',text:f.text,digest:[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(f.text)))].map(b=>b.toString(16).padStart(2,'0')).join(''),sourceVersion:article.sourceVersion,href:f.href})))},publicationProvenance:{manifestPath:row.manifestPath,articlePath:row.path,articleSHA256:digest,canonicalRegistryAltered:false},readingPath:{steps:[{type:'published_article',href:article.href,title:article.title}]},indexDigest:'PUBLICATION:'+digest,baseIndexDigest:index.indexDigest},200,'public,max-age=60');}
  if(selectedSlug)return jsonResponse({ok:false,error:{code:'SELECTED_SOURCE_UNAVAILABLE'}},404);
  if (!ranked.length) return jsonResponse({
    ok:true, query:{text:query,locale,mode:requestedMode}, coverage:{level:'none',answerGenerationAllowed:false},
    results:[], projection:null, readingPath:null, indexDigest:index.indexDigest
  },200,'public, max-age=60, stale-while-revalidate=300');

  const top=ranked[0];
  const exact=top.evidence.some(x=>x.type.startsWith('exact_'));
  const coverage=coverageFor(top.score,exact,top.directSupport);
  const mode=requestedMode==='auto' ? (coverage==='exact'||coverage==='strong'?'focused':'overview') : requestedMode;
  const selected=selectFragments(mode,top.fragments,query);
  if(top.node.bookCode==='BOOK-7'&&exact){
    const support=relationshipsP.records.filter(r=>r.sourceNodeCode===top.node.nodeCode&&r.locale===locale&&r.targetPublished&&r.includeInGrounding);
    for(const relationship of support)selected.push(...fragmentsP.records.filter(f=>f.nodeCode===relationship.targetNodeCode&&f.locale===locale&&(!f.questionScope||f.questionScope.some(q=>normalize(q)===normalize(query)))));
  }
  const localeAvailability=localeP.records.find(x=>x.nodeCode===top.node.nodeCode);
  const relationships=relationshipsP.records.filter(x=>x.locale===locale&&x.sourceNodeCode===top.node.nodeCode);
  const steps=[{type:'entry',nodeCode:top.node.nodeCode,locale,href:top.node.href,title:top.node.title}];
  const blockedContinuations=relationships.filter(x=>!x.targetPublished).map(x=>({
    targetNodeCode:x.targetNodeCode,type:x.type,reason:'target_not_published_in_requested_locale',navigable:false
  }));
  const localeSwitches=(localeAvailability?.locales||[]).filter(x=>x.available&&x.locale!==locale).map(x=>({
    nodeCode:top.node.nodeCode,locale:x.locale,available:true
  }));
  return jsonResponse({
    ok:true,
    query:{text:query,locale,mode:requestedMode},
    coverage:{level:coverage,score:top.score,answerGenerationAllowed:false},
    results:ranked.slice(0,5).map(x=>({nodeCode:x.node.nodeCode,locale,title:x.node.title,summary:x.node.summary,href:x.node.href,score:x.score})),
    projection:{nodeCode:top.node.nodeCode,locale,mode,fragments:selected.map(({fragmentCode,ordinal,kind,text,digest,...metadata})=>({fragmentCode,ordinal,kind,text,digest,...metadata,...(metadata.bookId==='BOOK-7'?{scopeMatch:exact,bookCode:'BOOK-7',partCode:'PART-14'}:{})}))},
    readingPath:{steps,localeSwitches,blockedContinuations},
    indexDigest:index.indexDigest
  },200,'public, max-age=60, stale-while-revalidate=300');
}

export { normalize, selectFragments };
