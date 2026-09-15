import assert from 'node:assert/strict';
import Ajv from 'ajv';
export function validateStructuredCorpus({discovery,backlinks,registries,read,schema}){
 const validate=new Ajv({allErrors:true,strict:false}).compile(schema);
 const unique=(rows,key,label)=>{const ids=rows.map(r=>r[key]);assert.equal(new Set(ids).size,ids.length,`DUPLICATE_${label}`);return new Map(rows.map(r=>[r[key],r]));};
 const entries=unique(discovery.objects,'objectId','DISCOVERY_ID'),links=unique(backlinks.backlinks,'objectId','BACKLINK_ID');
 const rows=registries.flatMap(({path,data})=>(data.objects||data.patterns||data.entries).map(object=>({path,data,object})));
 const objects=unique(rows.map(r=>r.object),'objectId','OBJECT_ID');
 assert.deepEqual([...objects.keys()].sort(),[...entries.keys()].sort(),'ORPHAN_DISCOVERY_OBJECT');
 assert.deepEqual([...links.keys()].sort(),[...objects.keys()].sort(),'ORPHAN_BACKLINK_OBJECT');
 for(const {path,data,object:o} of rows){
  assert.ok(validate(o),`INVALID_SCHEMA:${o.objectId}:${JSON.stringify(validate.errors)}`);
  assert.ok(o.objectId.startsWith('SK-B'+o.bookCode.slice(-1)+'-'),'OBJECT_BOOK_ID_MISMATCH');
  const e=entries.get(o.objectId),b=links.get(o.objectId);
  assert.equal(e.registryPath,path,'REGISTRY_PATH_MISMATCH');assert.equal(e.bookCode,o.bookCode,'DISCOVERY_BOOK_MISMATCH');assert.equal(b.bookCode,o.bookCode,'BACKLINK_BOOK_MISMATCH');
  assert.ok({'BOOK-1':['P1','P2','P3','P4'],'BOOK-2':['P5','P6','P7'],'BOOK-3':['P8','P9'],'BOOK-4':['P10','P11']}[o.bookCode].includes(o.partCode),'BOOK_PART_MISMATCH');
  assert.equal(b.bookSection.partCode,o.partCode,'BACKLINK_PART_MISMATCH');
  const nodes=read(data.sourcePaths.nodes).nodes;const node=nodes.find(n=>n.nodeCode===o.nodeCode);assert.ok(node,'ORPHAN_CANONICAL_NODE');
  if(node.publicationBookCode)assert.equal(node.publicationBookCode,o.bookCode,'CANONICAL_BOOK_MISMATCH');
  if(node.partCode)assert.equal(node.partCode,o.partCode,'CANONICAL_PART_MISMATCH');
  assert.equal(b.canonicalNode.nodeCode,o.nodeCode,'BACKLINK_NODE_MISMATCH');assert.equal(b.canonicalNode.registryPath,data.sourcePaths.nodes,'BACKLINK_NODE_REGISTRY_MISMATCH');
  assert.ok(o.sourceRefs.canonicalNodeCodes.includes(o.nodeCode),'PRIMARY_NODE_REF_MISSING');
  for(const id of o.sourceRefs.canonicalNodeCodes)assert.ok(nodes.some(n=>n.nodeCode===id),'DANGLING_NODE_REF');
  const inventoryPath=data.sourcePaths.sections||node.canonicalSourceBinding?.inventoryPath;assert.ok(inventoryPath,'MISSING_SECTION_INVENTORY');
  const inventory=read(inventoryPath);
  for(const id of o.sourceRefs.manuscriptSectionRefs){const source=inventory.sections.find(s=>s.sectionCode===id);assert.ok(source,'DANGLING_SECTION_REF');assert.equal(source.partCode,o.partCode,'SECTION_PART_MISMATCH');const back=b.manuscriptSections.find(s=>s.sectionCode===id);assert.ok(back,'MISSING_SECTION_BACKLINK');assert.equal(back.textSha256,source.textSha256,'SECTION_HASH_MISMATCH');}
  assert.deepEqual([...o.sourceRefs.manuscriptSectionRefs].sort(),b.manuscriptSections.map(s=>s.sectionCode).sort(),'SECTION_BACKLINK_SET_MISMATCH');
  for(const id of o.sourceRefs.publishedArticleRefs)assert.ok(b.publishedArticles.some(a=>a.articleCode===id),'DANGLING_ARTICLE_REF');
  for(const id of o.sourceRefs.relatedStructuredObjectIds)assert.ok(objects.has(id),'DANGLING_OBJECT_REF');
  if(o.sourceRefs.figureRefs.length){const figures=read('content/registry/figures.json');const list=figures.figures||figures;for(const id of o.sourceRefs.figureRefs)assert.ok(list.some(f=>f.figure_id===id||f.figureId===id||f.id===id||f.figureCode===id),'DANGLING_FIGURE_REF');}
 }
 return {objects:objects.size,books:new Set(rows.map(r=>r.object.bookCode)).size};
}
