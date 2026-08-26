import {buildSourceManifestV2,MANIFEST_V2_PATH,writeJson} from './lib/tarot/production-sha-alignment-v2.mjs';
const baseline='fc2c3dd6ab4910581fd9c859dc303e8c89697ec0';
writeJson(process.cwd(),MANIFEST_V2_PATH,buildSourceManifestV2(process.cwd(),baseline));
console.log(`✓ Phase-L v2 / Phase-M release-candidate source manifest generated: ${MANIFEST_V2_PATH}`);
