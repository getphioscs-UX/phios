import {writePackageKD} from './lib/knowledge-intelligence/package-k-d-v1.mjs';
const {readingPaths,projectionProfiles}=await writePackageKD();
console.log(`Package K-D rebuilt: ${readingPaths.pathCount} dynamic path profiles / ${projectionProfiles.profileCount} adaptive projection profiles.`);
