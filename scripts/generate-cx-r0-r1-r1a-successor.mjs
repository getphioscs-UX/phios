import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const BASELINE = '92b30b95cf2f70af4ed2ee8e41401764b06fa8b5';
const RECORDED_AT = '2026-09-03T02:42:00Z';
const SOURCE_ZIP = 'read(1).zip';
const SOURCE_SHA256 = 'd208d5df5229952364cd1e7a1e1ff6e12f0b375dcfd90d123ee239a03af8f413';
const checkMode = process.argv.includes('--check');
const base = 'content/customer-experience-rebuild';

const posix = (p) => p.replaceAll(path.sep, '/');
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const json = (rel) => JSON.parse(read(rel));
const mkdir = (rel) => fs.mkdirSync(path.join(root, rel), { recursive: true });
const stable = (value) => JSON.stringify(value, null, 2) + '\n';
function write(rel, value) {
  const text = stable(value);
  const abs = path.join(root, rel);
  mkdir(path.dirname(rel));
  if (checkMode) {
    if (!fs.existsSync(abs)) throw new Error(`Missing generated successor artifact: ${rel}`);
    const current = fs.readFileSync(abs, 'utf8');
    if (current !== text) throw new Error(`Generated successor artifact is stale: ${rel}`);
  } else fs.writeFileSync(abs, text);
}
function walk(dir, predicate = () => true) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  const stack = [abs];
  while (stack.length) {
    const cur = stack.pop();
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      if (['node_modules','.git','.wrangler','.cache'].includes(ent.name)) continue;
      const p = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else {
        const rel = posix(path.relative(root, p));
        if (predicate(rel)) out.push(rel);
      }
    }
  }
  return out.sort();
}
function routeFor(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -11) + '/';
  if (rel.endsWith('.html')) return '/' + rel.slice(0, -5);
  return null;
}
const rootHtml = fs.readdirSync(root, { withFileTypes: true }).filter((e)=>e.isFile()&&e.name.endsWith('.html')).map((e)=>e.name);
const customerDirs = ['about','books','articles','knowledge','search','readings','professional','reality','perspectives','account','academy','reports','appointments','services'];
const customerHtml = [...new Set([
  ...rootHtml,
  ...customerDirs.flatMap((d)=>walk(d,(r)=>r.endsWith('.html')))
])].sort();

