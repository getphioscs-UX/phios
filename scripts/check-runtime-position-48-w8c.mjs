import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildW8cAdmissionWorkOrders,validateW8cAuthorityDecisions,runW8cAdmission} from './lib/civilization-atlas/runtime-position-w8c-cwa-admission-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const text=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const ok=(v,c)=>{if(!v)throw new Error('RUNTIME_POSITION_48_W8C:'+c);};

const contract=read('content/civilization-atlas/reconfiguration/runtime-position-w8c-cwa-admission-contract-v1.json');
const claims=read('content/civilization-atlas/reconfiguration/runtime-position-w8b-cwa-ready-claims-v1.json');
const work=read('content/civilization-atlas/reconfiguration/runtime-position-w8c-admission-work-orders-v1.json');
const decisions=read('content/civilization-atlas/reconfiguration/runtime-position-w8c-authority-decisions-v1.json');
const results=read('content/civilization-atlas/reconfiguration/runtime-position-w8c-admission-results-v1.json');
const evidence=read('content/civilization-atlas/reconfiguration/runtime-position-w8c-current-evidence-ir-v1.json');
const conflicts=read('content/civilization-atlas/reconfiguration/runtime-position-w8c-conflict-resolution-v1.json');
const handoff=read('content/civilization-atlas/reconfiguration/runtime-position-w8c-rre-eligible-handoff-v1.json');
const status=read('content/civilization-atlas/reconfiguration/runtime-position-w8c-status-v1.json');
const crosswalk=read('content/registry/runtime-position-48-crosswalk-v1.json');
const manifest=read('content/civilization-atlas/reconfiguration/atlas-manifest-v2.json');
const w8Before=read('content/civilization-atlas/reconfiguration/runtime-position-w8-evidence-batches-v1.json');
const conflictMarker=/<<<<<<<|=======|>>>>>>>/;
for(const rel of [
  'content/civilization-atlas/reconfiguration/runtime-position-w8c-admission-results-v1.json',
  'content/civilization-atlas/reconfiguration/runtime-position-w8c-status-v1.json',
  'tools/review/PHI-OS-48-RUNTIME-POSITION-W8C-CWA-ADMISSION.html'
]) ok(!conflictMarker.test(text(rel)),'MERGE_CONFLICT_MARKER_'+rel);

ok(contract.status==='ACTIVE_CURRENT_WEB_AUTHORITY_ADMISSION','CONTRACT');
ok(contract.boundaries?.authorityHintIsDecision===false,'HINT_BOUNDARY');
ok(contract.boundaries?.rreExecuted===false,'RRE_BOUNDARY');
ok(contract.boundaries?.mutatesW8EvidenceBatches===false,'W8_MUTATION_BOUNDARY');
const rebuilt=buildW8cAdmissionWorkOrders({cwaReadyClaims:claims});
ok((work.workOrders||[]).length===rebuilt.length,'WORK_ORDER_COUNT');
ok((results.records||[]).length===(claims.records||[]).length,'RESULT_COUNT');
ok((evidence.records||[]).every(x=>x.evidenceState==='CWA_ADMITTED'||x.evidenceState==='CWA_ADMITTED_CONFLICTED'),'EVIDENCE_STATE');
ok((evidence.records||[]).every(x=>x.boundaries?.sourceVotingUsed===false),'SOURCE_VOTING');
ok((handoff.records||[]).every(x=>x.supportLevel==='DIRECT'&&x.rreEligibility==='RRE_ELIGIBLE'),'RRE_HANDOFF_GATE');
const unresolved=new Set((conflicts.records||[]).filter(x=>x.state==='UNKNOWN_CONFLICTED').map(x=>x.conflictGroup));
ok((handoff.records||[]).every(x=>!x.conflictGroup||!unresolved.has(x.conflictGroup)),'UNRESOLVED_CONFLICT_HANDOFF');
ok(status.completed?.rreExecuted===0,'RRE_EXECUTED');
ok(status.completed?.runtimePositionCandidates===0,'POSITION_CANDIDATES');
ok(status.completed?.w8EvidenceBatchesMutated===0,'W8_BATCH_MUTATED_STATUS');
ok(status.completed?.dossiersAutoPopulated===0,'DOSSIER_AUTO_POPULATED');
ok(crosswalk.w8c?.authorityOwner==='CURRENT_WEB_AUTHORITY','CROSSWALK_OWNER');
ok(crosswalk.w8c?.mutatesW8EvidenceBatches===false,'CROSSWALK_MUTATION');
ok(manifest.registryRefs?.runtimePositionW8cEvidenceIr==='content/civilization-atlas/reconfiguration/runtime-position-w8c-current-evidence-ir-v1.json','MANIFEST_EVIDENCE');
const runner=text('scripts/run-runtime-position-48-w8c-cwa-admission.mjs');
ok(!runner.includes('buildBook6DossierRreProjection'),'RUNNER_RRE');
ok(!runner.includes("write('content/civilization-atlas/reconfiguration/runtime-position-w8-evidence-batches-v1.json'"),'RUNNER_WRITES_W8_BATCH');
const pkg=text('package.json');
ok(pkg.includes('"build:runtime-position-48:w8c"')&&pkg.includes('"check:runtime-position-48:w8c"'),'PACKAGE');

