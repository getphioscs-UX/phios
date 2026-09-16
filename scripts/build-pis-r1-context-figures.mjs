import fs from 'node:fs';
const registry=JSON.parse(fs.readFileSync('content/web-production/registries/client-visual-asset-registry-v1.8.json'));
const groups={
 'explore/how-it-works/index.html':[[2,'现实旅程总览'],[5,'阅读、证据与下一步'],[12,'现实旅程全图']],
 'reality/index.html':[[3,'个人现实流程'],[13,'从当下处境开始'],[14,'重新整理处境'],[15,'阅读现实'],[16,'证据如何形成'],[17,'选择方向'],[18,'行动与方向'],[19,'回顾现实'],[20,'反馈与持续跟进'],[21,'已知与未知的边界'],[25,'个人现实图'],[27,'个人持续跟进'],[28,'保存的现实与旅程']],
 'professional/financial/index.html':[[4,'财务处境总览'],[29,'财务处境关系图'],[30,'收入与支出'],[31,'资产与负债'],[32,'现金流'],[33,'风险与限制'],[34,'财务决定流程'],[35,'持续跟进财务处境'],[36,'证据与决定的边界']],
 'perspectives/index.html':[[22,'出生资料的构成'],[23,'资料、方法与计算'],[24,'计算与模型视角'],[26,'已知、未知与解释']],
 'academy/index.html':[[37,'学习结构'],[38,'从知识走向练习'],[39,'证据与推论'],[40,'能力的逐步发展'],[41,'持续学习']],
 'professional/index.html':[[6,'专业指导流程'],[44,'不确定性的边界'],[45,'信息来源与脉络'],[46,'专业判断的边界'],[49,'专业行动']]
};
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const rows=[];
for(const [file,figures]of Object.entries(groups)){
 let html=fs.readFileSync(file,'utf8');const begin='<!-- PIS CONTEXT FIGURES START -->',end='<!-- PIS CONTEXT FIGURES END -->';
 const cards=figures.map(([n,zh])=>{const code='FIG-'+String(n).padStart(3,'0'),a=registry.assets.find(x=>x.assetCode===code);if(!a?.r2.remoteVerified)throw Error(code+' is not verified');const en=a.title.replace('Cashflow Runtime','Cashflow').replace('Saved Reality / Journey State','Saved reality and journey');rows.push({code,file,key:a.r2.objectKey,en,zh});return `<figure><a data-pis-figure-link target="_blank" rel="noopener"><img data-px2-asset="${code}" alt="" aria-hidden="true" loading="lazy" decoding="async"></a><figcaption data-pis-copy data-cx-en="${esc(en)}" data-cx-zh="${zh}">${esc(en)}</figcaption></figure>`}).join('');
 const section=begin+`<section class="pis-editorial pis-visual-story" data-pis-context-figures><h2 data-pis-copy data-cx-en="Explore the visual summaries" data-cx-zh="展开主题总结图">Explore the visual summaries</h2><p data-pis-copy data-cx-en="These diagrams offer another way to follow this topic. Captions are available in both languages; the original diagrams retain their original labels. Select a diagram to see its full-size image." data-cx-zh="这些图提供另一种理解本主题的方式。图题提供中英文，原图保留原有文字。点选图片可查看完整大小。">These diagrams offer another way to follow this topic. Captions are available in both languages; the original diagrams retain their original labels. Select a diagram to see its full-size image.</p><details><summary data-pis-copy data-cx-en="Show ${figures.length} related diagrams" data-cx-zh="查看 ${figures.length} 张相关总结图">Show ${figures.length} related diagrams</summary><div class="pis-editorial__grid">${cards}</div></details></section>`+end;
 if(html.includes(begin))html=html.slice(0,html.indexOf(begin))+section+html.slice(html.indexOf(end)+end.length);else html=html.replace('</main>',section+'\n</main>');
 if(!html.includes('/assets/customer-ui/js/public-index-figures.js'))html=html.replace('</body>','<script type="module" src="/assets/customer-ui/js/public-index-figures.js"></script>\n</body>');
 fs.writeFileSync(file,html);
}
fs.writeFileSync('content/web/index-surfaces/pis-r1-context-figures-v1.json',JSON.stringify({scope:'EXISTING_REGISTERED_VISUAL_SUMMARIES_NOT_NEW_DEFINITIONS',humanImageAcceptance:'OWNER_ALREADY_ACCEPTED',bindings:rows},null,2)+'\n');console.log(`Bound ${rows.length} existing diagrams to ${Object.keys(groups).length} relevant pages.`);
