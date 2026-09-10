import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditPaiClaims,createPaiTargetedRepairPlan,createPaiArticleUtilityEvent} from '../functions/_lib/pai-r1-economics.js';

const read = path => JSON.parse(fs.readFileSync(path,'utf8'));
const owner = read('content/knowledge/knowledge-intelligence-r2/reconciliation/kir-grounded-composer-ownership-reconciliation-v1.json');
assert.equal(owner.status,'EXISTING_GROUNDED_COMPOSER_CONTINUES');
assert.equal(owner.providerOwner,'PAI_R1');
assert.equal(owner.contextOwner,'CX_R31_FUTURE_EXPLICIT_ADMISSION');
assert.equal(owner.phase4Boundary.personalContextMayBeConsumed,false);
assert.equal(owner.phase4Boundary.newComposerCreated,false);
const contract = read('content/knowledge/knowledge-intelligence-r2/contracts/kir-claim-provenance-targeted-repair-v1.json');
assert.equal(contract.status,'CLAIM_PROVENANCE_ACCEPTED');
const audit = auditPaiClaims([
  {claimId:'C1',outputSpan:'supported',claimType:'KNOWLEDGE_MECHANISM',sourceRefs:['NODE-1'],contextRefs:[]},
  {claimId:'C2',outputSpan:'unsupported',claimType:'REALITY_CLAIM',sourceRefs:[],contextRefs:[]},
  {claimId:'C3',outputSpan:'and',claimType:'TRANSITION',sourceRefs:[],contextRefs:[]}
]);
assert.equal(audit.unsupported,1);
const repair = createPaiTargetedRepairPlan(audit);
assert.equal(repair.mode,'TARGETED_SPAN_REPAIR');
assert.deepEqual(repair.affectedClaimIds,['C2']);
assert.equal(repair.reloadAllAccountContext,false);
const articleContract = read('content/knowledge/knowledge-intelligence-r2/contracts/kir-article-utility-event-v1.json');
assert.equal(articleContract.status,'ARTICLE_UTILITY_OBSERVABLE');
const event = createPaiArticleUtilityEvent({articleId:'A1',nodeId:'N1',requestId:'R1',retrievalRank:2,usageRole:'SUPPORTING_EVIDENCE'});
assert.equal(event.canonicalAuthorityCreated,false);
assert.equal(articleContract.authority.articlePopularityCreatesAuthority,false);
console.log('✓ KIR composer ownership, claim provenance, targeted repair and article utility boundaries passed.');
