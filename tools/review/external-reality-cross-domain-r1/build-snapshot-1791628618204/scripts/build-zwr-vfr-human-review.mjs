import {ZWR_VFR_STYLES} from '../assets/customer-ui/js/personal-products/ziwei-vfr-r1-styles.js';
import fs from 'node:fs';
import {renderZwrVfrReview,ZWR_VFR_RENDERER_VERSION} from '../assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js';
import {buildZwrVfrPagePlan,validateZwrVfrPagePlan,ZWR_VFR_PAGE_PLAN_VERSION,ZWR_VFR_FIT_PROFILE_VERSION} from '../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';
import {buildZwrVfrDeepPublicationIr,ZWR_VFR_DEEP_PUBLICATION_IR_VERSION} from '../functions/personal-reading/visual-first/ziwei-vfr-deep-publication.js';
import {ZWR_VFR_DIAGRAM_DATA_VERSION} from '../functions/personal-reading/visual-first/ziwei-vfr-diagram-data.js';
import {ZWR_VFR_VISUAL_BINDING_VERSION} from '../functions/canonical-presentation-runtime/ziwei-vfr-r1-visual-bindings.js';
import {zwrVfrDeepPublicationCacheIdentity} from '../functions/personal-reading/visual-first/ziwei-vfr-cache.js';

const root='docs/reports/ziwei/vfr-r1';
const repairedPath=root+'/five-call-experiment/REPAIRED-RESULT.json';
const packPath=root+'/COMPACT-AUTHORING-PACK.json';
const diagramPath=root+'/DIAGRAM-DATA.json';
const pagePath=root+'/PAGE-PLAN.json';
const publicationPath=root+'/DEEP-PUBLICATION-IR.json';
const renderCachePath=root+'/DEEP-RENDER-CACHE.json';
const fitPlanPath=root+'/PUBLICATION-FIT-PLAN.json';
for(const p of [repairedPath,packPath,diagramPath])if(!fs.existsSync(p))throw Error('ZWR_VFR_W9_INPUT_REQUIRED:'+p);
const repaired=JSON.parse(fs.readFileSync(repairedPath,'utf8'));
const pack=JSON.parse(fs.readFileSync(packPath,'utf8'));
const diagrams=JSON.parse(fs.readFileSync(diagramPath,'utf8'));
const reportIr=await buildZwrVfrDeepPublicationIr({pack,repairedResult:repaired});
const pagePlan=buildZwrVfrPagePlan({sections:reportIr.sections});
const pageCheck=validateZwrVfrPagePlan({diagramIds:diagrams.diagrams.map(d=>d.id),pages:pagePlan,sections:reportIr.sections});
if(!pageCheck.accepted)throw Error('ZWR_VFR_PAGE_PLAN_INVALID:'+pageCheck.reasons.join(','));
fs.writeFileSync(pagePath,JSON.stringify(pagePlan,null,2)+'\n');
fs.writeFileSync(publicationPath,JSON.stringify(reportIr,null,2)+'\n');
fs.writeFileSync(fitPlanPath,JSON.stringify({schemaVersion:ZWR_VFR_FIT_PROFILE_VERSION,pageCount:pagePlan.length,...pageCheck.fitProfile},null,2)+'\n');
const renderCacheKey=zwrVfrDeepPublicationCacheIdentity({
 authorityDigest:pack.authorityDigest,
 repairedResultDigest:repaired.resultDigest,
 pagePlanVersion:ZWR_VFR_PAGE_PLAN_VERSION,
 diagramDataVersion:ZWR_VFR_DIAGRAM_DATA_VERSION,
 diagramDataDigest:diagrams.diagramDataDigest,
 visualBindingVersion:ZWR_VFR_VISUAL_BINDING_VERSION,
 rendererVersion:ZWR_VFR_RENDERER_VERSION,
 publicationIrVersion:ZWR_VFR_DEEP_PUBLICATION_IR_VERSION
});
const renderCacheRecord={
 schemaVersion:'ZWR-VFR-R1-DEEP-RENDER-CACHE-v1',
 fitProfileVersion:ZWR_VFR_FIT_PROFILE_VERSION,
 cacheKey:renderCacheKey,
 authorityDigest:pack.authorityDigest,
 repairedResultDigest:repaired.resultDigest,
 publicationIrDigest:reportIr.publicationIrDigest,
 pagePlanVersion:ZWR_VFR_PAGE_PLAN_VERSION,
 diagramDataVersion:ZWR_VFR_DIAGRAM_DATA_VERSION,
 diagramDataDigest:diagrams.diagramDataDigest,
 visualBindingVersion:ZWR_VFR_VISUAL_BINDING_VERSION,
 rendererVersion:ZWR_VFR_RENDERER_VERSION,
 providerCallsDuringRerender:0
};
if(fs.existsSync(renderCachePath)){
 const prior=JSON.parse(fs.readFileSync(renderCachePath,'utf8'));
 if(prior.cacheKey===renderCacheKey&&JSON.stringify(prior)!==JSON.stringify(renderCacheRecord))throw Error('ZWR_VFR_DEEP_RENDER_CACHE_CONFLICT');
}
fs.writeFileSync(renderCachePath,JSON.stringify(renderCacheRecord,null,2)+'\n');
if(pagePlan.length<50||pagePlan.length>80)throw Error('ZWR_VFR_PAGE_COUNT_OUTSIDE_BILINGUAL_RANGE');
if(diagrams.diagramCount!==15)throw Error('ZWR_VFR_DIAGRAM_COUNT_DRIFT');

