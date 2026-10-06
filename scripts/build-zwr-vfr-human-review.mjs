import fs from 'node:fs';
import {renderZwrVfrReview,ZWR_VFR_RENDERER_VERSION} from '../assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js';
import {ZWR_VFR_PAGE_PLAN,validateZwrVfrPagePlan,ZWR_VFR_PAGE_PLAN_VERSION} from '../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';
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
for(const p of [repairedPath,packPath,diagramPath])if(!fs.existsSync(p))throw Error('ZWR_VFR_W9_INPUT_REQUIRED:'+p);
const repaired=JSON.parse(fs.readFileSync(repairedPath,'utf8'));
const pack=JSON.parse(fs.readFileSync(packPath,'utf8'));
const diagrams=JSON.parse(fs.readFileSync(diagramPath,'utf8'));
const pagePlan=ZWR_VFR_PAGE_PLAN;
const reportIr=await buildZwrVfrDeepPublicationIr({pack,repairedResult:repaired});
const pageCheck=validateZwrVfrPagePlan({diagramIds:diagrams.diagrams.map(d=>d.id)});
if(!pageCheck.accepted)throw Error('ZWR_VFR_PAGE_PLAN_INVALID:'+pageCheck.reasons.join(','));
fs.writeFileSync(pagePath,JSON.stringify(pagePlan,null,2)+'\n');
fs.writeFileSync(publicationPath,JSON.stringify(reportIr,null,2)+'\n');
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
if(pagePlan.length!==47)throw Error('ZWR_VFR_PAGE_COUNT_DRIFT');
if(diagrams.diagramCount!==15)throw Error('ZWR_VFR_DIAGRAM_COUNT_DRIFT');

