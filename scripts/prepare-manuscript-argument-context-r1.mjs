import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const dir='content/knowledge/source-access/registries/';
const read=p=>JSON.parse(fs.readFileSync(p));
const sha=x=>createHash('sha256').update(x).digest('hex');
const write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const previous=dir+'manuscript-text-scope-candidates-v7.json';
const scope=read(previous);
const text=read('.tmp/knowledge-manuscripts/book-1-v3-revision-33c91cd60d5f/retrieval-corpus.json').records.find(r=>r.sectionCode==='B1V3-P1-S006').text;
const record=scope.records.find(r=>r.sectionCode==='B1V3-P1-S006');
const unit=record.argumentUnits.find(u=>u.argumentId==='REORGANIZATION');
// Preserve the mechanism's immediately adjacent native example and its
// explicit qualification. This changes evidence span, never source prose.
const end=text.indexOf('\n\f',unit.endOffset);
assert(end>unit.endOffset&&end-unit.startOffset<1200);
assert(text.slice(unit.endOffset,end).includes('连续运行。'));
unit.endOffset=end;unit.textSha256=sha(text.slice(unit.startOffset,end));
scope.successorOf=previous;
scope.evidenceContextCorrection={sourceBodiesChanged:false,chapter:'B1V3-P1-S006',argument:'REORGANIZATION',reason:'Adjacent native example was omitted from the earlier argument span; preserve its explanation and qualification',productionActivation:false};
const path=dir+'manuscript-text-scope-candidates-v8.json';write(path,scope);
const registry=read(dir+'manuscript-knowledge-source-registry-v10-candidate.json');
registry.successorOf=dir+'manuscript-knowledge-source-registry-v10-candidate.json';
registry.schemaVersion='PHI-OS-MANUSCRIPT-KNOWLEDGE-SOURCE-REGISTRY-v11-CANDIDATE';
for(const source of registry.records)if(source.scopeAdmissionPath===previous){source.scopeAdmissionPath=path;source.scopeAdmissionSha256=sha(fs.readFileSync(path));}
write(dir+'manuscript-knowledge-source-registry-v11-candidate.json',registry);
console.log(JSON.stringify({sourceBodiesChanged:false,productionActivation:false,argumentStart:unit.startOffset,argumentEnd:end,providerCalls:0}));
