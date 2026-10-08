# PHI OS Shared Delivery R4 — uncompressed patch + QA deployment runner
# No automatic commit, push, production deployment, live provider or account proof.
# Save this file, then run in PowerShell:
#   .\PHI-OS-SHARED-DELIVERY-R4-QA.ps1 -Repo C:\phios -Action Apply
#   .\PHI-OS-SHARED-DELIVERY-R4-QA.ps1 -Repo C:\phios -Action Deploy
# Apply: preflight the complete patch before writing; preserve unrelated work.
# Deploy: verify all patched bytes, scoped tests/build, QA-only Cloudflare targets.
# Any failure stops. If Apply rejects your newer/local changes, reconcile; never force.
param([string]$Repo='C:\phios',[ValidateSet('Validate','Apply','Deploy')][string]$Action='Validate')
$ErrorActionPreference='Stop'
Set-Location -LiteralPath $Repo
function Run-Checked([string]$Program,[string[]]$Arguments) {
 & $Program @Arguments
 if ($LASTEXITCODE -ne 0) { throw "Stopped: $Program exited $LASTEXITCODE" }
}
$patchText=@'
diff --git a/SHARED-REPORT-E2E-VFR-R2-INSTALL.mjs b/SHARED-REPORT-E2E-VFR-R2-INSTALL.mjs
index 16583787..71e3b524 100644
--- a/SHARED-REPORT-E2E-VFR-R2-INSTALL.mjs
+++ b/SHARED-REPORT-E2E-VFR-R2-INSTALL.mjs
@@ -8,6 +8,8 @@ const hash=b=>createHash('sha256').update(b).digest('hex');
 const args=process.argv.slice(2),i=args.indexOf('--repo');if(i<0||!args[i+1])throw Error('Use --repo C:\\phios [--global-check]');
 const repo=path.resolve(args[i+1]);if(!fs.existsSync(path.join(repo,'package.json')))throw Error('NOT_A_FULL_REPOSITORY');
 const file=p=>path.join(repo,p);
+const baseline=spawnSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'});
+if(baseline.status!==0||baseline.stdout.trim()!==manifest.auditHead)throw Error('R2_BASELINE_MISMATCH_RECONCILE_REQUIRED');
 // Preflight every audited input before changing any file. No forced patch application.
 for(const [p,want] of Object.entries(manifest.unchangedAuditInputs)){if(!fs.existsSync(file(p))||hash(fs.readFileSync(file(p)))!==want)throw Error('AUDITED_INPUT_CHANGED '+p);}
 for(const f of manifest.files){const got=fs.existsSync(file(f.path))?hash(fs.readFileSync(file(f.path))):null;if(got!==f.before&&got!==f.after)throw Error('BASELINE_MISMATCH '+f.path);}
diff --git a/config/reports/zero-cost-check-commands.json b/config/reports/zero-cost-check-commands.json
index 46ca04b1..484320b5 100644
--- a/config/reports/zero-cost-check-commands.json
+++ b/config/reports/zero-cost-check-commands.json
@@ -2260,7 +2260,7 @@
   "check:book-i-v3-final-source": "node scripts/check-book-i-v3-final-source-admission.mjs",
   "check:book-i-v3-extraction": "node scripts/check-book-i-v3-extraction-integrity.mjs",
   "check:dossier-us:golden": "node scripts/check-dossier-us-golden-closure.mjs",
-  "check:m3b": "node scripts/check-m3b-knowledge-release.mjs",
+  "check:m3b": "npm run check:m3b-knowledge-release",
   "check:profile:personal-evidence:bilingual-publication": "node scripts/check-profile-personal-evidence-w11r5.mjs",
   "check:profile:prd-w11r5:pfig-publication": "node scripts/check-profile-personal-evidence-w11r5.mjs",
   "check:profile:prd-w11r5:pfig-primary-binding": "node scripts/check-profile-personal-evidence-w11r5.mjs",
@@ -2272,5 +2272,18 @@
   "check:profile:prd-w11r5:mobile": "node scripts/check-profile-personal-evidence-w11r5-browser.mjs --no-pdf",
   "check:profile:prd-w11r5": "node scripts/check-profile-personal-evidence-w11r5.mjs && node scripts/check-profile-personal-evidence-w11r5-browser.mjs --no-pdf",
   "check:pc-r1:w0": "node scripts/check-pc-r1-w0-current-main.mjs",
-  "check:pc-r1:w1-w10": "node scripts/check-pc-r1-profile-demotion.mjs"
+  "check:pc-r1:w1-w10": "node scripts/check-pc-r1-profile-demotion.mjs",
+  "check:delivery-delta:will": "node scripts/check-method-delivery-delta.mjs WILL",
+  "check:shared-report-e2e:final": "node scripts/check-shared-report-e2e-final.mjs",
+  "check:shared-report-e2e:readiness-v2": "npm run check:shared-report-delivery:v2-contract && npm run check:shared-report-delivery:v2-runtime",
+  "check:delivery-delta:astrology": "node scripts/check-method-delivery-delta.mjs AST",
+  "check:delivery-delta:financial": "node scripts/check-method-delivery-delta.mjs FINANCIAL",
+  "check:delivery-delta:cross": "node scripts/check-method-delivery-delta.mjs CROSS",
+  "check:delivery-delta:ziwei": "node scripts/check-method-delivery-delta.mjs ZWR",
+  "check:delivery-delta:human-design": "node scripts/check-method-delivery-delta.mjs HD",
+  "check:delivery-delta:ecr": "node scripts/check-method-delivery-delta.mjs ECR",
+  "check:delivery-delta:numerology": "node scripts/check-method-delivery-delta.mjs NUM",
+  "check:shared-report-delivery:v2-runtime": "node --no-warnings scripts/check-shared-report-delivery-v2-runtime.mjs",
+  "check:shared-report-delivery:v2-contract": "node scripts/check-shared-report-delivery-v2-contract.mjs",
+  "check:delivery-delta:profile": "node scripts/check-method-delivery-delta.mjs PROFILE"
 }
diff --git a/content/reports/shared-report-delivery-e2e-contract-v2.json b/content/reports/shared-report-delivery-e2e-contract-v2.json
index 65357eb5..74ebc216 100644
--- a/content/reports/shared-report-delivery-e2e-contract-v2.json
+++ b/content/reports/shared-report-delivery-e2e-contract-v2.json
@@ -1,45 +1,125 @@
 {
   "schemaVersion": "PHI-OS-SHARED-REPORT-DELIVERY-E2E-CONTRACT-v2.0.0",
-  "supersedes": "content/reports/shared-report-delivery-e2e-contract-v1.json",
-  "historicalContractPreserved": true,
-  "state": "BLOCKED_VFR_ADMISSION",
-  "profiles": {
-    "ZWR:ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3": {
-      "methodId": "ZWR",
-      "compositionVersion": "ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3",
-      "candidateSchemaVersion": "ZWR-VFR-R1-AUTO-DEEP-CANDIDATE-v3",
-      "publicationIrVersion": "ZWR-VFR-R1-DEEP-PUBLICATION-IR-v1",
-      "pagePlanVersion": "ZWR-VFR-R1-ADAPTIVE-LANGUAGE-SEQUENTIAL-v6",
-      "pagePolicy": "RECOMPUTE_FROM_ACCEPTED_PUBLICATION_IR",
-      "locales": [
-        "en",
-        "zh-Hans"
-      ],
-      "admission": {
-        "state": "BLOCKED",
-        "sourceAcceptanceDigest": null,
-        "rendererAcceptanceDigest": null,
-        "rendererWired": false,
-        "productionAdmissionGranted": false,
-        "sourceResultDigest": null,
-        "publicationIrDigest": null,
-        "pagePlanDigest": null
-      },
-      "blockers": [
-        "VFR currently inherits old production snapshot ID and 33-page report rather than a newly bound VFR delivery snapshot.",
-        "Private renderer has no VFR composition adapter.",
-        "No accepted VFR source/publication/render profile admission receipt is bound to this delivery version.",
-        "Live authenticated purchase/consent/release/private Library/two-session account evidence remains uncollected."
-      ]
-    }
-  },
-  "proofActions": [
-    "open-released",
-    "reopen"
+  "status": "METHOD_MIGRATION_IN_PROGRESS",
+  "predecessor": "content/reports/shared-report-delivery-e2e-contract-v1.json",
+  "sharedInfrastructureRequirements": [
+    "AUTHENTICATED_ACCOUNT",
+    "REAL_ENTITLEMENT",
+    "CANONICAL_SUBJECT_BINDING",
+    "METHOD_GENERATION_PASS",
+    "IMMUTABLE_SEMANTIC_SNAPSHOT",
+    "PRIVATE_RENDERER_PASS",
+    "RELEASED_MATERIAL",
+    "ACCOUNT_LIBRARY_VISIBLE",
+    "NEW_AUTHENTICATED_SESSION",
+    "REOPEN_SAME_REPORT_ID",
+    "SAME_SEMANTIC_SNAPSHOT",
+    "SAME_RENDERED_MATERIAL_IDENTITY",
+    "NO_PROVIDER_REGENERATION_ON_REOPEN",
+    "NO_RENDERER_REGENERATION_ON_REOPEN",
+    "SECOND_ACCOUNT_DENIAL",
+    "RENDERER_STABILITY_PASS"
   ],
-  "generateInProof": false,
-  "providerRegenerationOnReopen": false,
-  "sharedDeliveryAuthorityEligible": false,
-  "productionActivated": false,
-  "auditedRepositoryHead": "2259cf66aa2a4c47bb99d775acb58cb95567d60f"
+  "methodDeltaRequirements": [
+    "METHOD_AUTHORITY",
+    "METHOD_GENERATION",
+    "METHOD_PUBLICATION_PROFILE",
+    "METHOD_RENDER_CONTRACT",
+    "METHOD_RELEASE_ADAPTER",
+    "METHOD_METADATA",
+    "METHOD_SPECIFIC_ACCESS_NEGATIVES"
+  ],
+  "rendererContract": {
+    "dispatchOwner": "functions/report-delivery/method-render-contract.js",
+    "expectedPages": "METHOD_PROFILE",
+    "historicalSnapshotsPreserved": true
+  },
+  "materialContract": {
+    "owner": "functions/account/method-report-material.js",
+    "storage": "PRIVATE_REPORTS",
+    "immutable": true,
+    "digestRequired": true
+  },
+  "libraryContract": {
+    "authorizationOnEveryRead": true,
+    "generationCalls": 0
+  },
+  "reopenContract": {
+    "providerCalls": 0,
+    "rendererCalls": 0,
+    "sameReportId": true,
+    "sameSnapshot": true,
+    "sameOutputDigest": true
+  },
+  "accessIsolationContract": {
+    "guest": "DENIED",
+    "wrongAccount": "DENIED",
+    "wrongSubject": "DENIED",
+    "missingEntitlement": "DENIED",
+    "tamperedSnapshot": "DENIED",
+    "tamperedMaterial": "DENIED"
+  },
+  "liveProofContract": {
+    "automaticExecution": false,
+    "finalReceiptOnlyAfterRealProof": true,
+    "stabilityRuns": [
+      3,
+      5
+    ],
+    "allTargetDeltasRequired": true,
+    "requiredProofFields": [
+      "generationReleaseProven",
+      "releasedMaterialProven",
+      "reopenProven",
+      "sameImmutableSnapshot",
+      "sameImmutableRenderedMaterial",
+      "noProviderRegenerationOnReopen",
+      "noRendererRegenerationOnReopen"
+    ],
+    "phases": [
+      "METHOD_GENERATE_RELEASE",
+      "OPEN_RELEASED",
+      "LOGOUT",
+      "NEW_LOGIN",
+      "REOPEN",
+      "SECOND_ACCOUNT_ISOLATION",
+      "FINALIZE"
+    ],
+    "openReleasedMayProveGenerationRelease": false
+  },
+  "reusePolicy": {
+    "fullSharedInfrastructureProofRequiredOnce": true,
+    "repeatedPerMethodFullE2E": false,
+    "methodCorrectnessInherited": false
+  },
+  "privacy": {
+    "rawAccountIdInRepo": false,
+    "rawSessionIdInRepo": false,
+    "liveProofRemainsPrivate": true,
+    "privateReportBytesPublic": false,
+    "privatePersonReferences": "HASH_ONLY"
+  },
+  "methodDeltaRegistryRef": "content/reports/method-report-delivery-delta-registry-v1.json",
+  "sessionContract": {
+    "owner": "functions/account/oidc-auth.js",
+    "differentVerifiedSessionRequired": true,
+    "previousSessionRevokedRequired": true,
+    "rawSessionIdsPersisted": false
+  },
+  "rendererReceiptContract": {
+    "expectedPageRule": "RESOLVED_METHOD_PROFILE",
+    "requiredFields": [
+      "pagePlanDigest",
+      "expectedPageCount",
+      "actualPageCount",
+      "pageSequenceValid",
+      "overflowCount",
+      "brokenImages",
+      "hiddenRequiredContentCount",
+      "errorCount",
+      "rendererVersion",
+      "snapshotId",
+      "outputDigest"
+    ]
+  }
 }
diff --git a/functions/account/ziwei-account-delivery.js b/functions/account/ziwei-account-delivery.js
index fafc9f15..ad878474 100644
--- a/functions/account/ziwei-account-delivery.js
+++ b/functions/account/ziwei-account-delivery.js
@@ -1,5 +1,7 @@
-import contract from '../../content/reports/shared-report-delivery-e2e-contract-v2.json' with { type: 'json' };
-import {requireVfrAdmission} from '../report-delivery/shared-report-e2e-v2.js';
+import {cachedMethodDelivery,methodCacheIdentity} from '../report-delivery/method-delivery-cache.js';
+import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
+import {assertMethodRenderReceipt,methodMaterialIdentity,assertMethodGeneration} from '../report-delivery/method-render-contract.js';
+import {readMethodReportMaterial,persistMethodReportMaterial} from './method-report-material.js';
 import {generateAccountZiweiCandidate} from '../report-delivery/ziwei-canonical-person-binding.js';
 import {controlledZiweiIdentity} from '../report-delivery/ziwei-production-generation-v1.js';
 import {loadCanonicalPersonSubject} from './canonical-person-store.js';
@@ -11,37 +13,35 @@ const loader=env=>(owner,id)=>loadCanonicalPersonSubject(env,owner,id);
 async function bounded(response,max){const reader=response.body?.getReader();if(!reader)throw fail('REPORT_RENDER_FAILED');let bytes=0,text='';const decoder=new TextDecoder();for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>max){await reader.cancel();throw fail('REPORT_RENDER_TOO_LARGE');}text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}
 export async function generateAndReleaseAccountZiwei(context,selection,{generateCandidate=generateAccountZiweiCandidate}={}){
  controlledZiweiIdentity(context);
+ if(!context.env.METHOD_REPORT_RENDERER?.fetch)throw fail('REPORT_BROWSER_VERIFIER_NOT_CONFIGURED',503);
  const candidate=selection?.reportMode!=null||selection?.realityBriefId!=null?await generateContextualAccountZiweiCandidate(context,selection):await generateCandidate(context,selection);
- if(candidate.visualFirst===true)requireVfrAdmission(contract.profiles['ZWR:'+candidate.generationSuccessor]);
  // An actual private server browser verifier must be configured. Customer claims
  // and local test receipts cannot cross this boundary.
+ await assertMethodGeneration(candidate);
  if(!context.env.METHOD_REPORT_RENDERER?.fetch)throw fail('REPORT_BROWSER_VERIFIER_NOT_CONFIGURED',503);
- const response=await context.env.METHOD_REPORT_RENDERER.fetch(new Request('https://method-report-renderer.internal/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({candidate,method:'ZWR',compositionVersion:candidate.snapshot.compositionVersion})}));
- if(!response.ok)throw fail('REPORT_RENDER_FAILED');
- const output=JSON.parse(await bounded(response,8000000)),receipt=output.verification;
- const expectedPages=candidate.snapshot.semanticContent.report.totalPages;
- if(typeof output.html!=='string'||receipt?.semanticSnapshotId!==candidate.snapshot.semanticSnapshotId||receipt?.passed!==true||receipt?.pageCount!==expectedPages||receipt?.brokenImages!==0||receipt?.overflowCount!==0||receipt?.errorCount!==0||receipt?.outputDigest!==await digest(output.html))throw fail('REPORT_RENDER_VERIFICATION_REQUIRED');
+ const publicationKey=await methodCacheIdentity({schemaVersion:'METHOD_PUBLICATION_CACHE_KEY_V1',snapshotId:candidate.snapshot.semanticSnapshotId,semanticDigest:await sha256Stable(candidate.snapshot.semanticContent),profileVersion:candidate.snapshot.semanticContent.vfrLineage?.profileVersion||null,compositionVersion:candidate.snapshot.compositionVersion,rendererContract:await assertMethodGeneration(candidate).then(({renderFunction,...contract})=>contract)});
+ const publication=await cachedMethodDelivery(context.env,{ownerAccountId:candidate.customerId,kind:'PUBLICATION',key:publicationKey,
+  validate:async output=>{assertMethodRenderReceipt(candidate,output.verification);if(typeof output.html!=='string'||output.verification.outputDigest!==await digest(output.html))throw fail('REPORT_RENDER_VERIFICATION_REQUIRED');},
+  produce:async()=>{
+   const response=await context.env.METHOD_REPORT_RENDERER.fetch(new Request('https://method-report-renderer.internal/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({candidate,method:'ZWR',compositionVersion:candidate.snapshot.compositionVersion})}));
+   if(!response.ok)throw fail('REPORT_RENDER_FAILED');
+   return JSON.parse(await bounded(response,8000000));
+  }
+ });
+ const output=publication.value,receipt=output.verification;
+ const identity=await methodMaterialIdentity(candidate,receipt);
  const release=await releaseControlledZiweiReport(context,candidate,{loadSubject:loader(context.env),renderVerification:receipt});
- const objectKey=`released-method/${release.reportId}/${receipt.outputDigest}.html`,now=new Date().toISOString();
- await context.env.PRIVATE_REPORTS.put(objectKey,output.html,{httpMetadata:{contentType:'text/html; charset=utf-8',cacheControl:'private, no-store'}});
- await context.env.RUNTIME_DB.prepare('INSERT INTO account_method_report_materials(report_id,owner_account_id,person_id,method_code,locale,snapshot_id,object_key,output_digest,released_at,verifier_receipt) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(report_id) DO NOTHING').bind(release.reportId,candidate.customerId,candidate.personId,'ZWR',candidate.locale,candidate.snapshot.semanticSnapshotId,objectKey,receipt.outputDigest,now,JSON.stringify(receipt)).run();
+ await persistMethodReportMaterial(context,{release,candidate,html:output.html,receipt,identity});
  return {reportId:release.reportId};
 }
 export async function openAccountZiweiMaterial(context,reportId){
  const owner=controlledZiweiIdentity(context).userId;
- const row=await context.env.RUNTIME_DB.prepare('SELECT rowid AS report_version,* FROM account_method_report_materials WHERE owner_account_id=? AND report_id=?').bind(owner,reportId).first();
- if(!row)throw fail('REPORT_UNAVAILABLE',404);
- // Reads and integrity/admission checks only. Never generate or render on open.
- const candidate=await openControlledZiweiReport(context,{reportId,personId:row.person_id},{loadSubject:loader(context.env)});
- if(candidate.snapshot.semanticSnapshotId!==row.snapshot_id||candidate.locale!==row.locale)throw fail('REPORT_UNAVAILABLE',404);
- const object=await context.env.PRIVATE_REPORTS.get(row.object_key);if(!object)throw fail('REPORT_UNAVAILABLE',404);
- const html=await object.text();if(await digest(html)!==row.output_digest)throw fail('REPORT_UNAVAILABLE',404);
- return {row,candidate,html};
+ return readMethodReportMaterial(context,reportId,{ownerAccountId:owner,loadReleaseReceipt:async()=>{const row=await context.env.RUNTIME_DB.prepare('SELECT a.payload FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.artifact_id=? AND r.user_id=?').bind(reportId,owner).first();return row?JSON.parse(row.payload).renderVerification:null;},openReleasedCandidate:row=>openControlledZiweiReport(context,{reportId,personId:row.person_id},{loadSubject:loader(context.env)})});
 }
 export async function listAccountZiweiMaterials(context){
  const owner=controlledZiweiIdentity(context).userId;
  const rows=(await context.env.RUNTIME_DB.prepare('SELECT report_id FROM account_method_report_materials WHERE owner_account_id=? ORDER BY released_at DESC LIMIT 100').bind(owner).all()).results;
  const reports=[];
- for(const row of rows){try{const {row:r,candidate}=await openAccountZiweiMaterial(context,row.report_id);reports.push({reportId:r.report_id,method:'ZWR',subjectName:candidate.snapshot.semanticContent.subject.displayName,locale:r.locale,releasedAt:r.released_at,version:r.report_version,status:'RELEASED'});}catch(e){if(e.status===503)throw e;}}
+ for(const row of rows){try{const {row:r,candidate}=await openAccountZiweiMaterial(context,row.report_id);reports.push({reportId:r.report_id,method:'ZWR',subjectName:candidate.snapshot.semanticContent.subject.displayName,locale:r.locale,releasedAt:r.released_at,version:r.report_version,compositionVersion:candidate.snapshot.compositionVersion,presentationMode:candidate.visualFirst?'BILINGUAL':r.locale,status:'RELEASED'});}catch(e){if(e.status===503)throw e;}}
  return reports;
 }
diff --git a/functions/account/ziwei-controlled-report-material.js b/functions/account/ziwei-controlled-report-material.js
index d6e21f8f..9f067dc3 100644
--- a/functions/account/ziwei-controlled-report-material.js
+++ b/functions/account/ziwei-controlled-report-material.js
@@ -1,3 +1,4 @@
+import {assertMethodRenderReceipt,resolveMethodRenderContract,assertMethodGeneration} from '../report-delivery/method-render-contract.js';
 import {controlledZiweiIdentity,requireZiweiEntitlement} from '../report-delivery/ziwei-controlled-generation.js';
 import {admitPersonUse} from './person-use-policy.js';
 import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
@@ -17,7 +18,8 @@ async function intact(candidate){
  if((await createCustomerDeliverySnapshot(s)).semanticSnapshotId!==s.semanticSnapshotId)deny();
  if(c.evidence.subjectId!==candidate.personId||c.subject.subjectReference!==candidate.personId||s.locale!==candidate.locale||s.subjectFingerprint!==c.subject.subjectFingerprint||s.inputFingerprint!==c.evidence.inputFingerprint)deny();
  if(c.sections.some(x=>x.claims.some(k=>k.subjectId!==candidate.personId||k.inputFingerprint!==c.evidence.inputFingerprint)))deny();
- if(c.report.intro[0].subject.subjectFingerprint!==c.subject.subjectFingerprint)deny();
+ if(c.visualReportIr)await assertMethodGeneration(candidate);
+ else if(c.report.intro[0].subject.subjectFingerprint!==c.subject.subjectFingerprint)deny();
  await assertReportSubjectBinding({presentation:c.subject,expectedBinding:c.subjectBinding});
 }
 export async function releaseControlledZiweiReport(context,candidate,{loadSubject,renderVerification}={}){
@@ -25,8 +27,9 @@ export async function releaseControlledZiweiReport(context,candidate,{loadSubjec
  const owned=await requireZiweiEntitlement(context,candidate.locale);if(owned.purchase_id!==candidate.purchaseId)deny();
  await personAccess(identity.userId,candidate.personId,loadSubject);await intact(candidate);
  // Receipt is supplied by the server render verifier, never a customer route.
- const expectedPages=Number(candidate.snapshot?.semanticContent?.report?.totalPages||0);
- if(!expectedPages||renderVerification?.semanticSnapshotId!==candidate.snapshot.semanticSnapshotId||renderVerification.passed!==true||renderVerification.pageCount!==expectedPages)throw Error('REPORT_RENDER_VERIFICATION_REQUIRED');
+ const contract=resolveMethodRenderContract(candidate);
+ if(contract.rendererId==='ZIWEI_VFR')assertMethodRenderReceipt(candidate,renderVerification);
+ else if(renderVerification?.semanticSnapshotId!==candidate.snapshot.semanticSnapshotId||renderVerification.passed!==true||renderVerification.pageCount!==contract.expectedPageCount)throw Error('REPORT_RENDER_VERIFICATION_REQUIRED');
  const db=storage(context),digest=await sha256Stable(candidate),id='zwr-'+digest,key='controlled-ziwei/'+digest+'.json',now=new Date().toISOString();
  const metadata={scope:'CONTROLLED_QA_ONLY',customerId:identity.userId,personId:candidate.personId,locale:candidate.locale,purchaseId:candidate.purchaseId,snapshotId:candidate.snapshot.semanticSnapshotId,key,digest,releaseStatus:'ACTIVE',releasedAt:now,renderVerification};
  await context.env.PRIVATE_REPORTS.put(key,JSON.stringify(candidate),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
@@ -42,11 +45,11 @@ export async function openControlledZiweiReport(context,{reportId,personId},{loa
  const row=await db.prepare('SELECT a.payload FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.artifact_id=? AND r.user_id=? AND a.artifact_type=? AND r.status=?').bind(reportId,identity.userId,TYPE,'active').first();
  if(!row)deny();const m=JSON.parse(row.payload);
  if(m.customerId!==identity.userId||m.personId!==personId||m.releaseStatus!=='ACTIVE')deny();
- await requireZiweiEntitlement(context,m.locale);await personAccess(identity.userId,personId,loadSubject);
+ const owned=await requireZiweiEntitlement(context,m.locale);if(owned.purchase_id!==m.purchaseId)deny();await personAccess(identity.userId,personId,loadSubject);
  const object=await context.env.PRIVATE_REPORTS.get(m.key);if(!object)deny();
  const candidate=JSON.parse(await object.text());if(await sha256Stable(candidate)!==m.digest)deny();
  if(candidate.personId!==personId||candidate.customerId!==identity.userId||candidate.snapshot.semanticSnapshotId!==m.snapshotId)deny();
- await intact(candidate);return candidate;
+ await intact(candidate);if(candidate.visualFirst)assertMethodRenderReceipt(candidate,m.renderVerification);return candidate;
 }
 export async function listControlledZiweiReports(context,{loadSubject}={}){
  const identity=controlledZiweiIdentity(context),db=storage(context);
diff --git a/functions/api/shared-report-e2e-proof.js b/functions/api/shared-report-e2e-proof.js
index 203807a8..38ca5f35 100644
--- a/functions/api/shared-report-e2e-proof.js
+++ b/functions/api/shared-report-e2e-proof.js
@@ -1,7 +1,119 @@
+import {loadCanonicalPersonSubject} from '../account/canonical-person-store.js';
 import {authenticate,digest,requireSameOrigin} from '../account/oidc-auth.js';
-import {openAccountZiweiMaterial,listAccountZiweiMaterials} from '../account/ziwei-account-delivery.js';
-import contract from '../../content/reports/shared-report-delivery-e2e-contract-v2.json' with { type: 'json' };
-import {createSharedReportE2eProofV2} from '../report-delivery/shared-report-e2e-v2.js';
-const handler=createSharedReportE2eProofV2({contract,authenticate,requireSameOrigin,digest,open:openAccountZiweiMaterial,list:listAccountZiweiMaterials});
+import {resolveMethodDeliveryAdapter} from '../account/method-report-delivery.js';
+import {assertMethodRenderReceipt,resolveMethodDeliveryDelta,assertMethodGeneration} from '../report-delivery/method-render-contract.js';
 const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow, noarchive'};
-export async function onRequest(context){const response=await handler(context);for(const [k,v] of Object.entries(headers))response.headers.set(k,v);return response;}
+const fail=(code,status=409)=>Object.assign(new Error(code),{code,status});
+const proofKey=id=>'qa/shared-report-e2e/v2/'+id+'.json';
+const parseReceipt=row=>{try{return JSON.parse(row.verifier_receipt)}catch{return null}};
+async function proofSeal(env,proof){
+ const {integritySeal,...payload}=proof;
+ if(!env.AUTH_SESSION_SECRET)throw fail('SHARED_E2E_PROOF_SEAL_REQUIRED');
+ const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.AUTH_SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
+ return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(JSON.stringify(payload))))].map(x=>x.toString(16).padStart(2,'0')).join('');
+}
+async function save(env,key,proof){await env.PRIVATE_REPORTS.put(key,JSON.stringify({...proof,integritySeal:await proofSeal(env,proof)}),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});}
+async function materialProof(opened){
+ const identity=parseReceipt(opened.row)?.materialIdentity;
+ return {semanticSnapshotId:opened.candidate.snapshot.semanticSnapshotId,outputDigest:opened.row.output_digest,materialIdentityDigest:await digest(JSON.stringify(identity)),manuscriptDigest:identity.manuscriptDigest,publicationIrDigest:identity.publicationIrDigest,pagePlanDigest:identity.pagePlanDigest,personIdHash:await digest(opened.candidate.personId)};
+}
+async function verifyMaterialProof(proof,opened){
+ const actual=await materialProof(opened);
+ for(const [key,value] of Object.entries(actual))if(proof[key]!==value)throw fail('SHARED_E2E_IMMUTABILITY_MISMATCH');
+ if(proof.reportId!==opened.row.report_id||proof.generationVersion!==opened.candidate.snapshot.compositionVersion||proof.rendererVersion!==parseReceipt(opened.row)?.rendererVersion)throw fail('SHARED_E2E_IMMUTABILITY_MISMATCH');
+}
+const TARGET_METHODS=Object.freeze(['ZWR','AST','NUM','PROFILE','ECR','HD','FINANCIAL','WILL','CROSS']);
+export async function requireMethodWave(env){
+ const object=await env.PRIVATE_REPORTS.get('qa/shared-report-e2e/v2/method-deltas.json');
+ if(!object)throw fail('SHARED_E2E_ALL_TARGET_METHOD_DELTAS_REQUIRED');
+ const manifest=await object.json();
+ if(manifest.schemaVersion!=='METHOD_DELIVERY_WAVE_PRIVATE_ADMISSION_V1'||!TARGET_METHODS.every(code=>manifest.methods?.filter(m=>m.methodCode===code&&m.status==='PASS'&&m.profileResolved===true&&m.deployedProofDigest).length===1))throw fail('SHARED_E2E_ALL_TARGET_METHOD_DELTAS_REQUIRED');
+ return manifest;
+}
+// Partial phases are never shared authority. The final offline admission gate also
+// requires all method deltas, an actual renderer campaign, and global regression.
+export async function onRequest(context){
+ try{
+  if(context.request.method!=='POST')return Response.json({ok:false,code:'METHOD_NOT_ALLOWED'},{status:405,headers});
+  requireSameOrigin(context.request);
+  const identity=await authenticate(context);if(!identity)throw fail('ACCOUNT_REQUIRED',401);
+  if(context.env.PHIOS_ENVIRONMENT!=='qa')throw fail('SHARED_E2E_QA_ONLY',403);
+  if(!context.env.PRIVATE_REPORTS?.put||!context.env.PRIVATE_REPORTS?.get)throw fail('SHARED_E2E_STORAGE_REQUIRED',503);
+  const body=await context.request.json();
+  if(!body||!['generate-release-open','open-released','reopen','account-isolation','finalize'].includes(body.action))throw fail('SHARED_E2E_ACTION_INVALID',400);
+  if(body.action==='generate-release-open'){
+   if(context.env.SHARED_REPORT_E2E_LIVE_ALLOWED!=='true')throw fail('SHARED_E2E_LIVE_NOT_AUTHORIZED',403);
+   // A native generation phase is independent of shared final admission.
+   // The generator checks its deployed method admission before any paid call.
+   if(typeof body.personId!=='string'||!['en','zh-Hans'].includes(body.locale))throw fail('SHARED_E2E_SELECTION_INVALID',400);
+   const methodCode=body.methodCode||'ZWR',adapter=resolveMethodDeliveryAdapter(methodCode);
+   const released=await adapter.generate(context,{personId:body.personId,locale:body.locale,targetContext:body.targetContext});
+   const opened=await adapter.open(context,released.reportId),candidate=opened.candidate,receipt=parseReceipt(opened.row);
+   await assertMethodGeneration(candidate);
+   const delta=resolveMethodDeliveryDelta(candidate);assertMethodRenderReceipt(candidate,receipt);
+   if(!(await adapter.list(context)).some(x=>x.reportId===released.reportId&&x.status==='RELEASED'))throw fail('SHARED_E2E_ACCOUNT_LIBRARY_MISSING_RELEASE');
+   const proof={schemaVersion:'PHI-OS-SHARED-REPORT-E2E-PROOF-v2',state:'PHASE1_RELEASED_AND_OPENED',sharedDeliveryAuthorityEligible:false,methodCode,generationVersion:delta.compositionVersion,publicationVersion:delta.publicationVersion,rendererVersion:delta.rendererVersion,reportId:released.reportId,semanticSnapshotId:candidate.snapshot.semanticSnapshotId,outputDigest:opened.row.output_digest,accountIdHash:await digest(identity.userId),...(await materialProof(opened)),generationReleaseProven:true,releasedMaterialProven:true,reopenProven:false,firstAuthenticatedSessionHash:identity.sessionId,firstOpenedAt:new Date().toISOString(),actualAccountGenerateReleasePass:true,libraryPass:true,rendererPassed:true,rendererPageCount:receipt.pageCount};
+   await save(context.env,proofKey(released.reportId),proof);
+   return Response.json({ok:true,proof:{state:proof.state,reportId:proof.reportId,sharedDeliveryAuthorityEligible:false,nextAction:'LOGOUT_LOGIN_THEN_POST_REOPEN'}},{headers});
+  }
+  if(typeof body.reportId!=='string'||!/^[a-z0-9-]+$/i.test(body.reportId))throw fail('SHARED_E2E_REPORT_ID_REQUIRED',400);
+  if(body.action==='open-released'){
+   const adapter=resolveMethodDeliveryAdapter(body.methodCode||'ZWR'),opened=await adapter.open(context,body.reportId);
+   await assertMethodGeneration(opened.candidate);const receipt=parseReceipt(opened.row),delta=assertMethodRenderReceipt(opened.candidate,receipt);
+   if(!(await adapter.list(context)).some(x=>x.reportId===body.reportId&&x.status==='RELEASED'))throw fail('SHARED_E2E_ACCOUNT_LIBRARY_MISSING_RELEASE');
+   const prior=await context.env.PRIVATE_REPORTS.get(proofKey(body.reportId));let proof;
+   if(prior){proof=await prior.json();if(proof.integritySeal!==await proofSeal(context.env,proof)||proof.accountIdHash!==await digest(identity.userId))throw fail('SHARED_E2E_PROOF_TAMPERED');await verifyMaterialProof(proof,opened);}
+   else proof={schemaVersion:'PHI-OS-SHARED-REPORT-E2E-PROOF-v2',methodCode:delta.methodCode,generationVersion:delta.compositionVersion,publicationVersion:delta.publicationVersion,rendererVersion:delta.rendererVersion,reportId:body.reportId,accountIdHash:await digest(identity.userId),firstAuthenticatedSessionHash:identity.sessionId,...(await materialProof(opened)),generationReleaseProven:false,actualAccountGenerateReleasePass:false,reopenProven:false};
+   await save(context.env,proofKey(body.reportId),{...proof,state:'RELEASED_MATERIAL_PROVEN',releasedMaterialProven:true,libraryPass:true,sharedDeliveryAuthorityEligible:false});
+   return Response.json({ok:true,proof:{state:'RELEASED_MATERIAL_PROVEN',generationReleaseProven:proof.generationReleaseProven===true,releasedMaterialProven:true,sharedDeliveryAuthorityEligible:false}},{headers});
+  }
+  const object=await context.env.PRIVATE_REPORTS.get(proofKey(body.reportId));if(!object)throw fail('SHARED_E2E_PHASE1_PROOF_REQUIRED',404);
+  const proof=await object.json();if(proof.integritySeal!==await proofSeal(context.env,proof)||proof.reportId!==body.reportId)throw fail('SHARED_E2E_PROOF_TAMPERED');
+  const adapter=resolveMethodDeliveryAdapter(proof.methodCode);
+  const accountHash=await digest(identity.userId);
+  if(body.action==='reopen'){
+   if(proof.accountIdHash!==accountHash)throw fail('SHARED_E2E_ACCOUNT_MISMATCH',403);
+   const sessionHash=identity.sessionId;
+   if(!proof.firstAuthenticatedSessionHash||proof.firstAuthenticatedSessionHash===sessionHash)throw fail('SHARED_E2E_NEW_LOGIN_SESSION_REQUIRED');
+   const previousSession=await context.env.RUNTIME_DB.prepare('SELECT revoked_at FROM account_verified_sessions WHERE session_hash=? AND user_id=?').bind(proof.firstAuthenticatedSessionHash,identity.userId).first();
+   if(previousSession?.revoked_at==null)throw fail('SHARED_E2E_LOGOUT_REQUIRED');
+   const opened=await adapter.open(context,body.reportId);assertMethodRenderReceipt(opened.candidate,parseReceipt(opened.row));
+   await verifyMaterialProof(proof,opened);
+   if(opened.candidate.snapshot.semanticSnapshotId!==proof.semanticSnapshotId||opened.row.snapshot_id!==proof.semanticSnapshotId||opened.row.output_digest!==proof.outputDigest)throw fail('SHARED_E2E_IMMUTABILITY_MISMATCH');
+   if(!(await adapter.list(context)).some(x=>x.reportId===body.reportId))throw fail('SHARED_E2E_REOPEN_LIBRARY_MISSING');
+   const updated={...proof,state:'REOPEN_PROVEN_PENDING_ISOLATION_AND_STABILITY',secondAuthenticatedSessionHash:sessionHash,differentSessionReopenPass:true,reopenProven:true,logoutVerified:true,sameImmutableSnapshot:true,sameImmutableRenderedMaterial:true,noProviderRegenerationOnReopen:true,noRendererRegenerationOnReopen:true,reopenedAt:new Date().toISOString(),sharedDeliveryAuthorityEligible:false};
+   await save(context.env,proofKey(body.reportId),updated);
+   return Response.json({ok:true,proof:{state:updated.state,sharedDeliveryAuthorityEligible:false}},{headers});
+  }
+  if(body.action==='finalize'){
+   if(accountHash!==proof.accountIdHash)throw fail('SHARED_E2E_ACCOUNT_MISMATCH',403);
+   await verifyMaterialProof(proof,await adapter.open(context,body.reportId));
+   await requireMethodWave(context.env);
+   if(!proof.generationReleaseProven||!proof.releasedMaterialProven||!proof.reopenProven||!proof.actualAccountGenerateReleasePass||!proof.libraryPass||!proof.differentSessionReopenPass||!proof.logoutVerified||!proof.sameImmutableSnapshot||!proof.sameImmutableRenderedMaterial||!proof.noProviderRegenerationOnReopen||!proof.noRendererRegenerationOnReopen||!proof.secondAccountIsolationPass)throw fail('SHARED_E2E_REQUIRED_LIVE_PHASES_INCOMPLETE');
+   const stabilityObject=await context.env.PRIVATE_REPORTS.get('qa/shared-report-e2e/v2/renderer-stability/'+proof.rendererVersion+'.json');
+   if(!stabilityObject)throw fail('SHARED_E2E_RENDERER_STABILITY_REQUIRED');
+   const stability=await stabilityObject.json();
+   if(stability.schemaVersion!=='SHARED_RENDERER_STABILITY_RECEIPT_V1'||stability.rendererVersion!==proof.rendererVersion||stability.semanticSnapshotId!==proof.semanticSnapshotId||stability.scope!=='DEPLOYED_PRIVATE_BROWSER'||stability.status!=='PASS'||stability.sequential!==true||!Array.isArray(stability.measurements)||stability.measurements.length!==8||!stability.measurements.every((m,i)=>m.sequence===i+1&&m.groupSize===(i<3?3:5)&&m.pageCount===m.expectedPageCount&&m.passed===true&&m.pageCount>0&&m.browserLaunchFailures===0&&m.timeouts===0&&m.overflowFailures===0&&m.brokenImageFailures===0&&m.pageDriftFailures===0&&m.rendererErrors===0))throw fail('SHARED_E2E_RENDERER_STABILITY_REQUIRED');
+   const globalObject=await context.env.PRIVATE_REPORTS.get('qa/shared-report-e2e/v2/global-regression.json');
+   const global=globalObject?await globalObject.json():null;
+   if(global?.status!=='PASS'||global.scope!=='POST_LIVE_GLOBAL_REGRESSION'||global.privateProofDigest!==await digest(JSON.stringify(proof)))throw fail('SHARED_E2E_POST_LIVE_GLOBAL_REGRESSION_REQUIRED');
+   const admissionReceipt={schemaVersion:'PHI-OS-SHARED-REPORT-E2E-REFERENCE-v2',finalSharedAuthorityState:'PASS',sharedDeliveryAuthorityEligible:true,referenceMethod:proof.methodCode,referenceGenerationVersion:proof.generationVersion,referencePublicationVersion:proof.publicationVersion,referenceRendererVersion:proof.rendererVersion,rendererStabilityPass:true,generationReleaseProven:true,releasedMaterialProven:true,reopenProven:true,actualAccountGenerateReleasePass:true,libraryPass:true,differentSessionReopenPass:true,logoutVerified:true,sameImmutableSnapshot:true,sameImmutableRenderedMaterial:true,noProviderRegenerationOnReopen:true,noRendererRegenerationOnReopen:true,secondAccountIsolationPass:true,privateProofDigest:await digest(JSON.stringify(proof)),rendererStabilityDigest:await digest(JSON.stringify(stability)),admittedAt:new Date().toISOString()};
+   await save(context.env,proofKey(body.reportId),{...proof,state:'PASS',admissionReceipt});
+   return Response.json({ok:true,proof:{state:'PASS',admissionReceipt}},{headers});
+  }
+  if(accountHash===proof.accountIdHash)throw fail('SHARED_E2E_SECOND_ACCOUNT_REQUIRED');
+  // Only expected authorization denials count. Infrastructure errors cannot prove isolation.
+  let denied=false;
+  try{await adapter.open(context,body.reportId)}catch(error){denied=error.status===404||error.message==='REPORT_UNAVAILABLE';if(!denied)throw error;}
+  if(!denied)throw fail('SHARED_E2E_CROSS_ACCOUNT_OPEN_LEAK');
+  if((await adapter.list(context)).some(x=>x.reportId===body.reportId))throw fail('SHARED_E2E_CROSS_ACCOUNT_LIBRARY_LEAK');
+  let subjectDenied=false;
+  const subjectRow=await context.env.RUNTIME_DB.prepare('SELECT person_id FROM account_method_report_materials WHERE owner_account_id=? AND report_id=?').bind((await context.env.RUNTIME_DB.prepare('SELECT owner_account_id FROM account_method_report_materials WHERE report_id=?').bind(body.reportId).first())?.owner_account_id,body.reportId).first();
+  if(!subjectRow||await digest(subjectRow.person_id)!==proof.personIdHash)throw fail('SHARED_E2E_PROOF_TAMPERED');
+  try{await loadCanonicalPersonSubject(context.env,identity.userId,subjectRow.person_id)}catch(error){subjectDenied=error.code==='PERSON_NOT_FOUND'&&error.status===404;if(!subjectDenied)throw error;}
+  if(!subjectDenied)throw fail('SHARED_E2E_CROSS_ACCOUNT_SUBJECT_LEAK');
+  const updated={...proof,state:'ISOLATION_PROVEN_PENDING_RENDERER_STABILITY',crossAccountOpen:'DENIED',crossAccountLibraryLeak:0,crossAccountSubjectLeak:0,crossAccountMaterialLeak:0,releaseMetadataSurface:'AUTHORIZED_MATERIAL_OPEN_ADAPTER',secondAccountIsolationPass:true,secondAccountHash:accountHash,sharedDeliveryAuthorityEligible:false};
+  await save(context.env,proofKey(body.reportId),updated);
+  return Response.json({ok:true,proof:{state:updated.state,sharedDeliveryAuthorityEligible:false}},{headers});
+ }catch(error){return Response.json({ok:false,code:error.code||'SHARED_REPORT_E2E_PROOF_FAILED'},{status:error.status||409,headers});}
+}
diff --git a/functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js b/functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js
index a9de0265..ebf6443e 100644
--- a/functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js
+++ b/functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js
@@ -49,6 +49,7 @@ function batchPack(pack,ids){
   authorityDigest:pack.authorityDigest
  });
 }
+export async function zwrVfrPromptIdentity(){return sha256Stable({composerVersion:ZWR_VFR_FIVE_CALL_COMPOSER_VERSION,manuscriptVersion:ZWR_VFR_FIVE_CALL_MANUSCRIPT_VERSION,prompts:ZWR_VFR_FIVE_CALL_BATCHES.map(batchPrompt),responseSchema:'sections:rawManuscriptSections'});}
 export function planZwrFiveCallExperiment({pack}={}){
  if(pack?.schemaVersion!=='ZWR-VFR-R1-COMPACT-AUTHORING-PACK-v1')throw Error('ZWR_FIVE_CALL_COMPACT_PACK_REQUIRED');
  const {route,model}=modelRecord();
diff --git a/functions/report-delivery/shared-report-e2e-v2.js b/functions/report-delivery/shared-report-e2e-v2.js
deleted file mode 100644
index de00cb47..00000000
--- a/functions/report-delivery/shared-report-e2e-v2.js
+++ /dev/null
@@ -1,65 +0,0 @@
-import {sha256Stable,stableStringify} from '../interpretation-runtime/mir7-utils.js';
-import {createCustomerDeliverySnapshot} from '../personal-reading/narrative/report-section-snapshot.js';
-import {buildZwrVfrPagePlan,validateZwrVfrPagePlan,ZWR_VFR_PAGE_PLAN_VERSION} from '../personal-reading/visual-first/ziwei-vfr-page-plan.js';
-export const fail=(code,status=409)=>Object.assign(new Error(code),{code,status});
-const required=(value,code)=>{if(typeof value!=='string'||!value.trim())throw fail(code);return value;};
-const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/i.test(value);
-export function requireVfrAdmission(profile){
- const a=profile?.admission;
- if(profile?.methodId!=='ZWR'||a?.state!=='ACCEPTED'||a.rendererWired!==true||!hash(a.sourceAcceptanceDigest)||!hash(a.rendererAcceptanceDigest)||!hash(a.sourceResultDigest)||!hash(a.publicationIrDigest)||!hash(a.pagePlanDigest))throw fail('SHARED_E2E_VFR_ADMISSION_BLOCKED',503);
- // Shared delivery evidence never grants production activation.
-}
-export async function verifyVfrMaterial(opened,identity,profile,digest){
- const {candidate:c,row:r,html}=opened||{},s=c?.snapshot,v=s?.semanticContent,ir=v?.visualReportIr;
- if(c?.customerId!==identity.userId||r?.owner_account_id!==identity.userId)throw fail('SHARED_E2E_OWNER_MISMATCH',403);
- required(c.personId,'SHARED_E2E_CANONICAL_PERSON_REQUIRED');required(c.purchaseId,'SHARED_E2E_PURCHASE_REQUIRED');required(c.birthSourceRef,'SHARED_E2E_CANONICAL_SOURCE_REQUIRED');
- if(r.person_id!==c.personId||r.method_code!==profile.methodId||r.locale!==c.locale||!profile.locales.includes(c.locale)||c.scope!=='CONTROLLED_QA_ONLY')throw fail('SHARED_E2E_ACCOUNT_BINDING_MISMATCH');
- required(r.report_id,'SHARED_E2E_RELEASE_REQUIRED');required(r.released_at,'SHARED_E2E_RELEASE_REQUIRED');required(r.object_key,'SHARED_E2E_PRIVATE_MATERIAL_REQUIRED');
- if(c.schemaVersion!==profile.candidateSchemaVersion||c.generationSuccessor!==profile.compositionVersion||s?.methodId!==profile.methodId||s.locale!==c.locale||s.compositionVersion!==profile.compositionVersion||ir?.schemaVersion!==profile.publicationIrVersion||profile.pagePlanVersion!==ZWR_VFR_PAGE_PLAN_VERSION)throw fail('SHARED_E2E_VERSION_MISMATCH');
- if(s.immutable!==true||s.providerRegenerationOnReopen!==false||(await createCustomerDeliverySnapshot(s)).semanticSnapshotId!==s.semanticSnapshotId||r.snapshot_id!==s.semanticSnapshotId)throw fail('SHARED_E2E_SNAPSHOT_DIGEST_MISMATCH');
- const {publicationIrDigest,...seed}=ir;
- if(!hash(publicationIrDigest)||await sha256Stable(seed)!==publicationIrDigest||!hash(v.vfrDeepManuscriptDigest)||v.vfrDeepManuscriptDigest!==ir.sourceResultDigest||!hash(v.vfrCompactAuthoringPackDigest)||v.vfrCompactAuthoringPackDigest!==ir.authorityDigest)throw fail('SHARED_E2E_SOURCE_DIGEST_MISMATCH');
- if(ir.methodId!=='ZWR'||!Array.isArray(ir.sections)||ir.sections.length!==10||new Set(ir.sections.map(x=>x.sectionId)).size!==10||ir.sections.some((x,i)=>x.sectionId!==`S${String(i+2).padStart(2,'0')}`||!x.zhHans?.manuscript||!x.en?.manuscript||!Array.isArray(x.authorityRefs)||!x.authorityRefs.length))throw fail('SHARED_E2E_MANUSCRIPT_INCOMPLETE');
- if(profile.admission.sourceResultDigest!==ir.sourceResultDigest||profile.admission.publicationIrDigest!==publicationIrDigest)throw fail('SHARED_E2E_ACCEPTED_SOURCE_BINDING_MISMATCH');
- const pages=buildZwrVfrPagePlan({sections:ir.sections}),check=validateZwrVfrPagePlan({pages,sections:ir.sections,diagramIds:v.vfrDiagramData?.diagrams?.map(x=>x.id)||[]});
- if(!check.accepted||stableStringify(pages)!==stableStringify(v.vfrPagePlan)||c.physicalPageCount!==pages.length)throw fail('SHARED_E2E_PAGE_PLAN_MISMATCH');
- if(profile.admission.pagePlanDigest!==await sha256Stable(pages))throw fail('SHARED_E2E_ACCEPTED_PAGE_PLAN_MISMATCH');
- let receipt;try{receipt=JSON.parse(r.verifier_receipt)}catch{throw fail('SHARED_E2E_RENDER_RECEIPT_REQUIRED');}
- const outputDigest=await digest(html);
- if(typeof html!=='string'||!html.length||!hash(r.output_digest)||r.output_digest!==outputDigest||receipt?.passed!==true||receipt.semanticSnapshotId!==s.semanticSnapshotId||receipt.compositionVersion!==profile.compositionVersion||receipt.publicationIrDigest!==publicationIrDigest||receipt.sourceResultDigest!==ir.sourceResultDigest||receipt.pagePlanDigest!==await sha256Stable(pages)||receipt.pageCount!==pages.length||receipt.outputDigest!==outputDigest||receipt.brokenImages!==0||receipt.overflowCount!==0||receipt.errorCount!==0)throw fail('SHARED_E2E_RENDER_OR_OUTPUT_MISMATCH');
- return {reportId:r.report_id,methodId:s.methodId,compositionVersion:s.compositionVersion,semanticSnapshotId:s.semanticSnapshotId,publicationIrDigest,sourceResultDigest:ir.sourceResultDigest,pagePlanDigest:await sha256Stable(pages),pageCount:pages.length,outputDigest,personIdHash:await digest(c.personId),purchaseIdHash:await digest(c.purchaseId),canonicalSourceHash:await digest(c.birthSourceRef)};
-}
-// Dependencies are server-owned. No generator, renderer or provider dependency exists here.
-export function createSharedReportE2eProofV2({contract,authenticate,requireSameOrigin,digest,open,list}){
- return async context=>{
-  try{
-   if(context.request.method!=='POST')throw fail('METHOD_NOT_ALLOWED',405);
-   requireSameOrigin(context.request);
-   const identity=await authenticate(context);if(!identity?.userId)throw fail('ACCOUNT_REQUIRED',401);
-   if(context.env?.PHIOS_ENVIRONMENT!=='qa')throw fail('SHARED_E2E_QA_ONLY',403);
-   required(identity.sessionId,'SHARED_E2E_AUTHENTICATED_SESSION_REQUIRED');
-   const b=await context.request.json();
-   if(!b||!['open-released','reopen'].includes(b.action)||typeof b.reportId!=='string'||!b.reportId||Object.keys(b).some(k=>!['action','reportId'].includes(k)))throw fail('SHARED_E2E_ACTION_INVALID',400);
-   const profile=contract.profiles['ZWR:ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3'];requireVfrAdmission(profile);
-   const storage=context.env.PRIVATE_REPORTS;if(!storage?.get||!storage?.put)throw fail('SHARED_E2E_PRIVATE_STORAGE_REQUIRED',503);
-   const owner=await digest(identity.userId),session=await digest(identity.sessionId),key=`qa/shared-report-e2e-v2/${owner}/${b.reportId}.json`;
-   let first;
-   if(b.action==='reopen'){
-    const object=await storage.get(key);if(!object)throw fail('SHARED_E2E_FIRST_OPEN_REQUIRED',404);
-    first=await object.json();const {proofDigest,...seed}=first;
-    if(first.schemaVersion!=='PHI-OS-SHARED-REPORT-E2E-PROOF-v2'||first.state!=='FIRST_OPEN'||first.accountIdHash!==owner||first.reportId!==b.reportId||first.profileDigest!==await sha256Stable(profile)||proofDigest!==await sha256Stable(seed))throw fail('SHARED_E2E_FIRST_PROOF_INVALID');
-    if(!hash(first.sessionHash)||first.sessionHash===session)throw fail('SHARED_E2E_NEW_LOGIN_SESSION_REQUIRED');
-   }
-   // These existing account functions revalidate entitlement, canonical consent,
-   // active release, private candidate bytes and private HTML on every read.
-   const material=await verifyVfrMaterial(await open(context,b.reportId),identity,profile,digest);
-   if(material.reportId!==b.reportId)throw fail('SHARED_E2E_REPORT_ID_MISMATCH');
-   if(!(await list(context)).some(x=>x.reportId===b.reportId&&x.status==='RELEASED'))throw fail('SHARED_E2E_LIBRARY_RELEASE_REQUIRED');
-   if(first&&stableStringify(first.material)!==stableStringify(material))throw fail('SHARED_E2E_REOPEN_IMMUTABILITY_MISMATCH');
-   const proof={schemaVersion:'PHI-OS-SHARED-REPORT-E2E-PROOF-v2',state:first?'TWO_SESSION_READ_PASS':'FIRST_OPEN',reportId:b.reportId,accountIdHash:owner,sessionHash:session,profileDigest:await sha256Stable(profile),material,providerCalls:0,productionAdmissionGranted:false,sharedDeliveryAuthorityEligible:false};
-   proof.proofDigest=await sha256Stable(proof);
-   await storage.put(key,JSON.stringify(proof),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
-   return Response.json({ok:true,proof:{state:proof.state,proofDigest:proof.proofDigest,providerCalls:0,sharedDeliveryAuthorityEligible:false,productionActivated:false}});
-  }catch(e){return Response.json({ok:false,code:e.code||'SHARED_E2E_EVIDENCE_INVALID'},{status:e.status||409});}
- };
-}
diff --git a/functions/report-delivery/ziwei-vfr-r1-generation.js b/functions/report-delivery/ziwei-vfr-r1-generation.js
index 02ee7455..d764b20d 100644
--- a/functions/report-delivery/ziwei-vfr-r1-generation.js
+++ b/functions/report-delivery/ziwei-vfr-r1-generation.js
@@ -1,5 +1,9 @@
-import contract from '../../content/reports/shared-report-delivery-e2e-contract-v2.json' with { type: 'json' };
-import {requireVfrAdmission} from './shared-report-e2e-v2.js';
+import {cachedMethodDelivery,methodCacheIdentity} from './method-delivery-cache.js';
+import {requireZwrVfrProfile,requireZwrVfrGenerationAdmission} from './ziwei-vfr-profile-policy.js';
+import {planZwrFiveCallExperiment,zwrVfrPromptIdentity} from '../personal-reading/visual-first/ziwei-vfr-five-call-composer.js';
+import {assertVfrLiveAllowed} from '../personal-reading/visual-first/report-provider-budget.js';
+import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
+import {createCustomerDeliverySnapshot} from '../personal-reading/narrative/report-section-snapshot.js';
 import {generateZiweiProductionCandidate} from './ziwei-production-generation-v1.js';
 import {buildZwrVfrCompactAuthoringPack} from '../personal-reading/visual-first/ziwei-vfr-authoring-pack.js';
 import {composeZwrVfrProductionDeepManuscript} from '../personal-reading/visual-first/ziwei-vfr-production-deep-composer.js';
@@ -7,7 +11,8 @@ import {buildZwrVfrDeepPublicationIr} from '../personal-reading/visual-first/ziw
 import {buildZwrVfrDiagramData} from '../personal-reading/visual-first/ziwei-vfr-diagram-data.js';
 import {buildZwrVfrPagePlan,validateZwrVfrPagePlan} from '../personal-reading/visual-first/ziwei-vfr-page-plan.js';
 
-export const ZIWEI_VFR_R1_GENERATION_VERSION='ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3';
+import {ZIWEI_VFR_R1_GENERATION_VERSION} from './ziwei-vfr-r1-version.js';
+export {ZIWEI_VFR_R1_GENERATION_VERSION} from './ziwei-vfr-r1-version.js';
 
 function unavailable(code,details=null){
  const error=new Error(code);
@@ -18,7 +23,7 @@ function unavailable(code,details=null){
 }
 
 export async function generateZiweiVfrR1Candidate(context,selection,deps={}){
- requireVfrAdmission(contract.profiles['ZWR:'+ZIWEI_VFR_R1_GENERATION_VERSION]);
+ const profile=requireZwrVfrProfile(deps.methodProfile);
  const base=await generateZiweiProductionCandidate(context,selection,deps);
  const evidence=base.snapshot?.semanticContent?.evidence;
  if(!evidence)unavailable('ZWR_VFR_CANONICAL_EVIDENCE_REQUIRED');
@@ -28,11 +33,19 @@ export async function generateZiweiVfrR1Candidate(context,selection,deps={}){
   realityContext:selection?.targetContext||selection?.realityContext||null
  });
 
- const composed=await composeZwrVfrProductionDeepManuscript({
-  pack,
-  env:context?.env||{},
-  fetcher:deps.fetcher||globalThis.fetch
+ const plan=planZwrFiveCallExperiment({pack});
+ if(!plan.allowed)unavailable('ZWR_VFR_GENERATION_PLAN_BLOCKED');
+ const semanticKey=await methodCacheIdentity({schemaVersion:'METHOD_SEMANTIC_CACHE_KEY_V1',methodCode:profile.methodCode,productId:profile.productId,generationVersion:profile.generationVersion,profileVersion:profile.profileVersion,subjectId:base.personId,birthSourceRef:base.birthSourceRef,canonicalInputDigest:base.canonicalInputDigest,calculationDigest:await sha256Stable(evidence),authorityDigest:pack.authorityDigest,realityContext:selection?.targetContext||null,presentationMode:profile.presentationMode,locale:base.locale,promptIdentity:await zwrVfrPromptIdentity(),generationPlan:plan});
+ const semantic=await cachedMethodDelivery(context.env,{ownerAccountId:base.customerId,kind:'SEMANTIC',key:semanticKey,beforeClaim:async()=>{assertVfrLiveAllowed(context.env||{});if(!deps.fetcher||context.env.PHIOS_ENVIRONMENT!=='local')await requireZwrVfrGenerationAdmission(context.env);},
+  validate:async value=>{if(value.status!=='PASS'||value.repairedResult?.authorityDigest!==pack.authorityDigest||value.completeness?.status!=='PASS')unavailable('METHOD_SEMANTIC_CACHE_INVALID');},
+  produce:async()=>{
+   // Only a cache miss can cross the paid-provider gate. Rights and consent were
+   // rechecked by the canonical generator before this persistent lookup.
+   assertVfrLiveAllowed(context.env||{});
+   return composeZwrVfrProductionDeepManuscript({pack,env:context.env||{},fetcher:deps.fetcher||globalThis.fetch});
+  }
  });
+ const composed=semantic.value;
  if(composed.status!=='PASS')unavailable('ZWR_VFR_PRODUCTION_DEEP_COMPOSITION_UNAVAILABLE',{status:composed.status});
 
  const repairedResult=composed.repairedResult;
@@ -49,10 +62,15 @@ export async function generateZiweiVfrR1Candidate(context,selection,deps={}){
  return {
   ...base,
   schemaVersion:'ZWR-VFR-R1-AUTO-DEEP-CANDIDATE-v3',
-  snapshot:{
+  snapshot:await createCustomerDeliverySnapshot({
    ...base.snapshot,
+   createdAt:new Date(0).toISOString(),
+   claimIrVersion:profile.publicationIrVersion,
+   verifierVersion:profile.rendererContractVersion,
+   compositionVersion:ZIWEI_VFR_R1_GENERATION_VERSION,
    semanticContent:{
-    ...base.snapshot.semanticContent,
+    ...Object.fromEntries(Object.entries(base.snapshot.semanticContent).filter(([key])=>key!=='report')),
+    vfrLineage:{profileVersion:profile.profileVersion,rendererContractVersion:profile.rendererContractVersion,birthSourceRef:base.birthSourceRef,canonicalInputDigest:base.canonicalInputDigest,calculationDigest:await sha256Stable(evidence),pagePlanDigest:await sha256Stable(pages),semanticCacheKey:semanticKey},
     visualReportIr:reportIr,
     vfrCompactAuthoringPackDigest:pack.authorityDigest,
     vfrDeepManuscriptDigest:repairedResult.resultDigest,
@@ -60,7 +78,7 @@ export async function generateZiweiVfrR1Candidate(context,selection,deps={}){
     vfrPagePlan:pages,
     vfrPublicationFit:pageCheck.fitProfile
    }
-  },
+  }),
   generationSuccessor:ZIWEI_VFR_R1_GENERATION_VERSION,
   providerAuthority:'WRITING_ONLY_AUTOMATIC',
   naturalCompositionSummary:{
@@ -73,7 +91,8 @@ export async function generateZiweiVfrR1Candidate(context,selection,deps={}){
   visualFirst:true,
   physicalPageCount:pages.length,
   deterministicDiagramCount:15,
-  productionAdmissionGranted:false
+  productionAdmissionGranted:false,
+  productionAdmissionStatus:profile.releaseStatus
  };
 }
 export default Object.freeze({generateZiweiVfrR1Candidate,ZIWEI_VFR_R1_GENERATION_VERSION});
diff --git a/package.json b/package.json
index 59dcdd0c..ef42228c 100644
--- a/package.json
+++ b/package.json
@@ -2843,7 +2843,20 @@
     "build:profile:prd-w11r5": "node scripts/build-profile-personal-evidence-w11r3.mjs --w11r5",
     "check:pc-r1:w0": "node scripts/run-zero-cost-regression.mjs check:pc-r1:w0",
     "check:pc-r1:w1-w10": "node scripts/run-zero-cost-regression.mjs check:pc-r1:w1-w10",
-    "build:pc-r1:profile-demotion": "node scripts/build-pc-r1-profile-demotion.mjs"
+    "build:pc-r1:profile-demotion": "node scripts/build-pc-r1-profile-demotion.mjs",
+    "check:delivery-delta:will": "node scripts/run-zero-cost-regression.mjs check:delivery-delta:will",
+    "check:delivery-delta:financial": "node scripts/run-zero-cost-regression.mjs check:delivery-delta:financial",
+    "check:delivery-delta:human-design": "node scripts/run-zero-cost-regression.mjs check:delivery-delta:human-design",
+    "check:delivery-delta:ecr": "node scripts/run-zero-cost-regression.mjs check:delivery-delta:ecr",
+    "check:shared-report-delivery:v2-contract": "node scripts/run-zero-cost-regression.mjs check:shared-report-delivery:v2-contract",
+    "check:shared-report-e2e:final": "node scripts/run-zero-cost-regression.mjs check:shared-report-e2e:final",
+    "check:shared-report-e2e:readiness-v2": "node scripts/run-zero-cost-regression.mjs check:shared-report-e2e:readiness-v2",
+    "check:delivery-delta:astrology": "node scripts/run-zero-cost-regression.mjs check:delivery-delta:astrology",
+    "check:delivery-delta:cross": "node scripts/run-zero-cost-regression.mjs check:delivery-delta:cross",
+    "check:delivery-delta:ziwei": "node scripts/run-zero-cost-regression.mjs check:delivery-delta:ziwei",
+    "check:delivery-delta:numerology": "node scripts/run-zero-cost-regression.mjs check:delivery-delta:numerology",
+    "check:shared-report-delivery:v2-runtime": "node scripts/run-zero-cost-regression.mjs check:shared-report-delivery:v2-runtime",
+    "check:delivery-delta:profile": "node scripts/run-zero-cost-regression.mjs check:delivery-delta:profile"
   },
   "dependencies": {
     "@pdf-lib/fontkit": "^1.1.1",
@@ -2857,6 +2870,7 @@
     "linkedom": "^0.18.13",
     "pdfjs-dist": "6.2.108",
     "sharp": "0.35.2",
-    "wrangler": "^4.0.0"
+    "wrangler": "^4.0.0",
+    "@cloudflare/puppeteer": "^1.4.0"
   }
 }
diff --git a/scripts/build-zwr-vfr-human-review.mjs b/scripts/build-zwr-vfr-human-review.mjs
index e8cdb1b8..abd711f6 100644
--- a/scripts/build-zwr-vfr-human-review.mjs
+++ b/scripts/build-zwr-vfr-human-review.mjs
@@ -1,3 +1,4 @@
+import {ZWR_VFR_STYLES} from '../assets/customer-ui/js/personal-products/ziwei-vfr-r1-styles.js';
 import fs from 'node:fs';
 import {renderZwrVfrReview,ZWR_VFR_RENDERER_VERSION} from '../assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js';
 import {buildZwrVfrPagePlan,validateZwrVfrPagePlan,ZWR_VFR_PAGE_PLAN_VERSION,ZWR_VFR_FIT_PROFILE_VERSION} from '../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';
@@ -57,60 +58,7 @@ fs.writeFileSync(renderCachePath,JSON.stringify(renderCacheRecord,null,2)+'\n');
 if(pagePlan.length<50||pagePlan.length>80)throw Error('ZWR_VFR_PAGE_COUNT_OUTSIDE_BILINGUAL_RANGE');
 if(diagrams.diagramCount!==15)throw Error('ZWR_VFR_DIAGRAM_COUNT_DRIFT');
 
-const styles=`
-@page{size:A4;margin:0}
-*{box-sizing:border-box}
-html,body{margin:0;padding:0;background:#121715;color:#e8ddbd;font-family:Inter,"Segoe UI","Microsoft YaHei",sans-serif}
-.review-shell{max-width:1040px;margin:24px auto;padding:24px 28px;background:#1d2521;border:1px solid #5a513a}
-.review-shell button{font:inherit;padding:10px 18px}.review-shell code{color:#e9cf8a}
-.zv-page{position:relative;width:210mm;height:297mm;margin:14px auto;background:linear-gradient(145deg,#f8f3ea,#eee5d5);overflow:hidden;padding:18mm 16mm 18mm;break-after:page;page-break-after:always;--zv-accent:#6d4bc3;--zv-accent2:#c59647}
-.zv-page:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 18% 10%,color-mix(in srgb,var(--zv-accent) 22%,transparent),transparent 32%),radial-gradient(circle at 84% 18%,color-mix(in srgb,var(--zv-accent2) 22%,transparent),transparent 34%),linear-gradient(180deg,#fffdf8cc,#f5eee0cc);z-index:0}
-.zv-page>*{position:relative;z-index:1}
-.zv-static-page{padding:0;background:#0d1210}
-.zv-static{position:absolute!important;inset:0;width:100%;height:100%;object-fit:cover;z-index:1!important}
-.zv-body-bg{position:absolute!important;inset:0;width:100%;height:100%;object-fit:cover;opacity:.48;filter:saturate(1.18) contrast(1.04);z-index:0!important}
-.zv-body-motif{position:absolute!important;right:-4%;bottom:3%;width:48%;max-height:46%;object-fit:contain;opacity:.24;filter:drop-shadow(0 0 18px color-mix(in srgb,var(--zv-accent) 35%,transparent));z-index:0!important}
-.zv-master-art{position:absolute!important;inset:0;z-index:0!important;overflow:hidden}.zv-hero{width:100%;height:100%;object-fit:cover;opacity:.78;filter:saturate(1.15) contrast(1.04)}.zv-motif{position:absolute;right:1%;bottom:4%;width:46%;opacity:.3;filter:drop-shadow(0 0 22px color-mix(in srgb,var(--zv-accent) 45%,transparent))}
-.zv-chapter-art{position:absolute!important;inset:0;z-index:0!important;overflow:hidden;background:#f4eddf}.zv-chapter-hero{width:100%;height:100%;object-fit:cover;filter:saturate(1.05) contrast(1.02);opacity:1}.zv-chapter-art:after{content:"";position:absolute;left:0;right:0;bottom:0;height:34%;background:linear-gradient(180deg,transparent,#f6efe2b8 52%,#f6efe2ef 100%)}.zv-chapter-motif{position:absolute;right:3%;bottom:4%;width:42%;opacity:.14;filter:none}
-.zv-chapter-master{position:absolute;z-index:2;left:15mm;bottom:24mm;width:118mm;padding:10mm 11mm 9mm;background:#fffaf0e8;border:1px solid color-mix(in srgb,var(--zv-accent) 30%,#b9a06d);box-shadow:0 14px 30px #4d463120;color:#2d342e}.zv-chapter-kicker{font-size:9px;letter-spacing:3px;color:#7f714f}.zv-chapter-number{font:500 58px/1 Georgia;color:var(--zv-accent);margin:8px 0 2px}.zv-chapter-rule{width:64px;height:3px;background:linear-gradient(90deg,var(--zv-accent),var(--zv-accent2));margin:6px 0 14px}.zv-chapter-master h1{font:600 31px/1.2 Georgia,"Noto Serif SC",serif;margin:0;color:#2a302b}.zv-chapter-master h2{font:500 17px/1.3 Georgia,serif;margin:5px 0 15px;color:#665f50}.zv-chapter-purpose{max-width:94mm;border-left:3px solid var(--zv-accent2);padding-left:12px}.zv-chapter-purpose p{margin:3px 0;font-size:13.5px;line-height:1.5;color:#3d473e}.zv-chapter-purpose p[lang="en"]{font-size:11.5px;color:#6f7168}.zv-chapter-cue{margin-top:16px;display:flex;align-items:center;gap:8px;color:#766a4c}.zv-chapter-cue span{width:30px;height:30px;border:1px solid #bda16b;border-radius:50%;display:grid;place-items:center;font-size:10px}.zv-chapter-cue b{font-size:9px;letter-spacing:2px}
-.zv-language-reading{padding-top:9mm;color:#2e352f}.zv-language-head{display:grid;grid-template-columns:56px 1fr auto;align-items:end;gap:12px;margin-bottom:12px;border-bottom:1px solid color-mix(in srgb,var(--zv-accent) 38%,#b9a77d);padding-bottom:10px}.zv-language-head>span{font:34px Georgia;color:var(--zv-accent)}.zv-language-head small{display:block;font-size:10px;letter-spacing:2px;color:var(--zv-accent);font-weight:700}.zv-language-head h2{margin:2px 0 0;font:600 25px/1.2 Georgia,"Noto Serif SC",serif;color:#2b332c}.zv-language-head p{margin:3px 0 0;font-size:11px;color:#6a7168}.zv-language-head>b{font:18px Georgia;color:#9a7b3f}.zv-language-reading article{background:#fffdf7ee;border:1px solid color-mix(in srgb,var(--zv-accent) 28%,#b9a77d);padding:18px 20px;box-shadow:0 12px 28px color-mix(in srgb,var(--zv-accent) 10%,transparent)}.zv-language-reading article p{margin:0 0 13px;color:#303830}.zv-language-reading.is-zh article p{font-size:14px;line-height:1.78}.zv-language-reading.is-en article p{font-size:12.4px;line-height:1.62}.zv-language-reading article p:last-child{margin-bottom:0}
-.zv-axis-compact{position:relative;display:grid;grid-template-columns:1fr 130px 1fr;align-items:center;gap:18px;min-height:110mm;padding:10mm 8mm}.zv-axis-line{position:absolute;left:12%;right:12%;top:50%;height:3px;background:linear-gradient(90deg,var(--zv-accent),#c8aa68,var(--zv-accent2));opacity:.72}.zv-axis-seal{position:relative;z-index:2;padding:16px 18px;border:2px solid var(--pal);background:linear-gradient(145deg,color-mix(in srgb,var(--pal) 17%,#fffdf5),#fff9ec);box-shadow:0 12px 24px color-mix(in srgb,var(--pal) 14%,transparent)}.zv-axis-seal>span{font-size:12px;color:#5e655d}.zv-axis-seal strong{display:block;font:600 24px/1.2 Georgia,"Noto Serif SC",serif;margin:7px 0;color:#2c342d}.zv-axis-seal strong small{display:block;font-size:10px;color:#687068}.zv-axis-seal div{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.zv-axis-seal div b{padding:6px 8px;border-left:4px solid var(--pal);background:#ffffffc9;font-size:11px;color:#313831}.zv-axis-bridge{position:relative;z-index:3;width:124px;height:124px;border-radius:50%;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;place-self:center;background:radial-gradient(circle,#2d4035,#18231e);border:3px solid #c7a85f;box-shadow:0 0 0 9px #c7a85f22,0 16px 30px #0003;color:#f4d58a}.zv-axis-bridge span{font:28px Georgia;text-align:center}.zv-axis-bridge i{font-style:normal;font-size:21px;color:#a8c9bb}.zv-axis-bridge small,.zv-axis-bridge em{grid-column:1/-1;display:block;text-align:center;font-style:normal;font-size:8px;color:#eee5cf;margin-top:-10px}
-.zv-tx-focus{min-height:105mm;display:grid;place-content:center;gap:14px}.zv-tx-focus article{display:grid;grid-template-columns:120px 110px 1fr;align-items:center;gap:16px;padding:16px 18px;border-left:8px solid var(--layer);background:linear-gradient(90deg,color-mix(in srgb,var(--layer) 14%,#fffaf0),#fffdf8);box-shadow:0 12px 26px color-mix(in srgb,var(--layer) 12%,transparent)}.zv-tx-focus-layer b,.zv-tx-focus-layer small{display:block}.zv-tx-focus-layer b{font-size:14px;color:#303730}.zv-tx-focus-layer small{font-size:10px;color:#687068}.zv-tx-focus-orb{width:94px;height:94px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--tx) 18%,#fff7df);border:3px solid var(--tx);box-shadow:0 0 0 8px color-mix(in srgb,var(--tx) 10%,transparent)}.zv-tx-focus-orb span{font-size:21px;font-weight:800;color:var(--tx);text-align:center}.zv-tx-focus-orb small{display:block;font-size:9px;color:#666d65}.zv-tx-focus-target strong,.zv-tx-focus-target em{display:block;font-style:normal}.zv-tx-focus-target strong{font:600 23px Georgia,"Noto Serif SC",serif;color:#2c342d}.zv-tx-focus-target strong small,.zv-tx-focus-target em small{display:block;font-size:10px;color:#687068}.zv-tx-focus-target em{font-size:14px;color:#625f55;margin-top:6px}.zv-tx-focus>p{text-align:center;font-size:11px;color:#6b7169}.zv-tx-focus>p small{display:block;font-size:9px}
-
-.zv-page header,.zv-page footer{position:absolute;left:16mm;right:16mm;display:flex;justify-content:space-between;align-items:center;font-size:10px;letter-spacing:1.5px;color:#b7aa83}
-.zv-page header{top:9mm}.zv-page footer{bottom:8mm;padding-top:8px;border-top:1px solid #796d4d66}.zv-page main{height:100%;padding-top:12mm;padding-bottom:12mm}
-.zv-front{height:100%;display:grid;place-content:center;text-align:center}.zv-front h1{font:500 36px Georgia,"Noto Serif SC",serif;letter-spacing:1px}.zv-front p{color:#b7aa83}
-.zv-master{position:relative;margin-top:8mm;padding:12mm;background:linear-gradient(145deg,#fffdf2e8,color-mix(in srgb,var(--zv-accent) 10%,#fffdf2e8));border:1px solid color-mix(in srgb,var(--zv-accent) 40%,#c3a66d);box-shadow:0 16px 34px #54416824,inset 0 0 0 1px #ffffffaa;color:#2b302b;backdrop-filter:blur(3px)}.zv-sec{font:44px Georgia;color:#9a7b3f}.zv-master h1{font:600 32px/1.35 Georgia,"Noto Serif SC",serif;margin:10px 0 3px;color:#2a302b}.zv-master h2{font-size:17px;font-weight:500;color:#6e6a59;margin:0 0 18px}.zv-master>p{font-size:14px;line-height:1.65;margin:5px 0;color:#4a5148}
-.zv-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}.zv-insights article{border-top:4px solid var(--zv-accent);padding:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--zv-accent) 9%,#fffdf7),#fffdf7dd);box-shadow:0 8px 18px color-mix(in srgb,var(--zv-accent) 14%,transparent)}.zv-insights article>b{font:22px Georgia;color:#9a7b3f}.zv-insights h3{margin:7px 0;font-size:14px;color:#2f352f}.zv-insights p{font-size:11.5px;line-height:1.5;color:#424940}.zv-insights small{display:block;font-size:10px;line-height:1.45;color:#727567}
-.zv-master-deep{margin-top:5mm;padding:9mm}.zv-master-deep .zv-sec{font-size:34px}.zv-master-deep h1{font-size:27px}.zv-master-deep h2{font-size:15px;margin-bottom:8px}.zv-master-deep .zv-purpose{font-size:11.5px;line-height:1.45}.zv-master-reading{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.zv-master-reading article{padding:12px 14px;background:linear-gradient(145deg,#fffdf7e6,color-mix(in srgb,var(--zv-accent) 9%,#fffdf7));border-top:3px solid var(--zv-accent);box-shadow:0 8px 18px color-mix(in srgb,var(--zv-accent) 12%,transparent)}.zv-master-reading p{font-size:12.2px;line-height:1.6;margin:0 0 9px;color:#303830;font-weight:450}.zv-master-reading article[lang="zh-Hans"] p{font-size:13px;line-height:1.7}.zv-master-reading.is-stacked{grid-template-columns:1fr;gap:8px}.zv-master-reading.is-stacked article{padding:10px 14px}.zv-master-reading.is-stacked article[lang="zh-Hans"] p{font-size:13.2px;line-height:1.68}.zv-master-reading.is-stacked article[lang="en"] p{font-size:11.8px;line-height:1.5}
-.zv-reading-head{padding-top:8mm;margin-bottom:8px;display:grid;grid-template-columns:auto 1fr;column-gap:10px;align-items:end}.zv-reading-head>span{grid-row:1/3;font:34px Georgia;color:var(--zv-accent)}.zv-reading-head h2{margin:0;font:600 24px/1.2 Georgia,"Noto Serif SC",serif;color:#2f352f}.zv-reading-head small{font-size:12.5px;color:#5d635b;font-weight:500}
-.zv-copy-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding-top:2mm}.zv-copy-grid article{border:1px solid color-mix(in srgb,var(--zv-accent) 32%,#a8956f);padding:15px 16px;background:linear-gradient(145deg,#fffdf7ee,color-mix(in srgb,var(--zv-accent) 7%,#fffdf7));box-shadow:0 12px 28px color-mix(in srgb,var(--zv-accent) 12%,transparent)}.zv-copy-grid h3{margin:0 0 9px;color:var(--zv-accent);font-size:14.5px}.zv-copy-grid p{font-size:12.2px;line-height:1.58;margin:0 0 10px;color:#303730}.zv-copy-grid article[lang="zh-Hans"] p{font-size:13.2px;line-height:1.72}.zv-reading-grid article{min-height:182mm}.zv-reading-grid.is-stacked{grid-template-columns:1fr;gap:10px}.zv-reading-grid.is-stacked article{min-height:0;padding:13px 18px}.zv-reading-grid.is-stacked article[lang="zh-Hans"]{border-top:4px solid var(--zv-accent)}.zv-reading-grid.is-stacked article[lang="en"]{border-top:2px solid color-mix(in srgb,var(--zv-accent2) 70%,#b99a61)}.zv-reading-grid.is-stacked article[lang="zh-Hans"] p{font-size:13.4px;line-height:1.68}.zv-reading-grid.is-stacked article[lang="en"] p{font-size:11.9px;line-height:1.52}.zv-reading-grid.is-stacked h3{margin-bottom:6px}
-.zv-diagram{margin:6mm 0 0;border:1px solid color-mix(in srgb,var(--zv-accent) 42%,#b49c6a);background:linear-gradient(145deg,#fffdf8e8,color-mix(in srgb,var(--zv-accent) 8%,#fffdf8));padding:18px;color:#2d332d;box-shadow:0 14px 30px color-mix(in srgb,var(--zv-accent) 16%,transparent),inset 0 0 0 1px #fff}.zv-diagram>figcaption{display:flex;gap:12px;align-items:baseline;margin-bottom:14px}.zv-diagram>figcaption b{font:26px Georgia;color:var(--zv-accent)}.zv-diagram>figcaption span{font-size:15px;color:#555d55;font-weight:600}
-.zv-ziwei-board{position:relative;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:7px;min-height:198mm;padding:4px}.zv-ziwei-board:before{content:"";position:absolute;inset:22%;border:1px solid color-mix(in srgb,var(--zv-accent) 40%,#b99557);transform:rotate(45deg);opacity:.35}.zv-chart-core{grid-row:2/4;grid-column:2/4;display:grid;place-content:center;text-align:center;z-index:2;border:1px solid #b9a06f;background:radial-gradient(circle at 50% 40%,#fff9e7,#e7dcc5);box-shadow:inset 0 0 0 7px #ffffff88,0 14px 34px #5d4b2c22}.zv-chart-core span{font-size:13px;letter-spacing:4px;color:#886b33}.zv-chart-core strong{font:600 28px Georgia,"Noto Serif SC",serif;color:#283229;margin:8px 0}.zv-chart-core small{font-size:11px;color:#64695f}.zv-chart-core div{display:flex;justify-content:center;align-items:center;gap:14px;margin-top:15px}.zv-chart-core div b{font:22px Georgia;color:var(--zv-accent)}.zv-chart-core div i{font-style:normal;color:#a1844c}.zv-ziwei-board .zv-palace{position:relative;min-height:0;padding:9px 10px}.zv-ziwei-board .zv-palace i{position:absolute;right:6px;top:6px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:var(--pal);color:#fff;font-style:normal;font-weight:800}
-.zv-axis-map{position:relative;min-height:190mm;display:grid;grid-template-columns:1fr 160px 1fr;align-items:center;gap:20px;padding:20mm 8mm}.zv-axis-map:before{content:"";position:absolute;left:12%;right:12%;top:50%;height:2px;background:linear-gradient(90deg,transparent,var(--zv-accent),var(--zv-accent2),transparent)}.zv-axis-node{position:relative;z-index:2;padding:20px;border:1px solid color-mix(in srgb,var(--pal) 60%,#9a8357);background:radial-gradient(circle at top,color-mix(in srgb,var(--pal) 22%,#fffdf5),#fff8e9);box-shadow:0 18px 34px color-mix(in srgb,var(--pal) 18%,transparent)}.zv-axis-node>span{font-size:12px;color:#63695f}.zv-axis-node strong{display:block;font:600 25px Georgia,"Noto Serif SC",serif;color:#263027;margin:8px 0}.zv-axis-node strong small{display:block;font-size:11px;color:#626a61}.zv-axis-node div{display:grid;gap:7px;margin-top:14px}.zv-axis-node div b{padding:7px 9px;border-left:4px solid var(--pal);background:#ffffffb8;color:#303830;font-size:12px}.zv-axis-core{position:relative;z-index:3;width:150px;height:150px;border-radius:50%;display:grid;place-content:center;text-align:center;background:radial-gradient(circle,#2c3c32,#17231d);border:2px solid #c3a15f;box-shadow:0 0 0 9px #c3a15f22,0 16px 34px #0003}.zv-axis-core span{font:30px Georgia;color:#f2d18b}.zv-axis-core i{font-style:normal;font-size:26px;color:#a8c6ba}.zv-axis-core small,.zv-axis-core em{display:block;font-style:normal;font-size:9px;color:#eee7d5;margin-top:5px}
-.zv-network-shell{position:relative;min-height:185mm;padding-top:8mm}.zv-network-kicker{text-align:center;font-size:11px;letter-spacing:3px;color:#7d6840}.zv-network-svg .zv-line.is-primary{stroke:var(--zv-accent);stroke-width:4;opacity:.9}.zv-network-svg .zv-line.is-secondary{stroke:#b9a677;stroke-width:1.4;opacity:.35}.zv-network-svg g.is-focus .zv-node{stroke:#f4cf7c;stroke-width:6;filter:drop-shadow(0 0 16px color-mix(in srgb,var(--zv-accent) 55%,transparent))}
-.zv-star-atlas{position:relative;min-height:198mm}.zv-star-atlas:before,.zv-star-atlas:after{content:"";position:absolute;left:50%;top:50%;border:1px solid #aa946655;border-radius:50%;transform:translate(-50%,-50%)}.zv-star-atlas:before{width:78%;height:78%}.zv-star-atlas:after{width:52%;height:52%}.zv-star-atlas-core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:145px;height:145px;border-radius:50%;display:grid;place-content:center;text-align:center;background:radial-gradient(circle,#2b3a31,#18231e);border:2px solid #bea15f;color:#f7edd2;z-index:3}.zv-star-atlas-core span{font-size:14px}.zv-star-atlas-core strong{font:22px Georgia;margin:6px 0}.zv-star-atlas-core small{font-size:9px;color:#c7bea8}.zv-star-orb{position:absolute;transform:translate(-50%,-50%);width:116px;min-height:72px;padding:9px;border:1px solid color-mix(in srgb,var(--pal) 55%,#aa9365);border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--pal) 22%,#fffdf5),#fffaf0);text-align:center;box-shadow:0 8px 18px color-mix(in srgb,var(--pal) 15%,transparent)}.zv-star-orb b,.zv-star-orb span,.zv-star-orb em{display:block;font-style:normal}.zv-star-orb b{font-size:12px;color:#2e362f}.zv-star-orb b small,.zv-star-orb span small{display:block;font-size:9px;color:#646a62}.zv-star-orb span{font-size:10px;color:#4e574f}.zv-star-orb em{font-size:9px;color:#8a6a32;margin-top:3px}
-.zv-tx-orbits{display:grid;gap:13px;padding-top:10mm}.zv-tx-track{border-left:7px solid var(--layer);background:linear-gradient(90deg,color-mix(in srgb,var(--layer) 15%,#fffaf0),#fffdf7);padding:12px 14px;box-shadow:0 9px 20px color-mix(in srgb,var(--layer) 10%,transparent)}.zv-tx-track>header{display:flex;justify-content:space-between;align-items:center}.zv-tx-track>header b{font-size:15px;color:#2f3630}.zv-tx-track>header b small{margin-left:6px;font-size:10px;color:#60675f}.zv-tx-track>header span{font:20px Georgia;color:#9a7b3f}.zv-tx-track-line{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:10px}.zv-tx-track-line:before{content:"";position:absolute;left:2%;right:2%;top:12px;height:2px;background:var(--layer);opacity:.35}.zv-tx-track-line article{position:relative;padding:24px 9px 9px;border-top:4px solid var(--tx);background:#fffdf7;text-align:center;box-shadow:0 5px 13px #00000012}.zv-tx-track-line article i{position:absolute;width:14px;height:14px;border-radius:50%;background:var(--tx);top:5px;left:50%;transform:translateX(-50%);box-shadow:0 0 0 5px color-mix(in srgb,var(--tx) 18%,transparent)}.zv-tx-track-line article strong,.zv-tx-track-line article em,.zv-tx-track-line article small{display:block;font-style:normal;color:#303730}.zv-tx-track-line article strong{font-size:12px}.zv-tx-track-line article strong small,.zv-tx-track-line article em small,.zv-tx-track-line article small small{font-size:9px;color:#686f67}.zv-tx-track-line article em{font-size:15px;color:var(--tx);font-weight:800;margin:5px 0}.zv-tx-track-line>p{grid-column:1/-1;text-align:center;color:#9b9485}
-.zv-palace-orbit{position:relative;min-height:196mm;overflow:hidden}.zv-orbit-ring{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);border:1px solid #a58e6055;border-radius:50%}.zv-orbit-ring.outer{width:76%;height:68%}.zv-orbit-ring.inner{width:48%;height:42%}.zv-orbit-core{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);width:155px;height:155px;border-radius:50%;display:grid;place-content:center;text-align:center;background:radial-gradient(circle,color-mix(in srgb,var(--pal) 30%,#fff7dd),#1d2922);border:3px solid var(--pal);box-shadow:0 0 0 10px color-mix(in srgb,var(--pal) 15%,transparent),0 18px 35px #0003;color:#fff}.zv-orbit-core small{font-size:10px;color:#dcd3bd}.zv-orbit-core strong{font:600 25px Georgia,"Noto Serif SC",serif;margin:7px 0}.zv-orbit-core strong small{display:block;font-size:10px;color:#ece2cb}.zv-orbit-core em{font-style:normal;font-size:11px;color:#f0d08c}.zv-orbit-palace{position:absolute;transform:translate(-50%,-50%);width:112px;min-height:58px;border-radius:999px;display:grid;place-content:center;text-align:center;background:color-mix(in srgb,var(--pal) 18%,#fffaf0);border:2px solid var(--pal);box-shadow:0 7px 16px color-mix(in srgb,var(--pal) 16%,transparent)}.zv-orbit-palace b{font-size:12px;color:#303730}.zv-orbit-palace b small{display:block;font-size:9px;color:#666d65}.zv-orbit-stars{position:absolute;left:5%;right:5%;bottom:9%;display:flex;flex-wrap:wrap;justify-content:center;gap:7px}.zv-orbit-stars span{padding:7px 10px;background:#fffaf0;border-left:4px solid var(--pal);font-size:11px;font-weight:700;color:#303730}.zv-orbit-stars span small,.zv-orbit-stars em{display:block;font-size:8.5px;font-style:normal;color:#666d65}.zv-orbit-tx{position:absolute;left:10%;right:10%;top:5%;display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.zv-orbit-tx span{padding:6px 9px;border-radius:999px;background:color-mix(in srgb,var(--tx) 18%,#fff);border:1px solid var(--tx);color:#363d36;font-size:10px;font-weight:700}.zv-orbit-tx small{display:inline;font-size:8px}
-.zv-nav-wheel{position:relative;min-height:195mm}.zv-nav-wheel:before{content:"";position:absolute;left:50%;top:50%;width:70%;height:70%;border:1px solid #a58d5c55;border-radius:50%;transform:translate(-50%,-50%)}.zv-nav-core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:155px;height:155px;border-radius:50%;display:grid;place-content:center;text-align:center;background:radial-gradient(circle,#33483b,#17231d);border:2px solid #c4a25e;color:#f6ecd1}.zv-nav-core span{font:600 23px Georgia,"Noto Serif SC",serif}.zv-nav-core strong{font:14px Georgia;margin-top:8px}.zv-nav-wheel>article{position:absolute;transform:translate(-50%,-50%);width:145px;min-height:82px;padding:10px;border:1px solid color-mix(in srgb,var(--zv-accent) 35%,#9d875c);background:linear-gradient(145deg,#fffdf6,color-mix(in srgb,var(--zv-accent) 8%,#fffdf6));text-align:center;box-shadow:0 8px 18px #00000015}.zv-nav-wheel>article small,.zv-nav-wheel>article b,.zv-nav-wheel>article em{display:block}.zv-nav-wheel>article small{font-size:11px;color:var(--zv-accent);font-weight:800}.zv-nav-wheel>article small i{display:block;font-size:8px;font-style:normal;color:#6a7068}.zv-nav-wheel>article b{font-size:12px;color:#303730;margin:6px 0}.zv-nav-wheel>article em{font-size:9px;font-style:normal;color:#666d65}
-
-.zv-diagram-composite{display:grid;grid-template-rows:1fr 1fr;gap:10px;padding-top:3mm;height:100%}.zv-diagram-composite .zv-diagram{margin:0;padding:11px;min-height:0;overflow:hidden}.zv-diagram.is-compact>figcaption{margin-bottom:7px}.zv-diagram.is-compact>figcaption b{font-size:19px}.zv-diagram.is-compact>figcaption span{font-size:11px}.zv-diagram.is-compact .zv-axis-compact{min-height:72mm;padding:3mm 5mm;grid-template-columns:1fr 82px 1fr;gap:8px}.zv-diagram.is-compact .zv-axis-bridge{width:78px;height:78px}.zv-diagram.is-compact .zv-axis-bridge span{font-size:18px}.zv-diagram.is-compact .zv-axis-bridge i{font-size:14px}.zv-diagram.is-compact .zv-axis-bridge small,.zv-diagram.is-compact .zv-axis-bridge em{font-size:5.8px}.zv-diagram.is-compact .zv-axis-seal{padding:7px 9px}.zv-diagram.is-compact .zv-axis-seal strong{font-size:15px;margin:3px 0}.zv-diagram.is-compact .zv-axis-seal div{gap:3px;margin-top:5px}.zv-diagram.is-compact .zv-axis-seal div b{font-size:8px;padding:3px 5px}.zv-diagram.is-compact .zv-network-shell{min-height:75mm;padding-top:1mm}.zv-diagram.is-compact .zv-network-kicker{font-size:8px}.zv-diagram.is-compact .zv-network-svg{max-height:68mm}.zv-diagram.is-compact .zv-svg text{font-size:12px}.zv-diagram.is-compact .zv-svg text.en{font-size:8px}.zv-diagram.is-compact .zv-palace-orbit{min-height:76mm}.zv-diagram.is-compact .zv-orbit-core{width:92px;height:92px}.zv-diagram.is-compact .zv-orbit-core strong{font-size:17px}.zv-diagram.is-compact .zv-orbit-core small,.zv-diagram.is-compact .zv-orbit-core strong small,.zv-diagram.is-compact .zv-orbit-core em{font-size:7.5px}.zv-diagram.is-compact .zv-orbit-palace{width:78px;min-height:38px}.zv-diagram.is-compact .zv-orbit-palace b{font-size:9px}.zv-diagram.is-compact .zv-orbit-palace b small{font-size:7px}.zv-diagram.is-compact .zv-orbit-stars{bottom:3%;gap:3px}.zv-diagram.is-compact .zv-orbit-stars span{font-size:8px;padding:3px 5px}.zv-diagram.is-compact .zv-orbit-stars span small,.zv-diagram.is-compact .zv-orbit-stars em{font-size:6.5px}.zv-diagram.is-compact .zv-orbit-tx{top:1%;gap:3px}.zv-diagram.is-compact .zv-orbit-tx span{font-size:7.5px;padding:3px 5px}.zv-diagram.is-compact .zv-tx-orbits{gap:4px;padding-top:1mm}.zv-diagram.is-compact .zv-tx-track{padding:6px 8px;border-left-width:5px}.zv-diagram.is-compact .zv-tx-track>header b{font-size:11px}.zv-diagram.is-compact .zv-tx-track>header span{font-size:14px}.zv-diagram.is-compact .zv-tx-track-line{gap:4px;margin-top:4px}.zv-diagram.is-compact .zv-tx-track-line article{padding:15px 4px 5px}.zv-diagram.is-compact .zv-tx-track-line article i{width:9px;height:9px;top:4px}.zv-diagram.is-compact .zv-tx-track-line article strong{font-size:9px}.zv-diagram.is-compact .zv-tx-track-line article em{font-size:11px;margin:2px 0}.zv-diagram.is-compact .zv-tx-track-line article strong small,.zv-diagram.is-compact .zv-tx-track-line article em small,.zv-diagram.is-compact .zv-tx-track-line article small small{font-size:6.5px}.zv-diagram.is-compact .zv-timing{gap:4px}.zv-diagram.is-compact .zv-time-layer{grid-template-columns:28px 1fr;gap:7px;padding:7px 9px}.zv-diagram.is-compact .zv-time-layer>span{font-size:15px}.zv-diagram.is-compact .zv-time-layer b,.zv-diagram.is-compact .zv-time-layer strong{font-size:10px}.zv-diagram.is-compact .zv-time-layer b small,.zv-diagram.is-compact .zv-time-layer strong small{font-size:7px}.zv-diagram.is-compact .zv-time-layer ul{gap:3px 6px;margin-top:5px}.zv-diagram.is-compact .zv-time-layer li{font-size:8px}.zv-diagram.is-compact .zv-time-layer li small{font-size:6.5px}.zv-diagram.is-compact .zv-current-tx{margin-top:3px}.zv-diagram.is-compact .zv-current-tx h4{font-size:10px;margin:3px 0}
-
-.zv-palace-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.zv-palace{min-height:94px;border:1px solid color-mix(in srgb,var(--pal) 58%,#a99572);padding:10px;background:linear-gradient(145deg,color-mix(in srgb,var(--pal) 18%,#fffdf7),#fffdf7);box-shadow:inset 4px 0 0 var(--pal),0 5px 12px color-mix(in srgb,var(--pal) 12%,transparent);color:#2b302b}.zv-palace.is-life{outline:2px solid #c09f59}.zv-palace.is-body{box-shadow:inset 0 0 0 2px #667b6e}.zv-palace .idx,.zv-palace em{display:block;color:#5f665f;font-style:normal;font-size:11px}.zv-palace b{display:block;margin:4px 0;font-size:16px;color:#283028}.zv-palace b small{display:block;font-size:11px;font-weight:500;color:#5c655d}.zv-palace p{font-size:11.6px;line-height:1.45;color:#343b34;font-weight:500}
-.zv-axis{display:grid;grid-template-columns:1fr 70px 1fr;align-items:center;gap:10px;padding:28mm 10mm}.zv-arrow{text-align:center;font-size:36px;color:#b99c62}
-.zv-card{border:1px solid #766b50;padding:16px;background:linear-gradient(145deg,#17211c,#223028);min-height:88px;color:#f7f0dc;box-shadow:0 10px 22px #00000024}.zv-card small{display:block;color:#d5cdb7;font-size:11px}.zv-card b{display:block;font-size:21px;margin:8px 0;color:#fff8e8}.zv-card p{font-size:13px;line-height:1.5;color:#ece3cb}
-.zv-svg{width:100%;height:auto;max-height:155mm}.zv-line{stroke:#a88c57;stroke-width:1.5}.zv-node{fill:var(--pal);fill-opacity:.88;stroke:#fff8e7;stroke-width:3;filter:drop-shadow(0 3px 8px #3d314044)}.zv-center{fill:#2b392f;stroke:#bda46d;stroke-width:2}.zv-svg text{fill:#fffdf5;font-size:14px;font-weight:700}.zv-svg text.en{font-size:10.5px;font-weight:600;opacity:1}
-.zv-star-list,.zv-star-grid,.zv-domains{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.zv-star-grid .zv-card{min-height:72px;padding:11px}.zv-star-grid .zv-card b small,.zv-card b small{display:block;font-size:11px;font-weight:500;color:#d8d2bd;margin-top:2px}.zv-star-cloud{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.zv-star-cloud span{border:1px solid #665b43;padding:10px 12px;font-size:13px;font-weight:650}.zv-star-cloud small{display:block;color:#596159;font-size:10.5px;font-weight:500}
-.zv-flow-sparse{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18mm}.zv-tx-card{min-height:70mm;border:1px solid color-mix(in srgb,var(--tx) 55%,#a38e65);background:linear-gradient(160deg,color-mix(in srgb,var(--tx) 18%,#fffdf7),#fffdf7);padding:16px;display:grid;grid-template-columns:36px 1fr;gap:10px;align-items:start;box-shadow:inset 0 6px 0 var(--tx),0 12px 24px color-mix(in srgb,var(--tx) 14%,transparent)}.zv-tx-card>span{font:26px Georgia;color:#9a7b3f}.zv-tx-card b,.zv-tx-card strong,.zv-tx-card em,.zv-tx-card small{display:block;margin:7px 0;color:#343a34}.zv-tx-card b small,.zv-tx-card strong small,.zv-tx-card em small,.zv-tx-card small small{display:block;font-size:9px;color:#777b70}.zv-tx-card em{font-style:normal;color:#8a6c39;font-size:18px}
-.zv-flow,.zv-timing{display:grid;gap:8px}.zv-flow-row{display:grid;grid-template-columns:34px 105px 1fr 105px 120px;align-items:center;border-left:5px solid var(--tx);border-bottom:1px solid #8e806455;padding:9px 10px;background:linear-gradient(90deg,color-mix(in srgb,var(--tx) 10%,#fff),#fff0)}.zv-flow-row{font-size:12px}.zv-flow-row b small,.zv-flow-row strong small,.zv-flow-row em small,.zv-flow-row small small{display:block;font-size:10.5px;font-weight:500;color:#5e655d}.zv-flow-row em{font-style:normal;color:#7c5c24;font-weight:700}.zv-flow-row small{color:#5e655d}
-.zv-focus{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.zv-focus-band{grid-column:1/-1;margin-top:8px}.zv-focus-band h4{margin:4px 0 9px;color:#5c492a;font-size:14px;font-weight:700}.zv-star-cloud{display:flex;flex-wrap:wrap;gap:8px}.zv-star-cloud span{border:1px solid color-mix(in srgb,var(--pal) 55%,#9a8d6d);background:linear-gradient(145deg,color-mix(in srgb,var(--pal) 15%,#fffdf6),#fffdf6);box-shadow:inset 3px 0 0 var(--pal);padding:8px 10px;color:#333a33}.zv-star-cloud em{display:block;font-style:normal;font-size:10.5px;color:#596159;font-weight:500}.zv-rel-tags{display:flex;flex-wrap:wrap;gap:7px}.zv-rel-tags span{padding:7px 10px;border:1px solid #9d855f;background:#fff8e9;font-size:11.5px;font-weight:600;color:#343a34}
-.zv-time-layer{display:grid;grid-template-columns:42px 1fr;gap:12px;border-left:6px solid var(--layer);padding:14px 16px;background:linear-gradient(90deg,color-mix(in srgb,var(--layer) 14%,#fffdf7),#fffdf7cc);box-shadow:0 8px 20px color-mix(in srgb,var(--layer) 10%,transparent)}.zv-time-layer.is-focus{border-left-width:9px;border-color:var(--layer);background:linear-gradient(90deg,color-mix(in srgb,var(--layer) 24%,#fff7df),#fff7df);box-shadow:0 10px 28px color-mix(in srgb,var(--layer) 18%,transparent)}.zv-time-layer>span{font:22px Georgia;color:#8a6a30}.zv-time-layer b,.zv-time-layer strong{display:block;color:#283028;font-size:14px}.zv-time-layer b small,.zv-time-layer strong small{display:inline;margin-left:6px;font-size:11px;color:#5e655d}.zv-time-layer ul{display:grid;grid-template-columns:repeat(2,1fr);gap:7px 12px;margin:10px 0 0;padding:0;list-style:none}.zv-time-layer li{font-size:12px;line-height:1.42;color:#343b34;font-weight:500}.zv-time-layer li small{display:inline;font-size:10.5px;color:#606860}.zv-current-tx{margin-top:8px}.zv-current-tx h4{margin:8px 0;color:#6d5934}
-.zv-empty{padding:30mm;text-align:center;color:#d19c9c}
-.zv-closing-page{padding:0}.zv-closing-art{position:absolute!important;inset:0;z-index:0!important;overflow:hidden}.zv-closing-art>img:first-child{width:100%;height:100%;object-fit:cover;opacity:.9}.zv-closing-motif{position:absolute;right:4%;bottom:8%;width:40%;opacity:.14}.zv-closing{position:relative;z-index:2;margin:25mm 18mm 0;padding:14mm;background:#fffdf3df;border:1px solid #b29d6d77;color:#2d332d}.zv-closing>span{font:42px Georgia;color:#9a7b3f}.zv-closing h1{font:600 34px/1.3 Georgia,"Noto Serif SC",serif;margin:8px 0 2px}.zv-closing h2{font-size:18px;color:#716d5e;margin:0 0 20px}.zv-closing>p{font-size:14px;line-height:1.7}.zv-closing-points{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}.zv-closing-points article{border-top:2px solid #a98b54;padding:10px}.zv-closing-points b{font:20px Georgia;color:#9a7b3f}.zv-closing-points p{font-size:11px;line-height:1.5}.zv-closing-points small{font-size:9.5px;line-height:1.4;color:#6d7168}
-.zv-master-summary{margin-top:5mm;padding:8mm}.zv-master-summary .zv-sec{font-size:34px}.zv-master-summary h1{font-size:26px}.zv-master-summary h2{font-size:15px;margin-bottom:10px}.zv-summary-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.zv-summary-insights>div{background:#fffdf7d6;border-top:2px solid #a88a53;padding:8px}.zv-summary-insights b{font-size:11px;color:#7a6339}.zv-summary-insights p{font-size:9.5px;line-height:1.35;margin:5px 0}.zv-summary-insights small{font-size:8px;line-height:1.3;color:#70756c}.zv-master-summary .zv-diagram{margin-top:8px;padding:10px}.zv-master-summary .zv-diagram figcaption{margin-bottom:8px}.zv-master-summary .zv-domains{grid-template-columns:repeat(3,1fr);gap:6px}.zv-master-summary .zv-card{min-height:54px;padding:7px}.zv-master-summary .zv-card b{font-size:12px;margin:3px 0}.zv-master-summary .zv-card p{font-size:8px}
-@media(max-width:900px){.zv-page{width:100%;height:auto;min-height:760px;margin:0;padding:28px}.zv-page header,.zv-page footer{left:28px;right:28px}.zv-insights,.zv-copy-grid,.zv-star-list,.zv-domains,.zv-focus{grid-template-columns:1fr}.zv-palace-grid{grid-template-columns:repeat(2,1fr)}}
-@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}html,body{background:#fff}.review-shell{display:none}.zv-page{margin:0;width:210mm;height:297mm;box-shadow:none!important;break-after:page;page-break-after:always}.zv-page *{box-shadow:none!important;text-shadow:none!important;filter:none!important;backdrop-filter:none!important}.zv-body-bg{filter:none!important;opacity:.42!important}.zv-body-motif,.zv-motif,.zv-closing-motif{filter:none!important;opacity:.12!important}.zv-hero{filter:none!important}.zv-page:last-child{break-after:auto;page-break-after:auto}}
-`;
+const styles=ZWR_VFR_STYLES;
 
 const body=renderZwrVfrReview({reportIr,diagramData:diagrams,pagePlan});
 const reviewScript=`
diff --git a/scripts/check-shared-report-e2e-readiness.mjs b/scripts/check-shared-report-e2e-readiness.mjs
index 99472d17..ddef3d78 100644
--- a/scripts/check-shared-report-e2e-readiness.mjs
+++ b/scripts/check-shared-report-e2e-readiness.mjs
@@ -1,69 +1,57 @@
-import assert from 'node:assert/strict';
 import fs from 'node:fs';
-import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
-import {createCustomerDeliverySnapshot} from '../functions/personal-reading/narrative/report-section-snapshot.js';
-import {buildZwrVfrPagePlan} from '../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';
-import {createSharedReportE2eProofV2,verifyVfrMaterial,requireVfrAdmission} from '../functions/report-delivery/shared-report-e2e-v2.js';
-const contract=JSON.parse(fs.readFileSync(new URL('../content/reports/shared-report-delivery-e2e-contract-v2.json',import.meta.url)));
-const shipped=contract.profiles['ZWR:ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3'];
-assert.equal(contract.state,'BLOCKED_VFR_ADMISSION');assert.equal(shipped.admission.productionAdmissionGranted,false);
-assert.throws(()=>requireVfrAdmission(shipped),/SHARED_E2E_VFR_ADMISSION_BLOCKED/);
-// This synthetic profile never enters the production registry or represents human acceptance.
-const profile=structuredClone(shipped);profile.admission={state:'ACCEPTED',rendererWired:true,sourceAcceptanceDigest:await sha256Stable('SYNTHETIC_SOURCE'),rendererAcceptanceDigest:await sha256Stable('SYNTHETIC_RENDER'),productionAdmissionGranted:false};
-const testContract={...contract,profiles:{['ZWR:'+profile.compositionVersion]:profile}};
-const sections=Array.from({length:10},(_,i)=>({sectionId:`S${String(i+2).padStart(2,'0')}`,authorityRefs:['synthetic-claim'],zhHans:{manuscript:'合成验证正文。'},en:{manuscript:'Synthetic fixture manuscript.'}}));
-const seed={schemaVersion:profile.publicationIrVersion,methodId:'ZWR',localeMode:'BILINGUAL',authorityDigest:await sha256Stable('synthetic-authority'),sourceResultDigest:await sha256Stable('synthetic-manuscript'),sections};
-const ir={...seed,publicationIrDigest:await sha256Stable(seed)},pages=buildZwrVfrPagePlan({sections});
-const snapshot=await createCustomerDeliverySnapshot({methodId:'ZWR',locale:'en',subjectFingerprint:'synthetic-person-fingerprint',inputFingerprint:'synthetic-birth-fingerprint',compositionVersion:profile.compositionVersion,authorityVersion:'SYNTHETIC',claimIrVersion:profile.publicationIrVersion,verifierVersion:'SYNTHETIC',semanticContent:{visualReportIr:ir,vfrCompactAuthoringPackDigest:ir.authorityDigest,vfrDeepManuscriptDigest:ir.sourceResultDigest,vfrPagePlan:pages,vfrDiagramData:{diagrams:Array.from({length:15},(_,i)=>({id:`ZWD-${String(i+1).padStart(2,'0')}`}))}}});
-// Correct diagram ID spelling follows the actual deterministic planner.
-const diagramIds=[...new Set(pages.flatMap(x=>x.diagramIds))];
-const bound=await createCustomerDeliverySnapshot({...snapshot,semanticContent:{...snapshot.semanticContent,vfrDiagramData:{diagrams:diagramIds.map(id=>({id}))}}});
-profile.admission.sourceResultDigest=ir.sourceResultDigest;profile.admission.publicationIrDigest=ir.publicationIrDigest;profile.admission.pagePlanDigest=await sha256Stable(pages);
-const html='<html><body>synthetic private released material</body></html>',outputDigest=await sha256Stable(html);
-const receipt={passed:true,semanticSnapshotId:bound.semanticSnapshotId,compositionVersion:profile.compositionVersion,publicationIrDigest:ir.publicationIrDigest,sourceResultDigest:ir.sourceResultDigest,pagePlanDigest:await sha256Stable(pages),pageCount:pages.length,outputDigest,brokenImages:0,overflowCount:0,errorCount:0};
-const fixture={candidate:{schemaVersion:profile.candidateSchemaVersion,customerId:'owner',personId:'person',purchaseId:'purchase',birthSourceRef:'canonical:synthetic',scope:'CONTROLLED_QA_ONLY',locale:'en',generationSuccessor:profile.compositionVersion,physicalPageCount:pages.length,snapshot:bound},row:{owner_account_id:'owner',person_id:'person',report_id:'report',method_code:'ZWR',locale:'en',released_at:'2026-01-01T00:00:00Z',object_key:'private/report.html',snapshot_id:bound.semanticSnapshotId,output_digest:outputDigest,verifier_receipt:JSON.stringify(receipt)},html};
-assert.notEqual(pages.length,39);
-let count=0;
-const wrongProfile=structuredClone(profile);wrongProfile.admission.sourceResultDigest='0'.repeat(64);await assert.rejects(()=>verifyVfrMaterial(fixture,{userId:'owner'},wrongProfile,sha256Stable),/ACCEPTED_SOURCE/);count++;
-const wrongPlanProfile=structuredClone(profile);wrongPlanProfile.admission.pagePlanDigest='0'.repeat(64);await assert.rejects(()=>verifyVfrMaterial(fixture,{userId:'owner'},wrongPlanProfile,sha256Stable),/ACCEPTED_PAGE_PLAN/);count++;
-await verifyVfrMaterial(fixture,{userId:'owner'},profile,sha256Stable);count++;
-async function rejected(change,code){const f=structuredClone(fixture);change(f);await assert.rejects(()=>verifyVfrMaterial(f,{userId:'owner'},profile,sha256Stable),new RegExp(code));count++;}
-await rejected(f=>f.candidate.customerId='other','OWNER');
-await rejected(f=>f.row.owner_account_id='other','OWNER');
-await rejected(f=>f.candidate.purchaseId=null,'PURCHASE');
-await rejected(f=>f.candidate.birthSourceRef=null,'CANONICAL_SOURCE');
-await rejected(f=>f.row.person_id='other','BINDING');
-await rejected(f=>f.row.released_at=null,'RELEASE');
-await rejected(f=>f.row.object_key=null,'PRIVATE_MATERIAL');
-await rejected(f=>f.candidate.generationSuccessor='ZIWEI-PROFESSIONAL-SYNTHESIS-R5','VERSION');
-await rejected(f=>f.candidate.snapshot.compositionVersion='ZIWEI-PRODUCTION-COMPOSER-V1','VERSION');
-await rejected(f=>f.candidate.snapshot.semanticContent.visualReportIr.sections[0].en.manuscript='tamper','SNAPSHOT');
-await rejected(f=>f.row.snapshot_id='other','SNAPSHOT');
-await rejected(f=>f.candidate.physicalPageCount=39,'PAGE_PLAN');
-await rejected(f=>f.html+='tamper','OUTPUT');
-await rejected(f=>{const x=JSON.parse(f.row.verifier_receipt);x.publicationIrDigest='0'.repeat(64);f.row.verifier_receipt=JSON.stringify(x)},'OUTPUT');
-await rejected(f=>{const x=JSON.parse(f.row.verifier_receipt);x.passed=false;f.row.verifier_receipt=JSON.stringify(x)},'OUTPUT');
-await rejected(f=>f.row.verifier_receipt='{}','OUTPUT');
-// Rebind tampered material to ensure the inner source check still rejects it.
-const bad=structuredClone(fixture);bad.candidate.snapshot.semanticContent.vfrDeepManuscriptDigest='0'.repeat(64);bad.candidate.snapshot=await createCustomerDeliverySnapshot(bad.candidate.snapshot);bad.row.snapshot_id=bad.candidate.snapshot.semanticSnapshotId;
-await assert.rejects(()=>verifyVfrMaterial(bad,{userId:'owner'},profile,sha256Stable),/SOURCE_DIGEST/);count++;
-const storage=new Map();let session='first',owner='owner',opens=0,listing=true,openError=null,current=fixture;
-const deps={contract:testContract,authenticate:async()=>({userId:owner,sessionId:session}),requireSameOrigin:request=>assert.equal(request.headers.get('origin'),'https://qa.invalid'),digest:sha256Stable,open:async()=>{opens++;if(openError)throw Object.assign(new Error(openError),{code:openError,status:409});return current;},list:async()=>listing?[{reportId:'report',status:'RELEASED'}]:[]};
-const env={PHIOS_ENVIRONMENT:'qa',PRIVATE_REPORTS:{get:async key=>storage.has(key)?{json:async()=>JSON.parse(storage.get(key))}:null,put:async(key,value)=>storage.set(key,value)}};
-const handler=createSharedReportE2eProofV2(deps);
-async function call(action,handlerOverride=handler){const response=await handlerOverride({env,request:new Request('https://qa.invalid/api/shared-report-e2e-proof',{method:'POST',headers:{'content-type':'application/json',origin:'https://qa.invalid'},body:JSON.stringify({action,reportId:'report'})})});count++;return {status:response.status,...await response.json()};}
-assert.equal((await call('reopen')).code,'SHARED_E2E_FIRST_OPEN_REQUIRED');
-assert.equal((await call('generate-release-open')).code,'SHARED_E2E_ACTION_INVALID');
-const blocked=createSharedReportE2eProofV2({...deps,contract});const before=opens;
-assert.equal((await call('open-released',blocked)).code,'SHARED_E2E_VFR_ADMISSION_BLOCKED');assert.equal(opens,before);
-assert.equal((await call('open-released')).proof.state,'FIRST_OPEN');
-assert.equal((await call('reopen')).code,'SHARED_E2E_NEW_LOGIN_SESSION_REQUIRED');
-session=null;assert.equal((await call('reopen')).code,'SHARED_E2E_AUTHENTICATED_SESSION_REQUIRED');session='second';
-owner='other';assert.equal((await call('reopen')).code,'SHARED_E2E_FIRST_OPEN_REQUIRED');owner='owner';
-for(const code of ['CONSENT_REVOKED','ENTITLEMENT_MISSING','RELEASE_INACTIVE','PRIVATE_CANDIDATE_DIGEST_MISMATCH']){openError=code;assert.equal((await call('reopen')).code,code);}openError=null;
-listing=false;assert.equal((await call('reopen')).code,'SHARED_E2E_LIBRARY_RELEASE_REQUIRED');listing=true;
-current=structuredClone(fixture);current.html+='tamper';assert.equal((await call('reopen')).code,'SHARED_E2E_RENDER_OR_OUTPUT_MISMATCH');current=fixture;
-const key=[...storage.keys()][0],first=storage.get(key);const forged=JSON.parse(first);forged.material.outputDigest='0'.repeat(64);storage.set(key,JSON.stringify(forged));assert.equal((await call('reopen')).code,'SHARED_E2E_FIRST_PROOF_INVALID');storage.set(key,first);
-const final=await call('reopen');assert.equal(final.proof.state,'TWO_SESSION_READ_PASS');assert.equal(final.proof.providerCalls,0);assert.equal(final.proof.sharedDeliveryAuthorityEligible,false);
-assert.equal((await call('reopen')).code,'SHARED_E2E_FIRST_PROOF_INVALID');
-console.log(JSON.stringify({status:'PASS',fixtureCases:count,fixturePageCount:pages.length,providerCalls:0,currentVfrAdmission:'BLOCKED',liveAccountProof:'NOT_RUN',productionActivated:false}));
+if(fs.existsSync('content/reports/shared-report-delivery-e2e-contract-v2.json')){
+ await import('./check-shared-report-delivery-v2-contract.mjs');
+ await import('./check-shared-report-delivery-v2-runtime.mjs');
+}else{
+const {default:assert}=await import('node:assert/strict');
+
+const read=p=>fs.readFileSync(p,'utf8');
+const json=p=>JSON.parse(read(p));
+
+const contract=json('content/reports/shared-report-delivery-e2e-contract-v1.json');
+assert.equal(contract.status,'READY_FOR_LIVE_QA_PROOF');
+assert.equal(contract.sourceRequirements.compositionVersion,'ZIWEI-PROFESSIONAL-SYNTHESIS-R5');
+assert.equal(contract.sourceRequirements.composerOwner,'REPORT-PRO-COMPOSER-R1');
+assert.equal(contract.sourceRequirements.model,'gpt-5.6-sol');
+assert.equal(contract.sourceRequirements.rendererPageCount,39);
+assert.equal(contract.reusePolicy.fullSharedInfrastructureProofRequiredOnce,true);
+assert.equal(contract.reusePolicy.repeatedPerMethodFullE2E,false);
+
+const binding=read('functions/report-delivery/ziwei-canonical-person-binding.js');
+assert.match(binding,/generateZiweiProfessionalSynthesisR5Candidate/);
+assert.doesNotMatch(binding,/generateZiweiNaturalComposerR4Candidate/);
+
+const r5=read('functions/personal-reading/narrative/ziwei-professional-synthesis-r5.js');
+assert.match(r5,/composeReferenceGovernedDraftR1/);
+assert.match(r5,/REPORT-PRO-COMPOSER-R1/);
+assert.match(r5,/referenceGoverned:true/);
+
+const gate=read('functions/report-delivery/ziwei-professional-synthesis-r5-generation.js');
+for(const token of ["referenceGoverned!==true","referenceId!=='ZIWEI-PROFESSIONAL-SYNTHESIS-R5'","composerOwner!=='REPORT-PRO-COMPOSER-R1'","model!=='gpt-5.6-sol'"])assert.ok(gate.includes(token),token);
+
+const renderer=read('workers/method-report-renderer/index.js');
+assert.match(renderer,/'ZIWEI-PROFESSIONAL-SYNTHESIS-R5':39/);
+assert.match(renderer,/expectedPageCount/);
+
+const material=read('functions/account/ziwei-controlled-report-material.js');
+assert.match(material,/semanticContent\?\.report\?\.totalPages/);
+assert.doesNotMatch(material,/pageCount!==33/);
+
+const proof=read('functions/api/shared-report-e2e-proof.js');
+for(const token of [
+ "generate-release-open","reopen","authenticate(context)","firstAuthenticatedSessionId",
+ "SHARED_E2E_NEW_LOGIN_SESSION_REQUIRED","sameImmutableSnapshot:true",
+ "sameImmutableRenderedMaterial:true","noProviderRegenerationOnReopen:true",
+ "sharedDeliveryAuthorityEligible:true","accountLibraryVisible:true","admissionReceipt","privateProofDigest"
+])assert.ok(proof.includes(token),token);
+assert.match(proof,/compositionVersion!=='ZIWEI-PROFESSIONAL-SYNTHESIS-R5'/);
+assert.match(proof,/model!=='gpt-5\.6-sol'/);
+assert.match(proof,/rendererPageCount:receipt\.pageCount/);
+
+const state=json('docs/reports/SHARED-REPORT-E2E-REFERENCE-v1.json');
+assert.equal(state.finalSharedAuthorityState,'PENDING_LIVE_TWO_SESSION_PASS');
+assert.equal(state.liveProofEndpoint,'/api/shared-report-e2e-proof');
+
+console.log('PASS Shared Report Delivery E2E readiness: Zi Wei R5 is wired through REPORT-PRO-COMPOSER-R1, 39-page private rendering, release/account material, and a two-auth-session immutable reopen proof. Final shared authority remains pending the live QA two-session PASS.');
+
+}
diff --git a/scripts/check-vfr-zwr-diagram-visual-enrichment.mjs b/scripts/check-vfr-zwr-diagram-visual-enrichment.mjs
index b02cbb05..6d94fb1f 100644
--- a/scripts/check-vfr-zwr-diagram-visual-enrichment.mjs
+++ b/scripts/check-vfr-zwr-diagram-visual-enrichment.mjs
@@ -11,7 +11,7 @@ assert.equal(ZWR_VFR_RENDERER_VERSION,'ZWR-VFR-R1-DEEP-RENDERER-v6');
 assert.equal(ZWR_VFR_FIT_PROFILE_VERSION,'ZWR-VFR-R1-PUBLICATION-FIT-v1');
 
 const renderer=fs.readFileSync('assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js','utf8');
-const builder=fs.readFileSync('scripts/build-zwr-vfr-human-review.mjs','utf8');
+const builder=fs.readFileSync('scripts/build-zwr-vfr-human-review.mjs','utf8')+'\n'+fs.readFileSync('assets/customer-ui/js/personal-products/ziwei-vfr-r1-styles.js','utf8');
 
 for(const token of [
  'zv-ziwei-board',
diff --git a/scripts/check-vfr-zwr-production-cutover.mjs b/scripts/check-vfr-zwr-production-cutover.mjs
index d43086a7..119af5b5 100644
--- a/scripts/check-vfr-zwr-production-cutover.mjs
+++ b/scripts/check-vfr-zwr-production-cutover.mjs
@@ -31,7 +31,7 @@ assert(!binding.includes("import {generateZiweiProfessionalSynthesisR5Candidate}
 
 assert(generator.includes('composeZwrVfrProductionDeepManuscript'),'automatic Deep Manuscript production composer missing');
 assert(generator.includes("providerAuthority:'WRITING_ONLY_AUTOMATIC'"),'automatic writing authority missing');
-assert(generator.includes('productionAdmissionGranted:true'));
+assert(generator.includes('productionAdmissionGranted:false'),'content acceptance does not grant shared production admission');
 assert(!generator.includes('composeZwrVfrOneCall'),'legacy one-call composer must not return');
 
 assert(composer.includes('composeZwrFiveCallExperiment'),'approved Deep Manuscript writer missing');
@@ -41,4 +41,4 @@ assert(composer.includes('semanticReviewCalls:0'),'semantic AI review must remai
 assert(completeness.includes('TOTAL_DEPTH_TOO_LOW'),'deterministic depth gate missing');
 
 assert(fs.existsSync('scripts/rollback-zwr-vfr-production-cutover.mjs'),'rollback script missing');
-console.log('PASS VFR-ZWR-10 production cutover: canonical binding uses automatic Deep Manuscript generation for unseen customer charts; deterministic completeness + targeted repair are active; semantic AI review=0; publication/rerender provider calls=0; 15-diagram adaptive publication retained; explicit rollback available.');
+console.log('PASS VFR-ZWR-10 generation binding (shared production admission remains blocked): canonical binding uses automatic Deep Manuscript generation for unseen customer charts; deterministic completeness + targeted repair are active; semantic AI review=0; publication/rerender provider calls=0; 15-diagram adaptive publication retained; explicit rollback available.');
diff --git a/scripts/check-ziwei-zpa-access.mjs b/scripts/check-ziwei-zpa-access.mjs
index 1825e1ec..2ee1135c 100644
--- a/scripts/check-ziwei-zpa-access.mjs
+++ b/scripts/check-ziwei-zpa-access.mjs
@@ -59,10 +59,10 @@ assert(!rendererBuild.includes("'report-publication.css'"),'Private Zi Wei rende
 const sharedPrintShell=fs.readFileSync('assets/customer-ui/surfaces/report-print-shell-v2.css','utf8');
 assert(sharedPrintShell.includes('210mm!important')&&sharedPrintShell.includes('297mm!important'),'Shared Print Shell V2 must own the single A4 physical contract');
 assert(!sharedPrintShell.includes('data-method="ZWR"'),'Shared Print Shell V2 must not encode Zi Wei method identity');
-const renderer=fs.readFileSync('workers/method-report-renderer/index.js','utf8');
+const renderer=fs.readFileSync('workers/method-report-renderer/index.js','utf8')+'\n'+fs.readFileSync('functions/report-delivery/ziwei-vfr-method-profile.js','utf8');
 assert(!renderer.includes('Page.printToPDF'),'Customer release renderer must not regenerate PDF in the hot path');
 assert(!renderer.includes('countChromiumPdfPages'),'Customer release renderer must not reparse Chromium PDF page trees');
 assert(renderer.includes('DOM_PHYSICAL_PAGE_CONTRACT_V1'),'Deployed renderer must record the bounded DOM physical-page verification mode');
-assert(renderer.includes('pageSequenceValid'),'Deployed renderer must verify the exact 1..33 physical page sequence');
+assert(renderer.includes('pageSequenceValid'),'Deployed renderer must verify the governed physical page sequence');
 assert(renderer.includes('hiddenOrZeroGeometryCount'),'Deployed renderer must reject hidden or zero-geometry physical pages');
 sqlite.close();console.log('PASS ZPA local owner/consent negatives, immutable birth-input versioning, and lightweight deployed render hot-path contract.');
diff --git a/workers/method-report-renderer/index.js b/workers/method-report-renderer/index.js
index 54e60b11..337dbf06 100644
--- a/workers/method-report-renderer/index.js
+++ b/workers/method-report-renderer/index.js
@@ -1,34 +1,33 @@
+import {assertMethodGeneration} from '../../functions/report-delivery/method-render-contract.js';
 import puppeteer from '@cloudflare/puppeteer';
-import {renderPublicationReport} from '../../assets/customer-ui/js/personal-products/publication-report-pages.js';
-import {finalizeZiweiNavigation} from '../../functions/canonical-presentation-runtime/ziwei-navigation-finalization.js';
 import {createCustomerDeliverySnapshot} from '../../functions/personal-reading/narrative/report-section-snapshot.js';
 import {css,fitCode} from './render-assets.generated.js';
 import {assertZiweiContextSnapshot} from '../../functions/report-context/ziwei-contextual-snapshot-contract.js';
 import {CONTEXTUAL_REPORT_CSS} from '../../functions/report-context/contextual-report-presentation.js';
 
 const origin='https://qa.phios-github.pages.dev';
-const ZIWEI_PAGE_COUNTS=Object.freeze({'ZIWEI-PRODUCTION-COMPOSER-V1':33,'ZIWEI-NATURAL-COMPOSER-R4':33,'ZIWEI-PROFESSIONAL-SYNTHESIS-R5':39,'ZIWEI-CONTEXTUAL-RCA-R1':41});
-const ALLOWED_ZIWEI_COMPOSITIONS=new Set(Object.keys(ZIWEI_PAGE_COUNTS));
 const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
 
 export default {
  async fetch(request,env){
   // No public endpoint. Only Pages' private service binding may invoke this worker.
   if(env.PHIOS_ENVIRONMENT!=='qa'||request.method!=='POST'||new URL(request.url).pathname!=='/verify')return new Response(null,{status:404});
-  let browser,stage='INPUT';
+  let browser,stage='INPUT';const startedAt=Date.now(),timings={};
   try{
    const reader=request.body?.getReader();if(!reader)throw Error('BODY_REQUIRED');let size=0,raw='';const decoder=new TextDecoder();
    for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8000000){await reader.cancel();throw Error('TOO_LARGE');}raw+=decoder.decode(value,{stream:true});}
    const {candidate,method,compositionVersion}=JSON.parse(raw+decoder.decode());
-   const expectedPageCount=ZIWEI_PAGE_COUNTS[compositionVersion]||0;
-   if(method!=='ZWR'||!ALLOWED_ZIWEI_COMPOSITIONS.has(compositionVersion)||!expectedPageCount||compositionVersion!==candidate?.snapshot?.compositionVersion||candidate?.scope!=='CONTROLLED_QA_ONLY'||!['en','zh-Hans'].includes(candidate.locale)||candidate.snapshot?.methodId!=='ZWR'||(await createCustomerDeliverySnapshot(candidate.snapshot)).semanticSnapshotId!==candidate.snapshot.semanticSnapshotId)throw Error('SNAPSHOT_INVALID');
+   const contract=await assertMethodGeneration(candidate),expectedPageCount=contract.expectedPageCount;
+   if(method!==contract.methodCode||compositionVersion!==contract.compositionVersion||candidate?.scope!=='CONTROLLED_QA_ONLY'||candidate.snapshot?.locale!==candidate.locale||(await createCustomerDeliverySnapshot(candidate.snapshot)).semanticSnapshotId!==candidate.snapshot.semanticSnapshotId)throw Error('SNAPSHOT_INVALID');
    if(compositionVersion==='ZIWEI-CONTEXTUAL-RCA-R1')await assertZiweiContextSnapshot(candidate);
 
    stage='COMPOSE';
-   const body=finalizeZiweiNavigation(renderPublicationReport(candidate.snapshot.semanticContent.report),candidate.locale).replaceAll('src="/assets/',`src="${origin}/assets/`);
+   const body=contract.renderFunction().replaceAll('src="/assets/',`src="${origin}/assets/`);
 
    stage='BROWSER_LAUNCH';
+   const launchStarted=Date.now();
    browser=await puppeteer.launch(env.BROWSER);
+   timings.browserLaunchMs=Date.now()-launchStarted;
    const page=await browser.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.name));
    await page.setViewport({width:1440,height:1000});
@@ -38,39 +37,62 @@ export default {
    page.on('request',r=>{const u=new URL(r.url());const allowed=u.protocol==='data:'||(u.protocol==='https:'&&(u.origin===origin||u.hostname.endsWith('.getphios.com')||u.hostname.endsWith('.r2.dev')));return allowed?r.continue():r.abort();});
 
    stage='ASSET_LOAD';
-   await page.setContent(`<!doctype html><html lang="${candidate.locale}"><head><meta charset="utf-8"><title>PHI OS · Zi Wei</title><style>${css}${compositionVersion==='ZIWEI-CONTEXTUAL-RCA-R1'?CONTEXTUAL_REPORT_CSS:''}</style></head><body><main>${body}</main></body></html>`,{waitUntil:'networkidle0',timeout:60000});
-   await page.addScriptTag({content:fitCode});
+   const assetStarted=Date.now();
+   await page.setContent(`<!doctype html><html lang="${candidate.locale}"><head><meta charset="utf-8"><title>PHI OS · Zi Wei</title><style>${contract.styles||css}${compositionVersion==='ZIWEI-CONTEXTUAL-RCA-R1'?CONTEXTUAL_REPORT_CSS:''}</style></head><body><main class="report-root">${body}</main></body></html>`,{waitUntil:'networkidle0',timeout:60000});
+   timings.assetLoadMs=Date.now()-assetStarted;
+   if(contract.rendererId!=='ZIWEI_VFR')await page.addScriptTag({content:fitCode});
    await page.emulateMediaType('print');
 
    stage='FIT';
-   const measured=await page.evaluate(async expectedPageCount=>{
+   const measured=await page.evaluate(async ({expectedPageCount,pageSelector,rendererId,requiredDiagramIds})=>{
+    const started=performance.now();
     await document.fonts.ready;
-    await methodReportFit.settlePublicationAssets(document);
+    const fontSettleMs=performance.now()-started;
+    if(rendererId!=='ZIWEI_VFR')await methodReportFit.settlePublicationAssets(document);
+    const decodeStarted=performance.now();
     await Promise.all([...document.images].map(i=>i.decode()));
-    const fits=methodReportFit.fitPublicationForPrint(document);
-    const physicalPages=[...document.querySelectorAll('main .pub-report > .pub-static, main .pub-report > .pub-page')];
+    const imageDecodeMs=performance.now()-decodeStarted,fitStarted=performance.now();
+    const fits=rendererId==='ZIWEI_VFR'?[]:methodReportFit.fitPublicationForPrint(document);
+    const physicalPages=[...document.querySelectorAll(pageSelector)];
     const pageNumbers=physicalPages.map(p=>Number(p.dataset.pageNumber));
     const pageSequenceValid=physicalPages.length===expectedPageCount&&pageNumbers.every((n,i)=>n===i+1);
     const hiddenOrZeroGeometryCount=physicalPages.filter(p=>{
      const rect=p.getBoundingClientRect(),style=getComputedStyle(p);
-     return style.display==='none'||style.visibility==='hidden'||rect.width<=0||rect.height<=0;
+     return style.display==='none'||style.visibility==='hidden'||style.opacity==='0'||rect.width<=0||rect.height<=0;
     }).length;
+    const hiddenRequiredContentCount=rendererId==='ZIWEI_VFR'?[...document.querySelectorAll('.zv-page main p,.zv-page figure,.zv-page figcaption,.zv-page main h1,.zv-page main h2')].filter(n=>{const r=n.getBoundingClientRect(),style=getComputedStyle(n);return style.display==='none'||style.visibility==='hidden'||style.opacity==='0'||r.width<=0||r.height<=0;}).length:0;
+    const diagramCaptionsValid=rendererId!=='ZIWEI_VFR'||[...document.querySelectorAll('[data-diagram-id]')].every(d=>d.querySelector('figcaption b')?.textContent.trim()&&d.querySelector('figcaption span')?.textContent.trim()&&d.querySelectorAll('.zv-empty').length===0&&d.children.length>1);
+    const diagrams=[...document.querySelectorAll('[data-diagram-id]')].map(d=>d.dataset.diagramId);
+    const diagramRegistryValid=requiredDiagramIds.length===0||(diagrams.length===requiredDiagramIds.length&&requiredDiagramIds.every(id=>diagrams.filter(x=>x===id).length===1));
+    const overflowPages=rendererId==='ZIWEI_VFR'?physicalPages.filter(p=>{
+     const main=p.querySelector('main'),footer=p.querySelector('footer');
+     if(p.scrollHeight>p.clientHeight+2)return true;
+     if(!main)return false;
+     const boundary=footer?.getBoundingClientRect().top??p.getBoundingClientRect().bottom;
+     const content=[...main.querySelectorAll('p,figure,figcaption,article,h1,h2,.zv-diagram *')];
+     return main.scrollHeight>main.clientHeight+2||content.some(n=>{
+      const r=n.getBoundingClientRect(),style=getComputedStyle(n);
+      return r.bottom>boundary+1||style.display==='none'||style.visibility==='hidden'||style.opacity==='0';
+     });
+    }):[];
     return {
+     fontSettleMs,imageDecodeMs,fitMs:performance.now()-fitStarted,imageCount:document.images.length,
+     diagramRegistryValid,diagramCaptionsValid,hiddenRequiredContentCount,
+     missingRenderer:document.querySelectorAll('.zv-empty').length,
      pageCount:physicalPages.length,
      pageSequenceValid,
      hiddenOrZeroGeometryCount,
-     overflowCount:fits.filter(p=>!p.fits).length,
+     overflowCount:fits.filter(p=>!p.fits).length+overflowPages.length,
      brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length,
      undefinedText:/undefined|\[object Object\]/.test(document.querySelector('main').innerText)
     };
-   },expectedPageCount);
+   },{expectedPageCount,pageSelector:contract.pageSelector,rendererId:contract.rendererId,requiredDiagramIds:contract.requiredDiagramIds});
 
    stage='VERIFY';
-   if(measured.pageCount!==expectedPageCount||!measured.pageSequenceValid||measured.hiddenOrZeroGeometryCount||measured.overflowCount||measured.brokenImages||measured.undefinedText||errors.length)throw Error('RENDER_VERIFICATION_FAILED');
+   if(measured.pageCount!==expectedPageCount||!measured.pageSequenceValid||measured.hiddenOrZeroGeometryCount||measured.overflowCount||measured.brokenImages||measured.undefinedText||!measured.diagramRegistryValid||!measured.diagramCaptionsValid||measured.hiddenRequiredContentCount||measured.missingRenderer||errors.length)throw Error('RENDER_VERIFICATION_FAILED');
 
-   // The 24-report admission campaign separately proves Chromium/Edge PDF pagination
-   // at 33 pages. Customer release verifies the deployed physical DOM contract
-   // without regenerating and reparsing a PDF on every request.
+   // Verify the method-owned physical DOM contract. PDF admission is a separate
+   // receipt; reopening always reads the already stored material.
    await page.evaluate(()=>document.querySelectorAll('script').forEach(s=>s.remove()));
    const html=await page.content();
 
@@ -79,9 +101,22 @@ export default {
     verification:{
      schemaVersion:'METHOD_BROWSER_VERIFICATION_V1',
      verifier:'CLOUDFLARE_BROWSER_QA',
-     verificationMode:'DOM_PHYSICAL_PAGE_CONTRACT_V1',
+     verificationMode:contract.verificationMode,
+     rendererVersion:contract.rendererVersion,
+     compositionVersion:contract.compositionVersion,
+     publicationVersion:contract.publicationVersion,
+     diagramRegistryValid:measured.diagramRegistryValid,
+     undefinedText:false,
      semanticSnapshotId:candidate.snapshot.semanticSnapshotId,
+     snapshotId:candidate.snapshot.semanticSnapshotId,
+     pagePlanDigest:candidate.snapshot.semanticContent.vfrLineage?.pagePlanDigest||null,
+     publicationIrDigest:candidate.snapshot.semanticContent.visualReportIr?.publicationIrDigest||null,
+     sourceResultDigest:candidate.snapshot.semanticContent.vfrDeepManuscriptDigest||null,
+     expectedPageCount,actualPageCount:measured.pageCount,hiddenRequiredContentCount:measured.hiddenRequiredContentCount,
      passed:true,
+     timings:{...timings,fontSettleMs:measured.fontSettleMs,imageDecodeMs:measured.imageDecodeMs,fitMs:measured.fitMs,totalRequestMs:Date.now()-startedAt},
+     imageCount:measured.imageCount,
+     htmlBytes:new TextEncoder().encode(html).byteLength,
      pageCount:measured.pageCount,
      pageSequenceValid:true,
      hiddenOrZeroGeometryCount:0,
@@ -97,6 +132,7 @@ export default {
     code:'REPORT_BROWSER_VERIFICATION_FAILED',
     stage,
     errorName:error.name,
+    timings:{...timings,totalRequestMs:Date.now()-startedAt},
     ...(['VERIFY','BROWSER_LAUNCH'].includes(stage)?{reason:String(error.message).slice(0,240)}:{}),
     ...(stage==='BROWSER_LAUNCH'?{limits:await puppeteer.limits(env.BROWSER).catch(()=>null)}:{})
    },{status:422,headers:{'Cache-Control':'no-store'}});
diff --git a/assets/customer-ui/js/personal-products/ziwei-vfr-r1-styles.js b/assets/customer-ui/js/personal-products/ziwei-vfr-r1-styles.js
new file mode 100644
index 00000000..3eee0757
--- /dev/null
+++ b/assets/customer-ui/js/personal-products/ziwei-vfr-r1-styles.js
@@ -0,0 +1,2 @@
+// Extracted verbatim from the accepted W9 review builder; historical artifact untouched.
+export const ZWR_VFR_STYLES = "\n@page{size:A4;margin:0}\n*{box-sizing:border-box}\nhtml,body{margin:0;padding:0;background:#121715;color:#e8ddbd;font-family:Inter,\"Segoe UI\",\"Microsoft YaHei\",sans-serif}\n.review-shell{max-width:1040px;margin:24px auto;padding:24px 28px;background:#1d2521;border:1px solid #5a513a}\n.review-shell button{font:inherit;padding:10px 18px}.review-shell code{color:#e9cf8a}\n.zv-page{position:relative;width:210mm;height:297mm;margin:14px auto;background:linear-gradient(145deg,#f8f3ea,#eee5d5);overflow:hidden;padding:18mm 16mm 18mm;break-after:page;page-break-after:always;--zv-accent:#6d4bc3;--zv-accent2:#c59647}\n.zv-page:before{content:\"\";position:absolute;inset:0;background:radial-gradient(circle at 18% 10%,color-mix(in srgb,var(--zv-accent) 22%,transparent),transparent 32%),radial-gradient(circle at 84% 18%,color-mix(in srgb,var(--zv-accent2) 22%,transparent),transparent 34%),linear-gradient(180deg,#fffdf8cc,#f5eee0cc);z-index:0}\n.zv-page>*{position:relative;z-index:1}\n.zv-static-page{padding:0;background:#0d1210}\n.zv-static{position:absolute!important;inset:0;width:100%;height:100%;object-fit:cover;z-index:1!important}\n.zv-body-bg{position:absolute!important;inset:0;width:100%;height:100%;object-fit:cover;opacity:.48;filter:saturate(1.18) contrast(1.04);z-index:0!important}\n.zv-body-motif{position:absolute!important;right:-4%;bottom:3%;width:48%;max-height:46%;object-fit:contain;opacity:.24;filter:drop-shadow(0 0 18px color-mix(in srgb,var(--zv-accent) 35%,transparent));z-index:0!important}\n.zv-master-art{position:absolute!important;inset:0;z-index:0!important;overflow:hidden}.zv-hero{width:100%;height:100%;object-fit:cover;opacity:.78;filter:saturate(1.15) contrast(1.04)}.zv-motif{position:absolute;right:1%;bottom:4%;width:46%;opacity:.3;filter:drop-shadow(0 0 22px color-mix(in srgb,var(--zv-accent) 45%,transparent))}\n.zv-chapter-art{position:absolute!important;inset:0;z-index:0!important;overflow:hidden;background:#f4eddf}.zv-chapter-hero{width:100%;height:100%;object-fit:cover;filter:saturate(1.05) contrast(1.02);opacity:1}.zv-chapter-art:after{content:\"\";position:absolute;left:0;right:0;bottom:0;height:34%;background:linear-gradient(180deg,transparent,#f6efe2b8 52%,#f6efe2ef 100%)}.zv-chapter-motif{position:absolute;right:3%;bottom:4%;width:42%;opacity:.14;filter:none}\n.zv-chapter-master{position:absolute;z-index:2;left:15mm;bottom:24mm;width:118mm;padding:10mm 11mm 9mm;background:#fffaf0e8;border:1px solid color-mix(in srgb,var(--zv-accent) 30%,#b9a06d);box-shadow:0 14px 30px #4d463120;color:#2d342e}.zv-chapter-kicker{font-size:9px;letter-spacing:3px;color:#7f714f}.zv-chapter-number{font:500 58px/1 Georgia;color:var(--zv-accent);margin:8px 0 2px}.zv-chapter-rule{width:64px;height:3px;background:linear-gradient(90deg,var(--zv-accent),var(--zv-accent2));margin:6px 0 14px}.zv-chapter-master h1{font:600 31px/1.2 Georgia,\"Noto Serif SC\",serif;margin:0;color:#2a302b}.zv-chapter-master h2{font:500 17px/1.3 Georgia,serif;margin:5px 0 15px;color:#665f50}.zv-chapter-purpose{max-width:94mm;border-left:3px solid var(--zv-accent2);padding-left:12px}.zv-chapter-purpose p{margin:3px 0;font-size:13.5px;line-height:1.5;color:#3d473e}.zv-chapter-purpose p[lang=\"en\"]{font-size:11.5px;color:#6f7168}.zv-chapter-cue{margin-top:16px;display:flex;align-items:center;gap:8px;color:#766a4c}.zv-chapter-cue span{width:30px;height:30px;border:1px solid #bda16b;border-radius:50%;display:grid;place-items:center;font-size:10px}.zv-chapter-cue b{font-size:9px;letter-spacing:2px}\n.zv-language-reading{padding-top:9mm;color:#2e352f}.zv-language-head{display:grid;grid-template-columns:56px 1fr auto;align-items:end;gap:12px;margin-bottom:12px;border-bottom:1px solid color-mix(in srgb,var(--zv-accent) 38%,#b9a77d);padding-bottom:10px}.zv-language-head>span{font:34px Georgia;color:var(--zv-accent)}.zv-language-head small{display:block;font-size:10px;letter-spacing:2px;color:var(--zv-accent);font-weight:700}.zv-language-head h2{margin:2px 0 0;font:600 25px/1.2 Georgia,\"Noto Serif SC\",serif;color:#2b332c}.zv-language-head p{margin:3px 0 0;font-size:11px;color:#6a7168}.zv-language-head>b{font:18px Georgia;color:#9a7b3f}.zv-language-reading article{background:#fffdf7ee;border:1px solid color-mix(in srgb,var(--zv-accent) 28%,#b9a77d);padding:18px 20px;box-shadow:0 12px 28px color-mix(in srgb,var(--zv-accent) 10%,transparent)}.zv-language-reading article p{margin:0 0 13px;color:#303830}.zv-language-reading.is-zh article p{font-size:14px;line-height:1.78}.zv-language-reading.is-en article p{font-size:12.4px;line-height:1.62}.zv-language-reading article p:last-child{margin-bottom:0}\n.zv-axis-compact{position:relative;display:grid;grid-template-columns:1fr 130px 1fr;align-items:center;gap:18px;min-height:110mm;padding:10mm 8mm}.zv-axis-line{position:absolute;left:12%;right:12%;top:50%;height:3px;background:linear-gradient(90deg,var(--zv-accent),#c8aa68,var(--zv-accent2));opacity:.72}.zv-axis-seal{position:relative;z-index:2;padding:16px 18px;border:2px solid var(--pal);background:linear-gradient(145deg,color-mix(in srgb,var(--pal) 17%,#fffdf5),#fff9ec);box-shadow:0 12px 24px color-mix(in srgb,var(--pal) 14%,transparent)}.zv-axis-seal>span{font-size:12px;color:#5e655d}.zv-axis-seal strong{display:block;font:600 24px/1.2 Georgia,\"Noto Serif SC\",serif;margin:7px 0;color:#2c342d}.zv-axis-seal strong small{display:block;font-size:10px;color:#687068}.zv-axis-seal div{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.zv-axis-seal div b{padding:6px 8px;border-left:4px solid var(--pal);background:#ffffffc9;font-size:11px;color:#313831}.zv-axis-bridge{position:relative;z-index:3;width:124px;height:124px;border-radius:50%;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;place-self:center;background:radial-gradient(circle,#2d4035,#18231e);border:3px solid #c7a85f;box-shadow:0 0 0 9px #c7a85f22,0 16px 30px #0003;color:#f4d58a}.zv-axis-bridge span{font:28px Georgia;text-align:center}.zv-axis-bridge i{font-style:normal;font-size:21px;color:#a8c9bb}.zv-axis-bridge small,.zv-axis-bridge em{grid-column:1/-1;display:block;text-align:center;font-style:normal;font-size:8px;color:#eee5cf;margin-top:-10px}\n.zv-tx-focus{min-height:105mm;display:grid;place-content:center;gap:14px}.zv-tx-focus article{display:grid;grid-template-columns:120px 110px 1fr;align-items:center;gap:16px;padding:16px 18px;border-left:8px solid var(--layer);background:linear-gradient(90deg,color-mix(in srgb,var(--layer) 14%,#fffaf0),#fffdf8);box-shadow:0 12px 26px color-mix(in srgb,var(--layer) 12%,transparent)}.zv-tx-focus-layer b,.zv-tx-focus-layer small{display:block}.zv-tx-focus-layer b{font-size:14px;color:#303730}.zv-tx-focus-layer small{font-size:10px;color:#687068}.zv-tx-focus-orb{width:94px;height:94px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--tx) 18%,#fff7df);border:3px solid var(--tx);box-shadow:0 0 0 8px color-mix(in srgb,var(--tx) 10%,transparent)}.zv-tx-focus-orb span{font-size:21px;font-weight:800;color:var(--tx);text-align:center}.zv-tx-focus-orb small{display:block;font-size:9px;color:#666d65}.zv-tx-focus-target strong,.zv-tx-focus-target em{display:block;font-style:normal}.zv-tx-focus-target strong{font:600 23px Georgia,\"Noto Serif SC\",serif;color:#2c342d}.zv-tx-focus-target strong small,.zv-tx-focus-target em small{display:block;font-size:10px;color:#687068}.zv-tx-focus-target em{font-size:14px;color:#625f55;margin-top:6px}.zv-tx-focus>p{text-align:center;font-size:11px;color:#6b7169}.zv-tx-focus>p small{display:block;font-size:9px}\n\n.zv-page header,.zv-page footer{position:absolute;left:16mm;right:16mm;display:flex;justify-content:space-between;align-items:center;font-size:10px;letter-spacing:1.5px;color:#b7aa83}\n.zv-page header{top:9mm}.zv-page footer{bottom:8mm;padding-top:8px;border-top:1px solid #796d4d66}.zv-page main{height:100%;padding-top:12mm;padding-bottom:12mm}\n.zv-front{height:100%;display:grid;place-content:center;text-align:center}.zv-front h1{font:500 36px Georgia,\"Noto Serif SC\",serif;letter-spacing:1px}.zv-front p{color:#b7aa83}\n.zv-master{position:relative;margin-top:8mm;padding:12mm;background:linear-gradient(145deg,#fffdf2e8,color-mix(in srgb,var(--zv-accent) 10%,#fffdf2e8));border:1px solid color-mix(in srgb,var(--zv-accent) 40%,#c3a66d);box-shadow:0 16px 34px #54416824,inset 0 0 0 1px #ffffffaa;color:#2b302b;backdrop-filter:blur(3px)}.zv-sec{font:44px Georgia;color:#9a7b3f}.zv-master h1{font:600 32px/1.35 Georgia,\"Noto Serif SC\",serif;margin:10px 0 3px;color:#2a302b}.zv-master h2{font-size:17px;font-weight:500;color:#6e6a59;margin:0 0 18px}.zv-master>p{font-size:14px;line-height:1.65;margin:5px 0;color:#4a5148}\n.zv-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}.zv-insights article{border-top:4px solid var(--zv-accent);padding:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--zv-accent) 9%,#fffdf7),#fffdf7dd);box-shadow:0 8px 18px color-mix(in srgb,var(--zv-accent) 14%,transparent)}.zv-insights article>b{font:22px Georgia;color:#9a7b3f}.zv-insights h3{margin:7px 0;font-size:14px;color:#2f352f}.zv-insights p{font-size:11.5px;line-height:1.5;color:#424940}.zv-insights small{display:block;font-size:10px;line-height:1.45;color:#727567}\n.zv-master-deep{margin-top:5mm;padding:9mm}.zv-master-deep .zv-sec{font-size:34px}.zv-master-deep h1{font-size:27px}.zv-master-deep h2{font-size:15px;margin-bottom:8px}.zv-master-deep .zv-purpose{font-size:11.5px;line-height:1.45}.zv-master-reading{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.zv-master-reading article{padding:12px 14px;background:linear-gradient(145deg,#fffdf7e6,color-mix(in srgb,var(--zv-accent) 9%,#fffdf7));border-top:3px solid var(--zv-accent);box-shadow:0 8px 18px color-mix(in srgb,var(--zv-accent) 12%,transparent)}.zv-master-reading p{font-size:12.2px;line-height:1.6;margin:0 0 9px;color:#303830;font-weight:450}.zv-master-reading article[lang=\"zh-Hans\"] p{font-size:13px;line-height:1.7}.zv-master-reading.is-stacked{grid-template-columns:1fr;gap:8px}.zv-master-reading.is-stacked article{padding:10px 14px}.zv-master-reading.is-stacked article[lang=\"zh-Hans\"] p{font-size:13.2px;line-height:1.68}.zv-master-reading.is-stacked article[lang=\"en\"] p{font-size:11.8px;line-height:1.5}\n.zv-reading-head{padding-top:8mm;margin-bottom:8px;display:grid;grid-template-columns:auto 1fr;column-gap:10px;align-items:end}.zv-reading-head>span{grid-row:1/3;font:34px Georgia;color:var(--zv-accent)}.zv-reading-head h2{margin:0;font:600 24px/1.2 Georgia,\"Noto Serif SC\",serif;color:#2f352f}.zv-reading-head small{font-size:12.5px;color:#5d635b;font-weight:500}\n.zv-copy-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding-top:2mm}.zv-copy-grid article{border:1px solid color-mix(in srgb,var(--zv-accent) 32%,#a8956f);padding:15px 16px;background:linear-gradient(145deg,#fffdf7ee,color-mix(in srgb,var(--zv-accent) 7%,#fffdf7));box-shadow:0 12px 28px color-mix(in srgb,var(--zv-accent) 12%,transparent)}.zv-copy-grid h3{margin:0 0 9px;color:var(--zv-accent);font-size:14.5px}.zv-copy-grid p{font-size:12.2px;line-height:1.58;margin:0 0 10px;color:#303730}.zv-copy-grid article[lang=\"zh-Hans\"] p{font-size:13.2px;line-height:1.72}.zv-reading-grid article{min-height:182mm}.zv-reading-grid.is-stacked{grid-template-columns:1fr;gap:10px}.zv-reading-grid.is-stacked article{min-height:0;padding:13px 18px}.zv-reading-grid.is-stacked article[lang=\"zh-Hans\"]{border-top:4px solid var(--zv-accent)}.zv-reading-grid.is-stacked article[lang=\"en\"]{border-top:2px solid color-mix(in srgb,var(--zv-accent2) 70%,#b99a61)}.zv-reading-grid.is-stacked article[lang=\"zh-Hans\"] p{font-size:13.4px;line-height:1.68}.zv-reading-grid.is-stacked article[lang=\"en\"] p{font-size:11.9px;line-height:1.52}.zv-reading-grid.is-stacked h3{margin-bottom:6px}\n.zv-diagram{margin:6mm 0 0;border:1px solid color-mix(in srgb,var(--zv-accent) 42%,#b49c6a);background:linear-gradient(145deg,#fffdf8e8,color-mix(in srgb,var(--zv-accent) 8%,#fffdf8));padding:18px;color:#2d332d;box-shadow:0 14px 30px color-mix(in srgb,var(--zv-accent) 16%,transparent),inset 0 0 0 1px #fff}.zv-diagram>figcaption{display:flex;gap:12px;align-items:baseline;margin-bottom:14px}.zv-diagram>figcaption b{font:26px Georgia;color:var(--zv-accent)}.zv-diagram>figcaption span{font-size:15px;color:#555d55;font-weight:600}\n.zv-ziwei-board{position:relative;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:7px;min-height:198mm;padding:4px}.zv-ziwei-board:before{content:\"\";position:absolute;inset:22%;border:1px solid color-mix(in srgb,var(--zv-accent) 40%,#b99557);transform:rotate(45deg);opacity:.35}.zv-chart-core{grid-row:2/4;grid-column:2/4;display:grid;place-content:center;text-align:center;z-index:2;border:1px solid #b9a06f;background:radial-gradient(circle at 50% 40%,#fff9e7,#e7dcc5);box-shadow:inset 0 0 0 7px #ffffff88,0 14px 34px #5d4b2c22}.zv-chart-core span{font-size:13px;letter-spacing:4px;color:#886b33}.zv-chart-core strong{font:600 28px Georgia,\"Noto Serif SC\",serif;color:#283229;margin:8px 0}.zv-chart-core small{font-size:11px;color:#64695f}.zv-chart-core div{display:flex;justify-content:center;align-items:center;gap:14px;margin-top:15px}.zv-chart-core div b{font:22px Georgia;color:var(--zv-accent)}.zv-chart-core div i{font-style:normal;color:#a1844c}.zv-ziwei-board .zv-palace{position:relative;min-height:0;padding:9px 10px}.zv-ziwei-board .zv-palace i{position:absolute;right:6px;top:6px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:var(--pal);color:#fff;font-style:normal;font-weight:800}\n.zv-axis-map{position:relative;min-height:190mm;display:grid;grid-template-columns:1fr 160px 1fr;align-items:center;gap:20px;padding:20mm 8mm}.zv-axis-map:before{content:\"\";position:absolute;left:12%;right:12%;top:50%;height:2px;background:linear-gradient(90deg,transparent,var(--zv-accent),var(--zv-accent2),transparent)}.zv-axis-node{position:relative;z-index:2;padding:20px;border:1px solid color-mix(in srgb,var(--pal) 60%,#9a8357);background:radial-gradient(circle at top,color-mix(in srgb,var(--pal) 22%,#fffdf5),#fff8e9);box-shadow:0 18px 34px color-mix(in srgb,var(--pal) 18%,transparent)}.zv-axis-node>span{font-size:12px;color:#63695f}.zv-axis-node strong{display:block;font:600 25px Georgia,\"Noto Serif SC\",serif;color:#263027;margin:8px 0}.zv-axis-node strong small{display:block;font-size:11px;color:#626a61}.zv-axis-node div{display:grid;gap:7px;margin-top:14px}.zv-axis-node div b{padding:7px 9px;border-left:4px solid var(--pal);background:#ffffffb8;color:#303830;font-size:12px}.zv-axis-core{position:relative;z-index:3;width:150px;height:150px;border-radius:50%;display:grid;place-content:center;text-align:center;background:radial-gradient(circle,#2c3c32,#17231d);border:2px solid #c3a15f;box-shadow:0 0 0 9px #c3a15f22,0 16px 34px #0003}.zv-axis-core span{font:30px Georgia;color:#f2d18b}.zv-axis-core i{font-style:normal;font-size:26px;color:#a8c6ba}.zv-axis-core small,.zv-axis-core em{display:block;font-style:normal;font-size:9px;color:#eee7d5;margin-top:5px}\n.zv-network-shell{position:relative;min-height:185mm;padding-top:8mm}.zv-network-kicker{text-align:center;font-size:11px;letter-spacing:3px;color:#7d6840}.zv-network-svg .zv-line.is-primary{stroke:var(--zv-accent);stroke-width:4;opacity:.9}.zv-network-svg .zv-line.is-secondary{stroke:#b9a677;stroke-width:1.4;opacity:.35}.zv-network-svg g.is-focus .zv-node{stroke:#f4cf7c;stroke-width:6;filter:drop-shadow(0 0 16px color-mix(in srgb,var(--zv-accent) 55%,transparent))}\n.zv-star-atlas{position:relative;min-height:198mm}.zv-star-atlas:before,.zv-star-atlas:after{content:\"\";position:absolute;left:50%;top:50%;border:1px solid #aa946655;border-radius:50%;transform:translate(-50%,-50%)}.zv-star-atlas:before{width:78%;height:78%}.zv-star-atlas:after{width:52%;height:52%}.zv-star-atlas-core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:145px;height:145px;border-radius:50%;display:grid;place-content:center;text-align:center;background:radial-gradient(circle,#2b3a31,#18231e);border:2px solid #bea15f;color:#f7edd2;z-index:3}.zv-star-atlas-core span{font-size:14px}.zv-star-atlas-core strong{font:22px Georgia;margin:6px 0}.zv-star-atlas-core small{font-size:9px;color:#c7bea8}.zv-star-orb{position:absolute;transform:translate(-50%,-50%);width:116px;min-height:72px;padding:9px;border:1px solid color-mix(in srgb,var(--pal) 55%,#aa9365);border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--pal) 22%,#fffdf5),#fffaf0);text-align:center;box-shadow:0 8px 18px color-mix(in srgb,var(--pal) 15%,transparent)}.zv-star-orb b,.zv-star-orb span,.zv-star-orb em{display:block;font-style:normal}.zv-star-orb b{font-size:12px;color:#2e362f}.zv-star-orb b small,.zv-star-orb span small{display:block;font-size:9px;color:#646a62}.zv-star-orb span{font-size:10px;color:#4e574f}.zv-star-orb em{font-size:9px;color:#8a6a32;margin-top:3px}\n.zv-tx-orbits{display:grid;gap:13px;padding-top:10mm}.zv-tx-track{border-left:7px solid var(--layer);background:linear-gradient(90deg,color-mix(in srgb,var(--layer) 15%,#fffaf0),#fffdf7);padding:12px 14px;box-shadow:0 9px 20px color-mix(in srgb,var(--layer) 10%,transparent)}.zv-tx-track>header{display:flex;justify-content:space-between;align-items:center}.zv-tx-track>header b{font-size:15px;color:#2f3630}.zv-tx-track>header b small{margin-left:6px;font-size:10px;color:#60675f}.zv-tx-track>header span{font:20px Georgia;color:#9a7b3f}.zv-tx-track-line{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:10px}.zv-tx-track-line:before{content:\"\";position:absolute;left:2%;right:2%;top:12px;height:2px;background:var(--layer);opacity:.35}.zv-tx-track-line article{position:relative;padding:24px 9px 9px;border-top:4px solid var(--tx);background:#fffdf7;text-align:center;box-shadow:0 5px 13px #00000012}.zv-tx-track-line article i{position:absolute;width:14px;height:14px;border-radius:50%;background:var(--tx);top:5px;left:50%;transform:translateX(-50%);box-shadow:0 0 0 5px color-mix(in srgb,var(--tx) 18%,transparent)}.zv-tx-track-line article strong,.zv-tx-track-line article em,.zv-tx-track-line article small{display:block;font-style:normal;color:#303730}.zv-tx-track-line article strong{font-size:12px}.zv-tx-track-line article strong small,.zv-tx-track-line article em small,.zv-tx-track-line article small small{font-size:9px;color:#686f67}.zv-tx-track-line article em{font-size:15px;color:var(--tx);font-weight:800;margin:5px 0}.zv-tx-track-line>p{grid-column:1/-1;text-align:center;color:#9b9485}\n.zv-palace-orbit{position:relative;min-height:196mm;overflow:hidden}.zv-orbit-ring{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);border:1px solid #a58e6055;border-radius:50%}.zv-orbit-ring.outer{width:76%;height:68%}.zv-orbit-ring.inner{width:48%;height:42%}.zv-orbit-core{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);width:155px;height:155px;border-radius:50%;display:grid;place-content:center;text-align:center;background:radial-gradient(circle,color-mix(in srgb,var(--pal) 30%,#fff7dd),#1d2922);border:3px solid var(--pal);box-shadow:0 0 0 10px color-mix(in srgb,var(--pal) 15%,transparent),0 18px 35px #0003;color:#fff}.zv-orbit-core small{font-size:10px;color:#dcd3bd}.zv-orbit-core strong{font:600 25px Georgia,\"Noto Serif SC\",serif;margin:7px 0}.zv-orbit-core strong small{display:block;font-size:10px;color:#ece2cb}.zv-orbit-core em{font-style:normal;font-size:11px;color:#f0d08c}.zv-orbit-palace{position:absolute;transform:translate(-50%,-50%);width:112px;min-height:58px;border-radius:999px;display:grid;place-content:center;text-align:center;background:color-mix(in srgb,var(--pal) 18%,#fffaf0);border:2px solid var(--pal);box-shadow:0 7px 16px color-mix(in srgb,var(--pal) 16%,transparent)}.zv-orbit-palace b{font-size:12px;color:#303730}.zv-orbit-palace b small{display:block;font-size:9px;color:#666d65}.zv-orbit-stars{position:absolute;left:5%;right:5%;bottom:9%;display:flex;flex-wrap:wrap;justify-content:center;gap:7px}.zv-orbit-stars span{padding:7px 10px;background:#fffaf0;border-left:4px solid var(--pal);font-size:11px;font-weight:700;color:#303730}.zv-orbit-stars span small,.zv-orbit-stars em{display:block;font-size:8.5px;font-style:normal;color:#666d65}.zv-orbit-tx{position:absolute;left:10%;right:10%;top:5%;display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.zv-orbit-tx span{padding:6px 9px;border-radius:999px;background:color-mix(in srgb,var(--tx) 18%,#fff);border:1px solid var(--tx);color:#363d36;font-size:10px;font-weight:700}.zv-orbit-tx small{display:inline;font-size:8px}\n.zv-nav-wheel{position:relative;min-height:195mm}.zv-nav-wheel:before{content:\"\";position:absolute;left:50%;top:50%;width:70%;height:70%;border:1px solid #a58d5c55;border-radius:50%;transform:translate(-50%,-50%)}.zv-nav-core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:155px;height:155px;border-radius:50%;display:grid;place-content:center;text-align:center;background:radial-gradient(circle,#33483b,#17231d);border:2px solid #c4a25e;color:#f6ecd1}.zv-nav-core span{font:600 23px Georgia,\"Noto Serif SC\",serif}.zv-nav-core strong{font:14px Georgia;margin-top:8px}.zv-nav-wheel>article{position:absolute;transform:translate(-50%,-50%);width:145px;min-height:82px;padding:10px;border:1px solid color-mix(in srgb,var(--zv-accent) 35%,#9d875c);background:linear-gradient(145deg,#fffdf6,color-mix(in srgb,var(--zv-accent) 8%,#fffdf6));text-align:center;box-shadow:0 8px 18px #00000015}.zv-nav-wheel>article small,.zv-nav-wheel>article b,.zv-nav-wheel>article em{display:block}.zv-nav-wheel>article small{font-size:11px;color:var(--zv-accent);font-weight:800}.zv-nav-wheel>article small i{display:block;font-size:8px;font-style:normal;color:#6a7068}.zv-nav-wheel>article b{font-size:12px;color:#303730;margin:6px 0}.zv-nav-wheel>article em{font-size:9px;font-style:normal;color:#666d65}\n\n.zv-diagram-composite{display:grid;grid-template-rows:1fr 1fr;gap:10px;padding-top:3mm;height:100%}.zv-diagram-composite .zv-diagram{margin:0;padding:11px;min-height:0;overflow:hidden}.zv-diagram.is-compact>figcaption{margin-bottom:7px}.zv-diagram.is-compact>figcaption b{font-size:19px}.zv-diagram.is-compact>figcaption span{font-size:11px}.zv-diagram.is-compact .zv-axis-compact{min-height:72mm;padding:3mm 5mm;grid-template-columns:1fr 82px 1fr;gap:8px}.zv-diagram.is-compact .zv-axis-bridge{width:78px;height:78px}.zv-diagram.is-compact .zv-axis-bridge span{font-size:18px}.zv-diagram.is-compact .zv-axis-bridge i{font-size:14px}.zv-diagram.is-compact .zv-axis-bridge small,.zv-diagram.is-compact .zv-axis-bridge em{font-size:5.8px}.zv-diagram.is-compact .zv-axis-seal{padding:7px 9px}.zv-diagram.is-compact .zv-axis-seal strong{font-size:15px;margin:3px 0}.zv-diagram.is-compact .zv-axis-seal div{gap:3px;margin-top:5px}.zv-diagram.is-compact .zv-axis-seal div b{font-size:8px;padding:3px 5px}.zv-diagram.is-compact .zv-network-shell{min-height:75mm;padding-top:1mm}.zv-diagram.is-compact .zv-network-kicker{font-size:8px}.zv-diagram.is-compact .zv-network-svg{max-height:68mm}.zv-diagram.is-compact .zv-svg text{font-size:12px}.zv-diagram.is-compact .zv-svg text.en{font-size:8px}.zv-diagram.is-compact .zv-palace-orbit{min-height:76mm}.zv-diagram.is-compact .zv-orbit-core{width:92px;height:92px}.zv-diagram.is-compact .zv-orbit-core strong{font-size:17px}.zv-diagram.is-compact .zv-orbit-core small,.zv-diagram.is-compact .zv-orbit-core strong small,.zv-diagram.is-compact .zv-orbit-core em{font-size:7.5px}.zv-diagram.is-compact .zv-orbit-palace{width:78px;min-height:38px}.zv-diagram.is-compact .zv-orbit-palace b{font-size:9px}.zv-diagram.is-compact .zv-orbit-palace b small{font-size:7px}.zv-diagram.is-compact .zv-orbit-stars{bottom:3%;gap:3px}.zv-diagram.is-compact .zv-orbit-stars span{font-size:8px;padding:3px 5px}.zv-diagram.is-compact .zv-orbit-stars span small,.zv-diagram.is-compact .zv-orbit-stars em{font-size:6.5px}.zv-diagram.is-compact .zv-orbit-tx{top:1%;gap:3px}.zv-diagram.is-compact .zv-orbit-tx span{font-size:7.5px;padding:3px 5px}.zv-diagram.is-compact .zv-tx-orbits{gap:4px;padding-top:1mm}.zv-diagram.is-compact .zv-tx-track{padding:6px 8px;border-left-width:5px}.zv-diagram.is-compact .zv-tx-track>header b{font-size:11px}.zv-diagram.is-compact .zv-tx-track>header span{font-size:14px}.zv-diagram.is-compact .zv-tx-track-line{gap:4px;margin-top:4px}.zv-diagram.is-compact .zv-tx-track-line article{padding:15px 4px 5px}.zv-diagram.is-compact .zv-tx-track-line article i{width:9px;height:9px;top:4px}.zv-diagram.is-compact .zv-tx-track-line article strong{font-size:9px}.zv-diagram.is-compact .zv-tx-track-line article em{font-size:11px;margin:2px 0}.zv-diagram.is-compact .zv-tx-track-line article strong small,.zv-diagram.is-compact .zv-tx-track-line article em small,.zv-diagram.is-compact .zv-tx-track-line article small small{font-size:6.5px}.zv-diagram.is-compact .zv-timing{gap:4px}.zv-diagram.is-compact .zv-time-layer{grid-template-columns:28px 1fr;gap:7px;padding:7px 9px}.zv-diagram.is-compact .zv-time-layer>span{font-size:15px}.zv-diagram.is-compact .zv-time-layer b,.zv-diagram.is-compact .zv-time-layer strong{font-size:10px}.zv-diagram.is-compact .zv-time-layer b small,.zv-diagram.is-compact .zv-time-layer strong small{font-size:7px}.zv-diagram.is-compact .zv-time-layer ul{gap:3px 6px;margin-top:5px}.zv-diagram.is-compact .zv-time-layer li{font-size:8px}.zv-diagram.is-compact .zv-time-layer li small{font-size:6.5px}.zv-diagram.is-compact .zv-current-tx{margin-top:3px}.zv-diagram.is-compact .zv-current-tx h4{font-size:10px;margin:3px 0}\n\n.zv-palace-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.zv-palace{min-height:94px;border:1px solid color-mix(in srgb,var(--pal) 58%,#a99572);padding:10px;background:linear-gradient(145deg,color-mix(in srgb,var(--pal) 18%,#fffdf7),#fffdf7);box-shadow:inset 4px 0 0 var(--pal),0 5px 12px color-mix(in srgb,var(--pal) 12%,transparent);color:#2b302b}.zv-palace.is-life{outline:2px solid #c09f59}.zv-palace.is-body{box-shadow:inset 0 0 0 2px #667b6e}.zv-palace .idx,.zv-palace em{display:block;color:#5f665f;font-style:normal;font-size:11px}.zv-palace b{display:block;margin:4px 0;font-size:16px;color:#283028}.zv-palace b small{display:block;font-size:11px;font-weight:500;color:#5c655d}.zv-palace p{font-size:11.6px;line-height:1.45;color:#343b34;font-weight:500}\n.zv-axis{display:grid;grid-template-columns:1fr 70px 1fr;align-items:center;gap:10px;padding:28mm 10mm}.zv-arrow{text-align:center;font-size:36px;color:#b99c62}\n.zv-card{border:1px solid #766b50;padding:16px;background:linear-gradient(145deg,#17211c,#223028);min-height:88px;color:#f7f0dc;box-shadow:0 10px 22px #00000024}.zv-card small{display:block;color:#d5cdb7;font-size:11px}.zv-card b{display:block;font-size:21px;margin:8px 0;color:#fff8e8}.zv-card p{font-size:13px;line-height:1.5;color:#ece3cb}\n.zv-svg{width:100%;height:auto;max-height:155mm}.zv-line{stroke:#a88c57;stroke-width:1.5}.zv-node{fill:var(--pal);fill-opacity:.88;stroke:#fff8e7;stroke-width:3;filter:drop-shadow(0 3px 8px #3d314044)}.zv-center{fill:#2b392f;stroke:#bda46d;stroke-width:2}.zv-svg text{fill:#fffdf5;font-size:14px;font-weight:700}.zv-svg text.en{font-size:10.5px;font-weight:600;opacity:1}\n.zv-star-list,.zv-star-grid,.zv-domains{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.zv-star-grid .zv-card{min-height:72px;padding:11px}.zv-star-grid .zv-card b small,.zv-card b small{display:block;font-size:11px;font-weight:500;color:#d8d2bd;margin-top:2px}.zv-star-cloud{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.zv-star-cloud span{border:1px solid #665b43;padding:10px 12px;font-size:13px;font-weight:650}.zv-star-cloud small{display:block;color:#596159;font-size:10.5px;font-weight:500}\n.zv-flow-sparse{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18mm}.zv-tx-card{min-height:70mm;border:1px solid color-mix(in srgb,var(--tx) 55%,#a38e65);background:linear-gradient(160deg,color-mix(in srgb,var(--tx) 18%,#fffdf7),#fffdf7);padding:16px;display:grid;grid-template-columns:36px 1fr;gap:10px;align-items:start;box-shadow:inset 0 6px 0 var(--tx),0 12px 24px color-mix(in srgb,var(--tx) 14%,transparent)}.zv-tx-card>span{font:26px Georgia;color:#9a7b3f}.zv-tx-card b,.zv-tx-card strong,.zv-tx-card em,.zv-tx-card small{display:block;margin:7px 0;color:#343a34}.zv-tx-card b small,.zv-tx-card strong small,.zv-tx-card em small,.zv-tx-card small small{display:block;font-size:9px;color:#777b70}.zv-tx-card em{font-style:normal;color:#8a6c39;font-size:18px}\n.zv-flow,.zv-timing{display:grid;gap:8px}.zv-flow-row{display:grid;grid-template-columns:34px 105px 1fr 105px 120px;align-items:center;border-left:5px solid var(--tx);border-bottom:1px solid #8e806455;padding:9px 10px;background:linear-gradient(90deg,color-mix(in srgb,var(--tx) 10%,#fff),#fff0)}.zv-flow-row{font-size:12px}.zv-flow-row b small,.zv-flow-row strong small,.zv-flow-row em small,.zv-flow-row small small{display:block;font-size:10.5px;font-weight:500;color:#5e655d}.zv-flow-row em{font-style:normal;color:#7c5c24;font-weight:700}.zv-flow-row small{color:#5e655d}\n.zv-focus{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.zv-focus-band{grid-column:1/-1;margin-top:8px}.zv-focus-band h4{margin:4px 0 9px;color:#5c492a;font-size:14px;font-weight:700}.zv-star-cloud{display:flex;flex-wrap:wrap;gap:8px}.zv-star-cloud span{border:1px solid color-mix(in srgb,var(--pal) 55%,#9a8d6d);background:linear-gradient(145deg,color-mix(in srgb,var(--pal) 15%,#fffdf6),#fffdf6);box-shadow:inset 3px 0 0 var(--pal);padding:8px 10px;color:#333a33}.zv-star-cloud em{display:block;font-style:normal;font-size:10.5px;color:#596159;font-weight:500}.zv-rel-tags{display:flex;flex-wrap:wrap;gap:7px}.zv-rel-tags span{padding:7px 10px;border:1px solid #9d855f;background:#fff8e9;font-size:11.5px;font-weight:600;color:#343a34}\n.zv-time-layer{display:grid;grid-template-columns:42px 1fr;gap:12px;border-left:6px solid var(--layer);padding:14px 16px;background:linear-gradient(90deg,color-mix(in srgb,var(--layer) 14%,#fffdf7),#fffdf7cc);box-shadow:0 8px 20px color-mix(in srgb,var(--layer) 10%,transparent)}.zv-time-layer.is-focus{border-left-width:9px;border-color:var(--layer);background:linear-gradient(90deg,color-mix(in srgb,var(--layer) 24%,#fff7df),#fff7df);box-shadow:0 10px 28px color-mix(in srgb,var(--layer) 18%,transparent)}.zv-time-layer>span{font:22px Georgia;color:#8a6a30}.zv-time-layer b,.zv-time-layer strong{display:block;color:#283028;font-size:14px}.zv-time-layer b small,.zv-time-layer strong small{display:inline;margin-left:6px;font-size:11px;color:#5e655d}.zv-time-layer ul{display:grid;grid-template-columns:repeat(2,1fr);gap:7px 12px;margin:10px 0 0;padding:0;list-style:none}.zv-time-layer li{font-size:12px;line-height:1.42;color:#343b34;font-weight:500}.zv-time-layer li small{display:inline;font-size:10.5px;color:#606860}.zv-current-tx{margin-top:8px}.zv-current-tx h4{margin:8px 0;color:#6d5934}\n.zv-empty{padding:30mm;text-align:center;color:#d19c9c}\n.zv-closing-page{padding:0}.zv-closing-art{position:absolute!important;inset:0;z-index:0!important;overflow:hidden}.zv-closing-art>img:first-child{width:100%;height:100%;object-fit:cover;opacity:.9}.zv-closing-motif{position:absolute;right:4%;bottom:8%;width:40%;opacity:.14}.zv-closing{position:relative;z-index:2;margin:25mm 18mm 0;padding:14mm;background:#fffdf3df;border:1px solid #b29d6d77;color:#2d332d}.zv-closing>span{font:42px Georgia;color:#9a7b3f}.zv-closing h1{font:600 34px/1.3 Georgia,\"Noto Serif SC\",serif;margin:8px 0 2px}.zv-closing h2{font-size:18px;color:#716d5e;margin:0 0 20px}.zv-closing>p{font-size:14px;line-height:1.7}.zv-closing-points{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}.zv-closing-points article{border-top:2px solid #a98b54;padding:10px}.zv-closing-points b{font:20px Georgia;color:#9a7b3f}.zv-closing-points p{font-size:11px;line-height:1.5}.zv-closing-points small{font-size:9.5px;line-height:1.4;color:#6d7168}\n.zv-master-summary{margin-top:5mm;padding:8mm}.zv-master-summary .zv-sec{font-size:34px}.zv-master-summary h1{font-size:26px}.zv-master-summary h2{font-size:15px;margin-bottom:10px}.zv-summary-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.zv-summary-insights>div{background:#fffdf7d6;border-top:2px solid #a88a53;padding:8px}.zv-summary-insights b{font-size:11px;color:#7a6339}.zv-summary-insights p{font-size:9.5px;line-height:1.35;margin:5px 0}.zv-summary-insights small{font-size:8px;line-height:1.3;color:#70756c}.zv-master-summary .zv-diagram{margin-top:8px;padding:10px}.zv-master-summary .zv-diagram figcaption{margin-bottom:8px}.zv-master-summary .zv-domains{grid-template-columns:repeat(3,1fr);gap:6px}.zv-master-summary .zv-card{min-height:54px;padding:7px}.zv-master-summary .zv-card b{font-size:12px;margin:3px 0}.zv-master-summary .zv-card p{font-size:8px}\n@media(max-width:900px){.zv-page{width:100%;height:auto;min-height:760px;margin:0;padding:28px}.zv-page header,.zv-page footer{left:28px;right:28px}.zv-insights,.zv-copy-grid,.zv-star-list,.zv-domains,.zv-focus{grid-template-columns:1fr}.zv-palace-grid{grid-template-columns:repeat(2,1fr)}}\n@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}html,body{background:#fff}.review-shell{display:none}.zv-page{margin:0;width:210mm;height:297mm;box-shadow:none!important;break-after:page;page-break-after:always}.zv-page *{box-shadow:none!important;text-shadow:none!important;filter:none!important;backdrop-filter:none!important}.zv-body-bg{filter:none!important;opacity:.42!important}.zv-body-motif,.zv-motif,.zv-closing-motif{filter:none!important;opacity:.12!important}.zv-hero{filter:none!important}.zv-page:last-child{break-after:auto;page-break-after:auto}}\n";
diff --git a/content/reports/method-publication-profiles-v1.json b/content/reports/method-publication-profiles-v1.json
new file mode 100644
index 00000000..92a87f08
--- /dev/null
+++ b/content/reports/method-publication-profiles-v1.json
@@ -0,0 +1,1020 @@
+{
+  "schemaVersion": "METHOD_PUBLICATION_PROFILE_INDEX_V1",
+  "authority": "NATIVE_OWNER_REFERENCES_ONLY",
+  "sourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "unresolvedValuesMayNotBeInvented": true,
+  "profiles": [
+    {
+      "methodId": "ZWR",
+      "productId": "COM-REPORT-ZIWEI-FULL",
+      "version": "ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3",
+      "predecessor": "ZIWEI-PROFESSIONAL-SYNTHESIS-R5-GENERATION-v1",
+      "calculationAuthority": {
+        "owner": "functions/personal-reading/narrative/ziwei-publication-adapter.js"
+      },
+      "meaningAuthority": {
+        "owner": "functions/personal-reading/visual-first/ziwei-vfr-production-deep-composer.js"
+      },
+      "sourceAuthorityRefs": [
+        "docs/reports/ziwei/vfr-r1/PRODUCTION-CUTOVER.json"
+      ],
+      "sourceAuthorityDigests": {
+        "docs/reports/ziwei/vfr-r1/PRODUCTION-CUTOVER.json": "f4e2b428dc6ee06e39690c957f73cff39fac01985530568f9dcc5e6773d20fcd"
+      },
+      "acceptedSourceRefs": [
+        "docs/reports/ziwei/vfr-r1/DEEP-PUBLICATION-IR.json",
+        "docs/reports/ziwei/vfr-r1/five-call-experiment/REPAIRED-RESULT.json"
+      ],
+      "humanDecisionRefs": [
+        "docs/reports/ziwei/vfr-r1/HUMAN-DECISION.json"
+      ],
+      "semanticIrVersion": "ZWR-VFR-R1-COMPACT-AUTHORING-PACK-v1",
+      "manuscriptVersion": "ZWR-VFR-R1-FIVE-CALL-DEEP-MANUSCRIPT-v1",
+      "publicationIrVersion": "ZWR-VFR-R1-DEEP-PUBLICATION-IR-v1",
+      "sectionOwnership": {
+        "owner": "functions/personal-reading/visual-first/ziwei-vfr-authoring-pack.js"
+      },
+      "allowedModes": [
+        "BILINGUAL"
+      ],
+      "pagePlanVersion": "ZWR-VFR-R1-ADAPTIVE-LANGUAGE-SEQUENTIAL-v6",
+      "pagePlanPolicy": "ADAPTIVE_REFLOW",
+      "orientation": "PORTRAIT",
+      "pageMargins": {
+        "owner": "assets/customer-ui/js/personal-products/ziwei-vfr-r1-styles.js"
+      },
+      "diagramRegistryRef": "functions/personal-reading/visual-first/ziwei-vfr-diagram-data.js",
+      "diagramCountPolicy": {
+        "count": 15,
+        "scope": "ZWR_CURRENT_VFR_VERSION_ONLY"
+      },
+      "diagramRequiredIds": [
+        "ZWD-01",
+        "ZWD-02",
+        "ZWD-03",
+        "ZWD-04",
+        "ZWD-05",
+        "ZWD-06",
+        "ZWD-07",
+        "ZWD-08",
+        "ZWD-09",
+        "ZWD-10",
+        "ZWD-11",
+        "ZWD-12",
+        "ZWD-13",
+        "ZWD-14",
+        "ZWD-15"
+      ],
+      "diagramDataOwner": "functions/personal-reading/visual-first/ziwei-vfr-diagram-data.js",
+      "diagramTopologyOwner": "assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js",
+      "headingPolicy": {
+        "owner": "assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js",
+        "policy": "PRESERVE_ACCEPTED_BILINGUAL_HEADINGS"
+      },
+      "paragraphPolicy": {
+        "owner": "assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js",
+        "policy": "PRESERVE_PARAGRAPH_BOUNDARIES_WEIGHTED_PARTITION"
+      },
+      "sourceSpanPolicy": {
+        "owner": "functions/report-delivery/ziwei-vfr-method-profile.js",
+        "policy": "EXACT_MANUSCRIPT_PARAGRAPH_AND_AUTHORITY_REF_COVERAGE"
+      },
+      "minimumReadableTypography": {
+        "owner": "assets/customer-ui/js/personal-products/ziwei-vfr-r1-styles.js",
+        "policy": "EXACT_ACCEPTED_W9_STYLE_BYTES"
+      },
+      "contrastPolicy": {
+        "owner": "assets/customer-ui/js/personal-products/ziwei-vfr-r1-styles.js",
+        "policy": "PRESERVE_ACCEPTED_REFERENCE"
+      },
+      "layoutCapacityProfile": {
+        "owner": "functions/personal-reading/visual-first/ziwei-vfr-page-plan.js",
+        "policy": "NATIVE_ADAPTIVE_FIT_VALIDATION"
+      },
+      "normalCallPlanRef": "functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js",
+      "batchPlan": {
+        "owner": "functions/personal-reading/visual-first/ziwei-vfr-five-call-manuscript.js"
+      },
+      "generationBudget": {
+        "owner": "functions/personal-reading/visual-first/ziwei-vfr-production-deep-composer.js"
+      },
+      "repairPolicy": {
+        "owner": "functions/personal-reading/visual-first/ziwei-vfr-targeted-repair.js"
+      },
+      "semanticCacheKeySchema": {
+        "owner": "functions/report-delivery/ziwei-vfr-r1-generation.js",
+        "schemaVersion": "METHOD_SEMANTIC_CACHE_KEY_V1"
+      },
+      "publicationCacheKeySchema": {
+        "owner": "functions/account/ziwei-account-delivery.js",
+        "schemaVersion": "METHOD_PUBLICATION_CACHE_KEY_V1"
+      },
+      "subjectOwner": "functions/account/canonical-person-store.js",
+      "entitlementOwner": "functions/report-delivery/ziwei-production-generation-v1.js",
+      "releaseOwner": "functions/account/ziwei-controlled-report-material.js",
+      "materialStoreOwner": "functions/account/method-report-material.js",
+      "rendererContract": {
+        "owner": "functions/report-delivery/ziwei-vfr-method-profile.js",
+        "renderer": "ZWR-VFR-R1-DEEP-RENDERER-v6"
+      },
+      "requiredReceipts": [
+        "METHOD_GENERATION",
+        "PRIVATE_RENDERER",
+        "RELEASE",
+        "SHARED_LIVE_E2E"
+      ],
+      "methodSpecificNegativeCases": [
+        "LEGACY_RENDERER_FOR_VFR_DENIED",
+        "PAGE_PLAN_TAMPERING_DENIED",
+        "DIAGRAM_DRIFT_DENIED"
+      ],
+      "publicationProviderRule": 0,
+      "rerenderProviderRule": 0,
+      "reopenProviderRule": 0,
+      "unresolvedFields": [],
+      "status": "LOCAL_PROFILE_RESOLVED",
+      "profileVersion": "ZWR-VFR-R1-METHOD-PUBLICATION-PROFILE-v1",
+      "nativeResolvedPolicyRef": "functions/report-delivery/ziwei-vfr-profile-policy.js",
+      "productionAdmission": "BLOCKED",
+      "contentHumanAcceptance": "EXISTING_ACCEPTED_REFERENCE",
+      "profileDigest": "f285163e352e584d1799f9c572412a4d1a04115baec6c5a64f32fdb0452adf22"
+    },
+    {
+      "methodId": "BZR",
+      "productId": null,
+      "version": "DEEP_MANUSCRIPT_R2_READABILITY_R4",
+      "profileDigest": "f2f2b4b462d699d0ff48b80dcc2181618126806060af559e252a78dcb07a9a4c",
+      "predecessor": null,
+      "calculationAuthority": null,
+      "meaningAuthority": null,
+      "sourceAuthorityRefs": [
+        "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-08T01-19-39-266Z/HUMAN-VISUAL-ACCEPTANCE-R2.json"
+      ],
+      "sourceAuthorityDigests": {
+        "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-08T01-19-39-266Z/HUMAN-VISUAL-ACCEPTANCE-R2.json": "504cbdd2ec498afde94120a74e068ea87e1512e1d498c8547f9d2855cbf7b189"
+      },
+      "acceptedSourceRefs": [
+        "tools/review/BAZI-DEEP-MANUSCRIPT-R2-PUBLICATION-REVIEW-R2-BILINGUAL.html",
+        "tools/review/BAZI-DEEP-MANUSCRIPT-R2-PUBLICATION-REVIEW-R2-EN.html",
+        "tools/review/BAZI-DEEP-MANUSCRIPT-R2-PUBLICATION-REVIEW-R2-ZH-HANS.html"
+      ],
+      "humanDecisionRefs": [
+        "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-08T01-19-39-266Z/HUMAN-VISUAL-ACCEPTANCE-R2.json"
+      ],
+      "semanticIrVersion": null,
+      "manuscriptVersion": null,
+      "publicationIrVersion": null,
+      "sectionOwnership": null,
+      "allowedModes": [
+        "BILINGUAL",
+        "EN",
+        "ZH_HANS"
+      ],
+      "pagePlanVersion": null,
+      "pagePlanPolicy": "FIXED",
+      "orientation": null,
+      "pageMargins": null,
+      "diagramRegistryRef": null,
+      "diagramCountPolicy": {
+        "count": 15,
+        "scope": "THIS_ACCEPTED_PROFILE_ONLY"
+      },
+      "diagramRequiredIds": null,
+      "diagramDataOwner": null,
+      "diagramTopologyOwner": null,
+      "headingPolicy": null,
+      "paragraphPolicy": null,
+      "sourceSpanPolicy": null,
+      "minimumReadableTypography": null,
+      "contrastPolicy": null,
+      "layoutCapacityProfile": {
+        "pageCount": 48,
+        "scope": "THIS_ACCEPTED_PROFILE_ONLY"
+      },
+      "normalCallPlanRef": null,
+      "batchPlan": null,
+      "generationBudget": null,
+      "repairPolicy": null,
+      "semanticCacheKeySchema": null,
+      "publicationCacheKeySchema": null,
+      "subjectOwner": null,
+      "entitlementOwner": null,
+      "releaseOwner": null,
+      "materialStoreOwner": null,
+      "rendererContract": {
+        "owner": "functions/personal-reading/publication-fit/bazi-publication-layout-profiles.js"
+      },
+      "requiredReceipts": null,
+      "methodSpecificNegativeCases": null,
+      "publicationProviderRule": 0,
+      "rerenderProviderRule": 0,
+      "reopenProviderRule": 0,
+      "unresolvedFields": [
+        "productId",
+        "predecessor",
+        "calculationAuthority",
+        "meaningAuthority",
+        "semanticIrVersion",
+        "manuscriptVersion",
+        "publicationIrVersion",
+        "sectionOwnership",
+        "pagePlanVersion",
+        "orientation",
+        "pageMargins",
+        "diagramRegistryRef",
+        "diagramRequiredIds",
+        "diagramDataOwner",
+        "diagramTopologyOwner",
+        "headingPolicy",
+        "paragraphPolicy",
+        "sourceSpanPolicy",
+        "minimumReadableTypography",
+        "contrastPolicy",
+        "normalCallPlanRef",
+        "batchPlan",
+        "generationBudget",
+        "repairPolicy",
+        "semanticCacheKeySchema",
+        "publicationCacheKeySchema",
+        "subjectOwner",
+        "entitlementOwner",
+        "releaseOwner",
+        "materialStoreOwner",
+        "requiredReceipts",
+        "methodSpecificNegativeCases"
+      ],
+      "status": "PROFILE_GATE_OPEN"
+    },
+    {
+      "methodId": "AST",
+      "productId": null,
+      "version": null,
+      "profileDigest": "cd4347fc4ea5d7509e6152c90c2717f5b029bdf7b2160d9d975ad376e00d35e2",
+      "predecessor": null,
+      "calculationAuthority": null,
+      "meaningAuthority": null,
+      "sourceAuthorityRefs": [
+        "content/professional/ast-full-production/admission/ast-fp-r4a-professional-semantic-human-admission-v1.json"
+      ],
+      "sourceAuthorityDigests": {
+        "content/professional/ast-full-production/admission/ast-fp-r4a-professional-semantic-human-admission-v1.json": "1f03127c8a03aeb0db15ebb80d123096e59481d663b861091fa078f127b2f66c"
+      },
+      "acceptedSourceRefs": null,
+      "humanDecisionRefs": null,
+      "semanticIrVersion": null,
+      "manuscriptVersion": null,
+      "publicationIrVersion": null,
+      "sectionOwnership": null,
+      "allowedModes": null,
+      "pagePlanVersion": null,
+      "pagePlanPolicy": null,
+      "orientation": null,
+      "pageMargins": null,
+      "diagramRegistryRef": null,
+      "diagramCountPolicy": null,
+      "diagramRequiredIds": null,
+      "diagramDataOwner": null,
+      "diagramTopologyOwner": null,
+      "headingPolicy": null,
+      "paragraphPolicy": null,
+      "sourceSpanPolicy": null,
+      "minimumReadableTypography": null,
+      "contrastPolicy": null,
+      "layoutCapacityProfile": null,
+      "normalCallPlanRef": null,
+      "batchPlan": null,
+      "generationBudget": null,
+      "repairPolicy": null,
+      "semanticCacheKeySchema": null,
+      "publicationCacheKeySchema": null,
+      "subjectOwner": null,
+      "entitlementOwner": null,
+      "releaseOwner": null,
+      "materialStoreOwner": null,
+      "rendererContract": null,
+      "requiredReceipts": null,
+      "methodSpecificNegativeCases": null,
+      "publicationProviderRule": 0,
+      "rerenderProviderRule": 0,
+      "reopenProviderRule": 0,
+      "unresolvedFields": [
+        "productId",
+        "version",
+        "predecessor",
+        "calculationAuthority",
+        "meaningAuthority",
+        "acceptedSourceRefs",
+        "humanDecisionRefs",
+        "semanticIrVersion",
+        "manuscriptVersion",
+        "publicationIrVersion",
+        "sectionOwnership",
+        "allowedModes",
+        "pagePlanVersion",
+        "pagePlanPolicy",
+        "orientation",
+        "pageMargins",
+        "diagramRegistryRef",
+        "diagramCountPolicy",
+        "diagramRequiredIds",
+        "diagramDataOwner",
+        "diagramTopologyOwner",
+        "headingPolicy",
+        "paragraphPolicy",
+        "sourceSpanPolicy",
+        "minimumReadableTypography",
+        "contrastPolicy",
+        "layoutCapacityProfile",
+        "normalCallPlanRef",
+        "batchPlan",
+        "generationBudget",
+        "repairPolicy",
+        "semanticCacheKeySchema",
+        "publicationCacheKeySchema",
+        "subjectOwner",
+        "entitlementOwner",
+        "releaseOwner",
+        "materialStoreOwner",
+        "rendererContract",
+        "requiredReceipts",
+        "methodSpecificNegativeCases"
+      ],
+      "status": "PROFILE_GATE_OPEN"
+    },
+    {
+      "methodId": "NUM",
+      "productId": null,
+      "version": null,
+      "profileDigest": "1c8b3aa55129dda0c7356dcc695873376353f51b14cddf7fec7a02841a871170",
+      "predecessor": null,
+      "calculationAuthority": null,
+      "meaningAuthority": null,
+      "sourceAuthorityRefs": [
+        "content/professional/num-production/expansion-r9-r18/admission/num-r18-full-production-cutover-v1.json"
+      ],
+      "sourceAuthorityDigests": {
+        "content/professional/num-production/expansion-r9-r18/admission/num-r18-full-production-cutover-v1.json": "832e2a96409f25e12d085174a70006ec702e42dc1013750acf11a87e329f1d63"
+      },
+      "acceptedSourceRefs": null,
+      "humanDecisionRefs": null,
+      "semanticIrVersion": null,
+      "manuscriptVersion": null,
+      "publicationIrVersion": null,
+      "sectionOwnership": null,
+      "allowedModes": null,
+      "pagePlanVersion": null,
+      "pagePlanPolicy": null,
+      "orientation": null,
+      "pageMargins": null,
+      "diagramRegistryRef": null,
+      "diagramCountPolicy": null,
+      "diagramRequiredIds": null,
+      "diagramDataOwner": null,
+      "diagramTopologyOwner": null,
+      "headingPolicy": null,
+      "paragraphPolicy": null,
+      "sourceSpanPolicy": null,
+      "minimumReadableTypography": null,
+      "contrastPolicy": null,
+      "layoutCapacityProfile": null,
+      "normalCallPlanRef": null,
+      "batchPlan": null,
+      "generationBudget": null,
+      "repairPolicy": null,
+      "semanticCacheKeySchema": null,
+      "publicationCacheKeySchema": null,
+      "subjectOwner": null,
+      "entitlementOwner": null,
+      "releaseOwner": null,
+      "materialStoreOwner": null,
+      "rendererContract": null,
+      "requiredReceipts": null,
+      "methodSpecificNegativeCases": null,
+      "publicationProviderRule": 0,
+      "rerenderProviderRule": 0,
+      "reopenProviderRule": 0,
+      "unresolvedFields": [
+        "productId",
+        "version",
+        "predecessor",
+        "calculationAuthority",
+        "meaningAuthority",
+        "acceptedSourceRefs",
+        "humanDecisionRefs",
+        "semanticIrVersion",
+        "manuscriptVersion",
+        "publicationIrVersion",
+        "sectionOwnership",
+        "allowedModes",
+        "pagePlanVersion",
+        "pagePlanPolicy",
+        "orientation",
+        "pageMargins",
+        "diagramRegistryRef",
+        "diagramCountPolicy",
+        "diagramRequiredIds",
+        "diagramDataOwner",
+        "diagramTopologyOwner",
+        "headingPolicy",
+        "paragraphPolicy",
+        "sourceSpanPolicy",
+        "minimumReadableTypography",
+        "contrastPolicy",
+        "layoutCapacityProfile",
+        "normalCallPlanRef",
+        "batchPlan",
+        "generationBudget",
+        "repairPolicy",
+        "semanticCacheKeySchema",
+        "publicationCacheKeySchema",
+        "subjectOwner",
+        "entitlementOwner",
+        "releaseOwner",
+        "materialStoreOwner",
+        "rendererContract",
+        "requiredReceipts",
+        "methodSpecificNegativeCases"
+      ],
+      "status": "PROFILE_GATE_OPEN"
+    },
+    {
+      "methodId": "PROFILE",
+      "productId": null,
+      "version": null,
+      "profileDigest": "99eb57201ed6df98af3beffec6c222a912275fdbbe1f7e12de8d27556ab75831",
+      "predecessor": null,
+      "calculationAuthority": null,
+      "meaningAuthority": null,
+      "sourceAuthorityRefs": [
+        "content/profile/successors/personal-evidence-r1/personal-evidence-dossier-publication-v1.json"
+      ],
+      "sourceAuthorityDigests": {
+        "content/profile/successors/personal-evidence-r1/personal-evidence-dossier-publication-v1.json": "1732b97da9ff199a128b49f81ffa63b725f54562f6bbbc7ebfc135a2d73d2e69"
+      },
+      "acceptedSourceRefs": null,
+      "humanDecisionRefs": null,
+      "semanticIrVersion": null,
+      "manuscriptVersion": null,
+      "publicationIrVersion": null,
+      "sectionOwnership": null,
+      "allowedModes": [
+        "BILINGUAL"
+      ],
+      "pagePlanVersion": null,
+      "pagePlanPolicy": null,
+      "orientation": null,
+      "pageMargins": null,
+      "diagramRegistryRef": null,
+      "diagramCountPolicy": null,
+      "diagramRequiredIds": null,
+      "diagramDataOwner": null,
+      "diagramTopologyOwner": null,
+      "headingPolicy": null,
+      "paragraphPolicy": null,
+      "sourceSpanPolicy": null,
+      "minimumReadableTypography": null,
+      "contrastPolicy": null,
+      "layoutCapacityProfile": null,
+      "normalCallPlanRef": null,
+      "batchPlan": null,
+      "generationBudget": null,
+      "repairPolicy": null,
+      "semanticCacheKeySchema": null,
+      "publicationCacheKeySchema": null,
+      "subjectOwner": null,
+      "entitlementOwner": null,
+      "releaseOwner": null,
+      "materialStoreOwner": null,
+      "rendererContract": null,
+      "requiredReceipts": null,
+      "methodSpecificNegativeCases": null,
+      "publicationProviderRule": 0,
+      "rerenderProviderRule": 0,
+      "reopenProviderRule": 0,
+      "unresolvedFields": [
+        "productId",
+        "version",
+        "predecessor",
+        "calculationAuthority",
+        "meaningAuthority",
+        "acceptedSourceRefs",
+        "humanDecisionRefs",
+        "semanticIrVersion",
+        "manuscriptVersion",
+        "publicationIrVersion",
+        "sectionOwnership",
+        "pagePlanVersion",
+        "pagePlanPolicy",
+        "orientation",
+        "pageMargins",
+        "diagramRegistryRef",
+        "diagramCountPolicy",
+        "diagramRequiredIds",
+        "diagramDataOwner",
+        "diagramTopologyOwner",
+        "headingPolicy",
+        "paragraphPolicy",
+        "sourceSpanPolicy",
+        "minimumReadableTypography",
+        "contrastPolicy",
+        "layoutCapacityProfile",
+        "normalCallPlanRef",
+        "batchPlan",
+        "generationBudget",
+        "repairPolicy",
+        "semanticCacheKeySchema",
+        "publicationCacheKeySchema",
+        "subjectOwner",
+        "entitlementOwner",
+        "releaseOwner",
+        "materialStoreOwner",
+        "rendererContract",
+        "requiredReceipts",
+        "methodSpecificNegativeCases"
+      ],
+      "status": "PROFILE_GATE_OPEN"
+    },
+    {
+      "methodId": "ECR",
+      "productId": null,
+      "version": null,
+      "profileDigest": "8defe6be4705732645282d25179cc0343dd5780c27a0f53450ed9527dfea3917",
+      "predecessor": null,
+      "calculationAuthority": null,
+      "meaningAuthority": null,
+      "sourceAuthorityRefs": [
+        "content/embodied-configuration/v4-1/admission/ecr-customer-production-admission-r5.json"
+      ],
+      "sourceAuthorityDigests": {
+        "content/embodied-configuration/v4-1/admission/ecr-customer-production-admission-r5.json": "2474d19677f2aaeff5200cc97cc2ed34ea6f566209b353ee2429404931553d0a"
+      },
+      "acceptedSourceRefs": null,
+      "humanDecisionRefs": null,
+      "semanticIrVersion": null,
+      "manuscriptVersion": null,
+      "publicationIrVersion": null,
+      "sectionOwnership": null,
+      "allowedModes": null,
+      "pagePlanVersion": null,
+      "pagePlanPolicy": null,
+      "orientation": null,
+      "pageMargins": null,
+      "diagramRegistryRef": null,
+      "diagramCountPolicy": null,
+      "diagramRequiredIds": null,
+      "diagramDataOwner": null,
+      "diagramTopologyOwner": null,
+      "headingPolicy": null,
+      "paragraphPolicy": null,
+      "sourceSpanPolicy": null,
+      "minimumReadableTypography": null,
+      "contrastPolicy": null,
+      "layoutCapacityProfile": null,
+      "normalCallPlanRef": null,
+      "batchPlan": null,
+      "generationBudget": null,
+      "repairPolicy": null,
+      "semanticCacheKeySchema": null,
+      "publicationCacheKeySchema": null,
+      "subjectOwner": null,
+      "entitlementOwner": null,
+      "releaseOwner": null,
+      "materialStoreOwner": null,
+      "rendererContract": null,
+      "requiredReceipts": null,
+      "methodSpecificNegativeCases": null,
+      "publicationProviderRule": 0,
+      "rerenderProviderRule": 0,
+      "reopenProviderRule": 0,
+      "unresolvedFields": [
+        "productId",
+        "version",
+        "predecessor",
+        "calculationAuthority",
+        "meaningAuthority",
+        "acceptedSourceRefs",
+        "humanDecisionRefs",
+        "semanticIrVersion",
+        "manuscriptVersion",
+        "publicationIrVersion",
+        "sectionOwnership",
+        "allowedModes",
+        "pagePlanVersion",
+        "pagePlanPolicy",
+        "orientation",
+        "pageMargins",
+        "diagramRegistryRef",
+        "diagramCountPolicy",
+        "diagramRequiredIds",
+        "diagramDataOwner",
+        "diagramTopologyOwner",
+        "headingPolicy",
+        "paragraphPolicy",
+        "sourceSpanPolicy",
+        "minimumReadableTypography",
+        "contrastPolicy",
+        "layoutCapacityProfile",
+        "normalCallPlanRef",
+        "batchPlan",
+        "generationBudget",
+        "repairPolicy",
+        "semanticCacheKeySchema",
+        "publicationCacheKeySchema",
+        "subjectOwner",
+        "entitlementOwner",
+        "releaseOwner",
+        "materialStoreOwner",
+        "rendererContract",
+        "requiredReceipts",
+        "methodSpecificNegativeCases"
+      ],
+      "status": "PROFILE_GATE_OPEN"
+    },
+    {
+      "methodId": "HD",
+      "productId": null,
+      "version": null,
+      "profileDigest": "180a16935c8d0bf1288a01c226223a324602e7e61f1d0b5b5cd4d9743433102e",
+      "predecessor": null,
+      "calculationAuthority": null,
+      "meaningAuthority": null,
+      "sourceAuthorityRefs": [
+        "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/production/HD-PRO-R3-W25-production-cutover-v1.json"
+      ],
+      "sourceAuthorityDigests": {
+        "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/production/HD-PRO-R3-W25-production-cutover-v1.json": "bc9e32ba6388777098badaa5c02589b4eb8d259f980fb61455f781a0204f78d3"
+      },
+      "acceptedSourceRefs": null,
+      "humanDecisionRefs": null,
+      "semanticIrVersion": null,
+      "manuscriptVersion": null,
+      "publicationIrVersion": null,
+      "sectionOwnership": null,
+      "allowedModes": null,
+      "pagePlanVersion": null,
+      "pagePlanPolicy": null,
+      "orientation": null,
+      "pageMargins": null,
+      "diagramRegistryRef": null,
+      "diagramCountPolicy": null,
+      "diagramRequiredIds": null,
+      "diagramDataOwner": null,
+      "diagramTopologyOwner": null,
+      "headingPolicy": null,
+      "paragraphPolicy": null,
+      "sourceSpanPolicy": null,
+      "minimumReadableTypography": null,
+      "contrastPolicy": null,
+      "layoutCapacityProfile": null,
+      "normalCallPlanRef": null,
+      "batchPlan": null,
+      "generationBudget": null,
+      "repairPolicy": null,
+      "semanticCacheKeySchema": null,
+      "publicationCacheKeySchema": null,
+      "subjectOwner": null,
+      "entitlementOwner": null,
+      "releaseOwner": null,
+      "materialStoreOwner": null,
+      "rendererContract": null,
+      "requiredReceipts": null,
+      "methodSpecificNegativeCases": null,
+      "publicationProviderRule": 0,
+      "rerenderProviderRule": 0,
+      "reopenProviderRule": 0,
+      "unresolvedFields": [
+        "productId",
+        "version",
+        "predecessor",
+        "calculationAuthority",
+        "meaningAuthority",
+        "acceptedSourceRefs",
+        "humanDecisionRefs",
+        "semanticIrVersion",
+        "manuscriptVersion",
+        "publicationIrVersion",
+        "sectionOwnership",
+        "allowedModes",
+        "pagePlanVersion",
+        "pagePlanPolicy",
+        "orientation",
+        "pageMargins",
+        "diagramRegistryRef",
+        "diagramCountPolicy",
+        "diagramRequiredIds",
+        "diagramDataOwner",
+        "diagramTopologyOwner",
+        "headingPolicy",
+        "paragraphPolicy",
+        "sourceSpanPolicy",
+        "minimumReadableTypography",
+        "contrastPolicy",
+        "layoutCapacityProfile",
+        "normalCallPlanRef",
+        "batchPlan",
+        "generationBudget",
+        "repairPolicy",
+        "semanticCacheKeySchema",
+        "publicationCacheKeySchema",
+        "subjectOwner",
+        "entitlementOwner",
+        "releaseOwner",
+        "materialStoreOwner",
+        "rendererContract",
+        "requiredReceipts",
+        "methodSpecificNegativeCases"
+      ],
+      "status": "PROFILE_GATE_OPEN"
+    },
+    {
+      "methodId": "FINANCIAL",
+      "productId": null,
+      "version": null,
+      "profileDigest": "b96e5e34798d4c1c454d57a8fa27f4a623aee737013dd431a97829765d0fe605",
+      "predecessor": null,
+      "calculationAuthority": null,
+      "meaningAuthority": null,
+      "sourceAuthorityRefs": [
+        "functions/professional/reports/financial-report-contract.js"
+      ],
+      "sourceAuthorityDigests": {
+        "functions/professional/reports/financial-report-contract.js": "e9ac32f57358e6eaad4dfaefb4faf67924928800084ac87ef29fc6b754a37323"
+      },
+      "acceptedSourceRefs": null,
+      "humanDecisionRefs": null,
+      "semanticIrVersion": null,
+      "manuscriptVersion": null,
+      "publicationIrVersion": null,
+      "sectionOwnership": null,
+      "allowedModes": [
+        "BILINGUAL"
+      ],
+      "pagePlanVersion": null,
+      "pagePlanPolicy": null,
+      "orientation": null,
+      "pageMargins": null,
+      "diagramRegistryRef": null,
+      "diagramCountPolicy": null,
+      "diagramRequiredIds": null,
+      "diagramDataOwner": null,
+      "diagramTopologyOwner": null,
+      "headingPolicy": null,
+      "paragraphPolicy": null,
+      "sourceSpanPolicy": null,
+      "minimumReadableTypography": null,
+      "contrastPolicy": null,
+      "layoutCapacityProfile": null,
+      "normalCallPlanRef": null,
+      "batchPlan": null,
+      "generationBudget": null,
+      "repairPolicy": null,
+      "semanticCacheKeySchema": null,
+      "publicationCacheKeySchema": null,
+      "subjectOwner": null,
+      "entitlementOwner": null,
+      "releaseOwner": null,
+      "materialStoreOwner": null,
+      "rendererContract": null,
+      "requiredReceipts": null,
+      "methodSpecificNegativeCases": null,
+      "publicationProviderRule": 0,
+      "rerenderProviderRule": 0,
+      "reopenProviderRule": 0,
+      "unresolvedFields": [
+        "productId",
+        "version",
+        "predecessor",
+        "calculationAuthority",
+        "meaningAuthority",
+        "acceptedSourceRefs",
+        "humanDecisionRefs",
+        "semanticIrVersion",
+        "manuscriptVersion",
+        "publicationIrVersion",
+        "sectionOwnership",
+        "pagePlanVersion",
+        "pagePlanPolicy",
+        "orientation",
+        "pageMargins",
+        "diagramRegistryRef",
+        "diagramCountPolicy",
+        "diagramRequiredIds",
+        "diagramDataOwner",
+        "diagramTopologyOwner",
+        "headingPolicy",
+        "paragraphPolicy",
+        "sourceSpanPolicy",
+        "minimumReadableTypography",
+        "contrastPolicy",
+        "layoutCapacityProfile",
+        "normalCallPlanRef",
+        "batchPlan",
+        "generationBudget",
+        "repairPolicy",
+        "semanticCacheKeySchema",
+        "publicationCacheKeySchema",
+        "subjectOwner",
+        "entitlementOwner",
+        "releaseOwner",
+        "materialStoreOwner",
+        "rendererContract",
+        "requiredReceipts",
+        "methodSpecificNegativeCases"
+      ],
+      "status": "PROFILE_GATE_OPEN"
+    },
+    {
+      "methodId": "WILL",
+      "productId": null,
+      "version": null,
+      "profileDigest": "093681dc92ab79c3c6ca30723dc964aba63128b1f60b2ff798843c6454cc365c",
+      "predecessor": null,
+      "calculationAuthority": null,
+      "meaningAuthority": null,
+      "sourceAuthorityRefs": [
+        "functions/professional/financial/testamentary-report-v1.js"
+      ],
+      "sourceAuthorityDigests": {
+        "functions/professional/financial/testamentary-report-v1.js": "0c99733273223a8bf3fd8fee6c99065d0881ff7d506410957c051687058cb6aa"
+      },
+      "acceptedSourceRefs": null,
+      "humanDecisionRefs": null,
+      "semanticIrVersion": null,
+      "manuscriptVersion": null,
+      "publicationIrVersion": null,
+      "sectionOwnership": null,
+      "allowedModes": [
+        "BILINGUAL"
+      ],
+      "pagePlanVersion": null,
+      "pagePlanPolicy": null,
+      "orientation": null,
+      "pageMargins": null,
+      "diagramRegistryRef": null,
+      "diagramCountPolicy": null,
+      "diagramRequiredIds": null,
+      "diagramDataOwner": null,
+      "diagramTopologyOwner": null,
+      "headingPolicy": null,
+      "paragraphPolicy": null,
+      "sourceSpanPolicy": null,
+      "minimumReadableTypography": null,
+      "contrastPolicy": null,
+      "layoutCapacityProfile": null,
+      "normalCallPlanRef": null,
+      "batchPlan": null,
+      "generationBudget": null,
+      "repairPolicy": null,
+      "semanticCacheKeySchema": null,
+      "publicationCacheKeySchema": null,
+      "subjectOwner": null,
+      "entitlementOwner": null,
+      "releaseOwner": null,
+      "materialStoreOwner": null,
+      "rendererContract": null,
+      "requiredReceipts": null,
+      "methodSpecificNegativeCases": null,
+      "publicationProviderRule": 0,
+      "rerenderProviderRule": 0,
+      "reopenProviderRule": 0,
+      "unresolvedFields": [
+        "productId",
+        "version",
+        "predecessor",
+        "calculationAuthority",
+        "meaningAuthority",
+        "acceptedSourceRefs",
+        "humanDecisionRefs",
+        "semanticIrVersion",
+        "manuscriptVersion",
+        "publicationIrVersion",
+        "sectionOwnership",
+        "pagePlanVersion",
+        "pagePlanPolicy",
+        "orientation",
+        "pageMargins",
+        "diagramRegistryRef",
+        "diagramCountPolicy",
+        "diagramRequiredIds",
+        "diagramDataOwner",
+        "diagramTopologyOwner",
+        "headingPolicy",
+        "paragraphPolicy",
+        "sourceSpanPolicy",
+        "minimumReadableTypography",
+        "contrastPolicy",
+        "layoutCapacityProfile",
+        "normalCallPlanRef",
+        "batchPlan",
+        "generationBudget",
+        "repairPolicy",
+        "semanticCacheKeySchema",
+        "publicationCacheKeySchema",
+        "subjectOwner",
+        "entitlementOwner",
+        "releaseOwner",
+        "materialStoreOwner",
+        "rendererContract",
+        "requiredReceipts",
+        "methodSpecificNegativeCases"
+      ],
+      "status": "PROFILE_GATE_OPEN"
+    },
+    {
+      "methodId": "CROSS",
+      "productId": null,
+      "version": null,
+      "profileDigest": "0377b8c3cdc1ad0447917135651afa4479cc370bf693138e36afb4bdcd44b4ce",
+      "predecessor": null,
+      "calculationAuthority": null,
+      "meaningAuthority": null,
+      "sourceAuthorityRefs": [
+        "content/customer-experience-rebuild/r12r4b/cross/acceptance/cross-w26-final-production-admission-v1.json"
+      ],
+      "sourceAuthorityDigests": {
+        "content/customer-experience-rebuild/r12r4b/cross/acceptance/cross-w26-final-production-admission-v1.json": "7be66a77d1b7080e61330ccad9f1945ab9f77c81dae83ffcdc8aae3834d276d7"
+      },
+      "acceptedSourceRefs": null,
+      "humanDecisionRefs": null,
+      "semanticIrVersion": null,
+      "manuscriptVersion": null,
+      "publicationIrVersion": null,
+      "sectionOwnership": null,
+      "allowedModes": null,
+      "pagePlanVersion": null,
+      "pagePlanPolicy": null,
+      "orientation": null,
+      "pageMargins": null,
+      "diagramRegistryRef": null,
+      "diagramCountPolicy": null,
+      "diagramRequiredIds": null,
+      "diagramDataOwner": null,
+      "diagramTopologyOwner": null,
+      "headingPolicy": null,
+      "paragraphPolicy": null,
+      "sourceSpanPolicy": null,
+      "minimumReadableTypography": null,
+      "contrastPolicy": null,
+      "layoutCapacityProfile": null,
+      "normalCallPlanRef": null,
+      "batchPlan": null,
+      "generationBudget": null,
+      "repairPolicy": null,
+      "semanticCacheKeySchema": null,
+      "publicationCacheKeySchema": null,
+      "subjectOwner": null,
+      "entitlementOwner": null,
+      "releaseOwner": null,
+      "materialStoreOwner": null,
+      "rendererContract": null,
+      "requiredReceipts": null,
+      "methodSpecificNegativeCases": null,
+      "publicationProviderRule": 0,
+      "rerenderProviderRule": 0,
+      "reopenProviderRule": 0,
+      "unresolvedFields": [
+        "productId",
+        "version",
+        "predecessor",
+        "calculationAuthority",
+        "meaningAuthority",
+        "acceptedSourceRefs",
+        "humanDecisionRefs",
+        "semanticIrVersion",
+        "manuscriptVersion",
+        "publicationIrVersion",
+        "sectionOwnership",
+        "allowedModes",
+        "pagePlanVersion",
+        "pagePlanPolicy",
+        "orientation",
+        "pageMargins",
+        "diagramRegistryRef",
+        "diagramCountPolicy",
+        "diagramRequiredIds",
+        "diagramDataOwner",
+        "diagramTopologyOwner",
+        "headingPolicy",
+        "paragraphPolicy",
+        "sourceSpanPolicy",
+        "minimumReadableTypography",
+        "contrastPolicy",
+        "layoutCapacityProfile",
+        "normalCallPlanRef",
+        "batchPlan",
+        "generationBudget",
+        "repairPolicy",
+        "semanticCacheKeySchema",
+        "publicationCacheKeySchema",
+        "subjectOwner",
+        "entitlementOwner",
+        "releaseOwner",
+        "materialStoreOwner",
+        "rendererContract",
+        "requiredReceipts",
+        "methodSpecificNegativeCases"
+      ],
+      "status": "PROFILE_GATE_OPEN"
+    }
+  ]
+}
diff --git a/content/reports/method-report-delivery-delta-registry-v1.json b/content/reports/method-report-delivery-delta-registry-v1.json
new file mode 100644
index 00000000..9c36a32f
--- /dev/null
+++ b/content/reports/method-report-delivery-delta-registry-v1.json
@@ -0,0 +1,58 @@
+{
+  "schemaVersion": "METHOD_REPORT_DELIVERY_DELTA_REGISTRY_V1",
+  "sourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "status": "METHOD_MIGRATION_IN_PROGRESS",
+  "sharedFinalLiveE2EAllowed": false,
+  "crossMustBeLast": true,
+  "fullSharedInfrastructureProofRequiredOnce": true,
+  "repeatedPerMethodFullE2E": false,
+  "methods": [
+    {
+      "methodCode": "ZWR",
+      "receiptRef": "docs/reports/delivery-r4/ZIWEI-METHOD-DELIVERY-DELTA-v1.json",
+      "status": "BLOCKED",
+      "migrationState": "LOCAL_DELTA_READY_LIVE_BLOCKED"
+    },
+    {
+      "methodCode": "AST",
+      "receiptRef": "docs/reports/delivery-r4/ASTROLOGY-METHOD-DELIVERY-DELTA-v1.json",
+      "status": "BLOCKED"
+    },
+    {
+      "methodCode": "NUM",
+      "receiptRef": "docs/reports/delivery-r4/NUMEROLOGY-METHOD-DELIVERY-DELTA-v1.json",
+      "status": "BLOCKED"
+    },
+    {
+      "methodCode": "PROFILE",
+      "receiptRef": "docs/reports/delivery-r4/PROFILE-METHOD-DELIVERY-DELTA-v1.json",
+      "status": "BLOCKED"
+    },
+    {
+      "methodCode": "ECR",
+      "receiptRef": "docs/reports/delivery-r4/ECR-METHOD-DELIVERY-DELTA-v1.json",
+      "status": "BLOCKED"
+    },
+    {
+      "methodCode": "HD",
+      "receiptRef": "docs/reports/delivery-r4/HUMAN-DESIGN-METHOD-DELIVERY-DELTA-v1.json",
+      "status": "BLOCKED"
+    },
+    {
+      "methodCode": "FINANCIAL",
+      "receiptRef": "docs/reports/delivery-r4/FINANCIAL-METHOD-DELIVERY-DELTA-v1.json",
+      "status": "BLOCKED"
+    },
+    {
+      "methodCode": "WILL",
+      "receiptRef": "docs/reports/delivery-r4/WILL-METHOD-DELIVERY-DELTA-v1.json",
+      "status": "BLOCKED"
+    },
+    {
+      "methodCode": "CROSS",
+      "receiptRef": "docs/reports/delivery-r4/CROSS-METHOD-DELIVERY-DELTA-v1.json",
+      "status": "BLOCKED"
+    }
+  ],
+  "migrationState": "METHOD_MIGRATION_IN_PROGRESS"
+}
diff --git a/db/migrations/0013_method_delivery_cache.sql b/db/migrations/0013_method_delivery_cache.sql
new file mode 100644
index 00000000..ae20acd5
--- /dev/null
+++ b/db/migrations/0013_method_delivery_cache.sql
@@ -0,0 +1,14 @@
+-- Governed private semantic/publication cache. Claims are never automatically
+-- stolen or retried: a failed/abandoned paid attempt needs explicit reconciliation.
+CREATE TABLE IF NOT EXISTS method_delivery_cache (
+ owner_account_id TEXT NOT NULL,
+ cache_kind TEXT NOT NULL CHECK(cache_kind IN ('SEMANTIC','PUBLICATION')),
+ cache_key TEXT NOT NULL,
+ claim_id TEXT NOT NULL,
+ state TEXT NOT NULL CHECK(state IN ('CLAIMED','READY','FAILED')),
+ object_key TEXT,
+ payload_digest TEXT,
+ created_at TEXT NOT NULL,
+ updated_at TEXT NOT NULL,
+ PRIMARY KEY(owner_account_id,cache_kind,cache_key)
+);
diff --git a/docs/reports/delivery-r4/ACCEPTED-SOURCE-BASELINE.json b/docs/reports/delivery-r4/ACCEPTED-SOURCE-BASELINE.json
new file mode 100644
index 00000000..d987cea9
--- /dev/null
+++ b/docs/reports/delivery-r4/ACCEPTED-SOURCE-BASELINE.json
@@ -0,0 +1,355 @@
+{
+  "sourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "scope": "PROTECTED_SOURCE_AND_HISTORICAL_EVIDENCE",
+  "files": {
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/audit/HD-PRO-R3-PATCH-INPUT-current-owner-reconciliation-v1.json": "31a4920dee9dfc37fc72b5cffc0ff6b8f6a823fba9aabece74c32d45be5d081b",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/audit/HD-PRO-R3-W0-authority-audit.md": "35e8a0cf4b32508325cf132ee2ed441c0245a51c23c0ca8148baed0688306df0",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/audit/HD-PRO-R3-W0-current-owner-map.json": "840e4eebd8e52181f4abbbf481d2fbc413120ae1680fc25de5caaf80da74e319",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/audit/HD-PRO-R3-W0-protected-files.json": "878104938985ad9fcd5b9c621c0f3bd3e60e1c45355ebaf79a0979b675e917d5",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/audit/HD-PRO-R3-W11-current-owner-reconciliation-v1.json": "f66b49f57cf901224b5a32d31875ac0e263a8ca332c60dcbdc06465b14ba1eba",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/audit/HD-PRO-R3-W25-current-owner-reconciliation-v1.json": "7d0e1427cc8641dddf1fcc33b09c006e59f2c01af762cd61d649a63e31996a58",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/audit/HD-PRO-R3-W4-current-owner-reconciliation-v1.json": "fa274d0a6668e656a358467420489b85f97bcae5c5456fe728923e57342bf979",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/audit/HD-PRO-R3-W5-current-owner-reconciliation-v1.json": "d839037d8bb1f57ae00dcb080c88617f87fc9a7d1e7883175e15777217048a74",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/benchmark/HD-PRO-R3-W21-r2-vs-r3-benchmark-v1.json": "b3a7cc0f85617ab56ae15bc407c62ed9467763f2d2fff2027d2926c7f1ce26ec",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/boundaries/HD-PRO-R3-W19-epistemic-sensitive-domain-boundary.md": "043851bec44eaca18eacff3ad730ca97f28b1786dff883459cacfd4db69caf03",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/boundaries/HD-PRO-R3-W19-epistemic-sensitive-domain-policy-v1.json": "8c7acbc59dc7aaf48fe8c2f376beb4408ca41e37360a3f8887466d2f2de591f3",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/campaign/HD-PRO-R3-W20-machine-cases-v1.json": "26cec47ed0bfd68a7e47a2138b87517e2d5c6e6484344ddb8f09a5e7c8fd03e0",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/campaign/HD-PRO-R3-W20-machine-results-v1.json": "27dbe50f66f0bf2cd15564985935bd82a796e7c3854ff70df60d259ce208c024",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/checker/HD-PRO-R3-W27-checker-architecture-v1.json": "ac7fb6f3bdfde58106865add18a5484f4231be50aea7965c9fd32409692a4013",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/claims/HD-PRO-R3-W3-claim-ir-contract-v1.json": "3080fb795b31ee5cba3c225e4cec08112d791dd0be2b8aaf0366a306466a75d2",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/claims/hd-pro-r3-semantic-claim-candidates-v1.json": "dceb91a8c085d4c8a982cc56e0d7b17c05da6694ad1e26e742edf4ae4515456f",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/claims/hd-pro-r3-semantic-claim-ir-v1.schema.json": "1866d954b274c12729fdbfc78c0dd0e9ab6a85a1df7f3a61ebbca3e3e12e4726",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/closure/HD-PRO-R3-W28-closure-v1.json": "7d7a4f3b93e835f5a31a1e1e34fd20a94f7062201fec28ba58ce7f29afe020a9",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/composition/HD-PRO-R3-W12-composition-fixture-v1.json": "47636d4e4c74bc089134fc0a0f0e19f344f05fae71bad05eb73a5bd3e818be92",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/composition/HD-PRO-R3-W12-composition-rule-registry-v1.json": "a60f330b72e8fafcc9da73af2d64524f1d699dd2889c17a5b489f35fa3999895",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/composition/HD-PRO-R3-W12-composition-rule-registry.md": "ad162d2a473ea6c328fb6757e9b72a4585b8afbc229b1ea9138a1396b154a658",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/coverage/HD-PRO-R3-W1-COVERAGE.html": "a536cbf80c4df2ecc12a9bb609801ac889e745a017f4e5f007ac0e64ea57267f",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/coverage/human-design-semantic-coverage-census-current-v2.json": "a8efb001153010b7d52168ba474ef77ebf8e954babb42e731d9521c1ce29d68d",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/coverage/human-design-semantic-coverage-census-v1.json": "d482696525b21f624420a7920f3d9490bd999f2bf326a3db07dbd50cf9a678fe",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/dedup/HD-PRO-R3-W13-dedup-fixture-v1.json": "d85aab3fea0cb4b706fedf1f75d2e388419cad79c11d98fd47ccb2932abb0516",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/dedup/HD-PRO-R3-W13-semantic-precedence-dedup.md": "349782410b8f1f906d17d7be0537800ee45dc4f856360401d439f60199c81678",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/dedup/HD-PRO-R3-W13-semantic-precedence-policy-v1.json": "0fa1109b61b6b940ec768beb14ba6fabdebfb260f21cf69b2725ae7b5c6cc52f",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/editorial/HD-PRO-R3-W16-customer-editorial-policy-v1.json": "e73ad65668f3a6f8570f6dc129dc4344677b0333dd8d046dd05c647a940ec468",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/editorial/HD-PRO-R3-W16-customer-editorial.md": "dbc07a0bcad923332972c872dd1380e1c3ec076cd25600666278b46cca9b33ff",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/priority/HD-PRO-R3-W14-whole-chart-priority-fixture-v1.json": "5a2e4b383af251a3ce28a41d79078d97ed97b7f69dabe743e1178d6d85b2b18c",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/priority/HD-PRO-R3-W14-whole-chart-priority-policy-v1.json": "db8a27df4881e5a11948e5a7c47d847e8b0d8063cc1747c845763ab3e9b3984e",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/priority/HD-PRO-R3-W14-whole-chart-priority.md": "908d9427b8d2070b2d606bcfec4f384cc71ba7d19619ca6bc78f3ae51a80ed93",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/production/HD-PRO-R3-W25-production-cutover-v1.json": "bc9e32ba6388777098badaa5c02589b4eb8d259f980fb61455f781a0204f78d3",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/reading/HD-PRO-R3-W15-professional-reading-ir-v2-contract.json": "73549749cd1c3d0243510a96a5e7ceeb68537c7ca0c9111c130d3119c7ec02fe",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/reading/HD-PRO-R3-W15-professional-reading-ir-v2.md": "c4359e0959bbdf11cfdd31e6493c066238f382a59baf05ddf3a2f440406f4318",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/reading/HD-PRO-R3-W15-reading-ir-fixture-v1.json": "94c856f616ea0d1423922c09ec94279a1bc0497b3045a4e873bb13f200609b53",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/reality/HD-PRO-R3-W17-reality-composition-v2-contract.json": "99a84c11a65ed88ab447b3e3abe606311db6be90b9cb430aa90a0633d69f6db0",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/reality/HD-PRO-R3-W17-reality-composition-v2.md": "41ff339d74924499d8391a0b53f28073e8eca8537da1374a87244a57a4520c63",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/reality/HD-PRO-R3-W17-reality-fixture-v1.json": "8c294f7c84e3f8abd5f30def89de00b29d7f7de3501f891577fadf91740b8009",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/regression/HD-PRO-R3-W26-regression-matrix-v1.json": "41b9643ae45858cfe4aec66bf8b3849fe6d8714c9f8382a433bf4c95f9771935",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/relationship/HD-PRO-R3-W18-relationship-fixture-v1.json": "20a13500e7de3d4f710058210770007dc9dc1647369a74882ddf77cca97b7d7e",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/relationship/HD-PRO-R3-W18-single-chart-relationship-contract-v1.json": "06b7756d9bcff52c7971c707a21e129e2def36d424e31b1569c135f1a6f41fc8",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/relationship/HD-PRO-R3-W18-single-chart-relationship.md": "46cb4bc3dcc700af8494f32e97940c44aec7832228c81489a9896625d7fee5cd",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/renderer/HD-PRO-R3-W23-customer-renderer-successor-v1.json": "ba9dc8c2a178a27f2ea658d5f81437d196fbe02bcc8c24ea7755b6ae165b9bae",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/report/HD-PRO-R3-W3R-report-blueprint-authority.md": "53738990539c162b1a8ca1748e83f834000c0bc6d1094270b89de96ad4884041",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/report/hd-pro-r3-report-blueprint-authority-v1.json": "a687ae00365f14bdc99ab905f9ec2e1ecbe39d24135c8c21db51777a18f69d6d",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/review/HD-PRO-R3-W22-HUMAN-REVIEW.html": "9201b47ee3264c903dbda0a71a4a4faa25cfa27fc145c263da2849d24a0847d4",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/review/HD-PRO-R3-W22-human-admission-v1.json": "584927d4240b222ff3350a1e2016f0e43b60d75d8ef578e7f75f1590295a37b9",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/review/HD-PRO-R3-W22-human-review-cases-v1.json": "71dc70c7b245b5e87dfeda4b53f53bb872324551a60305462afafd3e9fa58d13",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/review/HD-PRO-R3-W22-human-review-results-v1.json": "076802b71b6e2bd568a01f4ad433804790e21f16fdba5a2d875a06c798949b11",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W10-definition-integration-corpus-v1.json": "1210c8a11068617646009d1933ca9669e2913893a3e786e82038a90519780367",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W10-definition-integration-corpus.md": "585cb31cb79f264117b4ce4f86c49a236866c2dcc3fd7f51a89f881676e5f110",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W10-definition-semantic-admission-v1.json": "1d5a419e0ea147ed3b5832e2015ed00757e1f00af30341456628a0f4cbfb5fcb",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W11-variable-phs-professional-meaning-corpus-v1.json": "5e8201120f6ee5a2ecb9446d524701a84b3f9eef71512312eeaeebd330180868",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W11-variable-phs-professional-meaning-corpus.md": "795f9715d8333d010ff7f644edb77c23a6ba815d728e92091806da89891b14da",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W11-variable-phs-semantic-admission-v1.json": "3d9fd3e3cea52df2f133a56eb91d7740f24f9857ba1271d83b443b8e7a7424ce",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W4-type-professional-meaning-corpus-v1.json": "10d299b30fe25b408b7ba39842dca160b2e349fb372a7c4f6e97387a97975e98",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W4-type-professional-meaning-corpus.md": "06c26a86fe62db8a09659821ad50998ecc507fc59abea46d43a594fb3a40d533",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W4-type-semantic-admission-v1.json": "be46554a5126cb53a7390118b6bc8013d2c6bdc29ff50ff0368f6f754d338994",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W5-authority-professional-meaning-corpus-v1.json": "1971aaadbc5acfde4468461a04b7faea5c5f748e7e77a11e9e07c4aa7060474c",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W5-authority-professional-meaning-corpus.md": "f0b7e540d653e34872f19be5dfef651213a6cbc944126ea66c455a6b39809aee",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W5-authority-semantic-admission-v1.json": "06c8eea149dd489dbedf4fbf67728e0a19a521194e5e7d7780cc9844460b8c8d",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W6-profile-professional-meaning-corpus-v1.json": "6102de0bf793e037ad3f9e8e502d14a4692d60916b63362f9f5536e582f5bd89",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W6-profile-professional-meaning-corpus.md": "b4a18b1865ee8ce2e65d00c62a3c2e003c16a377c57db5357576f9e084fa0e17",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W6-profile-semantic-admission-v1.json": "a27188f5511ab7599f64c349be6630624d131b88acd31fed8a80dc34318e35cd",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W7-center-professional-meaning-corpus-v1.json": "ea49b43e15acc59d7c960e19af4841562f6e6cd9a601887d527be04deebbd145",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W7-center-professional-meaning-corpus.md": "7aca1a264b99459980f834befdefe067a53f296e63e611254020bf06f4e45971",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W7-center-semantic-admission-v1.json": "93355422935c40a7f3efd823d2e453c05ab7d3d21f2579a42b189269c264d4b3",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W7-center-three-state-structural-policy-v1.json": "a128927c4e1c0871f092cf0b2365538837271a692249e795d1b0a300aeb1c2e8",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W8-channel-professional-meaning-corpus-v1.json": "3394482e8cb366f826ea64ca9998be64f895fe84167d2ebb4ba75a5ea405cc3e",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W8-channel-professional-meaning-corpus.md": "b022c585615fbccd417ff1b8f1ca0adcf7a55e8f54ea63a38df35fff7615ff9f",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W8-channel-semantic-admission-v1.json": "31bbbfa5bb7f0b929d6700bc4dbd1fa94839cf3498b7c3aed45cca4b73ea0e08",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W9-gate-professional-meaning-corpus-v1.json": "62c10673466df67677854644a367911aec0d198a7894b906a7e27271f029ca00",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W9-gate-professional-meaning-corpus.md": "668f835928acd15c624e161cd2d10ebb16009ce993b0c041c63a7068018a0cd6",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W9-gate-semantic-admission-v1.json": "916ab324f47d4466671a67897b911119c49d1e890de1fe497ccf48184279ec36",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v1.json": "4eba587dbd4857ed0c9c4ff62ad3493e78a8e6c88ca5d37ffb1012f925c19dfd",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v10.json": "22d46bdbc16d11dca6f6c2d42f4769485d825c671997448d3e395a7286b49bbe",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v11.json": "f3b9713c144c7d219a15f14f04a01228e1b9660074e4fa055befb20425584802",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v12.json": "b2ad40f5dd5e630bd9359e6c72a59099cba5cf77f3b46bceff0a5fb46b4aa800",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v13.json": "d83019ec89afa919f8dcecb6e3b6d3b07ac745b14b0f03caffc3bfab52bd3ff2",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v14.json": "098b9cdfbe3ff5a0874964b0ec868aac7411982ef92d92c1b4c61ceae3af6816",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v15.json": "f97a5c467cdbd2007d0c67b004cfbe33d26c2f4a895fa3e9415dca6dfa568ba0",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v16.json": "a2d3e3bb8926dfb79a850fc3129aec6f8afa6961a7c118dabddffcf07d1e34c5",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v17.json": "a940305d03650904165041185e602a88cd7c8abb80c6485007ba9f62073d4986",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v18.json": "3821a6436125347de0d79878bc26ff3c0930a4b5361eb9e2094e428dcc45d3a1",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v19.json": "8047ae93c98773b70b2d056bd856a008b5cf7ead2742207442d12d72a481baec",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v2.json": "d4edd77502804f81f1df18e91a5996d2ddbded94cf9b412e8b9eacd955deae42",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v20.json": "73f952cf6145153ad1f803d4883c77fea93ab670f605e0211ebdf9ad61766fc2",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v3.json": "1a927caa02645b77d2f6c53a4f8873663fd659898f63b23c7d04355f9084a742",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v4.json": "b1216ebba48b86fda6e62081e17277b9d967749adea775aa603e1c3b14e1b313",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v5.json": "0bc9994051f689d5ae563c02daa0af7a1791d88c5e703a000524d350290fb0c4",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v6.json": "122e93f849861498fa101fffa1797673617b266deba9e93a58fe3d76a123d003",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v7.json": "64ed8a668536656e3309b0548cbad84ac368c0eb4f101bc76f85b6a9b1f02e06",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v8.json": "b31d97d0b9f312e71d7af5043bbdaa91920f0cf98a6d501b1b07eae360b376c5",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-semantic-production-status-v9.json": "beeb336744ace5066ad2003dc5e30f026a68c5ce64e2e2bbb30a9a053d78ff1c",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W10-definition-source-resolution-v1.json": "06583ffdd83f1855908f145b99acf450083c629547de49336ccb1cd52555f237",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W11-variable-phs-source-resolution-v1.json": "56617d5a08ba3896d3c1bdd1d349e406c0eab41687f6ade874c621bf01cbab6a",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W2-source-school-authority-registry-v1.json": "545aecb89e6757005b980b79003aa0514ea9197344d620ac168deb45396ed1b9",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W2A-user-authored-source-admission-v1.json": "fafd56862d151320bef7638047148f707fba62d6d2c03f8ad7bbb4257ff79d6d",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W2A-user-authored-source-units-v1.json": "3b3601fd8b99de0d881486841f2dc54517c8fb1c9e3ef30bc90619178e15cc19",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W2B-google-drive-source-census-v1.json": "efd6951e485f5371522a7e727f03c2054123813160790db522a6e7f308f56005",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W2C-source-school-reconciliation-v1.json": "6d43438c5f9d8f840a15a7981af2bbb06bae7d7086d1d049773862a7778e5193",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W5-authority-source-resolution-v1.json": "cc444c16268d0a1b88e67c5ea859604ebb9989ae5b8bf8561759ff4370607d4d",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W6-profile-source-resolution-v1.json": "c46e75f6d37b4c1b874c9c13fab36b9ec5eef68ed45ab3015b2b70263a8bfc62",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W7-center-source-resolution-v1.json": "6e30931d0138613781eed70cede4c5f81856fcb1f61439519231e90f0fddf042",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W8-channel-source-structural-resolution-v1.json": "4c3d7caaf188b2a81f4ab49d69e3f0d3e987c7994d1e11df766123486f4a5186",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W9-gate-source-resolution-v1.json": "b368900831d593ce7e8e199d71ea2100496941900bed6baf0b7567be060a58b5",
+    "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/visual/HD-PRO-R3-W24-visual-reading-authority-v1.json": "070e1fde665829b4cbd5072eab41e29da1762c4cc43d2742854d10b40f30ad64",
+    "content/professional/ast-full-production/admission/ast-fp-r2-candidate-human-admission-v1.json": "1e35b2d791f0d71adff0358142782402a53275a29a2c1aeda5d2ffbf42068e6b",
+    "content/professional/ast-full-production/admission/ast-fp-r4a-professional-semantic-human-admission-v1.json": "1f03127c8a03aeb0db15ebb80d123096e59481d663b861091fa078f127b2f66c",
+    "content/professional/num-production/expansion-r9-r18/admission/num-r18-full-production-cutover-v1.json": "832e2a96409f25e12d085174a70006ec702e42dc1013750acf11a87e329f1d63",
+    "content/professional/num-production/expansion-r9-r18/admission/num-r18-human-admission-evidence-v1.json": "510e13be5406d24404d87a4e63de91c0d9a58b1a59fe5ecb1f539be627d0fa35",
+    "content/professional/num-production/expansion-r9-r18/audit/num-r9-learning-corpus-evidence-index-v1.json": "49e17151fde9a326c7678ecb6ae6ceb6dbb02eccdbf86d94fe885d5c49300ab2",
+    "content/professional/num-production/expansion-r9-r18/authority/num-r11-name-calculation-authority-v1.json": "fcd42c38865336eac4a63985d6513d3192a2a272e5f5c9f7437dde53166d35a5",
+    "content/professional/num-production/expansion-r9-r18/authority/num-r13-life-period-authority-v1.json": "181c01f54a324f681d55a639989bd21f2f63731f1aace7ce4ec1d5219dfb03a2",
+    "content/professional/num-production/expansion-r9-r18/authority/num-r15-alternative-timing-authority-v1.json": "21bd87235e780558a6a3b9318000c57b488857c600cd4301ba9429c2ffc6a9e5",
+    "content/professional/num-production/expansion-r9-r18/authority/num-r16-relationship-authority-v1.json": "d2492363793096d8f3e5334934d1e1c4b775a5ad3c9f8d12c03033b7b4602ec0",
+    "content/professional/num-production/expansion-r9-r18/authority/num-r9-school-authority-reconciliation-v1.json": "cf8b3d117065f387069ce31a552316400f06435c81a70b45579a092ba131580a",
+    "content/professional/num-production/expansion-r9-r18/contracts/num-r11-canonical-numerology-identity-input-v1.schema.json": "3c1136ff400149db8895779f6fce2c89d4d9c41743a6f70bc3821a59b00f4929",
+    "content/professional/num-production/expansion-r9-r18/contracts/num-r17-composition-dedup-v1.json": "5a3d28618cf29c29b03fabc09f7863f3ae3e7bc2275c6f0d99f8e1c3948d6f19",
+    "content/professional/num-production/expansion-r9-r18/fixtures/num-r11-name-formula-fixtures-v1.json": "0a1f5132949c479ba7e92c2591ab91480bbda8fed64b3d3b7a791fde70ddfe4c",
+    "content/professional/num-production/expansion-r9-r18/manifest/num-r9-r18-manifest-v1.json": "c2db7ee19b782e0c79e9a1361700118f9d941877bdd254bef663c544b4f99835",
+    "content/professional/num-production/expansion-r9-r18/registries/num-r10-digit-distribution-policy-v1.json": "f15280bafc2053b95f7436aaaf76ff969c4e39b203f91dd125ef1a29a34e6bb9",
+    "content/professional/num-production/expansion-r9-r18/registries/num-r12-pinnacle-challenge-cross-validation-v1.json": "d4f6d31768d375e8ef97f14db8c1fb91546021a1db281e832fabe30c193477a5",
+    "content/professional/num-production/expansion-r9-r18/registries/num-r14-energy-grouping-registry-v1.json": "e5f75c60f80fd251736c844848061904293faff1d8ed1467f97d7e44217d6dcc",
+    "content/professional/num-production/expansion-r9-r18/review/num-r18-human-review-cases-v1.json": "c9c8bbc5b67196f15058f29c99c1deb6354d6c476fe19c56aa369d8d1e6aacb4",
+    "content/professional/num-production/expansion-r9-r18/review/num-r18-human-review-results-v1.json": "15a060e571867229495d6feeabcbb3f336aadf6c6a83e5ece53881a8d7f86750",
+    "content/professional/num-production/expansion-r9-r18/review/num-r18-human-review.html": "b7aa4a71bb5bb5d929e69e1a7dcf61c0c48fcdc6d40f8890c91c0f460bf1021b",
+    "content/professional/num-production/expansion-r9-r18/sources/num-r13-r16-public-source-reconciliation-v1.json": "ee5c475289f663667ef8d365757a63095f8405fe0b93dfc595711828a6decb65",
+    "content/reports/shared-report-delivery-e2e-contract-v1.json": "4e4afb5f074dff3bb73691fb9ddb8e0d346b91a56a5ba441e556acd9183af232",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/AUTHORITY-PACK.json": "ee48538e4bcc0c48b1c3b20895b359d8786982e52e221ee255e530759894f22f",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/B01-AUTHORITY.json": "8b30088860a36fdb29a1aee29e95d5ac966f76594e5e17cdc1a60309ae171098",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/B01-SCHEMA.json": "65aeecb95ee4c48757649b47500ac663c14443cf009c8bb9833d387e35b86092",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/B02-AUTHORITY.json": "d68f6ae3fde04c63c4ba5f8f2272eb7769ed3451b9a39fb9daf343eba52c7de6",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/B02-SCHEMA.json": "7e5ed57059a8b8363f0e8492783f2351f4a8028a06cbf2b97ec0c4e66f2ff149",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/B03-AUTHORITY.json": "9ee808b46d499ed64c2504305f202de9332d8eb52aa8469b915e3b2fe2401915",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/B03-SCHEMA.json": "584d84dda761187d989a33d6ef207fa5b652c410d9e173f401e6333b61fd978d",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/BATCH-PLAN.json": "43e323f9c38c514f21a29d0571543bd21657256f41682e5f1d335085c0db6bad",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/BAZI_DIAGRAM_FIDELITY_R1_ACCEPTED_CANDIDATE.json": "cd97f1e61d902651ae2c097b4b54213a7de80d13557a14c468d1ce47d3a68b30",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/BAZI_DIAGRAM_FIDELITY_R1_ACCEPTED_CANDIDATE.json.backup-20261007-103637506": "cd97f1e61d902651ae2c097b4b54213a7de80d13557a14c468d1ce47d3a68b30",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/BROWSER-QA.json": "8f1cf1ad86fdf9e00b77fcdc00f3c3f12f78b1dd6acbe4636c86b0b240c7967b",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/CAPACITY-ADMISSION.json": "8e144b3bf841b2597c198b3a95e4c30f7d51b8883d8e133598e5ee3937185a1e",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/CAPACITY-CHECK-EVIDENCE.json": "0a14eef4f7e98eef7e6dbf62d64b06178f31ad9ef03cf36751283b76dd0eb27d",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/CAPACITY-MACHINE-REPORT.json": "69a525bbaa41336c3dc2242e006919364e9dde8b295b35d3df4d13e93882b34d",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/CAPACITY-STATUS.md": "24ad42eb75eb98f0c56abf29786728216c1f468520e2b01ea73f487b1a2322d6",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/CHECK-EVIDENCE.json": "6b202e0811d49be85ef0a7e5766899dfb03cd2bab1fcbb44293b65d20dbe1abd",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/CONTROLLED-EXPERIMENT-APPROVAL.json": "3fb4fab1f0530f5cd7a685b98920de89b6e499635d818966d9d36c21fa8c6d8c",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/CONTROLLED-EXPERIMENT-PREPARATION.json": "6bf4c6909b1bccd3ed014e71a04231e957ba6ecb15e76c6d17b0f848642e8e21",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/DIAGRAM-FIDELITY.json": "79070d3c1352516bf3df12c8c670c481144b6911e37d3a3923430fbefce2bea6",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/DIAGRAM-REGISTRY.json": "dc10763e534637ad6795114caa2b6db12cc257b5a1d8b19d72a06860c0934d23",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/EXPERIMENT-MACHINE-REPORT.json": "49ddd95d640252f34a8e9e265ba97589cd2e42c9aa470bb43526cbe5da944d5b",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/EXPERIMENT-STATUS.md": "f798d9c51bda1a3ae310969147e89d6da971b999fdf12b9de845ab45a5ad0c87",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-CHECK-all.json": "5921087f5a6c494a5333b747cbe0235695cd5f5b2f8bfabe7151eb2fa7475e2c",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-CHECK-architecture.json": "bd7e9bd9e9f09560ae5626240ed1d86d071b620eb9b14d57db965afd0865e176",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-CHECK-diagram-fidelity.json": "a9acfac7f1cf9810929a8c742aa7f1f236e26832468016420537fb75c855c3fa",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-CHECK-fit-BILINGUAL.json": "5ac01d6c6ce931bb531254fb8ff3a1e4b09a816f773866e439af9a52d8b2de3d",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-CHECK-s04-seven-killings.json": "ae3827febdc7ae01828431376ca4f3cf9650cf1873caa4f4dee3dfef9ac71d2a",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-CHECK-semantic-coverage.json": "d96ce94d0ed1539634932f447be7cc4c9398ddcfcc77ccb90fa46dd4dfab58b4",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-CHECK-timing-consistency.json": "fa2b92bf01e63ecac06fb1c100c0194aa34f246da08d1733eb81ea046be20bbf",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-CHECK-zero-provider.json": "a9bb94f6465aa3443efbb037d8384d14e436ca5570ccbcfc111dcda0c31d5392",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-FILES-CHANGED.json": "31303d83f0e4ea54ddd98109f90d4219c4273d103ff2ed330656a91d1b1750be",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-GLOBAL-CHECK-LOG.txt": "a4d7e8ece649fc9e70a621773b95162373099357dc2b8bf3534821470b48f9b1",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-GLOBAL-CHECK.json": "856916002efab851c8220126161d0312cd9f275a094533c735003fd8755fd11c",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-IMMEDIATE-SOURCE.IMPORTED-BASE.json": "11c65894aa3ff604f21f408129b3e573a737b57d6686d637b7bf1b7ff521a22c",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-IMMEDIATE-SOURCE.html": "2716bb13d5ae529b4df24f0c6ea19f5ed65aa3f56468664322d09e690119e487",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-IMMEDIATE-SOURCE.json": "c5c53b820542d7134dc4166ca368df23ff412b1e2f8c488a1dc59aa1eea999ad",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-MACHINE-REPORT.json": "bdcc0cc36f1934118c35306f2520bba4e7d855a584fd66622c2cdb6ef3776861",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-PATCH-REGISTRY.json": "98d491e05a1a8b15f9fb32a431050f7b3ec387daa2829e34420c9f13c6ec5def",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-PROTECTED-BASELINE.json": "006836ab5b06d5837f3fad91e4b7d5f06c71dd6a6048ab6be8a9352738c5b672",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-STATUS.md": "b452f77226061246af4bcf94a7a4f1c1bbe3287b60ddc4c015c8b7f33fac2287",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/HTML-REVIEW-SOURCE.json": "28dd685168afb279da3a43be25d56b3fcacf9f95d87d9fa8eb5d7f96067bfb58",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/LIVE-EXPERIMENT-RESULT.json": "edc9b90cbf9b72e6401c4c1db6229ec931ce88902eb6eb145493aee117c4a088",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/LIVE-MANUSCRIPT-SNAPSHOT-R2-CLOSURE.json": "e13eb0492c80b3b34476f3ecc047cdd2088e32d1be262685acad939da2fe84d0",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/LIVE-MANUSCRIPT-SNAPSHOT.json": "bb61af1abddba00bba7c5ea74440e95fb02c8c832e7002008ba2db7e042e6558",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/LIVE-PUBLICATION-IR-R2-CLOSURE-BILINGUAL.json": "3148fc93a04781a51865429079bf7ea91fa47eeea7f6bfba0177ff31568c6c85",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/LIVE-PUBLICATION-IR-R2-CLOSURE-EN.json": "1bc845b954ce6ac734d0d15f4d25dd66fd5fba91906ec53e76d7d0e1ca6a3b08",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/LIVE-PUBLICATION-IR-R2-CLOSURE-ZH_HANS.json": "76a45f6139e0c1f9786559d97f6f9c189d5264727ef60e899596a56d04dee2f4",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/LIVE-PUBLICATION-IR-R2-CLOSURE.json": "3148fc93a04781a51865429079bf7ea91fa47eeea7f6bfba0177ff31568c6c85",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/LIVE-PUBLICATION-IR.json": "f7a7a01c7c17e41487c1db2f054eb579298c6a9dfac83e4a8fba46096dbfac08",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/LIVE-REVIEW-BUILD.json": "9a68c35ff711eef4b94f014c42e4df2a3479c14b4ce5fde15596bd15e25b7c31",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/LOCAL-DEPTH-RECEIPT.json": "1fee5cf86220213959dc595a0871dd367990dc25295486418c14cdfcd928f899",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/MACHINE-REPORT.json": "5101ee5a84c5eff6af9cff79440bc42019119c0f99866cdeddc8599c66520dbd",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/MANUSCRIPT-REPAIR-MAP.json": "60f9b4d54657ce33f226a00b11e3b4b2a36b6b0533d9c055f923154867eafa2a",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/PAGE-PLAN.json": "3d0821c5852f3fd09e52387d913f215f3ed9c442c5001e8315099c0e03fc9066",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/POST-3-CALL-REPAIR-MACHINE-REPORT.json": "be8238da3726d443dd9c0941649b3011fc67d1a7b1e5833be946018631c6db9d",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/POST-3-CALL-REPAIR-STATUS.md": "450e28841cd222e936ac84f7a9a47f60f7dae6301f2eabdd9c15ff9aa9572947",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/POST-3-CALL-SOURCE-SNAPSHOT.json": "bb61af1abddba00bba7c5ea74440e95fb02c8c832e7002008ba2db7e042e6558",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/POST-REPAIR-CAPACITY-ADMISSION.json": "ec6d0da865d143d54d87a20e2324eea27172e1d147bbd08a3e8f736ab02e0675",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/PREFLIGHT.json": "4f9823509610160237969d419a22f1757d881c9fd58c8be4e4933cde57d4894f",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/PUBLICATION-COVERAGE.json": "6ac72cc9ee6fb0c46f398f984af7b67621b0a1dbe6193acff4015cefa1627bcd",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/REPAIR-B01-AUTHORITY.json": "b834a7be5484d7d14f2a9f9791d0961c4058c7031ccce52112621a9768b3ee27",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/REPAIR-B02-AUTHORITY.json": "257d0bcf5c2818f9e888807ed14adf720e2dc7de86a1592beec71cde7d56b0c7",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/REPAIR-B03-AUTHORITY.json": "0899629864add1664b0da3841a1c9e485f81d05d9b426074bd3fbd30babcf39c",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/REPAIR-PUBLICATION-BILINGUAL.json": "b88aaeac0442a59c7df2185a42af6f04806464901abce6bda253978b6031e986",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/REPAIR-PUBLICATION-EN.json": "505baf637081ea95894a6026df86b5fd38c1b77065e5e912c7579649e3d6f1ce",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/REPAIR-PUBLICATION-ZH_HANS.json": "917eb476ea93e88c1e18435b99bc03e2f762622a117d1fc09739a421261b7bb0",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/REPOSITORY-AUDIT.json": "3138f0b2b2df6d5c036ab8042c02a1066a1a076399b678f65b6b997a9afa66a0",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/S04_SEVEN_KILLINGS_PATCH.json": "4966406268a5624adda59cbef634956e674cdf27997011bab10d9fbc98a3184f",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/STATUS.md": "24ad42eb75eb98f0c56abf29786728216c1f468520e2b01ea73f487b1a2322d6",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/TECHNICAL-FIXTURE-IR.json": "9368d370ed5b97c19df590a6a437cf569e84d871285cf49712b3ea726e623c7b",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/TIMING_CONTRADICTION_PATCH.json": "3b2aa9e12bff2a4a3b2795195cba156aa2e9d245a8810a2881aeb5312a68471b",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/USAGE-RECONCILIATION.json": "85a57632700076ab0d70006c7be3adfa0ad19399d335f6bc67338712642a00c1",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/W22-GATE-EVIDENCE.json": "e83845fef31f5519d1365389c69d22c3d1f3ef6f887952044789dd8b5343f24b",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BAZI-FULL-REPORT-BILINGUAL.pdf": "24fdfd667102080811c901842abe44e63d1266d73f5fa633ae77806d81422ae4",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BAZI-FULL-REPORT-EN.pdf": "7ed73079cea69fff30737b19e8344abd117df33e0a30e8dab5192e5bc2529654",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BAZI-FULL-REPORT-ZH_HANS.pdf": "232057541099d5e97ed22ba441228ca7d5d43a5fdf8d2830c3b4423ebf901bd1",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-FIT-RECEIPT.json": "6d3cb497232d09ce6fa94130965cdfaf1406ce5d2bfcd641c1fa3422f647e851",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P1.png": "94ce2b8f5b95c4dd107e2bf7053d2d96d1c96f3e137810f8922e7d9090eebc6d",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P10.png": "6d387d235c740c7e1816ebaf530294347614d1ae704b37d278378eddca7415e7",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P11.png": "f733bb1e306218b5621ae58c9cac7f35d403e683c095198ef52b600e8545ad75",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P12.png": "424e6f785667bcd945f505ce632c9f7c34e2f88ae4a389970ecc5434dbeec66f",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P17.png": "6e226c7a88341c76ffaba79c8e2d0e0e9a8aefd9d3ee5bfa5abf46fc4914111b",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P2.png": "c00a9852f263da4093c65bb79f525d96853e906e24ceecee00fd63d5e2150287",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P20.png": "8f9efdfd0fa6d7a4b48c87fc2a6db0f7d3995647b77f3a51d9d9634f18c5b4e7",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P21.png": "2734bd16386ddbed3e1746dca4e0e54ae119bc2fc60e18b76033e210c9d216b6",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P22.png": "8bcec13ce270f8a115e099149f3e1db405bf6343a299e4bceba985cdd2a8123c",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P24.png": "d4a3914851bc098f3abeea3dfb8bc6706bad5c6b7708e62967053a6443176030",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P28.png": "4a199fbc8edf9bb7d48b1a73163ef75b99ca8ce5458758ae1c5fbe5910ddb6d1",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P29.png": "ad3765daefdfb192747da3841510aa4fad38b853b2dab5e9ec17f40dc1048ae2",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P3.png": "3a396f8db4bc144f57bf9f187a3e56319a8c1e1a6835251126f8b774b5530788",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P37.png": "2ccf4ba20d16df9ac4d7edcb20de59f97df8db60baf5f6f77e07ea9299155c8d",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P4.png": "a4a31e09c00bf48773b777956850904345cac4be7254878a84e191c9091822ec",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P44.png": "e2dcacf9164be10155c3e8996ce10b8bd55cf1f161532939ecb7328086b1a407",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P45.png": "4ef7f88992a347ed474022d91715a23b870442316595777f8393a9f1f6695164",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P47.png": "d1469411aaa19c6138caf5e4e676f21bfbed22a5f938645099a01698342a70f4",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P5.png": "5c6a83f8cbf0b45619bf1c5ed0462daaf116d9a34469c586a6d224a799c0348d",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P7.png": "31805778b7f97171b89c1447a2da21a050fc0b63df26ecfbe484a056acee2975",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-P9.png": "ffcd93dff96cb809fe79d3cc46e12f02a55037a8c9e9996e15e42a48f1b09181",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-READABILITY-P17.png": "6e226c7a88341c76ffaba79c8e2d0e0e9a8aefd9d3ee5bfa5abf46fc4914111b",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-READABILITY-P21.png": "2734bd16386ddbed3e1746dca4e0e54ae119bc2fc60e18b76033e210c9d216b6",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-READABILITY-P29.png": "ad3765daefdfb192747da3841510aa4fad38b853b2dab5e9ec17f40dc1048ae2",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BILINGUAL-READABILITY-P37.png": "2ccf4ba20d16df9ac4d7edcb20de59f97df8db60baf5f6f77e07ea9299155c8d",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BROWSER-FIT-BILINGUAL.json": "5eda804ec8cdf5ca05754f5121f2ec6cbc576936d50541d65ec3118c5eab140a",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BROWSER-FIT-EN.json": "7d67bdcc43883010012b86f93fca8a4914ab7f1a5e9f644c9fad792350f1dd76",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BROWSER-FIT-ZH_HANS.json": "fcb0bf159b65b596005910c85298e50253ccb90bf7114aaa8f29342a60d5f1dc",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-FIT-RECEIPT.json": "17812d1d5f221051bba66249d6fe893b309274fc49faaae3c3ca2a7ae2ba38a8",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P1.png": "3c73bd18c3f927aec1615eb4687dc64e60b70f9a736b0974d26ecd6b2948da93",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P10.png": "d34c8833ccb114de48a57933f714844908ab3fb4e829948cfaca64d468eb4417",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P11.png": "7ec7574e31ae54b2ded2080bc6264291440d62ad9d1183c6414f6021dd92b373",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P12.png": "726bf4b1c5d351758b07cd0d8b766f3474455623ed6986e6c92a3239d832c167",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P17.png": "a688b705959b01a9009585d37aab2b181fbed14b8025595598efd0f46e2920da",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P2.png": "2c5b0103b65aa5c48bacbbb38b332668faa6a377aa6c44d19fe0d80ba334dcd9",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P20.png": "b002735a4fdd185c2dc6be6681de0397c447f06e70884c90ed2340e7f330a8f5",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P21.png": "cae887c382e7b00ab9a14d7de5602d660022300333076ea6f58e8b2e31a4cd38",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P22.png": "7ec61e317ad1e6e34988b25924710df3fd751ba8e273e8d55b4918952a7b001b",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P24.png": "1c8f182c8e32aa7817e9c17e2842cc439fd155711fe87dcacd6b57b4a7193f2d",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P28.png": "df6603b7e0afd5bd5df94f3e573d30396abf7d4b4806a2e50707aafca8139947",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P29.png": "5484dea61114ae5e2b176bdb875e42da659af3aba0b091dd4871dd9efe96308e",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P3.png": "369a71100e8d1d02a28452c13b30cb2e0359220d1ff83616651d892393bdc32f",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P37.png": "dad4165f0d5d0d17f07a9588cf5cae1b1a7344fff01d1eac914bd3679ccdf984",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P4.png": "84701e35c495ffaa7f365c81ff4aa1dc235c145b0f5cbbb4f906e55ec15dfa6a",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P44.png": "aba9dd81f6aed210f93f29f14de0310be9bf2a9617c1f1f958afb2424256b60d",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P45.png": "0b4017d7e378746bdd81dfcff09832bf5e286136e16ef206e23bc933a9c03e14",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P47.png": "2c111ff0f9d3759724f1d29f36b257d767419ede9f9e9ed0118f91db2aead04c",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P5.png": "c3b9ea07a3a15a1b857ba18c15dd20b3bd8cf6f684cd8a0ccd7ee20bdc3941e9",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P7.png": "7cff494bbf9d35206959deed6690af5078a12d8135e7a2e378cbb356d37a5f73",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-P9.png": "91276b66822140ea8cc5bb8db3711bb7383d50591cccb8fd9f31528739961f05",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-READABILITY-P17.png": "a688b705959b01a9009585d37aab2b181fbed14b8025595598efd0f46e2920da",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-READABILITY-P21.png": "cae887c382e7b00ab9a14d7de5602d660022300333076ea6f58e8b2e31a4cd38",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-READABILITY-P29.png": "5484dea61114ae5e2b176bdb875e42da659af3aba0b091dd4871dd9efe96308e",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/EN-READABILITY-P37.png": "dad4165f0d5d0d17f07a9588cf5cae1b1a7344fff01d1eac914bd3679ccdf984",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/NEGATIVE-FIT-TESTS.json": "4596b6a27fc14da730ddefbc42b7ff60ce989d060c2267f874efc72270e3472e",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/PDF-FIT-BILINGUAL.json": "e6beebbdc4ae49f0b7eccdcc57c47e96234256c3ffa574ffd4aa4fac0ccf9b96",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/PDF-FIT-EN.json": "dc7c32d6e0d2c54992574790dd4dcfdbef037a032c66cc89efdb5374376188b2",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/PDF-FIT-ZH_HANS.json": "bc566d6091768bbf68d95d117a89ae3bd7578b865d8bcd7a2685d1d127f788f9",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/PDF-INDEPENDENT-TEXT-RECEIPT.json": "81e860f8791f3776f9da9612f5456d06d3d4209fdc61352a37c1a6d58a78f96a",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/PDF-TEXT-CONTINUITY.json": "e95d5b47fd25f9e2d9728c172eb5086cae551c4f9cf17289ca40ff7708031265",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/PRINT-FIT-BILINGUAL.json": "fea9bc157261c4f079d92b7fc5075ba3dd21dc25ebfca6e65df2fc0a831e1fb0",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/PRINT-FIT-EN.json": "a8f1ba6923a1a853f87e7db60c4f647a602ae7fe07bb4488d772ecb77a40b2f9",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/PRINT-FIT-ZH_HANS.json": "6984821d908219d2948d0e349ced627bcf1967f8e04287473a63d9acba6576e2",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/READABILITY-R4-RECEIPT.json": "dee94365abc7938bc98f34bffb3bdfb98aeceacfeff37e323b6998cedb5f396f",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/SUMMARY.json": "91abbe2e9931e1d6430db114fe48652bd09d8237299b8cf2b14b4685a9563c9c",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH-HANS-READABILITY-P17.png": "c6e66107fedc552170910c11c8b7d5486e096ea639cd4c4ac9b3514f7a7d3189",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH-HANS-READABILITY-P21.png": "15c45b21f441fc6cfd11d76b367133f7ef34ba37622551770c17b80b8a3b37b8",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH-HANS-READABILITY-P29.png": "973d23b706385055d0043fbed137d159457490ad6228407524847a0e27ab3e87",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH-HANS-READABILITY-P37.png": "f9f342a32566562d716b6d49e2bbe3f3ba6e55fce798945a6cf49d9bc3dd963b",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-FIT-RECEIPT.json": "fc520574972497373f8a2a75f4326ba01e70f980b013490a4c019d9808a4bc45",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P1.png": "6de08722dbc70dcacd2b6ab69b6b36df7397d22038710fac8d8a727e28ee90c2",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P10.png": "7cf7d883fa8c71f262d78854368b8c881f9ca54edb765ef14a3d835280ade6cd",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P11.png": "2d96cd0eb877edc8122804eb1fc03f7799022f7ed31589ec868f19a0a39f45cc",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P12.png": "6e8c2e0db062dea7b2662bb93113f0c1ce9b05a7b7ddbeae8109a21c6a74b22b",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P17.png": "c6e66107fedc552170910c11c8b7d5486e096ea639cd4c4ac9b3514f7a7d3189",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P2.png": "3134ae5609b2fe1cd9bd648ba31daf2baa99bab7cf16286266b3bae5034365bc",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P20.png": "a19269fecf4c543baafdd13959881524609f59b205bbafd3d4af4f971d594fa9",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P21.png": "15c45b21f441fc6cfd11d76b367133f7ef34ba37622551770c17b80b8a3b37b8",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P22.png": "d1beebfe20f99e91ba48b59b5bee04dfbd204f7b3fa5b0e2e82d2afa8f531cda",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P24.png": "9901a5a4e866e33cc39947650897bfaa08360b9f3fa97778bad4267ff3ca824b",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P28.png": "f57f56e217e06300da8462019a3c9c914279777b286a4ef982b294aebb285136",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P29.png": "973d23b706385055d0043fbed137d159457490ad6228407524847a0e27ab3e87",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P3.png": "0351d44059d4a0406a7efd5cd8f2b90dddd0668620023b74e857edcaf407e1f4",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P37.png": "f9f342a32566562d716b6d49e2bbe3f3ba6e55fce798945a6cf49d9bc3dd963b",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P4.png": "91757e73c2e0004fa8c96203a0bb44c5091a37cb996829a02262e98995d1a941",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P44.png": "b64cb27cfc5b454d9494fb3ae3b026baf392f21f32e41063d8f8b5e89cec31d5",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P45.png": "9d3e0e2adef6212c22966f44c84bac3c1128d7f7a3aedfc008e498f416f38eef",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P47.png": "16411d6f49838f69f6f1ec8d3dfcdfa98d32dcd253f9b25103ae967966597c65",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P5.png": "694f0b00de4fe522d839da387bd5014012dd510279cb6708dc25c5dc8e2e85b7",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P7.png": "e276cdf28809a3e11f64c2a341891132cfb1bdb8765134947ad11fe64135e1db",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/ZH_HANS-P9.png": "d7999bd6b4f69d93bcb63d8575e2dfb20ea64aa796113a840882de6ba3e9ed5c",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-r1/BILINGUAL-FIT-RECEIPT.json": "328f519bf14d974941d7a1c48d43f1d8951a04d223142b60f4ce9a7b7a8d45da",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-r1/EN-FIT-RECEIPT.json": "6ea1f650ca1c3c54b562bbd1ac64e6934328d41454b3e1e171035c4f8dc5157e",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-r1/PDF-TEXT-CONTINUITY.json": "a1309fa59ec733858afb77880ff14206fb91e63c32d9e4fdc1af74b22f5122ee",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-r1/SUMMARY.json": "4e638cfd273c6de08e2b50fa6b6aa9ce5bfd807bd651eadf3c455cc9793fbeda",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-r1/ZH_HANS-FIT-RECEIPT.json": "84decd127af03cb0e6fa73bf419a218010ade9579ec77ab390d2fce24f91bfcd",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-07T09-06-19-373Z/GLOBAL-REPOSITORY-CHECK-R3.4.json": "5183bd91b1a71b6048ea2dde70a7efdc44d75959c4d944093f73de80c0edaa88",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-07T09-06-19-373Z/GLOBAL-REPOSITORY-CHECK-R3.4.log": "07d92cffe78d5a7d31b2962af3c88f0a94d2bd7656bca46bb037af9080af9295",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-07T09-06-19-373Z/HUMAN-VISUAL-ACCEPTANCE-R2.json": "1036d05aec9aafad6044572570a753e02a918a2c3807969184bb7019960bfce4",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-07T09-06-56-946Z/GLOBAL-REPOSITORY-CHECK-R3.4.json": "b6d0d31a6eb1db51ea642a4cdf338c1f7d9c0a7fe322fbc66f9dd722682d101b",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-07T09-06-56-946Z/GLOBAL-REPOSITORY-CHECK-R3.4.log": "8abe402ac93a97b3d7970dd701df66039d5b8ba0f68d64ada828804732bef76b",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-07T09-06-56-946Z/HUMAN-VISUAL-ACCEPTANCE-R2.json": "23fbfa475ae459f68ecc05ccd59c39a06ddd55d9bc1a0ef84ea9e53cf6f70ef4",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-07T10-03-14-291Z/HUMAN-VISUAL-ACCEPTANCE-R2.json": "bde398bec3d96613482014f05f9cdea0c7f96c8186be99f4656bb5df7c3380a2",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-07T10-04-08-558Z/GLOBAL-REPOSITORY-CHECK-R3.4.json": "ce343a2ba33e17ee5192275894b8ea30b9ebc250f0c2cca5cbb7ba2f229e5d80",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-07T10-04-08-558Z/GLOBAL-REPOSITORY-CHECK-R3.4.log": "ccb24b2218e71928f9dc95adb02e1dec8f270ef43639142137bf2a6e4058a880",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-07T10-04-08-558Z/HUMAN-VISUAL-ACCEPTANCE-R2.json": "5c37b62f64510834b26a9133e56f99c5f0ad347da7409a379cd64bc18e2c60b2",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-08T01-19-39-266Z/GLOBAL-REPOSITORY-CHECK-R3.4.json": "f7c851b48a8b2fce77d19c9ea78f7ee70ef48fb88e02d466bc4f335e25456aff",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-08T01-19-39-266Z/GLOBAL-REPOSITORY-CHECK-R3.4.log": "5b0962ab4aff3af44d1b42fc77d360a35ef9d978f9c13ba17f88429f926e7f39",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-08T01-19-39-266Z/HUMAN-VISUAL-ACCEPTANCE-R2.json": "504cbdd2ec498afde94120a74e068ea87e1512e1d498c8547f9d2855cbf7b189",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/readability-r4-backups/1791349896025/assets__customer-ui__js__personal-products__bazi-deep-manuscript-pages.js": "6ec36091fd1995db484363baf83cebc068446470d539624447d0c6442b37d6f9",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/readability-r4-backups/1791349896025/assets__customer-ui__surfaces__bazi-deep-manuscript-r2.css": "56c74b5d2cdcf56a741bdfdb78399b880f348d7220360141bd3e2c76ee01bdc3",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/readability-r4-backups/1791349896025/manifest.json": "c150f31e61e42143bafe9ac295cbf568818129cd4869ee8e1f3b3e2e9d94e44a",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/readability-r4-backups/1791349896025/scripts__check-bazi-final-closure-browser.mjs": "83dd9f503ccbecf2b73b072adf54da728a4c90fa7da9893ffe0914eb271a9aaf",
+    "docs/acceptance/bazi-paid-report/deep-manuscript-r2/readability-r4-backups/1791352174293/manifest.json": "adfd03e0fa5283041c8fed8a2f85e92be7d9458fd8fc1ccd90393f0cfaab2423",
+    "docs/reports/ziwei/vfr-r1/COMPACT-AUTHORING-PACK.json": "146c5da4366566098f077bec14e9cbc8b32c5cdf77faf32eec2ee001bfb5c19f",
+    "docs/reports/ziwei/vfr-r1/DEEP-PUBLICATION-IR.json": "e7ee797892df55414959a16d93d190e69394a86bc7f94177abc5c803782cf7e6",
+    "docs/reports/ziwei/vfr-r1/DEEP-RENDER-CACHE.json": "3e121f133825e656161659be0bb5563646568a2261f1271a750c3b155dac203b",
+    "docs/reports/ziwei/vfr-r1/DIAGRAM-DATA.json": "7d7ce8efe07e29e6c5b2c3a91136b59ea8ca46fb44d670603ac5cf4e23762196",
+    "docs/reports/ziwei/vfr-r1/HUMAN-DECISION.json": "81e31ab108602135616965c0c92d838085ddb0f5561c02c02ceb09f8958dc611",
+    "docs/reports/ziwei/vfr-r1/IMMUTABLE-CACHE.json": "eefa949bf5758eaae5393555d8a2478683da5855b818f79b9ca1cc7f31e5fa2d",
+    "docs/reports/ziwei/vfr-r1/LIVE-EVIDENCE.json": "4b4f6c2256f634c7a55cf7a397fcc363e7fb8a627390439ab3b4cfce9e4902d4",
+    "docs/reports/ziwei/vfr-r1/LIVE-FAILURE.json": "51e8c93e9c917a6c18ed9b3594a844eeb1a4c08a4649b976abb01e30ffed39a6",
+    "docs/reports/ziwei/vfr-r1/LIVE-RESULT.json": "2bbf357332dede2d88c21e5114ac190c3065115f2cf3d9e6ecde61ffcc278935",
+    "docs/reports/ziwei/vfr-r1/PAGE-PLAN.json": "d5ec704abe652e89c85130864abbd14a60d82ee057c470c6a93e06987232ca43",
+    "docs/reports/ziwei/vfr-r1/PRODUCTION-CUTOVER.json": "f4e2b428dc6ee06e39690c957f73cff39fac01985530568f9dcc5e6773d20fcd",
+    "docs/reports/ziwei/vfr-r1/PUBLICATION-FIT-PLAN.json": "334e116dd2abc1be1982c69ae9387ab1572712ab07507e4682f536ec34a4f378",
+    "docs/reports/ziwei/vfr-r1/STATUS.md": "0a257f85a914489904b6e2565c7ebee3814fbf548494e434b1e4cb5120341cbf",
+    "docs/reports/ziwei/vfr-r1/five-call-experiment/CHECKPOINT-MIGRATED.json": "9df519f68ae3296be609e77cdadc403f8a13b925417a8b663abd587c0179e750",
+    "docs/reports/ziwei/vfr-r1/five-call-experiment/COMPARISON.json": "3e17ce3457d70f0991255809243f6e57d19d1ef35c5af449a6dee628ddcbe9e9",
+    "docs/reports/ziwei/vfr-r1/five-call-experiment/COMPLETENESS-MANIFEST.json": "63471a654e1944e9b030842e409835eafd2798a665d08e561931d0668db487d8",
+    "docs/reports/ziwei/vfr-r1/five-call-experiment/FAILURE.json": "44e01a40d0a51df09d833df91e825e345bad79119d86a4dd5a5093f46ed3805d",
+    "docs/reports/ziwei/vfr-r1/five-call-experiment/PACK.json": "146c5da4366566098f077bec14e9cbc8b32c5cdf77faf32eec2ee001bfb5c19f",
+    "docs/reports/ziwei/vfr-r1/five-call-experiment/PLAN.json": "7af1180e06550e81918718897091f3cc0072e72410e5b090beed580011c97a11",
+    "docs/reports/ziwei/vfr-r1/five-call-experiment/REPAIR-PLAN.json": "af2f890eb779a31ed109c49a926e106d224eb2a86035bfcdfb9803ea3982f84c",
+    "docs/reports/ziwei/vfr-r1/five-call-experiment/REPAIRED-RESULT.json": "4fa6604f3f54f1522bca0f89c834cca92d511928c33b40f6e4f2ed038b7ad3f9",
+    "docs/reports/ziwei/vfr-r1/five-call-experiment/RESULT.json": "fdcbc258038ebbd2384ef081c9611afd3c956960dbc3873301aafecae1755b0b",
+    "tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html": "7486b9a63165137d8330b1d68eed281148b1cf1e76af5129e4d43e902c03f05a",
+    "docs/reports/shared-report-e2e-r2/historical-r2-contract-v2.json": "a6df943e849d327a55c16bc2a1130563b0362aae0e1b3514d4175f32d4b58121",
+    "docs/reports/shared-report-e2e-r2/historical-r2-proof-runtime.js.txt": "4a085020af59c0786361e84479de49dd5834d032c9b5af332ef7a13286813426",
+    "docs/reports/shared-report-e2e-r2/historical-r2-readiness.mjs.txt": "e3e644cecce3130248b4960cd95fc84f92417db7e98fda1711a2ba67b8c69ce0",
+    "docs/reports/SHARED-REPORT-E2E-REFERENCE-v1.json": "0c0fd6ca541b61d89ed20b57da3fd786b508979c5115870ecc79ba70b742ae60"
+  },
+  "r2ReconciliationHead": "35b7420d64526950dac8012e2c2dd6cc82bb7618"
+}
diff --git a/docs/reports/delivery-r4/ASTROLOGY-METHOD-DELIVERY-DELTA-v1.json b/docs/reports/delivery-r4/ASTROLOGY-METHOD-DELIVERY-DELTA-v1.json
new file mode 100644
index 00000000..f777274d
--- /dev/null
+++ b/docs/reports/delivery-r4/ASTROLOGY-METHOD-DELIVERY-DELTA-v1.json
@@ -0,0 +1,43 @@
+{
+  "schemaVersion": "METHOD_REPORT_DELIVERY_DELTA_V1",
+  "methodCode": "AST",
+  "sourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "nativeOwnerRef": "content/professional/ast-full-production/admission/ast-fp-r4a-professional-semantic-human-admission-v1.json",
+  "nativeOwnerSha256": "1f03127c8a03aeb0db15ebb80d123096e59481d663b861091fa078f127b2f66c",
+  "status": "BLOCKED",
+  "publicationProfileRef": "content/reports/method-publication-profiles-v1.json#AST",
+  "generationVersion": null,
+  "semanticVersion": null,
+  "publicationVersion": null,
+  "rendererMode": null,
+  "rendererVersion": null,
+  "pagePlanMode": null,
+  "expectedPageRule": null,
+  "diagramRule": {
+    "nativeOwnerOnly": true,
+    "count": null
+  },
+  "localeRule": "NATIVE_OWNER",
+  "generationProviderRule": "NATIVE_OWNER_UNRESOLVED",
+  "publicationProviderRule": 0,
+  "rerenderProviderRule": 0,
+  "reopenProviderRule": 0,
+  "semanticReviewRule": null,
+  "releaseEligibilityRule": "ALL_APPLICABLE_NATIVE_AND_SHARED_GATES_REQUIRED",
+  "subjectBindingRule": "NATIVE_OWNER_REQUIRED",
+  "methodSpecificNegativeAccessCases": [
+    "AUTHORIZATION_ON_CACHE_HIT",
+    "WRONG_ACCOUNT_DENIED"
+  ],
+  "fullSharedE2ERepeated": false,
+  "localDeltaProof": null,
+  "deployedProof": null,
+  "blockers": [
+    {
+      "owner": "content/professional/ast-full-production/admission/ast-fp-r4a-professional-semantic-human-admission-v1.json",
+      "reason": "R4A is now 21/21 admitted; R5 customer acceptance and method-native publication/delivery adapter remain required.",
+      "minimumNextAction": "Resolve native profile fields and method adapter; execute scoped method delta verification."
+    }
+  ],
+  "sharedDeliveryAuthorityEligible": false
+}
diff --git a/docs/reports/delivery-r4/CROSS-METHOD-DELIVERY-DELTA-v1.json b/docs/reports/delivery-r4/CROSS-METHOD-DELIVERY-DELTA-v1.json
new file mode 100644
index 00000000..e274f609
--- /dev/null
+++ b/docs/reports/delivery-r4/CROSS-METHOD-DELIVERY-DELTA-v1.json
@@ -0,0 +1,43 @@
+{
+  "schemaVersion": "METHOD_REPORT_DELIVERY_DELTA_V1",
+  "methodCode": "CROSS",
+  "sourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "nativeOwnerRef": "content/customer-experience-rebuild/r12r4b/cross/acceptance/cross-w26-final-production-admission-v1.json",
+  "nativeOwnerSha256": "7be66a77d1b7080e61330ccad9f1945ab9f77c81dae83ffcdc8aae3834d276d7",
+  "status": "BLOCKED",
+  "publicationProfileRef": "content/reports/method-publication-profiles-v1.json#CROSS",
+  "generationVersion": null,
+  "semanticVersion": null,
+  "publicationVersion": null,
+  "rendererMode": null,
+  "rendererVersion": null,
+  "pagePlanMode": null,
+  "expectedPageRule": null,
+  "diagramRule": {
+    "nativeOwnerOnly": true,
+    "count": null
+  },
+  "localeRule": "NATIVE_OWNER",
+  "generationProviderRule": "NATIVE_OWNER_UNRESOLVED",
+  "publicationProviderRule": 0,
+  "rerenderProviderRule": 0,
+  "reopenProviderRule": 0,
+  "semanticReviewRule": null,
+  "releaseEligibilityRule": "ALL_APPLICABLE_NATIVE_AND_SHARED_GATES_REQUIRED",
+  "subjectBindingRule": "NATIVE_OWNER_REQUIRED",
+  "methodSpecificNegativeAccessCases": [
+    "AUTHORIZATION_ON_CACHE_HIT",
+    "WRONG_ACCOUNT_DENIED"
+  ],
+  "fullSharedE2ERepeated": false,
+  "localDeltaProof": null,
+  "deployedProof": null,
+  "blockers": [
+    {
+      "owner": "content/customer-experience-rebuild/r12r4b/cross/acceptance/cross-w26-final-production-admission-v1.json",
+      "reason": "Historical PRODUCTION_ACCEPTED preserved; successor consumes only admitted component claims after all targeted component deltas pass.",
+      "minimumNextAction": "Resolve native profile fields and method adapter; execute scoped method delta verification."
+    }
+  ],
+  "sharedDeliveryAuthorityEligible": false
+}
diff --git a/docs/reports/delivery-r4/ECR-METHOD-DELIVERY-DELTA-v1.json b/docs/reports/delivery-r4/ECR-METHOD-DELIVERY-DELTA-v1.json
new file mode 100644
index 00000000..9e4f7100
--- /dev/null
+++ b/docs/reports/delivery-r4/ECR-METHOD-DELIVERY-DELTA-v1.json
@@ -0,0 +1,43 @@
+{
+  "schemaVersion": "METHOD_REPORT_DELIVERY_DELTA_V1",
+  "methodCode": "ECR",
+  "sourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "nativeOwnerRef": "content/embodied-configuration/v4-1/admission/ecr-customer-production-admission-r5.json",
+  "nativeOwnerSha256": "2474d19677f2aaeff5200cc97cc2ed34ea6f566209b353ee2429404931553d0a",
+  "status": "BLOCKED",
+  "publicationProfileRef": "content/reports/method-publication-profiles-v1.json#ECR",
+  "generationVersion": null,
+  "semanticVersion": null,
+  "publicationVersion": null,
+  "rendererMode": null,
+  "rendererVersion": null,
+  "pagePlanMode": null,
+  "expectedPageRule": null,
+  "diagramRule": {
+    "nativeOwnerOnly": true,
+    "count": null
+  },
+  "localeRule": "NATIVE_OWNER",
+  "generationProviderRule": "NATIVE_OWNER_UNRESOLVED",
+  "publicationProviderRule": 0,
+  "rerenderProviderRule": 0,
+  "reopenProviderRule": 0,
+  "semanticReviewRule": null,
+  "releaseEligibilityRule": "ALL_APPLICABLE_NATIVE_AND_SHARED_GATES_REQUIRED",
+  "subjectBindingRule": "NATIVE_OWNER_REQUIRED",
+  "methodSpecificNegativeAccessCases": [
+    "AUTHORIZATION_ON_CACHE_HIT",
+    "WRONG_ACCOUNT_DENIED"
+  ],
+  "fullSharedE2ERepeated": false,
+  "localDeltaProof": null,
+  "deployedProof": null,
+  "blockers": [
+    {
+      "owner": "content/embodied-configuration/v4-1/admission/ecr-customer-production-admission-r5.json",
+      "reason": "Existing governed human/semantic admission remains blocked; full-report review pending; no successor promotion.",
+      "minimumNextAction": "Resolve native profile fields and method adapter; execute scoped method delta verification."
+    }
+  ],
+  "sharedDeliveryAuthorityEligible": false
+}
diff --git a/docs/reports/delivery-r4/FINANCIAL-METHOD-DELIVERY-DELTA-v1.json b/docs/reports/delivery-r4/FINANCIAL-METHOD-DELIVERY-DELTA-v1.json
new file mode 100644
index 00000000..0397eebe
--- /dev/null
+++ b/docs/reports/delivery-r4/FINANCIAL-METHOD-DELIVERY-DELTA-v1.json
@@ -0,0 +1,43 @@
+{
+  "schemaVersion": "METHOD_REPORT_DELIVERY_DELTA_V1",
+  "methodCode": "FINANCIAL",
+  "sourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "nativeOwnerRef": "functions/account/released-report-material-store.js",
+  "nativeOwnerSha256": "30019e137087cafaf314aa4c4593d4e263dca73c5bdd0c0052098d0840c51c8a",
+  "status": "BLOCKED",
+  "publicationProfileRef": "content/reports/method-publication-profiles-v1.json#FINANCIAL",
+  "generationVersion": null,
+  "semanticVersion": null,
+  "publicationVersion": null,
+  "rendererMode": null,
+  "rendererVersion": null,
+  "pagePlanMode": null,
+  "expectedPageRule": null,
+  "diagramRule": {
+    "nativeOwnerOnly": true,
+    "count": null
+  },
+  "localeRule": "BILINGUAL_ONLY",
+  "generationProviderRule": "NATIVE_OWNER_UNRESOLVED",
+  "publicationProviderRule": 0,
+  "rerenderProviderRule": 0,
+  "reopenProviderRule": 0,
+  "semanticReviewRule": null,
+  "releaseEligibilityRule": "ALL_APPLICABLE_NATIVE_AND_SHARED_GATES_REQUIRED",
+  "subjectBindingRule": "NATIVE_OWNER_REQUIRED",
+  "methodSpecificNegativeAccessCases": [
+    "AUTHORIZATION_ON_CACHE_HIT",
+    "WRONG_ACCOUNT_DENIED"
+  ],
+  "fullSharedE2ERepeated": false,
+  "localDeltaProof": null,
+  "deployedProof": null,
+  "blockers": [
+    {
+      "owner": "functions/account/released-report-material-store.js",
+      "reason": "Existing private RR/PDF owner must be reused; specialist completeness, bilingual publication and shared delivery delta remain open.",
+      "minimumNextAction": "Resolve native profile fields and method adapter; execute scoped method delta verification."
+    }
+  ],
+  "sharedDeliveryAuthorityEligible": false
+}
diff --git a/docs/reports/delivery-r4/GLOBAL-REPOSITORY-CHECK-R4.json b/docs/reports/delivery-r4/GLOBAL-REPOSITORY-CHECK-R4.json
new file mode 100644
index 00000000..8cb10d68
--- /dev/null
+++ b/docs/reports/delivery-r4/GLOBAL-REPOSITORY-CHECK-R4.json
@@ -0,0 +1,13 @@
+{
+  "schemaVersion": "SHARED_DELIVERY_GLOBAL_REGRESSION_R4",
+  "migrationGlobalStatus": "NOT_RUN_OPTIONAL",
+  "status": "NOT_RUN",
+  "finalGlobalStatus": "BLOCKED_UNTIL_REAL_LIVE_PHASES",
+  "sourceHead": "35b7420d64526950dac8012e2c2dd6cc82bb7618",
+  "scopedRegression": "PASS",
+  "reason": "Lane A scoped verification completed. Full repository migration regression optional; final admission regression must follow real live phases.",
+  "providerCalls": 0,
+  "originalSourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "mainIntegration": "LOCAL_PASS",
+  "deploymentBlocker": "CLOUDFLARE_NOT_AUTHENTICATED"
+}
diff --git a/docs/reports/delivery-r4/HUMAN-DESIGN-METHOD-DELIVERY-DELTA-v1.json b/docs/reports/delivery-r4/HUMAN-DESIGN-METHOD-DELIVERY-DELTA-v1.json
new file mode 100644
index 00000000..4a736376
--- /dev/null
+++ b/docs/reports/delivery-r4/HUMAN-DESIGN-METHOD-DELIVERY-DELTA-v1.json
@@ -0,0 +1,43 @@
+{
+  "schemaVersion": "METHOD_REPORT_DELIVERY_DELTA_V1",
+  "methodCode": "HD",
+  "sourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "nativeOwnerRef": "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/production/HD-PRO-R3-W25-production-cutover-v1.json",
+  "nativeOwnerSha256": "bc9e32ba6388777098badaa5c02589b4eb8d259f980fb61455f781a0204f78d3",
+  "status": "BLOCKED",
+  "publicationProfileRef": "content/reports/method-publication-profiles-v1.json#HD",
+  "generationVersion": null,
+  "semanticVersion": null,
+  "publicationVersion": null,
+  "rendererMode": null,
+  "rendererVersion": null,
+  "pagePlanMode": null,
+  "expectedPageRule": null,
+  "diagramRule": {
+    "nativeOwnerOnly": true,
+    "count": null
+  },
+  "localeRule": "NATIVE_OWNER",
+  "generationProviderRule": "NATIVE_OWNER_UNRESOLVED",
+  "publicationProviderRule": 0,
+  "rerenderProviderRule": 0,
+  "reopenProviderRule": 0,
+  "semanticReviewRule": null,
+  "releaseEligibilityRule": "ALL_APPLICABLE_NATIVE_AND_SHARED_GATES_REQUIRED",
+  "subjectBindingRule": "NATIVE_OWNER_REQUIRED",
+  "methodSpecificNegativeAccessCases": [
+    "AUTHORIZATION_ON_CACHE_HIT",
+    "WRONG_ACCOUNT_DENIED"
+  ],
+  "fullSharedE2ERepeated": false,
+  "localDeltaProof": null,
+  "deployedProof": null,
+  "blockers": [
+    {
+      "owner": "content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/production/HD-PRO-R3-W25-production-cutover-v1.json",
+      "reason": "HD_PRO_R3 CUSTOMER_PUBLISHED preserved within existing scope; private delivery adapter and source-rights scope resolution remain open.",
+      "minimumNextAction": "Resolve native profile fields and method adapter; execute scoped method delta verification."
+    }
+  ],
+  "sharedDeliveryAuthorityEligible": false
+}
diff --git a/docs/reports/delivery-r4/LOCAL-VERIFICATION-R4.json b/docs/reports/delivery-r4/LOCAL-VERIFICATION-R4.json
new file mode 100644
index 00000000..1838da69
--- /dev/null
+++ b/docs/reports/delivery-r4/LOCAL-VERIFICATION-R4.json
@@ -0,0 +1,49 @@
+{
+  "schemaVersion": "SHARED_DELIVERY_LOCAL_VERIFICATION_R4",
+  "sourceHead": "35b7420d64526950dac8012e2c2dd6cc82bb7618",
+  "remoteHeadObserved": "44444063294703ffd4826e39b6e3638e3fae39fc",
+  "scope": "LOCAL_SQL_AND_SYNTHETIC_TRANSPORT_ONLY",
+  "status": "PASS",
+  "providerCalls": 0,
+  "newProviderCost": 0,
+  "fakeWritingTransportCalls": 5,
+  "fakeRendererCalls": 1,
+  "localFixturePageCount": 68,
+  "pageCountAuthority": "RECOMPUTED_NATIVE_PLAN_LENGTH",
+  "notDeployedProof": true,
+  "checks": {
+    "readinessV2": "PASS",
+    "protectedSources": "PASS",
+    "cacheSequentialConcurrent": "PASS",
+    "cacheCrossIsolateClaim": "PASS_ONE_WINNER_OTHER_BUSY_RETRY_REUSES_READY",
+    "cacheFailureAutoRetry": "DENIED",
+    "differentPersonRevisionAuthorityOwnerCacheKeys": "PASS",
+    "immutableSnapshot": "PASS",
+    "materialReceiptAndIdentityTampering": "DENIED",
+    "missingMaterial": "DENIED",
+    "inactiveRelease": "DENIED",
+    "revokedEntitlement": "DENIED",
+    "revokedConsent": "DENIED",
+    "wrongAccountSubject": "DENIED",
+    "proofTampering": "DENIED",
+    "sameSessionReopen": "DENIED",
+    "unrevokedPreviousSession": "DENIED",
+    "missingSession": "DENIED",
+    "openReleasedClaimsGeneration": "FALSE",
+    "reopenProviderCalls": 0,
+    "reopenRendererCalls": 0,
+    "cutoverSuccessorAdmissionFalse": "PASS",
+    "acceptedStyleAndHtml": "UNCHANGED",
+    "canonicalAccountPerson": "PASS",
+    "zpaAccess": "PASS",
+    "cloudflareFunctionImport": "PASS",
+    "providerSpendGuard": "PASS",
+    "workerDryRun": "PASS",
+    "pagesFunctionsCompile": "PASS"
+  },
+  "liveProof": "NOT_RUN",
+  "productionActivated": false,
+  "originalSourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "mainIntegration": "LOCAL_PASS",
+  "deploymentBlocker": "CLOUDFLARE_NOT_AUTHENTICATED"
+}
diff --git a/docs/reports/delivery-r4/MAIN-INTEGRATION-REVIEW-R4.json b/docs/reports/delivery-r4/MAIN-INTEGRATION-REVIEW-R4.json
new file mode 100644
index 00000000..56e1b96c
--- /dev/null
+++ b/docs/reports/delivery-r4/MAIN-INTEGRATION-REVIEW-R4.json
@@ -0,0 +1,42 @@
+{
+  "schemaVersion": "SHARED_DELIVERY_MAIN_INTEGRATION_R4",
+  "sourceHeadBefore": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "integratedMainHead": "35b7420d64526950dac8012e2c2dd6cc82bb7618",
+  "status": "LOCAL_PASS",
+  "commit": false,
+  "push": false,
+  "deployed": false,
+  "scope": "LANE_A_SHARED_DELIVERY",
+  "conflictsResolved": [
+    "package.json",
+    "config/reports/zero-cost-check-commands.json",
+    "functions/account/ziwei-account-delivery.js",
+    "functions/api/shared-report-e2e-proof.js",
+    "functions/report-delivery/ziwei-vfr-r1-generation.js",
+    "scripts/check-shared-report-e2e-readiness.mjs"
+  ],
+  "r2ArchiveRefs": [
+    "docs/reports/shared-report-e2e-r2/historical-r2-contract-v2.json",
+    "docs/reports/shared-report-e2e-r2/historical-r2-proof-runtime.js.txt",
+    "docs/reports/shared-report-e2e-r2/historical-r2-readiness.mjs.txt"
+  ],
+  "nativeGenerationAdmission": "REQUIRED_BEFORE_REAL_PAID_CACHE_MISS",
+  "generationPhaseIndependentOfSharedFinalWave": true,
+  "installerBaselineGuard": "PASS_REJECTED_WITH_NO_WRITES",
+  "scopedRegression": "PASS",
+  "workerDryRun": "PASS",
+  "pagesBuild": {
+    "status": "PASS",
+    "fileCount": 11239,
+    "workerBytes": 15974859,
+    "gzipBytes": 2968827
+  },
+  "deployAuthentication": "UNAVAILABLE_WRANGLER_WHOAMI_NOT_AUTHENTICATED",
+  "providerCalls": 0,
+  "newProviderCost": 0,
+  "realAccountProof": "NOT_RUN",
+  "sharedDeliveryAuthorityEligible": false,
+  "cloudflareUserAuthorization": "USER_CONFIRMED",
+  "cloudflareDeviceFlow": "BLOCKED_BY_RUNTIME_NETWORK_POLICY",
+  "deploymentBlocker": "Network access to https://dash.cloudflare.com:443 blocked by policy"
+}
diff --git a/docs/reports/delivery-r4/METHOD-PUBLICATION-AUDIT-R4.md b/docs/reports/delivery-r4/METHOD-PUBLICATION-AUDIT-R4.md
new file mode 100644
index 00000000..aa027b3c
--- /dev/null
+++ b/docs/reports/delivery-r4/METHOD-PUBLICATION-AUDIT-R4.md
@@ -0,0 +1,149 @@
+# PHI OS — Lane A — R4 执行审计
+
+## WORK COMPLETED
+
+Lane A 本地实现已补齐：通用契约、ZWR 原生 profile、独立快照、动态渲染收据、持久化缓存、并发占位、材料校验、分阶段 proof 与离线负例。
+
+## SOURCE HEAD
+
+已将原工作副本从 `67254e3d039c842fca0cbd8edc392691ccd2166b` 快进并整合至 main `35b7420d64526950dac8012e2c2dd6cc82bb7618`。用户其他窗口的 Profile/BaZi/World 改动保留。
+
+## FINAL WORKTREE STATUS
+
+整合和审阅完成；当前 main 上保留可审阅的未提交补丁。没有创建新 commit、推送、部署或生产激活。逐文件分类见 WORKTREE-STATUS-R4.json。
+
+## FILES MODIFIED
+
+最新 main 的 R2 重叠项已逐项整合；package/零费用注册保留其他窗口新增项。16 个既有路径发生修改或归档迁移，详见工作树清单。
+
+## FILES CREATED
+
+通用 adapter/material/cache、原生 ZWR profile/version/style、SQL 0013、CPU 准备端点、v2 契约与检查器、方法 delta 和审计资料。逐文件路径见工作树清单。
+
+## PROTECTED FILE VERIFICATION
+
+PASS：344 个原保护来源保持原 SHA-256；另保护 3 个 R2 精确归档和历史 v1 参考，共 348 个文件。
+
+## R2 / R4 RECONCILIATION
+
+完成六处重叠整合。R2 旧契约、runtime、readiness 检查器精确归档；旧 v1 保留。旧 installer 加入严格 HEAD 基线检查，实测不匹配时写入前拒绝。57 页 fixture 在 R2 归档中保存，其历史结果不等于本次线上证据。
+
+## SHARED V2 GENERIC CONTRACT STATUS
+
+LOCAL READY：通用层无 ZWR 的 v3/v6/15/页范围常量；方法索引、session 与 rendererReceiptContract 显式。全共享权威仍未授予。
+
+## ZWR METHOD PROFILE STATUS
+
+LOCAL_PROFILE_RESOLVED：原生版本/双语/自适应/接受样式/正文跨度策略均有 owner 引用。部署及真实账户 delta 尚未通过。
+
+## ZIWEI CONTENT ACCEPTANCE STATUS
+
+EXISTING_ACCEPTED_REFERENCE。复用既有接受正文，不重复人审，不新增正文或语义 AI 审核。
+
+## ZIWEI SNAPSHOT SUCCESSOR STATUS
+
+LOCAL PASS：主体、出生修订、计算、authority、正文、IR、页计划、图示、profile 与 renderer contract 纳入身份；剔除旧 33 页 report。变化或篡改使身份验证失败。
+
+## ZIWEI COMPOSITION SUCCESSOR STATUS
+
+使用现有 ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3 和原生 Deep Publication IR。请求时间不改变输入相同的快照身份。
+
+## ZIWEI VFR RENDERER STATUS
+
+整合版 QA Worker dry-run PASS：1416.65 KiB，gzip 294.69 KiB；完整 Pages 构建 PASS：11239 文件，Worker 15974859 bytes，gzip 2968827 bytes。均未部署。
+
+## ADAPTIVE PAGE STATUS
+
+expectedPageCount = 重算原生页计划长度；收据绑定 plan digest、expected/actual、顺序、溢出、图片、必需内容可见性、版本与输出摘要。
+
+## 57-PAGE FIXTURE STATUS
+
+仅 R2 合成 fixture；本工作树未提供，未复跑，未写入生产断言。
+
+## 68-PAGE REPRESENTATIVE STATUS
+
+既有接受样本与当前离线样本均为 68 页；这是样本结果，生产页数保持动态。
+
+## DIAGRAM STATUS
+
+原生 ZWR 注册的 15 个图示恰好一次；数据从 canonical evidence 重建比对，包含结构节点/关系/数据引用；双语标题与可见内容已接入 Worker 检查。真实 browser 布局待验。
+
+## PRODUCTION ADMISSION STATUS
+
+productionAdmissionGranted=false；BLOCKED。内容接受不等于生产发布准入。
+
+## SEMANTIC CACHE STATUS
+
+LOCAL SYNTHETIC PASS：持久化缓存和账户/修订/authority/prompt/model/plan 键已验证。真实付费 cache miss 新增 deployed native generation admission 前置门；未配置或版本/来源不匹配时先拒绝，模拟离线依赖不授予线上准入。
+
+## PUBLICATION CACHE STATUS
+
+LOCAL SYNTHETIC PASS：绑定语义/快照、IR、页计划、图示、profile、renderer/styles 与展示模式。布局重新出版复用语义缓存；重复发布复用已验证 HTML。
+
+## FIRST-GENERATION IDEMPOTENCY STATUS
+
+LOCAL SYNTHETIC PASS：顺序/同实例并发复用；跨实例只有一个 durable claim，另一请求返回 IN_PROGRESS 并在后续读取相同 READY 身份。FAILED/遗留 claim 不自动重试付费。不同主体/修订/authority/账户键独立。
+
+## PRIVATE MATERIAL STATUS
+
+LOCAL PASS：账户/主体/购买 lineage、版本、快照、正文、IR、页计划、图示、renderer、receipt、输出和 ACTIVE release 在读取时交叉验证。历史有效材料保留既有收据模式。
+
+## OPEN-RELEASED STATUS
+
+LOCAL PASS：仅已有材料/权益/Library 证明；generationReleaseProven=false，不能替代真实生成发布阶段。私有阶段证明使用 HMAC 防篡改。
+
+## REOPEN STATUS
+
+LOCAL PASS：新已验证 session、旧 session 撤销、原 report/快照/正文/IR/页计划/材料摘要。写作和 renderer 均 0；真实退出登录未执行。
+
+## GENERATE-RELEASE LIVE PHASE STATUS
+
+PREPARED / NOT_RUN。原生方法真实生成阶段已与 all-method shared final gate 解耦，避免循环依赖；仍需真实权益、consent、私有 deployed renderer admission 和预算。
+
+## SECOND ACCOUNT STATUS
+
+LOCAL NEGATIVES PASS；真实 B 账户打开/Library/subject/material 隔离未执行。
+
+## RENDERER CPU STATUS
+
+PREPARED / NOT_RUN：冻结候选串行 3 后 5；记录阶段计时、图片、HTML、故障及动态页数，0 provider。
+
+## PROVIDER CALLS
+
+真实 provider 0；离线模拟写作 transport 5 次，模拟 renderer 1 次。缓存单元生产函数不是 provider 请求。
+
+## NEW PROVIDER COST
+
+0。未开启 live/provider/部署。
+
+## SCOPED REGRESSION STATUS
+
+PASS：整合版 readiness-v2、Cloudflare imports、原生 cutover/人审就绪/语法、canonical account、ZPA、费用保护继承、Worker dry-run、完整 Pages build、348 个保护摘要、diff 检查及 installer baseline 拒绝测试。
+
+## MIGRATION GLOBAL REGRESSION STATUS
+
+NOT_RUN（附件允许可选）。真实 live 后的 final global regression 独立且仍待执行。
+
+## LIVE QA STATUS
+
+NOT_RUN：Wrangler whoami 明确 NOT_AUTHENTICATED；环境未配置 Cloudflare token/account 或 provider key。未操作账户/结账/部署/CPU campaign。
+
+## SHARED DELIVERY AUTHORITY STATUS
+
+BLOCKED。finalize 要求真实生成发布、打开、新 session reopen、B 隔离、所有原生 delta、同快照 CPU campaign 及绑定 proof 摘要的 post-live global receipt。
+
+## CURRENT BLOCKERS
+
+整合和补丁审阅已完成。仍缺实际 Cloudflare 认证环境、QA migration/deploy、原生 deployed renderer admission、真实 A/B 账户阶段、CPU 稳定性、其他方法原生 delta 与 post-live 全库回归。
+
+## NEXT SHARED DELIVERY ACTION
+
+在有平台 Cloudflare 凭据的环境继续 QA renderer / Pages preview 部署，只迁移 sandbox RUNTIME_DB；随后完成真实分阶段验收。凭据不写入聊天或仓库，不使用临时 Cloudflare 账户。详见 NEXT-EXECUTION-R4.md。
+
+## ASTROLOGY HANDOFF STATUS
+
+本窗口未写或审核 Astrology R5。R4A 既有接受内容保持，等待另窗口交付客户出版与原生方法 delta。
+
+## CURRENT DECISION
+
+METHOD_MIGRATION_IN_PROGRESS；本地共享架构和 ZiWei delta 已就绪，实际共享交付准入 BLOCKED。
diff --git a/docs/reports/delivery-r4/NEXT-EXECUTION-R4.md b/docs/reports/delivery-r4/NEXT-EXECUTION-R4.md
new file mode 100644
index 00000000..5c1257ed
--- /dev/null
+++ b/docs/reports/delivery-r4/NEXT-EXECUTION-R4.md
@@ -0,0 +1,2114 @@
+# NEXT-EXECUTION-R4.md
+
+PHI OS METHOD REPORTS
+NEXT EXECUTION R4
+
+LANE A — SHARED DELIVERY SUCCESSOR
++
+ZIWEI VFR PRODUCTION SNAPSHOT / RENDERER / DELIVERY CLOSURE
+
+ONE FILE
+UNCOMPRESSED
+EXECUTABLE AGENT INSTRUCTIONS
+
+
+======================================================================
+0｜WORK ID
+======================================================================
+
+WORK
+
+PHI-OS-SHARED-DELIVERY-R4-NEXT-EXECUTION
+
+
+PRIMARY WORKSPACE
+
+/workspace/scratch/087ae7bca176/phios
+
+
+IMPORTANT
+
+This workspace contains the current uncommitted Shared Delivery / ZiWei
+VFR successor implementation.
+
+It is NOT the user's Windows repository:
+
+C:\phios
+
+Do not assume Windows main already contains this work.
+
+Do not tell the user to git pull this work until it has been committed
+and pushed through the authorized repository workflow.
+
+
+======================================================================
+1｜SOURCE OF AUTHORITY
+======================================================================
+
+Continue from:
+
+PHI OS METHOD REPORTS
+R4
+METHOD-CONFIGURED DETERMINISTIC PUBLICATION
++
+SHARED REPORT DELIVERY SUCCESSOR
++
+METHOD-DELTA FIRST
++
+ONE-TIME SHARED E2E FINAL CLOSURE
+
+
+Also incorporate:
+
+SHARED REPORT E2E / ZiWei VFR 后继契约修复 R2
+
+
+R4 is the governing architecture.
+
+R2 is a repair layer for the currently discovered ZiWei / Shared
+Delivery gaps.
+
+Where they differ:
+
+R4 governs the final architecture.
+
+R2 supplies concrete repairs to the ZiWei successor and shared proof
+layer.
+
+
+======================================================================
+2｜CURRENT OWNER DECISION
+======================================================================
+
+Freeze:
+
+Human ACCEPT applies to the report-generation system and accepted
+representative publication.
+
+Human ACCEPT is NOT required per customer chart.
+
+
+Normal ZiWei production remains:
+
+NEW CUSTOMER INPUT
+→ CANONICAL CALCULATION
+→ METHOD AUTHORITY
+→ AUTO-DEEP SEMANTIC GENERATION
+→ DETERMINISTIC COMPLETENESS
+→ TARGETED REPAIR WHERE GOVERNED
+→ VFR PUBLICATION
+→ RELEASE
+
+
+Do not restore:
+
+NEW AUTHORITY
+→ AUTHORING_REQUIRED
+→ HUMAN ACCEPT
+→ registry admission
+
+
+That model is rejected for ordinary production.
+
+
+======================================================================
+3｜CURRENT ZIWEI STATE
+======================================================================
+
+Treat current ZiWei state as:
+
+CONTENT
+= ACCEPTED
+
+REPRESENTATIVE DEEP MANUSCRIPT
+= ACCEPTED
+
+REPRESENTATIVE VFR VISUAL PUBLICATION
+= ACCEPTED
+
+15 CURRENT ZWD DIAGRAMS
+= ACCEPTED CURRENT VERSION
+
+AUTO-DEEP GENERATION ARCHITECTURE
+= ACCEPTED
+
+CANONICAL GENERATION CUTOVER
+= IMPLEMENTED
+
+PER-CUSTOMER HUMAN ACCEPT
+= NOT REQUIRED
+
+SEMANTIC AI REVIEW
+= 0
+
+PUBLICATION PROVIDER CALLS
+= 0
+
+RERENDER PROVIDER CALLS
+= 0
+
+REOPEN PROVIDER CALLS
+= 0
+
+
+BUT:
+
+PRODUCTION SNAPSHOT SUCCESSOR
+= NOT YET CLOSED
+
+DEPLOYED VFR RENDERER
+= NOT YET PROVEN
+
+REAL RELEASE/LIBRARY
+= NOT YET PROVEN
+
+SHARED LIVE E2E
+= NOT RUN
+
+
+Do not conflate generation cutover with delivery cutover.
+
+
+======================================================================
+4｜CURRENT IMPLEMENTATION LOCATION
+======================================================================
+
+Work from:
+
+/workspace/scratch/087ae7bca176/phios
+
+
+Before editing:
+
+git status --short
+
+git rev-parse HEAD
+
+git diff --stat
+
+git diff --name-only
+
+
+Record:
+
+CURRENT_HEAD
+
+DIRTY_FILES
+
+GENERATED_FILES
+
+NEW_FILES
+
+PROTECTED_FILES
+
+
+Do not overwrite unrelated user work.
+
+
+======================================================================
+5｜PROTECTED ACCEPTED ARTIFACTS
+======================================================================
+
+Do not modify:
+
+BaZi accepted manuscripts
+
+BaZi accepted R2 visual artifacts
+
+ZiWei accepted Deep Manuscript
+
+ZiWei accepted W9 HTML
+
+historical cost evidence
+
+historical provider ledgers
+
+human acceptance receipts
+
+historical R5 materials
+
+
+If a successor implementation needs a different production snapshot or
+renderer identity:
+
+create a successor binding.
+
+Do not edit historical accepted bytes.
+
+
+======================================================================
+6｜LANE A SCOPE
+======================================================================
+
+Lane A is only:
+
+SHARED DELIVERY
+
+including:
+
+shared method delivery contract
+
+method profile ownership
+
+renderer dispatch
+
+ZiWei VFR renderer successor
+
+snapshot identity
+
+material identity
+
+Library
+
+reopen
+
+access isolation
+
+future live shared E2E readiness
+
+
+Lane A does NOT continue Astrology content work.
+
+The user will continue Astrology in another ChatGPT window.
+
+
+======================================================================
+7｜FOUR MANDATORY CORRECTIONS
+======================================================================
+
+
+----------------------------------------------------------------------
+7.1 OPEN-RELEASED / REOPEN MUST NOT REPLACE REAL GENERATE → RELEASE
+----------------------------------------------------------------------
+
+The R2 proof API may use:
+
+open-released
+reopen
+
+for zero-cost shared persistence/session validation.
+
+This is correct.
+
+
+BUT final shared E2E still requires ONE real controlled:
+
+Account A
+→ entitlement
+→ canonical person
+→ generate
+→ render
+→ release
+→ private material
+→ Library
+→ logout
+→ relogin
+→ reopen
+
+
+Therefore split responsibilities:
+
+A.
+METHOD GENERATION / RELEASE PROOF
+
+B.
+SHARED OPEN / REOPEN PROOF
+
+
+Do not use open-released/reopen as evidence that actual generation and
+release occurred.
+
+
+Required explicit contract fields:
+
+generationReleaseProven
+
+releasedMaterialProven
+
+reopenProven
+
+sameImmutableSnapshot
+
+sameImmutableRenderedMaterial
+
+noProviderRegenerationOnReopen
+
+noRendererRegenerationOnReopen
+
+
+Final shared authority requires all applicable fields.
+
+
+----------------------------------------------------------------------
+7.2 VFR v3 / v6 MUST BE METHOD PROFILE DATA, NOT SHARED UNIVERSAL DATA
+----------------------------------------------------------------------
+
+Shared Delivery v2 MUST remain method-generic.
+
+
+Do not put these as universal shared requirements:
+
+ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3
+
+ZWR VFR v6 adaptive plan
+
+15 diagrams
+
+50–80 pages
+
+ZWD diagram IDs
+
+
+These belong to:
+
+METHOD PROFILE
+methodCode = ZWR
+
+
+Shared v2 only knows how to ask:
+
+what is this method's generation version?
+
+what is this method's publication version?
+
+what is this method's page-count rule?
+
+what is this method's renderer?
+
+what is this method's material contract?
+
+what is this method's release contract?
+
+
+Required structure:
+
+SHARED CONTRACT
+→ generic infrastructure rules
+
+METHOD DELIVERY DELTA REGISTRY
+→ method-specific contract
+
+ZWR PROFILE
+→ ZiWei-specific VFR rules
+
+
+----------------------------------------------------------------------
+7.3 57 PAGES IS FIXTURE RESULT ONLY
+----------------------------------------------------------------------
+
+The synthetic R2 test generated:
+
+57 pages
+
+
+Freeze:
+
+57 != production invariant
+
+
+Also freeze:
+
+68 != production invariant
+
+
+Current rule:
+
+expectedPageCount
+=
+recomputed vfrPagePlan.length
+
+
+Do not write checks like:
+
+pageCount === 57
+
+or:
+
+pageCount === 68
+
+
+The test may assert:
+
+fixture expected generated plan = 57
+
+only inside that exact immutable fixture test.
+
+
+Production validator must assert:
+
+receipt.pageCount
+===
+candidate governed page-plan length
+
+
+----------------------------------------------------------------------
+7.4 DO NOT REPEAT HUMAN REVIEW OF ALREADY ACCEPTED ZIWEI MANUSCRIPT
+----------------------------------------------------------------------
+
+Do not mark current ZiWei manuscript as:
+
+HUMAN_ACCEPT_PENDING
+
+if the successor uses the same accepted manuscript bytes/digest.
+
+
+Correct state:
+
+CONTENT_ACCEPT
+= EXISTING PASS
+
+
+What remains open is:
+
+production snapshot successor
+
+publication digest binding
+
+renderer successor
+
+render receipt binding
+
+release material binding
+
+
+Human re-review is required only if:
+
+customer-visible prose changed materially
+
+or
+
+customer-visible visual publication changed beyond the already accepted
+publication contract.
+
+
+Do not ask owner to reapprove identical accepted text.
+
+
+======================================================================
+8｜AUDIT CURRENT R2 PATCH
+======================================================================
+
+Inspect all current uncommitted R2 files.
+
+Produce:
+
+R2_FILE_MATRIX
+
+
+Columns:
+
+PATH
+
+PURPOSE
+
+NEW / MODIFIED
+
+R4 COMPATIBLE
+
+REQUIRES CHANGE
+
+PROTECTED IMPACT
+
+CURRENT BLOCKER
+
+
+Specially audit:
+
+shared v2 contract
+
+proof API
+
+ZiWei VFR generation admission
+
+snapshot derivation
+
+publication IR digest
+
+page-plan digest
+
+private material digest
+
+Library material helper
+
+renderer acceptance logic
+
+package scripts
+
+zero-cost registry
+
+synthetic test suite
+
+installer
+
+
+======================================================================
+9｜SHARED DELIVERY V2 CONTRACT
+======================================================================
+
+Shared v2 must define only shared infrastructure.
+
+Required top-level concepts:
+
+schemaVersion
+
+status
+
+sharedInfrastructureRequirements
+
+methodDeltaRegistryRef
+
+materialContract
+
+libraryContract
+
+sessionContract
+
+accessIsolationContract
+
+rendererReceiptContract
+
+liveProofContract
+
+reusePolicy
+
+privacy
+
+
+Do not embed ZiWei-specific values as shared requirements.
+
+
+Shared requirements:
+
+AUTHENTICATED_ACCOUNT
+
+VALID_ENTITLEMENT
+
+CANONICAL_SUBJECT
+
+METHOD_DELTA_PASS
+
+IMMUTABLE_SEMANTIC_SNAPSHOT
+
+METHOD_RENDERER_PASS
+
+ACTIVE_RELEASE
+
+PRIVATE_MATERIAL_PRESENT
+
+LIBRARY_VISIBLE
+
+NEW_SESSION_REOPEN
+
+SAME_SNAPSHOT
+
+SAME_MATERIAL_IDENTITY
+
+NO_PROVIDER_ON_REOPEN
+
+NO_RENDERER_ON_REOPEN
+
+SECOND_ACCOUNT_DENIAL
+
+
+======================================================================
+10｜METHOD DELIVERY DELTA REGISTRY
+======================================================================
+
+Keep or create canonical registry.
+
+For ZWR current successor include:
+
+methodCode = ZWR
+
+generationVersion =
+ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3
+
+publicationVersion =
+current VFR Deep Publication IR version
+
+pagePlanVersion =
+current adaptive v6 owner
+
+pagePlanMode =
+ADAPTIVE
+
+pageCountRule =
+PLAN_LENGTH
+
+renderer =
+ZIWEI_VFR
+
+diagramRule =
+current ZWD registry
+
+firstGenerationProviderPolicy =
+BOUNDED_METHOD_WRITING_ALLOWED
+
+semanticAiReviewCalls =
+0
+
+publicationProviderCalls =
+0
+
+rerenderProviderCalls =
+0
+
+reopenProviderCalls =
+0
+
+contentHumanAcceptance =
+EXISTING_ACCEPTED_REFERENCE
+
+releaseStatus =
+BLOCKED_UNTIL_SNAPSHOT_AND_RENDERER_SUCCESSOR
+
+
+Do not mark production admission PASS yet.
+
+
+======================================================================
+11｜INDEPENDENT ZIWEI VFR SNAPSHOT SUCCESSOR
+======================================================================
+
+This is a critical missing gate.
+
+
+Current VFR generation must not simply inherit:
+
+historical Production V1 snapshot identity
+
+historical 33-page compositionVersion
+
+historical report.totalPages
+
+historical publication digest
+
+
+Create a successor snapshot identity derived from:
+
+canonical subject identity
+
+canonical birth-input revision
+
+ZiWei calculation/evidence identity
+
+Authority digest
+
+Deep Manuscript digest
+
+Deep Publication IR digest
+
+VFR page-plan digest
+
+VFR diagram-data digest
+
+publication profile version
+
+renderer contract version
+
+
+Required:
+
+snapshot.semanticSnapshotId
+
+MUST represent the actual VFR successor content.
+
+
+Do not reuse old snapshot ID if semanticContent was extended after the
+snapshot was calculated.
+
+
+If semanticContent changes after snapshot derivation:
+
+recompute snapshot identity.
+
+
+Add regression test:
+
+POST_SNAPSHOT_MUTATION_MUST_INVALIDATE_ID
+
+
+======================================================================
+12｜COMPOSITION VERSION SUCCESSOR
+======================================================================
+
+Current VFR must have a current composition/publication identity.
+
+Do not use:
+
+ZIWEI-PRODUCTION-COMPOSER-V1
+
+for current VFR delivery.
+
+
+Use an explicit successor identity such as an existing current owner, or
+create the minimal canonical equivalent.
+
+
+Example concept:
+
+ZIWEI-VFR-R1-PUBLICATION-v1
+
+
+Do not invent a name if an existing current publication version already
+owns this role.
+
+Audit before creating.
+
+
+======================================================================
+13｜VFR RENDERER ADAPTER
+======================================================================
+
+Implement a real current VFR renderer adapter.
+
+Input:
+
+visualReportIr
+
+vfrPagePlan
+
+vfrDiagramData
+
+vfrPublicationFit
+
+
+Do NOT render current VFR by calling only:
+
+renderPublicationReport(
+ candidate.snapshot.semanticContent.report
+)
+
+
+That is historical publication input.
+
+
+Use the already accepted VFR rendering implementation.
+
+Preserve accepted visual treatment.
+
+Do not redesign.
+
+
+======================================================================
+14｜RENDERER DISPATCH
+======================================================================
+
+Shared worker dispatch must support:
+
+historical ZiWei versions
+
+AND
+
+current VFR successor
+
+
+Historical examples remain:
+
+ZIWEI-PRODUCTION-COMPOSER-V1
+
+ZIWEI-NATURAL-COMPOSER-R4
+
+ZIWEI-PROFESSIONAL-SYNTHESIS-R5
+
+ZIWEI-CONTEXTUAL-RCA-R1
+
+
+Add current VFR composition.
+
+
+Dispatch rule:
+
+released snapshot compositionVersion
+→ exact renderer contract
+
+
+Do not migrate old material to new VFR.
+
+
+======================================================================
+15｜ADAPTIVE PAGE VALIDATION
+======================================================================
+
+For current VFR:
+
+expectedPageCount
+=
+candidate.snapshot.semanticContent.vfrPagePlan.length
+
+
+Renderer receipt must bind:
+
+pagePlanDigest
+
+expectedPageCount
+
+actualPageCount
+
+pageSequenceValid
+
+overflowCount
+
+brokenImages
+
+hiddenRequiredContentCount
+
+errorCount
+
+rendererVersion
+
+snapshotId
+
+outputDigest
+
+
+No global fixed count.
+
+
+======================================================================
+16｜DIAGRAM VALIDATION
+======================================================================
+
+For current ZWR VFR version:
+
+validate current required ZWD registry.
+
+
+If the current profile owns 15:
+
+assert exact current profile requirement.
+
+
+Do not make 15 shared.
+
+Do not make 15 apply to other methods.
+
+
+Validate:
+
+diagram IDs
+
+exact occurrence
+
+required nodes
+
+required edges
+
+captions
+
+source-backed data
+
+locale assets
+
+
+======================================================================
+17｜PRODUCTION ADMISSION FLAG
+======================================================================
+
+Remove any unconditional:
+
+productionAdmissionGranted:true
+
+
+Use explicit method admission gate.
+
+
+Current expected state before deployed proof:
+
+productionAdmissionGranted = false
+
+or equivalent governed state:
+
+BLOCKED
+
+
+Only change after actual applicable gates pass.
+
+
+======================================================================
+18｜ZIWEI GENERATION GATE
+======================================================================
+
+Before a provider call, verify:
+
+method profile resolved
+
+semantic generation admitted
+
+required production environment settings present
+
+subject / entitlement / consent valid
+
+cache lookup completed
+
+idempotency policy applied
+
+
+Do not perform paid generation for a candidate that cannot ever be
+released due to an unresolved production profile.
+
+
+======================================================================
+19｜FIRST-GENERATION IDEMPOTENCY
+======================================================================
+
+Current reopen proof is not enough.
+
+
+Need separate proof for:
+
+same customer
+
+same canonical subject revision
+
+same Authority digest
+
+same generation plan
+
+same idempotency key
+
+
+Concurrent duplicate first-generation requests must not create multiple
+paid compositions.
+
+
+Use fake provider / saved response for deterministic tests.
+
+
+Test:
+
+same request sequential
+
+same request concurrent
+
+different subject
+
+different input revision
+
+different authority digest
+
+
+Expected:
+
+same admitted request
+→ one semantic generation identity
+
+different governed input
+→ distinct semantic identity
+
+
+No real provider calls during this test.
+
+
+======================================================================
+20｜SEMANTIC CACHE
+======================================================================
+
+Audit whether production currently caches complete accepted/generated
+Deep Manuscript by governed key.
+
+
+If no persistent semantic cache exists:
+
+implement successor cache owner.
+
+
+Key must include:
+
+method
+
+product
+
+method version
+
+canonical subject revision
+
+calculation digest
+
+authority digest
+
+prompt/schema/model route
+
+generation plan
+
+
+Do not use accepted representative registry as the only cache.
+
+
+Cache does not grant entitlement.
+
+
+Rights are rechecked on every access.
+
+
+======================================================================
+21｜PUBLICATION CACHE
+======================================================================
+
+Publication cache binds:
+
+semantic digest
+
+publication IR digest
+
+page-plan digest
+
+diagram digest
+
+profile version
+
+renderer version
+
+asset version
+
+presentation mode
+
+
+Layout rebuild:
+providerCalls = 0
+
+
+Reopen:
+rendererCalls = 0
+
+
+======================================================================
+22｜PRIVATE RELEASE MATERIAL
+======================================================================
+
+Material record must bind:
+
+reportId
+
+owner account
+
+subjectRef
+
+purchase / entitlement lineage where applicable
+
+method
+
+generationVersion
+
+compositionVersion
+
+semanticSnapshotId
+
+manuscriptDigest
+
+publicationIrDigest
+
+pagePlanDigest
+
+rendererVersion
+
+render receipt
+
+outputDigest
+
+release status
+
+
+Open must verify all applicable identity bindings.
+
+
+======================================================================
+23｜OPEN-RELEASED PROOF
+======================================================================
+
+Keep the R2 zero-cost:
+
+open-released
+
+
+It proves:
+
+already released material exists
+
+correct owner
+
+correct canonical subject
+
+valid entitlement / release
+
+correct private bytes
+
+valid digest
+
+Library entry
+
+method profile match
+
+
+It does NOT prove generation occurred during that call.
+
+
+Name the evidence accordingly.
+
+
+======================================================================
+24｜REOPEN PROOF
+======================================================================
+
+Keep:
+
+reopen
+
+
+Require:
+
+same owner
+
+different authenticated session
+
+old session invalid/revoked as governed
+
+same reportId
+
+same semanticSnapshotId
+
+same manuscriptDigest
+
+same publicationIrDigest
+
+same pagePlanDigest
+
+same outputDigest
+
+providerCalls = 0
+
+rendererCalls = 0
+
+
+Do not expose session IDs publicly.
+
+
+Store only hashed/private-safe evidence.
+
+
+======================================================================
+25｜FINAL GENERATE → RELEASE PROOF
+======================================================================
+
+Do not execute now unless explicitly authorized.
+
+
+But prepare a separate explicit live action that will later prove:
+
+Account A
+
+real entitlement
+
+owned canonical subject
+
+current consent/input revision
+
+current target context
+
+current production profile
+
+first-generation generation or admitted cache
+
+current VFR renderer
+
+active release
+
+private material
+
+Library visibility
+
+
+This is the missing bridge between:
+
+generation architecture
+
+and
+
+open-released proof
+
+
+Do not hide it inside reopen.
+
+
+======================================================================
+26｜SHARED FINAL E2E PHASE MODEL
+======================================================================
+
+Recommended phases:
+
+
+PHASE A
+METHOD_GENERATE_RELEASE
+
+PHASE B
+OPEN_RELEASED
+
+PHASE C
+LOGOUT
+
+PHASE D
+NEW_LOGIN_SESSION
+
+PHASE E
+REOPEN
+
+PHASE F
+SECOND_ACCOUNT_ISOLATION
+
+PHASE G
+FINALIZE
+
+
+FINALIZE requires all applicable phases.
+
+
+======================================================================
+27｜SECOND ACCOUNT
+======================================================================
+
+Prepare but do not run automatically.
+
+
+Account B must fail:
+
+open report
+
+Library discovery
+
+subject access
+
+release metadata access
+
+
+Shared proof only needs this once unless a method changes the account
+authorization model.
+
+
+======================================================================
+28｜TAMPER NEGATIVES
+======================================================================
+
+Keep R2 negatives.
+
+
+At minimum test:
+
+snapshot mismatch
+
+manuscript digest mismatch
+
+publication digest mismatch
+
+page-plan digest mismatch
+
+composition version mismatch
+
+renderer receipt mismatch
+
+private HTML digest mismatch
+
+wrong account
+
+wrong subject
+
+missing entitlement
+
+revoked entitlement
+
+revoked consent
+
+inactive release
+
+missing material
+
+tampered phase-1 proof
+
+same-session reopen
+
+missing-session reopen
+
+
+All fail closed.
+
+
+======================================================================
+29｜SESSION PROOF
+======================================================================
+
+Do not perform accidental external authentication calls in unit tests.
+
+
+Use in-memory/session fixtures for local deterministic tests.
+
+
+Real session proof only happens in explicit deployed QA activity.
+
+
+Keep network disabled in zero-cost regression.
+
+
+======================================================================
+30｜SHARED DELIVERY V2 API PRIVACY
+======================================================================
+
+External response must not expose:
+
+raw account ID
+
+raw session ID
+
+access token
+
+refresh token
+
+private object key
+
+provider secret
+
+canonical person private fields beyond intended UI
+
+
+Private proof may store:
+
+hashed account identity
+
+hashed session identity
+
+hashed person identity
+
+report identity
+
+snapshot identity
+
+material identity
+
+
+======================================================================
+31｜INSTALLER SAFETY
+======================================================================
+
+If retaining:
+
+SHARED-REPORT-E2E-VFR-R2-INSTALL.mjs
+
+
+It must:
+
+verify baseline files
+
+verify expected original hashes
+
+verify protected files
+
+stop before write on mismatch
+
+never force overwrite
+
+create backups
+
+never run npm install automatically
+
+never deploy
+
+never push
+
+never call paid provider
+
+never activate production
+
+
+Because current Windows C:\phios may have moved beyond the audit
+baseline.
+
+
+======================================================================
+32｜DO NOT FORCE OLD BASELINE
+======================================================================
+
+R2 audit baseline:
+
+2259cf66aa2a4c47bb99d775acb58cb95567d60f
+
+
+Current working branch may be newer.
+
+
+If baseline mismatch:
+
+STOP
+
+REBASE / RECONCILE PATCH
+
+
+Do not use:
+
+--force
+
+or blind file replacement.
+
+
+======================================================================
+33｜CURRENT SCRATCH WORKTREE REVIEW
+======================================================================
+
+Before committing:
+
+git diff --check
+
+git status --short
+
+git diff --stat
+
+
+Inspect every modified file.
+
+
+Classify:
+
+REQUIRED_R4
+
+R2_REPAIR
+
+HISTORICAL_ARCHIVE
+
+GENERATED_EVIDENCE
+
+UNRELATED
+
+
+Remove unrelated accidental modifications.
+
+
+======================================================================
+34｜PROTECTED HASH RECHECK
+======================================================================
+
+Re-run protected artifact digest verification before commit.
+
+
+Required result:
+
+BaZi accepted artifacts
+UNCHANGED
+
+ZiWei accepted artifacts
+UNCHANGED
+
+historical ledgers
+UNCHANGED
+
+historical receipts
+UNCHANGED
+
+
+If any unexpected protected digest changes:
+
+STOP
+
+
+======================================================================
+35｜ZERO-COST REGRESSION
+======================================================================
+
+Run only deterministic scoped checks first.
+
+
+At minimum:
+
+shared v2 contract
+
+method delta registry
+
+ZiWei successor snapshot
+
+ZiWei VFR renderer dispatch
+
+adaptive page-plan validation
+
+diagram binding
+
+material identity
+
+Library open
+
+reopen
+
+tamper negatives
+
+account isolation fixture
+
+idempotency fixture
+
+semantic cache
+
+publication cache
+
+
+providerCalls = 0
+
+
+======================================================================
+36｜GLOBAL CHECK
+======================================================================
+
+Do not use final global npm run check as proof of live E2E.
+
+
+If the R2 installer explicitly supports:
+
+--global-check
+
+it may run deterministic global repository checks only after patch
+application and scoped checks.
+
+
+But final R4 GLOBAL-REPOSITORY-CHECK-R4.json still belongs to final
+closure after shared live proof.
+
+
+Distinguish:
+
+MIGRATION_GLOBAL_REGRESSION
+
+from:
+
+FINAL_GLOBAL_CLOSURE
+
+
+======================================================================
+37｜HISTORICAL CHECKERS
+======================================================================
+
+Continue making stale historical checkers successor-aware.
+
+
+Pattern:
+
+if successor not applied
+→ validate historical owner
+
+if successor applied
+→ validate successor binding
+
+always preserve historical implementation evidence
+
+
+Do not rollback current successor to satisfy stale R5 assumptions.
+
+
+======================================================================
+38｜SHARED RENDERER CPU PREPARATION
+======================================================================
+
+Prepare explicit live stability endpoint/script.
+
+
+It must consume:
+
+frozen released/admitted candidate
+
+
+It must NOT:
+
+generate manuscript
+
+call provider
+
+
+Sequential campaign:
+
+3 runs
+
+then
+
+5 runs
+
+
+Capture:
+
+browser launch ms
+
+asset load ms
+
+font wait ms
+
+image decode ms
+
+fit ms
+
+total ms
+
+page count
+
+image count
+
+HTML bytes
+
+failure stage
+
+browser limits
+
+
+No uncontrolled concurrency.
+
+
+======================================================================
+39｜DO NOT RUN LIVE YET
+======================================================================
+
+Do not run automatically:
+
+provider generation
+
+real login
+
+logout
+
+relogin
+
+real checkout
+
+real second-account test
+
+live renderer campaign
+
+deployment
+
+
+Prepare only.
+
+
+======================================================================
+40｜METHOD WAVE STATUS
+======================================================================
+
+Lane A may track all methods but must not do their content work.
+
+
+Current expected migration registry states may include:
+
+ZWR
+IN_PROGRESS
+
+AST
+WAITING_FOR_METHOD_PUBLICATION_DELTA
+
+NUM
+WAITING_FOR_SHARED_DELIVERY_DELTA
+
+PROFILE
+WAITING_FOR_METHOD_GATES
+
+ECR
+WAITING_FOR_METHOD_GATES
+
+HD
+WAITING_FOR_DELIVERY_DELTA
+
+FINANCIAL
+WAITING_FOR_PROFESSIONAL_DELTA
+
+WILL
+WAITING_FOR_PROFESSIONAL_DELTA
+
+CROSS
+LAST
+
+
+Do not falsely PASS them.
+
+
+======================================================================
+41｜ASTROLOGY HANDOFF
+======================================================================
+
+Astrology content work is intentionally moved to another user window.
+
+
+Lane A must not redo:
+
+R4A 21 decisions
+
+
+Current known state:
+
+R4A
+= 21 / 21 HUMAN ADMITTED
+
+
+Lane A may only provide future shared delivery adapter requirements to
+Astrology.
+
+
+Do not block Astrology R5 work on final shared E2E.
+
+
+======================================================================
+42｜R4 ARTIFACTS TO WRITE
+======================================================================
+
+Produce or update:
+
+NEXT-EXECUTION-R4.md
+
+METHOD-PUBLICATION-AUDIT-R4.md
+
+shared-report-delivery-e2e-contract-v2.json
+
+method-report-delivery-delta-registry-v1.json
+
+ziwei-method-delivery-delta-v1.json
+
+production-freeze-candidate-r4.json
+
+
+If current canonical paths already exist:
+
+extend them.
+
+Do not create duplicates.
+
+
+======================================================================
+43｜ZIWEI DELIVERY DELTA REQUIRED FIELDS
+======================================================================
+
+ZIWEI delta receipt must explicitly state:
+
+contentAcceptanceExisting
+
+contentAcceptanceDigest
+
+generationVersion
+
+snapshotVersion
+
+compositionVersion
+
+publicationIrVersion
+
+pagePlanVersion
+
+pagePlanMode
+
+pagePlanDigest
+
+diagramRegistryVersion
+
+diagramDigest
+
+rendererVersion
+
+rendererInputMode
+
+materialSchemaVersion
+
+releaseAdapterVersion
+
+semanticCacheStatus
+
+publicationCacheStatus
+
+firstGenerationIdempotencyStatus
+
+reopenProviderCalls
+
+reopenRendererCalls
+
+localSyntheticPass
+
+deployedRendererPass
+
+realAccountReleasePass
+
+libraryPass
+
+differentSessionReopenPass
+
+secondAccountIsolationPass
+
+finalStatus
+
+
+Current finalStatus expected before live closure:
+
+BLOCKED
+
+
+======================================================================
+44｜PRODUCTION FREEZE CANDIDATE
+======================================================================
+
+Keep:
+
+BLOCKED_CANDIDATE
+
+
+Until all applicable gates genuinely pass.
+
+
+Do not write:
+
+READY_FOR_PRODUCTION_FREEZE_REVIEW
+
+merely because synthetic tests passed.
+
+
+======================================================================
+45｜COMMIT PREPARATION
+======================================================================
+
+When deterministic implementation is internally coherent:
+
+git diff --check
+
+run scoped checks
+
+verify protected hashes
+
+produce audit summary
+
+
+Then prepare ONE coherent commit series or one coherent commit.
+
+
+Do not commit unrelated work.
+
+
+Do not push unless explicitly authorized by user / execution environment
+policy.
+
+
+======================================================================
+46｜EXPECTED COMPLETION OF THIS CODEX WINDOW
+======================================================================
+
+This Codex lane should aim to finish:
+
+1. reconcile R2 with R4;
+2. make shared v2 generic;
+3. move ZWR specifics into method profile;
+4. create independent current VFR snapshot identity;
+5. create current VFR composition identity;
+6. bind current VFR renderer;
+7. use adaptive plan length;
+8. retain historical renderer support;
+9. remove unconditional production admission;
+10. prove local material/reopen contract;
+11. prove fake-provider first-generation idempotency;
+12. prove semantic/publication cache behavior;
+13. keep open-released/reopen proof;
+14. prepare separate future generate→release live phase;
+15. keep shared authority BLOCKED;
+16. produce clean reviewable diff.
+
+
+======================================================================
+47｜DO NOT ATTEMPT IN THIS WINDOW
+======================================================================
+
+Do not perform:
+
+Astrology R5 writing
+
+Astrology human review
+
+real deployed QA
+
+real Account A generation
+
+real logout/relogin
+
+real Account B isolation
+
+production activation
+
+final shared admission
+
+Cross final admission
+
+
+======================================================================
+48｜FINAL REPORT FORMAT
+======================================================================
+
+Return:
+
+WORK COMPLETED
+
+SOURCE HEAD
+
+FINAL WORKTREE STATUS
+
+FILES MODIFIED
+
+FILES CREATED
+
+PROTECTED FILE VERIFICATION
+
+R2 / R4 RECONCILIATION
+
+SHARED V2 GENERIC CONTRACT STATUS
+
+ZWR METHOD PROFILE STATUS
+
+ZIWEI CONTENT ACCEPTANCE STATUS
+
+ZIWEI SNAPSHOT SUCCESSOR STATUS
+
+ZIWEI COMPOSITION SUCCESSOR STATUS
+
+ZIWEI VFR RENDERER STATUS
+
+ADAPTIVE PAGE STATUS
+
+57-PAGE FIXTURE STATUS
+
+68-PAGE REPRESENTATIVE STATUS
+
+DIAGRAM STATUS
+
+PRODUCTION ADMISSION STATUS
+
+SEMANTIC CACHE STATUS
+
+PUBLICATION CACHE STATUS
+
+FIRST-GENERATION IDEMPOTENCY STATUS
+
+PRIVATE MATERIAL STATUS
+
+OPEN-RELEASED STATUS
+
+REOPEN STATUS
+
+GENERATE-RELEASE LIVE PHASE STATUS
+
+SECOND ACCOUNT STATUS
+
+RENDERER CPU STATUS
+
+PROVIDER CALLS
+
+NEW PROVIDER COST
+
+SCOPED REGRESSION STATUS
+
+MIGRATION GLOBAL REGRESSION STATUS
+
+LIVE QA STATUS
+
+SHARED DELIVERY AUTHORITY STATUS
+
+CURRENT BLOCKERS
+
+NEXT SHARED DELIVERY ACTION
+
+ASTROLOGY HANDOFF STATUS
+
+CURRENT DECISION
+
+
+======================================================================
+49｜VALID CURRENT DECISION
+======================================================================
+
+Expected current decision remains one of:
+
+METHOD_MIGRATION_IN_PROGRESS
+
+SHARED_ARCHITECTURE_READY
+
+READY_FOR_FINAL_SHARED_LIVE_E2E
+
+BLOCKED_CANDIDATE
+
+
+Do not report:
+
+SHARED_DELIVERY_PASS
+
+until real shared live proof exists.
+
+
+======================================================================
+50｜FINAL PRINCIPLE
+======================================================================
+
+Freeze:
+
+R2 fixes the current ZiWei/shared delivery implementation gaps.
+
+R4 governs the final shared architecture.
+
+ZiWei content is already accepted.
+
+Do not re-review identical accepted manuscript.
+
+The missing work is successor identity, renderer, cache, material and live
+delivery proof.
+
+57 pages is a fixture result.
+
+68 pages is an accepted representative result.
+
+Neither is a global production count.
+
+Shared v2 is method-generic.
+
+ZWR VFR specifics live in the ZWR profile.
+
+open-released/reopen proves persistence and session continuity.
+
+It does not replace the final one-time real generate→release proof.
+
+Every method proves only its delivery delta.
+
+The full shared account/Library/relogin/isolation campaign runs once.
+
+Astrology may continue independently now.
+
+END NEXT-EXECUTION-R4
+
+## EXECUTION CHECKPOINT — 2026-10-08 — LANE A
+
+Implementation workspace: `/workspace/scratch/087ae7bca176/phios`.
+Source HEAD: `67254e3d039c842fca0cbd8edc392691ccd2166b`. Observed remote main: `44444063294703ffd4826e39b6e3638e3fae39fc`.
+All changes remain uncommitted and unpushed. The R2 installer was absent at the earlier checkpoint. The latest-main integration below supersedes that observation. Never run an older-baseline installer here.
+
+Completed locally: generic v2 contract; native ZWR policy adapter; independent VFR snapshot lineage; accepted renderer/style reuse; plan-length receipt binding; production admission false; persistent semantic and publication caches with atomic claims and fail-closed abandoned/failed claims; receipt/material lineage validation; open-released proof separate from actual generation-release; signed private phase proof; new-session/revoked-old-session reopen and second-account negative fixtures. Protected accepted sources are unchanged.
+
+Run from this workspace, without provider keys or live activation:
+
+```bash
+npm run check:shared-report-e2e:readiness-v2
+npm run check:vfr:zwr-production-cutover
+npm run check:vfr:zwr-human-review-readiness
+npm run check:vfr:zwr-diagram-visual-enrichment
+npm run check:vfr:zwr-publication-syntax
+npm run check:canonical-account-person
+npm run check:ziwei-zpa-access
+npm run check:cloudflare-function-import-compat
+git diff --check
+```
+
+The spend guard check writes a historical receipt. If repeating it, first preserve that exact receipt, retain the new evidence under delivery-r4, then restore the historical bytes and rerun the protected source check.
+
+Current decision: METHOD_MIGRATION_IN_PROGRESS. Shared production authority remains BLOCKED. Local 68 pages describes this synthetic fixture and the accepted representative; 57 pages describes the separately supplied R2 fixture which is absent here. Neither is a production page constant. Production verification recomputes the native page plan.
+
+Next authorized local action: review `WORKTREE-STATUS-R4.json`, reconcile changed package/zero-cost registry entries against remote main in an isolated checkout or worktree, preserving other-window work and every protected digest. Prepare one coherent commit for user review; do not automatically commit or push. Apply migration 0013 only during an explicitly authorized deployment.
+
+Do not execute live actions automatically. Once separately authorized, bind real owner A, entitlement and canonical consent revision; prove one actual bounded generation-release (or governed previously generated semantic-cache hit) and store its generationReleaseProven receipt. Call open-released without generation; revoke A's old session through the actual auth flow; log in anew; reopen the exact report/snapshot/manuscript/IR/page-plan/output identity; use actual B for all denial checks. Prepare private method-delta manifest only from actual proofs. Run frozen renderer sequentially 3 then 5, and bind its snapshot to the reference report. Finish all native method deltas (CROSS last), run post-live global regression and bind its digest to the private phase proof, then finalize. The final gate rejects an open-only proof.
+
+Private cache FAILED/CLAIMED rows must not be deleted or reset to trigger another provider call automatically. Investigate interrupted attempts and reconcile any saved outputs under explicit operator authorization. Cache hits still recheck rights and consent before lookup. Layout changes use semantic cache and invalidate publication cache; reopen reads private stored bytes.
+
+Astrology handoff: existing R4A accepted content is preserved. R5 customer writing and publication belong to the other window. This lane awaits its native delivery delta and does not perform or repeat content review.
+
+
+## LATEST MAIN INTEGRATION COMPLETED
+
+Integrated main HEAD: `35b7420d64526950dac8012e2c2dd6cc82bb7618`. R2 contract/runtime/checker archived under `docs/reports/shared-report-e2e-r2/`; generic R4 contract and native ZWR adapter remain current. Six conflicts resolved; other-window Profile/BaZi/World changes retained from main. No new commit or push. Read `MAIN-INTEGRATION-REVIEW-R4.json`.
+
+Paid writing cache misses additionally require private `qa/method-delivery/ZWR/generation-admission.json`: schema METHOD_GENERATION_ADMISSION_V1, methodCode ZWR, state ACCEPTED, scope DEPLOYED_PRIVATE_BROWSER, current native profileVersion/rendererVersion, the actual existing HUMAN-DECISION byte digest, and actual rendererAcceptanceDigest. Do not fabricate this receipt. Native method generation proof does not wait for all other methods; shared finalize still does.
+
+Wrangler whoami reports NOT_AUTHENTICATED in this environment; no token, account credential or provider key is configured. Deployment and actual account proof cannot run here yet. Continue in a real authenticated Cloudflare environment with the reviewed patch, preserving secrets outside chat/repo. Deploy only the QA renderer and preview branch; apply database migration only to preview RUNTIME_DB sandbox. Do not migrate the default production database. A schema preview/execution, renderer verification, real A/B sessions, and explicit bounded provider budget remain required before final admission. Do not use a temporary Cloudflare account for this platform.
diff --git a/docs/reports/delivery-r4/NUMEROLOGY-METHOD-DELIVERY-DELTA-v1.json b/docs/reports/delivery-r4/NUMEROLOGY-METHOD-DELIVERY-DELTA-v1.json
new file mode 100644
index 00000000..6301f4f7
--- /dev/null
+++ b/docs/reports/delivery-r4/NUMEROLOGY-METHOD-DELIVERY-DELTA-v1.json
@@ -0,0 +1,43 @@
+{
+  "schemaVersion": "METHOD_REPORT_DELIVERY_DELTA_V1",
+  "methodCode": "NUM",
+  "sourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "nativeOwnerRef": "content/professional/num-production/expansion-r9-r18/admission/num-r18-full-production-cutover-v1.json",
+  "nativeOwnerSha256": "832e2a96409f25e12d085174a70006ec702e42dc1013750acf11a87e329f1d63",
+  "status": "BLOCKED",
+  "publicationProfileRef": "content/reports/method-publication-profiles-v1.json#NUM",
+  "generationVersion": null,
+  "semanticVersion": null,
+  "publicationVersion": null,
+  "rendererMode": null,
+  "rendererVersion": null,
+  "pagePlanMode": null,
+  "expectedPageRule": null,
+  "diagramRule": {
+    "nativeOwnerOnly": true,
+    "count": null
+  },
+  "localeRule": "NATIVE_OWNER",
+  "generationProviderRule": "NATIVE_OWNER_UNRESOLVED",
+  "publicationProviderRule": 0,
+  "rerenderProviderRule": 0,
+  "reopenProviderRule": 0,
+  "semanticReviewRule": null,
+  "releaseEligibilityRule": "ALL_APPLICABLE_NATIVE_AND_SHARED_GATES_REQUIRED",
+  "subjectBindingRule": "NATIVE_OWNER_REQUIRED",
+  "methodSpecificNegativeAccessCases": [
+    "AUTHORIZATION_ON_CACHE_HIT",
+    "WRONG_ACCOUNT_DENIED"
+  ],
+  "fullSharedE2ERepeated": false,
+  "localDeltaProof": null,
+  "deployedProof": null,
+  "blockers": [
+    {
+      "owner": "content/professional/num-production/expansion-r9-r18/admission/num-r18-full-production-cutover-v1.json",
+      "reason": "R9–R18 FULL_PRODUCTION_ACTIVE preserved; private publication/render/release adapter migration unproven.",
+      "minimumNextAction": "Resolve native profile fields and method adapter; execute scoped method delta verification."
+    }
+  ],
+  "sharedDeliveryAuthorityEligible": false
+}
diff --git a/docs/reports/delivery-r4/PRODUCTION-FREEZE-CANDIDATE-R4.json b/docs/reports/delivery-r4/PRODUCTION-FREEZE-CANDIDATE-R4.json
new file mode 100644
index 00000000..b5672f69
--- /dev/null
+++ b/docs/reports/delivery-r4/PRODUCTION-FREEZE-CANDIDATE-R4.json
@@ -0,0 +1,31 @@
+{
+  "schemaVersion": "SHARED_DELIVERY_PRODUCTION_FREEZE_R4",
+  "status": "BLOCKED",
+  "sourceHead": "35b7420d64526950dac8012e2c2dd6cc82bb7618",
+  "localArchitecture": "READY",
+  "localZiweiDelta": "PASS",
+  "sharedDeliveryAuthorityEligible": false,
+  "productionAdmissionGranted": false,
+  "providerCalls": 0,
+  "newProviderCost": 0,
+  "requiredNext": [
+    "RECONCILE_LATEST_MAIN_WITHOUT_OVERWRITING_OTHER_WINDOW",
+    "REVIEW_COHERENT_COMMIT",
+    "EXPLICIT_DEPLOY_AND_LIVE_AUTHORIZATION",
+    "DEPLOYED_PRIVATE_RENDERER_METHOD_DELTA",
+    "REAL_GENERATE_RELEASE",
+    "OPEN_RELEASED_LOGOUT_NEW_LOGIN_REOPEN",
+    "REAL_SECOND_ACCOUNT_ISOLATION",
+    "SEQUENTIAL_FROZEN_RENDERER_3_THEN_5",
+    "ALL_TARGET_METHOD_DELTAS",
+    "POST_LIVE_GLOBAL_REGRESSION"
+  ],
+  "astrologyContentLane": "USER_OTHER_WINDOW_NO_WRITING_OR_REVIEW_HERE",
+  "originalSourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "mainIntegration": "LOCAL_PASS",
+  "deploymentBlocker": "Network access to https://dash.cloudflare.com:443 blocked by policy",
+  "cloudflareUserAuthorization": "USER_CONFIRMED",
+  "cloudflareDeviceFlow": "BLOCKED_BY_RUNTIME_NETWORK_POLICY",
+  "deployed": false,
+  "realAccountProof": "NOT_RUN"
+}
diff --git a/docs/reports/delivery-r4/PROFILE-METHOD-DELIVERY-DELTA-v1.json b/docs/reports/delivery-r4/PROFILE-METHOD-DELIVERY-DELTA-v1.json
new file mode 100644
index 00000000..1e944a8f
--- /dev/null
+++ b/docs/reports/delivery-r4/PROFILE-METHOD-DELIVERY-DELTA-v1.json
@@ -0,0 +1,43 @@
+{
+  "schemaVersion": "METHOD_REPORT_DELIVERY_DELTA_V1",
+  "methodCode": "PROFILE",
+  "sourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "nativeOwnerRef": "content/profile/successors/personal-evidence-r1/personal-evidence-dossier-publication-v1.json",
+  "nativeOwnerSha256": "1732b97da9ff199a128b49f81ffa63b725f54562f6bbbc7ebfc135a2d73d2e69",
+  "status": "BLOCKED",
+  "publicationProfileRef": "content/reports/method-publication-profiles-v1.json#PROFILE",
+  "generationVersion": null,
+  "semanticVersion": null,
+  "publicationVersion": null,
+  "rendererMode": null,
+  "rendererVersion": null,
+  "pagePlanMode": null,
+  "expectedPageRule": null,
+  "diagramRule": {
+    "nativeOwnerOnly": true,
+    "count": null
+  },
+  "localeRule": "BILINGUAL_ONLY",
+  "generationProviderRule": "NATIVE_OWNER_UNRESOLVED",
+  "publicationProviderRule": 0,
+  "rerenderProviderRule": 0,
+  "reopenProviderRule": 0,
+  "semanticReviewRule": null,
+  "releaseEligibilityRule": "ALL_APPLICABLE_NATIVE_AND_SHARED_GATES_REQUIRED",
+  "subjectBindingRule": "NATIVE_OWNER_REQUIRED",
+  "methodSpecificNegativeAccessCases": [
+    "AUTHORIZATION_ON_CACHE_HIT",
+    "WRONG_ACCOUNT_DENIED"
+  ],
+  "fullSharedE2ERepeated": false,
+  "localDeltaProof": null,
+  "deployedProof": null,
+  "blockers": [
+    {
+      "owner": "content/profile/successors/personal-evidence-r1/personal-evidence-dossier-publication-v1.json",
+      "reason": "PRD W11 receipt is pending; retain FREE_SNAPSHOT and bilingual-only successor; no deep entitlement grant.",
+      "minimumNextAction": "Resolve native profile fields and method adapter; execute scoped method delta verification."
+    }
+  ],
+  "sharedDeliveryAuthorityEligible": false
+}
diff --git a/docs/reports/delivery-r4/SHARED-RENDERER-CPU-READINESS-v1.json b/docs/reports/delivery-r4/SHARED-RENDERER-CPU-READINESS-v1.json
new file mode 100644
index 00000000..a8470afe
--- /dev/null
+++ b/docs/reports/delivery-r4/SHARED-RENDERER-CPU-READINESS-v1.json
@@ -0,0 +1,18 @@
+{
+  "sourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "scope": "LOCAL_BUILD_ONLY",
+  "status": "PENDING_DEPLOYED_CAMPAIGN",
+  "workerDryRun": "PASS",
+  "deployed": false,
+  "browserMeasurements": null,
+  "liveCampaignEndpoint": "/api/shared-report-renderer-stability",
+  "automaticExecution": false,
+  "frozenPrivateCandidateRequired": true,
+  "allTargetMethodDeltasRequired": true,
+  "sequentialRuns": [
+    3,
+    5
+  ],
+  "providerCalls": 0,
+  "localNativeBrowserAvailable": false
+}
diff --git a/docs/reports/delivery-r4/WILL-METHOD-DELIVERY-DELTA-v1.json b/docs/reports/delivery-r4/WILL-METHOD-DELIVERY-DELTA-v1.json
new file mode 100644
index 00000000..20228c2c
--- /dev/null
+++ b/docs/reports/delivery-r4/WILL-METHOD-DELIVERY-DELTA-v1.json
@@ -0,0 +1,43 @@
+{
+  "schemaVersion": "METHOD_REPORT_DELIVERY_DELTA_V1",
+  "methodCode": "WILL",
+  "sourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "nativeOwnerRef": "functions/account/released-report-material-store.js",
+  "nativeOwnerSha256": "30019e137087cafaf314aa4c4593d4e263dca73c5bdd0c0052098d0840c51c8a",
+  "status": "BLOCKED",
+  "publicationProfileRef": "content/reports/method-publication-profiles-v1.json#WILL",
+  "generationVersion": null,
+  "semanticVersion": null,
+  "publicationVersion": null,
+  "rendererMode": null,
+  "rendererVersion": null,
+  "pagePlanMode": null,
+  "expectedPageRule": null,
+  "diagramRule": {
+    "nativeOwnerOnly": true,
+    "count": null
+  },
+  "localeRule": "BILINGUAL_ONLY",
+  "generationProviderRule": "NATIVE_OWNER_UNRESOLVED",
+  "publicationProviderRule": 0,
+  "rerenderProviderRule": 0,
+  "reopenProviderRule": 0,
+  "semanticReviewRule": null,
+  "releaseEligibilityRule": "ALL_APPLICABLE_NATIVE_AND_SHARED_GATES_REQUIRED",
+  "subjectBindingRule": "NATIVE_OWNER_REQUIRED",
+  "methodSpecificNegativeAccessCases": [
+    "AUTHORIZATION_ON_CACHE_HIT",
+    "WRONG_ACCOUNT_DENIED"
+  ],
+  "fullSharedE2ERepeated": false,
+  "localDeltaProof": null,
+  "deployedProof": null,
+  "blockers": [
+    {
+      "owner": "functions/account/released-report-material-store.js",
+      "reason": "Existing private RR/PDF owner must be reused; role completeness, draft/final professional release and bilingual delivery delta remain open.",
+      "minimumNextAction": "Resolve native profile fields and method adapter; execute scoped method delta verification."
+    }
+  ],
+  "sharedDeliveryAuthorityEligible": false
+}
diff --git a/docs/reports/delivery-r4/WORKTREE-STATUS-R4.json b/docs/reports/delivery-r4/WORKTREE-STATUS-R4.json
new file mode 100644
index 00000000..a807f335
--- /dev/null
+++ b/docs/reports/delivery-r4/WORKTREE-STATUS-R4.json
@@ -0,0 +1,339 @@
+{
+  "schemaVersion": "SHARED_DELIVERY_WORKTREE_REVIEW_R4",
+  "originalSourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "sourceHead": "35b7420d64526950dac8012e2c2dd6cc82bb7618",
+  "mainIntegration": "COMPLETE",
+  "reviewStatus": "SCOPED_PASS",
+  "committed": false,
+  "pushed": false,
+  "deployed": false,
+  "protectedFileCount": 348,
+  "protectedVerification": "PASS",
+  "unrelatedDirtyFiles": [],
+  "deploymentBlocker": "CLOUDFLARE_NOT_AUTHENTICATED",
+  "proposedCommitTitle": "reports: reconcile R2 and govern VFR cached delivery with split shared proof",
+  "files": [
+    {
+      "path": "SHARED-REPORT-E2E-VFR-R2-INSTALL.mjs",
+      "gitStatus": " M",
+      "classification": "R2_REPAIR",
+      "sha256": "87aecafc2e7d99709825b42246b8aeedca0c5a1c24e5dba2a653d325245ed370"
+    },
+    {
+      "path": "config/reports/zero-cost-check-commands.json",
+      "gitStatus": " M",
+      "classification": "REQUIRED_R4",
+      "sha256": "280bed9051c3facfcd5939e3901101a75a7c66930fc3399d65adc9a86fee698e"
+    },
+    {
+      "path": "content/reports/shared-report-delivery-e2e-contract-v2.json",
+      "gitStatus": " M",
+      "classification": "REQUIRED_R4",
+      "sha256": "842c36ee91577448f8436254334a2cdfd7e04e673ecdb03c3b5aad46ed63ea92"
+    },
+    {
+      "path": "functions/account/ziwei-account-delivery.js",
+      "gitStatus": " M",
+      "classification": "REQUIRED_R4",
+      "sha256": "1ae6c8446e7c61e9faf086a526dc70e859372cd77e30cc9fe9484333fb632acd"
+    },
+    {
+      "path": "functions/account/ziwei-controlled-report-material.js",
+      "gitStatus": " M",
+      "classification": "REQUIRED_R4",
+      "sha256": "494958d6505423a8a1d318ac2e7082248c86963f9715a3d3ffcfcd91ab13b331"
+    },
+    {
+      "path": "functions/api/shared-report-e2e-proof.js",
+      "gitStatus": " M",
+      "classification": "REQUIRED_R4",
+      "sha256": "08b07bedc7a751b2edbda9371f387e1309e5ac354158e38a26b2ca57c1502852"
+    },
+    {
+      "path": "functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js",
+      "gitStatus": " M",
+      "classification": "REQUIRED_R4",
+      "sha256": "5a62468cbdee6cdd81ca5f8b5577d02c3a721f9b09699b3b4c7d46f8e1cc8116"
+    },
+    {
+      "path": "functions/report-delivery/shared-report-e2e-v2.js",
+      "gitStatus": " D",
+      "classification": "HISTORICAL_ARCHIVE"
+    },
+    {
+      "path": "functions/report-delivery/ziwei-vfr-r1-generation.js",
+      "gitStatus": " M",
+      "classification": "REQUIRED_R4",
+      "sha256": "7f2f16ff31d17450f2daabe73a794364c3c61511f527403294646aae209ec0d4"
+    },
+    {
+      "path": "package.json",
+      "gitStatus": " M",
+      "classification": "REQUIRED_R4",
+      "sha256": "e07392e30d1e64e6174036b20abf547ffec4e4029e9054b026792e7f2f4eef11"
+    },
+    {
+      "path": "scripts/build-zwr-vfr-human-review.mjs",
+      "gitStatus": " M",
+      "classification": "REQUIRED_R4",
+      "sha256": "6f4568e4f95407bcaf608a3bc18e10cdea51c8799a3a80e334c01833f684d380"
+    },
+    {
+      "path": "scripts/check-shared-report-e2e-readiness.mjs",
+      "gitStatus": " M",
+      "classification": "R2_REPAIR",
+      "sha256": "b5f6a88df19fbac937ec8a5eab0aa4c021b9975c8de332f5210ee8592a7bd601"
+    },
+    {
+      "path": "scripts/check-vfr-zwr-diagram-visual-enrichment.mjs",
+      "gitStatus": " M",
+      "classification": "R2_REPAIR",
+      "sha256": "8231d08e66801c7945cc099effd05436d09284981a824eaf325ed34fa9eab0f7"
+    },
+    {
+      "path": "scripts/check-vfr-zwr-production-cutover.mjs",
+      "gitStatus": " M",
+      "classification": "R2_REPAIR",
+      "sha256": "2dde51e78a446c964147a52ba2753672f11398e5fddd342c8b5efd60d5e9afa4"
+    },
+    {
+      "path": "scripts/check-ziwei-zpa-access.mjs",
+      "gitStatus": " M",
+      "classification": "R2_REPAIR",
+      "sha256": "147d91fe9db94fb94fd5123c8522680b3997e307f8a32b5d00279c93c19cc34d"
+    },
+    {
+      "path": "workers/method-report-renderer/index.js",
+      "gitStatus": " M",
+      "classification": "REQUIRED_R4",
+      "sha256": "63cf408776fcc47990b3352b28ce08c1a07433a89fae1fdd2a6ea9446cfb2b69"
+    },
+    {
+      "path": "assets/customer-ui/js/personal-products/ziwei-vfr-r1-styles.js",
+      "gitStatus": "??",
+      "classification": "REQUIRED_R4",
+      "sha256": "0e59df6daef64fb85e8ded1f0eb9689bbf10aa739064969d9fad09e320aff149"
+    },
+    {
+      "path": "content/reports/method-publication-profiles-v1.json",
+      "gitStatus": "??",
+      "classification": "REQUIRED_R4",
+      "sha256": "4488372a5adc0bec73240a14199df4e74dde58825ce46ac3e9387031f742b4d3"
+    },
+    {
+      "path": "content/reports/method-report-delivery-delta-registry-v1.json",
+      "gitStatus": "??",
+      "classification": "REQUIRED_R4",
+      "sha256": "46885822aa46b5c6800bfce8dce78b2122b3b698788d135a704d54cca71ae63d"
+    },
+    {
+      "path": "db/migrations/0013_method_delivery_cache.sql",
+      "gitStatus": "??",
+      "classification": "REQUIRED_R4",
+      "sha256": "13598878344efcf7f155c22b237e3494dfb6d8e55f02877dc7d9a0b884883bf0"
+    },
+    {
+      "path": "docs/reports/delivery-r4/ACCEPTED-SOURCE-BASELINE.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "a22a8f24055c39990af4dd6965c754d921f9a32235095cbf5d5c42bada9474a0"
+    },
+    {
+      "path": "docs/reports/delivery-r4/ASTROLOGY-METHOD-DELIVERY-DELTA-v1.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "9e0b35283f7b04313e8c38c5061e27255c1c676e7b01cc2514f7a1e82253b4e6"
+    },
+    {
+      "path": "docs/reports/delivery-r4/CROSS-METHOD-DELIVERY-DELTA-v1.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "94c7a3ea8bf136722e20f5d53a1f72e08a3c1bdad2ed228f9f867325e173ef72"
+    },
+    {
+      "path": "docs/reports/delivery-r4/ECR-METHOD-DELIVERY-DELTA-v1.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "7a2f0555f67bc7de7b0b0879e7096f6e0a7833bb55313aed006be12fe07469d2"
+    },
+    {
+      "path": "docs/reports/delivery-r4/FINANCIAL-METHOD-DELIVERY-DELTA-v1.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "f45036115e501ce0baa90ac4ea9b94c38837cc16656b12edb810e667851d3efc"
+    },
+    {
+      "path": "docs/reports/delivery-r4/GLOBAL-REPOSITORY-CHECK-R4.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "8192ac2cba13741dddb851519abe1d1eddc26db701fa11f8bd1c5c080f4f1e4e"
+    },
+    {
+      "path": "docs/reports/delivery-r4/HUMAN-DESIGN-METHOD-DELIVERY-DELTA-v1.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "9aa0911cba5e2000f8f2ec21cc0fb7f073ec0d4abab317262268648ce1643bbe"
+    },
+    {
+      "path": "docs/reports/delivery-r4/LOCAL-VERIFICATION-R4.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "21b33819ed5e03d52e6d010861f871f8479cf741f6722ec07fdbffba4533a1f9"
+    },
+    {
+      "path": "docs/reports/delivery-r4/MAIN-INTEGRATION-REVIEW-R4.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "3cb3e1a06632a823df7b01a9600beaf354731e4b11b1528077896bd267a39e8d"
+    },
+    {
+      "path": "docs/reports/delivery-r4/METHOD-PUBLICATION-AUDIT-R4.md",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "538ec95e0d98f3f33a70eee7c6e0e60f5369fa00aff341a7e33ad727600ff88c"
+    },
+    {
+      "path": "docs/reports/delivery-r4/NEXT-EXECUTION-R4.md",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "285519b7b76015457ba4c6ad302e7d34d21861adc28b1a5bdc7ff2c12ac5d258"
+    },
+    {
+      "path": "docs/reports/delivery-r4/NUMEROLOGY-METHOD-DELIVERY-DELTA-v1.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "75486181035aedbf02cb123886537c1a215fd24a99ffcaa7062c70e3e996dffd"
+    },
+    {
+      "path": "docs/reports/delivery-r4/PRODUCTION-FREEZE-CANDIDATE-R4.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "0b1088e1ceefa1f4cb5b0dac527fd0acd96a8bc9d19da7416c142340fb16aa90"
+    },
+    {
+      "path": "docs/reports/delivery-r4/PROFILE-METHOD-DELIVERY-DELTA-v1.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "6489129863e8b77e0900af4ff908989e5fe8df2d2821303fb923d4eab7bb4d14"
+    },
+    {
+      "path": "docs/reports/delivery-r4/SHARED-RENDERER-CPU-READINESS-v1.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "47e592d2aa5acfc4b9ae8ff1ab39fff4997d85359c958cb15e69faa5b54ef974"
+    },
+    {
+      "path": "docs/reports/delivery-r4/WILL-METHOD-DELIVERY-DELTA-v1.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "fb7375509f56246b744015fa61401fdf824fdd4a76238029bcd4fc8697fe67bc"
+    },
+    {
+      "path": "docs/reports/delivery-r4/WORKTREE-STATUS-R4.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE"
+    },
+    {
+      "path": "docs/reports/delivery-r4/ZERO-COST-GUARD-EVIDENCE-R4.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "6fdbf6f7558e15880da40326014ded1a736d06fc931351f36dccc4f624c25f97"
+    },
+    {
+      "path": "docs/reports/delivery-r4/ZIWEI-METHOD-DELIVERY-DELTA-v1.json",
+      "gitStatus": "??",
+      "classification": "GENERATED_EVIDENCE",
+      "sha256": "8afe0d775040b95eb1ccde57050aa9380f5493fe080042110bf73c2748ec7925"
+    },
+    {
+      "path": "docs/reports/shared-report-e2e-r2/historical-r2-contract-v2.json",
+      "gitStatus": "??",
+      "classification": "HISTORICAL_ARCHIVE",
+      "sha256": "a6df943e849d327a55c16bc2a1130563b0362aae0e1b3514d4175f32d4b58121"
+    },
+    {
+      "path": "docs/reports/shared-report-e2e-r2/historical-r2-proof-runtime.js.txt",
+      "gitStatus": "??",
+      "classification": "HISTORICAL_ARCHIVE",
+      "sha256": "4a085020af59c0786361e84479de49dd5834d032c9b5af332ef7a13286813426"
+    },
+    {
+      "path": "docs/reports/shared-report-e2e-r2/historical-r2-readiness.mjs.txt",
+      "gitStatus": "??",
+      "classification": "HISTORICAL_ARCHIVE",
+      "sha256": "e3e644cecce3130248b4960cd95fc84f92417db7e98fda1711a2ba67b8c69ce0"
+    },
+    {
+      "path": "functions/account/method-report-delivery.js",
+      "gitStatus": "??",
+      "classification": "REQUIRED_R4",
+      "sha256": "c43b8b698982554e9614a84542bc96d99e81fe67d4ed08a04d0cc06e9a6fcf41"
+    },
+    {
+      "path": "functions/account/method-report-material.js",
+      "gitStatus": "??",
+      "classification": "REQUIRED_R4",
+      "sha256": "076050e4ea0614342821ae10d7a6795c0f617250cbe7cbd9597ce463a022a274"
+    },
+    {
+      "path": "functions/api/shared-report-renderer-stability.js",
+      "gitStatus": "??",
+      "classification": "REQUIRED_R4",
+      "sha256": "0f8de1c6ac6936461cef98c1c7554cf67db5f15dcfee809d134dbf8b226d70be"
+    },
+    {
+      "path": "functions/report-delivery/method-delivery-cache.js",
+      "gitStatus": "??",
+      "classification": "REQUIRED_R4",
+      "sha256": "dbdb7f3faa49f7d4db1b40512228a752f2e00c752ccfec90f23471ff278c56c2"
+    },
+    {
+      "path": "functions/report-delivery/method-render-contract.js",
+      "gitStatus": "??",
+      "classification": "REQUIRED_R4",
+      "sha256": "de815be87dc4ac8841404f11c4b0d744c6becca6ca55958727961c370a53e98c"
+    },
+    {
+      "path": "functions/report-delivery/ziwei-vfr-method-profile.js",
+      "gitStatus": "??",
+      "classification": "REQUIRED_R4",
+      "sha256": "b75eb1b5b5dbdeabac673e77ba0cf1112bb9dc728c3f8c5b33c1f145b4ba838a"
+    },
+    {
+      "path": "functions/report-delivery/ziwei-vfr-profile-policy.js",
+      "gitStatus": "??",
+      "classification": "REQUIRED_R4",
+      "sha256": "c49e473b7b4376f77b4b851b4a9a9e20d5a2531bdb2f79917b3f1d4cc2c13aa0"
+    },
+    {
+      "path": "functions/report-delivery/ziwei-vfr-r1-version.js",
+      "gitStatus": "??",
+      "classification": "REQUIRED_R4",
+      "sha256": "6ba1535843b5c9aa74a90b65bacc778c1f0dfd44b372dbfd67a1671cd3903068"
+    },
+    {
+      "path": "scripts/check-method-delivery-delta.mjs",
+      "gitStatus": "??",
+      "classification": "R2_REPAIR",
+      "sha256": "499ce668088e1a326abc6eb99ef92f375fafebc48b34ab55b53a6f9d73be3d3b"
+    },
+    {
+      "path": "scripts/check-shared-report-delivery-v2-contract.mjs",
+      "gitStatus": "??",
+      "classification": "R2_REPAIR",
+      "sha256": "bf68d66057a6d357d27c6daaf24d5072c15d308f01f79960d59ae913dd0a3458"
+    },
+    {
+      "path": "scripts/check-shared-report-delivery-v2-runtime.mjs",
+      "gitStatus": "??",
+      "classification": "R2_REPAIR",
+      "sha256": "ce8bedaf420a0de9cf347186b153cdf7d0fe6d6cef02d37827faada40e715cd1"
+    },
+    {
+      "path": "scripts/check-shared-report-e2e-final.mjs",
+      "gitStatus": "??",
+      "classification": "R2_REPAIR",
+      "sha256": "9f4a926d7d5cc0636b1e8d705bec4efff768bf8e363c5cfb926578af54193dcc"
+    }
+  ]
+}
diff --git a/docs/reports/delivery-r4/ZERO-COST-GUARD-EVIDENCE-R4.json b/docs/reports/delivery-r4/ZERO-COST-GUARD-EVIDENCE-R4.json
new file mode 100644
index 00000000..d1b411ac
--- /dev/null
+++ b/docs/reports/delivery-r4/ZERO-COST-GUARD-EVIDENCE-R4.json
@@ -0,0 +1,15 @@
+{
+  "recordedAt": "2026-10-08T03:16:13.646Z",
+  "npmHooksGuarded": true,
+  "ordinaryRegressionAliasesGuarded": true,
+  "pagesBuildGuarded": true,
+  "liveOptInOverriddenInRegression": true,
+  "nodeChildGuardInherited": true,
+  "fetchAndHttpsPaidRequestsBlockedBeforeNetwork": true,
+  "arbitraryExternalPostBlocked": true,
+  "nonNodeProviderCredentialsRemovedByRunner": true,
+  "providerCalls": 0,
+  "providerCost": 0,
+  "fullHistoricalSuiteExecuted": false,
+  "commandCount": 2274
+}
diff --git a/docs/reports/delivery-r4/ZIWEI-METHOD-DELIVERY-DELTA-v1.json b/docs/reports/delivery-r4/ZIWEI-METHOD-DELIVERY-DELTA-v1.json
new file mode 100644
index 00000000..9e2da22b
--- /dev/null
+++ b/docs/reports/delivery-r4/ZIWEI-METHOD-DELIVERY-DELTA-v1.json
@@ -0,0 +1,73 @@
+{
+  "schemaVersion": "METHOD_REPORT_DELIVERY_DELTA_V1",
+  "methodCode": "ZWR",
+  "sourceHead": "67254e3d039c842fca0cbd8edc392691ccd2166b",
+  "nativeOwnerRef": "docs/reports/ziwei/vfr-r1/PRODUCTION-CUTOVER.json",
+  "nativeOwnerSha256": "f4e2b428dc6ee06e39690c957f73cff39fac01985530568f9dcc5e6773d20fcd",
+  "status": "BLOCKED",
+  "publicationProfileRef": "content/reports/method-publication-profiles-v1.json#ZWR",
+  "generationVersion": "ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3",
+  "semanticVersion": null,
+  "publicationVersion": "ZWR-VFR-R1-DEEP-PUBLICATION-IR-v1",
+  "rendererMode": "ZIWEI_VFR",
+  "rendererVersion": "ZWR-VFR-R1-DEEP-RENDERER-v6",
+  "pagePlanMode": "ADAPTIVE_REFLOW",
+  "expectedPageRule": "candidate.snapshot.semanticContent.vfrPagePlan.length",
+  "diagramRule": {
+    "nativeOwnerOnly": true,
+    "count": 15
+  },
+  "localeRule": "NATIVE_OWNER",
+  "generationProviderRule": "BOUNDED_WRITING_ALLOWED",
+  "publicationProviderRule": 0,
+  "rerenderProviderRule": 0,
+  "reopenProviderRule": 0,
+  "semanticReviewRule": 0,
+  "releaseEligibilityRule": "ALL_APPLICABLE_NATIVE_AND_SHARED_GATES_REQUIRED",
+  "subjectBindingRule": "NATIVE_OWNER_REQUIRED",
+  "methodSpecificNegativeAccessCases": [
+    "AUTHORIZATION_ON_CACHE_HIT",
+    "WRONG_ACCOUNT_DENIED"
+  ],
+  "fullSharedE2ERepeated": false,
+  "localDeltaProof": "docs/reports/delivery-r4/LOCAL-VERIFICATION-R4.json",
+  "deployedProof": null,
+  "blockers": [
+    {
+      "owner": "workers/method-report-renderer/index.js",
+      "reason": "Deployed browser and real-account proof not executed. Local synthetic receipts grant no live authority.",
+      "minimumNextAction": "Reconcile latest main, review and explicitly authorize deploy/live phases."
+    }
+  ],
+  "sharedDeliveryAuthorityEligible": false,
+  "contentAcceptanceExisting": true,
+  "contentAcceptanceDigest": "81e31ab108602135616965c0c92d838085ddb0f5561c02c02ceb09f8958dc611",
+  "snapshotVersion": "PHI-OS-CUSTOMER-DELIVERY-SNAPSHOT-v1.0.0",
+  "compositionVersion": "ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3",
+  "publicationIrVersion": "ZWR-VFR-R1-DEEP-PUBLICATION-IR-v1",
+  "pagePlanVersion": "ZWR-VFR-R1-ADAPTIVE-LANGUAGE-SEQUENTIAL-v6",
+  "pagePlanDigest": {
+    "rule": "SHA256_STABLE_RECOMPUTED_NATIVE_PLAN",
+    "perCandidate": true
+  },
+  "diagramRegistryVersion": "ZWR-VFR-R1-DIAGRAM-DATA-v1",
+  "diagramDigest": {
+    "rule": "SOURCE_EVIDENCE_REBUILT_DIGEST",
+    "perCandidate": true
+  },
+  "rendererInputMode": "ZIWEI_VFR",
+  "materialSchemaVersion": "METHOD_PRIVATE_RELEASED_MATERIAL_V2",
+  "releaseAdapterVersion": "ZWR_CONTROLLED_RELEASE_MATERIAL_V1",
+  "semanticCacheStatus": "LOCAL_SYNTHETIC_PASS",
+  "publicationCacheStatus": "LOCAL_SYNTHETIC_PASS",
+  "firstGenerationIdempotencyStatus": "LOCAL_SYNTHETIC_PASS",
+  "reopenProviderCalls": 0,
+  "reopenRendererCalls": 0,
+  "localSyntheticPass": true,
+  "deployedRendererPass": false,
+  "realAccountReleasePass": false,
+  "libraryPass": false,
+  "differentSessionReopenPass": false,
+  "secondAccountIsolationPass": false,
+  "finalStatus": "BLOCKED"
+}
diff --git a/docs/reports/shared-report-e2e-r2/historical-r2-contract-v2.json b/docs/reports/shared-report-e2e-r2/historical-r2-contract-v2.json
new file mode 100644
index 00000000..65357eb5
--- /dev/null
+++ b/docs/reports/shared-report-e2e-r2/historical-r2-contract-v2.json
@@ -0,0 +1,45 @@
+{
+  "schemaVersion": "PHI-OS-SHARED-REPORT-DELIVERY-E2E-CONTRACT-v2.0.0",
+  "supersedes": "content/reports/shared-report-delivery-e2e-contract-v1.json",
+  "historicalContractPreserved": true,
+  "state": "BLOCKED_VFR_ADMISSION",
+  "profiles": {
+    "ZWR:ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3": {
+      "methodId": "ZWR",
+      "compositionVersion": "ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3",
+      "candidateSchemaVersion": "ZWR-VFR-R1-AUTO-DEEP-CANDIDATE-v3",
+      "publicationIrVersion": "ZWR-VFR-R1-DEEP-PUBLICATION-IR-v1",
+      "pagePlanVersion": "ZWR-VFR-R1-ADAPTIVE-LANGUAGE-SEQUENTIAL-v6",
+      "pagePolicy": "RECOMPUTE_FROM_ACCEPTED_PUBLICATION_IR",
+      "locales": [
+        "en",
+        "zh-Hans"
+      ],
+      "admission": {
+        "state": "BLOCKED",
+        "sourceAcceptanceDigest": null,
+        "rendererAcceptanceDigest": null,
+        "rendererWired": false,
+        "productionAdmissionGranted": false,
+        "sourceResultDigest": null,
+        "publicationIrDigest": null,
+        "pagePlanDigest": null
+      },
+      "blockers": [
+        "VFR currently inherits old production snapshot ID and 33-page report rather than a newly bound VFR delivery snapshot.",
+        "Private renderer has no VFR composition adapter.",
+        "No accepted VFR source/publication/render profile admission receipt is bound to this delivery version.",
+        "Live authenticated purchase/consent/release/private Library/two-session account evidence remains uncollected."
+      ]
+    }
+  },
+  "proofActions": [
+    "open-released",
+    "reopen"
+  ],
+  "generateInProof": false,
+  "providerRegenerationOnReopen": false,
+  "sharedDeliveryAuthorityEligible": false,
+  "productionActivated": false,
+  "auditedRepositoryHead": "2259cf66aa2a4c47bb99d775acb58cb95567d60f"
+}
diff --git a/docs/reports/shared-report-e2e-r2/historical-r2-proof-runtime.js.txt b/docs/reports/shared-report-e2e-r2/historical-r2-proof-runtime.js.txt
new file mode 100644
index 00000000..de00cb47
--- /dev/null
+++ b/docs/reports/shared-report-e2e-r2/historical-r2-proof-runtime.js.txt
@@ -0,0 +1,65 @@
+import {sha256Stable,stableStringify} from '../interpretation-runtime/mir7-utils.js';
+import {createCustomerDeliverySnapshot} from '../personal-reading/narrative/report-section-snapshot.js';
+import {buildZwrVfrPagePlan,validateZwrVfrPagePlan,ZWR_VFR_PAGE_PLAN_VERSION} from '../personal-reading/visual-first/ziwei-vfr-page-plan.js';
+export const fail=(code,status=409)=>Object.assign(new Error(code),{code,status});
+const required=(value,code)=>{if(typeof value!=='string'||!value.trim())throw fail(code);return value;};
+const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/i.test(value);
+export function requireVfrAdmission(profile){
+ const a=profile?.admission;
+ if(profile?.methodId!=='ZWR'||a?.state!=='ACCEPTED'||a.rendererWired!==true||!hash(a.sourceAcceptanceDigest)||!hash(a.rendererAcceptanceDigest)||!hash(a.sourceResultDigest)||!hash(a.publicationIrDigest)||!hash(a.pagePlanDigest))throw fail('SHARED_E2E_VFR_ADMISSION_BLOCKED',503);
+ // Shared delivery evidence never grants production activation.
+}
+export async function verifyVfrMaterial(opened,identity,profile,digest){
+ const {candidate:c,row:r,html}=opened||{},s=c?.snapshot,v=s?.semanticContent,ir=v?.visualReportIr;
+ if(c?.customerId!==identity.userId||r?.owner_account_id!==identity.userId)throw fail('SHARED_E2E_OWNER_MISMATCH',403);
+ required(c.personId,'SHARED_E2E_CANONICAL_PERSON_REQUIRED');required(c.purchaseId,'SHARED_E2E_PURCHASE_REQUIRED');required(c.birthSourceRef,'SHARED_E2E_CANONICAL_SOURCE_REQUIRED');
+ if(r.person_id!==c.personId||r.method_code!==profile.methodId||r.locale!==c.locale||!profile.locales.includes(c.locale)||c.scope!=='CONTROLLED_QA_ONLY')throw fail('SHARED_E2E_ACCOUNT_BINDING_MISMATCH');
+ required(r.report_id,'SHARED_E2E_RELEASE_REQUIRED');required(r.released_at,'SHARED_E2E_RELEASE_REQUIRED');required(r.object_key,'SHARED_E2E_PRIVATE_MATERIAL_REQUIRED');
+ if(c.schemaVersion!==profile.candidateSchemaVersion||c.generationSuccessor!==profile.compositionVersion||s?.methodId!==profile.methodId||s.locale!==c.locale||s.compositionVersion!==profile.compositionVersion||ir?.schemaVersion!==profile.publicationIrVersion||profile.pagePlanVersion!==ZWR_VFR_PAGE_PLAN_VERSION)throw fail('SHARED_E2E_VERSION_MISMATCH');
+ if(s.immutable!==true||s.providerRegenerationOnReopen!==false||(await createCustomerDeliverySnapshot(s)).semanticSnapshotId!==s.semanticSnapshotId||r.snapshot_id!==s.semanticSnapshotId)throw fail('SHARED_E2E_SNAPSHOT_DIGEST_MISMATCH');
+ const {publicationIrDigest,...seed}=ir;
+ if(!hash(publicationIrDigest)||await sha256Stable(seed)!==publicationIrDigest||!hash(v.vfrDeepManuscriptDigest)||v.vfrDeepManuscriptDigest!==ir.sourceResultDigest||!hash(v.vfrCompactAuthoringPackDigest)||v.vfrCompactAuthoringPackDigest!==ir.authorityDigest)throw fail('SHARED_E2E_SOURCE_DIGEST_MISMATCH');
+ if(ir.methodId!=='ZWR'||!Array.isArray(ir.sections)||ir.sections.length!==10||new Set(ir.sections.map(x=>x.sectionId)).size!==10||ir.sections.some((x,i)=>x.sectionId!==`S${String(i+2).padStart(2,'0')}`||!x.zhHans?.manuscript||!x.en?.manuscript||!Array.isArray(x.authorityRefs)||!x.authorityRefs.length))throw fail('SHARED_E2E_MANUSCRIPT_INCOMPLETE');
+ if(profile.admission.sourceResultDigest!==ir.sourceResultDigest||profile.admission.publicationIrDigest!==publicationIrDigest)throw fail('SHARED_E2E_ACCEPTED_SOURCE_BINDING_MISMATCH');
+ const pages=buildZwrVfrPagePlan({sections:ir.sections}),check=validateZwrVfrPagePlan({pages,sections:ir.sections,diagramIds:v.vfrDiagramData?.diagrams?.map(x=>x.id)||[]});
+ if(!check.accepted||stableStringify(pages)!==stableStringify(v.vfrPagePlan)||c.physicalPageCount!==pages.length)throw fail('SHARED_E2E_PAGE_PLAN_MISMATCH');
+ if(profile.admission.pagePlanDigest!==await sha256Stable(pages))throw fail('SHARED_E2E_ACCEPTED_PAGE_PLAN_MISMATCH');
+ let receipt;try{receipt=JSON.parse(r.verifier_receipt)}catch{throw fail('SHARED_E2E_RENDER_RECEIPT_REQUIRED');}
+ const outputDigest=await digest(html);
+ if(typeof html!=='string'||!html.length||!hash(r.output_digest)||r.output_digest!==outputDigest||receipt?.passed!==true||receipt.semanticSnapshotId!==s.semanticSnapshotId||receipt.compositionVersion!==profile.compositionVersion||receipt.publicationIrDigest!==publicationIrDigest||receipt.sourceResultDigest!==ir.sourceResultDigest||receipt.pagePlanDigest!==await sha256Stable(pages)||receipt.pageCount!==pages.length||receipt.outputDigest!==outputDigest||receipt.brokenImages!==0||receipt.overflowCount!==0||receipt.errorCount!==0)throw fail('SHARED_E2E_RENDER_OR_OUTPUT_MISMATCH');
+ return {reportId:r.report_id,methodId:s.methodId,compositionVersion:s.compositionVersion,semanticSnapshotId:s.semanticSnapshotId,publicationIrDigest,sourceResultDigest:ir.sourceResultDigest,pagePlanDigest:await sha256Stable(pages),pageCount:pages.length,outputDigest,personIdHash:await digest(c.personId),purchaseIdHash:await digest(c.purchaseId),canonicalSourceHash:await digest(c.birthSourceRef)};
+}
+// Dependencies are server-owned. No generator, renderer or provider dependency exists here.
+export function createSharedReportE2eProofV2({contract,authenticate,requireSameOrigin,digest,open,list}){
+ return async context=>{
+  try{
+   if(context.request.method!=='POST')throw fail('METHOD_NOT_ALLOWED',405);
+   requireSameOrigin(context.request);
+   const identity=await authenticate(context);if(!identity?.userId)throw fail('ACCOUNT_REQUIRED',401);
+   if(context.env?.PHIOS_ENVIRONMENT!=='qa')throw fail('SHARED_E2E_QA_ONLY',403);
+   required(identity.sessionId,'SHARED_E2E_AUTHENTICATED_SESSION_REQUIRED');
+   const b=await context.request.json();
+   if(!b||!['open-released','reopen'].includes(b.action)||typeof b.reportId!=='string'||!b.reportId||Object.keys(b).some(k=>!['action','reportId'].includes(k)))throw fail('SHARED_E2E_ACTION_INVALID',400);
+   const profile=contract.profiles['ZWR:ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3'];requireVfrAdmission(profile);
+   const storage=context.env.PRIVATE_REPORTS;if(!storage?.get||!storage?.put)throw fail('SHARED_E2E_PRIVATE_STORAGE_REQUIRED',503);
+   const owner=await digest(identity.userId),session=await digest(identity.sessionId),key=`qa/shared-report-e2e-v2/${owner}/${b.reportId}.json`;
+   let first;
+   if(b.action==='reopen'){
+    const object=await storage.get(key);if(!object)throw fail('SHARED_E2E_FIRST_OPEN_REQUIRED',404);
+    first=await object.json();const {proofDigest,...seed}=first;
+    if(first.schemaVersion!=='PHI-OS-SHARED-REPORT-E2E-PROOF-v2'||first.state!=='FIRST_OPEN'||first.accountIdHash!==owner||first.reportId!==b.reportId||first.profileDigest!==await sha256Stable(profile)||proofDigest!==await sha256Stable(seed))throw fail('SHARED_E2E_FIRST_PROOF_INVALID');
+    if(!hash(first.sessionHash)||first.sessionHash===session)throw fail('SHARED_E2E_NEW_LOGIN_SESSION_REQUIRED');
+   }
+   // These existing account functions revalidate entitlement, canonical consent,
+   // active release, private candidate bytes and private HTML on every read.
+   const material=await verifyVfrMaterial(await open(context,b.reportId),identity,profile,digest);
+   if(material.reportId!==b.reportId)throw fail('SHARED_E2E_REPORT_ID_MISMATCH');
+   if(!(await list(context)).some(x=>x.reportId===b.reportId&&x.status==='RELEASED'))throw fail('SHARED_E2E_LIBRARY_RELEASE_REQUIRED');
+   if(first&&stableStringify(first.material)!==stableStringify(material))throw fail('SHARED_E2E_REOPEN_IMMUTABILITY_MISMATCH');
+   const proof={schemaVersion:'PHI-OS-SHARED-REPORT-E2E-PROOF-v2',state:first?'TWO_SESSION_READ_PASS':'FIRST_OPEN',reportId:b.reportId,accountIdHash:owner,sessionHash:session,profileDigest:await sha256Stable(profile),material,providerCalls:0,productionAdmissionGranted:false,sharedDeliveryAuthorityEligible:false};
+   proof.proofDigest=await sha256Stable(proof);
+   await storage.put(key,JSON.stringify(proof),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
+   return Response.json({ok:true,proof:{state:proof.state,proofDigest:proof.proofDigest,providerCalls:0,sharedDeliveryAuthorityEligible:false,productionActivated:false}});
+  }catch(e){return Response.json({ok:false,code:e.code||'SHARED_E2E_EVIDENCE_INVALID'},{status:e.status||409});}
+ };
+}
diff --git a/docs/reports/shared-report-e2e-r2/historical-r2-readiness.mjs.txt b/docs/reports/shared-report-e2e-r2/historical-r2-readiness.mjs.txt
new file mode 100644
index 00000000..99472d17
--- /dev/null
+++ b/docs/reports/shared-report-e2e-r2/historical-r2-readiness.mjs.txt
@@ -0,0 +1,69 @@
+import assert from 'node:assert/strict';
+import fs from 'node:fs';
+import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
+import {createCustomerDeliverySnapshot} from '../functions/personal-reading/narrative/report-section-snapshot.js';
+import {buildZwrVfrPagePlan} from '../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';
+import {createSharedReportE2eProofV2,verifyVfrMaterial,requireVfrAdmission} from '../functions/report-delivery/shared-report-e2e-v2.js';
+const contract=JSON.parse(fs.readFileSync(new URL('../content/reports/shared-report-delivery-e2e-contract-v2.json',import.meta.url)));
+const shipped=contract.profiles['ZWR:ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3'];
+assert.equal(contract.state,'BLOCKED_VFR_ADMISSION');assert.equal(shipped.admission.productionAdmissionGranted,false);
+assert.throws(()=>requireVfrAdmission(shipped),/SHARED_E2E_VFR_ADMISSION_BLOCKED/);
+// This synthetic profile never enters the production registry or represents human acceptance.
+const profile=structuredClone(shipped);profile.admission={state:'ACCEPTED',rendererWired:true,sourceAcceptanceDigest:await sha256Stable('SYNTHETIC_SOURCE'),rendererAcceptanceDigest:await sha256Stable('SYNTHETIC_RENDER'),productionAdmissionGranted:false};
+const testContract={...contract,profiles:{['ZWR:'+profile.compositionVersion]:profile}};
+const sections=Array.from({length:10},(_,i)=>({sectionId:`S${String(i+2).padStart(2,'0')}`,authorityRefs:['synthetic-claim'],zhHans:{manuscript:'合成验证正文。'},en:{manuscript:'Synthetic fixture manuscript.'}}));
+const seed={schemaVersion:profile.publicationIrVersion,methodId:'ZWR',localeMode:'BILINGUAL',authorityDigest:await sha256Stable('synthetic-authority'),sourceResultDigest:await sha256Stable('synthetic-manuscript'),sections};
+const ir={...seed,publicationIrDigest:await sha256Stable(seed)},pages=buildZwrVfrPagePlan({sections});
+const snapshot=await createCustomerDeliverySnapshot({methodId:'ZWR',locale:'en',subjectFingerprint:'synthetic-person-fingerprint',inputFingerprint:'synthetic-birth-fingerprint',compositionVersion:profile.compositionVersion,authorityVersion:'SYNTHETIC',claimIrVersion:profile.publicationIrVersion,verifierVersion:'SYNTHETIC',semanticContent:{visualReportIr:ir,vfrCompactAuthoringPackDigest:ir.authorityDigest,vfrDeepManuscriptDigest:ir.sourceResultDigest,vfrPagePlan:pages,vfrDiagramData:{diagrams:Array.from({length:15},(_,i)=>({id:`ZWD-${String(i+1).padStart(2,'0')}`}))}}});
+// Correct diagram ID spelling follows the actual deterministic planner.
+const diagramIds=[...new Set(pages.flatMap(x=>x.diagramIds))];
+const bound=await createCustomerDeliverySnapshot({...snapshot,semanticContent:{...snapshot.semanticContent,vfrDiagramData:{diagrams:diagramIds.map(id=>({id}))}}});
+profile.admission.sourceResultDigest=ir.sourceResultDigest;profile.admission.publicationIrDigest=ir.publicationIrDigest;profile.admission.pagePlanDigest=await sha256Stable(pages);
+const html='<html><body>synthetic private released material</body></html>',outputDigest=await sha256Stable(html);
+const receipt={passed:true,semanticSnapshotId:bound.semanticSnapshotId,compositionVersion:profile.compositionVersion,publicationIrDigest:ir.publicationIrDigest,sourceResultDigest:ir.sourceResultDigest,pagePlanDigest:await sha256Stable(pages),pageCount:pages.length,outputDigest,brokenImages:0,overflowCount:0,errorCount:0};
+const fixture={candidate:{schemaVersion:profile.candidateSchemaVersion,customerId:'owner',personId:'person',purchaseId:'purchase',birthSourceRef:'canonical:synthetic',scope:'CONTROLLED_QA_ONLY',locale:'en',generationSuccessor:profile.compositionVersion,physicalPageCount:pages.length,snapshot:bound},row:{owner_account_id:'owner',person_id:'person',report_id:'report',method_code:'ZWR',locale:'en',released_at:'2026-01-01T00:00:00Z',object_key:'private/report.html',snapshot_id:bound.semanticSnapshotId,output_digest:outputDigest,verifier_receipt:JSON.stringify(receipt)},html};
+assert.notEqual(pages.length,39);
+let count=0;
+const wrongProfile=structuredClone(profile);wrongProfile.admission.sourceResultDigest='0'.repeat(64);await assert.rejects(()=>verifyVfrMaterial(fixture,{userId:'owner'},wrongProfile,sha256Stable),/ACCEPTED_SOURCE/);count++;
+const wrongPlanProfile=structuredClone(profile);wrongPlanProfile.admission.pagePlanDigest='0'.repeat(64);await assert.rejects(()=>verifyVfrMaterial(fixture,{userId:'owner'},wrongPlanProfile,sha256Stable),/ACCEPTED_PAGE_PLAN/);count++;
+await verifyVfrMaterial(fixture,{userId:'owner'},profile,sha256Stable);count++;
+async function rejected(change,code){const f=structuredClone(fixture);change(f);await assert.rejects(()=>verifyVfrMaterial(f,{userId:'owner'},profile,sha256Stable),new RegExp(code));count++;}
+await rejected(f=>f.candidate.customerId='other','OWNER');
+await rejected(f=>f.row.owner_account_id='other','OWNER');
+await rejected(f=>f.candidate.purchaseId=null,'PURCHASE');
+await rejected(f=>f.candidate.birthSourceRef=null,'CANONICAL_SOURCE');
+await rejected(f=>f.row.person_id='other','BINDING');
+await rejected(f=>f.row.released_at=null,'RELEASE');
+await rejected(f=>f.row.object_key=null,'PRIVATE_MATERIAL');
+await rejected(f=>f.candidate.generationSuccessor='ZIWEI-PROFESSIONAL-SYNTHESIS-R5','VERSION');
+await rejected(f=>f.candidate.snapshot.compositionVersion='ZIWEI-PRODUCTION-COMPOSER-V1','VERSION');
+await rejected(f=>f.candidate.snapshot.semanticContent.visualReportIr.sections[0].en.manuscript='tamper','SNAPSHOT');
+await rejected(f=>f.row.snapshot_id='other','SNAPSHOT');
+await rejected(f=>f.candidate.physicalPageCount=39,'PAGE_PLAN');
+await rejected(f=>f.html+='tamper','OUTPUT');
+await rejected(f=>{const x=JSON.parse(f.row.verifier_receipt);x.publicationIrDigest='0'.repeat(64);f.row.verifier_receipt=JSON.stringify(x)},'OUTPUT');
+await rejected(f=>{const x=JSON.parse(f.row.verifier_receipt);x.passed=false;f.row.verifier_receipt=JSON.stringify(x)},'OUTPUT');
+await rejected(f=>f.row.verifier_receipt='{}','OUTPUT');
+// Rebind tampered material to ensure the inner source check still rejects it.
+const bad=structuredClone(fixture);bad.candidate.snapshot.semanticContent.vfrDeepManuscriptDigest='0'.repeat(64);bad.candidate.snapshot=await createCustomerDeliverySnapshot(bad.candidate.snapshot);bad.row.snapshot_id=bad.candidate.snapshot.semanticSnapshotId;
+await assert.rejects(()=>verifyVfrMaterial(bad,{userId:'owner'},profile,sha256Stable),/SOURCE_DIGEST/);count++;
+const storage=new Map();let session='first',owner='owner',opens=0,listing=true,openError=null,current=fixture;
+const deps={contract:testContract,authenticate:async()=>({userId:owner,sessionId:session}),requireSameOrigin:request=>assert.equal(request.headers.get('origin'),'https://qa.invalid'),digest:sha256Stable,open:async()=>{opens++;if(openError)throw Object.assign(new Error(openError),{code:openError,status:409});return current;},list:async()=>listing?[{reportId:'report',status:'RELEASED'}]:[]};
+const env={PHIOS_ENVIRONMENT:'qa',PRIVATE_REPORTS:{get:async key=>storage.has(key)?{json:async()=>JSON.parse(storage.get(key))}:null,put:async(key,value)=>storage.set(key,value)}};
+const handler=createSharedReportE2eProofV2(deps);
+async function call(action,handlerOverride=handler){const response=await handlerOverride({env,request:new Request('https://qa.invalid/api/shared-report-e2e-proof',{method:'POST',headers:{'content-type':'application/json',origin:'https://qa.invalid'},body:JSON.stringify({action,reportId:'report'})})});count++;return {status:response.status,...await response.json()};}
+assert.equal((await call('reopen')).code,'SHARED_E2E_FIRST_OPEN_REQUIRED');
+assert.equal((await call('generate-release-open')).code,'SHARED_E2E_ACTION_INVALID');
+const blocked=createSharedReportE2eProofV2({...deps,contract});const before=opens;
+assert.equal((await call('open-released',blocked)).code,'SHARED_E2E_VFR_ADMISSION_BLOCKED');assert.equal(opens,before);
+assert.equal((await call('open-released')).proof.state,'FIRST_OPEN');
+assert.equal((await call('reopen')).code,'SHARED_E2E_NEW_LOGIN_SESSION_REQUIRED');
+session=null;assert.equal((await call('reopen')).code,'SHARED_E2E_AUTHENTICATED_SESSION_REQUIRED');session='second';
+owner='other';assert.equal((await call('reopen')).code,'SHARED_E2E_FIRST_OPEN_REQUIRED');owner='owner';
+for(const code of ['CONSENT_REVOKED','ENTITLEMENT_MISSING','RELEASE_INACTIVE','PRIVATE_CANDIDATE_DIGEST_MISMATCH']){openError=code;assert.equal((await call('reopen')).code,code);}openError=null;
+listing=false;assert.equal((await call('reopen')).code,'SHARED_E2E_LIBRARY_RELEASE_REQUIRED');listing=true;
+current=structuredClone(fixture);current.html+='tamper';assert.equal((await call('reopen')).code,'SHARED_E2E_RENDER_OR_OUTPUT_MISMATCH');current=fixture;
+const key=[...storage.keys()][0],first=storage.get(key);const forged=JSON.parse(first);forged.material.outputDigest='0'.repeat(64);storage.set(key,JSON.stringify(forged));assert.equal((await call('reopen')).code,'SHARED_E2E_FIRST_PROOF_INVALID');storage.set(key,first);
+const final=await call('reopen');assert.equal(final.proof.state,'TWO_SESSION_READ_PASS');assert.equal(final.proof.providerCalls,0);assert.equal(final.proof.sharedDeliveryAuthorityEligible,false);
+assert.equal((await call('reopen')).code,'SHARED_E2E_FIRST_PROOF_INVALID');
+console.log(JSON.stringify({status:'PASS',fixtureCases:count,fixturePageCount:pages.length,providerCalls:0,currentVfrAdmission:'BLOCKED',liveAccountProof:'NOT_RUN',productionActivated:false}));
diff --git a/functions/account/method-report-delivery.js b/functions/account/method-report-delivery.js
new file mode 100644
index 00000000..51fcb062
--- /dev/null
+++ b/functions/account/method-report-delivery.js
@@ -0,0 +1,7 @@
+import {generateAndReleaseAccountZiwei,openAccountZiweiMaterial,listAccountZiweiMaterials} from './ziwei-account-delivery.js';
+const adapters=Object.freeze({ZWR:{generate:generateAndReleaseAccountZiwei,open:openAccountZiweiMaterial,list:listAccountZiweiMaterials}});
+export function resolveMethodDeliveryAdapter(methodCode){
+ const adapter=adapters[methodCode];
+ if(!adapter)throw Object.assign(new Error('METHOD_DELIVERY_ADAPTER_NOT_ADMITTED'),{code:'METHOD_DELIVERY_ADAPTER_NOT_ADMITTED',status:409});
+ return adapter;
+}
diff --git a/functions/account/method-report-material.js b/functions/account/method-report-material.js
new file mode 100644
index 00000000..495fcf79
--- /dev/null
+++ b/functions/account/method-report-material.js
@@ -0,0 +1,34 @@
+import {assertMethodGeneration,methodMaterialIdentity} from '../report-delivery/method-render-contract.js';
+import {digest} from './oidc-auth.js';
+const fail=()=>{throw Object.assign(new Error('REPORT_UNAVAILABLE'),{code:'REPORT_UNAVAILABLE',status:404});};
+// Existing SQL and private object owners remain canonical. Adapters must perform
+// method entitlement, subject consent and release admission on every read.
+export async function readMethodReportMaterial(context,reportId,{ownerAccountId,openReleasedCandidate,loadReleaseReceipt}={}){
+ if(!ownerAccountId||typeof openReleasedCandidate!=='function')fail();
+ const row=await context.env.RUNTIME_DB.prepare('SELECT rowid AS report_version,* FROM account_method_report_materials WHERE owner_account_id=? AND report_id=?').bind(ownerAccountId,reportId).first();
+ if(!row)fail();
+ const candidate=await openReleasedCandidate(row);
+ if(candidate.customerId!==ownerAccountId||candidate.personId!==row.person_id||candidate.snapshot.methodId!==row.method_code||candidate.snapshot.semanticSnapshotId!==row.snapshot_id||candidate.locale!==row.locale)fail();
+ const contract=await assertMethodGeneration(candidate);
+ let receipt;try{receipt=JSON.parse(row.verifier_receipt)}catch{fail();}
+ if(typeof loadReleaseReceipt!=='function')fail();
+ const releaseReceipt=await loadReleaseReceipt(row),{materialIdentity,...renderReceipt}=receipt;
+ if(JSON.stringify(releaseReceipt)!==JSON.stringify(renderReceipt))fail();
+ const expected=await methodMaterialIdentity(candidate,receipt);
+ if((contract.requiresBoundMaterialIdentity||receipt.materialIdentity)&&JSON.stringify(expected)!==JSON.stringify(receipt.materialIdentity))fail();
+ if(receipt.outputDigest!==row.output_digest)fail();
+ const object=await context.env.PRIVATE_REPORTS.get(row.object_key);if(!object)fail();
+ const html=await object.text();if(await digest(html)!==row.output_digest)fail();
+ return {row,candidate,html};
+}
+export async function persistMethodReportMaterial(context,{release,candidate,html,receipt,identity}){
+ if(receipt.outputDigest!==await digest(html))fail();
+ const objectKey=`released-method/${release.reportId}/${receipt.outputDigest}.html`,now=new Date().toISOString();
+ const enriched={...receipt,materialIdentity:identity};
+ // Content addressed object; never replace the first report material identity.
+ const prior=await context.env.RUNTIME_DB.prepare('SELECT * FROM account_method_report_materials WHERE owner_account_id=? AND report_id=?').bind(candidate.customerId,release.reportId).first();
+ if(prior){if(prior.snapshot_id!==candidate.snapshot.semanticSnapshotId)fail();return {reportId:release.reportId};}
+ await context.env.PRIVATE_REPORTS.put(objectKey,html,{httpMetadata:{contentType:'text/html; charset=utf-8',cacheControl:'private, no-store'}});
+ await context.env.RUNTIME_DB.prepare('INSERT INTO account_method_report_materials(report_id,owner_account_id,person_id,method_code,locale,snapshot_id,object_key,output_digest,released_at,verifier_receipt) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(report_id) DO NOTHING').bind(release.reportId,candidate.customerId,candidate.personId,candidate.snapshot.methodId,candidate.locale,candidate.snapshot.semanticSnapshotId,objectKey,receipt.outputDigest,now,JSON.stringify(enriched)).run();
+ return {reportId:release.reportId};
+}
diff --git a/functions/api/shared-report-renderer-stability.js b/functions/api/shared-report-renderer-stability.js
new file mode 100644
index 00000000..68f472fa
--- /dev/null
+++ b/functions/api/shared-report-renderer-stability.js
@@ -0,0 +1,33 @@
+import {authenticate,digest,requireSameOrigin} from '../account/oidc-auth.js';
+import {assertMethodGeneration,assertMethodRenderReceipt} from '../report-delivery/method-render-contract.js';
+import {requireMethodWave} from './shared-report-e2e-proof.js';
+const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
+const fail=(code,status=409)=>Object.assign(new Error(code),{code,status});
+// Explicit live-only API. Frozen candidate comes from a private trusted manifest,
+// never client JSON. It invokes the renderer sequentially and never the writer.
+export async function onRequest(context){
+ try{
+  if(context.request.method!=='POST')throw fail('METHOD_NOT_ALLOWED',405);
+  requireSameOrigin(context.request);
+  if(!await authenticate(context))throw fail('ACCOUNT_REQUIRED',401);
+  if(context.env.PHIOS_ENVIRONMENT!=='qa'||context.env.SHARED_REPORT_E2E_LIVE_ALLOWED!=='true')throw fail('SHARED_E2E_LIVE_NOT_AUTHORIZED',403);
+  const manifest=await requireMethodWave(context.env);
+  if(!manifest.frozenRendererCandidateKey||!manifest.frozenRendererSnapshotId)throw fail('SHARED_RENDERER_FROZEN_CANDIDATE_REQUIRED');
+  const object=await context.env.PRIVATE_REPORTS.get(manifest.frozenRendererCandidateKey);
+  if(!object)throw fail('SHARED_RENDERER_FROZEN_CANDIDATE_REQUIRED');
+  const candidate=await object.json(),contract=await assertMethodGeneration(candidate);
+  if(candidate.scope!=='CONTROLLED_QA_ONLY'||candidate.snapshot.semanticSnapshotId!==manifest.frozenRendererSnapshotId)throw fail('SHARED_RENDERER_FROZEN_CANDIDATE_REQUIRED');
+  if(!context.env.METHOD_REPORT_RENDERER?.fetch)throw fail('REPORT_BROWSER_VERIFIER_NOT_CONFIGURED',503);
+  const measurements=[];
+  for(const groupSize of [3,5])for(let index=0;index<groupSize;index++){
+   const response=await context.env.METHOD_REPORT_RENDERER.fetch(new Request('https://method-report-renderer.internal/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({candidate,method:contract.methodCode,compositionVersion:contract.compositionVersion})}));
+   if(!response.ok)throw fail('SHARED_RENDERER_CAMPAIGN_FAILED');
+   const output=await response.json(),receipt=output.verification;assertMethodRenderReceipt(candidate,receipt);
+   if(receipt.verifier!=='CLOUDFLARE_BROWSER_QA'||!receipt.timings||receipt.outputDigest!==await digest(output.html))throw fail('SHARED_RENDERER_CAMPAIGN_RECEIPT_REQUIRED');
+   measurements.push({groupSize,index:index+1,sequence:measurements.length+1,passed:true,pageCount:receipt.pageCount,expectedPageCount:contract.expectedPageCount,imageCount:receipt.imageCount,htmlBytes:receipt.htmlBytes,timings:receipt.timings,outputDigest:receipt.outputDigest,browserLaunchFailures:0,timeouts:0,overflowFailures:0,brokenImageFailures:0,pageDriftFailures:0,rendererErrors:0});
+  }
+  const receipt={schemaVersion:'SHARED_RENDERER_STABILITY_RECEIPT_V1',scope:'DEPLOYED_PRIVATE_BROWSER',status:'PASS',methodCode:contract.methodCode,rendererVersion:contract.rendererVersion,compositionVersion:contract.compositionVersion,semanticSnapshotId:candidate.snapshot.semanticSnapshotId,sequential:true,measurements,providerCalls:0,recordedAt:new Date().toISOString()};
+  await context.env.PRIVATE_REPORTS.put('qa/shared-report-e2e/v2/renderer-stability/'+contract.rendererVersion+'.json',JSON.stringify(receipt),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
+  return Response.json({ok:true,status:'PASS',sequentialRuns:measurements.length,providerCalls:0,sharedDeliveryAuthorityEligible:false},{headers});
+ }catch(error){return Response.json({ok:false,code:error.code||'SHARED_RENDERER_CAMPAIGN_FAILED'},{status:error.status||409,headers});}
+}
diff --git a/functions/report-delivery/method-delivery-cache.js b/functions/report-delivery/method-delivery-cache.js
new file mode 100644
index 00000000..e6029d18
--- /dev/null
+++ b/functions/report-delivery/method-delivery-cache.js
@@ -0,0 +1,36 @@
+import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
+const inflight=new WeakMap();
+const fail=code=>{throw Object.assign(new Error(code),{code,status:409});};
+export async function methodCacheIdentity(seed){return sha256Stable(seed);}
+export async function cachedMethodDelivery(env,{ownerAccountId,kind,key,produce,beforeClaim=async()=>{},validate=async()=>{}}){
+ if(!ownerAccountId||!['SEMANTIC','PUBLICATION'].includes(kind)||!env.RUNTIME_DB?.prepare||!env.PRIVATE_REPORTS?.get||!env.PRIVATE_REPORTS?.put)fail('METHOD_CACHE_STORAGE_REQUIRED');
+ // The durable claim is authoritative across isolates. This map only joins callers
+ // in one isolate; authorization is performed before each caller reaches this API.
+ const db=env.RUNTIME_DB;let pending=inflight.get(db);if(!pending){pending=new Map();inflight.set(db,pending);}
+ const join=JSON.stringify([ownerAccountId,kind,key]);
+ if(pending.has(join))return pending.get(join);
+ const task=(async()=>{
+  const lookup=()=>db.prepare('SELECT * FROM method_delivery_cache WHERE owner_account_id=? AND cache_kind=? AND cache_key=?').bind(ownerAccountId,kind,key).first();
+  const read=async row=>{
+   if(row.state!=='READY')fail(row.state==='FAILED'?'METHOD_CACHE_RECONCILIATION_REQUIRED':'METHOD_GENERATION_IN_PROGRESS');
+   const object=await env.PRIVATE_REPORTS.get(row.object_key);if(!object)fail('METHOD_CACHE_MATERIAL_MISSING');
+   const payload=await object.json();if(await sha256Stable(payload)!==row.payload_digest)fail('METHOD_CACHE_DIGEST_MISMATCH');
+   await validate(payload);return {value:payload,cacheHit:true,key};
+  };
+  const existing=await lookup();if(existing)return read(existing);
+  await beforeClaim();
+  const claim=crypto.randomUUID(),now=new Date().toISOString();
+  await db.prepare("INSERT INTO method_delivery_cache(owner_account_id,cache_kind,cache_key,claim_id,state,created_at,updated_at) VALUES(?,?,?,?,'CLAIMED',?,?) ON CONFLICT(owner_account_id,cache_kind,cache_key) DO NOTHING").bind(ownerAccountId,kind,key,claim,now,now).run();
+  const row=await lookup();if(row.claim_id!==claim)return read(row);
+  try{
+   const value=await produce();await validate(value);
+   const payloadDigest=await sha256Stable(value),objectKey='method-cache/'+await sha256Stable({ownerAccountId,kind,key})+'/'+payloadDigest+'.json';
+   await env.PRIVATE_REPORTS.put(objectKey,JSON.stringify(value),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
+   await db.prepare("UPDATE method_delivery_cache SET state='READY',object_key=?,payload_digest=?,updated_at=? WHERE owner_account_id=? AND cache_kind=? AND cache_key=? AND claim_id=? AND state='CLAIMED'").bind(objectKey,payloadDigest,new Date().toISOString(),ownerAccountId,kind,key,claim).run();
+   return {value,cacheHit:false,key};
+  }catch(error){
+   await db.prepare("UPDATE method_delivery_cache SET state='FAILED',updated_at=? WHERE owner_account_id=? AND cache_kind=? AND cache_key=? AND claim_id=? AND state='CLAIMED'").bind(new Date().toISOString(),ownerAccountId,kind,key,claim).run();throw error;
+  }
+ })();pending.set(join,task);
+ try{return await task;}finally{pending.delete(join);}
+}
diff --git a/functions/report-delivery/method-render-contract.js b/functions/report-delivery/method-render-contract.js
new file mode 100644
index 00000000..0b417e6d
--- /dev/null
+++ b/functions/report-delivery/method-render-contract.js
@@ -0,0 +1,17 @@
+import * as ziwei from './ziwei-vfr-method-profile.js';
+// Each adapter owns its native versions, pagination and diagram policies.
+// Additional methods are admitted only after their own delivery delta resolves.
+const adapters=Object.freeze({ZWR:ziwei});
+function adapter(candidate){
+ const selected=adapters[candidate?.snapshot?.methodId];
+ if(!selected)throw Object.assign(new Error('METHOD_RENDER_CONTRACT_UNADMITTED'),{code:'METHOD_RENDER_CONTRACT_UNADMITTED',status:409});
+ return selected;
+}
+export const resolveMethodRenderContract=candidate=>adapter(candidate).resolveMethodRenderContract(candidate);
+export const resolveMethodDeliveryDelta=resolveMethodRenderContract;
+export const assertMethodRenderReceipt=(candidate,receipt)=>adapter(candidate).assertMethodRenderReceipt(candidate,receipt);
+export const methodMaterialIdentity=(candidate,receipt)=>adapter(candidate).methodMaterialIdentity(candidate,receipt);
+export const assertMethodGeneration=candidate=>adapter(candidate).assertMethodGeneration(candidate);
+export function assertMethodPresentationMode(methodCode,mode){
+ if(['PROFILE','FINANCIAL','WILL'].includes(methodCode)&&mode!=='BILINGUAL')throw Object.assign(new Error('METHOD_BILINGUAL_ONLY'),{code:'METHOD_BILINGUAL_ONLY',status:409});
+}
diff --git a/functions/report-delivery/ziwei-vfr-method-profile.js b/functions/report-delivery/ziwei-vfr-method-profile.js
new file mode 100644
index 00000000..acd042e8
--- /dev/null
+++ b/functions/report-delivery/ziwei-vfr-method-profile.js
@@ -0,0 +1,70 @@
+import {renderZwrVfrReview,ZWR_VFR_RENDERER_VERSION} from '../../assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js';
+import {ZWR_VFR_STYLES} from '../../assets/customer-ui/js/personal-products/ziwei-vfr-r1-styles.js';
+import {buildZwrVfrPagePlan,validateZwrVfrPagePlan,ZWR_VFR_PAGE_PLAN_VERSION} from '../personal-reading/visual-first/ziwei-vfr-page-plan.js';
+import {ZIWEI_VFR_R1_GENERATION_VERSION} from './ziwei-vfr-r1-version.js';
+import {ZWR_VFR_METHOD_PROFILE} from './ziwei-vfr-profile-policy.js';
+import {buildZwrVfrDiagramData} from '../personal-reading/visual-first/ziwei-vfr-diagram-data.js';
+import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
+import {renderPublicationReport} from '../../assets/customer-ui/js/personal-products/publication-report-pages.js';
+import {finalizeZiweiNavigation} from '../canonical-presentation-runtime/ziwei-navigation-finalization.js';
+
+export const HISTORICAL_ZIWEI_PAGE_COUNTS=Object.freeze({'ZIWEI-PRODUCTION-COMPOSER-V1':33,'ZIWEI-NATURAL-COMPOSER-R4':33,'ZIWEI-PROFESSIONAL-SYNTHESIS-R5':39,'ZIWEI-CONTEXTUAL-RCA-R1':41});
+const fail=code=>{throw Object.assign(new Error(code),{code,status:409});};
+export function resolveMethodRenderContract(candidate){
+ const snapshot=candidate?.snapshot,c=snapshot?.semanticContent,version=snapshot?.compositionVersion;
+ if(snapshot?.methodId!=='ZWR'||!['en','zh-Hans'].includes(candidate.locale))fail('METHOD_RENDER_CONTRACT_UNADMITTED');
+ if(version===ZIWEI_VFR_R1_GENERATION_VERSION){
+  if(candidate.generationSuccessor!==version||candidate.naturalCompositionSummary?.completenessStatus!=='PASS'||candidate.naturalCompositionSummary?.semanticReviewCalls!==0)fail('ZWR_VFR_GENERATION_INCOMPLETE');
+  if(!c?.visualReportIr||!c.vfrDiagramData||!Array.isArray(c.vfrPagePlan)||!c.vfrPublicationFit||c.visualReportIr.methodId!=='ZWR'||c.visualReportIr.localeMode!=='BILINGUAL')fail('ZIWEI_VFR_GENERATION_RENDERER_MISMATCH');
+  const subject=c.visualReportIr.subjectBinding;
+  if(subject?.subjectId!==candidate.personId||subject.inputFingerprint!==snapshot.inputFingerprint)fail('ZWR_VFR_SUBJECT_MISMATCH');
+  const ids=c.vfrDiagramData.diagrams?.map(d=>d.id)||[];
+  if(ids.length!==15||new Set(ids).size!==15)fail('ZWR_VFR_DIAGRAM_REGISTRY_INVALID');
+  const checked=validateZwrVfrPagePlan({diagramIds:ids,pages:c.vfrPagePlan,sections:c.visualReportIr.sections});
+  if(!checked.accepted||JSON.stringify(c.vfrPagePlan)!==JSON.stringify(buildZwrVfrPagePlan({sections:c.visualReportIr.sections}))||JSON.stringify(c.vfrPublicationFit)!==JSON.stringify(checked.fitProfile))fail('ZWR_VFR_PAGE_PLAN_INVALID');
+  return {methodCode:'ZWR',compositionVersion:version,rendererId:'ZIWEI_VFR',requiresBoundMaterialIdentity:true,rendererVersion:ZWR_VFR_RENDERER_VERSION,publicationVersion:c.visualReportIr.schemaVersion,pagePlanVersion:ZWR_VFR_PAGE_PLAN_VERSION,expectedPageCount:c.vfrPagePlan.length,expectedPageRule:'vfrPagePlan.length',requiredDiagramIds:ids,verificationMode:'ZWR_VFR_PHYSICAL_PAGE_CONTRACT_V1',pageSelector:'main.report-root > .zv-page',styles:ZWR_VFR_STYLES,safeLimits:{maxRequestBytes:8000000},renderFunction:()=>renderZwrVfrReview({reportIr:c.visualReportIr,diagramData:c.vfrDiagramData,pagePlan:c.vfrPagePlan})};
+ }
+ const expectedPageCount=HISTORICAL_ZIWEI_PAGE_COUNTS[version];
+ // Never fall back to legacy publication for a VFR payload with an old version.
+ if(c?.visualReportIr||c?.vfrPagePlan)fail('ZIWEI_VFR_GENERATION_RENDERER_MISMATCH');
+ if(!expectedPageCount||c?.report?.totalPages!==expectedPageCount)fail('METHOD_RENDER_CONTRACT_UNADMITTED');
+ return {methodCode:'ZWR',compositionVersion:version,rendererId:'ZIWEI_HISTORICAL',requiresBoundMaterialIdentity:false,rendererVersion:'METHOD_BROWSER_VERIFICATION_V1',publicationVersion:version,expectedPageCount,expectedPageRule:'HISTORICAL_METHOD_VERSION',requiredDiagramIds:[],verificationMode:'DOM_PHYSICAL_PAGE_CONTRACT_V1',pageSelector:'main .pub-report > .pub-static, main .pub-report > .pub-page',safeLimits:{maxRequestBytes:8000000},renderFunction:()=>finalizeZiweiNavigation(renderPublicationReport(c.report),candidate.locale)};
+}
+export const resolveMethodDeliveryDelta=resolveMethodRenderContract;
+export function assertMethodRenderReceipt(candidate,receipt){
+ const contract=resolveMethodRenderContract(candidate);
+ if(!receipt||receipt.semanticSnapshotId!==candidate.snapshot.semanticSnapshotId||receipt.passed!==true||receipt.pageCount!==contract.expectedPageCount||receipt.brokenImages!==0||receipt.overflowCount!==0||receipt.errorCount!==0)fail('REPORT_RENDER_VERIFICATION_REQUIRED');
+ if(contract.rendererId==='ZIWEI_VFR'&&(receipt.rendererVersion!==contract.rendererVersion||receipt.compositionVersion!==contract.compositionVersion||receipt.verificationMode!==contract.verificationMode||receipt.pageSequenceValid!==true||receipt.hiddenOrZeroGeometryCount!==0||receipt.hiddenRequiredContentCount!==0||receipt.expectedPageCount!==contract.expectedPageCount||receipt.actualPageCount!==contract.expectedPageCount||receipt.snapshotId!==candidate.snapshot.semanticSnapshotId||receipt.pagePlanDigest!==candidate.snapshot.semanticContent.vfrLineage?.pagePlanDigest||receipt.diagramRegistryValid!==true||receipt.undefinedText!==false))fail('REPORT_RENDER_VERIFICATION_REQUIRED');
+ return contract;
+}
+export async function methodMaterialIdentity(candidate,receipt){
+ const contract=assertMethodRenderReceipt(candidate,receipt);
+ return {materialSchemaVersion:'METHOD_PRIVATE_RELEASED_MATERIAL_V2',ownerAccountId:candidate.customerId,subjectId:candidate.personId,purchaseId:candidate.purchaseId,releaseStatus:'ACTIVE',generationVersion:candidate.generationSuccessor||contract.compositionVersion,profileVersion:candidate.snapshot.semanticContent.vfrLineage?.profileVersion||null,publicationIrDigest:candidate.snapshot.semanticContent.visualReportIr?.publicationIrDigest||null,pagePlanDigest:candidate.snapshot.semanticContent.vfrLineage?.pagePlanDigest||null,diagramDigest:candidate.snapshot.semanticContent.vfrDiagramData?.diagramDataDigest||null,outputDigest:receipt.outputDigest,methodCode:contract.methodCode,compositionVersion:contract.compositionVersion,publicationVersion:contract.publicationVersion,rendererVersion:contract.rendererVersion,presentationMode:contract.rendererId==='ZIWEI_VFR'?'BILINGUAL':candidate.locale,semanticSnapshotId:candidate.snapshot.semanticSnapshotId,semanticDigest:await sha256Stable(candidate.snapshot.semanticContent),manuscriptDigest:candidate.snapshot.semanticContent.vfrDeepManuscriptDigest||null,pagePlanVersion:contract.pagePlanVersion||null};
+}
+
+export async function assertMethodGeneration(candidate){
+ const contract=resolveMethodRenderContract(candidate),s=candidate.snapshot;
+ const {createCustomerDeliverySnapshot}=await import('../personal-reading/narrative/report-section-snapshot.js');
+ if((await createCustomerDeliverySnapshot(s)).semanticSnapshotId!==s.semanticSnapshotId)fail('METHOD_SEMANTIC_SNAPSHOT_TAMPERED');
+ if(contract.rendererId==='ZIWEI_VFR'){
+  const c=s.semanticContent;
+  if(c.vfrLineage?.profileVersion!==ZWR_VFR_METHOD_PROFILE.profileVersion||c.vfrLineage?.rendererContractVersion!==ZWR_VFR_METHOD_PROFILE.rendererContractVersion||c.vfrLineage?.pagePlanDigest!==await sha256Stable(c.vfrPagePlan)||JSON.stringify(await buildZwrVfrDiagramData({evidence:c.evidence}))!==JSON.stringify(c.vfrDiagramData))fail('METHOD_PUBLICATION_LINEAGE_MISMATCH');
+  const {publicationIrDigest,...ir}=c.visualReportIr,{diagramDataDigest,...diagrams}=c.vfrDiagramData;
+  if(await sha256Stable(ir)!==publicationIrDigest||await sha256Stable(diagrams)!==diagramDataDigest)fail('METHOD_PUBLICATION_DIGEST_MISMATCH');
+  if(diagrams.subjectId!==candidate.personId||diagrams.inputFingerprint!==s.inputFingerprint||ir.sourceResultDigest!==c.vfrDeepManuscriptDigest||ir.authorityDigest!==c.vfrCompactAuthoringPackDigest)fail('METHOD_PUBLICATION_LINEAGE_MISMATCH');
+  const ids=c.vfrPagePlan.filter(p=>p.pageFamily==='SECTION_MASTER').map(p=>p.sectionId);
+  if(ir.sections.length!==ids.length||new Set(ir.sections.map(x=>x.sectionId)).size!==ids.length)fail('METHOD_SOURCE_SECTION_COVERAGE_INCOMPLETE');
+  for(const id of ids){
+   const section=ir.sections.find(x=>x.sectionId===id);
+   if(!section?.authorityRefs?.length)fail('METHOD_SOURCE_COVERAGE_REQUIRED');
+   for(const locale of ['zhHans','en']){
+    const copy=section[locale],expected=String(copy?.manuscript||'').trim().split(/\n\s*\n/u).map(x=>x.trim()).filter(Boolean);
+    if(!expected.length||JSON.stringify(copy?.paragraphs)!==JSON.stringify(expected))fail('METHOD_MANUSCRIPT_SPAN_COVERAGE_INCOMPLETE');
+   }
+  }
+ }
+ return contract;
+}
+export function assertMethodPresentationMode(methodCode,mode){
+ if(['PROFILE','FINANCIAL','WILL'].includes(methodCode)&&mode!=='BILINGUAL')fail('METHOD_BILINGUAL_ONLY');
+}
diff --git a/functions/report-delivery/ziwei-vfr-profile-policy.js b/functions/report-delivery/ziwei-vfr-profile-policy.js
new file mode 100644
index 00000000..e7ba3c7f
--- /dev/null
+++ b/functions/report-delivery/ziwei-vfr-profile-policy.js
@@ -0,0 +1,27 @@
+import {ZIWEI_VFR_R1_GENERATION_VERSION} from './ziwei-vfr-r1-version.js';
+export const ZWR_VFR_METHOD_PROFILE=Object.freeze({
+ profileVersion:'ZWR-VFR-R1-METHOD-PUBLICATION-PROFILE-v1',
+ methodCode:'ZWR',productId:'COM-REPORT-ZIWEI-FULL',generationVersion:ZIWEI_VFR_R1_GENERATION_VERSION,
+ compositionVersion:ZIWEI_VFR_R1_GENERATION_VERSION,
+ publicationIrVersion:'ZWR-VFR-R1-DEEP-PUBLICATION-IR-v1',
+ pagePlanVersion:'ZWR-VFR-R1-ADAPTIVE-LANGUAGE-SEQUENTIAL-v6',pagePlanMode:'ADAPTIVE_REFLOW',expectedPageRule:'PLAN_LENGTH',
+ diagramRegistryVersion:'ZWR-VFR-R1-DIAGRAM-DATA-v1',
+ rendererVersion:'ZWR-VFR-R1-DEEP-RENDERER-v6',rendererContractVersion:'ZWR_VFR_PHYSICAL_PAGE_CONTRACT_V1',
+ presentationMode:'BILINGUAL',contentHumanAcceptance:'EXISTING_ACCEPTED_REFERENCE',
+ semanticReviewCalls:0,publicationProviderCalls:0,rerenderProviderCalls:0,reopenProviderCalls:0,
+ releaseStatus:'BLOCKED_UNTIL_DEPLOYED_SNAPSHOT_RENDERER_SUCCESSOR',unresolvedFields:[]
+});
+export function requireZwrVfrProfile(profile=ZWR_VFR_METHOD_PROFILE){
+ if(profile!==ZWR_VFR_METHOD_PROFILE||profile.unresolvedFields.length||!profile.profileVersion||profile.generationVersion!==ZIWEI_VFR_R1_GENERATION_VERSION)throw Object.assign(new Error('METHOD_PUBLICATION_PROFILE_UNRESOLVED'),{code:'METHOD_PUBLICATION_PROFILE_UNRESOLVED',status:409});
+ return profile;
+}
+
+// A deployed native renderer admission is distinct from the shared all-method proof.
+// It must exist before a real paid writing attempt; local synthetic dependencies
+// exercise the deterministic implementation without granting this admission.
+export async function requireZwrVfrGenerationAdmission(env){
+ const object=await env.PRIVATE_REPORTS?.get('qa/method-delivery/ZWR/generation-admission.json');
+ const receipt=object?await object.json():null;
+ if(receipt?.schemaVersion!=='METHOD_GENERATION_ADMISSION_V1'||receipt.methodCode!=='ZWR'||receipt.state!=='ACCEPTED'||receipt.scope!=='DEPLOYED_PRIVATE_BROWSER'||receipt.profileVersion!==ZWR_VFR_METHOD_PROFILE.profileVersion||receipt.rendererVersion!==ZWR_VFR_METHOD_PROFILE.rendererVersion||receipt.sourceAcceptanceDigest!==SOURCE_ACCEPTANCE_DIGEST||typeof receipt.rendererAcceptanceDigest!=='string'||!/^[a-f0-9]{64}$/i.test(receipt.rendererAcceptanceDigest))throw Object.assign(new Error('METHOD_GENERATION_ADMISSION_REQUIRED'),{code:'METHOD_GENERATION_ADMISSION_REQUIRED',status:503});
+}
+const SOURCE_ACCEPTANCE_DIGEST='81e31ab108602135616965c0c92d838085ddb0f5561c02c02ceb09f8958dc611';
diff --git a/functions/report-delivery/ziwei-vfr-r1-version.js b/functions/report-delivery/ziwei-vfr-r1-version.js
new file mode 100644
index 00000000..ab18933c
--- /dev/null
+++ b/functions/report-delivery/ziwei-vfr-r1-version.js
@@ -0,0 +1,2 @@
+// Shared immutable version identity; importing a render contract must not load the writer.
+export const ZIWEI_VFR_R1_GENERATION_VERSION='ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3';
diff --git a/scripts/check-method-delivery-delta.mjs b/scripts/check-method-delivery-delta.mjs
new file mode 100644
index 00000000..76a768c2
--- /dev/null
+++ b/scripts/check-method-delivery-delta.mjs
@@ -0,0 +1,6 @@
+import fs from 'node:fs';
+const code=process.argv[2],registry=JSON.parse(fs.readFileSync('content/reports/method-report-delivery-delta-registry-v1.json'));
+const entry=registry.methods.find(x=>x.methodCode===code);if(!entry)throw Error('METHOD_DELIVERY_DELTA_NOT_REGISTERED');
+const receipt=JSON.parse(fs.readFileSync(entry.receiptRef));
+if(receipt.status!=='PASS'||!receipt.deployedProof){console.error(JSON.stringify({methodCode:code,status:receipt.status,blockers:receipt.blockers},null,2));process.exitCode=2;}
+else console.log('PASS '+code+' method delivery delta; full shared E2E not repeated.');
diff --git a/scripts/check-shared-report-delivery-v2-contract.mjs b/scripts/check-shared-report-delivery-v2-contract.mjs
new file mode 100644
index 00000000..7ef08690
--- /dev/null
+++ b/scripts/check-shared-report-delivery-v2-contract.mjs
@@ -0,0 +1,44 @@
+import assert from 'node:assert/strict';
+import fs from 'node:fs';
+import {createHash} from 'node:crypto';
+import {assertMethodPresentationMode} from '../functions/report-delivery/method-render-contract.js';
+const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
+const contract=json('content/reports/shared-report-delivery-e2e-contract-v2.json');
+assert.equal(contract.reusePolicy.fullSharedInfrastructureProofRequiredOnce,true);
+assert.equal(contract.reusePolicy.repeatedPerMethodFullE2E,false);
+assert.equal(contract.liveProofContract.automaticExecution,false);
+for(const field of ['methodDeltaRegistryRef','sessionContract','rendererReceiptContract','sharedInfrastructureRequirements','methodDeltaRequirements','rendererContract','materialContract','libraryContract','reopenContract','accessIsolationContract','liveProofContract','reusePolicy','privacy'])assert(contract[field]);
+for(const item of ['SECOND_ACCOUNT_DENIAL','NO_RENDERER_REGENERATION_ON_REOPEN','NO_PROVIDER_REGENERATION_ON_REOPEN','METHOD_GENERATION_PASS'])assert(contract.sharedInfrastructureRequirements.includes(item));
+assert.equal(contract.liveProofContract.openReleasedMayProveGenerationRelease,false);
+for(const field of ['generationReleaseProven','releasedMaterialProven','reopenProven'])assert(contract.liveProofContract.requiredProofFields.includes(field));
+const serialized=JSON.stringify(contract);for(const forbidden of ['gpt-5.6-sol','ZIWEI-PROFESSIONAL-SYNTHESIS-R5','rendererPageCount','naturalSections'])assert(!serialized.includes(forbidden));
+const registry=json('content/reports/method-report-delivery-delta-registry-v1.json');
+assert.equal(registry.repeatedPerMethodFullE2E,false);
+assert.equal(registry.methods.at(-1).methodCode,'CROSS');
+const profiles=json('content/reports/method-publication-profiles-v1.json').profiles;
+assert.equal(new Set(profiles.map(p=>p.methodId)).size,profiles.length);
+for(const profile of profiles){
+ for(const path of profile.sourceAuthorityRefs)assert(fs.existsSync(path));
+ assert(Array.isArray(profile.unresolvedFields));
+ if(profile.unresolvedFields.length)assert.equal(profile.status,'PROFILE_GATE_OPEN');
+}
+for(const method of ['PROFILE','FINANCIAL','WILL']){
+ assert.deepEqual(profiles.find(x=>x.methodId===method).allowedModes,['BILINGUAL']);
+ assertMethodPresentationMode(method,'BILINGUAL');
+ for(const mode of ['EN','ZH_HANS'])assert.throws(()=>assertMethodPresentationMode(method,mode));
+}
+const protectedBaseline=json('docs/reports/delivery-r4/ACCEPTED-SOURCE-BASELINE.json');
+for(const [path,hash] of Object.entries(protectedBaseline.files))assert.equal(createHash('sha256').update(fs.readFileSync(path)).digest('hex'),hash,'Accepted/historical source changed: '+path);
+for(const entry of registry.methods){
+ const delta=json(entry.receiptRef);
+ assert.equal(delta.methodCode,entry.methodCode);assert.equal(delta.fullSharedE2ERepeated,false);
+ for(const field of ['publicationProviderRule','rerenderProviderRule','reopenProviderRule'])assert.equal(delta[field],0);
+ if(delta.status!=='PASS')assert(delta.blockers.length);
+}
+const proof=fs.readFileSync('functions/api/shared-report-e2e-proof.js','utf8');
+assert(!proof.includes('assertR5'));assert(!proof.includes('pageCount!==39'));assert(!proof.includes('firstAuthenticatedSessionId'));
+assert(proof.includes('firstAuthenticatedSessionHash'));assert(proof.includes('account-isolation'));
+assert(proof.indexOf("if(body.action==='finalize')")<proof.indexOf('sharedDeliveryAuthorityEligible:true'));
+for(const token of ['SHARED_E2E_REQUIRED_LIVE_PHASES_INCOMPLETE','SHARED_E2E_RENDERER_STABILITY_REQUIRED','SHARED_E2E_ALL_TARGET_METHOD_DELTAS_REQUIRED','SHARED_E2E_CROSS_ACCOUNT_SUBJECT_LEAK'])assert(proof.includes(token));
+if(registry.methods.some(x=>x.status!=='PASS'))assert.equal(registry.sharedFinalLiveE2EAllowed,false);
+console.log('PASS shared delivery v2 readiness/contracts: native profiles indexed; unresolved gates explicit; protected sources unchanged; no final live authority granted. Provider calls=0.');
diff --git a/scripts/check-shared-report-delivery-v2-runtime.mjs b/scripts/check-shared-report-delivery-v2-runtime.mjs
new file mode 100644
index 00000000..c0a1686b
--- /dev/null
+++ b/scripts/check-shared-report-delivery-v2-runtime.mjs
@@ -0,0 +1,199 @@
+// This suite is wholly offline, including authentication fixtures.
+globalThis.fetch=async()=>{throw Error('OFFLINE_TEST_NETWORK_FORBIDDEN');};
+import fs from 'node:fs';
+import assert from 'node:assert/strict';
+import {DatabaseSync} from 'node:sqlite';
+import {randomBytes,createHash} from 'node:crypto';
+import {saveCanonicalPerson,loadCanonicalPerson,loadCanonicalPersonSubject,listCanonicalPersons} from '../functions/account/canonical-person-store.js';
+import {onRequest as personApi} from '../functions/api/account-persons.js';
+import {generateAccountZiweiCandidate as generateProductionAccountZiweiCandidate} from '../functions/report-delivery/ziwei-canonical-person-binding.js';
+import {releaseControlledZiweiReport,openControlledZiweiReport,listControlledZiweiReports} from '../functions/account/ziwei-controlled-report-material.js';
+import {generateAndReleaseAccountZiwei as generateProductionAndReleaseAccountZiwei,openAccountZiweiMaterial,listAccountZiweiMaterials} from '../functions/account/ziwei-account-delivery.js';
+import {digest} from '../functions/account/oidc-auth.js';
+import {generateZiweiProductionCandidate} from '../functions/report-delivery/ziwei-production-generation-v1.js';
+// Trusted server injection keeps this storage test offline; the production default is resolved separately from the current canonical cutover state.
+const generateAccountZiweiCandidate=(context,selection)=>generateProductionAccountZiweiCandidate(context,selection,{generateCandidate:generateZiweiProductionCandidate});
+const generateAndReleaseAccountZiwei=(context,selection)=>generateProductionAndReleaseAccountZiwei(context,selection,{generateCandidate:generateAccountZiweiCandidate});
+const sqlite=new DatabaseSync(':memory:');
+for(const file of fs.readdirSync('db/migrations').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(fs.readFileSync('db/migrations/'+file,'utf8'));
+const db={prepare(sql){return {values:[],bind(...v){this.values=v;return this;},async first(){return sqlite.prepare(sql).get(...this.values)||null;},async all(){return {results:sqlite.prepare(sql).all(...this.values)};},async run(){return sqlite.prepare(sql).run(...this.values);}};},async batch(statements){sqlite.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
+const objects=new Map(),env={PHIOS_ENVIRONMENT:'local',RUNTIME_DB:db,CANONICAL_PERSON_ENCRYPTION_KEY:randomBytes(32).toString('hex'),PRIVATE_REPORTS:{async put(k,v){objects.set(k,v);},async get(k){return objects.has(k)?{text:async()=>objects.get(k),json:async()=>JSON.parse(objects.get(k))}:null;}}};
+const account=userId=>({env,data:{symbolicAccountIdentity:{userId,providerId:'ISOLATED_LOCAL_TEST',authenticated:true,verified:true}}});
+const a=account('LOCAL-CPA-A'),b=account('LOCAL-CPA-B'),f=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/controlled-subject.json'));
+const {birthDate,birthTime,birthPlace,timeAccuracy}=f.canonicalBirthInput;
+const input={action:'save',expectedVersion:0,name:'Controlled owner A',birth:{birthDate,birthTime,birthPlace,timeAccuracy,timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00'}},calculationSex:'MALE',consent:{personalMethod:true,report:true,saveBirthInput:true},expiresAt:new Date(Date.now()+300*86400000).toISOString()};
+const tests=[];
+async function denied(name,call){await assert.rejects(call);tests.push({name,result:'DENIED'});}
+await denied('guest cannot create',()=>saveCanonicalPerson({env,data:{}},input));
+await denied('client owner cannot be supplied',()=>saveCanonicalPerson(a,{...input,ownerAccountId:'LOCAL-CPA-B'}));
+await denied('missing consent',()=>saveCanonicalPerson(a,{...input,consent:{}}));
+await denied('invalid date',()=>saveCanonicalPerson(a,{...input,birth:{...input.birth,birthDate:'2023-02-29'}}));
+const p=await saveCanonicalPerson(a,input),q=await saveCanonicalPerson(b,{...input,name:'Controlled owner B'});
+assert.equal(p.ownerAccountId,'LOCAL-CPA-A');assert.equal(p.version,1);
+await denied('A cannot load B',()=>loadCanonicalPerson(env,'LOCAL-CPA-A',q.personId));
+await denied('B cannot load A',()=>loadCanonicalPerson(env,'LOCAL-CPA-B',p.personId));
+await denied('B cannot update A',()=>saveCanonicalPerson(b,{...input,personId:p.personId,expectedVersion:1}));
+assert.equal((await listCanonicalPersons(a)).length,1);
+assert.equal((await listCanonicalPersons(b))[0].personId,q.personId);
+const row=sqlite.prepare('SELECT * FROM account_person_versions WHERE person_id=?').get(p.personId);
+assert(!JSON.stringify(row).includes(p.name));assert(!JSON.stringify(row).includes(birthDate));
+const request=(body,origin='https://qa.phios-github.pages.dev')=>new Request('https://qa.phios-github.pages.dev/api/account-persons',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
+assert.equal((await personApi({...a,request:request(input,'https://wrong.example')})).status,403);
+assert.equal((await personApi({env,data:{},request:request(input)})).status,401);
+const selection={personId:p.personId,locale:'en',targetContext:f.targetContext};
+await denied('no entitlement',()=>generateAccountZiweiCandidate(a,selection));
+await denied('client birth replacement',()=>generateAccountZiweiCandidate(a,{...selection,birthDate:'2000-01-01'}));
+// SQL fixture is local policy evidence only, never Stripe/QA purchase proof.
+const product='COM-REPORT-ZIWEI-FULL';
+sqlite.prepare("INSERT INTO commerce_products(product_id,product_version,title,language,format,currency,amount_minor,source_object_key,created_at,updated_at) VALUES(?,'1','Local test','bilingual','REPORT','MYR',3900,'local','2026-10-01','2026-10-01')").run(product);
+sqlite.prepare("INSERT INTO commerce_checkout_attempts(checkout_attempt_id,customer_id,product_id,idempotency_key_hash,status,order_state,context_json,created_at,updated_at) VALUES('cpa-local-order',?,?,'cpa-local-idempotency','paid','FULFILLED',?,'2026-10-01','2026-10-01')").run('LOCAL-CPA-A',product,JSON.stringify({reportPresentation:{reportLanguageMode:'BILINGUAL',reportLocale:'bilingual'}}));
+sqlite.prepare("INSERT INTO commerce_purchases(purchase_id,customer_id,product_id,checkout_attempt_id,stripe_checkout_session_id,currency,amount_minor,purchase_state,created_at,updated_at) VALUES('cpa-local-purchase',?,?,'cpa-local-order','LOCAL-NOT-STRIPE','MYR',3900,'purchased','2026-10-01','2026-10-01')").run('LOCAL-CPA-A',product);
+sqlite.prepare("INSERT INTO digital_entitlements(entitlement_id,purchase_id,customer_id,product_id,subject_hash,entitlement_code,entitlement_status,granted_at,created_at,updated_at) VALUES('cpa-local-entitlement','cpa-local-purchase',?,?,'controlled','REPORT_ZIWEI_FULL','active','2026-10-01','2026-10-01','2026-10-01')").run('LOCAL-CPA-A',product);
+const zwrCutoverPath='docs/reports/ziwei/vfr-r1/PRODUCTION-CUTOVER.json';
+if(fs.existsSync(zwrCutoverPath)){
+ const cutover=JSON.parse(fs.readFileSync(zwrCutoverPath,'utf8'));
+ assert.equal(cutover.schemaVersion,'ZWR-VFR-R1-DEEP-PRODUCTION-CUTOVER-v2');
+ await assert.rejects(
+  ()=>generateProductionAccountZiweiCandidate(a,selection),
+  error=>error?.message==='VFR_REPORT_PROVIDER_LIVE_NOT_ALLOWED'||error?.code==='VFR_REPORT_PROVIDER_LIVE_NOT_ALLOWED'
+ );
+}else{
+ await assert.rejects(()=>generateProductionAccountZiweiCandidate(a,selection),{code:'ZIWEI_R5_OPENAI_API_KEY_REQUIRED'});
+}
+
+import {generateZiweiVfrR1Candidate,ZIWEI_VFR_R1_GENERATION_VERSION} from '../functions/report-delivery/ziwei-vfr-r1-generation.js';
+import {createCustomerDeliverySnapshot} from '../functions/personal-reading/narrative/report-section-snapshot.js';
+import {resolveMethodRenderContract,assertMethodGeneration,assertMethodRenderReceipt,assertMethodPresentationMode} from '../functions/report-delivery/method-render-contract.js';
+import {parseHTML} from 'linkedom';
+const saved=JSON.parse(fs.readFileSync('docs/reports/ziwei/vfr-r1/five-call-experiment/REPAIRED-RESULT.json')).rawManuscriptSections;
+let fakeTransportCalls=0;
+const fakeTransport=async(_url,options)=>{
+ fakeTransportCalls++;
+ const payload=JSON.parse(options.body),batch=JSON.parse(payload.input.find(x=>x.role==='user').content).compactBatch;
+ const sections=batch.sections.map(s=>saved.find(x=>x.sectionId===s.sectionId));
+ assert(sections.every(Boolean));
+ return Response.json({id:'SYNTHETIC_OFFLINE_RESPONSE',status:'completed',output_text:JSON.stringify({sections}),usage:{input_tokens:1,output_tokens:1}});
+};
+// Explicit fixture transport only; no global fetch and no real API key.
+const fixtureContext={...a,env:{...env,REPORT_PROVIDER_LIVE_ALLOWED:'true',OPENAI_API_KEY:'SYNTHETIC_OFFLINE_KEY'}};
+const fixtureGenerator=(context,selected)=>generateProductionAccountZiweiCandidate(context,selected,{generateCandidate:(ctx,s,deps)=>generateZiweiVfrR1Candidate(ctx,s,{...deps,fetcher:fakeTransport})});
+const candidate=await fixtureGenerator(fixtureContext,selection);
+assert.equal(fakeTransportCalls,5);
+const [retry,parallel]=await Promise.all([fixtureGenerator(fixtureContext,selection),fixtureGenerator(fixtureContext,selection)]);
+assert.equal(retry.snapshot.semanticSnapshotId,candidate.snapshot.semanticSnapshotId);assert.equal(parallel.snapshot.semanticSnapshotId,candidate.snapshot.semanticSnapshotId);assert.equal(fakeTransportCalls,5);
+assert.equal(candidate.productionAdmissionGranted,false);
+await assert.rejects(()=>fixtureGenerator({...fixtureContext,env:{...fixtureContext.env,REPORT_PROVIDER_LIVE_ALLOWED:'false'}},{...selection,personId:q.personId}));
+assert.notEqual(candidate.snapshot.semanticContent.vfrCompactAuthoringPackDigest,JSON.parse(fs.readFileSync('docs/reports/ziwei/vfr-r1/COMPACT-AUTHORING-PACK.json')).authorityDigest,'New authority must auto-generate without per-customer Human ACCEPT');
+assert.equal(candidate.snapshot.compositionVersion,ZIWEI_VFR_R1_GENERATION_VERSION);
+assert.equal((await createCustomerDeliverySnapshot(candidate.snapshot)).semanticSnapshotId,candidate.snapshot.semanticSnapshotId,'VFR content must be included in the immutable snapshot digest');
+await assertMethodGeneration(candidate);
+const contract=resolveMethodRenderContract(candidate),html=contract.renderFunction();
+const {document}=parseHTML('<main class="report-root">'+html+'</main>');
+assert.equal(document.querySelectorAll('.zv-page').length,candidate.snapshot.semanticContent.vfrPagePlan.length);
+assert.deepEqual([...document.querySelectorAll('[data-diagram-id]')].map(x=>x.dataset.diagramId).sort(),contract.requiredDiagramIds.slice().sort());
+for(const section of candidate.snapshot.semanticContent.visualReportIr.sections)for(const locale of ['zhHans','en'])for(const paragraph of section[locale].paragraphs)assert(document.body?.textContent?.includes(paragraph)||document.documentElement.textContent.includes(paragraph),'All manuscript paragraphs must appear in the rendered DOM');
+const verification={schemaVersion:'METHOD_BROWSER_VERIFICATION_V1',semanticSnapshotId:candidate.snapshot.semanticSnapshotId,passed:true,snapshotId:candidate.snapshot.semanticSnapshotId,pagePlanDigest:candidate.snapshot.semanticContent.vfrLineage.pagePlanDigest,expectedPageCount:contract.expectedPageCount,actualPageCount:contract.expectedPageCount,hiddenRequiredContentCount:0,pageCount:contract.expectedPageCount,brokenImages:0,overflowCount:0,errorCount:0,rendererVersion:contract.rendererVersion,compositionVersion:contract.compositionVersion,verificationMode:contract.verificationMode,pageSequenceValid:true,hiddenOrZeroGeometryCount:0,diagramRegistryValid:true,undefinedText:false,outputDigest:await digest(html)};
+assertMethodRenderReceipt(candidate,verification);
+for(const changed of [{pageCount:39},{rendererVersion:'OLD'},{diagramRegistryValid:false},{hiddenOrZeroGeometryCount:1},{undefinedText:true}])assert.throws(()=>assertMethodRenderReceipt(candidate,{...verification,...changed}));
+const tampered=structuredClone(candidate);tampered.snapshot.semanticContent.visualReportIr.sections[0].zhHans.paragraphs.pop();
+await assert.rejects(()=>assertMethodGeneration(tampered));
+const wrongVersion=structuredClone(candidate);wrongVersion.snapshot.compositionVersion='ZIWEI-PRODUCTION-COMPOSER-V1';assert.throws(()=>resolveMethodRenderContract(wrongVersion),/ZIWEI_VFR_GENERATION_RENDERER_MISMATCH/);
+const badPlan=structuredClone(candidate);badPlan.snapshot.semanticContent.vfrPagePlan[0].pageNumber=2;assert.throws(()=>resolveMethodRenderContract(badPlan));
+for(const method of ['PROFILE','FINANCIAL','WILL']){
+ assertMethodPresentationMode(method,'BILINGUAL');
+ for(const mode of ['EN','ZH_HANS','en','zh-Hans'])assert.throws(()=>assertMethodPresentationMode(method,mode),/METHOD_BILINGUAL_ONLY/);
+}
+let renderCalls=0,generationCalls=0;
+const generatedOnce=async()=>{generationCalls++;return candidate;};
+const releaseContext={...a,env:{...env,METHOD_REPORT_RENDERER:{async fetch(){renderCalls++;return Response.json({html,verification});}}}};
+const released=await generateProductionAndReleaseAccountZiwei(releaseContext,selection,{generateCandidate:generatedOnce});
+const releasedRetry=await generateProductionAndReleaseAccountZiwei(releaseContext,selection,{generateCandidate:generatedOnce});assert.equal(releasedRetry.reportId,released.reportId);assert.equal(renderCalls,1);
+const first=await openAccountZiweiMaterial(releaseContext,released.reportId);
+const second=await openAccountZiweiMaterial(releaseContext,released.reportId);
+assert.equal(first.row.output_digest,second.row.output_digest);assert.equal(first.html,second.html);
+assert.equal((await listAccountZiweiMaterials(releaseContext))[0].presentationMode,'BILINGUAL');
+assert.equal(renderCalls,1);assert.equal(fakeTransportCalls,5);
+await assert.rejects(()=>openAccountZiweiMaterial(b,released.reportId));
+assert.equal((await listAccountZiweiMaterials(b)).length,0);
+objects.set(first.row.object_key,'TAMPERED');await assert.rejects(()=>openAccountZiweiMaterial(releaseContext,released.reportId));objects.set(first.row.object_key,first.html);
+sqlite.prepare("UPDATE digital_entitlements SET entitlement_status='revoked' WHERE entitlement_id='cpa-local-entitlement'").run();await assert.rejects(()=>openAccountZiweiMaterial(releaseContext,released.reportId));
+
+import {requireZwrVfrGenerationAdmission,ZWR_VFR_METHOD_PROFILE} from '../functions/report-delivery/ziwei-vfr-profile-policy.js';
+await assert.rejects(()=>requireZwrVfrGenerationAdmission(env),/METHOD_GENERATION_ADMISSION_REQUIRED/);
+const admissionKey='qa/method-delivery/ZWR/generation-admission.json';
+objects.set(admissionKey,JSON.stringify({schemaVersion:'METHOD_GENERATION_ADMISSION_V1',methodCode:'ZWR',state:'ACCEPTED',scope:'DEPLOYED_PRIVATE_BROWSER',profileVersion:ZWR_VFR_METHOD_PROFILE.profileVersion,rendererVersion:ZWR_VFR_METHOD_PROFILE.rendererVersion,sourceAcceptanceDigest:createHash('sha256').update(fs.readFileSync('docs/reports/ziwei/vfr-r1/HUMAN-DECISION.json')).digest('hex'),rendererAcceptanceDigest:'0'.repeat(64)}));
+await requireZwrVfrGenerationAdmission(env);objects.delete(admissionKey);
+assert.equal(fakeTransportCalls,5,'Native admission preflight must not call a provider');
+// Durable cache tests use isolated governed inputs, and never a provider transport.
+import {cachedMethodDelivery,methodCacheIdentity} from '../functions/report-delivery/method-delivery-cache.js';
+let cacheProductions=0;
+const governed={method:'ZWR',product,version:ZIWEI_VFR_R1_GENERATION_VERSION,person:p.personId,revision:1,authority:'A',calculation:'C',prompt:'P',schema:'S',model:'M',plan:'FIVE'};
+const cached=async(seed,owner='LOCAL-CPA-A')=>cachedMethodDelivery(env,{ownerAccountId:owner,kind:'SEMANTIC',key:await methodCacheIdentity(seed),produce:async()=>{cacheProductions++;await Promise.resolve();return {generationIdentity:await methodCacheIdentity({owner,...seed})};}});
+const [cacheA,cacheB]=await Promise.all([cached(governed),cached(governed)]);assert.equal(cacheA.value.generationIdentity,cacheB.value.generationIdentity);assert.equal(cacheProductions,1);
+assert.equal((await cached(governed)).value.generationIdentity,cacheA.value.generationIdentity);assert.equal(cacheProductions,1);
+for(const variation of [{person:q.personId},{revision:2},{authority:'B'}])assert.notEqual((await cached({...governed,...variation})).value.generationIdentity,cacheA.value.generationIdentity);
+assert.notEqual((await cached(governed,'LOCAL-CPA-B')).value.generationIdentity,cacheA.value.generationIdentity);
+// All publication identity tampering fails even when the rendered bytes are intact.
+const originalReceipt=first.row.verifier_receipt;
+for(const field of ['manuscriptDigest','publicationIrDigest','pagePlanDigest','compositionVersion','ownerAccountId','subjectId','purchaseId','releaseStatus']){
+ const corrupted=JSON.parse(originalReceipt);corrupted.materialIdentity[field]='TAMPERED';
+ sqlite.prepare('UPDATE account_method_report_materials SET verifier_receipt=? WHERE report_id=?').run(JSON.stringify(corrupted),released.reportId);
+ await assert.rejects(()=>openAccountZiweiMaterial(releaseContext,released.reportId));
+}
+sqlite.prepare('UPDATE account_method_report_materials SET verifier_receipt=? WHERE report_id=?').run(originalReceipt,released.reportId);
+const storedHtml=objects.get(first.row.object_key);objects.delete(first.row.object_key);await assert.rejects(()=>openAccountZiweiMaterial(releaseContext,released.reportId));objects.set(first.row.object_key,storedHtml);
+const releasePayload=sqlite.prepare('SELECT payload FROM runtime_artifacts WHERE artifact_id=?').get(released.reportId).payload;
+const inactive=JSON.parse(releasePayload);inactive.releaseStatus='INACTIVE';sqlite.prepare('UPDATE runtime_artifacts SET payload=? WHERE artifact_id=?').run(JSON.stringify(inactive),released.reportId);await assert.rejects(()=>openAccountZiweiMaterial(releaseContext,released.reportId));sqlite.prepare('UPDATE runtime_artifacts SET payload=? WHERE artifact_id=?').run(releasePayload,released.reportId);
+for(const path of ['vfrDeepManuscriptDigest','vfrCompactAuthoringPackDigest']){const changed=structuredClone(candidate);changed.snapshot.semanticContent[path]='TAMPERED';await assert.rejects(()=>assertMethodGeneration(changed));}
+const invalidProfileCalls=fakeTransportCalls;
+await assert.rejects(()=>generateProductionAccountZiweiCandidate(fixtureContext,selection,{generateCandidate:(ctx,selected,deps)=>generateZiweiVfrR1Candidate(ctx,selected,{...deps,fetcher:fakeTransport,methodProfile:{unresolvedFields:['authority']}})}));assert.equal(fakeTransportCalls,invalidProfileCalls);
+import {EncryptJWT} from 'jose';
+import {onRequest as sharedProofApi} from '../functions/api/shared-report-e2e-proof.js';
+import {onRequest as stabilityApi} from '../functions/api/shared-report-renderer-stability.js';
+sqlite.prepare("UPDATE digital_entitlements SET entitlement_status='active' WHERE entitlement_id='cpa-local-entitlement'").run();
+const proofEnv={...releaseContext.env,PHIOS_ENVIRONMENT:'qa',AUTH_PROVIDER:'auth0',AUTH_ISSUER:'https://synthetic-auth.example/',AUTH_CLIENT_ID:'offline-client',AUTH_CLIENT_SECRET:'offline-client-secret',AUTH_SESSION_SECRET:'offline-session-secret-at-least-32-characters'};
+const origin='https://qa.phios-github.pages.dev';
+for(const owner of ['LOCAL-CPA-A','LOCAL-CPA-B'])sqlite.prepare("INSERT INTO users(user_id,created_at,updated_at) VALUES(?, 'fixture','fixture') ON CONFLICT(user_id) DO NOTHING").run(owner);
+const session=async(owner,sid)=>{
+ const now=Math.floor(Date.now()/1000);
+ sqlite.prepare('INSERT INTO account_verified_sessions(session_hash,user_id,issuer,expires_at,created_at) VALUES(?,?,?,?,?)').run(await digest(sid),owner,proofEnv.AUTH_ISSUER,now+1000,now);
+ const key=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(['session',proofEnv.AUTH_ISSUER,proofEnv.AUTH_CLIENT_ID,origin,proofEnv.AUTH_SESSION_SECRET].join('\0'))));
+ return new EncryptJWT({uid:owner,sid}).setProtectedHeader({alg:'dir',enc:'A256GCM'}).setIssuer(proofEnv.AUTH_ISSUER).setAudience(origin).setIssuedAt().setExpirationTime(now+1000).encrypt(key);
+};
+const sessionA=await session('LOCAL-CPA-A','OFFLINE-SESSION-A'),sessionA2=await session('LOCAL-CPA-A','OFFLINE-SESSION-A2'),sessionB=await session('LOCAL-CPA-B','OFFLINE-SESSION-B');
+const call=async(body,cookie,owner='LOCAL-CPA-A')=>sharedProofApi({env:proofEnv,data:{symbolicAccountIdentity:{userId:owner,providerId:proofEnv.AUTH_ISSUER,verified:true,authenticated:true}},request:new Request(origin+'/api/shared-report-e2e-proof',{method:'POST',headers:{origin,'content-type':'application/json',...(cookie?{cookie:'__Host-phios-session='+cookie}:{})},body:JSON.stringify(body)})});
+assert.equal((await call({action:'reopen',reportId:released.reportId},null)).status,401);
+assert.equal((await (await call({action:'generate-release-open',personId:p.personId,locale:'en'},sessionA)).json()).code,'SHARED_E2E_LIVE_NOT_AUTHORIZED');
+const proofPath='qa/shared-report-e2e/v2/'+released.reportId+'.json';
+const openedProof=await (await call({action:'open-released',reportId:released.reportId},sessionA)).json();
+assert.equal(openedProof.ok,true);assert.equal(openedProof.proof.generationReleaseProven,false);assert.equal(openedProof.proof.releasedMaterialProven,true);
+const sealedProof=objects.get(proofPath),modifiedProof=JSON.parse(sealedProof);modifiedProof.generationReleaseProven=true;
+objects.set(proofPath,JSON.stringify(modifiedProof));assert.equal((await (await call({action:'reopen',reportId:released.reportId},sessionA2)).json()).code,'SHARED_E2E_PROOF_TAMPERED');objects.set(proofPath,sealedProof);
+assert.equal((await (await call({action:'reopen',reportId:released.reportId},sessionA)).json()).code,'SHARED_E2E_NEW_LOGIN_SESSION_REQUIRED');
+assert.equal((await (await call({action:'reopen',reportId:released.reportId},sessionA2)).json()).code,'SHARED_E2E_LOGOUT_REQUIRED');
+// Local session-revocation fixture only. Do not call identity-provider logout or discovery.
+sqlite.prepare('UPDATE account_verified_sessions SET revoked_at=? WHERE session_hash=?').run(Math.floor(Date.now()/1000),await digest('OFFLINE-SESSION-A'));
+const reopened=await (await call({action:'reopen',reportId:released.reportId},sessionA2)).json();assert.equal(reopened.ok,true);assert.equal(reopened.proof.sharedDeliveryAuthorityEligible,false);
+assert.equal((await (await call({action:'account-isolation',reportId:released.reportId},sessionA2)).json()).code,'SHARED_E2E_SECOND_ACCOUNT_REQUIRED');
+const isolated=await (await call({action:'account-isolation',reportId:released.reportId},sessionB,'LOCAL-CPA-B')).json();assert.equal(isolated.ok,true);assert.equal(isolated.proof.sharedDeliveryAuthorityEligible,false);
+assert.equal((await (await call({action:'finalize',reportId:released.reportId},sessionA2)).json()).code,'SHARED_E2E_ALL_TARGET_METHOD_DELTAS_REQUIRED');
+objects.set('qa/shared-report-e2e/v2/method-deltas.json',JSON.stringify({schemaVersion:'METHOD_DELIVERY_WAVE_PRIVATE_ADMISSION_V1',methods:['ZWR','AST','NUM','PROFILE','ECR','HD','FINANCIAL','WILL','CROSS'].map(methodCode=>({methodCode,status:'PASS',profileResolved:true,deployedProofDigest:'SYNTHETIC_LOCAL_ONLY'}))}));
+assert.equal((await (await call({action:'finalize',reportId:released.reportId},sessionA2)).json()).code,'SHARED_E2E_REQUIRED_LIVE_PHASES_INCOMPLETE');
+assert.equal(JSON.parse(objects.get(proofPath)).sharedDeliveryAuthorityEligible,false);
+assert.equal((await stabilityApi({env:proofEnv,request:new Request(origin+'/api/shared-report-renderer-stability',{method:'POST',headers:{origin}})})).status,401);
+assert.equal((await stabilityApi({env:proofEnv,request:new Request(origin+'/api/shared-report-renderer-stability',{method:'POST',headers:{origin,cookie:'__Host-phios-session='+sessionA2}})})).status,403);
+assert.equal(renderCalls,1);assert.equal(fakeTransportCalls,5);
+const revoked=await saveCanonicalPerson(a,{action:'revoke',personId:p.personId,expectedVersion:p.version});
+await assert.rejects(()=>openAccountZiweiMaterial(releaseContext,released.reportId));
+await assert.rejects(()=>fixtureGenerator(fixtureContext,selection));assert.equal(fakeTransportCalls,5);
+assert.equal((await (await call({action:'open-released',reportId:released.reportId},sessionA2)).json()).ok,false);
+// A durable failed claim cannot initiate a second paid attempt automatically.
+let failedProductions=0;
+const failed=()=>cachedMethodDelivery(env,{ownerAccountId:'LOCAL-CPA-A',kind:'SEMANTIC',key:'FAILED-CLAIM',produce:async()=>{failedProductions++;throw Error('SYNTHETIC_FAILURE');}});
+await assert.rejects(failed);await assert.rejects(failed,/METHOD_CACHE_RECONCILIATION_REQUIRED/);assert.equal(failedProductions,1);
+// Separate database facades emulate two isolates: only one durable claim wins.
+let isolateProductions=0;const alternateEnv={...env,RUNTIME_DB:{...db}};
+const race=cacheEnv=>cachedMethodDelivery(cacheEnv,{ownerAccountId:'LOCAL-CPA-A',kind:'SEMANTIC',key:'CROSS-ISOLATE-CLAIM',produce:async()=>{isolateProductions++;await Promise.resolve();return {generationIdentity:'ONE'};}});
+const raceResults=await Promise.allSettled([race(env),race(alternateEnv)]);assert.equal(isolateProductions,1);assert.equal(raceResults.filter(x=>x.status==='fulfilled').length,1);assert.equal(raceResults.find(x=>x.status==='rejected').reason.code,'METHOD_GENERATION_IN_PROGRESS');assert.equal((await race(alternateEnv)).value.generationIdentity,'ONE');assert.equal(isolateProductions,1);
+sqlite.close();
+console.log(JSON.stringify({scope:'LOCAL_SQL_AND_SYNTHETIC_TRANSPORT_ONLY',status:'PASS',providerCalls:0,newProviderCost:0,fakeTransportCalls,cacheProductions,semanticDedup:'SEQUENTIAL_AND_CONCURRENT_PASS',publicationCache:'PASS',openReleasedDoesNotProveGeneration:true,proofTamperDenied:true,rendererCalls:renderCalls,localGeneratedPageCount:contract.expectedPageCount,immutableVfrSnapshot:true,manuscriptParagraphCoverage:true,reopenGenerationCalls:0,reopenRendererCalls:0,accountIsolation:'LOCAL_PASS',deployedBrowserProof:false},null,2));
diff --git a/scripts/check-shared-report-e2e-final.mjs b/scripts/check-shared-report-e2e-final.mjs
new file mode 100644
index 00000000..c9459fcf
--- /dev/null
+++ b/scripts/check-shared-report-e2e-final.mjs
@@ -0,0 +1,12 @@
+import fs from 'node:fs';
+import assert from 'node:assert/strict';
+const registry=JSON.parse(fs.readFileSync('content/reports/method-report-delivery-delta-registry-v1.json'));
+assert(registry.methods.every(x=>x.status==='PASS'),'ALL_TARGET_METHOD_DELIVERY_DELTAS_REQUIRED');
+const path='docs/reports/SHARED-REPORT-E2E-REFERENCE-v2.json';
+assert(fs.existsSync(path),'REAL_SHARED_LIVE_PROOF_REQUIRED_NO_SYNTHETIC_FINAL_RECEIPT');
+const receipt=JSON.parse(fs.readFileSync(path));
+assert.equal(receipt.finalSharedAuthorityState,'PASS');
+for(const field of ['generationReleaseProven','releasedMaterialProven','reopenProven','logoutVerified','sharedDeliveryAuthorityEligible','rendererStabilityPass','actualAccountGenerateReleasePass','libraryPass','differentSessionReopenPass','sameImmutableSnapshot','sameImmutableRenderedMaterial','noProviderRegenerationOnReopen','noRendererRegenerationOnReopen','secondAccountIsolationPass'])assert.equal(receipt[field],true,field);
+const global=JSON.parse(fs.readFileSync('docs/reports/delivery-r4/GLOBAL-REPOSITORY-CHECK-R4.json'));
+assert.equal(global.status,'PASS');
+console.log('PASS shared final live E2E admission with all target deltas and global regression.');
'@
$afterHashes=ConvertFrom-Json @'
{
  "SHARED-REPORT-E2E-VFR-R2-INSTALL.mjs": "87aecafc2e7d99709825b42246b8aeedca0c5a1c24e5dba2a653d325245ed370",
  "config/reports/zero-cost-check-commands.json": "280bed9051c3facfcd5939e3901101a75a7c66930fc3399d65adc9a86fee698e",
  "content/reports/shared-report-delivery-e2e-contract-v2.json": "842c36ee91577448f8436254334a2cdfd7e04e673ecdb03c3b5aad46ed63ea92",
  "functions/account/ziwei-account-delivery.js": "1ae6c8446e7c61e9faf086a526dc70e859372cd77e30cc9fe9484333fb632acd",
  "functions/account/ziwei-controlled-report-material.js": "494958d6505423a8a1d318ac2e7082248c86963f9715a3d3ffcfcd91ab13b331",
  "functions/api/shared-report-e2e-proof.js": "08b07bedc7a751b2edbda9371f387e1309e5ac354158e38a26b2ca57c1502852",
  "functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js": "5a62468cbdee6cdd81ca5f8b5577d02c3a721f9b09699b3b4c7d46f8e1cc8116",
  "functions/report-delivery/shared-report-e2e-v2.js": null,
  "functions/report-delivery/ziwei-vfr-r1-generation.js": "7f2f16ff31d17450f2daabe73a794364c3c61511f527403294646aae209ec0d4",
  "package.json": "e07392e30d1e64e6174036b20abf547ffec4e4029e9054b026792e7f2f4eef11",
  "scripts/build-zwr-vfr-human-review.mjs": "6f4568e4f95407bcaf608a3bc18e10cdea51c8799a3a80e334c01833f684d380",
  "scripts/check-shared-report-e2e-readiness.mjs": "b5f6a88df19fbac937ec8a5eab0aa4c021b9975c8de332f5210ee8592a7bd601",
  "scripts/check-vfr-zwr-diagram-visual-enrichment.mjs": "8231d08e66801c7945cc099effd05436d09284981a824eaf325ed34fa9eab0f7",
  "scripts/check-vfr-zwr-production-cutover.mjs": "2dde51e78a446c964147a52ba2753672f11398e5fddd342c8b5efd60d5e9afa4",
  "scripts/check-ziwei-zpa-access.mjs": "147d91fe9db94fb94fd5123c8522680b3997e307f8a32b5d00279c93c19cc34d",
  "workers/method-report-renderer/index.js": "63cf408776fcc47990b3352b28ce08c1a07433a89fae1fdd2a6ea9446cfb2b69",
  "assets/customer-ui/js/personal-products/ziwei-vfr-r1-styles.js": "0e59df6daef64fb85e8ded1f0eb9689bbf10aa739064969d9fad09e320aff149",
  "content/reports/method-publication-profiles-v1.json": "4488372a5adc0bec73240a14199df4e74dde58825ce46ac3e9387031f742b4d3",
  "content/reports/method-report-delivery-delta-registry-v1.json": "46885822aa46b5c6800bfce8dce78b2122b3b698788d135a704d54cca71ae63d",
  "db/migrations/0013_method_delivery_cache.sql": "13598878344efcf7f155c22b237e3494dfb6d8e55f02877dc7d9a0b884883bf0",
  "docs/reports/delivery-r4/ACCEPTED-SOURCE-BASELINE.json": "a22a8f24055c39990af4dd6965c754d921f9a32235095cbf5d5c42bada9474a0",
  "docs/reports/delivery-r4/ASTROLOGY-METHOD-DELIVERY-DELTA-v1.json": "9e0b35283f7b04313e8c38c5061e27255c1c676e7b01cc2514f7a1e82253b4e6",
  "docs/reports/delivery-r4/CROSS-METHOD-DELIVERY-DELTA-v1.json": "94c7a3ea8bf136722e20f5d53a1f72e08a3c1bdad2ed228f9f867325e173ef72",
  "docs/reports/delivery-r4/ECR-METHOD-DELIVERY-DELTA-v1.json": "7a2f0555f67bc7de7b0b0879e7096f6e0a7833bb55313aed006be12fe07469d2",
  "docs/reports/delivery-r4/FINANCIAL-METHOD-DELIVERY-DELTA-v1.json": "f45036115e501ce0baa90ac4ea9b94c38837cc16656b12edb810e667851d3efc",
  "docs/reports/delivery-r4/GLOBAL-REPOSITORY-CHECK-R4.json": "8192ac2cba13741dddb851519abe1d1eddc26db701fa11f8bd1c5c080f4f1e4e",
  "docs/reports/delivery-r4/HUMAN-DESIGN-METHOD-DELIVERY-DELTA-v1.json": "9aa0911cba5e2000f8f2ec21cc0fb7f073ec0d4abab317262268648ce1643bbe",
  "docs/reports/delivery-r4/LOCAL-VERIFICATION-R4.json": "21b33819ed5e03d52e6d010861f871f8479cf741f6722ec07fdbffba4533a1f9",
  "docs/reports/delivery-r4/MAIN-INTEGRATION-REVIEW-R4.json": "d20fe8db57a26a59db289109be6a7d7b8963fd671bdf66766755f99e699b16a5",
  "docs/reports/delivery-r4/METHOD-PUBLICATION-AUDIT-R4.md": "538ec95e0d98f3f33a70eee7c6e0e60f5369fa00aff341a7e33ad727600ff88c",
  "docs/reports/delivery-r4/NEXT-EXECUTION-R4.md": "285519b7b76015457ba4c6ad302e7d34d21861adc28b1a5bdc7ff2c12ac5d258",
  "docs/reports/delivery-r4/NUMEROLOGY-METHOD-DELIVERY-DELTA-v1.json": "75486181035aedbf02cb123886537c1a215fd24a99ffcaa7062c70e3e996dffd",
  "docs/reports/delivery-r4/PRODUCTION-FREEZE-CANDIDATE-R4.json": "1ce6ca4ac32df21c6c610140dfd138ce2e283733d107eb1387304ba1b3258c90",
  "docs/reports/delivery-r4/PROFILE-METHOD-DELIVERY-DELTA-v1.json": "6489129863e8b77e0900af4ff908989e5fe8df2d2821303fb923d4eab7bb4d14",
  "docs/reports/delivery-r4/SHARED-RENDERER-CPU-READINESS-v1.json": "47e592d2aa5acfc4b9ae8ff1ab39fff4997d85359c958cb15e69faa5b54ef974",
  "docs/reports/delivery-r4/WILL-METHOD-DELIVERY-DELTA-v1.json": "fb7375509f56246b744015fa61401fdf824fdd4a76238029bcd4fc8697fe67bc",
  "docs/reports/delivery-r4/WORKTREE-STATUS-R4.json": "074a1ffbb4eafba175782e2665018f4387838e50437c2ac469c81a58281c8f64",
  "docs/reports/delivery-r4/ZERO-COST-GUARD-EVIDENCE-R4.json": "6fdbf6f7558e15880da40326014ded1a736d06fc931351f36dccc4f624c25f97",
  "docs/reports/delivery-r4/ZIWEI-METHOD-DELIVERY-DELTA-v1.json": "8afe0d775040b95eb1ccde57050aa9380f5493fe080042110bf73c2748ec7925",
  "docs/reports/shared-report-e2e-r2/historical-r2-contract-v2.json": "a6df943e849d327a55c16bc2a1130563b0362aae0e1b3514d4175f32d4b58121",
  "docs/reports/shared-report-e2e-r2/historical-r2-proof-runtime.js.txt": "4a085020af59c0786361e84479de49dd5834d032c9b5af332ef7a13286813426",
  "docs/reports/shared-report-e2e-r2/historical-r2-readiness.mjs.txt": "e3e644cecce3130248b4960cd95fc84f92417db7e98fda1711a2ba67b8c69ce0",
  "functions/account/method-report-delivery.js": "c43b8b698982554e9614a84542bc96d99e81fe67d4ed08a04d0cc06e9a6fcf41",
  "functions/account/method-report-material.js": "076050e4ea0614342821ae10d7a6795c0f617250cbe7cbd9597ce463a022a274",
  "functions/api/shared-report-renderer-stability.js": "0f8de1c6ac6936461cef98c1c7554cf67db5f15dcfee809d134dbf8b226d70be",
  "functions/report-delivery/method-delivery-cache.js": "dbdb7f3faa49f7d4db1b40512228a752f2e00c752ccfec90f23471ff278c56c2",
  "functions/report-delivery/method-render-contract.js": "de815be87dc4ac8841404f11c4b0d744c6becca6ca55958727961c370a53e98c",
  "functions/report-delivery/ziwei-vfr-method-profile.js": "b75eb1b5b5dbdeabac673e77ba0cf1112bb9dc728c3f8c5b33c1f145b4ba838a",
  "functions/report-delivery/ziwei-vfr-profile-policy.js": "c49e473b7b4376f77b4b851b4a9a9e20d5a2531bdb2f79917b3f1d4cc2c13aa0",
  "functions/report-delivery/ziwei-vfr-r1-version.js": "6ba1535843b5c9aa74a90b65bacc778c1f0dfd44b372dbfd67a1671cd3903068",
  "scripts/check-method-delivery-delta.mjs": "499ce668088e1a326abc6eb99ef92f375fafebc48b34ab55b53a6f9d73be3d3b",
  "scripts/check-shared-report-delivery-v2-contract.mjs": "bf68d66057a6d357d27c6daaf24d5072c15d308f01f79960d59ae913dd0a3458",
  "scripts/check-shared-report-delivery-v2-runtime.mjs": "ce8bedaf420a0de9cf347186b153cdf7d0fe6d6cef02d37827faada40e715cd1",
  "scripts/check-shared-report-e2e-final.mjs": "9f4a926d7d5cc0636b1e8d705bec4efff768bf8e363c5cfb926578af54193dcc"
}
'@
function Verify-After {
 foreach($property in $afterHashes.PSObject.Properties) {
  $path=Join-Path $Repo $property.Name
  if($null -eq $property.Value) { if(Test-Path -LiteralPath $path){throw "Archived path still present: $($property.Name)"};continue }
  if(!(Test-Path -LiteralPath $path)){throw "Missing patched file: $($property.Name)"}
  if((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $property.Value){
   $normalized=[IO.File]::ReadAllText($path,[Text.Encoding]::UTF8).Replace("`r`n","`n")
   $sha=[Security.Cryptography.SHA256]::Create()
   try{$normalizedHash=([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($normalized)))).Replace('-','').ToLowerInvariant()}finally{$sha.Dispose()}
   if($normalizedHash -ne $property.Value){throw "Patched content differs: $($property.Name)"}
  }
 }
}
if(!(Test-Path -LiteralPath 'package.json')){throw 'Not a full repository'}
if($Action -ne 'Deploy') {
 $temporaryPatch=Join-Path ([IO.Path]::GetTempPath()) ('phios-r4-'+[guid]::NewGuid().ToString()+'.patch')
 try {
  [IO.File]::WriteAllText($temporaryPatch,$patchText+[Environment]::NewLine,[Text.UTF8Encoding]::new($false))
  Run-Checked 'git' @('apply','--check','--whitespace=nowarn',$temporaryPatch)
  if($Action -eq 'Apply') {
   Run-Checked 'git' @('apply','--whitespace=nowarn',$temporaryPatch)
   Verify-After
   Run-Checked 'npm.cmd' @('run','check:shared-report-e2e:readiness-v2')
   Run-Checked 'npm.cmd' @('run','check:cloudflare-function-import-compat')
   Run-Checked 'git' @('diff','--check')
   Write-Host 'APPLIED / LOCAL PASS. No commit, push or deploy.'
  } else { Write-Host 'PATCH PREFLIGHT PASS. No files changed.' }
 } finally { if(Test-Path -LiteralPath $temporaryPatch){Remove-Item -LiteralPath $temporaryPatch} }
 exit 0
}
Verify-After
$configuration=Get-Content -LiteralPath 'wrangler.jsonc' -Raw | ConvertFrom-Json
$preview=$configuration.env.preview
if($preview.vars.PHIOS_ENVIRONMENT -ne 'qa' -or $preview.d1_databases[0].database_name -ne 'phios-runtime-sandbox' -or $preview.d1_databases[0].database_id -ne 'c2c6e313-9bc8-4fd4-89b1-36f3d764dad8'){throw 'QA sandbox target mismatch'}
$renderer=Get-Content -LiteralPath 'workers/method-report-renderer/wrangler.jsonc' -Raw | ConvertFrom-Json
if($renderer.name -ne 'phios-method-report-renderer-qa' -or $renderer.vars.PHIOS_ENVIRONMENT -ne 'qa' -or $renderer.workers_dev -ne $false){throw 'Private QA renderer target mismatch'}
Run-Checked 'npx.cmd' @('--no-install','wrangler','whoami')
Run-Checked 'npm.cmd' @('run','check:shared-report-e2e:readiness-v2')
Run-Checked 'npm.cmd' @('run','check:cloudflare-function-import-compat')
Run-Checked 'npm.cmd' @('run','build:pages')
Run-Checked 'npx.cmd' @('--no-install','wrangler','deploy','--config','workers/method-report-renderer/wrangler.jsonc','--dry-run')
# Read-only schema inspection precedes the additive migration. No default prod DB.
Run-Checked 'npx.cmd' @('--no-install','wrangler','d1','execute','RUNTIME_DB','--env','preview','--remote','--command',"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('account_person_versions','account_method_report_materials','method_delivery_cache');")
Run-Checked 'npx.cmd' @('--no-install','wrangler','d1','execute','RUNTIME_DB','--env','preview','--remote','--file','db/migrations/0013_method_delivery_cache.sql')
Run-Checked 'npx.cmd' @('--no-install','wrangler','deploy','--config','workers/method-report-renderer/wrangler.jsonc')
Run-Checked 'npx.cmd' @('--no-install','wrangler','pages','deploy','.pages-output','--project-name','phios-github','--branch','qa','--commit-dirty=true')
Write-Host 'QA DEPLOY COMMANDS COMPLETED. Live account proof and production admission remain NOT_RUN/BLOCKED.'
Write-Host 'Return deployment URLs/results. Do not set provider live flags or fabricate native admission receipts.'
