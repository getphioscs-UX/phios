import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {r6VisualOwnerBytes} from './final-health-route-successor.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
export const PPR_PREENTRY_SUCCESSOR='content/professional/personal-reality/current/ppr-five-method-preentry-engineering-successor-v1.json';
const path='perspectives/personal/index.html';
const methods=['astrology','bazi','human-design','numerology','ziwei'];

export function validatePprPreentryDelta(next,current,previous){
 assert.equal(next.status,'ENGINEERING_SUCCESSOR_PENDING_HUMAN_REVIEW');
 assert.equal(next.changeType,'FIVE_ADDITIVE_PREENTRY_LINKS_AND_LOCALE_ADAPTER');
 assert.equal(next.path,path);
 for(const k of ['historicalFreezeRewritten','humanAcceptanceGranted','productionActivated'])assert.equal(next[k],false);
 assert.equal(sha(previous),next.previousSha256,'Pre-entry predecessor drift');
 assert.equal(sha(current),next.currentSha256,'Unregistered pre-entry source drift');
 assert.equal(next.insertions.length,6);
 const found=[];let restored=current;
 for(const token of next.insertions){
  assert.equal(restored.split(token).length,2,'Each additive insertion must occur exactly once');
  const p=token.match(/^<p class="cx-meta" data-preentry-r5-link="([a-z-]+)"><a href="([^"]+)" data-cx-en="[^"]+" data-cx-zh="[^"]+">[^<>]+<\/a><\/p>$/);
  if(p){assert(methods.includes(p[1]));assert.equal(p[2],`/perspectives/personal/${p[1]}/`);found.push(p[1]);}
  else assert.equal(token,'<script type="module" src="/assets/customer-ui/js/surfaces/preentry-hub-links-r5.js"></script>');
  restored=restored.replace(token,'');
 }
 assert.deepEqual(found.sort(),methods);
 assert.equal(restored,previous,'Existing form, scripts, wording or host changed outside the six insertions');
 return next;
}

export const PPR_R6_SUCCESSOR='content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/PPR-R6-VISUAL-SUCCESSOR.json';
export function validatePprR6Successor(record,current,{readFile=main096HistoricalReader()}={}){
 const predecessor=JSON.parse(readFile(PPR_PREENTRY_SUCCESSOR));
 assert.equal(record.predecessor,PPR_PREENTRY_SUCCESSOR);
 assert.equal(record.predecessorSha256,sha(readFile(PPR_PREENTRY_SUCCESSOR)));
 assert.equal(record.status,'ENGINEERING_SUCCESSOR_PENDING_HUMAN_REVIEW');
 assert.equal(record.humanDecision,'PENDING');
 assert.equal(record.changeType,'R6_PUBLIC_VISUAL_INCLUDES_AND_CANONICAL_OFFER_CONNECTION');
 assert.equal(record.path,path);
 assert.equal(record.ownerGitRevision,'39176d2f1a2f97e28cd17096fcc62efd5764daf2');
 for(const k of ['historicalFreezeRewritten','humanAcceptanceGranted','productionActivated','calculationOrConsentOwnerChanged','commercialAdmissionGranted'])assert.equal(record[k],false);
 assert.equal(record.previousSha256,predecessor.currentSha256);
 assert.equal(sha(current),record.currentSha256,'R6 source digest drift');
 assert.deepEqual(record.insertions,['<link rel="stylesheet" href="/assets/customer-ui/surfaces/journey-method-visual-r1.css">','<script type="module" src="/assets/customer-ui/js/surfaces/journey-method-visual-r1.js"></script>']);
 let restored=current;for(const token of record.insertions){assert.equal(restored.split(token).length,2);restored=restored.replace(token,'');}
 assert.equal(sha(restored),predecessor.currentSha256,'R6 must preserve the entire existing form and consent host');
 const changed=[...methods.map(m=>`perspectives/personal/${m}/index.html`),'assets/customer-ui/js/surfaces/preentry-five-method-r5-model.js','assets/customer-ui/js/surfaces/preentry-five-method-r5.js'];
 assert.deepEqual(record.dependencies.map(d=>d.path).sort(),changed.sort());
 for(const d of record.dependencies){assert.equal(d.previousSha256,predecessor.dependencies.find(p=>p.path===d.path)?.sha256);assert.equal(d.previousGitRevision,'9a84ceabfe05db12f639d4212db6ce10335b3c19');assert.equal(d.ownerGitRevision,record.ownerGitRevision);assert.equal(sha(readFile(d.path)),d.currentSha256);}
 assert.deepEqual(record.additionalDependencies.map(d=>d.path),['assets/customer-ui/js/surfaces/journey-method-visual-model-r1.js','assets/customer-ui/js/surfaces/journey-method-visual-r1.js','assets/customer-ui/surfaces/journey-method-visual-r1.css','content/web-production/registries/current-client-visual-registry.json','content/web-production/registries/client-visual-asset-registry-v1.9.json']);
 for(const d of record.additionalDependencies){assert.equal(d.ownerGitRevision,record.ownerGitRevision);assert.equal(sha(r6VisualOwnerBytes(d.path)),d.sha256);}
 return restored;
}
function readPprPreentryHistoricalSuccessor(owner,readFile){
 const next=JSON.parse(readFile(PPR_PREENTRY_SUCCESSOR,'utf8'));
 assert.equal(next.previousSha256,owner.currentSha256);
 const current=readFile(path,'utf8');
 const r6=JSON.parse(readFile(PPR_R6_SUCCESSOR));
 validatePprPreentryDelta(next,validatePprR6Successor(r6,current,{readFile}),readFile(next.previousPath,'utf8'));
 for(const e of [...next.dependencies,...next.sourceEvidence]){
  const replacement=r6.dependencies.find(d=>d.path===e.path);
  assert.equal(sha(readFile(e.path)),replacement?.currentSha256||e.sha256,'Pre-entry dependency/provenance drift: '+e.path);
 }
 return {...next,currentSha256:r6.currentSha256,recognizedPredecessors:[next.currentSha256],engineeringSuccessorRef:PPR_R6_SUCCESSOR};
}

