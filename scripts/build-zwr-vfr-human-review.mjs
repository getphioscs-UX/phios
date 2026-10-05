import fs from 'node:fs';
import {renderZwrVfrReview} from '../assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js';

const root='docs/reports/ziwei/vfr-r1';
const livePath=root+'/LIVE-RESULT.json',diagramPath=root+'/DIAGRAM-DATA.json',pagePath=root+'/PAGE-PLAN.json';
for(const p of [livePath,diagramPath,pagePath])if(!fs.existsSync(p))throw Error('ZWR_VFR_W9_INPUT_REQUIRED:'+p);
const live=JSON.parse(fs.readFileSync(livePath,'utf8'));
const diagrams=JSON.parse(fs.readFileSync(diagramPath,'utf8'));
const pagePlan=JSON.parse(fs.readFileSync(pagePath,'utf8'));
if(live.status!=='PASS')throw Error('ZWR_VFR_LIVE_RESULT_NOT_PASS');
if(pagePlan.length!==47)throw Error('ZWR_VFR_PAGE_COUNT_DRIFT');
if(diagrams.diagramCount!==15)throw Error('ZWR_VFR_DIAGRAM_COUNT_DRIFT');

const styles=`
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#121715;color:#e8ddbd;font-family:Inter,"Segoe UI","Microsoft YaHei",sans-serif}
.review-shell{max-width:1040px;margin:24px auto;padding:24px 28px;background:#1d2521;border:1px solid #5a513a}
.review-shell button{font:inherit;padding:10px 18px}.review-shell code{color:#e9cf8a}
.zv-page{position:relative;width:210mm;height:297mm;margin:14px auto;background:#101713;overflow:hidden;padding:18mm 16mm 18mm;break-after:page;page-break-after:always}
.zv-page:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 85% 15%,#7e69491f,transparent 34%),linear-gradient(160deg,#17201b,#0e1411);z-index:0}
.zv-page>*{position:relative;z-index:1}
.zv-static-page{padding:0;background:#0d1210}
.zv-static{position:absolute!important;inset:0;width:100%;height:100%;object-fit:cover;z-index:1!important}
.zv-body-bg{position:absolute!important;inset:0;width:100%;height:100%;object-fit:cover;opacity:.28;z-index:0!important}
.zv-body-motif{position:absolute!important;right:-5%;bottom:3%;width:46%;max-height:45%;object-fit:contain;opacity:.13;z-index:0!important}
.zv-master-art{position:absolute!important;inset:0;z-index:0!important;overflow:hidden}.zv-hero{width:100%;height:100%;object-fit:cover;opacity:.42}.zv-motif{position:absolute;right:2%;bottom:5%;width:42%;opacity:.18}
.zv-page header,.zv-page footer{position:absolute;left:16mm;right:16mm;display:flex;justify-content:space-between;align-items:center;font-size:10px;letter-spacing:1.5px;color:#b7aa83}
.zv-page header{top:9mm}.zv-page footer{bottom:8mm;padding-top:8px;border-top:1px solid #796d4d66}.zv-page main{height:100%;padding-top:12mm;padding-bottom:12mm}
.zv-front{height:100%;display:grid;place-content:center;text-align:center}.zv-front h1{font:500 36px Georgia,"Noto Serif SC",serif;letter-spacing:1px}.zv-front p{color:#b7aa83}
.zv-master{position:relative;margin-top:8mm;padding:12mm;background:#fffdf4d9;border:1px solid #b9a56a66;color:#2b302b;backdrop-filter:blur(2px)}.zv-sec{font:44px Georgia;color:#9a7b3f}.zv-master h1{font:600 32px/1.35 Georgia,"Noto Serif SC",serif;margin:10px 0 3px;color:#2a302b}.zv-master h2{font-size:17px;font-weight:500;color:#6e6a59;margin:0 0 18px}.zv-master>p{font-size:14px;line-height:1.65;margin:5px 0;color:#4a5148}
.zv-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}.zv-insights article{border-top:2px solid #a4874f;padding:12px;background:#fffdf7c7}.zv-insights article>b{font:22px Georgia;color:#9a7b3f}.zv-insights h3{margin:7px 0;font-size:14px;color:#2f352f}.zv-insights p{font-size:11.5px;line-height:1.5;color:#424940}.zv-insights small{display:block;font-size:10px;line-height:1.45;color:#727567}
.zv-copy-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding-top:24mm}.zv-copy-grid article{border:1px solid #6b614866;padding:20px;background:#ffffff05}.zv-copy-grid h3{color:#bda46d}.zv-copy-grid p{font-size:14px;line-height:1.75}
.zv-diagram{margin:6mm 0 0;border:1px solid #a99a7466;background:#fffef9e8;padding:16px;color:#2d332d}.zv-diagram>figcaption{display:flex;gap:12px;align-items:baseline;margin-bottom:14px}.zv-diagram>figcaption b{font:22px Georgia;color:#8e713d}.zv-diagram>figcaption span{font-size:13px;color:#6e7267}
.zv-palace-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.zv-palace{min-height:94px;border:1px solid #62583f;padding:9px;background:#141d18}.zv-palace.is-life{outline:2px solid #c09f59}.zv-palace.is-body{box-shadow:inset 0 0 0 2px #667b6e}.zv-palace .idx,.zv-palace em{display:block;color:#a7ad9f;font-style:normal}.zv-palace b{display:block;margin:3px 0}.zv-palace b small{display:block;font-size:9px;font-weight:400;color:#a7ad9f}.zv-palace p{font-size:10px;line-height:1.4;color:#d8d2bd}
.zv-axis{display:grid;grid-template-columns:1fr 70px 1fr;align-items:center;gap:10px;padding:28mm 10mm}.zv-arrow{text-align:center;font-size:36px;color:#b99c62}
.zv-card{border:1px solid #655c45;padding:16px;background:#151d19;min-height:88px}.zv-card small{display:block;color:#9e9b8a}.zv-card b{display:block;font-size:20px;margin:8px 0}.zv-card p{font-size:12px;line-height:1.5;color:#c8c2ae}
.zv-svg{width:100%;height:auto;max-height:155mm}.zv-line{stroke:#a88c57;stroke-width:1.5}.zv-node{fill:#1f2b25;stroke:#8e7a53;stroke-width:2}.zv-center{fill:#2b392f;stroke:#bda46d;stroke-width:2}.zv-svg text{fill:#ddd5bd;font-size:12px}
.zv-star-list,.zv-star-grid,.zv-domains{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.zv-star-grid .zv-card{min-height:72px;padding:11px}.zv-star-grid .zv-card b small,.zv-card b small{display:block;font-size:10px;font-weight:400;color:#aeb1a4;margin-top:2px}.zv-star-cloud{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.zv-star-cloud span{border:1px solid #665b43;padding:10px 12px}.zv-star-cloud small{display:block;color:#a8aa9d}
.zv-flow,.zv-timing{display:grid;gap:8px}.zv-flow-row{display:grid;grid-template-columns:34px 105px 1fr 105px 120px;align-items:center;border-bottom:1px solid #8e806466;padding:8px}.zv-flow-row b small,.zv-flow-row strong small,.zv-flow-row em small,.zv-flow-row small small{display:block;font-size:9px;font-weight:400;color:#74786d}.zv-flow-row em{font-style:normal;color:#8f7039}.zv-flow-row small{color:#74786d}
.zv-focus{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.zv-focus .zv-star-cloud{grid-column:1/-1}
.zv-time-layer{display:grid;grid-template-columns:42px 1fr;gap:12px;border-left:3px solid #b39a68;padding:14px 16px;background:#fffdf7cc}.zv-time-layer.is-focus{border-left-width:6px;border-color:#8d6930;background:#f5ead0}.zv-time-layer>span{font:20px Georgia;color:#9a7b3f}.zv-time-layer b,.zv-time-layer strong{display:block;color:#313731}.zv-time-layer b small,.zv-time-layer strong small{display:inline;margin-left:6px;font-size:10px;color:#6f756d}.zv-time-layer ul{display:grid;grid-template-columns:repeat(2,1fr);gap:6px 12px;margin:10px 0 0;padding:0;list-style:none}.zv-time-layer li{font-size:11px;line-height:1.35;color:#4d544b}.zv-time-layer li small{display:inline;font-size:9px;color:#777b70}.zv-current-tx{margin-top:8px}.zv-current-tx h4{margin:8px 0;color:#6d5934}
.zv-empty{padding:30mm;text-align:center;color:#d19c9c}
.zv-closing-page{padding:0}.zv-closing-art{position:absolute!important;inset:0;z-index:0!important;overflow:hidden}.zv-closing-art>img:first-child{width:100%;height:100%;object-fit:cover;opacity:.9}.zv-closing-motif{position:absolute;right:4%;bottom:8%;width:40%;opacity:.14}.zv-closing{position:relative;z-index:2;margin:25mm 18mm 0;padding:14mm;background:#fffdf3df;border:1px solid #b29d6d77;color:#2d332d}.zv-closing>span{font:42px Georgia;color:#9a7b3f}.zv-closing h1{font:600 34px/1.3 Georgia,"Noto Serif SC",serif;margin:8px 0 2px}.zv-closing h2{font-size:18px;color:#716d5e;margin:0 0 20px}.zv-closing>p{font-size:14px;line-height:1.7}.zv-closing-points{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}.zv-closing-points article{border-top:2px solid #a98b54;padding:10px}.zv-closing-points b{font:20px Georgia;color:#9a7b3f}.zv-closing-points p{font-size:11px;line-height:1.5}.zv-closing-points small{font-size:9.5px;line-height:1.4;color:#6d7168}
@media(max-width:900px){.zv-page{width:100%;height:auto;min-height:760px;margin:0;padding:28px}.zv-page header,.zv-page footer{left:28px;right:28px}.zv-insights,.zv-copy-grid,.zv-star-list,.zv-domains,.zv-focus{grid-template-columns:1fr}.zv-palace-grid{grid-template-columns:repeat(2,1fr)}}
@media print{html,body{background:#fff}.review-shell{display:none}.zv-page{margin:0;width:210mm;height:297mm;box-shadow:none;break-after:page;page-break-after:always}.zv-page:last-child{break-after:auto;page-break-after:auto}}
`;

