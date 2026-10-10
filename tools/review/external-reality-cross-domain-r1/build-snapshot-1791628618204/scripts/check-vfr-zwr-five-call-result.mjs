import fs from 'node:fs';
import assert from 'node:assert/strict';
import {ZWR_VFR_FIVE_CALL_COMPOSER_VERSION} from '../functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js';

const root='docs/reports/ziwei/vfr-r1/five-call-experiment/';
for(const name of ['PLAN.json','RESULT.json','PACK.json'])assert(fs.existsSync(root+name),'missing five-call artifact: '+name);
const plan=JSON.parse(fs.readFileSync(root+'PLAN.json','utf8'));
const result=JSON.parse(fs.readFileSync(root+'RESULT.json','utf8'));

assert.equal(plan.providerCallsPlanned,5);
assert.equal(plan.semanticReviewCallsPlanned,0);
assert.equal(plan.allowed,true);
assert.equal(result.status,'PASS');
assert.equal(result.composerVersion,ZWR_VFR_FIVE_CALL_COMPOSER_VERSION);
assert.equal(result.providerUsage.semanticReviewCalls,0);
assert(Number(result.providerUsage.providerCalls)>=1&&Number(result.providerUsage.providerCalls)<=5,'provider call count out of range');
assert(Number(result.providerUsage.estimatedProviderCost)>0);
assert(Number(result.providerUsage.estimatedProviderCost)<=1,'five-call experiment cost exceeds USD1');
assert.equal(result.sections.length,10);
assert.equal(result.rawManuscriptSections.length,10);
assert.equal(new Set(result.rawManuscriptSections.map(s=>s.sectionId)).size,10);

function splitParagraphs(text){
 return String(text||'').trim().split(/\n\s*\n/u).map(x=>x.trim()).filter(Boolean);
}
function completeZh(text){
 const t=String(text||'').trim();
 return ['。','！','？','》','）','」','』','】'].some(x=>t.endsWith(x));
}
function completeEn(text){
 const t=String(text||'').trim();
 return ['.','!','?'].includes(t.at(-1)) || ['."','!"','?"',".'","!'","?'"].some(x=>t.endsWith(x));
}

const defects=[];
const observations=[];
let zhChars=0,enWords=0;

for(const row of result.rawManuscriptSections){
 const zh=String(row.zhHansManuscript||'').trim();
 const en=String(row.enManuscript||'').trim();
 const zhParagraphs=splitParagraphs(zh);
 const enParagraphs=splitParagraphs(en);

 if(zh.length<650)defects.push({sectionId:row.sectionId,locale:'zhHans',code:'MANUSCRIPT_TOO_SHORT',actual:zh.length});
 if(en.length<1200)defects.push({sectionId:row.sectionId,locale:'en',code:'MANUSCRIPT_TOO_SHORT',actual:en.length});
 if(zhParagraphs.length<5)defects.push({sectionId:row.sectionId,locale:'zhHans',code:'TOO_FEW_PARAGRAPHS',actual:zhParagraphs.length});
 if(enParagraphs.length<5)defects.push({sectionId:row.sectionId,locale:'en',code:'TOO_FEW_PARAGRAPHS',actual:enParagraphs.length});
 if(/^\s*[-*•]/mu.test(zh))defects.push({sectionId:row.sectionId,locale:'zhHans',code:'BULLET_LED'});
 if(/^\s*[-*•]/mu.test(en))defects.push({sectionId:row.sectionId,locale:'en',code:'BULLET_LED'});
 if(!completeZh(zh))defects.push({sectionId:row.sectionId,locale:'zhHans',code:'ENDS_MID_SENTENCE',tail:zh.slice(-180)});
 if(!completeEn(en))defects.push({sectionId:row.sectionId,locale:'en',code:'ENDS_MID_SENTENCE',tail:en.slice(-180)});

 zhParagraphs.forEach((p,index)=>{
  if(!completeZh(p))defects.push({sectionId:row.sectionId,locale:'zhHans',code:'TRUNCATED_PARAGRAPH',paragraph:index+1,tail:p.slice(-180)});
 });
 enParagraphs.forEach((p,index)=>{
  if(!completeEn(p))defects.push({sectionId:row.sectionId,locale:'en',code:'TRUNCATED_PARAGRAPH',paragraph:index+1,tail:p.slice(-180)});
 });

 if(zh.length>1400)observations.push({sectionId:row.sectionId,locale:'zhHans',code:'LENGTH_ADVISORY',actual:zh.length,targetMax:1400});
 if(en.length>2800)observations.push({sectionId:row.sectionId,locale:'en',code:'LENGTH_ADVISORY',actual:en.length,targetMax:2800});

 zhChars+=zh.length;
 enWords+=en.split(/\s+/).filter(Boolean).length;
}

if(zhChars<=7500)defects.push({sectionId:'ALL',locale:'zhHans',code:'TOTAL_DEPTH_TOO_LOW',actual:zhChars});
if(enWords<=1500)defects.push({sectionId:'ALL',locale:'en',code:'TOTAL_DEPTH_TOO_LOW',actual:enWords});

const manifest={
 schemaVersion:'ZWR-VFR-R1-FIVE-CALL-COMPLETENESS-MANIFEST-v1',
 generatedAt:new Date().toISOString(),
 status:defects.length?'REJECT':'PASS',
 providerCalls:result.providerUsage.providerCalls,
 estimatedProviderCost:result.providerUsage.estimatedProviderCost,
 defectCount:defects.length,
 affectedSections:[...new Set(defects.filter(d=>d.sectionId!=='ALL').map(d=>d.sectionId))],
 defects,
 observations
};
fs.writeFileSync(root+'COMPLETENESS-MANIFEST.json',JSON.stringify(manifest,null,2)+'\n');

if(defects.length){
 console.error(
  'REJECT ZWR-VFR five-call completeness: defects='+defects.length+
  '; affectedSections='+manifest.affectedSections.join(',')+
  '; see '+root+'COMPLETENESS-MANIFEST.json'
 );
 process.exitCode=1;
}else{
 console.log(
  'PASS ZWR-VFR five-call experiment: calls='+result.providerUsage.providerCalls+
  '; semantic review=0; cost=$'+Number(result.providerUsage.estimatedProviderCost).toFixed(6)+
  '; input='+result.providerUsage.inputTokens+
  '; output='+result.providerUsage.outputTokens+
  '; sections=10; completeness PASS.'+
  (observations.length?' lengthAdvisories='+observations.length:'')
 );
}
