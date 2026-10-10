import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();
const stable=v=>JSON.stringify(v,(k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x,2)+'\n';
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:stable(v)).digest('hex');
const read=async f=>JSON.parse(await fs.readFile(path.join(root,f),'utf8'));
const normalize=v=>String(v??'').normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}]+/gu,' ').replace(/\s+/g,' ').trim();
const tokens=v=>[...new Set(normalize(v).split(/\s+/).flatMap(x=>/^[\u3400-\u9fff]+$/u.test(x)?[...x]:[x]).filter(x=>x.length>=2||/[\u3400-\u9fff]/u.test(x)))];
export async function buildSemanticProfiles(){
 const [nodes,fragments,questions,aliases,relationships,localeAvailability]=await Promise.all(['nodes','fragments','questions','aliases','relationships','locale-availability'].map(n=>read(`content/knowledge/public/retrieval/${n}.json`)));
 const profiles=nodes.records.map(node=>{
  const fr=fragments.records.filter(x=>x.nodeCode===node.nodeCode&&x.locale===node.locale).sort((a,b)=>a.ordinal-b.ordinal);
  const qs=questions.records.filter(x=>x.nodeCode===node.nodeCode&&x.locale===node.locale).map(x=>x.question);
  const al=aliases.records.filter(x=>x.nodeCode===node.nodeCode&&x.locale===node.locale).map(x=>x.value);
  const rel=relationships.records.filter(x=>x.sourceNodeCode===node.nodeCode&&x.locale===node.locale);
  const text=[node.title,node.summary,...qs,...al,...fr.map(x=>x.text)].join(' ');
  const frequency=new Map(); for(const t of tokens(text))frequency.set(t,(frequency.get(t)||0)+1);
  const keywords=[...frequency.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,24).map(([term,count])=>({term,count}));
  const base={profileCode:`SEMANTIC-${node.nodeCode}-${node.locale.toUpperCase()}`,nodeCode:node.nodeCode,locale:node.locale,title:node.title,question:qs[0]||null,themeCode:node.themeCode,bookCode:node.bookCode,partCode:node.partCode,nodeType:node.nodeType,keywords,fragmentCodes:fr.map(x=>x.fragmentCode),relationshipTargets:rel.map(x=>({type:x.type,targetNodeCode:x.targetNodeCode,targetPublished:x.targetPublished})),availableLocales:(localeAvailability.records.find(x=>x.nodeCode===node.nodeCode)?.locales||[]).filter(x=>x.available).map(x=>x.locale).sort()};
  return {...base,profileDigest:sha(base)};
 }).sort((a,b)=>a.nodeCode.localeCompare(b.nodeCode)||a.locale.localeCompare(b.locale));
 const out={version:'1.0.0',profileCount:profiles.length,canonicalNodeCount:new Set(profiles.map(x=>x.nodeCode)).size,profiles}; return {...out,digest:sha(out)};
}
export async function buildKnowledgeGraph(){
 const profilesDoc=await buildSemanticProfiles(); const rel=await read('content/knowledge/public/retrieval/relationships.json');
 const nodes=[]; const edges=[]; const canonical=[...new Set(profilesDoc.profiles.map(x=>x.nodeCode))].sort();
 for(const code of canonical)nodes.push({graphNodeCode:`NODE-${code}`,kind:'canonical_node',nodeCode:code});
 for(const p of profilesDoc.profiles){nodes.push({graphNodeCode:`PROFILE-${p.nodeCode}-${p.locale}`,kind:'locale_profile',nodeCode:p.nodeCode,locale:p.locale,profileDigest:p.profileDigest});edges.push({edgeCode:`EDGE-${p.nodeCode}-${p.locale}-PROFILE`,type:'has_locale_profile',source:`NODE-${p.nodeCode}`,target:`PROFILE-${p.nodeCode}-${p.locale}`});}
 const unique=(kind,val)=>{const code=`${kind.toUpperCase()}-${val}`;if(!nodes.some(x=>x.graphNodeCode===code))nodes.push({graphNodeCode:code,kind,value:val});return code;};
 for(const p of profilesDoc.profiles){for(const [kind,val,type] of [['theme',p.themeCode,'belongs_to_theme'],['book',p.bookCode,'belongs_to_book'],['part',p.partCode,'belongs_to_part']]){if(val)edges.push({edgeCode:`EDGE-${p.nodeCode}-${p.locale}-${type}`,type,source:`PROFILE-${p.nodeCode}-${p.locale}`,target:unique(kind,val)});}}
 for(const code of canonical){const ps=profilesDoc.profiles.filter(x=>x.nodeCode===code);for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++)edges.push({edgeCode:`EDGE-${code}-${ps[i].locale}-${ps[j].locale}-EQUIVALENT`,type:'locale_equivalent',source:`PROFILE-${code}-${ps[i].locale}`,target:`PROFILE-${code}-${ps[j].locale}`});}
 const externalBoundaries=[];for(const r of rel.records){if(r.targetPublished&&canonical.includes(r.targetNodeCode))edges.push({edgeCode:r.relationshipCode,type:'published_relationship',source:`NODE-${r.sourceNodeCode}`,target:`NODE-${r.targetNodeCode}`,relationshipType:r.type,locale:r.locale});else externalBoundaries.push({relationshipCode:r.relationshipCode,sourceNodeCode:r.sourceNodeCode,targetNodeCode:r.targetNodeCode,type:r.type,locale:r.locale,reason:'target_not_published'});}
 nodes.sort((a,b)=>a.graphNodeCode.localeCompare(b.graphNodeCode));edges.sort((a,b)=>a.edgeCode.localeCompare(b.edgeCode));externalBoundaries.sort((a,b)=>a.relationshipCode.localeCompare(b.relationshipCode)); const base={version:'1.0.0',canonicalNodeCount:canonical.length,graphNodeCount:nodes.length,edgeCount:edges.length,externalBoundaryCount:externalBoundaries.length,nodes,edges,externalBoundaries};return {...base,digest:sha(base)};
}
export async function writePackageKA(){const profiles=await buildSemanticProfiles();const graph=await buildKnowledgeGraph();await fs.mkdir(path.join(root,'content/knowledge/intelligence/semantic-profiles'),{recursive:true});await fs.mkdir(path.join(root,'content/knowledge/intelligence/graph'),{recursive:true});await fs.writeFile(path.join(root,'content/knowledge/intelligence/semantic-profiles/published-semantic-profiles.json'),stable(profiles));await fs.writeFile(path.join(root,'content/knowledge/intelligence/graph/published-knowledge-graph.json'),stable(graph));return {profiles,graph};}
export {stable,sha};
