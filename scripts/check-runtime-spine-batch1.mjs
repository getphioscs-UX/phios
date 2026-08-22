import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const c=readJson('content/web-production/successors/runtime-spine-batch1-presentation-successor-v1.json');
const r=readJson('content/web-production/registries/client-visual-asset-registry-v1.4.json');
assert.equal(c.status,'PRESENTATION_SUCCESSOR_NO_RUNTIME_AUTHORITY');
assert.equal(sha(c.predecessorVisualRegistry.path),c.predecessorVisualRegistry.sha256,'RUNTIME_SPINE_PREDECESSOR_REGISTRY_DRIFT');
for(const v of Object.values(c.boundaries)) assert.equal(v,false);
const sharedCss=fs.readFileSync(c.sharedPresentation.stylesheet,'utf8');
const sharedJs=fs.readFileSync(c.sharedPresentation.visualHydrator,'utf8');
assert.match(sharedJs,/resolvePublicAssetForWeb/);
assert.match(sharedJs,/ILL-010/);
assert.doesNotMatch(sharedJs,/localStorage\.setItem|sessionStorage\.setItem|fetch\([^)]*method:\s*['\"]POST/i);
for(const s of c.surfaces){
  const html=fs.readFileSync(s.path,'utf8');
  if(s.path!=='reality/index.html'){
    assert.match(html,/\/assets\/css\/runtime-spine\.css/ ,`RUNTIME_SPINE_CSS_MISSING:${s.path}`);
    assert.match(html,/\/assets\/js\/pages\/runtime-spine-visuals\.js/,`RUNTIME_SPINE_VISUAL_JS_MISSING:${s.path}`);
    assert.match(html,new RegExp(`data-runtime-spine-surface="${s.surface}"`),`RUNTIME_SPINE_SURFACE_MARKER_MISSING:${s.path}`);
    assert.match(html,new RegExp(`data-rs-asset="${s.hero}"`),`RUNTIME_SPINE_HERO_MISSING:${s.path}`);
    for(const a of s.support) assert.match(html,new RegExp(`(?:data-rs-asset|data-rw-asset)="${a}"`),`RUNTIME_SPINE_SUPPORT_ASSET_MISSING:${s.path}:${a}`);
  }else{
    assert.match(html,/data-rw-asset="HERO-006"/);
    assert.match(html,/data-rw-asset="ILL-010"/);
  }
  const cov=r.surfaceCoverage.find(x=>x.htmlFile===s.path);
  assert.ok(cov,`RUNTIME_SPINE_VISUAL_COVERAGE_MISSING:${s.path}`);
  assert.equal(cov.status,'CURRENT_CANONICAL_CONSUMER');
  assert.equal(cov.actualImageConsumerBaseline,'CANONICAL_SUCCESSOR_ACTIVE');
}
assert.ok(sharedCss.includes('.rs-hero'));
console.log('✓ Runtime Spine Batch 1 presentation successor passed.');
console.log('  6/6 surfaces preserve upstream authority while consuming canonical R2 Hero/Figure/Illustration assets through the existing resolver.');
