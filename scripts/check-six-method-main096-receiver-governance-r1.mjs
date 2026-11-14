import {validateReportTechnical16,REPORT_TECHNICAL16_RECORD} from './lib/report-local-technical16-receiver-r1.mjs';
import {worldAskDependencyPredecessors} from './lib/unified-world-ask-dependency-r1.mjs';
import {validateSymbolicReceiver} from './lib/symbolic-frozen20-receiver-successor-r1.mjs';
import {readPreConsumerSource,validateUnifiedConsumerReception,UNIFIED_CONSUMER_RECORD} from './lib/unified-country-consumer-reception-r1.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {MAIN096_RECEIVER_GOVERNANCE,validateMain096ReceiverGovernance,validatePprR6Successor,readPprPreentrySuccessor,PPR_R6_SUCCESSOR} from './lib/ppr-five-method-preentry-successor.mjs';
import {assertPprCurrentSharedOwner,assertPprCurrentSharedOwnerRegistry} from './lib/ppr-current-shared-owner.mjs';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const rows=[];const check=(name,fn)=>{try{fn();rows.push({name,status:'PASS'});}catch(e){rows.push({name,status:'FAIL',error:String(e.stack||e)});}};
const raw=(p,e)=>fs.readFileSync(p,e),recordBytes=raw(MAIN096_RECEIVER_GOVERNANCE),doc=JSON.parse(recordBytes);
let validated;
check('Exact 72 product identities, 31 inverse deltas and approved Source chains',()=>{validated=validateMain096ReceiverGovernance();assert.equal(Object.keys(validated.overlay).length,7);});
check('Existing shared registry consumers including historical predecessors',()=>{const r=assertPprCurrentSharedOwnerRegistry();assert.equal(r.status,'ACTIVE_CURRENT_RUNTIME_AUTHORITY');});
for(const f of doc.changes.filter(f=>f.path.startsWith('functions/external-profile/')||f.path.includes('specialists/human-design/'))){check('HD current and recognized predecessor '+f.path,()=>{assert.equal(assertPprCurrentSharedOwner(f.path,{historicalDigest:f.sourcePredecessorSHA256}).currentSha256,f.currentSha256);});}
const registry=JSON.parse(raw('content/professional/personal-reality/current/ppr-current-shared-owner-registry-v1.json'));
check('Preentry historical R6 contract with exact validated dependency view',()=>{const v=readPprPreentrySuccessor(registry.files['perspectives/personal/index.html']);assert.equal(v.currentSha256,digest(raw('perspectives/personal/index.html')));});
check('Direct R6 consumer uses validated predecessor view',()=>{const r6=JSON.parse(raw(PPR_R6_SUCCESSOR));assert.equal(typeof validatePprR6Successor(r6,raw('perspectives/personal/index.html','utf8')),'string');});
check('Historical raw R6 dependency assertion still rejects new dependency bytes',()=>{const r6=JSON.parse(raw(PPR_R6_SUCCESSOR));assert.throws(()=>validatePprR6Successor(r6,raw('perspectives/personal/index.html','utf8'),{readFile:raw}));});
const memory=new Map([...doc.productFiles,...doc.protectedPaths,...doc.immutableAuthorities.filter(a=>!a.gitOnlyHistoricalSnapshot)].map(f=>[f.path,readPreConsumerSource(f.path)]));
const memoryRead=p=>memory.get(String(p))||raw(p);
const changed=(p,edit)=>f=>String(f)===p?Buffer.from(edit(memoryRead(f).toString())):memoryRead(f);
const parser='functions/external-profile/hd-profile-parser.js';
check('Reject loss of Main canonical G alias',()=>assert.throws(()=>validateMain096ReceiverGovernance({readCurrent:changed(parser,s=>s.replace("['G',['g','g center'","['G',['g center'"))})));
check('Reject loss of source heading guard',()=>assert.throws(()=>validateMain096ReceiverGovernance({readCurrent:changed(parser,s=>s.replace("!/^[\\s]*(?:&|and\\b|[\\/／])/i.test(match[1])&&",''))})));
check('Reject Ask method context regression',()=>assert.throws(()=>validateMain096ReceiverGovernance({readCurrent:changed('assets/customer-ui/js/surfaces/preentry-five-method-r5.js',s=>s.replace('selectedMethod:method.code','method:method.code'))})));
for(const f of doc.changes){check('Reject unregistered extra hunk '+f.path,()=>assert.throws(()=>validateMain096ReceiverGovernance({readCurrent:changed(f.path,s=>s+'\n// UNREGISTERED_QA_MUTATION\n')})));}
for(const f of doc.protectedPaths){check('Reject protected config/original extraction drift '+f.path,()=>assert.throws(()=>validateMain096ReceiverGovernance({readCurrent:changed(f.path,s=>s+'\n')})));}
for(const k of Object.keys(doc.boundaries)){check('Reject authority/checksum escalation '+k,()=>{const d=structuredClone(doc);d.boundaries[k]=true;assert.throws(()=>validateMain096ReceiverGovernance({recordBytes:Buffer.from(JSON.stringify(d))}));});}
check('Reject changed base, source identities or governance bytes',()=>{const d=structuredClone(doc);d.base='0000000000000000000000000000000000000000';assert.throws(()=>validateMain096ReceiverGovernance({recordBytes:Buffer.from(JSON.stringify(d))}));});
check('Reject absent or wrong immutable Git predecessor',()=>assert.throws(()=>validateMain096ReceiverGovernance({readGit:()=>Buffer.from('WRONG_IMMUTABLE_OBJECT')})));
check('Reject historical authority byte drift',()=>{const f=doc.immutableAuthorities.find(a=>!a.gitOnlyHistoricalSnapshot);assert.throws(()=>validateMain096ReceiverGovernance({readCurrent:changed(f.path,s=>s+'\n')}));});
check('Original shared helper assertions reconstruct byte-for-byte',()=>{let s=raw('scripts/lib/ppr-current-shared-owner.mjs','utf8');s=s.replace('readPprPreentrySuccessor,PPR_PREENTRY_SUCCESSOR,validateMain096ReceiverGovernance,MAIN096_RECEIVER_GOVERNANCE','readPprPreentrySuccessor,PPR_PREENTRY_SUCCESSOR');s=s.replace("  if(fs.existsSync(MAIN096_RECEIVER_GOVERNANCE)){const entry=validateMain096ReceiverGovernance().overlay[path];if(entry)record={...record,...entry,recognizedPredecessors:[...new Set([...(record?.recognizedPredecessors||[]),record?.currentSha256,...entry.recognizedPredecessors].filter(Boolean))]};}\n",'');assert.equal(digest(s),'07ade332a6a9124545c96feec45d20f4ec98bf3824c1b91630a8f9c156dbaad7');});
check('Original preentry assertions reconstruct byte-for-byte',()=>{let s=raw('scripts/lib/ppr-five-method-preentry-successor.mjs','utf8').split('\n// Independent receiver authority.')[0];s=s.replace("import {execFileSync} from 'node:child_process';\n",'').replace('export function validatePprR6Successor(record,current,{readFile=main096HistoricalReader()}={}){','export function validatePprR6Successor(record,current){').replace('function readPprPreentryHistoricalSuccessor(owner,readFile){','export function readPprPreentrySuccessor(owner){').replace('validatePprR6Successor(r6,current,{readFile}),','validatePprR6Successor(r6,current),').replaceAll('readFile(', 'fs.readFileSync(');assert.equal(digest(s),'433b1a39ee3f4cf7c669380297531ccec7839b0a8099c50f59dce357d3dc24fa');});
check('Governance paths follow existing Pages exclusion without policy changes',()=>{const s=raw('scripts/build-cloudflare-pages.mjs','utf8');assert(s.includes("'scripts',"));assert(s.includes("if(file.startsWith('content/production-closure/')) return false;"));assert(!doc.productFiles.some(f=>f.path===MAIN096_RECEIVER_GOVERNANCE));});

