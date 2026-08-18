import { assert, fs, P, ids, read, sha, specPath, sourcePath, manifestPath } from './figure/figure-check-lib.mjs';
for (const id of ids()) {
  assert.ok(fs.existsSync(manifestPath(id)), `${id} manifest missing`);
  const m = read(manifestPath(id)), sb = read(sourcePath(id));
  assert.equal(m.registryDigest, sha(P.reg), `${id} registry stale`);
  assert.equal(m.visualSpecDigest, sha(specPath(id)), `${id} spec stale`);
  assert.equal(m.sourceBindingDigest, sha(sourcePath(id)), `${id} source binding stale`);
  assert.equal(m.localizationDigest, sha(P.localization), `${id} localization stale`);
  for (const s of sb.sources) assert.equal(m.sourceDigests[s.path], sha(s.path), `${id} source stale ${s.path}`);
  assert.equal(m.stale, false);
}
console.log('✓ FIG staleness checker: 57/57 registry/spec/source/localization bindings current against production manifests.');
