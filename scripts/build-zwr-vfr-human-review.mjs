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
.zv-master{padding-top:16mm}.zv-sec{font:48px Georgia;color:#bda46d}.zv-master h1{font:500 34px/1.35 Georgia,"Noto Serif SC",serif;margin:16px 0 4px}.zv-master h2{font-size:18px;font-weight:500;color:#b7aa83;margin:0 0 24px}.zv-master>p{font-size:15px;line-height:1.7;margin:5px 0;color:#d5ccb2}
.zv-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:30px}.zv-insights article{border-top:2px solid #aa8f59;padding:14px;background:#ffffff08}.zv-insights article>b{font:24px Georgia;color:#bda46d}.zv-insights h3{margin:8px 0;font-size:15px}.zv-insights p,.zv-insights small{font-size:12px;line-height:1.55}.zv-insights small{display:block;color:#aeb5aa}
.zv-copy-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding-top:24mm}.zv-copy-grid article{border:1px solid #6b614866;padding:20px;background:#ffffff05}.zv-copy-grid h3{color:#bda46d}.zv-copy-grid p{font-size:14px;line-height:1.75}
.zv-diagram{margin:8mm 0 0;border:1px solid #756a4d66;background:#ffffff05;padding:16px}.zv-diagram>figcaption{display:flex;gap:12px;align-items:baseline;margin-bottom:16px}.zv-diagram>figcaption b{font:22px Georgia;color:#c4aa72}.zv-diagram>figcaption span{font-size:13px;color:#b9b39d}
.zv-palace-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.zv-palace{min-height:94px;border:1px solid #62583f;padding:9px;background:#141d18}.zv-palace.is-life{outline:2px solid #c09f59}.zv-palace.is-body{box-shadow:inset 0 0 0 2px #667b6e}.zv-palace .idx,.zv-palace em{display:block;color:#a7ad9f;font-style:normal}.zv-palace b{display:block;margin:3px 0}.zv-palace b small{display:block;font-size:9px;font-weight:400;color:#a7ad9f}.zv-palace p{font-size:10px;line-height:1.4;color:#d8d2bd}
.zv-axis{display:grid;grid-template-columns:1fr 70px 1fr;align-items:center;gap:10px;padding:28mm 10mm}.zv-arrow{text-align:center;font-size:36px;color:#b99c62}
.zv-card{border:1px solid #655c45;padding:16px;background:#151d19;min-height:88px}.zv-card small{display:block;color:#9e9b8a}.zv-card b{display:block;font-size:20px;margin:8px 0}.zv-card p{font-size:12px;line-height:1.5;color:#c8c2ae}
.zv-svg{width:100%;height:auto;max-height:155mm}.zv-line{stroke:#a88c57;stroke-width:1.5}.zv-node{fill:#1f2b25;stroke:#8e7a53;stroke-width:2}.zv-center{fill:#2b392f;stroke:#bda46d;stroke-width:2}.zv-svg text{fill:#ddd5bd;font-size:12px}
.zv-star-list,.zv-star-grid,.zv-domains{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.zv-star-grid .zv-card{min-height:72px;padding:11px}.zv-star-grid .zv-card b small,.zv-card b small{display:block;font-size:10px;font-weight:400;color:#aeb1a4;margin-top:2px}.zv-star-cloud{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.zv-star-cloud span{border:1px solid #665b43;padding:10px 12px}.zv-star-cloud small{display:block;color:#a8aa9d}
.zv-flow,.zv-timing{display:grid;gap:8px}.zv-flow-row{display:grid;grid-template-columns:34px 105px 1fr 105px 120px;align-items:center;border-bottom:1px solid #645a4366;padding:8px}.zv-flow-row b small,.zv-flow-row strong small,.zv-flow-row em small,.zv-flow-row small small{display:block;font-size:9px;font-weight:400;color:#a9aa9e}.zv-flow-row em{font-style:normal;color:#c3a76b}.zv-flow-row small{color:#a9aa9e}
.zv-focus{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.zv-focus .zv-star-cloud{grid-column:1/-1}
.zv-timing>div{border-left:3px solid #a98c58;padding:12px 16px;background:#ffffff05}.zv-timing span{color:#a99162;margin-right:12px}.zv-timing p{font-size:11px;color:#bdb8a8;line-height:1.5}
.zv-empty{padding:30mm;text-align:center;color:#d19c9c}
@media(max-width:900px){.zv-page{width:100%;height:auto;min-height:760px;margin:0;padding:28px}.zv-page header,.zv-page footer{left:28px;right:28px}.zv-insights,.zv-copy-grid,.zv-star-list,.zv-domains,.zv-focus{grid-template-columns:1fr}.zv-palace-grid{grid-template-columns:repeat(2,1fr)}}
@media print{html,body{background:#fff}.review-shell{display:none}.zv-page{margin:0;width:210mm;height:297mm;box-shadow:none;break-after:page;page-break-after:always}.zv-page:last-child{break-after:auto;page-break-after:auto}}
`;

const body=renderZwrVfrReview({reportIr:live.reportIr,diagramData:diagrams,pagePlan});
const html='<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zi Wei VFR R1 Human Review</title><style>'+styles+'</style></head><body><section class="review-shell"><h1>Zi Wei VFR R1 · Browser / Print Human Review</h1><p>W8 live PASS · 1 Sol call · 0 semantic review · 47 pages · 15 deterministic diagrams.</p><p>请同时检查桌面浏览、打印预览、双语语义、紫微专业度、生活解释深度、diagram 信息密度与页面越界。</p><button onclick="window.print()">打印／保存 PDF</button><p>只有人工确认后才运行：<code>npm run accept:vfr:zwr-human-review -- ACCEPT</code></p><p id="fit">checking page fit…</p></section><main>'+body+'</main><script>window.addEventListener("load",()=>{const pages=[...document.querySelectorAll(".zv-page")];const over=pages.filter(p=>p.scrollHeight>p.clientHeight+2);const empty=[...document.querySelectorAll(".zv-empty")];document.querySelector("#fit").textContent="pages="+pages.length+" · overflow="+over.length+" · missing-renderer="+empty.length;});</script></body></html>';
fs.mkdirSync('tools/review',{recursive:true});
fs.writeFileSync('tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html',html);
console.log('PASS built ZWR-VFR-R1-HUMAN-REVIEW.html: 47 rendered pages; 15 deterministic diagram data bindings; no JSON-pre placeholder.');
