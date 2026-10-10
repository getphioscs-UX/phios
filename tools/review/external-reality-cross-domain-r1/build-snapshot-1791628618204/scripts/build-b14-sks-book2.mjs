import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const paths={nodes:'content/knowledge/registry/successors/book-w1d/canonical-nodes-v1.json',bindings:'content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json',sections:'content/knowledge/manuscripts/extraction/book-2-full-section-inventory-v1.json'};
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const nodes=read(paths.nodes).nodes,bindings=read(paths.bindings).records,sections=read(paths.sections).sections;
const specialization={EXPERIENCE_STATE:'STATE',INTERPRETATION_PATTERN:'PATTERN',RESPONSE_PATTERN:'PATTERN',RELATIONSHIP_PATTERN:'RELATIONSHIP',ROLE:'CARRIER',DEPENDENCY:'DEPENDENCY',FEEDBACK:'FEEDBACK',COORDINATION:'COORDINATION_MODE',CONFLICT:'FAILURE_MODE',ALIGNMENT:'CONDITION',EXCHANGE:'RELATIONSHIP',COLLECTIVE_STATE:'STATE',BOUNDARY:'BOUNDARY',SIGNAL:'SIGNAL'};
// Explicit editorial selections, never inferred from a legacy node-code prefix.
const selections=[
 ['KN-B1-P5-002','EXPERIENCE_STATE','INDIVIDUAL'],['KN-B1-P5-016','INTERPRETATION_PATTERN','INDIVIDUAL'],['KN-B1-P5-058','FEEDBACK','INDIVIDUAL'],
 ['KN-B2-P6-002','COORDINATION','DYAD'],['KN-B2-P6-007','RELATIONSHIP_PATTERN','DYAD'],['KN-B2-P6-011','RELATIONSHIP_PATTERN','GROUP'],['KN-B2-P6-013','BOUNDARY','DYAD'],['KN-B2-P6-016','DEPENDENCY','DYAD'],['KN-B2-P6-037','COLLECTIVE_STATE','GROUP'],
 ['KN-B2-P7-024','COORDINATION','ORGANIZATION'],['KN-B2-P7-034','FEEDBACK','COLLECTIVE'],['KN-B2-P7-036','RESPONSE_PATTERN','COLLECTIVE']
];
const objects=selections.map(([code,subtype,level])=>{
 const n=nodes.find(n=>n.nodeCode===code);assert.equal(n?.publicationBookCode,'BOOK-2',code);
 const refs=bindings.filter(b=>b.nodeCode===code&&b.bookCode==='BOOK-2'&&b.status==='APPROVED');assert.ok(refs.length,code);
 const selected=[...new Set(refs.map(b=>b.sectionCode))].map(id=>{const s=sections.find(s=>s.sectionCode===id);assert.ok(s,id);assert.ok(refs.some(b=>b.sectionCode===id&&b.sectionTextSha256===s.textSha256));return s;});
 return {objectId:`SK-B2-${code.replace(/^KN-/,'')}`,bookCode:'BOOK-2',partCode:n.publicationPartCode,nodeCode:code,objectType:specialization[subtype],subtype,title:n.titleZhHans,titleEn:n.titleEn,runtimeLevel:level,canonicalQuestion:n.titleZhHans,definition:null,definitionState:'PENDING_SOURCE_EXTRACTION',triggerConditions:[],participants:[],signals:[],responses:[],feedbackLoops:[],coordinationEffects:[],relatedPatterns:[],sourceRefs:{canonicalNodeCodes:[code],manuscriptSectionRefs:selected.map(s=>s.sectionCode),publishedArticleRefs:[],figureRefs:[],relatedStructuredObjectIds:[]},sourceSections:selected.map(s=>({sectionCode:s.sectionCode,heading:s.heading,startPage:s.startPage,endPage:s.endPage,textSha256:s.textSha256})),unknowns:['Chapter mappings establish reading scope, not an extracted definition or causal relationship.','Runtime level and specialization await editorial review.'],status:'IN_REVIEW',projectionState:'CANDIDATE'};
});
const meta={version:'1.0.0',bookCode:'BOOK-2',status:'SOURCE_INDEX_PREVIEW',humanAcceptanceComplete:false,sourcePaths:paths,sourceDigests:Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')]))};
const write=(name,data)=>{const p=path.join(root,'content/knowledge/structured/book-2',name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify({...meta,...data},null,2)+'\n');};
write('book-2-structured-taxonomy-v1.json',{specializations:specialization,runtimeLevels:['INDIVIDUAL','DYAD','GROUP','ORGANIZATION','COLLECTIVE'],boundary:'Knowledge framework only; never actual user evidence, relationship reading or professional judgment.'});
write('book-2-runtime-pattern-registry-v1.json',{patterns:objects.map(o=>({patternId:o.objectId,...o}))});
write('book-2-interaction-pattern-registry-v1.json',{interactions:objects.filter(o=>['DYAD','GROUP'].includes(o.runtimeLevel)).map(o=>({interactionId:o.objectId,objectId:o.objectId,participantRoles:[],signalType:null,interpretationPattern:null,responsePattern:null,feedbackDirection:null,stabilizingOrDestabilizing:'UNKNOWN',sourceRefs:o.sourceRefs})),sequenceState:'WITHHELD_PENDING_PARAGRAPH_EVIDENCE'});
write('book-2-relationship-dynamics-v1.json',{objectIds:objects.filter(o=>['DYAD','GROUP'].includes(o.runtimeLevel)).map(o=>o.objectId),inferenceAllowed:false});
write('book-2-collective-runtime-registry-v1.json',{collectives:objects.filter(o=>['ORGANIZATION','COLLECTIVE'].includes(o.runtimeLevel)).map(o=>({collectiveRuntimeId:o.objectId,roles:[],resources:[],rules:[],informationFlows:[],authorityFlows:[],coordinationModes:[],feedbackSystems:[],dependencyStructure:[],failurePatterns:[],sourceRefs:o.sourceRefs}))});
write('book-2-perspectives-binding-v1.json',{surfaces:['/perspectives/','/perspectives/relationship/'],target:'/books/reality-runtime/#runtime-atlas',role:'KNOWLEDGE_FRAMEWORK',maySupplyUserEvidence:false,mayReplaceRelationshipReading:false,mayReplaceProfessionalJudgment:false});
console.log(`✓ Book II: ${objects.length} source-index previews; no invented definitions or feedback loops.`);

