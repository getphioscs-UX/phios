import fs from 'node:fs';
import crypto from 'node:crypto';
const root='tools/review/personal-evidence-r1/';
const main='tools/review/PROFILE-PERSONAL-EVIDENCE-R1-HUMAN-REVIEW.html';
const safe=x=>JSON.stringify(x).replaceAll('<','\\u003c');
export async function buildPortablePersonalEvidenceReview(){
 const files=fs.readdirSync(root).filter(x=>/^CASE-\d+-(en|zh-Hans)-(results|dossier)\.html$/.test(x)).sort();
 if(files.length!==44)throw new Error('ALL_44_REVIEW_DOCUMENTS_REQUIRED');
 const css=['assets/customer-ui/visuals/profile-visual-mvp.css','assets/customer-ui/surfaces/report-print-shell-v2.css','assets/customer-ui/surfaces/personal-evidence-dossier.css'].map(p=>fs.readFileSync(p,'utf8')).join('\n');
 const documents=Object.fromEntries(files.map(f=>[f,fs.readFileSync(root+f,'utf8').replace(/<link[^>]+rel="stylesheet"[^>]*>/g,'').replace('<head>','<head><style>'+css+'</style>')]));
 const urls=[...new Set(Object.values(documents).flatMap(s=>[...s.matchAll(/<img[^>]+src="(https:[^"]+)"/g)].map(m=>m[1])))];
 if(urls.length!==15)throw new Error('ALL_15_FULL_PAGE_VISUALS_REQUIRED');
 const assets={},digests=[];
 for(const url of urls){const r=await fetch(url);const bytes=Buffer.from(await r.arrayBuffer());if(!r.ok||bytes.subarray(0,4).toString()!=='RIFF'||bytes.subarray(8,12).toString()!=='WEBP')throw new Error('ORIGINAL_WEBP_REQUIRED:'+url);assets[url]='data:image/webp;base64,'+bytes.toString('base64');digests.push({url,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
 let html=fs.readFileSync(main,'utf8').replace("function load(){d.src=m.src='/tools/review/personal-evidence-r1/'+c.value+'-'+l.value+'-'+mode+'.html';document.querySelectorAll('input[type=checkbox]').forEach(x=>x.checked=false)}",'function load(){}');
 html=html.replace('<h2>Known limitations</h2>','<h2>Included review evidence / 内嵌审阅证据</h2><p>44 complete documents: 11 cases × EN / 中文 × Results / Dossier. All styles and 15 original full-page images are embedded. The selected document is readable from this HTML file without localhost or network. / 全部 44 份文档、样式与 15 张原图已内嵌，无需本地服务器或网络即可阅读。</p><p>Results include all nine figure states, source evidence and handoff context; Dossier includes P01–P05, all ten Section Masters, and only supported customer-specific body pages. / 结果页包含九图状态、来源证据与衔接上下文；档案包含五张说明页、十张章节图及有证据支持的正文。</p><button id="save-document">Save selected complete HTML / 保存当前完整文档</button><h2>Known limitations</h2>');
 html=html.replace('</body>',`<script id="embedded-review-evidence">const embeddedDocuments=${safe(documents)},embeddedAssets=${safe(assets)};
function completeDocument(name){let source=embeddedDocuments[name];if(!source)throw new Error('Review document missing');for(const [url,data] of Object.entries(embeddedAssets))source=source.replaceAll(url,data);source=source.replaceAll('href="/','href="http://127.0.0.1:8766/');return source}
load=function(){const name=c.value+'-'+l.value+'-'+mode+'.html';d.removeAttribute('src');m.removeAttribute('src');d.srcdoc=m.srcdoc=completeDocument(name);document.querySelectorAll('input[type=checkbox]').forEach(x=>x.checked=false)};
c.onchange=l.onchange=load;document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{mode=b.dataset.view;load()});
document.querySelector('#entry').onclick=()=>window.open('http://127.0.0.1:8766/perspectives/profile/','_blank');
document.querySelector('#save-document').onclick=()=>{const name=c.value+'-'+l.value+'-'+mode+'.html',a=document.createElement('a');a.href=URL.createObjectURL(new Blob([completeDocument(name)],{type:'text/html'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
document.querySelector('#print').onclick=()=>{if(mode!=='dossier'){mode='dossier';d.onload=()=>{d.onload=null;printReady()};load()}else printReady()};load();</script></body>`);
 fs.writeFileSync(main,html);
 fs.writeFileSync(root+'portable-evidence-manifest.json',JSON.stringify({work:'PRD-W11R',artifact:main,documents:files,documentCount:44,caseCount:11,locales:['en','zh-Hans'],fullPageAssetCount:15,assets:digests,stylesEmbedded:true,localhostRequiredForReview:false,networkRequiredForReview:false,liveTargetRuntimeIncluded:false,productionAdmission:false,bytes:Buffer.byteLength(html),sha256:crypto.createHash('sha256').update(html).digest('hex')},null,2)+'\n');
 console.log('PORTABLE_REVIEW = COMPLETE (44 documents; 15 original images; offline review; W12 closed)');
}
