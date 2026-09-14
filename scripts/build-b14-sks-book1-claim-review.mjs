import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='docs/knowledge/structured-successor/';
const audit=JSON.parse(fs.readFileSync(root+'book-1-revision-reconciliation-v1.json','utf8'));
assert.equal(audit.sourceSha256,'e36929bf896148b37c6719e6c8542ceeebb02dc35416fbb25a417ba3ec59eb53','Claims require review when the manuscript changes.');
const claims=[
 {claimId:'B1-REV-CONSTRAINT-STRUCTURE',stage:'W8',claim:'约束筛选能够持续的变化，使差异形成可重复的路径与结构。',pages:[48],candidateNodeCodes:['KN-B1-P1-002','KN-B1-P1-003'],historicalSectionCodes:['CM-B1V2-P1-S002','CM-B1V2-P1-S003'],boundary:'这是书中概念机制的投影，不证明所有现实都按单一线性链形成。',proposedSequence:['DIFFERENCE','CONSTRAINT','STRUCTURE']},
 {claimId:'B1-REV-CAPACITY-LOAD',stage:'W9',claim:'容量描述载体能够持续处理的规模、强度、复杂度与时间；负荷描述进入系统并需要被处理的要求。超过容量可能导致累积、延迟或失真。',pages:[306],candidateNodeCodes:['KN-B1-P4-005'],historicalSectionCodes:['CM-B1V2-P4-S032'],boundary:'不提供可测量的个人阈值；负荷与负载是否作为同一术语须明确审定。',proposedMembers:['CAPACITY','LOAD']},
 {claimId:'B1-REV-CAPABILITY-CAPACITY',stage:'W9',claim:'载体能力说明能进行什么类型的运行，承载容量说明这些运行能在多大规模、多高强度和多长时间内持续。',pages:[307],candidateNodeCodes:[],historicalSectionCodes:['CM-B1V2-P4-S033'],boundary:'此章节没有现成批准 node binding，不得借用相邻节点自动接纳。',proposedMembers:['CARRIER_CAPABILITY','CARRIER_CAPACITY']}
].map(c=>({...c,sourceSha256:audit.sourceSha256,pageEvidence:c.pages.map(page=>({page,textSha256:audit.pageDigests.find(p=>p.page===page).textSha256})),status:'READY_FOR_SOURCE_BINDING_REVIEW',humanAccepted:false,mayEnterGovernedRetrieval:false}));
fs.writeFileSync(root+'book-1-w8-w9-claim-review-v1.json',JSON.stringify({version:'1.0.0',sourceSha256:audit.sourceSha256,pageCount:406,claims,requestedSevenStepChainStatus:'WITHHELD_NO_DIRECT_SEQUENCE_EVIDENCE',nextAction:'Review versioned section bindings and claim boundaries before projection admission.'},null,2)+'\n');
console.log('✓ Three paragraph-backed Book I claim candidates tied to current PDF and page digests. No authority promotion.');
