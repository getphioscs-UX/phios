import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const text = path => fs.readFileSync(path,'utf8');
const read = path => JSON.parse(text(path));
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const exists = path => fs.existsSync(path);

const BASELINE = '552f6d973dcaa32aa72f7f1d676ec2bc74434729';
const paths = Object.freeze({
  package: 'package.json',
  baseline: 'content/governance/integrated-successor/authority/current-main-reconciliation-v1.json',
  migration: 'content/governance/integrated-successor/registries/source-master-migration-registry-v1.json',
  contract: 'content/governance/integrated-successor/contracts/phase0-no-silent-overwrite-contract-v1.json',
  master: 'content/governance/integrated-successor/master-work/phi-os-integrated-successor-master-work-v3.0.0.md',
  cmwFreeze: 'content/governance/canonical-master-work/freeze/cmw-w0-w7-canonical-master-work-freeze-v1.json',
  cmwMigration: 'content/governance/canonical-master-work/registries/canonical-master-work-migration-registry-v1.json',
  route: 'content/customer-experience-rebuild/authority/canonical-customer-route-registry-v5.json',
  homeAuthority: 'content/customer-experience-rebuild/authority/homepage-customer-composition-v1.json',
  p1: 'content/customer-experience-rebuild/migration/px2-cx-p1-public-ia-successor-v3.json',
  p1Delete: 'content/customer-experience-rebuild/migration/p1-legacy-delete-plan-v2.json',
  askAcceptance: 'content/customer-experience-rebuild/contextual-ask/acceptance/cx-r9-r2-customer-cutover-acceptance-v1.json',
  kapCxSuccessor: 'content/knowledge/answer-projection/reconciliation/kap-w11-w17-cx-home-presentation-successor-v1.json',
  kapP1Successor: 'content/knowledge/answer-projection/reconciliation/kap-p1-physical-delete-presentation-successor-v1.json',
  kapChecker: 'scripts/check-kap-w11-w17-current.mjs',
  home: 'index.html',
  ask: 'knowledge/ask/index.html',
  ecrRuntime: 'functions/embodied-configuration/ecr-topic-projection-runtime.js',
  ecrBundle: 'functions/embodied-configuration/ecr-topic-deployment-authority.js',
  ecrBuilder: 'scripts/build-ecr-topic-deployment-authority.mjs',
  pprSharedOwner: 'content/professional/personal-reality/current/ppr-current-shared-owner-registry-v1.json',
  pprAssemblySuccessor: 'content/professional/personal-reality/current/reconciliation/ppr-current-product-assembly-ecr-topic-successor-v1.json',
  productAssembly: 'functions/personal-reality-product/product-assembly.js',
  acceptance: 'content/governance/integrated-successor/acceptance/phase0-current-main-reconciliation-acceptance-v1.json',
  freeze: 'content/governance/integrated-successor/freeze/phase0-current-main-reconciliation-freeze-v1.json'
});
for (const path of Object.values(paths)) assert.ok(exists(path), `PHASE0_MISSING:${path}`);

const baseline = read(paths.baseline);
assert.equal(baseline.status,'CURRENT_MAIN_RECONCILED');
assert.equal(baseline.baselineCommit,BASELINE);
assert.equal(baseline.githubVerification.commitSha,BASELINE);
assert.equal(baseline.githubVerification.commitMessage,'fix deployment');
assert.equal(baseline.sourceMirror.alignmentClaim,`USER_DECLARED_ALIGNED_TO_${BASELINE}`);
assert.equal(baseline.phase0Rules.historicalFreezeMutationAllowed,false);
assert.equal(baseline.phase0Rules.runtimeMeaningAuthorityMutationAllowed,false);
assert.equal(baseline.phase0Rules.sourceMasterSilentOverwriteAllowed,false);

const migration = read(paths.migration);
assert.equal(migration.status,'SOURCE_MASTERS_MIGRATED_TO_ONE_CROSS_PROGRAM_SUCCESSOR');
assert.equal(migration.baselineCommit,BASELINE);
assert.equal(migration.sourceMasters.length,3);
assert.equal(migration.integratedMaster.path,paths.master);
assert.equal(sha256(paths.master),migration.integratedMaster.sha256);
for (const source of migration.sourceMasters) {
  assert.ok(exists(source.snapshotPath),`SOURCE_MASTER_SNAPSHOT_MISSING:${source.sourceMasterId}`);
  assert.equal(sha256(source.snapshotPath),source.sha256,`SOURCE_MASTER_SNAPSHOT_DRIFT:${source.sourceMasterId}`);
}
const resolutionIds = migration.conflictResolutions.map(item=>item.id).sort();
assert.deepEqual(resolutionIds,['CR-1','CR-2','CR-3','CR-4','CR-5','CR-6']);
for (const required of ['CX-R9-R2','KIR-R2-W0','KIR-R2-W16','PAI-R1-W0','PAI-R1-W10','CX-R31-W2','ZV-R3-W8','PVP-R1-VIS-W0','PVP-R1-VIS-W37','BOOK-IV-KNOWLEDGE-ADMISSION']) {
  assert.ok(migration.workMigration.some(item=>item.sourceWork===required),`SOURCE_WORK_MIGRATION_MISSING:${required}`);
}
assert.equal(migration.rules.historicalEvidenceRewritten,false);
assert.equal(migration.rules.oneCrossProgramOrder,true);
assert.equal(migration.rules.canonicalCMWv1FreezeMutated,false);

