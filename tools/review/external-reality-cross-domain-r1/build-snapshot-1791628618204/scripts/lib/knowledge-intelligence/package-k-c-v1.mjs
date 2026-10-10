import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const stable=v=>JSON.stringify(v,(k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x,2)+'\n';
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:stable(v)).digest('hex');
const read=async f=>JSON.parse(await fs.readFile(path.join(root,f),'utf8'));
const uniq=a=>[...new Set(a)];

const selectOverview=fragments=>{
 const ordered=[...fragments].sort((a,b)=>a.ordinal-b.ordinal);
 const heading=ordered.find(f=>f.kind==='heading');
 const paragraphs=ordered.filter(f=>f.kind==='paragraph');
 return [heading,paragraphs[0],paragraphs.at(-1)].filter(Boolean);
};
const selectContinuity=fragments=>{
 const ordered=[...fragments].sort((a,b)=>a.ordinal-b.ordinal);
 const heading=ordered.find(f=>f.kind==='heading');
 const paragraphs=ordered.filter(f=>f.kind==='paragraph');
 return [heading,paragraphs.at(-1)].filter(Boolean);
};

export async function buildCanonicalAssembly(){
 const [profilesDoc,fragmentsDoc,relDoc,domainDoc,graph]=await Promise.all([
  read('content/knowledge/intelligence/semantic-profiles/published-semantic-profiles.json'),
  read('content/knowledge/public/retrieval/fragments.json'),
  read('content/knowledge/intelligence/expansion/relationship-mechanism-expansion.json'),
  read('content/knowledge/intelligence/expansion/cross-domain-expansion.json'),
  read('content/knowledge/intelligence/graph/published-knowledge-graph.json')
 ]);
 const assemblies=[];
 for(const profile of profilesDoc.profiles){
  const fragments=fragmentsDoc.records.filter(f=>f.nodeCode===profile.nodeCode&&f.locale===profile.locale).sort((a,b)=>a.ordinal-b.ordinal);
  const fragmentMap=new Map(fragments.map(f=>[f.fragmentCode,f]));
  const rel=relDoc.records.find(r=>r.nodeCode===profile.nodeCode&&r.locale===profile.locale);
  const domains=domainDoc.records.filter(r=>r.nodeCode===profile.nodeCode&&r.locale===profile.locale);
  const specs=[];
  specs.push({type:'overview',key:'overview',fragmentCodes:selectOverview(fragments).map(f=>f.fragmentCode),mechanismCodes:[],domainCodes:[]});
  for(const facet of rel?.mechanismFacets??[]){
   specs.push({type:'mechanism',key:facet.facetCode,fragmentCodes:facet.evidenceFragmentCodes,mechanismCodes:[facet.facetCode],domainCodes:[facet.facetCode]});
  }
  specs.push({type:'theme',key:profile.themeCode,fragmentCodes:uniq(domains.flatMap(d=>d.evidenceFragmentCodes)),mechanismCodes:[],domainCodes:domains.map(d=>d.domainCode)});
  specs.push({type:'continuity',key:'continuity',fragmentCodes:selectContinuity(fragments).map(f=>f.fragmentCode),mechanismCodes:[],domainCodes:[]});
  for(const spec of specs){
   const selected=uniq(spec.fragmentCodes).map(c=>fragmentMap.get(c)).filter(Boolean).sort((a,b)=>a.ordinal-b.ordinal);
   const base={
    assemblyCode:`ASSEMBLY-${profile.nodeCode}-${profile.locale.toUpperCase()}-${spec.type.toUpperCase()}-${String(spec.key).toUpperCase().replace(/[^A-Z0-9-]+/g,'-')}`,
    nodeCodes:[profile.nodeCode],locale:profile.locale,assemblyType:spec.type,assemblyKey:spec.key,
    sourceProfileDigest:profile.profileDigest,sourceGraphDigest:graph.digest,
    fragmentCodes:selected.map(f=>f.fragmentCode),fragmentDigests:selected.map(f=>({fragmentCode:f.fragmentCode,digest:f.digest})),
    mechanismCodes:uniq(spec.mechanismCodes).sort(),domainCodes:uniq(spec.domainCodes).sort(),themeCode:profile.themeCode,
    relationshipTargets:(rel?.explicitRelationships??[]).map(r=>({...r})),
    compressionEligible:selected.length>0,publishedFragmentsOnly:true,providerUsed:false,generatedText:false
   };
   assemblies.push({...base,assemblyDigest:sha(base)});
  }
 }
 assemblies.sort((a,b)=>a.assemblyCode.localeCompare(b.assemblyCode));
 const base={version:'1.0.0',assemblyCount:assemblies.length,localeCount:uniq(assemblies.map(a=>a.locale)).length,canonicalNodeCount:uniq(assemblies.flatMap(a=>a.nodeCodes)).length,assemblies,sourceProfileDigest:profilesDoc.digest,sourceGraphDigest:graph.digest,sourceRelationshipMechanismDigest:relDoc.digest,sourceCrossDomainDigest:domainDoc.digest};
 return {...base,digest:sha(base)};
}

