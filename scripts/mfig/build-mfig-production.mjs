import fs from 'node:fs'; import crypto from 'node:crypto';
import {P,BASE,read,stable,sha,shaBytes,specPath,sourcePath,manifestPath,svgPath,pngPath,webpPath,carPath,requestedIds,renderSvg,geometryFingerprint,writeFile,rasterize,entryById} from './mfig-lib.mjs';
const raster=process.argv.includes('--raster'); const style=read(P.style); const runtime=read(P.runtime);
for(const id of requestedIds()){
 const spec=read(specPath(id)), sb=read(sourcePath(id)), e=entryById(id);
 const svg=renderSvg(spec,style), nextSvgDigest=shaBytes(Buffer.from(svg));
 const previousManifest=fs.existsSync(manifestPath(id))?read(manifestPath(id)):null;
 if(!raster){
  if(!previousManifest||previousManifest.svgDigest!==nextSvgDigest) throw new Error(`${id}: SVG changed or has no prior raster binding; rerun with --raster so PNG/WebP cannot remain stale`);
  if(!fs.existsSync(pngPath(id))||!fs.existsSync(webpPath(id))) throw new Error(`${id}: raster outputs missing; rerun with --raster in an environment with ImageMagick`);
  if(sha(pngPath(id))!==previousManifest.pngDigest||sha(webpPath(id))!==previousManifest.webpDigest) throw new Error(`${id}: existing raster digest drift; rerun with --raster`);
 }
 writeFile(svgPath(id),svg); if(raster)rasterize(svgPath(id),pngPath(id),webpPath(id));
 if(!fs.existsSync(pngPath(id))||!fs.existsSync(webpPath(id))) throw new Error(`${id}: raster outputs missing; run with --raster in an environment with ImageMagick`);
 const sourceDigests={}; for(const s of sb.sources) sourceDigests[s.path]=sha(s.path);
 const manifest={schemaVersion:'1.0.0',mfigId:id,generatedAgainstCommit:BASE,registryDigest:sha(P.reg),visualSpecDigest:sha(specPath(id)),sourceBindingDigest:sha(sourcePath(id)),sourceDigests,rendererVersion:'1.1.0',styleVersion:style.styleVersion,svgDigest:sha(svgPath(id)),pngDigest:sha(pngPath(id)),webpDigest:sha(webpPath(id)),geometryFingerprintDigest:geometryFingerprint(spec,style),machineStatus:'PENDING_CHECKS',stale:false,carEligible:e.carPublicationEligible};
 writeFile(manifestPath(id),stable(manifest));
 const handoff={schemaVersion:'1.0.0',mfigId:id,canonicalTitle:e.canonicalTitle,canonicalCarPublicationEligible:e.carPublicationEligible,machineAccepted:false,handoffStatus:e.carPublicationEligible?'AWAITING_MACHINE_ACCEPTANCE':'BLOCKED_BY_CANONICAL_CAR_ELIGIBILITY',svgDigest:manifest.svgDigest,webpDigest:manifest.webpDigest,visualSpecDigest:manifest.visualSpecDigest,sourceBindingDigest:manifest.sourceBindingDigest,productionManifestDigest:sha(manifestPath(id)),generatedAgainstCommit:BASE,selfApproveAllowed:false,selfPublishAllowed:false}; writeFile(carPath(id),stable(handoff)); console.log(`✓ ${id} deterministic SVG${raster?' + PNG/WebP':''} built`);
}
