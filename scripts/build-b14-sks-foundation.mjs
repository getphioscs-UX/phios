import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const write = (p, value) => { fs.mkdirSync(path.dirname(path.join(root,p)), {recursive:true}); fs.writeFileSync(path.join(root,p), JSON.stringify(value,null,2)+'\n'); };
const digest = p => createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
function filesUnder(dir) {
  return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?filesUnder(`${dir}/${e.name}`):[`${dir}/${e.name}`]);
}
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
  architecturePointer: 'content/registry/current-book-architecture.json',
  books: 'content/registry/successors/seven-volume-v1/books.json', parts: 'content/registry/successors/seven-volume-v1/parts.json',
  book3Canonical: 'content/knowledge/contracts/book-3-final-canonical-authority-v1.json',
  book4Canonical: 'content/knowledge/contracts/book-4-final-canonical-authority-v1.json',
  book3Manuscript: 'content/knowledge/manuscripts/completed/book-3-completed-manuscript-v1.json',
  book4Manuscript: 'content/knowledge/manuscripts/completed/book-4-completed-manuscript-v1.json',
  book3Sections: 'content/knowledge/manuscripts/extraction/book-3-final-section-semantics-v1.json',
  book4Sections: 'content/knowledge/manuscripts/extraction/book-4-final-section-inventory-v1.json'
};
const nodes = read(authorities.canonicalKnowledge).nodes;
const published = read(authorities.publicationBindings).records;
const reviewed = read(authorities.review).records;
const blueprints = read(authorities.blueprintDiscovery).books;
const books = blueprints.filter(b=>['BOOK-1','BOOK-2','BOOK-3','BOOK-4'].includes(b.bookCode)).map(book=>{
  const successor = book.bookCode==='BOOK-3' ? read(authorities.book3Canonical).finalAuthority : book.bookCode==='BOOK-4' ? read(authorities.book4Canonical).finalAuthority : null;
  const blueprintPath = successor?.blueprintPath || book.blueprintPath;
  const canonicalRegistryPath = successor?.canonicalRegistryPath || authorities.canonicalKnowledge;
  const activeNodes = read(canonicalRegistryPath).nodes;
  const blueprint = read(blueprintPath);
  const codes = [...new Set((blueprint.parts||[]).flatMap(p=>(p.nodes||[]).map(n=>typeof n==='string'?n:n.nodeCode)))];
  const sourceNodes = activeNodes.filter(n=>codes.includes(n.nodeCode));
  const articles = published.filter(p=>p.bookCode===book.bookCode);
  return { bookCode:book.bookCode, blueprintPath, canonicalRegistryPath, canonicalRegistrySha256:digest(canonicalRegistryPath), partCodes:blueprint.parts.map(p=>p.partCode),
    canonicalNodeCodes:sourceNodes.map(n=>n.nodeCode),
    publishedArticles:articles.map(a=>({nodeCode:a.nodeCode,articleCode:a.articleCode,locale:a.locale,href:a.href,authorityPath:a.authorityPath})),
    reviewedWithoutCurrentPublishedBinding:reviewed.filter(r=>codes.includes(r.nodeCode)&&r.decision==='accept'&&!published.some(p=>p.nodeCode===r.nodeCode&&p.locale===r.locale)).map(r=>({nodeCode:r.nodeCode,locale:r.locale,reviewCode:r.reviewCode})),
    nodesWithoutPublishedBinding:codes.filter(c=>!articles.some(a=>a.nodeCode===c)),
    directExtractionCandidates:sourceNodes.filter(n=>n.sourceReferences?.length).map(n=>({nodeCode:n.nodeCode,sourceReferences:n.sourceReferences,admission:'SOURCE_TEXT_AND_SEMANTIC_REVIEW_REQUIRED'}))
  };
});
const consumerPaths={
  KNR:'functions/_lib/knowledge-access-api.js', PJA:'content/knowledge/contracts/published-knowledge-authority-v1.json',
  KAP:'functions/_lib/knowledge-answer-grounding.js', CKA:'functions/_lib/client-knowledge-ask.js',
  Ask:'functions/contextual-ask/contextual-ask-runtime.js', Figures:'assets/js/runtime/web-production/asset-resolver.js',
  ReadingPaths:'content/knowledge/public/public-reading-paths.json', Books:'assets/js/pages/book-volume-seven.js',
  Reality:'functions/current-reality/personal-current-reality-runtime.js',
  Perspectives:'functions/canonical-meaning-runtime/meaning-knowledge-bridge.js',
  Professional:'functions/professional/financial/financial-runtime-v1.js'
};
const consumerInventory=Object.entries(consumerPaths).map(([system,p])=>{
  const text=fs.readFileSync(path.join(root,p),'utf8');
  return {system,path:p,sha256:digest(p),labels:['PRESENT',p.endsWith('.js')?'RUNTIME_CONSUMED':'CURRENT_AUTHORITY'],
    canonicalReferenceEvidence:text.split(/\r?\n/).flatMap((line,index)=>/canonical|nodeCode|knowledge/i.test(line)?[{line:index+1,text:line.trim().slice(0,220)}]:[]).slice(0,8),
    structuredKnowledgeConsumed:false,successorAction:'Reuse existing owner at the specified W-stage; no parallel runtime.'};
});
const articleOutputCheckerInventory=filesUnder('scripts').filter(p=>p.endsWith('.mjs')&&!p.includes('b14-sks')).flatMap(p=>{
  const text=fs.readFileSync(path.join(root,p),'utf8');
  const evidence=text.split(/\r?\n/).flatMap((line,i)=>/minimumPublishRequirement|primaryAssetType|ARTICLE_ONLY|article.*(?:required|only)|(?:required|only).*article/i.test(line)?[{line:i+1,text:line.trim().slice(0,240)}]:[]);
  return evidence.length?[{path:p,sha256:digest(p),evidence,classification:'RECONCILIATION_CANDIDATE_NOT_AUTOMATICALLY_INVALID',action:'Review at W45–W47/W64–W70; retain article-specific gates.'}]:[];
});
const reviewCampaignInventory=filesUnder('content/knowledge/production-planning/review').filter(p=>p.endsWith('.json')).map(p=>{const data=read(p);return {path:p,sha256:digest(p),status:data.status??null,recordCount:data.records?.length??null,authorityPromotion:false};});
write('docs/knowledge/structured-successor/b14-sks-w0-baseline-audit-v1.json', {
  version:'1.0.0', stage:'B14-SKS-W0', status:'BASELINE_AUDITED_WITH_EXPLICIT_GAPS', baselineCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  authorityInventory:Object.entries(authorities).map(([role,p])=>({role,path:p,sha256:digest(p),labels:['PRESENT','CURRENT_AUTHORITY'],note:role==='publicationBindings'?'Discovery projection; publication packages remain authority.':undefined})),
  historicalRegistries:[{path:'content/knowledge/registry/nodes.json',labels:['PRESENT','HISTORICAL']},{path:'content/registry/books.json',labels:['PRESENT','HISTORICAL','FROZEN']},{path:authorities.canonicalKnowledge,scope:'BOOK-3 and BOOK-4 records superseded by scoped final authorities',labels:['HISTORICAL']}], books,
  consumerInventory,articleOutputCheckerInventory,reviewCampaignInventory,
  knownGaps:['Structured registries and explorer consumers are not yet implemented.', 'Article-specific gates require scoped reconciliation at W45–W47; source-text matches are candidates, not proof of a defective checker.', 'Review campaign counts are preserved independently; review acceptance alone never establishes publication.', 'Manuscript bytes and remote R2 availability are not reverified by this local baseline audit.'],
  nextStage:'W5–W11 Book I source-grounded extraction and explorer implementation. Book III uses 103 final nodes; Book IV uses 125 final nodes.',
  humanAcceptanceComplete:false, productionCutover:false
});
write(base+'authority/structured-knowledge-authority-contract-v1.json', {
  version:'1.0.0',status:'FOUNDATION_CONTRACT_READY',projectionOnly:true,authorities,
  canonicalAuthorityByBook:Object.fromEntries(books.map(b=>[b.bookCode,b.canonicalRegistryPath])),
  authorityChain:['SOURCE_MANUSCRIPT','CANONICAL_NODE','STRUCTURED_EXTRACTION','BOOK_REGISTRY','SHARED_CONTRACT','INTERACTIVE_PROJECTION','EXISTING_CONSUMERS'],
  forbidden:['SECOND_CANONICAL_NODE_REGISTRY','SECOND_ARTICLE_RUNTIME','SECOND_CONTEXT_RESOLVER','SECOND_ASK_RUNTIME','SECOND_KNOWLEDGE_MASTER','ARTICLE_ONLY_EXTRACTION_AUTHORITY','LLM_AUTHORITY','AUTOMATIC_THEORY_PROMOTION','AUTOMATIC_PERSONAL_DIAGNOSIS'],
  publicationPolicy:{rewriteExistingArticles:false,republishExistingArticles:false,changeArticleUrls:false},
  activationRequires:['CANONICAL_SOURCE_VALIDATION','MANUSCRIPT_SEMANTIC_REVIEW','HUMAN_ACCEPTANCE','CUSTOMER_ACCEPTANCE'],
  currentRealityRemainsSeparatelyGated:true
});
write(base+'schema/structured-knowledge-types-v1.json',{version:'1.0.0',status:'FOUNDATION_CONTRACT_READY',objectTypes:types,relationshipTypes:relationships,claimStrengths:['CANONICAL','SUPPORTED','CONCEPTUAL','ILLUSTRATIVE'],specializationPolicy:'Book-specific terms must map to a universal objectType and retain their own subtype. STRUCTURE in W5 is not automatically added to W3 universal types.'});
const string = {type:'string',minLength:1};
const strings = {type:'array',items:string,uniqueItems:true};
const sourceRefs = {type:'object',additionalProperties:false,required:['canonicalNodeCodes','manuscriptSectionRefs','publishedArticleRefs','figureRefs','relatedStructuredObjectIds'],properties:{canonicalNodeCodes:{...strings,minItems:1},manuscriptSectionRefs:{...strings,minItems:1},publishedArticleRefs:strings,figureRefs:strings,relatedStructuredObjectIds:strings}};
const relation = {type:'object',additionalProperties:false,required:['relationshipId','sourceObjectId','targetObjectId','relationshipType','claimStrength','sourceRefs','evidenceState'],properties:{relationshipId:string,sourceObjectId:string,targetObjectId:string,relationshipType:{enum:relationships},claimStrength:{enum:['CANONICAL','SUPPORTED','CONCEPTUAL','ILLUSTRATIVE']},sourceRefs,evidenceState:{enum:['CANONICAL_SOURCE','SUPPORTED_SOURCE','UNREVIEWED','UNKNOWN']}}};
relation.allOf=[{if:{properties:{claimStrength:{const:'CANONICAL'}}},then:{properties:{evidenceState:{const:'CANONICAL_SOURCE'}}}},{if:{properties:{claimStrength:{const:'SUPPORTED'}}},then:{properties:{evidenceState:{enum:['CANONICAL_SOURCE','SUPPORTED_SOURCE']}}}}];
write(base+'schema/structured-knowledge-object-v1.schema.json',{
  $schema:'http://json-schema.org/draft-07/schema#',title:'Governed structured knowledge projection',type:'object',additionalProperties:false,
  required:['objectId','bookCode','partCode','nodeCode','sourceRefs','objectType','title','summary','canonicalMeaning','relationships','evidenceState','unknownState','projectionState','localeState','status','version'],
  properties:{objectId:string,bookCode:{enum:['BOOK-1','BOOK-2','BOOK-3','BOOK-4']},partCode:{type:'string',pattern:'^P(?:[0-9]|1[01])$'},nodeCode:string,sourceRefs,objectType:{enum:types},subtype:string,title:string,summary:string,canonicalMeaning:string,relationships:{type:'array',items:relation},evidenceState:{enum:['CANONICAL_SOURCE','SUPPORTED_SOURCE','UNREVIEWED','UNKNOWN']},unknownState:strings,projectionState:{enum:['CANDIDATE','REVIEWED','ACTIVE','WITHHELD']},localeState:{type:'object',minProperties:1,additionalProperties:{enum:['SOURCE','REVIEWED','MISSING']}},status:{enum:['DRAFT','IN_REVIEW','ACCEPTED','ACTIVE','RETIRED']},version:{type:'string',pattern:'^[0-9]+\\.[0-9]+\\.[0-9]+$'}},
  allOf:[{if:{properties:{status:{enum:['ACTIVE','ACCEPTED']}}},then:{properties:{evidenceState:{enum:['CANONICAL_SOURCE','SUPPORTED_SOURCE']}}}}]
});
write(base+'schema/structured-knowledge-relationship-v1.schema.json',{$schema:'http://json-schema.org/draft-07/schema#',...relation});
const ledgerPath='docs/knowledge/structured-successor/b14-sks-execution-ledger-v1.json';
const priorLedger=fs.existsSync(path.join(root,ledgerPath))?read(ledgerPath):null;
write(ledgerPath,{
  version:'1.0.0',frozenOrder:[ [0,4],[5,11],[12,18],[19,26],[27,33],[34,36],[37,40],[41,44],[45,49],[50,52],[53,55],[56,61],[62,70],[71,77],[78,80] ],
  stages:Array.from({length:81},(_,w)=>w>4&&priorLedger?.stages?.find(s=>s.stage===`B14-SKS-W${w}`)||({stage:`B14-SKS-W${w}`,status:w<=4?'IMPLEMENTED_PENDING_CHECK':'NOT_STARTED'})),
  humanReviewComplete:priorLedger?.humanReviewComplete||false,customerAcceptanceComplete:priorLedger?.customerAcceptanceComplete||false,productionFreezeComplete:priorLedger?.productionFreezeComplete||false,nextStage:priorLedger?.nextStage||'B14-SKS-W5'
});
console.log('B14-SKS W0 baseline and W1–W4 foundation generated; later stage evidence preserved.');
