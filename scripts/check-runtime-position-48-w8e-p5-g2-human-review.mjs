import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const read=rel=>JSON.parse(
  fs.readFileSync(path.join(root,rel),'utf8').replace(/^\uFEFF/,'')
);

const ok=(v,c)=>{
  if(!v) throw new Error('RUNTIME_POSITION_48_W8E_P5_G2_HUMAN:'+c);
};

const candidate=read(
  'content/civilization-atlas/reconfiguration/runtime-position-w8e-p5-candidates-v1.json'
);

const contract=read(
  'content/civilization-atlas/reconfiguration/runtime-position-w8e-p5-g2-human-review-contract-v1.json'
);

const decision=read(
  'content/civilization-atlas/reconfiguration/runtime-position-w8e-p5-g2-human-decision-v1.json'
);

const status=read(
  'content/civilization-atlas/reconfiguration/runtime-position-w8e-p5-g2-status-v1.json'
);

const c=(candidate.records||[]).find(
  x=>x.candidateId==='US-W8E-P5-FINANCIAL-CREDIT-CONSTRAINT'
);

ok(Boolean(c),'CANDIDATE_MISSING');
ok(c.state==='GRAMMAR_DOMAIN_HUMAN_REVIEW_READY','CANDIDATE_NOT_REVIEW_READY');
ok(c.scope==='SUBSYSTEM','CANDIDATE_SCOPE');
ok(c.subsystem==='FINANCIAL_CREDIT_CONSTRAINT','CANDIDATE_SUBSYSTEM');
ok(c.grammarId==='G2','GRAMMAR');
ok(c.realityDomainId==='P3','DOMAIN');

ok(contract.status==='ACTIVE_SUBSYSTEM_HUMAN_REVIEW','CONTRACT');
ok(contract.boundaries?.dossierGlobalPromotionAllowed===false,'GLOBAL_PROMOTION_BOUNDARY');
ok(contract.boundaries?.nationalSystemConclusionAllowed===false,'NATIONAL_CONCLUSION_BOUNDARY');
ok(contract.boundaries?.runtimePositionCandidateAllowed===false,'RP_BOUNDARY');

const d=(decision.decisions||[]).find(
  x=>x.candidateId===c.candidateId
);

ok(Boolean(d),'DECISION_MISSING');
ok(d.decision==='ACCEPT','DECISION_NOT_ACCEPT');
ok(d.reviewerRole==='OWNER_HUMAN_REVIEW','REVIEWER_ROLE');
ok(d.acceptedScope==='SUBSYSTEM','DECISION_SCOPE');
ok(d.acceptedSubsystem==='FINANCIAL_CREDIT_CONSTRAINT','DECISION_SUBSYSTEM');
ok(d.grammarId==='G2'&&d.realityDomainId==='P3','DECISION_PAIR');

ok(status.status==='HUMAN_ACCEPTED_SUBSYSTEM_CONSTRAINT','STATUS');
ok(status.completed?.accepted===1,'ACCEPT_COUNT');
ok(status.completed?.dossierGlobalPromotions===0,'GLOBAL_AUTHORITY_LEAK');
ok(status.completed?.nationalSystemConclusions===0,'NATIONAL_AUTHORITY_LEAK');
ok(status.completed?.runtimePositionCandidates===0,'RP_AUTHORITY_LEAK');

console.log(
  'PASS W8E-P5-G2 HUMAN: bounded FINANCIAL_CREDIT_CONSTRAINT subsystem G2+P3 ACCEPTED; global promotions=0, national conclusions=0, RP candidates=0.'
);

