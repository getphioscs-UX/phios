import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { reviewP1Candidate, uploadApprovedP1 } from './lib/knowledge-manuscripts/p1-human-review.mjs';
import { reviewP2Candidate, uploadApprovedP2 } from './lib/knowledge-manuscripts/p2-human-review.mjs';
import { reviewP3Candidate, uploadApprovedP3 } from './lib/knowledge-manuscripts/p3-human-review.mjs';
import { reviewP4Candidate, uploadApprovedP4 } from './lib/knowledge-manuscripts/p4-human-review.mjs';
import { reviewP5Candidate, uploadApprovedP5 } from './lib/knowledge-manuscripts/p5-human-review.mjs';
import { generatePartMappingCandidates } from './lib/knowledge-manuscripts/part-mapping-candidate-generation.mjs';
import { reviewP1NodeMapping } from './lib/knowledge-manuscripts/p1-mapping-review.mjs';
import { reviewP2NodeMapping } from './lib/knowledge-manuscripts/p2-mapping-review.mjs';
import { reviewP3NodeMapping } from './lib/knowledge-manuscripts/p3-mapping-review.mjs';
import { reviewP4NodeMapping } from './lib/knowledge-manuscripts/p4-mapping-review.mjs';
import { reviewP5NodeMapping } from './lib/knowledge-manuscripts/p5-mapping-review.mjs';

