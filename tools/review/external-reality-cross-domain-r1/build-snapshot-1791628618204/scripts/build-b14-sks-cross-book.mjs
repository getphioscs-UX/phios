import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='content/knowledge/structured/',read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sources=[['book-1/book-1-mechanism-registry-v1.json','objects','reality-formation','explorer','mechanism'],['book-2/book-2-runtime-pattern-registry-v1.json','patterns','reality-runtime','runtime-atlas','pattern'],['book-3/book-3-maintenance-signal-registry-v1.json','entries','reality-continuity','maintenance','topic'],['book-4/book-4-expansion-mode-registry-v1.json','objects','reality-expansion','expansion','expansion']];
const articlePath='content/knowledge/knowledge-intelligence-r2/registries/successors/book4-publication-v1/kir-r2-book-i-iv-published-article-binding-registry-v3.json';
const articles=read(articlePath).records,objects=[],backlinks=[];
const inputs=[articlePath,...sources.map(s=>base+s[0])];
for(const [file,key,route,anchor,param] of sources){const registry=read(base+file),nodes=read(registry.sourcePaths.nodes).nodes;inputs.push(registry.sourcePaths.nodes);if(registry.sourcePaths.bindings)inputs.push(registry.sourcePaths.bindings);
 for(const o of registry[key]){const node=nodes.find(n=>n.nodeCode===o.nodeCode);assert.ok(node,o.nodeCode);if(node.publicationBookCode)assert.equal(node.publicationBookCode,o.bookCode);else assert.ok(read(registry.sourcePaths.bindings).records.some(b=>b.nodeCode===o.nodeCode&&b.bookCode===o.bookCode&&b.status==='APPROVED'));assert.ok(o.sourceRefs.manuscriptSectionRefs.length);
  const href=`/books/${route}/?${param}=${encodeURIComponent(o.objectId)}#${anchor}`;
  objects.push({objectId:o.objectId,objectType:o.objectType,bookCode:o.bookCode,partCode:o.partCode,title:o.title,status:o.status,registryPath:base+file,explorerHref:href});
  const details=registry.details?.[o.objectId];const sections=o.sourceSections||details?.sourceSections||[{sectionCode:o.sourceSection?.sectionCode,startPage:o.sourceSection?.pages?.[0],endPage:o.sourceSection?.pages?.[1],textSha256:o.sourceSection?.textSha256}];
  const published=articles.filter(a=>a.nodeCode===o.nodeCode&&a.bookCode===o.bookCode&&a.approved&&a.published);
  backlinks.push({objectId:o.objectId,bookCode:o.bookCode,canonicalNode:{nodeCode:o.nodeCode,registryPath:registry.sourcePaths.nodes},manuscriptSections:o.sourceRefs.manuscriptSectionRefs.map(id=>{const s=sections.find(s=>s.sectionCode===id);assert.ok(s?.textSha256,id);return {sectionCode:id,startPage:s.startPage,endPage:s.endPage,textSha256:s.textSha256,rawDeliveryAllowed:false};}),publishedArticles:published.map(a=>({articleCode:a.articleCode,title:a.title,locale:a.locale,href:a.href})),articleAvailability:published.length?'PUBLISHED':'NO_PUBLISHED_BINDING',bookSection:{partCode:o.partCode,href:`/books/${route}/#book-parts`},explorerHref:href});
 }
}
assert.equal(new Set(objects.map(o=>o.objectId)).size,objects.length);
const meta={version:'1.0.0',role:'DISCOVERY_ONLY',humanAcceptanceComplete:false,canonicalAuthority:false,sourceDigests:Object.fromEntries([...new Set(inputs)].map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};
const write=(file,data)=>fs.writeFileSync(base+file,JSON.stringify({...meta,...data},null,2)+'\n');
write('structured-knowledge-registry-v1.json',{objects});
write('structured-knowledge-backlinks-v1.json',{backlinks});
// These are proposed reading connections, not admitted causal/theoretical edges.
const pairs=[['SK-B2-B2-P6-002','SK-B3-B3-P9-139','Coordination to coordination continuity'],['SK-B3-B3-P8-159','SK-B4-B4-P10-201','Continuity to expansion']];
const proposedRelationships=pairs.map(([from,to,label],i)=>{assert.ok(objects.some(o=>o.objectId===from));assert.ok(objects.some(o=>o.objectId===to));return {relationshipId:`SK-CROSS-READING-${i+1}`,sourceObjectId:from,targetObjectId:to,role:'SUGGESTED_READING',label,status:'PENDING_HUMAN_REVIEW',claimStrength:'CONCEPTUAL',evidenceState:'UNREVIEWED',sourceBacklinkIds:[from,to],retrievalEligible:false};});
const bridgePath=base+'bridges/book-4-to-book-5-civilization-threshold-v1.json';const bridge=read(bridgePath);
write('structured-knowledge-relationships-v1.json',{relationships:[],proposedRelationships,navigationBridges:[{bridgeId:bridge.bridgeId,registryPath:bridgePath,sha256:createHash('sha256').update(fs.readFileSync(bridgePath)).digest('hex'),fromObjectIds:bridge.fromObjectIds,targetRoute:bridge.targetRoute}],withheld:[{requested:'Book I Pressure → Book III Load',reason:'Book I Pressure object has not been source-admitted.'},{requested:'Book I Threshold → Book IV Scale Threshold',reason:'Book I Threshold object has not been source-admitted.'}],automaticSemanticInference:false});
console.log(`✓ W34–W36: ${objects.length} discoverable objects and complete provenance backlinks; 2 proposed reading edges, no invented admitted edges.`);