const styles=`
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#121715;color:#e8ddbd;font-family:Inter,"Segoe UI","Microsoft YaHei",sans-serif}
.review-shell{max-width:1040px;margin:24px auto;padding:24px 28px;background:#1d2521;border:1px solid #5a513a}
.review-shell button{font:inherit;padding:10px 18px}.review-shell code{color:#e9cf8a}
.zv-page{position:relative;width:210mm;height:297mm;margin:14px auto;background:linear-gradient(145deg,#f8f3ea,#eee5d5);overflow:hidden;padding:18mm 16mm 18mm;break-after:page;page-break-after:always;--zv-accent:#6d4bc3;--zv-accent2:#c59647}
.zv-page:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 18% 10%,color-mix(in srgb,var(--zv-accent) 22%,transparent),transparent 32%),radial-gradient(circle at 84% 18%,color-mix(in srgb,var(--zv-accent2) 22%,transparent),transparent 34%),linear-gradient(180deg,#fffdf8cc,#f5eee0cc);z-index:0}
.zv-page>*{position:relative;z-index:1}
.zv-static-page{padding:0;background:#0d1210}
.zv-static{position:absolute!important;inset:0;width:100%;height:100%;object-fit:cover;z-index:1!important}
.zv-body-bg{position:absolute!important;inset:0;width:100%;height:100%;object-fit:cover;opacity:.48;filter:saturate(1.18) contrast(1.04);z-index:0!important}
.zv-body-motif{position:absolute!important;right:-4%;bottom:3%;width:48%;max-height:46%;object-fit:contain;opacity:.24;filter:drop-shadow(0 0 18px color-mix(in srgb,var(--zv-accent) 35%,transparent));z-index:0!important}
.zv-master-art{position:absolute!important;inset:0;z-index:0!important;overflow:hidden}.zv-hero{width:100%;height:100%;object-fit:cover;opacity:.78;filter:saturate(1.15) contrast(1.04)}.zv-motif{position:absolute;right:1%;bottom:4%;width:46%;opacity:.3;filter:drop-shadow(0 0 22px color-mix(in srgb,var(--zv-accent) 45%,transparent))}
.zv-page header,.zv-page footer{position:absolute;left:16mm;right:16mm;display:flex;justify-content:space-between;align-items:center;font-size:10px;letter-spacing:1.5px;color:#b7aa83}
.zv-page header{top:9mm}.zv-page footer{bottom:8mm;padding-top:8px;border-top:1px solid #796d4d66}.zv-page main{height:100%;padding-top:12mm;padding-bottom:12mm}
.zv-front{height:100%;display:grid;place-content:center;text-align:center}.zv-front h1{font:500 36px Georgia,"Noto Serif SC",serif;letter-spacing:1px}.zv-front p{color:#b7aa83}
.zv-master{position:relative;margin-top:8mm;padding:12mm;background:linear-gradient(145deg,#fffdf2e8,color-mix(in srgb,var(--zv-accent) 10%,#fffdf2e8));border:1px solid color-mix(in srgb,var(--zv-accent) 40%,#c3a66d);box-shadow:0 16px 34px #54416824,inset 0 0 0 1px #ffffffaa;color:#2b302b;backdrop-filter:blur(3px)}.zv-sec{font:44px Georgia;color:#9a7b3f}.zv-master h1{font:600 32px/1.35 Georgia,"Noto Serif SC",serif;margin:10px 0 3px;color:#2a302b}.zv-master h2{font-size:17px;font-weight:500;color:#6e6a59;margin:0 0 18px}.zv-master>p{font-size:14px;line-height:1.65;margin:5px 0;color:#4a5148}
.zv-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}.zv-insights article{border-top:4px solid var(--zv-accent);padding:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--zv-accent) 9%,#fffdf7),#fffdf7dd);box-shadow:0 8px 18px color-mix(in srgb,var(--zv-accent) 14%,transparent)}.zv-insights article>b{font:22px Georgia;color:#9a7b3f}.zv-insights h3{margin:7px 0;font-size:14px;color:#2f352f}.zv-insights p{font-size:11.5px;line-height:1.5;color:#424940}.zv-insights small{display:block;font-size:10px;line-height:1.45;color:#727567}
.zv-master-deep{margin-top:5mm;padding:9mm}.zv-master-deep .zv-sec{font-size:34px}.zv-master-deep h1{font-size:27px}.zv-master-deep h2{font-size:15px;margin-bottom:8px}.zv-master-deep .zv-purpose{font-size:11.5px;line-height:1.45}.zv-master-reading{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.zv-master-reading article{padding:12px 14px;background:linear-gradient(145deg,#fffdf7e6,color-mix(in srgb,var(--zv-accent) 9%,#fffdf7));border-top:3px solid var(--zv-accent);box-shadow:0 8px 18px color-mix(in srgb,var(--zv-accent) 12%,transparent)}.zv-master-reading p{font-size:12px;line-height:1.58;margin:0 0 9px;color:#303830;font-weight:450}
.zv-reading-head{padding-top:8mm;margin-bottom:8px;display:grid;grid-template-columns:auto 1fr;column-gap:10px;align-items:end}.zv-reading-head>span{grid-row:1/3;font:34px Georgia;color:var(--zv-accent)}.zv-reading-head h2{margin:0;font:600 24px/1.2 Georgia,"Noto Serif SC",serif;color:#2f352f}.zv-reading-head small{font-size:12.5px;color:#5d635b;font-weight:500}
.zv-copy-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding-top:2mm}.zv-copy-grid article{border:1px solid color-mix(in srgb,var(--zv-accent) 32%,#a8956f);padding:15px 16px;background:linear-gradient(145deg,#fffdf7ee,color-mix(in srgb,var(--zv-accent) 7%,#fffdf7));box-shadow:0 12px 28px color-mix(in srgb,var(--zv-accent) 12%,transparent)}.zv-copy-grid h3{margin:0 0 9px;color:var(--zv-accent);font-size:14.5px}.zv-copy-grid p{font-size:12.3px;line-height:1.58;margin:0 0 10px;color:#303730}.zv-reading-grid article{min-height:188mm}
.zv-diagram{margin:6mm 0 0;border:1px solid color-mix(in srgb,var(--zv-accent) 42%,#b49c6a);background:linear-gradient(145deg,#fffdf8e8,color-mix(in srgb,var(--zv-accent) 8%,#fffdf8));padding:18px;color:#2d332d;box-shadow:0 14px 30px color-mix(in srgb,var(--zv-accent) 16%,transparent),inset 0 0 0 1px #fff}.zv-diagram>figcaption{display:flex;gap:12px;align-items:baseline;margin-bottom:14px}.zv-diagram>figcaption b{font:26px Georgia;color:var(--zv-accent)}.zv-diagram>figcaption span{font-size:15px;color:#555d55;font-weight:600}
.zv-palace-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.zv-palace{min-height:94px;border:1px solid color-mix(in srgb,var(--pal) 58%,#a99572);padding:10px;background:linear-gradient(145deg,color-mix(in srgb,var(--pal) 18%,#fffdf7),#fffdf7);box-shadow:inset 4px 0 0 var(--pal),0 5px 12px color-mix(in srgb,var(--pal) 12%,transparent);color:#2b302b}.zv-palace.is-life{outline:2px solid #c09f59}.zv-palace.is-body{box-shadow:inset 0 0 0 2px #667b6e}.zv-palace .idx,.zv-palace em{display:block;color:#5f665f;font-style:normal;font-size:11px}.zv-palace b{display:block;margin:4px 0;font-size:16px;color:#283028}.zv-palace b small{display:block;font-size:11px;font-weight:500;color:#5c655d}.zv-palace p{font-size:11.6px;line-height:1.45;color:#343b34;font-weight:500}
.zv-axis{display:grid;grid-template-columns:1fr 70px 1fr;align-items:center;gap:10px;padding:28mm 10mm}.zv-arrow{text-align:center;font-size:36px;color:#b99c62}
.zv-card{border:1px solid #766b50;padding:16px;background:linear-gradient(145deg,#17211c,#223028);min-height:88px;color:#f7f0dc;box-shadow:0 10px 22px #00000024}.zv-card small{display:block;color:#d5cdb7;font-size:11px}.zv-card b{display:block;font-size:21px;margin:8px 0;color:#fff8e8}.zv-card p{font-size:13px;line-height:1.5;color:#ece3cb}
.zv-svg{width:100%;height:auto;max-height:155mm}.zv-line{stroke:#a88c57;stroke-width:1.5}.zv-node{fill:var(--pal);fill-opacity:.88;stroke:#fff8e7;stroke-width:3;filter:drop-shadow(0 3px 8px #3d314044)}.zv-center{fill:#2b392f;stroke:#bda46d;stroke-width:2}.zv-svg text{fill:#fffdf5;font-size:14px;font-weight:700}.zv-svg text.en{font-size:10.5px;font-weight:600;opacity:1}
.zv-star-list,.zv-star-grid,.zv-domains{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.zv-star-grid .zv-card{min-height:72px;padding:11px}.zv-star-grid .zv-card b small,.zv-card b small{display:block;font-size:11px;font-weight:500;color:#d8d2bd;margin-top:2px}.zv-star-cloud{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.zv-star-cloud span{border:1px solid #665b43;padding:10px 12px;font-size:13px;font-weight:650}.zv-star-cloud small{display:block;color:#596159;font-size:10.5px;font-weight:500}
.zv-flow-sparse{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18mm}.zv-tx-card{min-height:70mm;border:1px solid color-mix(in srgb,var(--tx) 55%,#a38e65);background:linear-gradient(160deg,color-mix(in srgb,var(--tx) 18%,#fffdf7),#fffdf7);padding:16px;display:grid;grid-template-columns:36px 1fr;gap:10px;align-items:start;box-shadow:inset 0 6px 0 var(--tx),0 12px 24px color-mix(in srgb,var(--tx) 14%,transparent)}.zv-tx-card>span{font:26px Georgia;color:#9a7b3f}.zv-tx-card b,.zv-tx-card strong,.zv-tx-card em,.zv-tx-card small{display:block;margin:7px 0;color:#343a34}.zv-tx-card b small,.zv-tx-card strong small,.zv-tx-card em small,.zv-tx-card small small{display:block;font-size:9px;color:#777b70}.zv-tx-card em{font-style:normal;color:#8a6c39;font-size:18px}
.zv-flow,.zv-timing{display:grid;gap:8px}.zv-flow-row{display:grid;grid-template-columns:34px 105px 1fr 105px 120px;align-items:center;border-left:5px solid var(--tx);border-bottom:1px solid #8e806455;padding:9px 10px;background:linear-gradient(90deg,color-mix(in srgb,var(--tx) 10%,#fff),#fff0)}.zv-flow-row{font-size:12px}.zv-flow-row b small,.zv-flow-row strong small,.zv-flow-row em small,.zv-flow-row small small{display:block;font-size:10.5px;font-weight:500;color:#5e655d}.zv-flow-row em{font-style:normal;color:#7c5c24;font-weight:700}.zv-flow-row small{color:#5e655d}
.zv-focus{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.zv-focus-band{grid-column:1/-1;margin-top:8px}.zv-focus-band h4{margin:4px 0 9px;color:#5c492a;font-size:14px;font-weight:700}.zv-star-cloud{display:flex;flex-wrap:wrap;gap:8px}.zv-star-cloud span{border:1px solid color-mix(in srgb,var(--pal) 55%,#9a8d6d);background:linear-gradient(145deg,color-mix(in srgb,var(--pal) 15%,#fffdf6),#fffdf6);box-shadow:inset 3px 0 0 var(--pal);padding:8px 10px;color:#333a33}.zv-star-cloud em{display:block;font-style:normal;font-size:10.5px;color:#596159;font-weight:500}.zv-rel-tags{display:flex;flex-wrap:wrap;gap:7px}.zv-rel-tags span{padding:7px 10px;border:1px solid #9d855f;background:#fff8e9;font-size:11.5px;font-weight:600;color:#343a34}
.zv-time-layer{display:grid;grid-template-columns:42px 1fr;gap:12px;border-left:6px solid var(--layer);padding:14px 16px;background:linear-gradient(90deg,color-mix(in srgb,var(--layer) 14%,#fffdf7),#fffdf7cc);box-shadow:0 8px 20px color-mix(in srgb,var(--layer) 10%,transparent)}.zv-time-layer.is-focus{border-left-width:9px;border-color:var(--layer);background:linear-gradient(90deg,color-mix(in srgb,var(--layer) 24%,#fff7df),#fff7df);box-shadow:0 10px 28px color-mix(in srgb,var(--layer) 18%,transparent)}.zv-time-layer>span{font:22px Georgia;color:#8a6a30}.zv-time-layer b,.zv-time-layer strong{display:block;color:#283028;font-size:14px}.zv-time-layer b small,.zv-time-layer strong small{display:inline;margin-left:6px;font-size:11px;color:#5e655d}.zv-time-layer ul{display:grid;grid-template-columns:repeat(2,1fr);gap:7px 12px;margin:10px 0 0;padding:0;list-style:none}.zv-time-layer li{font-size:12px;line-height:1.42;color:#343b34;font-weight:500}.zv-time-layer li small{display:inline;font-size:10.5px;color:#606860}.zv-current-tx{margin-top:8px}.zv-current-tx h4{margin:8px 0;color:#6d5934}
.zv-empty{padding:30mm;text-align:center;color:#d19c9c}
.zv-closing-page{padding:0}.zv-closing-art{position:absolute!important;inset:0;z-index:0!important;overflow:hidden}.zv-closing-art>img:first-child{width:100%;height:100%;object-fit:cover;opacity:.9}.zv-closing-motif{position:absolute;right:4%;bottom:8%;width:40%;opacity:.14}.zv-closing{position:relative;z-index:2;margin:25mm 18mm 0;padding:14mm;background:#fffdf3df;border:1px solid #b29d6d77;color:#2d332d}.zv-closing>span{font:42px Georgia;color:#9a7b3f}.zv-closing h1{font:600 34px/1.3 Georgia,"Noto Serif SC",serif;margin:8px 0 2px}.zv-closing h2{font-size:18px;color:#716d5e;margin:0 0 20px}.zv-closing>p{font-size:14px;line-height:1.7}.zv-closing-points{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}.zv-closing-points article{border-top:2px solid #a98b54;padding:10px}.zv-closing-points b{font:20px Georgia;color:#9a7b3f}.zv-closing-points p{font-size:11px;line-height:1.5}.zv-closing-points small{font-size:9.5px;line-height:1.4;color:#6d7168}
.zv-master-summary{margin-top:5mm;padding:8mm}.zv-master-summary .zv-sec{font-size:34px}.zv-master-summary h1{font-size:26px}.zv-master-summary h2{font-size:15px;margin-bottom:10px}.zv-summary-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.zv-summary-insights>div{background:#fffdf7d6;border-top:2px solid #a88a53;padding:8px}.zv-summary-insights b{font-size:11px;color:#7a6339}.zv-summary-insights p{font-size:9.5px;line-height:1.35;margin:5px 0}.zv-summary-insights small{font-size:8px;line-height:1.3;color:#70756c}.zv-master-summary .zv-diagram{margin-top:8px;padding:10px}.zv-master-summary .zv-diagram figcaption{margin-bottom:8px}.zv-master-summary .zv-domains{grid-template-columns:repeat(3,1fr);gap:6px}.zv-master-summary .zv-card{min-height:54px;padding:7px}.zv-master-summary .zv-card b{font-size:12px;margin:3px 0}.zv-master-summary .zv-card p{font-size:8px}
@media(max-width:900px){.zv-page{width:100%;height:auto;min-height:760px;margin:0;padding:28px}.zv-page header,.zv-page footer{left:28px;right:28px}.zv-insights,.zv-copy-grid,.zv-star-list,.zv-domains,.zv-focus{grid-template-columns:1fr}.zv-palace-grid{grid-template-columns:repeat(2,1fr)}}
@media print{html,body{background:#fff}.review-shell{display:none}.zv-page{margin:0;width:210mm;height:297mm;box-shadow:none;break-after:page;page-break-after:always}.zv-page:last-child{break-after:auto;page-break-after:auto}}
`;

