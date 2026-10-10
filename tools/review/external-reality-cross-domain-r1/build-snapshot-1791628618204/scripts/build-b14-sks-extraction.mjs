import fs from 'node:fs';
import {assembleExtractionCandidates,extractionClasses,planExtraction} from './lib/structured-extraction.mjs';
const base='content/knowledge/structured/';const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const payload=assembleExtractionCandidates({discovery:read(base+'structured-knowledge-registry-v1.json'),backlinks:read(base+'structured-knowledge-backlinks-v1.json'),readBytes:p=>fs.readFileSync(p)});
payload.executionPlans=Object.fromEntries(Object.keys(extractionClasses).map(operation=>[operation,planExtraction(operation)]));
const out='docs/knowledge/structured-successor/extraction';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/b14-sks-extraction-candidates-v1.json',JSON.stringify(payload,null,2)+'\n');
console.log(`W53–W55: ${payload.candidates.length} deterministic candidates; ${payload.candidates.filter(c=>c.proposedMeaning===null).length} unresolved meanings; no AI invocation or authority writeback.`);
