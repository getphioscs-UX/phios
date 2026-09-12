import {atlasContextSummary} from './cross-layer-context.js';
import {atlasUrlFromState} from './atlas-url-state.js';

export function buildAtlasAskContext(state={},data={},locale='en',currentUrl='https://example.invalid/books/reality-differentiation/'){
  const zh=locale==='zh-Hans';
  const atlasUrl=atlasUrlFromState(currentUrl,state);
  const route=`${atlasUrl.pathname}${atlasUrl.search}${atlasUrl.hash}`;
  const retrievalScope=Object.freeze({
    schemaVersion:'PHI-OS-ATLAS-RETRIEVAL-SCOPE-v1.0.0',scopeType:'CIVILIZATION_ATLAS',
    bookCode:'BOOK-5',partCode:'PART-12',activeLayer:state.activeLayer||'timeline',
    time:state.time??null,timeWindowId:state.timeWindowId||null,snapshotId:state.snapshotId||null,
    regionIds:state.regionIds||[],caseIds:state.caseIds||[],primaryCaseId:state.primaryCaseId||null,
    comparisonFamilyId:state.comparisonFamilyId||null,trajectoryIds:state.trajectoryIds||[],
    transitionWindowId:state.transitionWindowId||null,lossFamilyId:state.lossFamilyId||null,
    lossTypeId:state.lossTypeId||null,evidenceClasses:state.evidenceClasses||[]
  });
  return Object.freeze({
    contextType:'KNOWLEDGE',
    contextRef:'BOOK:BOOK-5',
    contextLabel:zh?'《世界如何分化》· 文明图谱':'Worlds of Difference · Civilization Atlas',
    contextRoute:route,
    contextSummary:atlasContextSummary(state,data,locale),
    readingPath:`BOOK-5 > PART-12 > ATLAS > ${state.activeLayer||'timeline'}`,
    relatedKnowledgeRef:'BOOK:BOOK-5',retrievalScope
  });
}

export function buildAtlasAskUrl(state={},data={},locale='en',currentUrl='https://example.invalid/books/reality-differentiation/'){
  const ctx=buildAtlasAskContext(state,data,locale,currentUrl);
  const url=new URL('/knowledge/ask/',currentUrl);
  for(const [key,value] of Object.entries(ctx)) if(value) url.searchParams.set(key,key==='retrievalScope'?JSON.stringify(value):value);
  return `${url.pathname}${url.search}`;
}
