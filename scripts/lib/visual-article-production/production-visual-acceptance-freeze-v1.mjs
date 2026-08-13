import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

export const SCOPE = Object.freeze({
  nodeCode: 'KN-PREFACE-001', locale: 'zh-Hans', slug: 'ai-formation-from-civilizational-capability',
  productionUrl: 'https://phios-github.pages.dev/articles/ai-formation-from-civilizational-capability',
  articlePath: 'content/knowledge/public/visual-articles/zh-Hans/ai-formation-from-civilizational-capability.json',
  routePath: 'articles/ai-formation-from-civilizational-capability.html',
  assetPath: 'assets/knowledge/KN-PREFACE-001/ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-002.webp'
});
export const W28_PATH='content/production/visual-article/release/acceptance/VAP-W28-KN-PREFACE-001-ZH-HANS.json';
export const W29_PATH='content/production/visual-article/release/freeze/VAP-W29-KN-PREFACE-001-ZH-HANS.json';
export const REVIEW_PATH='content/production/visual-article/release/acceptance/VAP-W28-KN-PREFACE-001-ZH-HANS.browser-review.json';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
export const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const bytesDigest=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=(root,p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const fileDigest=(root,p)=>bytesDigest(fs.readFileSync(path.join(root,p)));

export async function collectProductionEvidence({root=process.cwd(),fetchImpl=fetch}={}) {
  const targets={route:SCOPE.productionUrl,article:`https://phios-github.pages.dev/${SCOPE.articlePath}`,asset:`https://phios-github.pages.dev/${SCOPE.assetPath}`};
  const responses={};
  for(const [key,url] of Object.entries(targets)){
    const response=await fetchImpl(url,{redirect:'follow'}); const bytes=Buffer.from(await response.arrayBuffer());
    responses[key]={url,status:response.status,contentType:response.headers.get('content-type'),bytes:bytes.length,sha256:bytesDigest(bytes),body:key==='asset'?null:bytes.toString('utf8')};
  }
  const publicArticle=JSON.parse(responses.article.body);
  const figure=publicArticle.figureReferences?.[0];
  const automated={
    routeVisible:responses.route.status===200&&responses.route.body.includes('data-article-slug="ai-formation-from-civilizational-capability"'),
    chineseMetadataCorrect:responses.route.body.includes('为什么人工智能是文明能力长期累积的结果')&&publicArticle.locale==='zh-Hans',
    publicArticleVisible:responses.article.status===200&&publicArticle.nodeCode===SCOPE.nodeCode,
    figureReferenceCorrect:figure?.publicSrc===`/${SCOPE.assetPath}`&&figure?.placement==='after_fragment:FRAGMENT-KN-PREFACE-001-ZH-HANS-006',
    figureAssetVisible:responses.asset.status===200&&/^image\/webp/.test(responses.asset.contentType||'')&&responses.asset.bytes>0,
    deployedBytesMatchRepository:responses.route.sha256===fileDigest(root,SCOPE.routePath)&&responses.article.sha256===fileDigest(root,SCOPE.articlePath)&&responses.asset.sha256===fileDigest(root,SCOPE.assetPath),
    noFixtureLeakage:!/(\/fixtures\/|fixture-only|validation fixture)/i.test(responses.route.body+responses.article.body),
    noUnpublishedAssetLeakage:!/(candidate\.webp|CAR-CAND-|not_published)/i.test(responses.route.body+responses.article.body)
  };
  return {checkedAt:new Date().toISOString(),targets:Object.fromEntries(Object.entries(responses).map(([k,v])=>[k,Object.fromEntries(Object.entries(v).filter(([x])=>x!=='body'))])),automated,allAutomatedPassed:Object.values(automated).every(Boolean)};
}

export function buildW28({root=process.cwd(),evidence,browserReview=null}){
  const w25=read(root,'content/production/visual-article/release/candidates/VAC-KN-PREFACE-001-ZH-HANS-v1.json');
  const w27=read(root,'content/production/visual-article/release/website/VAP-W27-KN-PREFACE-001-ZH-HANS.json');
  const interactiveChecks=['articleVisible','figureVisible','figureCorrect','figurePlacementCorrect','altCorrect','pdsCorrect','mobileCorrect','chineseCorrect','noConsoleErrors','noBrokenAsset','noUnpublishedAssetLeakage','noFixtureLeakage'];
  const humanAccepted=browserReview?.reviewerCode==='TL'&&browserReview?.decision==='accept'&&interactiveChecks.every(k=>browserReview.checks?.[k]===true);
  const accepted=w25.status==='READY_FOR_RELEASE'&&w27.status==='EXECUTED'&&evidence.allAutomatedPassed&&humanAccepted;
  const body={schemaVersion:'PHI-OS-VAP-W28-PRODUCTION-VISUAL-ACCEPTANCE-v1.0.0',work:'VAP-W28',nodeCode:SCOPE.nodeCode,locale:SCOPE.locale,slug:SCOPE.slug,productionUrl:SCOPE.productionUrl,status:accepted?'ACCEPTED':evidence.allAutomatedPassed?'AWAITING_TL_INTERACTIVE_BROWSER_ACCEPTANCE':'BLOCKED_BY_PRODUCTION_EVIDENCE',executionPerformed:true,automatedEvidence:evidence,interactiveBrowserAcceptance:{required:true,reviewPath:REVIEW_PATH,reviewed:Boolean(browserReview),reviewerCode:browserReview?.reviewerCode??null,decision:browserReview?.decision??null,checks:browserReview?.checks??Object.fromEntries(interactiveChecks.map(k=>[k,false]))},upstream:{w25Digest:w25.releaseCandidateDigest,w27ReleaseDigest:w27.releaseDigest},governance:{checkerWritesState:false,automaticHumanAcceptanceForbidden:true,automaticFreezeForbidden:true}};
  return {...body,acceptanceDigest:digest(body)};
}
export function buildW29({root=process.cwd(),w28}){
  const accepted=w28.status==='ACCEPTED';
  const refs=['content/knowledge/public/authority/articles/zh-Hans/KN-PREFACE-001.json','content/production/car/published/PUBLISHED-ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-002.json','content/production/cpr/presentations/PRESENTATION-ARTICLE-KN-PREFACE-001-ZH-HANS-v2.json','content/production/visual-article/acceptance/vap-w22-w24-cpr-pds-production-presentation-acceptance-v2.json',W28_PATH];
  const body={schemaVersion:'PHI-OS-VAP-W29-FIRST-VISUAL-ARTICLE-FREEZE-v1.0.0',work:'VAP-W29',nodeCode:SCOPE.nodeCode,locale:SCOPE.locale,status:accepted?'FROZEN':'BLOCKED_BY_W28_INTERACTIVE_ACCEPTANCE',executionPerformed:accepted,verticalSlice:{canonicalNodeCount:1,approvedArticleCount:1,publishedFigureCount:1,cprPresentationCount:1,pdsArticlePageCount:1,publicReleaseCount:1},lineage:refs.map(p=>({path:p,sha256:fileDigest(root,p)})),w28AcceptanceDigest:w28.acceptanceDigest,governance:{checkerWritesState:false,freezeRequiresAcceptedW28:true,fixtureLeakageAllowed:false,unpublishedAssetLeakageAllowed:false}};
  return {...body,freezeDigest:digest(body)};
}
export async function writeJson(root,relative,value){const target=path.join(root,relative);await fsp.mkdir(path.dirname(target),{recursive:true});await fsp.writeFile(target,`${JSON.stringify(value,null,2)}\n`);}
export function validateRecord(record,digestKey){const copy={...record};delete copy[digestKey];if(record[digestKey]!==digest(copy))throw new Error(`${record.work}_DIGEST_INVALID`);return record;}
