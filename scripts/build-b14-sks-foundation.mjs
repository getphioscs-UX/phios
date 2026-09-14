import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const write = (p, value) => { fs.mkdirSync(path.dirname(path.join(root,p)), {recursive:true}); fs.writeFileSync(path.join(root,p), JSON.stringify(value,null,2)+'\n'); };
const digest = p => createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const base = 'content/knowledge/structured/';
const types = 'MECHANISM STATE SIGNAL CONDITION BOUNDARY CONSTRAINT PRESSURE CAPACITY LOAD PATTERN RELATIONSHIP DEPENDENCY FEEDBACK TRANSITION THRESHOLD FAILURE_MODE RECOVERY_MODE EXPANSION_MODE SCALE_SHIFT CARRIER RESOURCE COORDINATION_MODE CONTINUITY_MODE OBSERVATION_CUE'.split(' ');
const relationships = 'REQUIRES ENABLES INCREASES REDUCES CONSTRAINS AMPLIFIES STABILIZES DESTABILIZES PRECEDES FOLLOWS TRANSITIONS_TO DEPENDS_ON OBSERVED_BY SUPPORTED_BY OPPOSES CO_OCCURS_WITH HAS_COMPONENT PART_OF SCALES_TO RECOVERS_TO FAILS_INTO'.split(' ');
const authorities = {
  canonicalKnowledge: 'content/knowledge/registry/successors/book-w1d/canonical-nodes-v1.json',
  authorityContract: 'content/knowledge/contracts/knowledge-registry-authority-book-w1d-v1.json',
  blueprintDiscovery: 'content/knowledge/blueprints/blueprint-registry.json',
  publication: 'content/knowledge/contracts/published-knowledge-authority-v1.json',
  publicationBindings: 'content/knowledge/knowledge-intelligence-r2/registries/successors/book4-publication-v1/kir-r2-book-i-iv-published-article-binding-registry-v3.json',
  review: 'content/knowledge/production/registry/review-registry.json',
  manuscriptSources: 'content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v1.json',
  manuscriptBindings: 'content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json',
  books: 'content/registry/books.json', parts: 'content/registry/parts.json'
};
const nodes = read(authorities.canonicalKnowledge).nodes;
const published = read(authorities.publicationBindings).records;
const reviewed = read(authorities.review).records;
const blueprints = read(authorities.blueprintDiscovery).books;
const books = blueprints.filter(b=>['BOOK-1','BOOK-2','BOOK-3','BOOK-4'].includes(b.bookCode)).map(book=>{
  const blueprint = read(book.blueprintPath);
  const codes = [...new Set((blueprint.parts||[]).flatMap(p=>(p.nodes||[]).map(n=>typeof n==='string'?n:n.nodeCode)))];
  const sourceNodes = nodes.filter(n=>codes.includes(n.nodeCode));
  const articles = published.filter(p=>p.bookCode===book.bookCode);
  return { bookCode:book.bookCode, blueprintPath:book.blueprintPath, partCodes:book.partCodes,
    canonicalNodeCodes:sourceNodes.map(n=>n.nodeCode),
    publishedArticles:articles.map(a=>({nodeCode:a.nodeCode,articleCode:a.articleCode,locale:a.locale,href:a.href,authorityPath:a.authorityPath})),
    reviewedWithoutCurrentPublishedBinding:reviewed.filter(r=>codes.includes(r.nodeCode)&&r.decision==='accept'&&!published.some(p=>p.nodeCode===r.nodeCode&&p.locale===r.locale)).map(r=>({nodeCode:r.nodeCode,locale:r.locale,reviewCode:r.reviewCode})),
    nodesWithoutPublishedBinding:codes.filter(c=>!articles.some(a=>a.nodeCode===c)),
    directExtractionCandidates:sourceNodes.filter(n=>n.sourceReferences?.length).map(n=>({nodeCode:n.nodeCode,sourceReferences:n.sourceReferences,admission:'SOURCE_TEXT_AND_SEMANTIC_REVIEW_REQUIRED'}))
  };
});
write('docs/knowledge/structured-successor/b14-sks-w0-baseline-audit-v1.json', {
  version:'1.0.0', stage:'B14-SKS-W0', status:'AUDIT_IN_PROGRESS', baselineCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  authorityInventory:Object.entries(authorities).map(([role,p])=>({role,path:p,sha256:digest(p),labels:['PRESENT','CURRENT_AUTHORITY'],note:role==='publicationBindings'?'Discovery projection; publication packages remain authority.':undefined})),
  historicalRegistries:[{path:'content/knowledge/registry/nodes.json',labels:['PRESENT','HISTORICAL']}], books,
  unresolved:['Complete manuscript authority and section coverage reconciliation for Book III–IV.', 'Audit KNR/PJA/KAP/CKA, Ask, figures, reading paths and Reality/Perspectives/Professional runtime consumers.', 'Identify and reconcile article-only output checker assumptions before successor cutover.', 'Review-only accounting is scoped to the existing review registry; later campaign ledgers require reconciliation.'],
  nextStage:'Complete W0 audit before admitting Book I objects; W1–W4 contracts are prepared drafts.',
  humanAcceptanceComplete:false, productionCutover:false
});
write(base+'authority/structured-knowledge-authority-contract-v1.json', {
  version:'1.0.0',status:'DRAFT_PENDING_BASELINE_COMPLETION',projectionOnly:true,authorities,
  authorityChain:['SOURCE_MANUSCRIPT','CANONICAL_NODE','STRUCTURED_EXTRACTION','BOOK_REGISTRY','SHARED_CONTRACT','INTERACTIVE_PROJECTION','EXISTING_CONSUMERS'],
  forbidden:['SECOND_CANONICAL_NODE_REGISTRY','SECOND_ARTICLE_RUNTIME','SECOND_CONTEXT_RESOLVER','SECOND_ASK_RUNTIME','SECOND_KNOWLEDGE_MASTER','ARTICLE_ONLY_EXTRACTION_AUTHORITY','LLM_AUTHORITY','AUTOMATIC_THEORY_PROMOTION','AUTOMATIC_PERSONAL_DIAGNOSIS'],
  publicationPolicy:{rewriteExistingArticles:false,republishExistingArticles:false,changeArticleUrls:false},
  activationRequires:['CANONICAL_SOURCE_VALIDATION','MANUSCRIPT_SEMANTIC_REVIEW','HUMAN_ACCEPTANCE','CUSTOMER_ACCEPTANCE'],
  currentRealityRemainsSeparatelyGated:true
});
write(base+'schema/structured-knowledge-types-v1.json',{version:'1.0.0',status:'DRAFT_PENDING_BASELINE_COMPLETION',objectTypes:types,relationshipTypes:relationships,claimStrengths:['CANONICAL','SUPPORTED','CONCEPTUAL','ILLUSTRATIVE'],specializationPolicy:'Book-specific terms must map to a universal objectType and retain their own subtype. STRUCTURE in W5 is not automatically added to W3 universal types.'});
const string = {type:'string',minLength:1};
const strings = {type:'array',items:string,uniqueItems:true};
const sourceRefs = {type:'object',additionalProperties:false,required:['canonicalNodeCodes','manuscriptSectionRefs','publishedArticleRefs','figureRefs','relatedStructuredObjectIds'],properties:{canonicalNodeCodes:{...strings,minItems:1},manuscriptSectionRefs:{...strings,minItems:1},publishedArticleRefs:strings,figureRefs:strings,relatedStructuredObjectIds:strings}};
const relation = {type:'object',additionalProperties:false,required:['relationshipId','sourceObjectId','targetObjectId','relationshipType','claimStrength','sourceRefs','evidenceState'],properties:{relationshipId:string,sourceObjectId:string,targetObjectId:string,relationshipType:{enum:relationships},claimStrength:{enum:['CANONICAL','SUPPORTED','CONCEPTUAL','ILLUSTRATIVE']},sourceRefs,evidenceState:{enum:['CANONICAL_SOURCE','SUPPORTED_SOURCE','UNREVIEWED','UNKNOWN']}}};
write(base+'schema/structured-knowledge-object-v1.schema.json',{
  $schema:'http://json-schema.org/draft-07/schema#',title:'Governed structured knowledge projection',type:'object',additionalProperties:false,
  required:['objectId','bookCode','partCode','nodeCode','sourceRefs','objectType','title','summary','canonicalMeaning','relationships','evidenceState','unknownState','projectionState','localeState','status','version'],
  properties:{objectId:string,bookCode:{enum:['BOOK-1','BOOK-2','BOOK-3','BOOK-4']},partCode:{type:'string',pattern:'^P(?:[0-9]|1[01])$'},nodeCode:string,sourceRefs,objectType:{enum:types},subtype:string,title:string,summary:string,canonicalMeaning:string,relationships:{type:'array',items:relation},evidenceState:{enum:['CANONICAL_SOURCE','SUPPORTED_SOURCE','UNREVIEWED','UNKNOWN']},unknownState:strings,projectionState:{enum:['CANDIDATE','REVIEWED','ACTIVE','WITHHELD']},localeState:{type:'object',minProperties:1,additionalProperties:{enum:['SOURCE','REVIEWED','MISSING']}},status:{enum:['DRAFT','IN_REVIEW','ACCEPTED','ACTIVE','RETIRED']},version:{type:'string',pattern:'^[0-9]+\\.[0-9]+\\.[0-9]+$'}},
  allOf:[{if:{properties:{status:{enum:['ACTIVE','ACCEPTED']}}},then:{properties:{evidenceState:{enum:['CANONICAL_SOURCE','SUPPORTED_SOURCE']}}}}]
});
write(base+'schema/structured-knowledge-relationship-v1.schema.json',{$schema:'http://json-schema.org/draft-07/schema#',...relation});
console.log('B14-SKS W0 evidence inventory and W1–W4 draft contracts generated; no objects promoted.');
