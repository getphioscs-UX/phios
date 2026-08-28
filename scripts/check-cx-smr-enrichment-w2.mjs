import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {BASELINE,RESEARCH} from './audit-cx-smr-enrichment-depth.mjs';
import {checkW01,loadW01} from './check-cx-smr-enrichment-w01.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export function validateBook(book,w01,meaningCodes,ruleCodes){
 const source=w01.registry.sources.find(s=>s.sourceId===book.sourceId);assert(source,'unknown source');
 assert.equal(book.baselineCommit,BASELINE);assert.equal(book.sourceSha256,source.sourceObject.sha256);
 assert.equal(book.status,'SELECTED_PASSAGES_EXTRACTED_PENDING_SPECIALIST_REVIEW');
 assert.equal(book.productionAllowed,false);assert.equal(book.customerCutoverAllowed,false);assert.equal(book.w3Started,false);
 assert.equal(book.rawContentBundled,false);assert.equal(book.wholeChapterExtraction,false);assert.equal(book.wholeBookExtraction,false);
 assert.equal(book.ocrCoverageClaim,'NONE_IN_THIS_RECOVERED_DELIVERY');
 assert.equal(book.sourceBytesReverified,true);assert.equal(book.englishAdaptation,'NOT_STARTED');
 assert.equal(book.cardCount,book.cards.length);assert.equal(book.cardCount,w01.contract.expectedCardCounts[book.sourceId]);
 assert.equal(new Set(book.cards.map(c=>c.cardId)).size,book.cards.length);
 assert.equal(book.visualAnchorCount,new Set(book.cards.map(c=>c.anchor.pdfPage)).size);
 for(const card of book.cards){
  assert.equal(card.sourceId,book.sourceId);assert.equal(card.status,'RESEARCH_CANDIDATE');assert.equal(card.productionAdmitted,false);assert.equal(card.specialistReview,'PENDING');
  assert.equal(card.verbatimQuote,null);assert.equal(card.anchor.verificationStatus,'ASSISTANT_VISUAL_ANCHOR_VERIFIED');
  assert.equal(card.anchor.evidenceId,`${book.sourceId}-P${String(card.anchor.pdfPage).padStart(4,'0')}`);
  assert(Number.isInteger(card.anchor.pdfPage)&&card.anchor.pdfPage>0&&card.anchor.pdfPage<=source.sourceObject.pdfPageCount);
  assert(Number.isInteger(card.anchor.printedPage)&&card.anchor.printedPage>0);assert.match(card.anchor.rasterSha256,/^[a-f0-9]{64}$/);
  for(const field of ['title','chapter','sourceParaphrase','reportUseHypothesis','observationQuestion'])assert.equal(typeof card[field],'string');
  assert(card.sourceParaphrase.length>=25&&card.reportUseHypothesis.length>=25&&card.observationQuestion.length>=10);
  for(const field of ['requirements','doNotInfer','gapIds'])assert(Array.isArray(card[field])&&card[field].length>0);
  for(const gap of card.gapIds)assert(book.gapDefinitions[gap]);
  assert(['EXISTING_AUTHORITY_RECONCILIATION_REQUIRED','NEW_COMPOSITION_POLICY_REVIEW_REQUIRED','NEEDS_UPSTREAM_AUTHORITY'].includes(card.disposition));
  assert.equal(card.reconciliation.bindingStatus,'PROPOSED_TARGETS_NOT_ADMISSION');
  for(const code of card.reconciliation.meaningCodes)assert(meaningCodes.has(code),`Unknown meaning ${code}`);
  for(const code of card.reconciliation.ruleCodes)assert(ruleCodes.has(code),`Unknown rule ${code}`);
 }
 assert(book.exclusions.length>=3);assert.equal(book.rightsStatus,'NOT_ESTABLISHED');
 return true;
}
export function checkW2(ids,root=process.cwd()){
 const foundation=checkW01(root),w01=loadW01(root);
 const mappings=read(path.join(root,'content/professional/canonical-meaning-production/successors/canonical-method-meaning-mapping-v4.json')).mappings.filter(m=>m.sourcePluginCode==='AST');
 const meanings=new Set(mappings.map(m=>m.targetMeaningCode));
 const registry=fs.readFileSync(path.join(root,'content/customer-experience-rebuild/registries/cx-r12r3b-composition-rule-registry-v2.json'),'utf8');
 const rules=new Set(['CX-COMP-AST-PLANET-SIGN-HOUSE-v1','CX-COMP-AST-ASPECT-v1','CX-COMP-AST-PLACEMENT-v1'].filter(r=>registry.includes(JSON.stringify(r))));
 const summaries=[];const globalIds=[];
 for(const id of ids){
  const book=read(path.join(root,RESEARCH,'w2',`${id}-extractions-v1.json`));assert.equal(book.sourceId,id);validateBook(book,w01,meanings,rules);
  const mutations=[b=>b.productionAllowed=true,b=>b.cards[0].anchor.pdfPage=9999,b=>b.cards[0].anchor.verificationStatus='OCR_ONLY',b=>b.cards[0].doNotInfer=[],b=>b.cards[0].reconciliation.meaningCodes.push('CM-AST-INVENTED'),b=>b.sourceSha256='0'.repeat(64)];
  for(const mutate of mutations){const copy=structuredClone(book);mutate(copy);assert.throws(()=>validateBook(copy,w01,meanings,rules));}
  globalIds.push(...book.cards.map(c=>c.cardId));summaries.push({sourceId:id,cards:book.cardCount,visualAnchors:book.visualAnchorCount,negativeChecks:mutations.length,status:'PASS'});
 }
 assert.equal(new Set(globalIds).size,globalIds.length);
 return {status:'PASS',baselineCommit:BASELINE,foundation:foundation.status,books:summaries,totalCards:globalIds.length,productionAllowed:false,humanPending:48,w3Started:false,scope:'Research integrity and frozen-authority checks; not source licensing, scientific validation or human acceptance.'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const ids=process.argv[2]==='--all'?loadW01().contract.executionOrder:process.argv.slice(2);
 assert(ids.length,'Pass one source ID or --all');console.log(JSON.stringify(checkW2(ids),null,2));
}
