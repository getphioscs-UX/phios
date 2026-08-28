import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const hash=value=>createHash('sha256').update(value).digest('hex');
export const BASELINE='abab6b358bff574c65b9dfacc7985d5de564d674';
export const RESEARCH='content/customer-experience-rebuild/r12r4b/smr/enrichment/w0-w2';
export function measureDepth(root=process.cwd()){
 const input='content/customer-experience-rebuild/r12r4b/smr/review/smr-human-review-cases-v1.json';
 const cases=JSON.parse(fs.readFileSync(path.join(root,input),'utf8')).cases.map(c=>{
  const paragraphs=c.report.sections.flatMap(s=>s.paragraphs.map(p=>p.text.trim().replace(/\r\n/g,'\n'))).filter(Boolean);
  const counts=new Map();for(const p of paragraphs)counts.set(p,(counts.get(p)||0)+1);
  return {caseId:c.caseId,methodId:c.methodId,locale:c.locale,intentId:c.intentId,unitCount:c.report.technicalAppendix.interpretationUnits.length,paragraphCount:paragraphs.length,uniqueParagraphCount:counts.size,maxExactRepeat:Math.max(...counts.values()),bodySha256:hash(JSON.stringify(paragraphs))};
 });
 const groups=[...new Set(cases.map(c=>`${c.methodId}/${c.locale}`))].sort().map(key=>{
  const rows=cases.filter(c=>`${c.methodId}/${c.locale}`===key);
  return {key,caseCount:rows.length,intentCount:new Set(rows.map(c=>c.intentId)).size,distinctBodyCount:new Set(rows.map(c=>c.bodySha256)).size,sample:rows[0]};
 });
 return {schemaVersion:'PHIOS-SMR-DEPTH-AUDIT-v1',baselineCommit:BASELINE,measurement:'Ordered trimmed section paragraph text only; excludes headings, IDs, intent metadata and technical appendix. Exact duplicates, not semantic similarity or a human acceptance score.',caseCount:cases.length,groups,cases};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(measureDepth(),null,2));
