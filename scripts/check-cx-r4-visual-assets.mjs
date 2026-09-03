import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const BASELINE='d35486b9dfc077020c50bb232ac29e233c01ce92';
const R3_BASELINE='2cffbc97f9a72c3103780e78c3930f9233a41da0';
const base='content/customer-experience-rebuild';
const read=(p)=>fs.readFileSync(p,'utf8');
const json=(p)=>JSON.parse(read(p));

const registry=json(`${base}/authority/customer-visual-asset-registry-v3.json`);
const heroMap=json(`${base}/registries/customer-hero-asset-map-v1.json`);
const bookMap=json(`${base}/registries/customer-book-cover-map-v1.json`);
const illustrationMap=json(`${base}/registries/customer-illustration-map-v1.json`);
const delivery=json(`${base}/contracts/customer-asset-delivery-contract-v1.json`);
const acceptance=json(`${base}/acceptance/cx-r4-acceptance-v2.json`);
const r3=json(`${base}/acceptance/cx-r3-acceptance-v2.json`);
const r0Fix=json(`${base}/acceptance/cx-r0-freeze-checker-reconciliation-v1.json`);

for(const artifact of [registry,heroMap,bookMap,illustrationMap,delivery,acceptance]) {
  assert.equal(artifact.baselineCommit,BASELINE,`${artifact.work||artifact.schemaVersion} is not aligned to CX-R4 execution start d35486b`);
}
assert.equal(r3.baselineCommit,R3_BASELINE,'CX-R4 must consume the accepted CX-R3 freeze rather than rewrite it');
assert.equal(r3.status,'ACCEPTED_CUSTOMER_DESIGN_SYSTEM');
assert.equal(r3.rules.readyForCxR4,true);
assert.equal(registry.status,'CANONICAL_VISUAL_ASSET_PROJECTION_RECONCILED');
assert.equal(registry.authorityBoundary.createsSecondAssetAuthority,false);
assert.equal(registry.authorityBoundary.projectionOnly,true);
assert.equal(registry.authorityBoundary.upstreamAssetIdentityRemainsCanonical,true);
assert.equal(registry.rules.silentBrokenImageAllowed,false);
assert.equal(registry.rules.unavailableAssetFailsClosed,true);
assert.equal(registry.rules.expectedCustomerAssetMustResolve,true);
assert.equal(registry.rules.runtimeMayCalculateNewAssetIdentity,false);
assert.equal(registry.rules.cssGradientMayReplaceAvailableBookCover,false);
assert.equal(registry.rules.activeFrozenProductAssetIdMayBeSilentlyRelabeled,false);

const ids=registry.entries.map(x=>x.assetId);
assert.equal(new Set(ids).size,ids.length,'customer visual registry contains duplicate asset IDs');
const by=new Map(registry.entries.map(x=>[x.assetId,x]));
for(const type of ['HERO','ILLUSTRATION','BOOK_COVER','FIGURE','ICON','PROFESSIONAL','ARTICLE']) {
  assert.ok(registry.entries.some(x=>x.type===type),`CX-R4 registry missing ${type} family`);
}
for(const id of ['LOGO-003','LOGO-010','LOGO-011']) assert.equal(by.get(id)?.available,true,`${id} is not available`);

// W1 — one canonical hero role per governed surface.
assert.equal(heroMap.status,'CANONICAL_HERO_ROLES_FROZEN');
const heroSurfaces=heroMap.bindings.map(x=>x.surfaceId);
assert.equal(new Set(heroSurfaces).size,heroSurfaces.length,'a customer surface has more than one canonical hero role');
for(const surface of ['HOME','MY_REALITY','PERSONAL_REALITY','FINANCIAL_REALITY','KNOWLEDGE','PROFESSIONAL','ACADEMY']) {
  const binding=heroMap.bindings.find(x=>x.surfaceId===surface);
  assert.ok(binding,`hero mapping missing ${surface}`);
  const asset=by.get(binding.assetId);
  assert.equal(asset?.type,'HERO',`${surface} hero does not resolve to HERO family`);
  assert.equal(asset?.available,true,`${surface} canonical hero is unavailable`);
}