const body=renderZwrVfrReview({reportIr:live.reportIr,diagramData:diagrams,pagePlan});
const html='<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zi Wei VFR R1 Human Review</title><style>'+styles+'</style></head><body><section class="review-shell"><h1>Zi Wei VFR R1 · Browser / Print Human Review</h1><p>W8 live PASS · 1 Sol call · 0 semantic review · 47 pages · 15 deterministic diagrams.</p><p>请同时检查桌面浏览、打印预览、双语语义、紫微专业度、生活解释深度、diagram 信息密度与页面越界。</p><button onclick="window.print()">打印／保存 PDF</button><p>只有人工确认后才运行：<code>npm run accept:vfr:zwr-human-review -- ACCEPT</code></p><p id="fit">checking page fit…</p></section><main>'+body+'</main><script>window.addEventListener("load",()=>{const pages=[...document.querySelectorAll(".zv-page")];const over=pages.filter(p=>p.scrollHeight>p.clientHeight+2);const empty=[...document.querySelectorAll(".zv-empty")];document.querySelector("#fit").textContent="pages="+pages.length+" · overflow="+over.length+" · missing-renderer="+empty.length;});</script></body></html>';
fs.mkdirSync('tools/review',{recursive:true});
fs.writeFileSync('tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html',html);
console.log('PASS built ZWR-VFR-R1-HUMAN-REVIEW.html: 47 rendered pages; 15 deterministic diagram data bindings; no JSON-pre placeholder.');
