import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

// No installation, provider, commit, push or deployment commands.
// --global-check explicitly runs existing protected npm precheck/check/postcheck.
const acceptance={
  "schemaVersion": "PHIOS_HUMAN_VISUAL_ACCEPTANCE_R3_4_V1",
  "recordedAt": "2026-10-07",
  "decision": "ACCEPT",
  "methodId": "BZR",
  "reportVersion": "DEEP_MANUSCRIPT_R2_READABILITY_R4",
  "decisionAuthority": "EXPLICIT_USER_IN_THIS_CONVERSATION",
  "reviewer": null,
  "statement": "Human ACCEPT BaZi R2 BILINGUAL / EN / ZH_HANS visual publication",
  "scope": "VISUAL_PUBLICATION_ONLY",
  "manuscriptDigest": "2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9",
  "modes": [
    {
      "mode": "BILINGUAL",
      "reviewedFilename": "BAZI-DEEP-MANUSCRIPT-R2-PUBLICATION-REVIEW-R2-BILINGUAL(2).html",
      "repositoryPath": "tools/review/BAZI-DEEP-MANUSCRIPT-R2-PUBLICATION-REVIEW-R2-BILINGUAL.html",
      "sha256": "1868882781cc9ca8c164dfbbb32834fb269ed2117f65f820cf0d3dca64b3967d",
      "bytes": 218598,
      "manuscriptDigest": "2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9",
      "publicationDigest": "b5c09e6e3f612f4261f21b2507bfa5ff88d23937740ddb1e69bf73b390c4574d",
      "decision": "ACCEPT",
      "scope": "VISUAL_PUBLICATION",
      "pageCount": 48,
      "diagramCount": 15,
      "repositoryBytesMatchReviewedBytes": true
    },
    {
      "mode": "EN",
      "reviewedFilename": "BAZI-DEEP-MANUSCRIPT-R2-PUBLICATION-REVIEW-R2-EN(2).html",
      "repositoryPath": "tools/review/BAZI-DEEP-MANUSCRIPT-R2-PUBLICATION-REVIEW-R2-EN.html",
      "sha256": "e877e9f7907c628efd9d65359f7ebcf366ad8a64a21502503bb911f37e69c108",
      "bytes": 191768,
      "manuscriptDigest": "2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9",
      "publicationDigest": "f203479fd5ace16af8b9a15b89bd1c7ff9f87dd211068360019664a47dc1a1f2",
      "decision": "ACCEPT",
      "scope": "VISUAL_PUBLICATION",
      "pageCount": 48,
      "diagramCount": 15,
      "repositoryBytesMatchReviewedBytes": true
    },
    {
      "mode": "ZH_HANS",
      "reviewedFilename": "BAZI-DEEP-MANUSCRIPT-R2-PUBLICATION-REVIEW-R2-ZH-HANS(2).html",
      "repositoryPath": "tools/review/BAZI-DEEP-MANUSCRIPT-R2-PUBLICATION-REVIEW-R2-ZH-HANS.html",
      "sha256": "e19665feaf6f8c58e242f4953217ec60b6439ca53ae08c1a569c542f601b7484",
      "bytes": 184814,
      "manuscriptDigest": "2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9",
      "publicationDigest": "cbc8053d8a857e6b8a7788134364549d2e6867de08afb1b99f9d66c3633bf043",
      "decision": "ACCEPT",
      "scope": "VISUAL_PUBLICATION",
      "pageCount": 48,
      "diagramCount": 15,
      "repositoryBytesMatchReviewedBytes": true
    }
  ],
  "preservation": {
    "manuscript": true,
    "diagrams": true,
    "paragraphGrouping": true,
    "visuals": true
  },
  "auditAnchor": {
    "repository": "getphioscs-UX/phios",
    "commit": "f8b974bb064d22c03cf9a5a8c003c6065bf920e2"
  },
  "evidence": [
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BROWSER-FIT-BILINGUAL.json",
      "sha256": "5eda804ec8cdf5ca05754f5121f2ec6cbc576936d50541d65ec3118c5eab140a",
      "mode": "BILINGUAL",
      "manuscriptDigest": "2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9",
      "publicationDigest": "b5c09e6e3f612f4261f21b2507bfa5ff88d23937740ddb1e69bf73b390c4574d",
      "status": "PASS",
      "kind": "BROWSER-FIT"
    },
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/PRINT-FIT-BILINGUAL.json",
      "sha256": "fea9bc157261c4f079d92b7fc5075ba3dd21dc25ebfca6e65df2fc0a831e1fb0",
      "mode": "BILINGUAL",
      "manuscriptDigest": "2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9",
      "publicationDigest": "b5c09e6e3f612f4261f21b2507bfa5ff88d23937740ddb1e69bf73b390c4574d",
      "status": "PASS",
      "kind": "PRINT-FIT"
    },
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/PDF-FIT-BILINGUAL.json",
      "sha256": "e6beebbdc4ae49f0b7eccdcc57c47e96234256c3ffa574ffd4aa4fac0ccf9b96",
      "mode": "BILINGUAL",
      "manuscriptDigest": "2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9",
      "publicationDigest": "b5c09e6e3f612f4261f21b2507bfa5ff88d23937740ddb1e69bf73b390c4574d",
      "status": "PASS",
      "kind": "PDF-FIT"
    },
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BROWSER-FIT-EN.json",
      "sha256": "7d67bdcc43883010012b86f93fca8a4914ab7f1a5e9f644c9fad792350f1dd76",
      "mode": "EN",
      "manuscriptDigest": "2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9",
      "publicationDigest": "f203479fd5ace16af8b9a15b89bd1c7ff9f87dd211068360019664a47dc1a1f2",
      "status": "PASS",
      "kind": "BROWSER-FIT"
    },
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/PRINT-FIT-EN.json",
      "sha256": "a8f1ba6923a1a853f87e7db60c4f647a602ae7fe07bb4488d772ecb77a40b2f9",
      "mode": "EN",
      "manuscriptDigest": "2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9",
      "publicationDigest": "f203479fd5ace16af8b9a15b89bd1c7ff9f87dd211068360019664a47dc1a1f2",
      "status": "PASS",
      "kind": "PRINT-FIT"
    },
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/PDF-FIT-EN.json",
      "sha256": "dc7c32d6e0d2c54992574790dd4dcfdbef037a032c66cc89efdb5374376188b2",
      "mode": "EN",
      "manuscriptDigest": "2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9",
      "publicationDigest": "f203479fd5ace16af8b9a15b89bd1c7ff9f87dd211068360019664a47dc1a1f2",
      "status": "PASS",
      "kind": "PDF-FIT"
    },
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BROWSER-FIT-ZH_HANS.json",
      "sha256": "fcb0bf159b65b596005910c85298e50253ccb90bf7114aaa8f29342a60d5f1dc",
      "mode": "ZH_HANS",
      "manuscriptDigest": "2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9",
      "publicationDigest": "cbc8053d8a857e6b8a7788134364549d2e6867de08afb1b99f9d66c3633bf043",
      "status": "PASS",
      "kind": "BROWSER-FIT"
    },
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/PRINT-FIT-ZH_HANS.json",
      "sha256": "6984821d908219d2948d0e349ced627bcf1967f8e04287473a63d9acba6576e2",
      "mode": "ZH_HANS",
      "manuscriptDigest": "2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9",
      "publicationDigest": "cbc8053d8a857e6b8a7788134364549d2e6867de08afb1b99f9d66c3633bf043",
      "status": "PASS",
      "kind": "PRINT-FIT"
    },
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/PDF-FIT-ZH_HANS.json",
      "sha256": "bc566d6091768bbf68d95d117a89ae3bd7578b865d8bcd7a2685d1d127f788f9",
      "mode": "ZH_HANS",
      "manuscriptDigest": "2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9",
      "publicationDigest": "cbc8053d8a857e6b8a7788134364549d2e6867de08afb1b99f9d66c3633bf043",
      "status": "PASS",
      "kind": "PDF-FIT"
    },
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/READABILITY-R4-RECEIPT.json",
      "sha256": "dee94365abc7938bc98f34bffb3bdfb98aeceacfeff37e323b6998cedb5f396f",
      "status": "PASS",
      "kind": "READABILITY"
    },
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-CHECK-zero-provider.json",
      "sha256": "a9bb94f6465aa3443efbb037d8384d14e436ca5570ccbcfc111dcda0c31d5392",
      "status": "PASS",
      "kind": "ZERO_PROVIDER"
    }
  ],
  "originalExperimentUsage": {
    "status": "REPOSITORY_TELEMETRY_AND_ARCHIVED_RATE_ARITHMETIC_MATCH",
    "experimentId": "BDM-R2-REFERENCE-20261006-01",
    "records": [
      {
        "batchId": "B01",
        "model": "gpt-5.6-sol",
        "requestId": "resp_0336b76c9b9b5701016ac48a54f2b887d0a71c9b1e2be22fb6",
        "inputTokens": 2229,
        "cachedInputTokens": 0,
        "outputTokens": 8271,
        "reasoningTokens": 550,
        "cost": 0.174336,
        "completionStatus": "completed",
        "truncated": false,
        "technicalDefects": []
      },
      {
        "batchId": "B02",
        "model": "gpt-5.6-sol",
        "requestId": "resp_0ccec0231aaf2cfd016ac48ae5af4c87d0abf36936f86389cc",
        "inputTokens": 2314,
        "cachedInputTokens": 0,
        "outputTokens": 6990,
        "reasoningTokens": 941,
        "cost": 0.149056,
        "completionStatus": "completed",
        "truncated": false,
        "technicalDefects": []
      },
      {
        "batchId": "B03",
        "model": "gpt-5.6-sol",
        "requestId": "resp_0e3dd7d2ab7fdef9016ac48b5bf9bc87d095da60bb4d2f95d9",
        "inputTokens": 2610,
        "cachedInputTokens": 0,
        "outputTokens": 5662,
        "reasoningTokens": 442,
        "cost": 0.12368,
        "completionStatus": "completed",
        "truncated": false,
        "technicalDefects": []
      }
    ],
    "totals": {
      "inputTokens": 7153,
      "cachedInputTokens": 0,
      "outputTokens": 20923,
      "reasoningTokens": 1933,
      "currency": "USD",
      "cost": 0.447072,
      "normalCalls": 3,
      "recoveryCalls": 0,
      "failedRequestsRecorded": 0
    },
    "reasoningIncludedInOutput": true,
    "providerAccountBillingIndependentlyVerified": false,
    "accountWideFailedRequestsAudited": false,
    "rateManifestRef": "content/reports/bazi/deep-manuscript/gpt-5.6-sol-capacity-admission-v1.json"
  },
  "globalCheck": {
    "status": "NOT_RUN_FOR_READABILITY_REPAIR",
    "overallPass": false,
    "currentCommitActionsRuns": 0,
    "cloudflareCheckSuccessIsNotGlobalNpmCheck": true
  },
  "independentPdfReader": {
    "status": "UNBOUND_HISTORICAL_RECEIPT",
    "reason": "PyMuPDF receipt lacks manuscript/publication/PDF digest and has earlier tested-span counts"
  },
  "protectedFiles": [
    {
      "path": "config/reports/bazi-deep-manuscript-r2/policy.json",
      "sha256": "54dcec66bd64172ffe36dd489710879f773bec31e0813d9b6f1efe590226c8c3",
      "unchanged": true
    },
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/CONTROLLED-EXPERIMENT-APPROVAL.json",
      "sha256": "3fb4fab1f0530f5cd7a685b98920de89b6e499635d818966d9d36c21fa8c6d8c",
      "unchanged": true
    },
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/EXPERIMENT-MACHINE-REPORT.json",
      "sha256": "49ddd95d640252f34a8e9e265ba97589cd2e42c9aa470bb43526cbe5da944d5b",
      "unchanged": true
    },
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/LIVE-MANUSCRIPT-SNAPSHOT.json",
      "sha256": "bb61af1abddba00bba7c5ea74440e95fb02c8c832e7002008ba2db7e042e6558",
      "unchanged": true
    },
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/POST-3-CALL-SOURCE-SNAPSHOT.json",
      "sha256": "bb61af1abddba00bba7c5ea74440e95fb02c8c832e7002008ba2db7e042e6558",
      "unchanged": true
    },
    {
      "path": "docs/acceptance/bazi-paid-report/deep-manuscript-r2/USAGE-RECONCILIATION.json",
      "sha256": "85a57632700076ab0d70006c7be3adfa0ad19399d335f6bc67338712642a00c1",
      "unchanged": true
    }
  ],
  "separateGatesNotGranted": [
    "BAZI_R11_CONTENT_QUALITY",
    "NATIVE_WINDOWS_PRINT_PDF_PARITY",
    "PRODUCTION_ENTRY",
    "IMMUTABLE_CACHE",
    "CONTROLLED_ACCOUNT_DELIVERY",
    "PROFESSIONAL_RELEASE",
    "PRODUCTION_ACTIVATION"
  ],
  "repositoryImported": false,
  "productionFrozen": false,
  "productionActivated": false,
  "providerCallsDuringThisWork": 0,
  "providerCostDuringThisWork": 0,
  "commit": false,
  "push": false,
  "deploy": false
};
const auditedRunnerHashes={
  "package.json": "62039e94766e3112b0fef6af8e7f561e0287e81fe131eff82b16de03700c2e85",
  "scripts/run-zero-cost-regression.mjs": "c3ef865f6827e37294eb5264ce68941db190d86bd5b9484b701664746ee319ff",
  "scripts/lib/report-zero-cost-preload.mjs": "85e2b8d60bfe3c37beff70c9e1d461f9f5fb17ebe5fb849e19980641cc848020"
};
const args=process.argv.slice(2);
if(args.includes('--help')) {
 console.log('node BAZI-R2-RECORD-ACCEPTANCE.mjs --repo C:\\phios [--verify-only] [--global-check]');
 console.log('Verify exact reviewed artifacts and receipts; append separate visual ACCEPT. Global check is optional and zero-provider guarded.');
 process.exit(0);
}
let repo=process.cwd();
for(let i=0;i<args.length;i++) {
 if(args[i]==='--repo'){if(!args[i+1])throw Error('--repo needs a path');repo=path.resolve(args[++i]);}
 else if(!['--verify-only','--global-check'].includes(args[i]))throw Error('Unknown argument: '+args[i]);
}
const hash=b=>createHash('sha256').update(b).digest('hex');
const bytes=p=>fs.readFileSync(path.join(repo,p));
const j=p=>JSON.parse(bytes(p).toString('utf8').replace(/^\uFEFF/,''));
function verifyExact(p,expected){const actual=hash(bytes(p));if(actual!==expected)throw Error('EXACT_REVIEWED_BYTES_MISMATCH '+p+' expected='+expected+' actual='+actual);return actual;}
for(const m of acceptance.modes) {
 verifyExact(m.repositoryPath,m.sha256);
 if(!bytes(m.repositoryPath).toString('utf8').includes(acceptance.manuscriptDigest))throw Error('MANUSCRIPT_DIGEST_MISSING '+m.mode);
}
for(const e of acceptance.evidence) {
 verifyExact(e.path,e.sha256);
 const v=j(e.path);
 if(e.manuscriptDigest && v.manuscriptDigest!==e.manuscriptDigest)throw Error('SOURCE_RECEIPT_MISMATCH '+e.path);
 if(e.publicationDigest && v.publicationDigest!==e.publicationDigest)throw Error('PUBLICATION_RECEIPT_MISMATCH '+e.path);
 if(e.kind==='BROWSER-FIT' && !v.samples.every(s=>['PASS','PASS_AFTER_RECOMPOSE'].includes(s.receipt.fitStatus)))throw Error('BROWSER_FAIL');
 if(e.kind==='PRINT-FIT' && !['PASS','PASS_AFTER_RECOMPOSE'].includes(v.fitStatus))throw Error('PRINT_FAIL');
 if(['PDF-FIT','READABILITY','ZERO_PROVIDER'].includes(e.kind) && v.status!=='PASS')throw Error('RECEIPT_FAIL '+e.path);
 if(v.providerCalls!==0)throw Error('RECEIPT_PROVIDER_CALLS '+e.path);
}
for(const f of acceptance.protectedFiles)verifyExact(f.path,f.sha256);
if(args.includes('--verify-only')) {
 console.log(JSON.stringify({status:'VERIFIED',modes:3,manuscriptDigest:acceptance.manuscriptDigest,providerCalls:0,writes:0}));
 process.exit(0);
}
const git=spawnSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'});
const dirty=spawnSync('git',['status','--porcelain'],{cwd:repo,encoding:'utf8'});
const runDir=path.join(repo,'docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4',new Date().toISOString().replace(/[:.]/g,'-'));
fs.mkdirSync(runDir,{recursive:true});
const bound={...acceptance,repositoryImported:true,importedAt:new Date().toISOString(),repositoryHead:git.status===0?git.stdout.trim():null,productionActivated:false,productionFrozen:false};
fs.writeFileSync(path.join(runDir,'HUMAN-VISUAL-ACCEPTANCE-R2.json'),JSON.stringify(bound,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'VISUAL_ACCEPT_RECORDED',path:runDir,providerCalls:0,productionActivated:false}));
if(args.includes('--global-check')) {
 for(const [p,h] of Object.entries(auditedRunnerHashes))verifyExact(p,h);
 const p=j('package.json');
 for(const k of ['precheck','check','postcheck'])if(p.scripts[k]!==`node scripts/run-zero-cost-regression.mjs ${k}`)throw Error('ZERO_COST_LIFECYCLE_CHANGED '+k);
 const preload=pathToFileURL(path.join(repo,'scripts/lib/report-zero-cost-preload.mjs')).href;
 const env={...process.env,REPORT_PROVIDER_LIVE_ALLOWED:'false',REPORT_ZERO_COST_REPLAY:'true'};
 // Use only the audited preload, not inherited potentially conflicting NODE_OPTIONS.
 env.NODE_OPTIONS=`--import=${preload}`;
 for(const k of Object.keys(env))if(/^(OPENAI|ANTHROPIC|DEEPSEEK|GEMINI|GOOGLE_AI|OPENROUTER).*(API_KEY|ACCESS_TOKEN|SECRET)$/.test(k))delete env[k];
 const startedAt=new Date().toISOString();
 const command=process.platform==='win32'?'cmd.exe':'npm';
 const commandArgs=process.platform==='win32'?['/d','/s','/c','npm.cmd run check']:['run','check'];
 const log=fs.openSync(path.join(runDir,'GLOBAL-REPOSITORY-CHECK-R3.4.log'),'wx');
 let result;
 try {result=spawnSync(command,commandArgs,{cwd:repo,env,stdio:['ignore',log,log]});}finally {fs.closeSync(log);}
 let preservation='PASS';const changed=[];
 for(const f of [...acceptance.protectedFiles,...acceptance.modes.map(m=>({path:m.repositoryPath,sha256:m.sha256}))]) {
  try{if(hash(bytes(f.path))!==f.sha256)changed.push(f.path);}catch{changed.push(f.path);}
 }
 if(changed.length)preservation='FAIL';
 const global={status:result.status===0&&preservation==='PASS'?'PASS':'FAIL',exitCode:result.status,error:result.error?.message??null,command:'npm run check (precheck/check/postcheck)',startedAt,finishedAt:new Date().toISOString(),repositoryHead:bound.repositoryHead,workingTreeBefore:dirty.status===0?dirty.stdout:null,sourcePreservation:preservation,changedProtectedOrAcceptedFiles:changed,zeroProviderGuard:'AUDITED_PRELOAD_AND_RUNNER; MODEL_CREDENTIALS_REMOVED',providerCallsClaim:'NO_LIVE_CALLS_AUTHORIZED; network provider requests blocked by inherited preload',productionFrozen:false,productionActivated:false};
 fs.writeFileSync(path.join(runDir,'GLOBAL-REPOSITORY-CHECK-R3.4.json'),JSON.stringify(global,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify(global));
 if(global.status!=='PASS')process.exitCode=1;
}
