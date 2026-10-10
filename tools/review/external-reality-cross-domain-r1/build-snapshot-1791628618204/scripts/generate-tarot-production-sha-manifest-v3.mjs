import {buildSourceManifestV3,MANIFEST_V3_PATH,writeJson} from './lib/tarot/production-sha-alignment-v3.mjs';
const baseline='5c1d05f400bd01e5d278327c97dffb5322940129';
writeJson(process.cwd(),MANIFEST_V3_PATH,buildSourceManifestV3(process.cwd(),baseline));
console.log(`✓ Phase-L v3 / M-R canonical Tarot source manifest generated: ${MANIFEST_V3_PATH}`);
