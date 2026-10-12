import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const dir='content/knowledge/source-access/registries/',read=p=>JSON.parse(fs.readFileSync(p)),sha=x=>createHash('sha256').update(x).digest('hex'),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
const scope=read(dir+'manuscript-text-scope-candidates-v8.json'),registry=read(dir+'manuscript-knowledge-source-registry-v11-candidate.json');
const source=registry.records.find(r=>r.bookCode==='BOOK-3'),corpus=read(source.localPath);
const repair=scope.records.find(r=>r.sectionCode==='CM-B3V1-P8-S001').argumentUnits.find(u=>u.argumentId==='MAINTENANCE_V_REPAIR');
repair.comparisonSubjects=[{sourceLabel:'维护',aliases:[]},{sourceLabel:'修理',aliases:['损坏后修理']}];
assert.equal(sha(fs.readFileSync(source.localPath)),source.retrievalCorpusSha256);
const specs=[
 ['CM-B3V1-P9-S004','SHARED_RESOURCE_CONDITIONS','CONDITIONS','资源之所以开始需要共同管理','\n共同资源之所以'],
 ['CM-B3V1-P8-S059','CONTINUATION_V_SUSTAINABILITY','DISTINCTION','运行能够持续','\n真正能够长期存在'],
 ['CM-B3V1-P8-S015','SATURATION_V_STOPPING','DISTINCTION','运行饱和并不一定','\n因此，饱和真正']
];
for(const [section,id,type,startPhrase,endPhrase]of specs){const record=corpus.records.find(r=>r.sectionCode===section),s=scope.records.find(r=>r.sectionCode===section);const start=record.text.indexOf(startPhrase),end=record.text.indexOf(endPhrase,start);assert(start>=s.startOffset&&end>start&&end<=s.endOffset);const unit={argumentId:id,type,startOffset:start,endOffset:end,textSha256:sha(record.text.slice(start,end)),scope:'EXISTING_BOUNDED_RANGE_NOT_COMPLETE_CHAPTER'};if(id==='SATURATION_V_STOPPING')unit.comparisonSubjects=[{sourceLabel:'运行饱和',aliases:['饱和']},{sourceLabel:'彻底停止',aliases:['完全停止','停止运行']}];s.argumentUnits=[unit];s.answerProjectionPolicy='QUESTION_ANCHORED_CONTIGUOUS';}
scope.successorOf=dir+'manuscript-text-scope-candidates-v8.json';scope.boundedExplanationChange={sourceSha256:source.sourceSha256,chapterScopeExpansion:false,originalRangesUnchanged:true,productionActivation:false};
const path=dir+'manuscript-text-scope-candidates-v9.json';write(path,scope);
for(const r of registry.records)if(r.scopeAdmissionPath===dir+'manuscript-text-scope-candidates-v8.json'){r.scopeAdmissionPath=path;r.scopeAdmissionSha256=sha(fs.readFileSync(path));}
registry.successorOf=dir+'manuscript-knowledge-source-registry-v11-candidate.json';registry.schemaVersion='PHI-OS-MANUSCRIPT-KNOWLEDGE-SOURCE-REGISTRY-v12-CANDIDATE';write(dir+'manuscript-knowledge-source-registry-v12-candidate.json',registry);
console.log(JSON.stringify({sourceUnchanged:true,rangesUnchanged:true,units:3,providerCalls:0}));
