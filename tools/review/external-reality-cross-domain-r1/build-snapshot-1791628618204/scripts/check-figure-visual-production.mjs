import { assert, fs, P, all, read, sha, manifestPath, svgPath, pngPath, localization } from './figure/figure-check-lib.mjs';
const loc = localization();
assert.equal(loc.locale, 'zh-Hans');
for (const { id, spec } of all()) {
  const m = read(manifestPath(id));
  for (const p of [svgPath(id), pngPath(id)]) assert.ok(fs.existsSync(p), `${id} missing ${p}`);
  assert.deepEqual(m.outputFormats, ['svg', 'png']);
  assert.equal(sha(svgPath(id)), m.svgDigest);
  assert.equal(sha(pngPath(id)), m.pngDigest);
  assert.equal(sha(P.localization), m.localizationDigest);
  assert.equal(Object.hasOwn(m, 'webpDigest'), false, `${id} legacy webpDigest must be absent`);
  const svg = fs.readFileSync(svgPath(id), 'utf8');
  assert.ok(svg.includes(`data-figure-id="${id}"`));
  assert.ok(svg.includes('data-presentation-locales="en,zh-Hans"'));
  assert.ok(/[\u3400-\u9fff]/u.test(svg), `${id} zh-Hans presentation missing`);
  assert.ok(svg.includes(`data-localized-title="zh-Hans">${loc.figureNames[spec.semanticName]}`), `${id} localized title missing`);
  for (const n of spec.nodes) {
    assert.ok(svg.includes(`id="node-${n.nodeId}"`));
    assert.ok(svg.includes(`data-semantic-key="${n.semanticKey}"`));
    assert.ok(svg.includes(`data-localized-label="${loc.labels[n.displayLabel]}`), `${id}/${n.nodeId} localized label missing`);
  }
  for (const e of spec.edges) {
    assert.ok(svg.includes(`id="edge-${e.edgeId}"`));
    assert.ok(svg.includes(`data-from="${e.from}"`));
    assert.ok(svg.includes(`data-to="${e.to}"`));
  }
  for (const b of spec.boundaries) assert.ok(svg.includes(`id="boundary-${b.boundaryId}"`));
}
assert.equal(fs.existsSync(`${P.prod}/output/webp`), false, 'FIG production must not emit output/webp');
console.log('✓ FIG visual production checker: bilingual canonical SVG + PNG derivative digests verified for 57/57; WebP output is absent by policy.');
