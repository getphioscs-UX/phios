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

const tokens = value => normalize(value)
  .split(/[^\p{L}\p{N}-]+/u)
  .filter(token => token.length > 1);

async function readProjection(env, name) {
  if (!env?.ASSETS?.fetch) throw new Error('PUBLIC_KNOWLEDGE_ASSETS_UNAVAILABLE');
  const response = await env.ASSETS.fetch(new Request(`https://assets.local/content/knowledge/public/retrieval/${name}.json`));
  if (!response.ok) throw new Error(`PUBLIC_KNOWLEDGE_PROJECTION_UNAVAILABLE:${name}`);
  return response.json();
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
  const candidates = [node.title, node.summary, ...questions.map(x => x.question), ...aliases.map(x => x.value)];
  for (const value of candidates) {
    const valueTokens = new Set(tokens(value));
    const matched = [...qTokens].filter(token => valueTokens.has(token)).length;
    if (matched) add(matched * 25, 'token_match', value);
  }
  for (const fragment of fragments) {
    const valueTokens = new Set(tokens(fragment.text));
    const matched = [...qTokens].filter(token => valueTokens.has(token)).length;
    if (matched) add(matched * 5, 'fragment_match', fragment.fragmentCode);
  }
  return { score, evidence };
}

function coverageFor(score, exact) {
  if (exact) return 'exact';
  if (score >= 200) return 'strong';
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

export async function handlePublicKnowledgeRequest(request, env = {}) {
  if (request.method !== 'GET') return jsonResponse({ ok:false, error:{ code:'METHOD_NOT_ALLOWED' } },405);
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim();
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
    const fragments=fragmentsP.records.filter(x=>x.locale===locale&&x.nodeCode===node.nodeCode);
    const scored=scoreNode({query,node,aliases,questions,fragments});
    return {node,aliases,questions,fragments,...scored};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.node.nodeCode.localeCompare(b.node.nodeCode));
  if (!ranked.length) return jsonResponse({
    ok:true, query:{text:query,locale,mode:requestedMode}, coverage:{level:'none',answerGenerationAllowed:false},
    results:[], projection:null, readingPath:null, indexDigest:index.indexDigest
  },200,'public, max-age=60, stale-while-revalidate=300');

  const top=ranked[0];
  const exact=top.evidence.some(x=>x.type.startsWith('exact_'));
  const coverage=coverageFor(top.score,exact);
  const mode=requestedMode==='auto' ? (coverage==='exact'||coverage==='strong'?'focused':'overview') : requestedMode;
  const selected=selectFragments(mode,top.fragments,query);
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
    projection:{nodeCode:top.node.nodeCode,locale,mode,fragments:selected.map(({fragmentCode,ordinal,kind,text,digest})=>({fragmentCode,ordinal,kind,text,digest}))},
    readingPath:{steps,localeSwitches,blockedContinuations},
    indexDigest:index.indexDigest
  },200,'public, max-age=60, stale-while-revalidate=300');
}

export { normalize, selectFragments };