export async function buildKnowledgeCompression(assemblyDoc=null){
 const [assemblies,fragmentsDoc]=await Promise.all([
  assemblyDoc??buildCanonicalAssembly(),
  read('content/knowledge/public/retrieval/fragments.json')
 ]);
 const fragmentMap=new Map(fragmentsDoc.records.map(f=>[f.fragmentCode,f]));
 const blocks=assemblies.assemblies.filter(a=>a.compressionEligible).map(a=>{
  const fragments=a.fragmentCodes.map(c=>fragmentMap.get(c)).filter(Boolean).sort((x,y)=>x.ordinal-y.ordinal);
  const base={
   blockCode:a.assemblyCode.replace('ASSEMBLY-','KBLOCK-'),assemblyCode:a.assemblyCode,assemblyDigest:a.assemblyDigest,
   nodeCodes:a.nodeCodes,locale:a.locale,blockType:a.assemblyType,blockKey:a.assemblyKey,
   fragmentCodes:fragments.map(f=>f.fragmentCode),fragments:fragments.map(f=>({fragmentCode:f.fragmentCode,ordinal:f.ordinal,kind:f.kind,text:f.text,digest:f.digest})),
   mechanismCodes:a.mechanismCodes,domainCodes:a.domainCodes,themeCode:a.themeCode,relationshipTargets:a.relationshipTargets,
   compressionMode:'extractive_reference_grouping',sourceTextPreserved:true,newCanonicalMeaning:false,generatedSummary:false,providerUsed:false
  };
  return {...base,blockDigest:sha(base)};
 }).sort((a,b)=>a.blockCode.localeCompare(b.blockCode));
 const base={version:'1.0.0',blockCount:blocks.length,localeCount:uniq(blocks.map(b=>b.locale)).length,canonicalNodeCount:uniq(blocks.flatMap(b=>b.nodeCodes)).length,blocks,sourceAssemblyDigest:assemblies.digest,sourceFragmentProjectionDigest:fragmentsDoc.digest};
 return {...base,digest:sha(base)};
}

export async function writePackageKC(){
 const assembly=await buildCanonicalAssembly();
 const compression=await buildKnowledgeCompression(assembly);
 await fs.mkdir(path.join(root,'content/knowledge/intelligence/assembly'),{recursive:true});
 await fs.mkdir(path.join(root,'content/knowledge/intelligence/compression'),{recursive:true});
 await fs.writeFile(path.join(root,'content/knowledge/intelligence/assembly/canonical-assembly.json'),stable(assembly));
 await fs.writeFile(path.join(root,'content/knowledge/intelligence/compression/knowledge-compression.json'),stable(compression));
 return {assembly,compression};
}
export {stable,sha};