check('Seven exact received consumer successors retain immutable d5 predecessors',()=>assert.equal(validateUnifiedConsumerReception().current.size,7));
const consumerRecordBytes=raw(UNIFIED_CONSUMER_RECORD),consumerRecord=JSON.parse(consumerRecordBytes);
for(const f of consumerRecord.changes)check('Reject actual consumer successor drift '+f.path,()=>assert.throws(()=>validateUnifiedConsumerReception({readCurrent:p=>p===f.path?Buffer.from('UNREGISTERED_SUCCESSOR'):raw(p)})));
for(const mutate of [d=>d.changes.pop(),d=>d.changes.push(d.changes[0]),d=>d.baseline='0'.repeat(40),d=>d.boundaries.new81AskAdmissionGranted=true])check('Reject seven-consumer record escalation '+rows.length,()=>{const d=structuredClone(consumerRecord);mutate(d);assert.throws(()=>validateUnifiedConsumerReception({recordBytes:Buffer.from(JSON.stringify(d))}));});
check('Reject invalid immutable seven-consumer predecessor',()=>assert.throws(()=>validateUnifiedConsumerReception({readGit:()=>Buffer.alloc(0)})));
check('Exact three strict checker successors retain immutable predecessors',()=>assert.deepEqual([...validateUnifiedConsumerReception().governanceCurrent.keys()],['scripts/lib/main-convergence-source-successor-r1.mjs','scripts/lib/knowledge-answer-projection/kap-maintenance-successor-v1.mjs','scripts/lib/final-world-release-successor.mjs']));
check('Reject strict checker successor drift',()=>assert.throws(()=>validateUnifiedConsumerReception({readCurrent:p=>p==='scripts/lib/main-convergence-source-successor-r1.mjs'?Buffer.from('UNREGISTERED_CHECKER'):raw(p)})));
check('Reject KAP checker successor drift',()=>assert.throws(()=>validateUnifiedConsumerReception({readCurrent:p=>p==='scripts/lib/knowledge-answer-projection/kap-maintenance-successor-v1.mjs'?Buffer.from('UNREGISTERED_KAP'):raw(p)})));
check('Exact approved Report Dispatcher successor registered',()=>assert.equal(validateUnifiedConsumerReception().runtimeCurrent.get('functions/account/method-report-delivery.js'),'b1aadb3098e9fc98200af3cd4a300b317f5d4a81996c89c0477811bd0f3f1b7d'));
check('Reject Report Dispatcher successor drift',()=>assert.throws(()=>validateUnifiedConsumerReception({readCurrent:p=>p==='functions/account/method-report-delivery.js'?Buffer.from('UNREGISTERED_DISPATCHER'):raw(p)})));
const literalCorrection='content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/MAIN096-LITERAL-BLOB-PREDECESSOR-SUCCESSOR.json';
check('Reject changed bracket-path correction authority',()=>assert.throws(()=>validateMain096ReceiverGovernance({readCurrent:p=>p===literalCorrection?Buffer.from('{}'):readPreConsumerSource(p)})));