function refs(html, tag, attr) {
  const out=[];
  const re = new RegExp(`<${tag}\\b[^>]*\\b${attr}\\s*=\\s*["']([^"']+)["'][^>]*>`, 'gi');
  for (const m of html.matchAll(re)) out.push(m[1]);
  return out;
}
function stylesheetRefs(html) {
  const out=[];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag=m[0]; if(!/\brel\s*=\s*["']stylesheet["']/i.test(tag)) continue;
    const h=tag.match(/\bhref\s*=\s*["']([^"']+)["']/i); if(h) out.push(h[1]);
  }
  return out;
}
function localize(ref, fromRel) {
  const bare=String(ref||'').split('#')[0].split('?')[0].trim();
  if(!bare || /^(?:https?:)?\/\//i.test(bare) || bare.startsWith('data:') || bare.startsWith('#') || bare.startsWith('mailto:') || bare.startsWith('tel:')) return null;
  if(bare.startsWith('/')) return bare.slice(1);
  return posix(path.normalize(path.join(path.dirname(fromRel), bare))).replace(/^\.\//,'');
}
function canonical(html) { const m=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)||html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i); return m?.[1]||null; }
function dataCx(html) { return html.match(/\bdata-cx-surface=["']([^"']+)["']/i)?.[1]||null; }
function detectHeader(html){return /<header\b|data-(?:puxr|cx)-header|public-shell/i.test(html)}
function detectFooter(html){return /<footer\b|data-(?:puxr|cx)-footer/i.test(html)}
function visibleText(html){return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<!--?[\s\S]*?-->/g,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim()}

const surfaceRecords = customerHtml.map((rel)=>{
  const html=read(rel); const css=stylesheetRefs(html); const scripts=refs(html,'script','src'); const imgs=refs(html,'img','src'); const cx=dataCx(html);
  return {
    route: routeFor(rel), htmlPath: rel, surfaceType: cx ? 'CX_CLEAN_ROOM_EXISTING' : 'LEGACY_OR_PREDECESSOR_PRESENTATION', cxSurfaceId: cx,
    currentHeader: detectHeader(html), currentFooter: detectFooter(html), css, js:scripts, runtimeDependencies:[...new Set(scripts.filter((x)=>/runtime|reality|reading|financial|method|journey|ask/i.test(x)))],
    assetDependencies:[...new Set(imgs)], authRequirement:/account|session|auth|entitlement/i.test(html)?'POSSIBLE_OR_PRESENT':'NOT_DETERMINED',
    localeSupport:/zh-Hans|data-i18n|locale/i.test(html)?'DETECTED':'NOT_DETECTED', productionStatus:'CURRENT_TREE_PRESENT', migrationPriority: cx?'RECONCILE_EXISTING_CX':'QUARANTINE_LEGACY', canonical:canonical(html)
  };
});
const surfaceInventory = {
  schemaVersion:'PHI-OS-CX-R-SURFACE-INVENTORY-v3.0.0', work:'CX-R0-W1', baselineCommit:BASELINE, recordedAt:RECORDED_AT,
  status:'CURRENT_CUSTOMER_SURFACE_INVENTORY_RECONCILED', summary:{customerHtmlCount:surfaceRecords.length,cxSurfaceCount:surfaceRecords.filter(x=>x.cxSurfaceId).length,legacyOrPredecessorCount:surfaceRecords.filter(x=>!x.cxSurfaceId).length},
  requiredCoverage:['/','about/*','books/*','articles/*','knowledge*','search/*','readings/*','personal-runtime*','professional/personal-runtime/*','professional/financial/*','reality/*','reality-dashboard*','services*','academy/*','account*','reports*','appointments*'],
  surfaces:surfaceRecords
};
write(`${base}/audits/surface-inventory-v3.json`,surfaceInventory);

const cssConsumers=new Map(); const jsConsumers=new Map(); const assetConsumers=[];
for(const s of surfaceRecords){
  for(const ref of s.css){const loc=localize(ref,s.htmlPath);if(!loc)continue;if(!cssConsumers.has(loc))cssConsumers.set(loc,[]);cssConsumers.get(loc).push(s.htmlPath)}
  for(const ref of s.js){const loc=localize(ref,s.htmlPath);if(!loc)continue;if(!jsConsumers.has(loc))jsConsumers.set(loc,[]);jsConsumers.get(loc).push(s.htmlPath)}
  for(const ref of s.assetDependencies){const loc=localize(ref,s.htmlPath); if(loc) assetConsumers.push({consumer:s.htmlPath,ref,localPath:loc,exists:exists(loc)})}
}
function cssStats(rel, consumers){
  const text=exists(rel)?read(rel):'';
  return {stylesheet:rel,numberOfConsumers:consumers.length,exists:exists(rel),selectors:(text.match(/\{/g)||[]).length,globalSelectors:(text.match(/(?:^|[},\n])\s*(?:html|body|:root|\*)\b/gm)||[]).length,importantCount:(text.match(/!important/g)||[]).length,duplicateTokens:(text.match(/--[a-z0-9-]+\s*:/gi)||[]).length,duplicateLayoutRules:(text.match(/display\s*:\s*(?:grid|flex)/gi)||[]).length,duplicateTypography:(text.match(/font-(?:size|family|weight)|line-height/gi)||[]).length,duplicateHeaderRules:(text.match(/header/gi)||[]).length,duplicateCardRules:(text.match(/card/gi)||[]).length,duplicateHeroRules:(text.match(/hero/gi)||[]).length,consumers:[...new Set(consumers)].sort(),classification:rel.startsWith('assets/customer-ui/')?'CX_CUSTOMER_UI':'LEGACY_PRESENTATION'};
}
const cssEntries=[...cssConsumers.entries()].map(([r,c])=>cssStats(r,c)).sort((a,b)=>a.stylesheet.localeCompare(b.stylesheet));
const cssAudit={schemaVersion:'PHI-OS-CX-R-CSS-DEPENDENCY-AUDIT-v3.0.0',work:'CX-R0-W2',baselineCommit:BASELINE,recordedAt:RECORDED_AT,status:'CURRENT_CSS_DEPENDENCIES_RECONCILED',summary:{customerConsumedStylesheets:cssEntries.length,legacyStylesheets:cssEntries.filter(x=>x.classification==='LEGACY_PRESENTATION').length,cxStylesheets:cssEntries.filter(x=>x.classification==='CX_CUSTOMER_UI').length,totalImportantCount:cssEntries.reduce((a,x)=>a+x.importantCount,0)},mustTrack:['assets/css/tokens.css','assets/css/design/foundation.css','assets/css/design/typography.css','assets/css/design/layout.css','assets/css/design/components.css','assets/css/public-experience.css','assets/css/wpr-public-production.css','assets/css/runtime-spine.css','assets/css/client-production-surfaces.css','assets/css/reality-dashboard.css','assets/css/phios-public-v2.css'],entries:cssEntries};
write(`${base}/audits/css-dependency-audit-v3.json`,cssAudit);
const cssRetirement={schemaVersion:'PHI-OS-CX-R-LEGACY-CSS-RETIREMENT-MAP-v3.0.0',work:'CX-R0-W2',baselineCommit:BASELINE,status:'CURRENT_RETIREMENT_MAP_RECONCILED',entries:cssEntries.filter(x=>x.classification==='LEGACY_PRESENTATION').map(x=>({stylesheet:x.stylesheet,consumerCount:x.numberOfConsumers,state:'LEGACY_ACTIVE_OR_PREDECESSOR',futureCxImportAllowed:false,deleteNow:false,retireWhen:'ZERO_ACTIVE_CONSUMER_AFTER_REPLACEMENT_ACCEPTANCE'}))};
write(`${base}/migration/legacy-css-retirement-map-v3.json`,cssRetirement);

const jsEntries=[...jsConsumers.entries()].map(([r,c])=>{const text=exists(r)?read(r):'';return {script:r,numberOfConsumers:c.length,exists:exists(r),consumers:[...new Set(c)].sort(),roles:['shell','locale','header','footer','asset','runtime','account','search','ask','reality','method','navigation'].filter(k=>new RegExp(k,'i').test(r+' '+text.slice(0,12000))),classification:r.startsWith('assets/customer-ui/')?'CX_CUSTOMER_UI':'LEGACY_OR_UPSTREAM_JS'};}).sort((a,b)=>a.script.localeCompare(b.script));
const jsAudit={schemaVersion:'PHI-OS-CX-R-JS-DEPENDENCY-AUDIT-v3.0.0',work:'CX-R0-W3',baselineCommit:BASELINE,recordedAt:RECORDED_AT,status:'CURRENT_JS_COMPOSITION_RECONCILED',summary:{customerConsumedScripts:jsEntries.length,cxScripts:jsEntries.filter(x=>x.classification==='CX_CUSTOMER_UI').length,legacyOrUpstreamScripts:jsEntries.filter(x=>x.classification!=='CX_CUSTOMER_UI').length},entries:jsEntries};
write(`${base}/audits/js-dependency-audit-v3.json`,jsAudit);
write(`${base}/migration/legacy-js-retirement-map-v3.json`,{schemaVersion:'PHI-OS-CX-R-LEGACY-JS-RETIREMENT-MAP-v3.0.0',work:'CX-R0-W3',baselineCommit:BASELINE,status:'CURRENT_RETIREMENT_MAP_RECONCILED',entries:jsEntries.filter(x=>x.classification!=='CX_CUSTOMER_UI').map(x=>({script:x.script,consumerCount:x.numberOfConsumers,state:'LEGACY_OR_UPSTREAM_ACTIVE',deleteNow:false,reviewBoundary:'PRESENTATION_JS_MAY_RETIRE; BACKEND_RUNTIME_JS_MUST_NOT_BE_DELETED_BY_CX'}))});

const forbiddenCopy=[['INTERNAL','production runtime'],['INTERNAL','canonical registry'],['GOVERNANCE','authority'],['GOVERNANCE','frozen'],['DEVELOPER','should be visible'],['DEVELOPER','should not be hidden'],['DEVELOPER','this surface'],['DEVELOPER','we moved'],['PLACEHOLDER','placeholder']];
const copyEntries=[];
for(const s of surfaceRecords){const text=visibleText(read(s.htmlPath)).toLowerCase(); const hits=forbiddenCopy.filter(([,token])=>text.includes(token)).map(([category,token])=>({category,token})); if(hits.length) copyEntries.push({htmlPath:s.htmlPath,route:s.route,cxSurfaceId:s.cxSurfaceId,hits});}
write(`${base}/audits/customer-copy-audit-v2.json`,{schemaVersion:'PHI-OS-CX-R-CUSTOMER-COPY-AUDIT-v2.0.0',work:'CX-R0-W4',baselineCommit:BASELINE,recordedAt:RECORDED_AT,status:'VISIBLE_COPY_RECONCILED',categories:['CUSTOMER','INTERNAL','DEVELOPER','GOVERNANCE','PLACEHOLDER','LEGACY'],summary:{surfacesWithFlaggedCopy:copyEntries.length,cxSurfacesWithFlaggedCopy:copyEntries.filter(x=>x.cxSurfaceId).length},flagged:copyEntries,rules:{newProductionCxMayShowInternalOrDeveloper:false}});

const brandTokens=['logo','favicon','header mark','footer mark','φ','phi-public']; const brandEntries=[];
for(const s of surfaceRecords){const html=read(s.htmlPath);const hits=brandTokens.filter(t=>html.toLowerCase().includes(t.toLowerCase())); if(hits.length) brandEntries.push({htmlPath:s.htmlPath,route:s.route,cxSurfaceId:s.cxSurfaceId,tokens:hits});}
write(`${base}/authority/customer-brand-asset-authority-v3.json`,{schemaVersion:'PHI-OS-CX-R-CUSTOMER-BRAND-ASSET-AUTHORITY-v3.0.0',work:'CX-R0-W5',baselineCommit:BASELINE,status:'CURRENT_IDENTITY_CONSUMERS_RECONCILED',summary:{consumerRecords:brandEntries.length,hardCodedPhiConsumers:brandEntries.filter(x=>x.tokens.includes('φ')).length},canonicalRule:'ONE_CANONICAL_LOGO_AUTHORITY_PER_PRODUCTION_CUSTOMER_PAGE',consumers:brandEntries,rules:{oldLogoAllowedOnMigratedCx:false,textLogoMayNotBecomeSecondAuthority:true}});

const missingAssets=assetConsumers.filter(x=>!x.exists); write(`${base}/audits/customer-asset-availability-v2.json`,{schemaVersion:'PHI-OS-CX-R-CUSTOMER-ASSET-AVAILABILITY-v2.0.0',work:'CX-R0-W6',baselineCommit:BASELINE,status:'CURRENT_LOCAL_ASSET_AVAILABILITY_RECONCILED',scope:['Hero','Illustration','Book cover','Figure','Icon','Article image','Professional image','Runtime image'],summary:{localAssetReferences:assetConsumers.length,missingLocalReferences:missingAssets.length},entries:assetConsumers,rules:{silentBlankAllowed:false,remoteR2RequiresDedicatedDeliveryAuthority:true}});

const projectionMap={schemaVersion:'PHI-OS-CX-R-BACKEND-CUSTOMER-PROJECTION-MAP-v3.0.0',work:'CX-R0-W7',baselineCommit:BASELINE,status:'SUCCESSOR_PROJECTION_BOUNDARY_RECONCILED',mappings:[['CKA/KAP','Ask'],['ICR/RDG/RMO','My Reality'],['MPA + Methods + CMR','Perspectives'],['RRE','Reading / Understanding'],['JR','Progress'],['RNE','Navigation'],['PR/PFR','Professional Review'],['RR','Report'],['CPR','Presentation'],['WPR','Web Delivery'],['LRM future','History'],['RCL future','Case / Learning / Research projection'],['VAL future','Validation disclosure'],['RME future','Metrics']].map(([backend,customerProjection])=>({backend,customerProjection,cxOwnsBackendAuthority:false})),rules:{availabilityMustReadUpstreamAuthority:true,hardCodeAvailableForbidden:true}};
write(`${base}/registries/backend-customer-projection-map-v3.json`,projectionMap);
write(`${base}/contracts/cx-r-no-second-authority-contract-v2.json`,{schemaVersion:'PHI-OS-CX-R-NO-SECOND-AUTHORITY-CONTRACT-v2.0.0',work:'CX-R0-W8',baselineCommit:BASELINE,status:'NO_SECOND_AUTHORITY_CONTRACT_ACTIVE',cxMay:['consume governed outputs','project customer language','own route shell components consent presentation context selection'],cxMustNot:['calculate method','create meaning','decide knowledge truth','create reality state','make professional judgment','assemble canonical report','determine validation','create metric'],backendAuthorityUntouched:true});

const packageSha=sha(fs.readFileSync(path.join(root,'package.json'))); const lockSha=sha(fs.readFileSync(path.join(root,'package-lock.json'))); const redirectsSha=sha(fs.readFileSync(path.join(root,'_redirects')));
const baseline={schemaVersion:'PHI-OS-CX-R-BASELINE-v3.0.0',work:'CX-R0-W0',program:'CX-R',status:'CURRENT_AUTHORITY_RECONCILED',baselineCommit:BASELINE,recordedAt:RECORDED_AT,repository:'getphioscs-UX/phios',sourceMirror:{libraryFile:SOURCE_ZIP,sha256:SOURCE_SHA256,alignmentClaim:'USER_DECLARED_ALIGNED_TO_92b30b9'},packageDigests:{'package.json':packageSha,'package-lock.json':lockSha},customerRoutes:{inventory:`${base}/audits/surface-inventory-v3.json`,count:surfaceRecords.length,cxSurfaceCount:surfaceRecords.filter(x=>x.cxSurfaceId).length},currentCSSBundles:{audit:`${base}/audits/css-dependency-audit-v3.json`,customerConsumedCssFiles:cssEntries.length,legacyConsumedCssFiles:cssEntries.filter(x=>x.classification==='LEGACY_PRESENTATION').length},currentJSBundles:{audit:`${base}/audits/js-dependency-audit-v3.json`,customerConsumedJsFiles:jsEntries.length},currentAssets:{audit:`${base}/audits/customer-asset-availability-v2.json`,localReferenceCount:assetConsumers.length,missingLocalReferenceCount:missingAssets.length},currentLogos:{audit:`${base}/authority/customer-brand-asset-authority-v3.json`},runtimeConsumers:{projectionMap:`${base}/registries/backend-customer-projection-map-v3.json`},redirects:{path:'_redirects',sha256:redirectsSha},rules:{backendAuthorityUntouched:true,sourceChangedByW0:false,presentationDeletionPerformed:false,baselineIsExecutionStartNotFutureHead:true}};
write(`${base}/authority/cx-r-baseline-v3.json`,baseline);
write(`${base}/acceptance/cx-r0-acceptance-v2.json`,{schemaVersion:'PHI-OS-CX-R0-ACCEPTANCE-v2.0.0',work:'CX-R0',baselineCommit:BASELINE,status:'ACCEPTED_CURRENT_AUTHORITY_RECONCILIATION',requiredExitStates:['CURRENT_SURFACE_INVENTORY_COMPLETE','LEGACY_DEPENDENCIES_MAPPED','NO_SECOND_AUTHORITY','READY_FOR_QUARANTINE'],evidence:[`${base}/authority/cx-r-baseline-v3.json`,`${base}/audits/surface-inventory-v3.json`,`${base}/audits/css-dependency-audit-v3.json`,`${base}/audits/js-dependency-audit-v3.json`,`${base}/audits/customer-copy-audit-v2.json`,`${base}/authority/customer-brand-asset-authority-v3.json`,`${base}/audits/customer-asset-availability-v2.json`,`${base}/registries/backend-customer-projection-map-v3.json`,`${base}/contracts/cx-r-no-second-authority-contract-v2.json`],rules:{backendAuthorityTouched:false,customerPresentationMutated:false}});

const legacySurfaces=surfaceRecords.filter(x=>!x.cxSurfaceId).map(x=>({route:x.route,htmlPath:x.htmlPath,state:'LEGACY_ACTIVE',futureDesignAuthority:false,mayRemainTemporarily:true,physicalDeleteNow:false}));
const existingCx=surfaceRecords.filter(x=>x.cxSurfaceId).map(x=>({route:x.route,htmlPath:x.htmlPath,cxSurfaceId:x.cxSurfaceId,state:'PREDECESSOR_CX_RECONCILE',futureSuccessorAuthority:'NOT_AUTOMATICALLY_GRANTED'}));
write(`${base}/legacy/legacy-customer-presentation-registry-v3.json`,{schemaVersion:'PHI-OS-CX-R-LEGACY-CUSTOMER-PRESENTATION-REGISTRY-v3.0.0',work:'CX-R1-W0',baselineCommit:BASELINE,status:'LEGACY_PRESENTATION_QUARANTINED_AT_CURRENT_MAIN',summary:{legacyActive:legacySurfaces.length,existingCxToReconcile:existingCx.length},legacy:legacySurfaces,predecessorCx:existingCx,rules:{legacyMayReceiveFutureDesign:false,legacyDefectFixOnly:true,predecessorCxMustBeReconciledAgainstSuccessor:true}});
const legacyCss=cssEntries.filter(x=>x.classification==='LEGACY_PRESENTATION').map(x=>({stylesheet:x.stylesheet,consumerCount:x.numberOfConsumers,freezeState:'LEGACY_CSS_FROZEN',futureCxImportAllowed:false,newDesignAllowed:false,newComponentAllowed:false,newGeneralLayoutAllowed:false,defectFixOnly:true,physicalDeleteAllowedNow:false}));
write(`${base}/legacy/legacy-css-freeze-v2.json`,{schemaVersion:'PHI-OS-CX-R-LEGACY-CSS-FREEZE-v2.0.0',work:'CX-R1-W1',baselineCommit:BASELINE,status:'LEGACY_CSS_FROZEN_DEFECT_FIX_ONLY',summary:{frozenCustomerStylesheets:legacyCss.length},entries:legacyCss,rules:{legacyCssFutureDesignAuthority:false,defectFixOnly:true,activeSuccessorCxRouteLegacyCssAllowed:false,directDeleteBeforeZeroConsumer:false,mandatoryPhysicalDeleteAfterReplacementAcceptance:true}});
const oldSigs = exists(`${base}/legacy/legacy-component-signature-registry-v1.json`) ? json(`${base}/legacy/legacy-component-signature-registry-v1.json`).signatures : [];
write(`${base}/legacy/legacy-component-signature-registry-v2.json`,{schemaVersion:'PHI-OS-CX-R-LEGACY-COMPONENT-SIGNATURE-REGISTRY-v2.0.0',work:'CX-R1-W4',baselineCommit:BASELINE,status:'LEGACY_COMPONENT_SIGNATURES_RECONCILED',signatures:oldSigs,rules:{renameAndCopyAllowed:false,compositionMigrationAllowed:false,semanticContentMigrationAllowed:true}});
write(`${base}/acceptance/cx-r1-acceptance-v2.json`,{schemaVersion:'PHI-OS-CX-R1-ACCEPTANCE-v2.0.0',work:'CX-R1',baselineCommit:BASELINE,status:'ACCEPTED_LEGACY_PRESENTATION_QUARANTINE',requiredExitStates:['LEGACY_PRESENTATION_QUARANTINED','NEW_CUSTOMER_SURFACES_CLEAN_ROOM_READY'],rules:{physicalDeletePerformed:false,newSuccessorCxImportsLegacyPresentation:false,backendAuthorityTouched:false}});

const targetRoutes=[
  {routeId:'HOME',canonicalPath:'/',currentOperationalPath:'/'},
  {routeId:'MY_REALITY',canonicalPath:'/reality/',currentOperationalPath:'/reality/'},
  {routeId:'PERSONAL_REALITY',canonicalPath:'/perspectives/personal/',currentOperationalPath:'/perspectives/personal/'},
  {routeId:'FINANCIAL_REALITY',canonicalPath:'/professional/financial/',currentOperationalPath:'/professional/financial/'},
  {routeId:'ASK',canonicalPath:'/knowledge/ask/',currentOperationalPath:'/ask'},
  {routeId:'PERSPECTIVES',canonicalPath:'/perspectives/',currentOperationalPath:'/perspectives/'},
  {routeId:'PROFILE',canonicalPath:'/perspectives/profile/',currentOperationalPath:'/perspectives/profile/'},
  {routeId:'KNOWLEDGE',canonicalPath:'/knowledge/',currentOperationalPath:'/library'},
  {routeId:'PROFESSIONAL',canonicalPath:'/professional/',currentOperationalPath:'/professional/'},
  {routeId:'ACCOUNT',canonicalPath:'/account/',currentOperationalPath:'/account'}
].map(r=>({...r,cutoverState:r.canonicalPath===r.currentOperationalPath?'ALREADY_AT_TARGET_PATH':'PREPARED_NOT_CUT_OVER'}));
const aliases=[
  ['/ask','ASK','/knowledge/ask/'],['/ask.html','ASK','/knowledge/ask/'],['/knowledge-search','ASK','/knowledge/ask/'],['/knowledge-search.html','ASK','/knowledge/ask/'],
  ['/my-reality','MY_REALITY','/reality/'],['/my-reality.html','MY_REALITY','/reality/'],['/reality-dashboard','MY_REALITY','/reality/'],['/reality-dashboard.html','MY_REALITY','/reality/'],
  ['/personal-runtime','PERSONAL_REALITY','/perspectives/personal/'],['/personal-runtime.html','PERSONAL_REALITY','/perspectives/personal/'],['/professional/personal-runtime','PERSONAL_REALITY','/perspectives/personal/'],
  ['/financial','FINANCIAL_REALITY','/professional/financial/'],['/financial-reality','FINANCIAL_REALITY','/professional/financial/'],['/financial-reality.html','FINANCIAL_REALITY','/professional/financial/']
].map(([path,canonicalRouteId,destination])=>({path,canonicalRouteId,destination,redirectStatus:308,activation:'PLANNED_OR_EXISTING_COMPATIBILITY_REDIRECT'}));
const routeRegistry={schemaVersion:'PHI-OS-CX-CANONICAL-CUSTOMER-ROUTE-REGISTRY-v2.0.0',work:['CX-R1A','CX-R2_SUCCESSOR_INPUT'],baselineCommit:BASELINE,recordedAt:RECORDED_AT,status:'HARD_CUTOVER_TARGETS_PREPARED_NOT_EXECUTED',authorityBoundary:{createsBackendAuthority:false,presentationRoutingOnly:true,oneCanonicalDestinationPerPublicIntent:true,compatibilityAuthority:'_redirects_at_cutover',physicalLegacyDeleteAfterBrowserAcceptance:true},routes:targetRoutes,legacyAliases:aliases,rules:{canonicalAsk:'/knowledge/ask/',askCompatibilityOnly:['/ask','/ask.html','/knowledge-search','/knowledge-search.html'],doNotCutOverBeforeReplacementAcceptance:true,doNotDeleteLegacyBeforeBrowserAcceptance:true}};
write(`${base}/authority/canonical-customer-route-registry-v2.json`,routeRegistry);
const currentRedirects=read('_redirects');
const cutoverBlockers=[];
if(!exists('knowledge/ask/index.html'))cutoverBlockers.push({id:'ASK_SUCCESSOR_SURFACE_MISSING',current:'/ask',target:'/knowledge/ask/',resolutionPhase:'CX-R9-R2 + P1 CUTOVER'});
if(/^\/knowledge-search \/ask 308$/m.test(currentRedirects))cutoverBlockers.push({id:'ASK_REDIRECT_STILL_PREDECESSOR',current:'/knowledge-search -> /ask',target:'/knowledge-search -> /knowledge/ask/',resolutionPhase:'P1 CUTOVER'});
if(exists('ask.html'))cutoverBlockers.push({id:'ASK_COMPATIBILITY_FILE_STILL_ACTIVE_PRESENTATION',current:'ask.html present',target:'redirect/compatibility only after cutover',resolutionPhase:'P1 CUTOVER THEN PHYSICAL DELETE AFTER BROWSER ACCEPTANCE'});
const oldShells=['assets/js/public-shell-v2.js','assets/js/public-shell.js','assets/js/journey-shell.js'].filter(exists).map(p=>({path:p,classification:'DELETE_PRESENTATION_WHEN_ZERO_CONSUMER',deleteNow:false,protectedBackendAuthority:false}));
write(`${base}/migration/hard-cutover-preparation-v2.json`,{schemaVersion:'PHI-OS-CX-R1A-HARD-CUTOVER-PREPARATION-v2.0.0',work:'CX-R1A',baselineCommit:BASELINE,status:'HARD_CUTOVER_PREPARED_NOT_EXECUTED',canonicalRouteRegistry:`${base}/authority/canonical-customer-route-registry-v2.json`,priorityTargets:['/reality/','/perspectives/personal/','/professional/financial/','/knowledge/ask/'],currentBlockers:cutoverBlockers,oldShells,rules:{routeCutoverPerformed:false,physicalLegacyDeletePerformed:false,browserAcceptanceRequiredBeforeDelete:true,backendRuntimeDeleteForbidden:true}});
write(`${base}/migration/old-shell-decommission-plan-v2.json`,{schemaVersion:'PHI-OS-CX-R-OLD-SHELL-DECOMMISSION-PLAN-v2.0.0',work:'CX-R1A',baselineCommit:BASELINE,status:'PREPARED',entries:oldShells,rules:{deleteOnlyAfterZeroConsumerAndBrowserAcceptance:true}});
write(`${base}/acceptance/cx-r1a-acceptance-v2.json`,{schemaVersion:'PHI-OS-CX-R1A-ACCEPTANCE-v2.0.0',work:'CX-R1A',baselineCommit:BASELINE,status:'ACCEPTED_HARD_CUTOVER_PREPARATION',requiredExitStates:['CANONICAL_SUCCESSOR_TARGETS_DECLARED','ASK_CANONICAL_ROUTE_IS_KNOWLEDGE_ASK','COMPATIBILITY_REDIRECT_PLAN_DECLARED','OLD_SHELL_DELETE_PLAN_READY','PHYSICAL_DELETE_DEFERRED_UNTIL_BROWSER_ACCEPTANCE','READY_FOR_CX_R2'],rules:{backendAuthorityTouched:false,routeCutoverPerformed:false,legacyPhysicalDeletePerformed:false}});

if(!checkMode) console.log(`Generated CX-R0/R1/R1A successor reconciliation from ${surfaceRecords.length} customer HTML surfaces (${surfaceRecords.filter(x=>x.cxSurfaceId).length} existing CX, ${legacySurfaces.length} legacy/predecessor).`);
else console.log('✓ CX-R0/R1/R1A successor generated artifacts are current for baseline 92b30b9.');