// W2 — Five Books use real, remote-verified covers, never CSS stand-ins.
assert.equal(bookMap.status,'FIVE_BOOK_CANONICAL_COVERS_FROZEN');
assert.equal(bookMap.bindings.length,5);
for(let i=1;i<=5;i+=1){
  const id=`BOOK-${i}-HARDCOVER`;
  const binding=bookMap.bindings.find(x=>x.assetId===id);
  const asset=by.get(id);
  assert.ok(binding,`Book ${i} cover mapping missing`);
  assert.equal(asset?.type,'BOOK_COVER');
  assert.equal(asset?.available,true,`${id} unavailable`);
  assert.equal(asset?.remoteVerified,true,`${id} lacks recorded remote verification`);
  assert.ok(String(asset.publicUrl||'').startsWith(registry.publicR2Base),`${id} is not delivered from canonical R2 authority`);
  assert.equal(asset.contentType,'image/webp',`${id} MIME is not image/webp`);
}
assert.equal(bookMap.rules.cssGradientSubstituteAllowed,false);

// W3 — role IDs are semantic; upstream asset IDs remain intact so Product freezes are not rewritten by CX.
const expectedRoles=[
  ['ILL-001','Knowledge Landscape','ILL-001'],
  ['ILL-002','Reading Path','ILL-002'],
  ['ILL-003','Knowledge Discovery','ILL-003'],
  ['ILL-004','Membership','ILL-009'],
  ['ILL-005','Personal Reality','ILL-004'],
  ['ILL-006','Financial Reality','ILL-005'],
  ['ILL-007','Academy','ILL-006'],
  ['ILL-008','Professional Workspace','ILL-007'],
  ['ILL-009','Digital Reading','HERO-018'],
  ['ILL-010','Reality Workspace Continuity','ILL-010'],
];
assert.equal(illustrationMap.status,'SEMANTIC_ILLUSTRATION_ROLES_RECONCILED');
assert.equal(illustrationMap.reconciliation.activeProductFreezeConflictHandled,true);
for(const [roleId,semanticRole,assetId] of expectedRoles){
  const binding=illustrationMap.bindings.find(x=>x.roleId===roleId);
  assert.ok(binding,`${roleId} semantic role binding missing`);
  assert.equal(binding.semanticRole,semanticRole,`${roleId} has the wrong governing semantic role`);
  assert.equal(binding.assetId,assetId,`${roleId} does not resolve to the reconciled upstream asset identity`);
  assert.equal(binding.available,true,`${roleId} source is unavailable`);
  const asset=by.get(assetId);
  assert.ok(asset,`${roleId} points to unknown asset ${assetId}`);
  assert.equal(asset.available,true,`${roleId} points to unavailable asset ${assetId}`);
}
const digital=illustrationMap.bindings.find(x=>x.roleId==='ILL-009');
assert.equal(digital.sourceFamily,'HERO');
assert.equal(digital.crossFamilySemanticReuse,true,'Digital Reading cross-family reuse must remain explicit');
assert.equal(illustrationMap.rules.upstreamAssetIdentityIsNotRenamed,true);
assert.equal(illustrationMap.rules.frozenProductSurfaceIsNotMutatedByCxR4,true);
assert.equal(illustrationMap.rules.silentSubstitutionForbidden,true);

