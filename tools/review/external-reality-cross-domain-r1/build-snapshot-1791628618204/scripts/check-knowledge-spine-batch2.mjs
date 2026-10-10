import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const historical=json('content/web-production/successors/knowledge-spine-batch2-presentation-successor-v1.json');
const current=json('content/web-production/successors/knowledge-spine-batch2-current-presentation-successor-v2.json');
const r=json('content/web-production/registries/client-visual-asset-registry-v1.5.json');
assert.equal(historical.status,'PRESENTATION_SUCCESSOR_NO_KNOWLEDGE_AUTHORITY');
assert.equal(current.status,'CURRENT_PRESENTATION_SUCCESSOR_PACKAGE_FINGERPRINT_DECOUPLED');
assert.equal(sha(current.predecessor.path),current.predecessor.sha256,'KNOWLEDGE_SPINE_HISTORICAL_SUCCESSOR_DRIFT');
assert.equal(current.predecessor.rewritten,false);
assert.equal(sha(historical.predecessorVisualRegistry.path),historical.predecessorVisualRegistry.sha256,'KNOWLEDGE_SPINE_PREDECESSOR_REGISTRY_DRIFT');
for(const v of Object.values(historical.boundaries))assert.equal(v,false);
for(const v of Object.values(current.boundaries))assert.equal(v,false);
assert.equal(current.packagePolicy.wholePackageJsonSha256Required,false);
assert.equal(current.packagePolicy.wholePackageLockSha256Required,false);
assert.equal(current.packagePolicy.futurePackageChangesRequireKnowledgeSpineFingerprintSuccessor,false);
const css=read(historical.sharedPresentation.stylesheet),js=read(historical.sharedPresentation.visualHydrator);
assert.match(js,/resolvePublicAssetForWeb/);
assert.match(js,/startsWith\('ILL-'\)/);
assert.doesNotMatch(js,/localStorage\.setItem|sessionStorage\.setItem|method:\s*['"]POST/i);
assert.match(css,/\.ks-hero/);
assert.match(css,/\.ks-article-hero/);
assert.match(css,/\.ks-book-hero/);
for(const s of historical.surfaces.filter(x=>!x.path.includes('*'))){
  const html=read(s.path);
  assert.match(html,/\/assets\/css\/knowledge-spine\.css/,`KNOWLEDGE_SPINE_CSS_MISSING:${s.path}`);
  assert.match(html,/\/assets\/js\/pages\/knowledge-spine-visuals\.js/,`KNOWLEDGE_SPINE_VISUAL_JS_MISSING:${s.path}`);
  assert.match(html,new RegExp(`data-knowledge-spine-surface="${s.surface}"`),`KNOWLEDGE_SPINE_SURFACE_MARKER_MISSING:${s.path}`);
  if(['LIBRARY','ARTICLES','FIGURES','FIGURE','BOOKS'].includes(s.surface))assert.match(html,new RegExp(`data-ks-asset="${s.hero}"`),`KNOWLEDGE_SPINE_HERO_MISSING:${s.path}`);
}
const articleRenderer=read(historical.articleMaster.masterRenderer),articleController=read(historical.articleMaster.pageController);
assert.match(articleRenderer,/renderArticleDocument/);
assert.match(articleController,/hydrateKnowledgeSpineVisuals/);
assert.match(js,/decorateArticle/);
assert.match(js,/HERO-004/);
const articleFiles=fs.readdirSync('articles').filter(f=>f.endsWith('.html'));
assert.ok(articleFiles.length>0);
for(const f of articleFiles){const h=read(path.join('articles',f));assert.match(h,/\/assets\/js\/pages\/article\.js/);}
const bookJs=read(historical.bookDetailMaster.renderer);
assert.match(bookJs,/loadCanonicalBooks/);
assert.match(bookJs,/canonicalPartsForBook/);
assert.match(js,/decorateBook/);
for(const [book,hero] of Object.entries(historical.bookDetailMaster.fiveHeroMapping))assert.ok(js.includes(`'${book}':'${hero}'`),`BOOK_HERO_MAPPING_MISSING:${book}`);
for(const s of historical.surfaces){
  const cov=r.surfaceCoverage.find(x=>x.htmlFile===s.path&&x.surfaceCode===s.surface);
  assert.ok(cov,`KNOWLEDGE_SPINE_VISUAL_COVERAGE_MISSING:${s.surface}`);
  assert.equal(cov.status,'CURRENT_CANONICAL_CONSUMER');
}
console.log('✓ Knowledge Spine Batch 2 current presentation successor passed.');
console.log(`  Library → Articles → Article master → Figures → Figure → Books → five Book Detail surfaces share one governed visual system; ${articleFiles.length} published article shells inherit the master without per-file mutation.`);
console.log('  Repository package/package-lock fingerprints are not Knowledge Spine authority and are no longer consumed by the current checker.');
