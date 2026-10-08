import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const git=(...a)=>execFileSync('git',a),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const dir='content/product-convergence-r1/audits/';fs.mkdirSync(dir,{recursive:true});
const starting='67254e3d039c842fca0cbd8edc392691ccd2166b';
const owners={
 Profile:['content/profile/current/profile-current-v3.json','content/profile/freeze/profile-production-freeze-index-v1.json'],
 PersonalReality:['content/customer-experience-rebuild/authority/personal-reality-customer-surface-v2.json'],
 Relationship:['content/personal-reading/relationship/audit/relationship-product-completeness-audit-v6.json'],
 Financial:['content/financial/product-activation/acceptance/stage14-financial-runtime-product-acceptance-v1.json'],
 MyReality:['content/customer-experience-rebuild/authority/my-reality-workspace-authority-v1.json'],
 RMO:['content/runtime/reality-model-runtime/freeze/rmo-w0-w14-content-preservation-manifest-v1.json'],
 CurrentEvidence:['content/governance/current-web-authority/contracts/current-evidence-ir-contract-v1.json'],
 BookV:['content/civilization-atlas/maintenance/book-v-civ-atlas-r1-m1-w4c-static-visual-authority-v1.json'],
 BookVI:['content/civilization-atlas/reconfiguration/runtime-position-w8c-current-evidence-ir-v1.json'],
 Moomoo:['content/civilization-atlas/reconfiguration/moomoo-openapi-profile-v1.json','content/civilization-atlas/reconfiguration/moomoo-provider-current-evidence-ir-v1.json'],
 Ask:['assets/customer-ui/js/surfaces/contextual-ask.js'],
 CX_R31:['scripts/check-cx-r31-phase6.mjs'],
 Account:['functions/account/account-contract.js'],
 Person:['functions/account/canonical-person-store.js']
};
const canonicalAuthorities=Object.fromEntries(Object.entries(owners).map(([k,paths])=>[k,paths.map(path=>{if(!fs.existsSync(path))return {path,present:false};const bytes=fs.readFileSync(path),json=path.endsWith('.json')?JSON.parse(bytes.toString().replace(/^\uFEFF/,'')):null;return {path,present:true,sha256:hash(bytes),declaredStatus:json?.status||null,schemaVersion:json?.schemaVersion||null};})]));
const results=JSON.parse(fs.readFileSync(dir+'regression/results.json'));
const required=['check:cx-r31','check:profile','check:relationship:w0-w8','check:financial-runtime-product','check:rmo','check:runtime-position-48'];
const gates=required.map(key=>results.find(r=>r.key===key)||{key,status:'NOT_RUN'});
const affected=['functions/professional/financial/financial-calculation-layer.js','content/registry/public-assets.json','assets/js/pages/civilization-atlas/reconfiguration-renderer.js'];
const knownConflicts=affected.map(path=>({path,startingHeadSha256:hash(git('show',starting+':'+path)),currentSha256:hash(fs.readFileSync(path)),changedDuringThisTask:hash(git('show',starting+':'+path))!==hash(fs.readFileSync(path))}));
const routes=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/authority/canonical-customer-route-registry-v5.json'));
const audit={work:'PHI-OS-PRODUCT-CONVERGENCE-R1',phase:'PC-W0',baselineCommit:git('rev-parse','HEAD').toString().trim(),startingHead:starting,requestedBaselineCommit:'81e4155f4817e613cd791f1c964388bb5e241bd6',canonicalAuthorities,
 activeSuccessors:['content/profile/successors/personal-evidence-r1/profile-role-successor-v1.json','content/profile/successors/personal-evidence-r1/profile-navigation-successor-v1.json'],
 legacySurfaces:[{path:'/perspectives/profile/',role:'COMPATIBILITY_SECONDARY',retained:true}],customerRoutes:routes.routes.map(r=>({id:r.routeId,path:r.canonicalPath,role:r.navigationRole})),runtimeOwners:Object.fromEntries(Object.entries(owners).map(([k,p])=>[k,p])),
 pendingHumanGates:['PRD-W11R5 dossier review','PC-R1 PROFILE DEMOTION ACCEPT after W0–W10 machine gates'],pendingCutovers:['PC-W1–W10 pending W0 exit','PC-W11–W99 pending first demotion acceptance','Production deployment not performed'],knownConflicts,machineGates:gates,
 status:gates.every(g=>g.status==='PASS')?'CURRENT_MAIN_RECONCILED':'CURRENT_MAIN_RECONCILIATION_BLOCKED',humanAcceptanceCreated:false,productionFreezeCreated:false};
fs.writeFileSync(dir+'pc-r1-w0-current-main-reconciliation-v1.json',JSON.stringify(audit,null,2));
console.log(audit.status);
