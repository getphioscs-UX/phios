import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write=(name,data)=>{const p=path.join(root,'content/knowledge/structured/book-1',name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(data,null,2)+'\n');};
const paths={concepts:'content/registry/concepts.json',nodes:'content/knowledge/registry/successors/book-w1d/canonical-nodes-v1.json',bindings:'content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json',sections:'content/knowledge/manuscripts/extraction/book-1-full-section-inventory-v1.json',articles:'content/knowledge/knowledge-intelligence-r2/registries/successors/book4-publication-v1/kir-r2-book-i-iv-published-article-binding-registry-v3.json'};
const concepts=read(paths.concepts).concepts,nodes=read(paths.nodes).nodes,bindings=read(paths.bindings).records,sections=read(paths.sections).sections,articles=read(paths.articles).records;
const mapping=[
 ['difference','STATE','KN-B1-P1-001','The first distinguishable state from which reality can emerge.'],
 ['constraint','MECHANISM','KN-B1-P1-002','A mechanism that narrows possibilities so differences can sustain a direction.'],
 ['structure','PATTERN','KN-B1-P1-003','A sustainable organization of relationships formed by differences under constraints.'],
 ['field','CONDITION','KN-B1-P1-008','The range of influence formed as structures remain connected.'],
 ['projection','MECHANISM','KN-B1-P2-001','The form in which complex reality enters experience after filtering, compression and organization through interfaces.'],
 ['runtime_state','STATE','KN-B1-P3-015','The current organization of reality within a particular time, set of conditions, carrier and runtime network.'],
 ['feedback','FEEDBACK','KN-B1-P3-015','Runtime results return to the system and affect the next round of reality formation.'],
 ['reconfiguration','TRANSITION','KN-B1-P3-015','Existing structures reorganize under new conditions.'],
 ['continuity','CAPACITY','KN-B1-P3-015','The capacity for a reality pattern to continue across time, states or carriers.'],
 ['carrier','CARRIER','KN-B1-P4-004','The supporting structure through which reality enters a particular life or system and continues to run.'],
 ['reality_initialization_state','STATE','KN-B1-P4-003','The initial runtime state formed by initial conditions, time, body and configuration; it is not fixed destiny.']
];
const objects=mapping.map(([conceptId,objectType,nodeCode,en])=>{
 const concept=concepts.find(c=>c.id===conceptId),node=nodes.find(n=>n.nodeCode===nodeCode);
 assert.equal(concept?.status,'stable',conceptId);assert.ok(node,nodeCode);
 const refs=bindings.filter(b=>b.nodeCode===nodeCode&&b.bookCode==='BOOK-1'&&b.status==='APPROVED');
 assert.ok(refs.length,`No approved manuscript binding: ${nodeCode}`);
 const primary=refs.filter(b=>b.mappingRole==='PRIMARY');const chosen=primary.length?primary:refs;
 for(const ref of chosen)assert.ok(sections.some(s=>s.sectionCode===ref.sectionCode&&s.textSha256===ref.sectionTextSha256),ref.sectionCode);
 return {objectId:`SK-B1-${conceptId.toUpperCase().replaceAll('_','-')}`,bookCode:'BOOK-1',partCode:chosen[0].partCode,nodeCode,
 sourceRefs:{canonicalNodeCodes:[nodeCode],manuscriptSectionRefs:chosen.map(b=>b.sectionCode),publishedArticleRefs:articles.filter(a=>a.nodeCode===nodeCode).map(a=>a.articleCode),figureRefs:[],relatedStructuredObjectIds:[]},
 objectType,title:concept['zh-Hans'],summary:concept.definition,canonicalMeaning:concept.definition,relationships:[],evidenceState:'SUPPORTED_SOURCE',unknownState:['New structured classification and English translation await W56 human review.','Trigger, input, output and transition claims are omitted unless separately supported.'],projectionState:'CANDIDATE',localeState:{'zh-Hans':'SOURCE',en:'MISSING'},status:'IN_REVIEW',version:'1.0.0'};
});
const details=Object.fromEntries(objects.map((o,i)=>{
 const c=concepts.find(c=>c.id===mapping[i][0]);
 return [o.objectId,{conceptId:c.id,titleEn:c.en,summaryEn:mapping[i][3],translationState:'DRAFT',definitionSource:`${paths.concepts}#${c.id}`,grammarStage:c.grammar||null,
 sourceSections:o.sourceRefs.manuscriptSectionRefs.map(code=>{const s=sections.find(x=>x.sectionCode===code);return {sectionCode:code,heading:s.heading,startPage:s.startPage,endPage:s.endPage,textSha256:s.textSha256};}),
 articles:articles.filter(a=>a.nodeCode===o.nodeCode).map(a=>({articleCode:a.articleCode,href:a.href,locale:a.locale,title:a.title})),
 triggerConditions:[],inputs:[],outputs:[],affectedStates:[],relatedMechanisms:objects.filter(x=>x.objectId!==o.objectId&&x.nodeCode===o.nodeCode).map(x=>x.objectId),boundaryConditions:[],failureConditions:[],examples:[],unknowns:o.unknownState}];
}));
const metadata={version:'1.0.0',bookCode:'BOOK-1',status:'SOURCE_GROUNDED_PREVIEW',humanAcceptanceComplete:false,sourcePaths:paths,sourceDigests:Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')]))};
write('book-1-structured-taxonomy-v1.json',{...metadata,allowedTypes:['MECHANISM','STATE','CONDITION','SIGNAL','BOUNDARY','PRESSURE','CONSTRAINT','PATTERN','CARRIER','CAPACITY','LOAD','FEEDBACK','THRESHOLD','TRANSITION'],specializations:{STRUCTURE:'PATTERN'},extractionPolicy:'Copy stable canonical definitions; require existing node and approved manuscript binding. Missing semantic fields remain empty. English translations and new classifications require W56 review.'});
write('book-1-mechanism-registry-v1.json',{...metadata,objects,details,mechanisms:objects.filter(o=>o.objectType==='MECHANISM').map(o=>({mechanismId:o.objectId,nodeCode:o.nodeCode,title:o.title,definition:o.canonicalMeaning,...details[o.objectId],sourceRefs:o.sourceRefs}))});
write('book-1-state-registry-v1.json',{...metadata,states:objects.filter(o=>o.objectType==='STATE').map(o=>({stateId:o.objectId,title:o.title,definition:o.canonicalMeaning,entryConditions:[],exitConditions:[],possibleTransitions:[],mechanismRefs:details[o.objectId].relatedMechanisms,signalRefs:[],sourceRefs:o.sourceRefs}))});
write('book-1-formation-chain-registry-v1.json',{...metadata,chains:[{chainId:'B1-GRAMMAR-G1-G4',title:{en:'From difference to field','zh-Hans':'从差异到场域'},stageSequence:objects.slice(0,4).map(o=>o.objectId),sourceRefs:objects.slice(0,4).map(o=>o.sourceRefs),boundaryNotes:'Partial G1–G4 sequence from the existing canonical concept grammar. Sequence is an explanatory projection, not proof of deterministic causality.',exampleRefs:[]}],withheldChains:[{requestedSequence:['Condition','Signal','Interaction','Pattern','Structure','Runtime','Reality'],reason:'This exact sequence has not been admitted as a Book I chain by the available source bindings.'}]});
write('book-1-mechanism-comparison-families-v1.json',{...metadata,families:[{comparisonId:'B1-STRUCTURE-CARRIER',memberIds:['SK-B1-STRUCTURE','SK-B1-CARRIER'],sharedDimension:{en:'Organization and support','zh-Hans':'组织与承载'},distinguishingDimensions:['canonicalMeaning','partCode','manuscriptSectionRefs'],misinterpretationRisks:{en:'A shared reference to structure does not make the two concepts interchangeable.','zh-Hans':'都涉及结构，不代表两个概念可以互换。'},sourceRefs:objects.filter(o=>['SK-B1-STRUCTURE','SK-B1-CARRIER'].includes(o.objectId)).map(o=>o.sourceRefs)}],withheldComparisons:['Pressure / Constraint','Signal / Evidence','State / Pattern','Change / Transition','Capacity / Load']});
console.log(`✓ Book I: ${objects.length} source-bound preview objects; no fabricated transitions or human acceptance.`);
