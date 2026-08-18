import fs from 'node:fs';
import {
  P, BASE, read, stable, sha, shaBytes, specPath, sourcePath, manifestPath, svgPath, pngPath, carPath,
  requestedIds, renderSvg, geometryFingerprint, writeFile, rasterize, entryById
} from './figure-lib.mjs';

const raster = process.argv.includes('--raster'), style = read(P.style);
for (const id of requestedIds()) {
  const spec = read(specPath(id)), sb = read(sourcePath(id)), e = entryById(id);
  const svg = renderSvg(spec, style), nextSvg = shaBytes(Buffer.from(svg));
  const prev = fs.existsSync(manifestPath(id)) ? read(manifestPath(id)) : null;
  if (!raster) {
    if (!prev || prev.svgDigest !== nextSvg) throw new Error(`${id}: SVG changed/no prior raster binding; rerun with --raster`);
    if (!fs.existsSync(pngPath(id))) throw new Error(`${id}: PNG raster missing; rerun with --raster`);
  }
  writeFile(svgPath(id), svg);
  if (raster) await rasterize(svgPath(id), pngPath(id));
  const sourceDigests = {};
  for (const s of sb.sources) sourceDigests[s.path] = sha(s.path);
  const manifest = {
    schemaVersion: '1.1.0', figureId: id, generatedAgainstCommit: BASE,
    registryDigest: sha(P.reg), visualSpecDigest: sha(specPath(id)), sourceBindingDigest: sha(sourcePath(id)),
    localizationDigest: sha(P.localization), sourceDigests, rendererVersion: 'FIG-RENDERER-1.1.0', styleVersion: style.styleVersion,
    outputFormats: ['svg', 'png'], svgDigest: sha(svgPath(id)), pngDigest: sha(pngPath(id)),
    geometryFingerprintDigest: geometryFingerprint(spec, style), machineStatus: 'PENDING_CHECKS', stale: false,
    canonicalFilename: e.canonicalFilename, publicationAuthorityOwnedHere: false
  };
  writeFile(manifestPath(id), stable(manifest));
  const handoff = {
    schemaVersion: '1.1.0', figureId: id, canonicalFilename: e.canonicalFilename, machineAccepted: false,
    handoffStatus: 'CANDIDATE_ONLY_AWAITING_EXISTING_CAR_LIFECYCLE', svgDigest: manifest.svgDigest, pngDigest: manifest.pngDigest,
    visualSpecDigest: manifest.visualSpecDigest, sourceBindingDigest: manifest.sourceBindingDigest, localizationDigest: manifest.localizationDigest,
    productionManifestDigest: sha(manifestPath(id)), generatedAgainstCommit: BASE, selfApproveAllowed: false, selfPublishAllowed: false
  };
  writeFile(carPath(id), stable(handoff));
  console.log(`✓ ${id} deterministic bilingual SVG${raster ? ' + PNG' : ''} built → ${e.canonicalFilename}`);
}