const styles=ZWR_VFR_STYLES;

const body=renderZwrVfrReview({reportIr,diagramData:diagrams,pagePlan});
const reviewScript=`
window.prepareZwrPrint=async()=>{document.documentElement.classList.add("zv-print-preparing");await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));window.print();};
window.addEventListener("afterprint",()=>document.documentElement.classList.remove("zv-print-preparing"));
window.addEventListener("load",async()=>{
 const imgs=[...document.images];
 const unique=[...new Map(imgs.map(i=>[i.currentSrc||i.src,i])).values()];
 await Promise.all(unique.map(async i=>{try{if(!i.complete)await i.decode();}catch{}}));
 const pages=[...document.querySelectorAll(".zv-page")];
 const over=pages.filter(p=>{const footer=p.querySelector("footer"),main=p.querySelector("main");return p.scrollHeight>p.clientHeight+2||(footer&&main&&main.getBoundingClientRect().bottom>footer.getBoundingClientRect().top+1)});
 const empty=[...document.querySelectorAll(".zv-empty")];
 const broken=unique.filter(i=>!i.naturalWidth);
 const overflowLabels=over.map(p=>[p.dataset.pageNumber,p.dataset.sectionId||"-",p.dataset.pageKey||"-"].join(":"));
 window.zwrVfrReviewQuality={pages:pages.length,overflowPages:over.map(p=>Number(p.dataset.pageNumber)),overflowLabels,missingRenderer:empty.length,brokenImages:broken.map(i=>i.src)};
 document.querySelector("#fit").textContent="pages="+pages.length+" · overflow="+over.length+(over.length?" ["+overflowLabels.join(", ")+"]":"")+" · missing-renderer="+empty.length+" · broken-images="+broken.length;
});
`;
const html=[
 '<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8">',
 '<meta name="viewport" content="width=device-width,initial-scale=1">',
 '<link rel="preconnect" href="https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev" crossorigin>',
 '<link rel="dns-prefetch" href="//pub-1967bc5812ee4164b19a806fb1427021.r2.dev">',
 '<title>Zi Wei VFR R1 Human Review</title><style>',styles,'</style></head><body>',
 '<section class="review-shell"><h1>Zi Wei VFR R1 · Browser / Print Human Review</h1>',
 '<p>Deep Manuscript W8 PASS · repaired completeness PASS · 0 semantic review · ',String(pagePlan.length),' pages · 15 deterministic diagrams · rerender provider calls 0.</p>',
 '<p>请同时检查桌面浏览、打印预览、双语语义、紫微专业度、生活解释深度、diagram 信息密度与页面越界。</p>',
 '<button onclick="window.prepareZwrPrint()">打印／保存 PDF</button>',
 '<p>只有人工确认后才运行：<code>npm run accept:vfr:zwr-human-review -- ACCEPT</code></p>',
 '<p id="fit">checking page fit…</p></section><main>',
 body,
 '</main><script>',reviewScript,'</script></body></html>'
].join('');
fs.mkdirSync('tools/review',{recursive:true});
fs.writeFileSync('tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html',html);
console.log('PASS built ZWR-VFR-R1-HUMAN-REVIEW.html from REPAIRED-RESULT.json: '+pagePlan.length+' rendered pages; 15 deterministic diagrams exactly once; adaptive fit plan persisted; provider calls=0.');
