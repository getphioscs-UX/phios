import fs from 'node:fs';import assert from 'node:assert/strict';
const dir='content/production-closure/live-customer-commercial-convergence',input=JSON.parse(fs.readFileSync(dir+'/VISUAL-BINDING-R5-INPUT-OWNER-SOURCE.json')),receipt=JSON.parse(fs.readFileSync(dir+'/VISUAL-BINDING-R5-89-R2-VERIFICATION.json'));
const registryPath='content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json',registry=JSON.parse(fs.readFileSync(registryPath));
const stages=['household','income','assets','expenses','protection','goals','documents'];
const titles=['Financial overview','Income and expenses','Assets, liabilities and ownership','Cashflow over time','Risks and constraints','Directions and conditions','Reviewing changes'];
const pagePath='professional/financial/index.html';let html=fs.readFileSync(pagePath,'utf8');
for(let index=0;index<7;index++){
 const asset=input.assets.find(x=>Number(x.sequence)===25+index),record=receipt.records.find(x=>x.planId===asset.plan_id);assert.equal(record.decoded,true);
 const entry={assetId:asset.plan_id,type:'ILLUSTRATION',semanticName:asset.slot_intent,objectKey:record.objectKey,publicUrl:record.requestedURL,available:true,remoteVerified:true,width:record.width,height:record.height,contentHash:record.sha256,sourceRegistry:dir+'/VISUAL-BINDING-R5-INPUT-OWNER-SOURCE.json',sourceAssetCode:asset.entry_id,verificationState:'DECODE_VERIFIED_VISUAL_CANDIDATE',delivery:{loading:'lazy',decoding:'async',fetchPriority:'auto'}};
 registry.entries=registry.entries.filter(x=>x.assetId!==asset.plan_id);registry.entries.push(entry);
 const marker='data-r5-financial-guide="'+asset.plan_id+'"';
 if(!html.includes(marker)){
 const start=html.indexOf('data-cx-financial-intake-stage="'+stages[index]+'"'),end=html.indexOf('</fieldset>',start);assert(start>=0&&end>start);
 const block='<details class="r5-context-guide" '+marker+'><summary data-cx-en="Visual guide: '+titles[index]+'" data-cx-zh="图示说明：'+asset.title_zh+'">Visual guide: '+titles[index]+'</summary><figure><a href="'+record.requestedURL+'" target="_blank" rel="noopener"><img data-cx-asset="'+asset.plan_id+'" width="'+record.width+'" height="'+record.height+'" alt="'+titles[index]+' illustration" loading="lazy" decoding="async"></a><figcaption data-cx-en="'+titles[index]+' — illustrative relationships, not your calculated result. Select the image to view full size." data-cx-zh="'+asset.title_zh+'——关系示意，不是你的计算结果。点击图片查看完整大小。">'+titles[index]+' — illustrative relationships, not your calculated result. Select the image to view full size.</figcaption></figure></details>\n';
 html=html.slice(0,end)+block+html.slice(end);
 }
 // Retain the original asset and its registry, but remove this duplicated retired gallery consumer.
 html=html.replace(new RegExp('<figure><a data-pis-figure-link[^>]*><img data-px2-asset="FIG-'+String(29+index).padStart(3,'0')+'"[\\s\\S]*?</figure>'),'');
}
registry.status='PARTIAL_R5_INPUT_VERIFIED_FINANCIAL_SEVEN_BOUND';registry.work='VISUAL-BINDING-R5_EXISTING_OWNER_SUCCESSOR';fs.writeFileSync(registryPath,JSON.stringify(registry,null,2)+'\n');
if(!html.includes('surfaces/visual-binding-r5.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/customer-ui/surfaces/visual-binding-r5.css">\n</head>');
if(!html.includes('data-r5-financial-hydration'))html=html.replace('</body>','<script type="module" data-r5-financial-hydration>import {hydrateCustomerAssets} from "/assets/customer-ui/js/assets.js";document.querySelectorAll("[data-r5-financial-guide]").forEach(node=>node.addEventListener("toggle",()=>{if(node.open&&!node.dataset.hydrated){node.dataset.hydrated="true";hydrateCustomerAssets(node);}}));</script>\n</body>');
html=html.replace('Show 9 related diagrams','Show 2 related diagrams').replace('查看 9 张相关总结图','查看 2 张相关总结图');fs.writeFileSync(pagePath,html);
const mappingPath=dir+'/VISUAL-BINDING-R5-ASSET-TO-CONSUMER.json',mapping=JSON.parse(fs.readFileSync(mappingPath));mapping.bindings=mapping.bindings.filter(x=>!x.assetIdentity?.startsWith('PLAN-FIN-'));mapping.bindings.push(...stages.map((stage,i)=>({assetIdentity:input.assets.find(x=>Number(x.sequence)===25+i).plan_id,sourceFile:pagePath,consumer:'/professional/financial/',selector:'[data-cx-financial-intake-stage="'+stage+'"] [data-r5-financial-guide]',state:'SOURCE_BOUND_BROWSER_PENDING',scope:'Input explanation only; no calculation, consent or persistence change'})));fs.writeFileSync(mappingPath,JSON.stringify(mapping,null,2)+'\n');
console.log('Bound seven verified Financial illustrations to existing intake stages; missing eighth predecessor preserved.');