const baseClaim=(id,text,conflictGroup=null)=>({claimCandidateId:id,sourceId:'SRC-'+id,dossierId:'DOSSIER-US',laneId:'DEMOGRAPHY',claimType:'GENERAL_CURRENT_FACT',claimText:text,supportLevel:'DIRECT',jurisdiction:'US',conflictGroup,sourceLocator:{type:'TABLE',value:'Table 1'},candidate:{url:'https://example.com/'+id,publisher:'Fixture Publisher',title:'Fixture '+id,publishedAt:'2026-10-01T00:00:00.000Z',retrievedAt:'2026-10-02T01:00:00.000Z'},authorityClassHint:'OFFICIAL_PRIMARY',sourceVersionOrDigest:'v1'});
const fixtureClaims={records:[baseClaim('C1','Fixture fact one.'),baseClaim('C2','Fixture conflict A.','CG1'),baseClaim('C3','Fixture conflict B.','CG1'),{...baseClaim('C4','Fixture partial.'),supportLevel:'PARTIAL'}, {...baseClaim('C5','Fixture stale.'),candidate:{...baseClaim('C5','x').candidate,retrievedAt:'2026-09-20T01:00:00.000Z'}}, {...baseClaim('C6','Fixture community.'),authorityClassHint:'COMMUNITY'}]};
const fixtureDecisions={producedAt:'2026-10-02T12:00:00.000Z',decisions:[
  {claimCandidateId:'C1',authorityClass:'OFFICIAL_PRIMARY',domain:'GENERAL_CURRENT',reviewedAt:'2026-10-02T02:00:00.000Z',reviewerRole:'FIXTURE',decisionBasis:'fixture'},
  {claimCandidateId:'C2',authorityClass:'OFFICIAL_PRIMARY',domain:'GENERAL_CURRENT',reviewedAt:'2026-10-02T02:00:00.000Z',reviewerRole:'FIXTURE',decisionBasis:'fixture'},
  {claimCandidateId:'C3',authorityClass:'OFFICIAL_PRIMARY',domain:'GENERAL_CURRENT',reviewedAt:'2026-10-02T02:00:00.000Z',reviewerRole:'FIXTURE',decisionBasis:'fixture'},
  {claimCandidateId:'C4',authorityClass:'OFFICIAL_PRIMARY',domain:'GENERAL_CURRENT',reviewedAt:'2026-10-02T02:00:00.000Z',reviewerRole:'FIXTURE',decisionBasis:'fixture'},
  {claimCandidateId:'C5',authorityClass:'OFFICIAL_PRIMARY',domain:'GENERAL_CURRENT',reviewedAt:'2026-10-02T02:00:00.000Z',reviewerRole:'FIXTURE',decisionBasis:'fixture'},
  {claimCandidateId:'C6',authorityClass:'COMMUNITY',domain:'GENERAL_CURRENT',reviewedAt:'2026-10-02T02:00:00.000Z',reviewerRole:'FIXTURE',decisionBasis:'fixture'}
]};
const dv=validateW8cAuthorityDecisions({decisionIntake:fixtureDecisions,cwaReadyClaims:fixtureClaims});
ok(dv.records.length===6&&dv.rejected.length===0,'FIXTURE_DECISIONS');
const fx=runW8cAdmission({cwaReadyClaims:fixtureClaims,decisionIntake:fixtureDecisions});
ok(fx.admissionResults.find(x=>x.claimCandidateId==='C1')?.admissionState==='ADMITTED','FIXTURE_ADMITTED');
ok(fx.admissionResults.find(x=>x.claimCandidateId==='C5')?.admissionState==='STALE','FIXTURE_STALE');
ok(fx.admissionResults.find(x=>x.claimCandidateId==='C6')?.admissionState==='REJECTED','FIXTURE_AUTHORITY_REJECT');
ok(fx.conflictRecords.find(x=>x.conflictGroup==='CG1')?.state==='UNKNOWN_CONFLICTED','FIXTURE_CONFLICT');
ok(!fx.rreEligible.some(x=>x.claimCandidateId==='C2'||x.claimCandidateId==='C3'),'FIXTURE_CONFLICT_BLOCK');
ok(!fx.rreEligible.some(x=>x.claimCandidateId==='C4'),'FIXTURE_PARTIAL_BLOCK');
ok(fx.rreEligible.some(x=>x.claimCandidateId==='C1'),'FIXTURE_DIRECT_ELIGIBLE');

const w8After=read('content/civilization-atlas/reconfiguration/runtime-position-w8-evidence-batches-v1.json');
ok(JSON.stringify(w8Before)===JSON.stringify(w8After),'W8_BATCH_CHANGED_DURING_CHECK');
console.log('PASS runtime-position-48 W8C: canonical CWA admission executes with explicit authority decisions, freshness and conflicts; only DIRECT non-conflicted evidence reaches RRE handoff; RRE/position authority remains closed.');
