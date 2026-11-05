import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {professionalConsolidationBytes,financialServiceScopeBytes} from './lib/professional-consolidation-successor-r1.mjs';
import {historicalPisBytes} from './lib/page-consolidation-successor-r1.mjs';
const record=JSON.parse(fs.readFileSync('content/web/index-surfaces/professional-service-scope-successor-r1.json'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(professionalConsolidationBytes(record.file,record.previousSha256)),record.previousSha256);
const consolidation=JSON.parse(fs.readFileSync('content/web/index-surfaces/page-consolidation-configuration-profile-successor-r1.json'));
assert.equal(hash(historicalPisBytes(record.file)),consolidation.surfaces.find(s=>s.file===record.file).previousSha256);
const financial=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-financial-service-scope-successor-v7.json'));
assert.equal(hash(financialServiceScopeBytes(financial.file,financial.previousSha256).before),financial.previousSha256);
historicalPisBytes(financial.file);
const root=process.cwd(),professionalRecord='content/web/index-surfaces/professional-service-scope-successor-r1.json',financialRecord='content/web/index-surfaces/pis-financial-service-scope-successor-v7.json';
const files=[professionalRecord,financialRecord,record.file,record.previousPath,record.predecessor.path,financial.file,financial.previousPath,financial.predecessor.path];
const temp=fs.mkdtempSync(path.join(root,'.tmp/pis-service-scope-negative-'));
try{
  for(const file of files){const destination=path.join(temp,file);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(file,destination);}
  process.chdir(temp);
  const professionalBytes=fs.readFileSync(record.file);
  const altered=parseHTML(professionalBytes.toString()).document;altered.querySelector('h1').textContent='Altered approved title';
  const alteredBytes=Buffer.from(altered.toString());fs.writeFileSync(record.file,alteredBytes);fs.writeFileSync(professionalRecord,JSON.stringify({...record,sha256:hash(alteredBytes)}));
  assert.throws(()=>professionalConsolidationBytes(record.file,record.previousSha256),/content\/visual\/runtime changed/);
  fs.writeFileSync(record.file,professionalBytes);fs.writeFileSync(professionalRecord,JSON.stringify({...record,humanAcceptanceGranted:true}));
  assert.throws(()=>professionalConsolidationBytes(record.file,record.previousSha256));
  const financialDocument=parseHTML(fs.readFileSync(financial.file,'utf8')).document,section=financialDocument.getElementById('business-services');section.appendChild(financialDocument.createElement('form'));
  const privateInputBytes=Buffer.from(financialDocument.toString());fs.writeFileSync(financial.file,privateInputBytes);
  fs.writeFileSync(financialRecord,JSON.stringify({...financial,sha256:hash(privateInputBytes),businessSectionSha256:hash(Buffer.from(section.outerHTML))}));
  assert.throws(()=>financialServiceScopeBytes(financial.file,financial.previousSha256),/cannot collect private records/);
}finally{process.chdir(root);assert.ok(path.resolve(temp).startsWith(path.resolve(root,'.tmp')+path.sep));fs.rmSync(temp,{recursive:true,force:true});}
console.log('PASS professional/financial PIS lineage; exact declared deltas; unauthorized copy, private forms and acceptance escalation rejected.');
