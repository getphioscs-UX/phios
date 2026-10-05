import fs from 'node:fs';
import assert from 'node:assert/strict';

const root='docs/reports/ziwei/vfr-r1/five-call-experiment/';
assert(fs.existsSync(root+'REPAIRED-RESULT.json'),'missing REPAIRED-RESULT.json');
const result=JSON.parse(fs.readFileSync(root+'REPAIRED-RESULT.json','utf8'));

assert.equal(result.status,'PASS');
assert.equal(result.providerUsage.semanticReviewCalls,0);
assert(Number(result.providerUsage.totalEstimatedProviderCost)<=1,'total experiment cost exceeds USD1');
assert.equal(result.rawManuscriptSections.length,10);
assert.equal(new Set(result.rawManuscriptSections.map(s=>s.sectionId)).size,10);

function paragraphs(text){
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
for(const row of result.rawManuscriptSections){
 const zh=String(row.zhHansManuscript||'').trim();
 const en=String(row.enManuscript||'').trim();
 const zp=paragraphs(zh),ep=paragraphs(en);
 if(zh.length<650)defects.push(row.sectionId+':ZH_TOO_SHORT');
 if(en.length<1200)defects.push(row.sectionId+':EN_TOO_SHORT');
 if(zp.length<5)defects.push(row.sectionId+':ZH_TOO_FEW_PARAGRAPHS');
 if(ep.length<5)defects.push(row.sectionId+':EN_TOO_FEW_PARAGRAPHS');
 if(!completeZh(zh))defects.push(row.sectionId+':ZH_ENDS_MID_SENTENCE');
 if(!completeEn(en))defects.push(row.sectionId+':EN_ENDS_MID_SENTENCE');
 if(zp.some(p=>!completeZh(p)))defects.push(row.sectionId+':ZH_TRUNCATED_PARAGRAPH');
 if(ep.some(p=>!completeEn(p)))defects.push(row.sectionId+':EN_TRUNCATED_PARAGRAPH');
}
if(defects.length)throw new Error('ZWR_REPAIRED_RESULT_INCOMPLETE:'+defects.join(','));

console.log(
 'PASS ZWR-VFR repaired result: sections=10; semantic review=0; repairCalls='+
 result.providerUsage.repairProviderCalls+
 '; repairCost=$'+Number(result.providerUsage.repairEstimatedProviderCost).toFixed(6)+
 '; totalExperimentCost=$'+Number(result.providerUsage.totalEstimatedProviderCost).toFixed(6)+
 '; all manuscripts complete.'
);
