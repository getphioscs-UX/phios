import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
const root=process.cwd();
const readJson=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const stable=v=>JSON.stringify(v,(k,val)=>val&&typeof val==='object'&&!Array.isArray(val)?Object.fromEntries(Object.entries(val).sort(([a],[b])=>a.localeCompare(b))):val,2)+'\n';
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:stable(v)).digest('hex');
const slugify=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g,'-').replace(/^-|-$/g,'');
const parseSections=body=>String(body||'').split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);
const blueprintFiles=['book-1-knowledge-blueprint.json','book-2-knowledge-blueprint.json','book-3-knowledge-blueprint.json','book-4-knowledge-blueprint.json'];
function allBlueprintNodes(bp){const out=[]; const walk=v=>{if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object'){if(v.nodeCode&&v.partCode)out.push(v);Object.values(v).forEach(walk)}};walk(bp);return out}
export async function buildPublishedRetrievalIndex(){
 const [authority,nodesReg,sq,locProj,booksReg,partsReg,...bps]=await Promise.all([
  readJson('content/knowledge/public/authority/published-knowledge-authority.json'),readJson('content/knowledge/registry/nodes.json'),readJson('content/knowledge/registry/supporting-questions.json'),readJson('content/knowledge/l10n/multilingual-node-projection-registry.json'),readJson('content/registry/books.json'),readJson('content/registry/parts.json'),...blueprintFiles.map(f=>readJson('content/knowledge/blueprints/'+f))]);
 const nodeBy=new Map(nodesReg.nodes.map(x=>[x.nodeCode,x]));
 const locBy=new Map(locProj.records.map(x=>[x.nodeCode,x]));
 const mapBy=new Map(bps.flatMap(allBlueprintNodes).map(x=>[x.nodeCode,{bookCode:bps.find(b=>allBlueprintNodes(b).some(n=>n.nodeCode===x.nodeCode))?.bookCode,partCode:x.partCode}]));
 const bookMeta=new Map((booksReg.books||[]).map(b=>[`BOOK-${b.volume}`,b]));
 const partList=[partsReg.part_0,...(partsReg.parts||[])];
 const partMeta=new Map(partList.map(p=>[`P${p.number}`,p]));
 const records=[...authority.records].sort((a,b)=>`${a.nodeCode}:${a.locale}`.localeCompare(`${b.nodeCode}:${b.locale}`));
 const nodes=records.map(r=>{const n=nodeBy.get(r.nodeCode);const m=mapBy.get(r.nodeCode)||{};return {nodeCode:r.nodeCode,locale:r.locale,title:r.article.title,summary:r.article.summary||null,slug:r.article.slug||locBy.get(r.nodeCode)?.locales?.[r.locale]?.slug||slugify(r.article.title),href:r.article.href||`/articles/${locBy.get(r.nodeCode)?.locales?.[r.locale]?.slug||slugify(r.article.title)}`,bookCode:m.bookCode||null,partCode:m.partCode||null,nodeType:n?.nodeType||null,themeCode:n?.themeCode||null,publicationCode:r.lineage.publicationCode,authorityRecordCode:r.authorityRecordCode,authorityDigest:r.authorityDigest}});
 const fragments=records.flatMap(r=>parseSections(r.article.bodyMarkdown).map((text,i)=>({fragmentCode:`FRAGMENT-${r.nodeCode}-${r.locale.toUpperCase()}-${String(i+1).padStart(3,'0')}`,nodeCode:r.nodeCode,locale:r.locale,ordinal:i+1,kind:text.startsWith('#')?'heading':'paragraph',text,digest:sha(text)})));
 const aliases=records.flatMap(r=>{const l=locBy.get(r.nodeCode)?.locales?.[r.locale]||{};const vals=[r.article.title,l.displayQuestion,l.slug,nodeBy.get(r.nodeCode)?.canonicalQuestionKey].filter(Boolean);return [...new Set(vals)].map((value,i)=>({aliasCode:`ALIAS-${r.nodeCode}-${r.locale.toUpperCase()}-${String(i+1).padStart(2,'0')}`,nodeCode:r.nodeCode,locale:r.locale,value,normalized:String(value).toLowerCase(),aliasType:i===0?'title':i===1?'question':i===2?'slug':'canonical_key'}))});
 const publishedSet=new Set(records.map(r=>`${r.nodeCode}:${r.locale}`));
 const relationships=records.flatMap(r=>{const rel=nodeBy.get(r.nodeCode)?.relationships||{};return Object.entries(rel).flatMap(([type,codes])=>(codes||[]).map(target=>({relationshipCode:`REL-${r.nodeCode}-${r.locale.toUpperCase()}-${type}-${target}`,sourceNodeCode:r.nodeCode,targetNodeCode:target,locale:r.locale,type,targetPublished:publishedSet.has(`${target}:${r.locale}`)}))) });
 const questions=records.flatMap(r=>{const lp=locBy.get(r.nodeCode)?.locales?.[r.locale]||{};const primary={questionCode:`QUESTION-${r.nodeCode}-${r.locale.toUpperCase()}`,nodeCode:r.nodeCode,locale:r.locale,question:lp.displayQuestion||r.article.title,questionType:'canonical'};const support=(sq.supportingQuestions||[]).filter(q=>q.canonicalNodeCode===r.nodeCode&&q.locales?.[r.locale]?.displayQuestion).map(q=>({questionCode:q.questionCode,nodeCode:r.nodeCode,locale:r.locale,question:q.locales[r.locale].displayQuestion,questionType:'supporting'}));return [primary,...support]});
 const publications=records.map(r=>({authorityRecordCode:r.authorityRecordCode,nodeCode:r.nodeCode,locale:r.locale,articleCode:r.article.articleCode,version:r.article.version,publicationCode:r.lineage.publicationCode,publicationDigest:r.lineage.publicationDigest,authorityDigest:r.authorityDigest,status:'published'}));
 const localeAvailability=[...new Set(records.map(r=>r.nodeCode))].sort().map(nodeCode=>({nodeCode,locales:['zh-Hans','en'].map(locale=>({locale,available:publishedSet.has(`${nodeCode}:${locale}`),authorityRecordCode:records.find(r=>r.nodeCode===nodeCode&&r.locale===locale)?.authorityRecordCode||null}))}));
 const bookCodes=[...new Set(nodes.map(n=>n.bookCode).filter(Boolean))].sort();
 const books=bookCodes.map(code=>{const b=bookMeta.get(code);const rs=nodes.filter(n=>n.bookCode===code);return {bookCode:code,title:b?.title||null,localeArticleCount:rs.length,nodeCount:new Set(rs.map(x=>x.nodeCode)).size,locales:[...new Set(rs.map(x=>x.locale))].sort()}});
 const partCodes=[...new Set(nodes.map(n=>n.partCode).filter(Boolean))].sort();
 const parts=partCodes.map(code=>{const p=partMeta.get(code);const rs=nodes.filter(n=>n.partCode===code);return {partCode:code,bookCode:rs[0]?.bookCode||null,title:p?.title||null,localeArticleCount:rs.length,nodeCount:new Set(rs.map(x=>x.nodeCode)).size,locales:[...new Set(rs.map(x=>x.locale))].sort()}});
 const projections={nodes,fragments,aliases,relationships,questions,publications,'locale-availability':localeAvailability,books,parts};
 const projectionDigests=Object.fromEntries(Object.entries(projections).map(([k,v])=>[k,sha(v)]));
 const authorityDigest=sha(authority);
 const manifestBase={indexCode:'PHI-OS-MULTILINGUAL-PUBLISHED-RETRIEVAL-INDEX',indexVersion:'1.0.0',authorityDigest,sourceAuthority:'content/knowledge/public/authority/published-knowledge-authority.json',recordCounts:Object.fromEntries(Object.entries(projections).map(([k,v])=>[k,v.length])),projectionDigests,policies:{publishedOnly:true,localeIndependent:true,deterministicRebuild:true,registryPresenceEqualsIndexPresence:false}};
 const manifest={...manifestBase,indexDigest:sha(manifestBase)};
 return {manifest,projections};
}
export async function writePublishedRetrievalIndex(){const {manifest,projections}=await buildPublishedRetrievalIndex();const dir=path.join(root,'content/knowledge/public/retrieval');await fs.mkdir(dir,{recursive:true});for(const [name,data] of Object.entries(projections))await fs.writeFile(path.join(dir,`${name}.json`),stable({projection:name,version:'1.0.0',recordCount:data.length,records:data,digest:sha(data)}),'utf8');await fs.writeFile(path.join(dir,'published-retrieval-index.json'),stable(manifest),'utf8');return manifest}
export {stable,sha};
