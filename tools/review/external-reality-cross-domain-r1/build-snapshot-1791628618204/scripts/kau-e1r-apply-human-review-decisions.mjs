import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const args=process.argv.slice(2);
const val=k=>{const i=args.indexOf(k); return i>=0?args[i+1]:null};
const input=val('--input');
const output=val('--output');
if(!input||!output){ console.error('Usage: node scripts/kau-e1r-apply-human-review-decisions.mjs --input <decisions.json> --output <resolution.json>'); process.exit(2); }
const root=process.cwd(); const read=async f=>JSON.parse(await fs.readFile(path.resolve(root,f),'utf8'));
const q=await read('content/knowledge/authoring/extensions/legacy-supporting-source/review/legacy-unified-language-human-review-queue-v1.json');
const c=await read('content/knowledge/authoring/extensions/legacy-supporting-source/contracts/legacy-human-review-resolution-contract-v1.json');
const inp=await read(input); const byCode=new Map(q.entries.map(e=>[e.reviewCode,e]));
const allowed=new Set(c.allowedHumanDecisions); const accepted=new Set(c.acceptedRelationshipTypes); const seen=new Set();
const resolutions=[];
for(const d of inp.decisions||[]){
 assert.ok(byCode.has(d.reviewCode),`UNKNOWN_REVIEW_CODE:${d.reviewCode}`);
 assert.ok(!seen.has(d.reviewCode),`DUPLICATE_REVIEW_CODE:${d.reviewCode}`); seen.add(d.reviewCode);
 assert.ok(allowed.has(d.humanDecision),`INVALID_HUMAN_DECISION:${d.reviewCode}`);
 assert.ok(d.humanReason&&d.reviewedBy&&d.reviewedAt,`MISSING_HUMAN_AUDIT_FIELDS:${d.reviewCode}`);
 assert.ok(!Number.isNaN(Date.parse(d.reviewedAt)),`INVALID_REVIEWED_AT:${d.reviewCode}`);
 const refs=d.acceptedCanonicalNodeReferences||[];
 if(d.humanDecision==='DEFER') assert.equal(refs.length,0,`DEFER_CANNOT_ACCEPT_NODE:${d.reviewCode}`);
 resolutions.push({reviewCode:d.reviewCode,humanDecision:d.humanDecision,acceptedRelationship:accepted.has(d.humanDecision)?d.humanDecision:null,acceptedCanonicalNodeReferences:refs,humanReason:d.humanReason,reviewedBy:d.reviewedBy,reviewedAt:d.reviewedAt,resolutionStatus:d.humanDecision==='DEFER'?'DEFERRED':(accepted.has(d.humanDecision)?'HUMAN_REVIEWED':'UNRESOLVED')});
}
const out={registryCode:'KAU-E1R-HUMAN-REVIEW-RESOLUTION',registryVersion:'1.0.0',workCode:'KAU-E1R',status:'HUMAN_DECISIONS_RECORDED_NOT_CANONICALIZED',decisionCount:resolutions.length,resolutions,invariants:{canonicalRegistryMutated:false,meaningAuthorityMutated:false,productionReadinessPromoted:false,kppHandoffCreated:false}};
await fs.mkdir(path.dirname(path.resolve(root,output)),{recursive:true}); await fs.writeFile(path.resolve(root,output),JSON.stringify(out,null,2)+'\n');
console.log(`✓ Recorded ${resolutions.length} explicit human decisions into ${output}. No Canonical/Meaning/KPP authority was mutated.`);
