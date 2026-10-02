import fs from 'node:fs';
import path from 'node:path';
import {buildZiweiR5AuthoringPack} from '../functions/personal-reading/narrative/ziwei-r5-authoring-pack.js';

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-01-en.json','utf8'));
const outDir='docs/reports/ziwei/professional-synthesis-r5/authoring';
fs.mkdirSync(outDir,{recursive:true});

function md(pack){
 const zh=pack.locale==='zh-Hans';
 const lines=['# '+(zh?'Zi Wei R5｜专业综合长文 Authoring Pack':'Zi Wei R5 | Professional Synthesis Authoring Pack'),''];
 lines.push('> '+(zh?'用途：把受治理的紫微结构交给 ChatGPT Sol 进行人工协作写作。此文件不是计算器，也不是生产成品。':'Purpose: give governed Zi Wei structure to ChatGPT Sol for human-collaborative writing. This file is neither a calculator nor a production report.'),'');
 lines.push('- schemaVersion: '+pack.schemaVersion,'- sourceVersion: '+pack.sourceVersion,'- apiKeyRequired: false','- liveProviderRequired: false','- sectionCount: '+pack.sectionCount,'');
 for(const s of pack.sections){
  lines.push('---','','## '+s.sectionId+'｜'+s.title,'');
  lines.push('### '+(zh?'写作目标':'Authoring contract'),'');
  for(const x of s.authoringContract.requiredShape)lines.push('- '+x);
  lines.push('- '+(zh?'目标篇幅：':'Target depth: ')+s.authoringContract.targetDepth,'');
  lines.push('### '+(zh?'重点摘要':'Key insights'),'');
  for(const x of s.keyInsights)lines.push('- '+x);
  lines.push('','### '+(zh?'宫位范围':'Palace scope'),'');
  lines.push('- '+(zh?'主宫位：':'Primary: ')+(s.primaryPalaces.join(', ')||'—'));
  lines.push('- '+(zh?'关联宫位：':'Context: ')+(s.contextPalaces.join(', ')||'—'),'');
  lines.push('### '+(zh?'受治理综合命题':'Governed synthesis claims'),'');
  for(const c of s.claims){
   lines.push('#### '+c.role+' · '+c.claimType,'',c.text,'');
   if(c.conditions.length)lines.push((zh?'**条件：** ':'**Conditions:** ')+c.conditions.join('； '),'');
   if(c.counterweights.length)lines.push((zh?'**反向／张力：** ':'**Counterweights:** ')+c.counterweights.join('； '),'');
   if(c.timing.length)lines.push((zh?'**时序：** ':'**Timing:** ')+c.timing.map(t=>t.layer+(t.focus&&t.focus.natalDomainCode?'→'+t.focus.natalDomainCode:'')).join('； '),'');
  }
  lines.push('### '+(zh?'交给 ChatGPT 的固定指令':'Fixed instruction for ChatGPT'),'');
  lines.push(zh?'仅依据本节以上资料写作，不补入资料中没有出现的紫微规则。写成连续、专业、可出版的紫微斗数长文，不要逐颗星做字典式解释；必须先形成整节主论点，再展开宫位组合、网络、条件、张力、时序与现实核对。':'Write only from the material above. Do not add Zi Wei rules absent from the pack. Produce continuous, professional, publication-grade long-form interpretation. Do not use a star-dictionary structure; establish the section thesis first, then develop palace composition, network, conditions, strain, timing and lived comparison.','');
 }
 return lines.join('\n');
}

const manifest={work:'ZIWEI-R5-AUTHORING-PACK',status:'READY_FOR_CHATGPT_AUTHORING',apiKeyRequired:false,liveProviderRequired:false,localGenerationCostUSD:0,files:[],productionAdmissionGranted:false};
for(const pair of [['zh-Hans','ZH'],['en','EN']]){
 const locale=pair[0],suffix=pair[1];
 const pack=await buildZiweiR5AuthoringPack({evidence:fixture.evidence,locale});
 if(pack.sectionCount!==10)throw Error('ZIWEI_R5_AUTHORING_SECTION_COUNT:'+locale+':'+pack.sectionCount);
 const jsonPath=path.join(outDir,'ZIWEI-R5-AUTHORING-PACK-'+suffix+'.json');
 const mdPath=path.join(outDir,'ZIWEI-R5-AUTHORING-PACK-'+suffix+'.md');
 fs.writeFileSync(jsonPath,JSON.stringify(pack,null,2)+'\n');
 fs.writeFileSync(mdPath,md(pack)+'\n');
 manifest.files.push({locale,jsonPath,mdPath,sections:pack.sections.map(s=>s.sectionId)});
 console.log('PASS wrote',jsonPath);
 console.log('PASS wrote',mdPath);
}
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('READY Zi Wei R5 authoring pack · no OpenAI API call required.');
