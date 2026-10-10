import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createFinalApproval, buildAuthorityBridge, approvalIsCurrent, sha256 } from './bfa-runtime-v1.mjs';
import { bindFinalPackageDigest } from './bfa-package-v1.mjs';
const stable=v=>JSON.stringify(v,null,2)+'\n';
const exists=p=>fs.existsSync(p);
export const bfaBatchRoot=(batchCode)=>`content/production/bilingual-final-approval/${batchCode}`;
export const packagePath=(batchCode,nodeCode)=>`${bfaBatchRoot(batchCode)}/packages/${nodeCode}.v1.json`;
export const approvalPath=(batchCode,nodeCode)=>`${bfaBatchRoot(batchCode)}/approvals/BFA-APPROVAL-${nodeCode}-v1.json`;
export const bridgePath=(batchCode,nodeCode)=>`${bfaBatchRoot(batchCode)}/authority-bridges/${nodeCode}.v1.json`;
export const auditPath=(batchCode)=>`${bfaBatchRoot(batchCode)}/human-review-audit-log.v1.json`;
async function atomicWrite(file,text,{replace=true}={}){await fsp.mkdir(path.dirname(file),{recursive:true});const tmp=`${file}.tmp-${process.pid}-${crypto.randomUUID()}`;await fsp.writeFile(tmp,text,{flag:'wx'});if(replace)await fsp.rename(tmp,file);else{if(exists(file)){await fsp.rm(tmp,{force:true});throw new Error(`BFA_TARGET_EXISTS:${file}`);}await fsp.rename(tmp,file);}}
export function readJson(root,rel,fallback=null){const abs=path.join(root,rel);return exists(abs)?JSON.parse(fs.readFileSync(abs,'utf8')):fallback;}
export async function persistPackage(root,record){const bound=bindFinalPackageDigest(record);await atomicWrite(path.join(root,packagePath(bound.batchCode,bound.nodeCode)),stable(bound));return bound;}
export async function persistDecision(root,packageRecord,decision,options={}){
 const approval=createFinalApproval(packageRecord,decision,options); const ap=approvalPath(packageRecord.batchCode,packageRecord.nodeCode); await atomicWrite(path.join(root,ap),stable(approval));
 const bridge=buildAuthorityBridge(approval); await atomicWrite(path.join(root,bridgePath(packageRecord.batchCode,packageRecord.nodeCode)),stable(bridge));
 await appendAudit(root,packageRecord.batchCode,{eventType:'FINAL_DECISION',nodeCode:packageRecord.nodeCode,packageDigest:packageRecord.finalPackageDigest,decision,reviewer:'TL',warningAcknowledgement:approval.warningAcknowledgements??[],occurredAt:approval.decidedAt});
 return {approval,bridge,approvalPath:ap};
}
export function loadCurrentApproval(root,packageRecord){const a=readJson(root,approvalPath(packageRecord.batchCode,packageRecord.nodeCode));return a&&approvalIsCurrent(a,packageRecord)?a:null;}
export async function appendAudit(root,batchCode,event){const rel=auditPath(batchCode);const current=readJson(root,rel,{schemaVersion:'PHI-OS-BFA-HUMAN-REVIEW-AUDIT-v1.0.0',batchCode,events:[]});const fingerprint=sha256(event);if(!current.events.some(x=>x.eventDigest===fingerprint))current.events.push({...event,eventDigest:fingerprint});await atomicWrite(path.join(root,rel),stable(current));return current;}
export async function recordRevision(root,packageRecord,{kind='CANDIDATE',reason='TL requested revision',at=new Date().toISOString()}={}){const rel=`${bfaBatchRoot(packageRecord.batchCode)}/revisions/${packageRecord.nodeCode}-${at.replace(/[:.]/g,'-')}.json`;const rec={schemaVersion:'PHI-OS-BFA-REVISION-REQUEST-v1.0.0',batchCode:packageRecord.batchCode,nodeCode:packageRecord.nodeCode,priorFinalPackageDigest:packageRecord.finalPackageDigest,kind,reason,requestedBy:'TL',requestedAt:at,requiresNewCandidateOrFigureDigest:true,requiresNewFinalPackageDigest:true,priorApprovalReusable:false};await atomicWrite(path.join(root,rel),stable(rec),{replace:false});return {rel,rec};}