const contract = read(paths.contract);
assert.equal(contract.status,'ACTIVE');
assert.equal(contract.baselineCommit,BASELINE);
assert.equal(sha256(paths.cmwFreeze),contract.upstreamCanonicalMasterWork.freezeSha256,'CMW_FREEZE_DRIFT');
assert.equal(sha256(paths.cmwMigration),contract.upstreamCanonicalMasterWork.migrationRegistrySha256,'CMW_MIGRATION_REGISTRY_DRIFT');
assert.equal(contract.upstreamCanonicalMasterWork.mutatedByIntegratedPhase0,false);
assert.equal(contract.rules.historicalFreezeRewriteForbidden,true);
assert.equal(contract.rules.presentationCheckerDriftMustNotRestoreRetiredPresentation,true);

const route = read(paths.route);
assert.equal(route.status,baseline.currentCustomerAuthority.routeRegistryStatus);
const askRoute = route.routes.find(item=>item.routeId==='ASK');
assert.ok(askRoute,'CURRENT_ASK_ROUTE_MISSING');
assert.equal(askRoute.canonicalPath,'/knowledge/ask/');
assert.equal(askRoute.productionBrowserAccepted,true);
assert.equal(askRoute.physicalLegacyPresentationDeleted,true);
const homeRoute = route.routes.find(item=>item.routeId==='HOME');
assert.ok(homeRoute,'CURRENT_HOME_ROUTE_MISSING');
assert.equal(homeRoute.canonicalPath,'/');

const homeAuthority = read(paths.homeAuthority);
assert.equal(homeAuthority.status,baseline.currentCustomerAuthority.homepageStatus);
const home = text(paths.home);
for (const marker of ['data-cx-surface="HOME"','data-cx-home-section="H01"','data-cx-home-section="H09"','/assets/customer-ui/js/shell.js','/assets/customer-ui/js/surfaces/home.js','href="/knowledge/ask/"']) assert.ok(home.includes(marker),`CURRENT_HOME_MARKER_MISSING:${marker}`);
for (const retired of ['data-cir-root','/assets/js/client-intent-router.js','href="/ask"','href="/personal-runtime"','href="/financial-reality"','href="/my-reality"']) assert.ok(!home.includes(retired),`RETIRED_HOME_PRESENTATION_RESTORED:${retired}`);

const p1 = read(paths.p1);
assert.equal(p1.status,baseline.currentCustomerAuthority.p1CurrentStatus);
const p1Delete = read(paths.p1Delete);
assert.equal(p1Delete.status,baseline.currentCustomerAuthority.p1LegacyDeleteStatus);
assert.equal(p1Delete.physicalDeleteCount,7);
assert.equal(p1Delete.backendDeleteCount,0);
assert.equal(p1Delete.authorityDeleteCount,0);
const askAcceptance = read(paths.askAcceptance);
assert.equal(askAcceptance.status,baseline.currentCustomerAuthority.contextualAskStatus);
assert.equal(askAcceptance.customerCutoverAccepted,true);

const ask = text(paths.ask);
for (const marker of ['data-cx-surface="CONTEXTUAL_ASK"','data-cx-contextual-ask-form','/assets/customer-ui/js/surfaces/contextual-ask.js']) assert.ok(ask.includes(marker),`CURRENT_ASK_MARKER_MISSING:${marker}`);
const kapCx = read(paths.kapCxSuccessor);
assert.equal(kapCx.status,'ACTIVE_KAP_CX_HOME_PRESENTATION_SUCCESSOR_P1_AUTHORITY_PRESERVED');
assert.equal(kapCx.baselineCommit,BASELINE);
for (const boundary of Object.values(kapCx.authorityBoundary)) assert.equal(boundary,false,'KAP_CX_SUCCESSOR_AUTHORITY_BOUNDARY_DRIFT');
const kapP1 = read(paths.kapP1Successor);
assert.equal(kapP1.status,'ACTIVE_KAP_RUNTIME_PRESERVED_CONTEXTUAL_ASK_PRESENTATION_CURRENT');
const kapChecker = text(paths.kapChecker);
assert.ok(kapChecker.includes('kap-w11-w17-cx-home-presentation-successor-v1.json'),'KAP_CURRENT_CHECKER_NOT_BOUND_TO_CX_SUCCESSOR');
assert.ok(!kapChecker.includes('assert.match(homepage, /data-cir-root/)'),'KAP_CURRENT_CHECKER_STILL_REQUIRES_RETIRED_CIR_HOME');