const ROOT = process.cwd();
const CHECKS = ['titles','paragraphs','order','encoding','completeness','headings','page-numbers','figure-captions','theoretical-meaning'];
const SCHEMA_VERSION='PHI-OS-KNR-W2R1-v1.2.1';
const CONTROLLED_ENGLISH_TERMS = Object.freeze(['PHI OS','Solar Driver','SDU','RIS']);
const parts = {
  P1:{slug:'p1-reality-physics',review:reviewP1Candidate,upload:uploadApprovedP1},
  P2:{slug:'p2-projection-system',review:reviewP2Candidate,upload:uploadApprovedP2},
  P3:{slug:'p3-runtime-dynamics',review:reviewP3Candidate,upload:uploadApprovedP3},
  P4:{slug:'p4-human-runtime-carrier',review:reviewP4Candidate,upload:uploadApprovedP4},
  P5:{slug:'p5-conscious-runtime',review:reviewP5Candidate,upload:uploadApprovedP5}
};
const mappingReviewers={P1:reviewP1NodeMapping,P2:reviewP2NodeMapping,P3:reviewP3NodeMapping,P4:reviewP4NodeMapping,P5:reviewP5NodeMapping};
const sha256=b=>createHash('sha256').update(b).digest('hex');
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const writeJson=(p,v)=>fs.writeFileSync(p,`${JSON.stringify(v,null,2)}\n`,'utf8');
function candidatePath(meta){return path.join(ROOT,'.tmp/knowledge-manuscripts/book-1',`${meta.slug}-candidate.md`)}
function reportPath(meta){return path.join(ROOT,'.tmp/knowledge-manuscripts/book-1',`${meta.slug}-human-review.json`)}
function extractionPath(meta){return path.join(ROOT,'.tmp/knowledge-manuscripts/book-1',`${meta.slug}-extraction-report.json`)}
function headings(text){return text.split(/\r?\n/u).map(x=>x.match(/^#{1,6}\s+(.+?)\s*$/u)?.[1]?.trim()||null).filter(Boolean)}
function unexpectedEnglishTerms(value){
 let next=value;
 for(const term of CONTROLLED_ENGLISH_TERMS) next=next.replaceAll(term,'');
 return [...new Set(next.match(/[A-Za-z][A-Za-z0-9-]*/gu)||[])];
}
function headingLanguageState(values){
 const unexpected=[...new Set(values.flatMap(unexpectedEnglishTerms))];
 return {status:unexpected.length?'unexpected_english_present':'controlled_mixed_or_chinese',controlledTerms:[...CONTROLLED_ENGLISH_TERMS],unexpectedEnglishTerms:unexpected};
}
function statusRow(code,meta){
 const p=candidatePath(meta); const bytes=fs.readFileSync(p); const text=bytes.toString('utf8'); const h=headings(text);
 const review=meta.review({root:ROOT,mode:'dry-run'});
 return {partCode:code,candidatePath:path.relative(ROOT,p).replaceAll('\\','/'),candidateSha256:sha256(bytes),sizeBytes:bytes.length,characterCount:text.length,headingCount:h.length,headingAuthority:'candidate_markdown',headingLanguage:headingLanguageState(h),humanVerified:review.humanVerified,status:review.status,r2TargetObjectKey:review.r2TargetObjectKey};
}
async function main(){
 const [command,...args]=process.argv.slice(2); const apply=args.includes('--apply'); const confirm=args.includes('--confirm-tl');
 if(command==='status'){
  console.log(JSON.stringify({schemaVersion:SCHEMA_VERSION,command,status:'ok',parts:Object.entries(parts).map(([c,m])=>statusRow(c,m))},null,2)); return;
 }
 if(command==='approve-all'){
  if(!confirm) throw new Error('APPROVE_ALL_REQUIRES_--confirm-tl');
  const results=[]; for(const [code,meta] of Object.entries(parts)){
   const bytes=fs.readFileSync(candidatePath(meta));
   results.push(meta.review({root:ROOT,mode:'approve',expectedSha256:sha256(bytes),reviewerRole:'TL',confirmations:CHECKS}));
  }
  console.log(JSON.stringify({schemaVersion:SCHEMA_VERSION,command,status:'human_verified',results},null,2)); return;
 }
 if(command==='upload-all'){
  const results=[]; for(const [code,meta] of Object.entries(parts)) results.push(await meta.upload({root:ROOT,mode:apply?'apply':'dry-run'}));
  console.log(JSON.stringify({schemaVersion:SCHEMA_VERSION,command,mode:apply?'apply':'dry-run',status:apply?'private_r2_synchronized':'ready',results},null,2)); return;
 }
 if(command==='reconcile'){
  const manifestPath=path.join(ROOT,'content/knowledge/manuscripts/book-1/manuscript-manifest.json');
  const inventoryPath=path.join(ROOT,'content/knowledge/manuscripts/book-1/book-1-section-inventory.json');
  const manifest=readJson(manifestPath); const inventory=readJson(inventoryPath);
  for(const [code,meta] of Object.entries(parts)){
   const review=readJson(reportPath(meta)); const extraction=readJson(extractionPath(meta));
   if(review.humanVerified!==true) throw new Error(`${code}_NOT_HUMAN_VERIFIED`);
   const hash=review.candidate?.sha256??review.candidateSha256; const count=review.candidate?.characterCount??review.candidateCharacterCount;
   const mp=manifest.parts.find(x=>x.partCode===code); const ip=inventory.parts.find(x=>x.partCode===code); if(!mp||!ip) throw new Error(`${code}_AUTHORITY_MISSING`);
   mp.normalizationStatus='human_verified'; mp.humanVerified=true; manifest.contentHashes.normalizedParts[code]=hash;
   const object=manifest.objects?.find(x=>x.objectKey===mp.normalizedObjectKey); if(!object) throw new Error(`${code}_MANIFEST_OBJECT_MISSING`); object.sha256=hash; if(Number.isInteger(review.candidate?.sizeBytes??review.candidateSizeBytes)) object.sizeBytes=review.candidate?.sizeBytes??review.candidateSizeBytes;
   ip.title=mp.title; ip.sequence=mp.sequence; ip.sourceObjectKey=mp.sourceObjectKey; ip.normalizedObjectKey=mp.normalizedObjectKey;
   ip.estimatedCharacterCount=count; ip.sectionHash=hash; ip.normalizationStatus='human_verified'; ip.humanVerified=true; ip.stalenessStatus='CURRENT';
   const range=extraction.selectedPageRange??extraction.extraction?.selectedPageRange; if(range){ip.startPage=range.startPage;ip.endPage=range.endPage;}
  }
  if(apply){writeJson(manifestPath,manifest);writeJson(inventoryPath,inventory)}
  console.log(JSON.stringify({schemaVersion:SCHEMA_VERSION,command,mode:apply?'apply':'dry-run',status:apply?'reconciled':'reconcile_plan_validated',writes:apply?2:0},null,2)); return;
 }

 if(command==='heading-authority'){
  const rows=Object.entries(parts).map(([code,meta])=>{const p=candidatePath(meta);const text=fs.readFileSync(p,'utf8');const h=headings(text);return {partCode:code,candidatePath:path.relative(ROOT,p).replaceAll('\\','/'),candidateSha256:sha256(fs.readFileSync(p)),headingCount:h.length,headingLanguage:headingLanguageState(h),headings:h};});
  console.log(JSON.stringify({schemaVersion:SCHEMA_VERSION,command,status:'candidate_markdown_authoritative',authorityRule:'mapping_review_headings_are_reparsed_from_current_candidate_markdown',parts:rows},null,2)); return;
 }
 if(command==='generate-all-mapping-candidates'){
  if(!apply){
   const mapping=readJson(path.join(ROOT,'content/knowledge/manuscripts/book-1/node-manuscript-mapping.json'));
   const plan=Object.keys(parts).map(code=>({partCode:code,currentStatuses:[...new Set(mapping.mappings.filter(x=>x.partCode===code).map(x=>x.mappingStatus))],action:'generate_or_preserve_candidate'}));
   console.log(JSON.stringify({schemaVersion:SCHEMA_VERSION,command,mode:'dry-run',status:'candidate_generation_plan_validated',sequentialOrder:Object.keys(parts),plan,writes:0},null,2)); return;
  }
  const results=[]; for(const code of Object.keys(parts)) results.push(generatePartMappingCandidates({root:ROOT,partCode:code,mode:'apply'}));
  console.log(JSON.stringify({schemaVersion:SCHEMA_VERSION,command,mode:'apply',status:'all_mapping_candidates_ready',results,writes:results.reduce((n,x)=>n+(x.writes||0),0)},null,2)); return;
 }
 if(command==='prepare-all-mapping-reviews'){
  const removed=[];
  if(apply){for(const code of Object.keys(parts)){const rp=path.join(ROOT,'.tmp/knowledge-manuscripts/book-1',`${code.toLowerCase()}-node-mapping-review.json`);if(fs.existsSync(rp)){fs.unlinkSync(rp);removed.push(path.relative(ROOT,rp).replaceAll('\\','/'));}}}
  if(!apply){console.log(JSON.stringify({schemaVersion:SCHEMA_VERSION,command,mode:'dry-run',status:'mapping_review_prepare_plan_validated',requires:'generate-all-mapping-candidates --apply',willReset:Object.keys(parts).map(code=>`.tmp/knowledge-manuscripts/book-1/${code.toLowerCase()}-node-mapping-review.json`),writes:0},null,2));return;}
  const results=[]; for(const code of Object.keys(parts)) results.push(mappingReviewers[code]({root:ROOT,mode:'prepare'}));
  console.log(JSON.stringify({schemaVersion:SCHEMA_VERSION,command,mode:'apply',status:'all_mapping_reviews_prepared',headingAuthority:'candidate_markdown',removed,results,writes:results.reduce((n,x)=>n+(x.writes||0),0)},null,2)); return;
 }

 if(command==='reset-mapping-reviews'){
  const removed=[]; for(const [code] of Object.entries(parts)){const p=path.join(ROOT,'.tmp/knowledge-manuscripts/book-1',`${code.toLowerCase()}-node-mapping-review.json`);if(fs.existsSync(p)){if(apply)fs.unlinkSync(p);removed.push(path.relative(ROOT,p));}}
  console.log(JSON.stringify({schemaVersion:SCHEMA_VERSION,command,mode:apply?'apply':'dry-run',status:apply?'mapping_reviews_reset':'reset_plan_validated',removed},null,2)); return;
 }
 throw new Error('COMMAND_REQUIRED: status | heading-authority | approve-all --confirm-tl | reconcile [--apply] | upload-all [--apply] | generate-all-mapping-candidates [--apply] | prepare-all-mapping-reviews [--apply] | reset-mapping-reviews [--apply]');
}
main().catch(e=>{console.error(JSON.stringify({schemaVersion:SCHEMA_VERSION,status:'blocked',code:e.message},null,2));process.exitCode=2});
