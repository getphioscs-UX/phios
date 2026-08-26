import {buildSourceManifest,MANIFEST_PATH,writeJson} from './lib/tarot/production-sha-alignment-v1.mjs';
const root=process.cwd();
const baseline='526547698894de0d33d09447aed0b93b83558114';
const manifest=buildSourceManifest(root,baseline);
writeJson(root,MANIFEST_PATH,manifest);
console.log(`✓ Tarot Phase-L release-candidate runtime source manifest generated: ${MANIFEST_PATH}`);
