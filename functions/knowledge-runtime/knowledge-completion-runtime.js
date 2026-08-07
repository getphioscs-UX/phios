import fs from 'node:fs';
import path from 'node:path';
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const clone=value=>structuredClone(value);
export const KNOWLEDGE_COMPLETION_RUNTIME_CODE='KNOWLEDGE_COMPLETION_RUNTIME';
export const KNOWLEDGE_COMPLETION_RUNTIME_VERSION='1.0.0';
export function createKnowledgeCompletionRuntime({root=process.cwd()}={}) {
 const completion=path.join(root,'content/knowledge/completion');
 const books=readJson(path.join(completion,'book-completion-registry-v1.json'));
 const coverage=readJson(path.join(completion,'canonical-node-coverage-v1.json'));
 const priority=readJson(path.join(completion,'priority-knowledge-production-v1.json'));
 const fragments=readJson(path.join(completion,'published-fragment-expansion-v1.json'));
 const assemblies=readJson(path.join(root,'content/knowledge/intelligence/assembly/canonical-assembly.json'));
 const publicFragments=readJson(path.join(root,'content/knowledge/public/retrieval/fragments.json'));
 const publicFragmentBy=new Map(); for(const fragment of publicFragments.records){ const key=`${fragment.nodeCode}:${fragment.locale}`; const rows=publicFragmentBy.get(key)||[]; rows.push(fragment); publicFragmentBy.set(key,rows); }
 const meaningMapPath=path.join(root,'content/professional/canonical-meaning-runtime/canonical-meaning-knowledge-map-v1.json');
 const meaningMap=fs.existsSync(meaningMapPath)?readJson(meaningMapPath):null;
 const coverageBy=new Map(coverage.records.map(r=>[r.nodeCode,r]));
 const fragmentBy=new Map(fragments.records.map(r=>[r.nodeCode,r]));
 return Object.freeze({runtimeCode:KNOWLEDGE_COMPLETION_RUNTIME_CODE,runtimeVersion:KNOWLEDGE_COMPLETION_RUNTIME_VERSION,
  meaningQuery({meaningCode}) { if(!meaningMap) return {status:'meaning_map_unavailable',meaningCode,nodeCodes:[]}; const rows=(meaningMap.mappings||meaningMap.records||[]).filter(r=>r.meaningCode===meaningCode); return clone({status:rows.length?'covered':'not_found',meaningCode,records:rows}); },
  coverageQuery({nodeCode}) { const record=coverageBy.get(nodeCode); return clone(record?{status:'found',record}:{status:'not_found',nodeCode}); },
  publishedOnlyQuery({nodeCode,locale}) { const rows=publicFragmentBy.get(`${nodeCode}:${locale}`)||[]; const record=fragmentBy.get(nodeCode); return clone({status:rows.length?'covered':'coverage_gap',nodeCode,locale,fragmentCodes:rows.map(row=>row.fragmentCode),fragmentDigests:rows.map(row=>({fragmentCode:row.fragmentCode,digest:row.digest})),knowledgeBoundary:record?.knowledgeBoundary||{required:true,covered:false}}); },
  localeQuery({nodeCode,locale}) { const record=coverageBy.get(nodeCode); return clone(record?{status:record.localeCoverage.includes(locale)?'covered':'gap',nodeCode,locale,coveredLocales:record.localeCoverage,requiredLocales:record.requiredLocales}:{status:'not_found',nodeCode,locale}); },
  assemblyQuery({nodeCode,locale}) { const matches=assemblies.assemblies.filter(a=>a.nodeCodes.includes(nodeCode)&&(!locale||a.locale===locale)); return clone({status:matches.length?'covered':'gap',nodeCode,locale:locale||null,assemblies:matches}); },
  priorityQueue() { return clone(priority.nodes); }, bookCompletion() { return clone(books.books); }
 });
}