// W4 — one resolver owns asset-identity delivery and explicit semantic-role resolution.
assert.equal(delivery.registry,`${base}/authority/customer-visual-asset-registry-v3.json`);
assert.equal(delivery.resolver,'assets/customer-ui/js/assets.js');
assert.equal(delivery.resolverFunction,'resolveCustomerAsset');
assert.equal(delivery.roleResolverFunction,'resolveCustomerAssetRole');
assert.deepEqual(delivery.bindingAttributes,['data-cx-asset','data-cx-asset-role']);
assert.equal(delivery.failureContract.silentBlankAllowed,false);
assert.equal(delivery.failureContract.visibleFallbackRequiredAtRuntime,true);
assert.equal(delivery.boundaries.browserMayScrapeOrProbeArbitraryAssetUrls,false);
const assetJs=read('assets/customer-ui/js/assets.js');
for(const token of ['customer-visual-asset-registry-v3.json','resolveCustomerAsset','resolveCustomerAssetRole','CX_ASSET_UNKNOWN','CX_ASSET_UNAVAILABLE','CX_ASSET_ROLE_UNKNOWN','CX_ASSET_ROLE_UNAVAILABLE','CX_ASSET_IMAGE_LOAD_FAILED','loading','decoding','fetchPriority','data-cx-asset-fallback','Visual unavailable','视觉资源暂时无法显示']) {
  assert.ok(assetJs.includes(token),`customer asset resolver missing ${token}`);
}
assert.ok(assetJs.includes('naturalWidth'),'image loader must verify a successfully decoded image');
assert.match(assetJs,/addEventListener\('error'/,'image loader must have an error path');
assert.match(assetJs,/\[data-cx-asset\],\[data-cx-asset-role\]/,'hydrator must discover direct and semantic-role bindings');

// W5 — live broken-image gate. New CX may bind by semantic role; frozen Product surfaces may retain direct source asset IDs.
function walk(dir){
  const out=[]; const stack=[dir];
  while(stack.length){
    const cur=stack.pop(); if(!fs.existsSync(cur))continue;
    for(const ent of fs.readdirSync(cur,{withFileTypes:true})){
      if(['node_modules','.git','.wrangler','.cache'].includes(ent.name))continue;
      const p=path.join(cur,ent.name);
      if(ent.isDirectory())stack.push(p);
      else if(ent.isFile()&&p.endsWith('.html'))out.push(p.replaceAll(path.sep,'/'));
    }
  }
  return out;
}
const htmlFiles=[...new Set([...fs.readdirSync('.',{withFileTypes:true}).filter(x=>x.isFile()&&x.name.endsWith('.html')).map(x=>x.name),...['about','books','articles','knowledge','search','readings','professional','reality','perspectives','account','academy','reports','appointments','services','customer-ui-preview'].flatMap(walk)])];
const consumers=[];
for(const file of htmlFiles){
  const html=read(file); if(!/data-cx-surface=/i.test(html))continue;
  for(const match of html.matchAll(/data-cx-asset=["']([^"']+)["']/gi)) consumers.push({file,bindingKind:'ASSET_ID',requestedId:match[1]});
  for(const match of html.matchAll(/data-cx-asset-role=["']([^"']+)["']/gi)) consumers.push({file,bindingKind:'SEMANTIC_ROLE',requestedId:match[1]});
}
assert.ok(consumers.length>0,'no live CX visual consumers were discovered');
for(const consumer of consumers){
  let asset;
  if(consumer.bindingKind==='SEMANTIC_ROLE'){
    const role=registry.roleBindings.find(x=>x.roleId===consumer.requestedId);
    assert.ok(role,`CX consumer ${consumer.file} references unknown semantic role ${consumer.requestedId}`);
    assert.equal(role.available,true,`CX consumer ${consumer.file} references unavailable semantic role ${consumer.requestedId}`);
    asset=by.get(role.assetId);
  }else asset=by.get(consumer.requestedId);
  assert.ok(asset,`CX consumer ${consumer.file} does not resolve: ${consumer.requestedId}`);
  assert.equal(asset.available,true,`CX consumer ${consumer.file} resolves to unavailable ${asset.assetId}`);
  assert.ok(asset.publicUrl,`CX consumer ${consumer.file} has no delivery URL for ${asset.assetId}`);
  assert.ok(String(asset.contentType||'').startsWith('image/'),`CX consumer ${consumer.file} has invalid MIME for ${asset.assetId}`);
  if(String(asset.publicUrl).startsWith('/assets/')) assert.equal(fs.existsSync(String(asset.publicUrl).slice(1)),true,`repo-bundled asset missing: ${asset.publicUrl}`);
  else assert.equal(asset.remoteVerified,true,`remote CX asset lacks recorded verification: ${asset.assetId}`);
}

// Product/CX reconciliation: preserve the PPR-owned Personal HTML while moving new Financial composition to semantic role binding.
const personal=read('perspectives/personal/index.html');
assert.match(personal,/data-cx-asset="ILL-004"/,'PPR-owned Personal Reality direct asset identity changed during CX-R4');
assert.equal(personal.includes('data-cx-asset-role="ILL-005"'),false,'CX-R4 must not rewrite the frozen PPR Personal owner to a new role attribute');
const financial=read('professional/financial/index.html');
assert.match(financial,/data-cx-asset-role="ILL-006"/,'Financial Reality must consume the R4 Financial semantic role');
assert.equal(financial.includes('data-cx-asset="ILL-006"'),false,'Financial Reality still treats the semantic role number as an upstream asset identity');

// R0 repair — historical freeze checking is separate from live current-tree census.
assert.equal(r0Fix.status,'HISTORICAL_R0_FREEZE_CHECK_SEPARATED_FROM_LIVE_WORKING_TREE_CENSUS');
assert.equal(r0Fix.resolution.checkCxR0RegeneratesFromCurrentWorkingTree,false);
const r0Checker=read('scripts/check-cx-r0-baseline.mjs');
assert.ok(r0Checker.includes('generate-cx-r0-r1-r1a-successor.mjs'),'R0 checker should document the generator boundary');
assert.equal(r0Checker.includes('execFileSync'),false,'check:cx-r0 must not rerun the historical census generator against later CX phases');

assert.equal(acceptance.status,'ACCEPTED_CANONICAL_VISUAL_ASSET_SYSTEM');
assert.deepEqual(acceptance.requiredExitStates,['CANONICAL_VISUAL_ASSET_SYSTEM_READY','FIVE_BOOK_COVERS_BOUND','ILLUSTRATION_ROLES_RECONCILED','BROKEN_IMAGE_GATE_ACTIVE','READY_FOR_CX_R5']);
assert.equal(acceptance.rules.backendAuthorityTouched,false);
assert.equal(acceptance.rules.routeCutoverPerformed,false);
assert.equal(acceptance.rules.legacyPhysicalDeletePerformed,false);
assert.equal(acceptance.rules.r5GlobalShellAuthorityPerformed,false);
assert.equal(acceptance.rules.readyForCxR5,true);

console.log(`✓ CX-R4 Canonical Visual Assets passed at d35486b: ${registry.summary.count} customer projections, ${registry.summary.available} available, 7 hero roles, 5 book covers, 10 semantic illustration roles and ${consumers.length} live CX visual bindings fail-closed.`);
console.log('✓ Product/CX visual reconciliation passed: PPR-owned Personal asset identity stays frozen; new Financial CX uses semantic-role resolution.');
console.log('✓ CX-R0 freeze checker repair passed: historical R0 inventory is no longer regenerated from the R3/R4 working tree; live R1 guards remain active.');
console.log('✓ CX-R4 ACCEPTED: CANONICAL_VISUAL_ASSET_SYSTEM_READY · FIVE_BOOK_COVERS_BOUND · ILLUSTRATION_ROLES_RECONCILED · BROKEN_IMAGE_GATE_ACTIVE · READY_FOR_CX_R5');
console.log('✓ R4 did not perform R5 shell authority, production route cutover, legacy physical deletion or backend-authority creation.');
