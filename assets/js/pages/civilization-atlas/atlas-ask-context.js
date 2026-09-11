import {atlasContextSummary} from './cross-layer-context.js';
import {atlasUrlFromState} from './atlas-url-state.js';

export function buildAtlasAskContext(state={},data={},locale='en',currentUrl='https://example.invalid/books/reality-differentiation/'){
  const zh=locale==='zh-Hans';
  const atlasUrl=atlasUrlFromState(currentUrl,state);
  const route=`${atlasUrl.pathname}${atlasUrl.search}${atlasUrl.hash}`;
  return Object.freeze({
    contextType:'KNOWLEDGE',
    contextRef:'BOOK:BOOK-5',
    contextLabel:zh?'《世界如何分化》· 文明图谱':'Worlds of Difference · Civilization Atlas',
    contextRoute:route,
    contextSummary:atlasContextSummary(state,data,locale),
    readingPath:`BOOK-5 > PART-12 > ATLAS > ${state.activeLayer||'timeline'}`,
    relatedKnowledgeRef:'BOOK:BOOK-5'
  });
}

export function buildAtlasAskUrl(state={},data={},locale='en',currentUrl='https://example.invalid/books/reality-differentiation/'){
  const ctx=buildAtlasAskContext(state,data,locale,currentUrl);
  const url=new URL('/knowledge/ask/',currentUrl);
  for(const [key,value] of Object.entries(ctx)) if(value) url.searchParams.set(key,value);
  return `${url.pathname}${url.search}`;
}
