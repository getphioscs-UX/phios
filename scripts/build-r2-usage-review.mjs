import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const dir='docs/assets/r2-public/';
const http=read(dir+'r2-image-http-audit-2026-09-19.json');
const atlas=read('content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json');
const samples=read('content/web-production/registries/book-public-samples-v1.json');
const books=read('content/web-production/registries/wpr-eight-volume-r2-public-assets-v1.json');
const client=read('content/web-production/registries/client-visual-asset-registry-v1.8.json');
const publicAssets=read('content/registry/public-assets.json');
const commerce=read('content/web-production/registries/commerce-product-visuals-v1.json');
const phi=read('content/ecr-phi-card/ecr-phi-card-asset-registry-v1.json');
const tarot=read('content/public-ux/symbolic-method/registries/tarot-r2-asset-delivery-registry-v1.json');
const keySet=new Set(http.results.map(r=>r.key)),referenceMap=new Map();
function scan(directory){for(const item of fs.readdirSync(directory,{withFileTypes:true})){const path=directory+'/'+item.name;if(item.isDirectory()){scan(path);continue;}if(!/\.(json|js|css)$/.test(path))continue;const source=fs.readFileSync(path,'utf8');for(const match of source.matchAll(/(?:images|books)\/[^"'`\r\n<>]*?\.(?:webp|png|jpe?g|svg|gif|avif)/g)){let key;try{key=decodeURIComponent(match[0]);}catch{continue;}if(!keySet.has(key))continue;if(!referenceMap.has(key))referenceMap.set(key,new Set());referenceMap.get(key).add(path);}}}
for(const directory of ['content','assets','functions'])scan(directory);
const backgrounds=read('content/product-visual-platform-r1/static-assets/pvp-r1-vis-w30-static-production-asset-registry-v1.json').backgroundBindings;
const allocation=read('content/web/index-surfaces/public-index-visual-allocation-v1.json').assets;
const presentation=read('content/web/index-surfaces/pis-r1-presentation-manifest-v1.json').pages;
const routes=['reality-formation','reality-runtime','reality-continuity','reality-expansion','reality-differentiation','reality-configuration','reality-observation','reality-navigation'];
const sourceRecords=[
 ['content/web-production/registries/client-visual-asset-registry-v1.8.json',client.assets],
 ['content/registry/public-assets.json',publicAssets.assets],
 ['content/web-production/registries/wpr-eight-volume-r2-public-assets-v1.json',books.assets],
 ['content/web-production/registries/commerce-product-visuals-v1.json',commerce.assets],
 ['content/ecr-phi-card/ecr-phi-card-asset-registry-v1.json',phi.assets],
 ['content/public-ux/symbolic-method/registries/tarot-r2-asset-delivery-registry-v1.json',[tarot.cardBack,...tarot.cards]]
];
const keyOf=a=>a.object_key||a.objectKey||a.r2?.objectKey||a.bucketKey||(a.url?.split('.r2.dev/')[1]);
function usage(row){
 const background=backgrounds.find(a=>a.objectKey===row.key);
 if(background)return {role:background.surfaceRole,status:'BOUND',route:'/',source:'assets/customer-ui/js/static-atmosphere.js',consumers:background.surfaceFamilies,note:'现有静态氛围模块通过已验证登记设置 CSS 背景变量。'};
 const a=atlas.assets.find(a=>a.bucketKey===row.key);
 if(a){
  const selectors={TIMELINE_ANCHOR:['timeline','period'],CASE_HERO:['cases','case'],CASE_SECONDARY:['cases','case'],WORLD_SNAPSHOT_ATMOSPHERE:['world','snapshot'],COMPARISON_FAMILY:['comparison','family'],TRAJECTORY_MOTIF:['trajectories','trajectories'],TRANSITION_WINDOW:['transitions','tw'],LOSS_FAMILY:['loss','lossFamily'],LOSS_TYPE_VIGNETTE:['loss','lossType']};
  const select=selectors[a.family];const query=select?`atlas=${select[0]}&${select[1]}=${encodeURIComponent(a.subjectId)}`:'atlas=timeline&period=T00';
  return {title:a.subjectTitle['zh-Hans'],role:select?'图谱当前情境插画':'图谱参考图库 / '+a.family,status:a.reviewState==='ACCEPTED'?'BOUND':'LOCAL_REVIEW',route:'/books/reality-differentiation/?'+query+'&visual='+encodeURIComponent(a.assetId)+'&locale=zh-Hans#atlas',source:'content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json',note:a.reviewState==='ACCEPTED'?'已通过现有图片接受记录；线上部署仍需核验。':'已验证并接入本地审阅。现有规则在人工接受前限制生产展示。'};
 }
 const sample=samples.books.find(b=>b.cover===row.url||b.previewPages.includes(row.url)||b.figures.some(f=>f.url===row.url));
 if(sample)return {role:row.key.includes('/previews/')?'书籍免费逐页预览':row.key.includes('/covers/')?'书籍实体封面预览':'书籍 Part 总结图',status:'BOUND',route:'/books/'+routes[Number(sample.bookId.slice(5))-1]+'/#free-samples',source:'content/web-production/registries/book-public-samples-v1.json'};
 const com=commerce.assets.find(a=>a.objectKey===row.key);
 if(com)return {role:'账户购买选择器：'+com.productId,status:'BOUND',route:'/account/',source:'content/web-production/registries/commerce-product-visuals-v1.json'};
 const book=books.assets.find(a=>a.objectKey===row.key);
 if(book)return {role:book.type==='BOOK_BRANDING'?'书籍品牌图':'书籍主视觉',status:'BOUND',route:'/books/'+routes[Number(book.assetId.split('-')[1])-1]+'/',source:'content/web-production/registries/wpr-eight-volume-r2-public-assets-v1.json'};
 if(/FIVE-(?:VOLUME|BOOKS)|SEVEN-VOLUME|BOOK-6-REALITY-OBSERVATION|BOOK-7-REALITY-NAVIGATION|VOLUME-VI-REALITY-OBSERVATION|VOLUME-VII-REALITY-NAVIGATION/.test(row.key))return {role:'旧版五册／七册资料留档',status:'ARCHIVE',route:null,note:'旧编号或旧系列视觉。保留作历史资料，不用于当前八册入口。'};
 for(const [source,assets] of sourceRecords){const entry=assets.find(a=>keyOf(a)===row.key);if(!entry)continue;
  if(source.includes('phi-card'))return {role:'ECR 构型卡：'+entry.cardId,status:'REGISTERED',route:'/perspectives/personal/',source};
  if(source.includes('tarot-r2'))return {role:'塔罗抽牌与牌义图：'+(entry.cardId||'牌背'),status:'REGISTERED',route:'/perspectives/tarot/',source};
  const code=entry.assetCode||entry.asset_code,placement=allocation.find(a=>a.assetCode===code),pages=presentation.filter(p=>p.hero===code||p.images?.includes(code));
  const files=[placement?.primarySurface,...(placement?.secondarySurfaces||[])].filter(p=>p?.endsWith('.html')&&fs.existsSync(p));
  const route=pages[0]?.route||(files[0]?'/'+files[0].replace(/index\.html$/,''):null);
  return {role:placement?.semanticRole||entry.visualPurpose||entry.semanticPurpose||entry.title||code||'现有公共视觉组件',status:pages.length?'BOUND':'REGISTERED',route,source,consumers:pages.length?pages.map(p=>p.route):(files.length?files:entry.primaryConsumers||entry.expectedConsumers||[]),note:pages.length?'现有页面展示清单已绑定；当前生产部署和视觉审阅仍需核验。':'已登记；具体页面实际显示需逐项浏览器确认，源码引用不等于已展示。'};
 }
 const family=row.key.split('/')[1];const roles={background:'页面／报告背景纹理',branding:'品牌标识或品牌图',figures:'知识图示与报告说明',icons:'导航或功能图标',illustrations:'公共页面情境插画',covers:'书籍封面版本留档',hero:'页面主视觉'};
 return {role:roles[family]||'视觉素材待核对用途',status:'NEEDS_PLACEMENT',route:null,note:'有素材与用途候选；尚未证明当前运行时消费，不能计为已使用。'};
}
const rows=http.results.map(r=>({...r,...usage(r),references:[...(referenceMap.get(r.key)||[])].sort()}));
const counts=rows.reduce((out,r)=>(out[r.status]=(out[r.status]||0)+1,out),{});
const missing=read('content/civilization-atlas/maintenance/visual-activation-60247ff/r2-object-audit-v1.json').rows.filter(r=>r.result!=='VERIFIED_WEBP').map(r=>r.candidateKey);
const missingSampleFigures=samples.books.flatMap(b=>b.figures.filter(f=>f.deliveryState==='MISSING_BUCKET_OBJECT').map(f=>({bookId:b.bookId,figure:f.number,url:f.url})));
const report={observedAt:http.observedAt,bucket:'phios-public-assets',totalObjects:read(dir+'r2-bucket-inventory-2026-09-19.json').totalObjects,inventoryComplete:true,total:rows.length,httpImagePass:http.httpImagePass,counts,missingAtlasObjects:missing,missingSampleFigures,productionDeployment:'NOT_PERFORMED',allRuntimeUsageVerified:false,rows};
fs.writeFileSync(dir+'r2-usage-coverage-2026-09-19.json',JSON.stringify(report,null,2)+'\n');
const data=JSON.stringify(report).replaceAll('<','\\u003c');
fs.writeFileSync(dir+'R2-ALL-VISUAL-ASSETS-REVIEW.html',`<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>R2 全量视觉素材审核</title><style>*{box-sizing:border-box}body{overflow-wrap:anywhere;margin:0;background:#081b28;color:#eee9db;font:16px/1.65 system-ui}main{max-width:1320px;margin:auto;padding:24px}h1,h2{color:#e7ce99}a{color:#a4dbeb}input,select,button{font:inherit;padding:9px;max-width:100%;border:1px solid #68808c;border-radius:6px}button{cursor:pointer}.controls{display:flex;gap:12px;flex-wrap:wrap;align-items:end}.controls label{display:grid;gap:5px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:24px 0}article{background:#112b3b;border:1px solid #3b5360;padding:16px;border-radius:12px;overflow-wrap:anywhere}img{width:100%;height:220px;object-fit:contain;background:#fff}code{font-size:12px}summary{cursor:pointer}p{margin:.65rem 0}.notice{border-left:3px solid #d6b46d;padding:12px 20px;background:#102a3b}:focus-visible{outline:3px solid #e7ce99;outline-offset:3px}@media(max-width:750px){.grid{grid-template-columns:1fr}main{padding:16px}}</style></head><body><main><h1>R2 全量视觉素材审核</h1><p id="totals"></p><div class="notice"><p>每张图片都有用途记录。已绑定、仅本地审阅、仅登记、旧版留档和待安排会明确区分；不会把图片存在或源码引用计成线上已展示。</p><p>当前结果属于本地工作树，尚未部署。每页最多加载 12 张图。</p><p id="missing"></p></div><p><a href="../../../tools/review/BOOK-V-CIV-ATLAS-R1-M1-FINAL-HUMAN-REVIEW.html">第五册集中人工审核</a> · <a href="../../../docs/qa/commerce-stripe-r1/UNIFIED-HUMAN-REVIEW.html">统一人工审核</a></p><div class="controls"><label>搜索<input id="query" type="search" placeholder="玛雅 / HERO / 2026 / book-6"></label><label>用途状态<select id="status"><option value="">全部</option></select></label><label>文件分类<select id="folder"><option value="">全部</option></select></label><button id="prev">上一页</button><button id="next">下一页</button></div><p id="count" role="status"></p><div id="grid" class="grid"></div></main><script id="data" type="application/json">${data}</script><script>
const report=JSON.parse(document.getElementById('data').textContent),labels={BOUND:'已绑定',LOCAL_REVIEW:'仅本地审阅',REGISTERED:'已登记，待逐页验证',ARCHIVE:'旧版留档',NEEDS_PLACEMENT:'待安排展示'};let page=0;const $=id=>document.getElementById(id);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
$('totals').textContent='完整 bucket：'+report.totalObjects+' 个对象 · '+report.total+' 张图片 · HTTP 检查 '+report.httpImagePass+'/'+report.total+' · '+Object.entries(report.counts).map(([s,n])=>labels[s]+' '+n).join(' / ');
$('missing').textContent=(report.missingAtlasObjects.length?'Atlas 待补素材：'+report.missingAtlasObjects.join('；'):'Atlas 图片已齐全，229 张已按所有者授权通过，2026 重构图已接入')+'。第一册已恢复 11 张原图，仍缺 '+report.missingSampleFigures.map(f=>f.figure).join('、')+'。';
$('missing').insertAdjacentHTML('afterend','<p><a href="R2-260-DISPLAY-CHECKLIST.html">打开原 260 张逐页显示核查清单</a> · <a href="R2-260-DISPLAY-CHECKLIST.csv" download>下载 CSV</a></p>');
for(const [v,l]of Object.entries(labels))$('status').add(new Option(l,v));for(const p of [...new Set(report.rows.map(r=>r.key.split('/').slice(0,2).join('/')))].sort())$('folder').add(new Option(p,p));
function render(){const q=$('query').value.toLowerCase(),s=$('status').value,f=$('folder').value,rows=report.rows.filter(r=>(!s||r.status===s)&&(!f||r.key.startsWith(f+'/'))&&JSON.stringify([r.key,r.title,r.role]).toLowerCase().includes(q));const pages=Math.max(1,Math.ceil(rows.length/12));page=Math.min(page,pages-1);$('prev').disabled=page===0;$('next').disabled=page===pages-1;$('count').textContent=rows.length+' 张 · '+(page+1)+' / '+pages;
$('grid').innerHTML=rows.slice(page*12,page*12+12).map(r=>'<article><img loading="lazy" decoding="async" src="'+esc(r.url)+'" alt="'+esc(r.title||r.key)+'"><h2>'+esc(r.title||r.key.split('/').pop())+'</h2><p>'+esc(labels[r.status])+' · HTTP '+r.httpStatus+'</p><p>'+esc(r.role)+'</p><p>'+esc(r.note||'')+'</p><code>'+esc(r.key)+'</code><p><a href="'+esc(r.url)+'" target="_blank" rel="noopener">打开原图</a>'+(r.route?' · <a href="'+esc(r.route)+'" target="_blank" rel="noopener">打开用途页面</a>':'')+'</p><details><summary>登记与引用证据</summary><p>'+esc(r.source||'无已确认的当前登记')+'</p>'+r.references.map(p=>'<p><code>'+esc(p)+'</code></p>').join('')+'</details></article>').join('');}
$('query').oninput=$('status').onchange=$('folder').onchange=()=>{page=0;render()};$('prev').onclick=()=>{page--;render()};$('next').onclick=()=>{page++;render()};render();</script></body></html>`);
console.log({counts,missingAtlasObjects:missing,missingSampleFigures:missingSampleFigures.length});