// Independent receiver authority.
import {readPreConsumerSource} from './unified-country-consumer-reception-r1.mjs';
// Historical assertions below stay exact; the
// validated virtual predecessor view is never written back to product files.
export const MAIN096_RECEIVER_GOVERNANCE='content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/SIX-METHOD-MAIN096-RECEIVER-GOVERNANCE-SUCCESSOR.json';
const MAIN096_RECEIVER_GOVERNANCE_SHA='5848e10f9872a3717da5f1bef96b7d88ad1c2ec6b904f34afa7b1ae554fe0675';
const main096GitCache=new Map();
function main096Git(ref,path){const key=ref+':'+path;if(!main096GitCache.has(key)){const tree=execFileSync('git',['--literal-pathspecs','ls-tree','-z',ref,'--',path],{maxBuffer:1024*1024,stdio:['ignore','pipe','pipe']}).toString();const entries=tree.split('\0').filter(Boolean);if(entries.length===0)main096GitCache.set(key,null);else{assert.equal(entries.length,1,'Exact immutable path only');assert.equal(entries[0].slice(entries[0].indexOf('\t')+1),path,'Literal immutable path identity');const b=execFileSync('git',['cat-file','blob',key],{maxBuffer:4*1024*1024,stdio:['ignore','pipe','pipe']});main096GitCache.set(key,b);}}return main096GitCache.get(key);}
const rawFile=(p,encoding)=>fs.readFileSync(p,encoding);
function inverseReceiverReplacement(bytes,r){const s=Buffer.from(bytes).toString();assert(Buffer.from(s).equals(Buffer.from(bytes)),'Receiver UTF8 identity');assert(Number.isInteger(r.offset)&&r.offset>=0);assert.equal(s.slice(r.offset,r.offset+r.after.length),r.after,'Receiver exact hunk');return Buffer.from(s.slice(0,r.offset)+r.before+s.slice(r.offset+r.after.length));}
function inverseUnique(source,r){assert.equal(source.split(r.after).length,2,'Exact unique source hunk');return source.replace(r.after,r.before);}
export function validateMain096ReceiverGovernance({recordBytes=rawFile(MAIN096_RECEIVER_GOVERNANCE),readCurrent=readPreConsumerSource,readGit=main096Git}={}){
 const digest=b=>sha(Buffer.from(b));assert.equal(digest(recordBytes),MAIN096_RECEIVER_GOVERNANCE_SHA,'Immutable receiver governance record');const d=JSON.parse(recordBytes);
 assert.equal(d.schemaVersion,'SIX_METHOD_MAIN096_RECEIVER_GOVERNANCE_R1');assert.equal(d.status,'ENGINEERING_SUCCESSOR_PENDING_HUMAN_REVIEW');assert.equal(d.base,'096b22df9e43d2bed0a82ba5bb010b2eea337ca3');assert.equal(d.sourceBase,'a05cbb00dd240f8b304d1f52334500f77885812a');
 assert.equal(d.original31ManifestSHA256,'45558c1ec6de93e86a783c353a3cddaf56cecb7de8b455b509c845699c00ed06');assert.equal(d.original31SourceSet,'cf369d03da78f494b95c42552ed8c3a22e906c570007bc28932dc5fbef679796');assert.equal(d.productSourceSetSHA256,'19edaca3eae93a01930320631789f6afb36399876b0f086040fb08da1acb1a1c');assert.equal(digest(JSON.stringify(d.productFiles)),d.productSourceSetSHA256);assert.equal(d.productFiles.length,72);assert.equal(new Set(d.productFiles.map(f=>f.path)).size,72);
 for(const value of Object.values(d.boundaries))assert.equal(value,false,'No authority or checksum expansion');
 assert.deepEqual(d.forbiddenLocalHooks,['functions/api/customer-external-profile-intake.js','functions/external-profile/upload-document-extractor.js']);
 const correctionBytes=readCurrent('content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/MAIN096-LITERAL-BLOB-PREDECESSOR-SUCCESSOR.json');assert.equal(sha(correctionBytes),'3c48c4fb05ba1d91df661f8e9b4c1d5af283719fb54415d63a72435b3cacd4ea','Exact literal-blob correction record');const correction=JSON.parse(correctionBytes);assert.equal(correction.base,d.base);assert.equal(correction.predecessor.sha256,MAIN096_RECEIVER_GOVERNANCE_SHA);assert.equal(correction.predecessor.path,MAIN096_RECEIVER_GOVERNANCE);assert.equal(correction.path,"functions/api/method-reading/[method].js");for(const flag of Object.values(correction.boundaries))assert.equal(flag,false);const correctedRows=d.changes.filter(f=>f.path===correction.path);assert.equal(correctedRows.length,1);const corrected=correctedRows[0];assert.equal(corrected.previousSha256,correction.previousCaptureSha256);assert.equal(corrected.currentSha256,correction.currentSha256);assert.equal(corrected.addition,false);assert.equal(sha(corrected.replacement.before),correction.serializedCaptureSha256);assert.equal(readGit(d.base,correction.path),null,'Literal blob must be absent in immutable Main096');corrected.addition=true;corrected.previousSha256=null;corrected.replacement=null;
 const previous=new Map();for(const f of d.productFiles)assert.equal(digest(readCurrent(f.path)),f.sha256,'Frozen receiver product drift: '+f.path);
 for(const f of d.protectedPaths)assert.equal(digest(readCurrent(f.path)),f.sha256,'Protected production or original extractor drift');
 for(const a of d.immutableAuthorities){const b=readGit(d.base,a.path);assert(b,'Missing immutable authority object');assert.equal(digest(b),a.sha256,'Authority object identity');if(!a.gitOnlyHistoricalSnapshot)assert.equal(digest(readCurrent(a.path)),a.sha256,'Historical authority changed');previous.set(a.path,b);}
 assert.equal(d.changes.length,31);assert.equal(new Set(d.changes.map(f=>f.path)).size,31);for(const f of d.changes){assert(!d.forbiddenLocalHooks.includes(f.path));const current=Buffer.from(readCurrent(f.path));assert.equal(digest(current),f.currentSha256);const old=readGit(d.base,f.path);if(f.addition){assert.equal(old,null,'New dependency already in immutable base');assert.equal(f.previousSha256,null);assert.equal(f.replacement,null);}else{assert(old);assert.equal(digest(old),f.previousSha256,'Receiver predecessor identity');const restored=inverseReceiverReplacement(current,f.replacement);assert(restored.equals(Buffer.from(old)),'Full predecessor reconstruction');previous.set(f.path,restored);}}
 const proofs=d.sourceProofs.map(p=>{assert.equal(digest(p.sourceText),p.sha256,'Source proof bytes');const o=JSON.parse(p.sourceText);for(const k of ['historicalFreezeRewritten','checksumValidationRelaxed','humanAcceptanceGranted','productionActivated'])if(k in o)assert.equal(o[k],false);for(const v of Object.values(o.boundaries||{}))assert.equal(v,false);return o;});
 assert.equal(d.sourceProofs[0].sha256,'4a1467e9fd40a8091cd0d53a5acfb0a5516d059e69fa82034a412446e56be3f7');assert.equal(d.sourceProofs[1].sha256,'33f683a3af44d17e2bdac5620bd7520e787022b1fdbdd32775613f91c64cba83');assert.equal(d.sourceProofs[2].sha256,'9465e4c08b16cddc6ec6ff7db0957c6d011651a8b7521a7333279733201a935b');assert.equal(d.sourceProofs[3].sha256,'b5f237c9e2c2e8f60aae1bbf763355cccc8f4fc5ce0c7a07fc6d68e671a9022e');
 const overlay={};for(const f of proofs[0].changes){let current=Buffer.from(readCurrent(f.path));if(f.path.endsWith('/hd-profile-parser.js')){assert.equal(digest(current),'1d2ce7fcc9047b4f165e06d4d19eff46b7f035c6d04b4235bc9f78b21aa1aff0');const s=current.toString(),withG="['G',['g','g center'",withoutG="['G',['g center'";assert.equal(s.split(withG).length,2);current=Buffer.from(s.replace(withG,withoutG));assert.equal(digest(current),f.currentSha256,'Reverse G retains exact Source heading correction');const main=previous.get(f.path);assert.equal(digest(main),'b0da128b4f01a0a4934fab20b8bb3ade06d7a901489a97df29a2b177d03b41fd');assert.equal(digest(main.toString().replace(withG,withoutG)),f.previousSha256,'Main alias-only predecessor remains exact');}
 assert.equal(digest(current),f.currentSha256,'Exact Source HD successor');const restored=inverseReceiverReplacement(current,f.replacement),sourceParent=readGit(d.sourceBase,f.path);assert(sourceParent);assert.equal(digest(sourceParent),f.previousSha256);assert(restored.equals(Buffer.from(sourceParent)),'Exact source HD hunk reconstruction');overlay[f.path]={currentSha256:digest(readCurrent(f.path)),recognizedPredecessors:[...new Set([...f.recognizedPredecessors,f.currentSha256,digest(previous.get(f.path))])],engineeringSuccessorRef:MAIN096_RECEIVER_GOVERNANCE,engineeringOnly:true};}
 const b=proofs[1].change,bzr=Buffer.from(readCurrent(b.path)),bzrOld=inverseReceiverReplacement(bzr,b.replacement);assert.equal(digest(bzr),b.currentSha256);assert.equal(digest(bzrOld),b.previousSha256);assert(bzrOld.equals(Buffer.from(readGit(d.sourceBase,b.path))));overlay[b.path]={currentSha256:b.currentSha256,recognizedPredecessors:[b.previousSha256],engineeringSuccessorRef:MAIN096_RECEIVER_GOVERNANCE,engineeringOnly:true};
 const host=proofs[2],partial=proofs[3];let hostText=Buffer.from(readCurrent(host.path)).toString();assert.equal(digest(hostText),partial.currentSha256);hostText=inverseUnique(hostText,partial.replacement);assert.equal(digest(hostText),host.currentSha256);for(const r of [...host.replacements].reverse())hostText=inverseUnique(hostText,r);assert.equal(digest(hostText),host.previousSha256);assert.equal(hostText,previous.get(host.path).toString(),'Public host only exact source lineage');overlay[host.path]={currentSha256:partial.currentSha256,recognizedPredecessors:[host.previousSha256,host.currentSha256],engineeringSuccessorRef:MAIN096_RECEIVER_GOVERNANCE,engineeringOnly:true};
 const ask='assets/customer-ui/js/surfaces/preentry-five-method-r5.js',askSource=Buffer.from(readCurrent(ask)).toString();assert.equal(digest(askSource),'0a4f4cb6ef99e2600f3167cd7f21d902c321ba34fcbdfa82aae1117e7b2c4ef6');assert(askSource.includes('selectedMethod:method.code'),'Ask method context preserved');
 return {record:d,overlay,historicalRead:(p,encoding)=>{const b=previous.get(String(p))||Buffer.from(readCurrent(p));return encoding?b.toString(encoding):b;}};
}
function main096HistoricalReader(){return fs.existsSync(MAIN096_RECEIVER_GOVERNANCE)?validateMain096ReceiverGovernance().historicalRead:rawFile;}
export function readPprPreentrySuccessor(owner){return readPprPreentryHistoricalSuccessor(owner,main096HistoricalReader());}