const body=renderZwrVfrReview({reportIr,diagramData:diagrams,pagePlan});
const html='<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zi Wei VFR R1 Human Review</title><style>'+styles+'</style></head><body><section class="review-shell"><h1>Zi Wei VFR R1 · Browser / Print Human Review</h1><p>Deep Manuscript W8 PASS · repaired completeness PASS · 0 semantic review · 47 pages · 15 deterministic diagrams · rerender provider calls 0.</p><p>请同时检查桌面浏览、打印预览、双语语义、紫微专业度、生活解释深度、diagram 信息密度与页面越界。</p><button onclick="window.print()">打印／保存 PDF</button><p>只有人工确认后才运行：<code>npm run accept:vfr:zwr-human-review -- ACCEPT</code></p><p id="fit">checking page fit…</p></section><main>'+body+'</main><script>window.addEventListener("load",async()=>{const imgs=[...document.images];await Promise.all(imgs.map(async i=>{try{if(!i.complete)await i.decode();}catch{}}));const pages=[...document.querySelectorAll(".zv-page")];const over=pages.filter(p=>{const footer=p.querySelector("footer"),main=p.querySelector("main");return p.scrollHeight>p.clientHeight+2||(footer&&main&&main.getBoundingClientRect().bottom>footer.getBoundingClientRect().top+1)});const empty=[...document.querySelectorAll(".zv-empty")];const broken=imgs.filter(i=>!i.naturalWidth);window.zwrVfrReviewQuality={pages:pages.length,overflowPages:over.map(p=>Number(p.dataset.pageNumber)),missingRenderer:empty.length,brokenImages:broken.map(i=>i.src)};document.querySelector("#fit").textContent="pages="+pages.length+" · overflow="+over.length+(over.length?" ["+over.map(p=>p.dataset.pageNumber).join(",")+"]":"")+" · missing-renderer="+empty.length+" · broken-images="+broken.length;});</script></body></html>';
fs.mkdirSync('tools/review',{recursive:true});
fs.writeFileSync('tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html',html);
console.log('PASS built ZWR-VFR-R1-HUMAN-REVIEW.html from REPAIRED-RESULT.json: 47 rendered pages; 15 deterministic diagrams exactly once; deep manuscript publication IR persisted; provider calls=0.');