const ecrRuntime = text(paths.ecrRuntime);
assert.ok(ecrRuntime.includes("from './ecr-topic-deployment-authority.js'"),'ECR_CLOUDFLARE_DEPLOYMENT_BUNDLE_NOT_CONSUMED');
for (const forbidden of ["from 'node:fs'","from 'node:path'","from 'node:url'",'fileURLToPath(import.meta.url)']) assert.ok(!ecrRuntime.includes(forbidden),`ECR_WORKER_UNSAFE_RUNTIME_IMPORT:${forbidden}`);
const ecrBundle = text(paths.ecrBundle);
assert.ok(ecrBundle.includes('ECR_TOPIC_DEPLOYMENT_AUTHORITY_META'),'ECR_DEPLOYMENT_BUNDLE_META_MISSING');
assert.ok(text(paths.ecrBuilder).includes("runtimeTarget:'CLOUDFLARE_PAGES_FUNCTIONS'"),'ECR_DEPLOYMENT_BUILDER_TARGET_DRIFT');


const pprOwner = read(paths.pprSharedOwner);
const pprAssemblySuccessor = read(paths.pprAssemblySuccessor);
const assemblyOwner = pprOwner.files[paths.productAssembly];
assert.ok(assemblyOwner,'PHASE0_PPR_PRODUCT_ASSEMBLY_SHARED_OWNER_MISSING');
assert.equal(assemblyOwner.currentSha256,sha256(paths.productAssembly));
assert.ok(assemblyOwner.recognizedPredecessors.includes('2664b4ff349b58b631896de25ef5b8cc336d22e49dba9c9d9b548074802b9df2'));
assert.equal(pprAssemblySuccessor.status,'CURRENT_SHARED_OWNER_RECONCILED_ECR_TOPIC_PRODUCTION_WIRING');
assert.equal(pprAssemblySuccessor.baselineCommit,BASELINE);
assert.equal(pprAssemblySuccessor.currentSha256,sha256(paths.productAssembly));
assert.equal(pprAssemblySuccessor.sourceAuthority.status,'PRODUCTION_ADMITTED');
assert.equal(pprAssemblySuccessor.sourceAuthority.defaultAccessState,'FREE_PREVIEW');
assert.equal(pprAssemblySuccessor.sourceAuthority.paidAccessRequiresExplicitEntitlement,true);
for (const boundary of Object.values(pprAssemblySuccessor.boundaries)) assert.equal(boundary,false,'PPR_PRODUCT_ASSEMBLY_SUCCESSOR_BOUNDARY_DRIFT');
const productAssembly = text(paths.productAssembly);
for (const marker of pprAssemblySuccessor.requiredCurrentMarkers) assert.ok(productAssembly.includes(marker),`PPR_PRODUCT_ASSEMBLY_CURRENT_MARKER_MISSING:${marker}`);
assert.ok(!productAssembly.includes("accessState:'PAID'"),'PPR_PRODUCT_ASSEMBLY_MUST_NOT_DEFAULT_TO_PAID');


const acceptance = read(paths.acceptance);
assert.equal(acceptance.status,'PHASE0_ACCEPTED_WITH_ARCHIVE_ENVIRONMENT_LIMITATIONS');
assert.equal(acceptance.baselineCommit,BASELINE);
assert.equal(acceptance.sourceMasterMigration.sourceMasterCount,3);
assert.equal(acceptance.fullNpmCheck.claimedPass,false);
assert.equal(acceptance.fullNpmCheck.realGitCheckoutRequiredForFinalTopLevelCheck,true);
assert.equal(acceptance.fullNpmCheck.archiveEnvironmentOnlyLimitations.length,2);
assert.equal(acceptance.boundaries.fullNpmCheckPassFabricated,false);
assert.ok(acceptance.exit.includes('READY_FOR_INTEGRATED_PHASE1'));

const freeze = read(paths.freeze);
assert.equal(freeze.status,'PHASE0_FROZEN');
assert.equal(freeze.baselineCommit,BASELINE);
assert.equal(freeze.acceptanceRef,paths.acceptance);
for (const [path,digest] of Object.entries(freeze.artifactDigests)) {
  assert.ok(exists(path),`PHASE0_FROZEN_ARTIFACT_MISSING:${path}`);
  assert.equal(sha256(path),digest,`PHASE0_FROZEN_ARTIFACT_DRIFT:${path}`);
}
for (const boundary of Object.values(freeze.boundaries)) assert.equal(boundary,false,'PHASE0_FREEZE_BOUNDARY_DRIFT');

const pkg = read(paths.package);
assert.equal(pkg.scripts['check:integrated-phase0'],'node scripts/check-integrated-successor-phase0.mjs');
assert.ok(pkg.scripts.check.includes('npm run check:integrated-phase0'),'FULL_CHECK_MISSING_INTEGRATED_PHASE0');
assert.equal(pkg.scripts['check:kap-answer'],'node scripts/check-kap-w11-w17-current.mjs');

console.log('✓ Integrated Successor PHASE 0 passed.');
console.log(`  Current main ${BASELINE} is reconciled; three source masters are byte-preserved and migrated under one cross-program successor order.`);
console.log('  Current CX/P1/KAP presentation authority is honored without restoring retired Stage16/CIR DOM; ECR topic runtime remains Cloudflare-safe.');
console.log('  PHASE 0 acceptance/freeze is active; archive-only .git/AJV limits are recorded without weakening production checkers or fabricating a full npm-check PASS.');