check('Reject World checker successor drift',()=>assert.throws(()=>validateUnifiedConsumerReception({readCurrent:p=>p==='scripts/lib/final-world-release-successor.mjs'?Buffer.from('UNREGISTERED_WORLD'):raw(p)})));

check('Exact frozen20 with bounded review hold and no new admission',()=>{const r=validateSymbolicReceiver().record;assert.equal(r.changes.length,20);assert.equal(r.runtimeSuccessors.length,2);assert.equal(r.validationSuccessors.length,4);});
for(const p of ['functions/api/symbolic-method-execute.js','assets/customer-ui/js/surfaces/tarot-surface-core.js'])check('Reject review-hold drift '+p,()=>assert.throws(()=>validateSymbolicReceiver({readCurrent:x=>x===p?Buffer.from('UNREGISTERED_HOLD'):raw(x)})));
check('Exact World Ask dependency retains frozen80 and Main096',()=>assert.equal(worldAskDependencyPredecessors().size,1));
check('Reject World Ask dependency current drift',()=>assert.throws(()=>worldAskDependencyPredecessors({readCurrent:()=>Buffer.from('UNREGISTERED_ASK')})));
for(const [label,recordPath,validate]of [['World','content/civilization-atlas/maintenance/unified-world-ask-dependency-r1-successor.json',worldAskDependencyPredecessors],['Symbolic','content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/SYMBOLIC-FROZEN20-RECEIVER-SUCCESSOR-R1.json',validateSymbolicReceiver]]){
 const original=JSON.parse(raw(recordPath));for(const [name,mutate]of [['extra path',r=>r.changes.push(r.changes[0])],['false predecessor',r=>{if(r.changes[0].previousSha256)r.changes[0].previousSha256='0'.repeat(64);else r.changes[0].sha256='0'.repeat(64);}],['permission escalation',r=>r.boundaries.providerLiveEnabled=true]])check('Reject '+label+' '+name,()=>{const r=structuredClone(original);mutate(r);assert.throws(()=>validate({recordBytes:Buffer.from(JSON.stringify(r))}));});
}


check('Exact Report16 receiver retains eight Git predecessors and eight additions',()=>{const r=validateReportTechnical16();assert.equal(r.current.size,16);assert.equal(r.previous.size,8);});
for(const p of JSON.parse(raw(REPORT_TECHNICAL16_RECORD)).changes.map(r=>r.path))check('Reject Report16 current drift '+p,()=>assert.throws(()=>validateReportTechnical16({readCurrent:x=>x===p?Buffer.from('UNREGISTERED_REPORT16'):raw(x)})));
for(const [name,mutate]of [['extra path',r=>r.changes.push(r.changes[0])],['false predecessor',r=>r.changes[0].previousSha256='0'.repeat(64)],['commercial escalation',r=>r.boundaries.commercialUnlocked=true]])check('Reject Report16 '+name,()=>{const r=JSON.parse(raw(REPORT_TECHNICAL16_RECORD));mutate(r);assert.throws(()=>validateReportTechnical16({recordBytes:Buffer.from(JSON.stringify(r))}));});

const result={version:'SIX_METHOD_MAIN096_RECEIVER_GOVERNANCE_R1',base:doc.base,productSourceSetSHA256:doc.productSourceSetSHA256,recordSHA256:digest(recordBytes),passed:rows.filter(r=>r.status==='PASS').length,failed:rows.filter(r=>r.status==='FAIL').length,rows,scope:'Exact engineering authority only; no Human/Public/Commercial/Production admission',providerCalls:0,productionWrites:0,fullCheck:'NOT_RUN',requiredCI:'NOT_RUN_NO_COMMIT',privateSourcesUsed:false};
if(process.env.PHIOS_GOVERNANCE_QA_OUTPUT_DIR){const dir=path.resolve(process.env.PHIOS_GOVERNANCE_QA_OUTPUT_DIR);assert(/^E:\\PHIOS\\QA-TEMP\\/i.test(dir),'Use existing E QA output root');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'GOVERNANCE-TARGETED-RESULT.json'),JSON.stringify(result,null,2));}
console.log(JSON.stringify(result));if(result.failed)process.exitCode=1;


