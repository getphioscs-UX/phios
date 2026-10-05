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

let zhChars=0,enWords=0;
for(const row of result.rawManuscriptSections){
 const zh=String(row.zhHansManuscript||'').trim();
 const en=String(row.enManuscript||'').trim();
 assert(zh.length>=650,row.sectionId+': Chinese manuscript too short');
 assert(en.length>=1200,row.sectionId+': English manuscript too short');
 assert(zh.split(/\n\s*\n/u).filter(Boolean).length>=5,row.sectionId+': Chinese manuscript needs at least 5 paragraphs');
 assert(en.split(/\n\s*\n/u).filter(Boolean).length>=5,row.sectionId+': English manuscript needs at least 5 paragraphs');
 assert(!/^\s*[-*•]/mu.test(zh),row.sectionId+': Chinese manuscript must not be bullet-led');
 assert(!/^\s*[-*•]/mu.test(en),row.sectionId+': English manuscript must not be bullet-led');
 zhChars+=zh.length;
 enWords+=en.split(/\s+/).filter(Boolean).length;
}
assert(zhChars>7500,'five-call Chinese manuscript not materially deeper than summary mode');
assert(enWords>1500,'five-call English manuscript not materially deeper than summary mode');

console.log('PASS ZWR-VFR five-call experiment: calls='+result.providerUsage.providerCalls+'; semantic review=0; cost=$'+Number(result.providerUsage.estimatedProviderCost).toFixed(6)+'; input='+result.providerUsage.inputTokens+'; output='+result.providerUsage.outputTokens+'; sections=10; chapter-first deep manuscripts complete.');
