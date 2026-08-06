import {writePackageKC} from './lib/knowledge-intelligence/package-k-c-v1.mjs';
const {assembly,compression}=await writePackageKC();
console.log(`Package K-C rebuilt: ${assembly.assemblyCount} assemblies / ${compression.blockCount} controlled knowledge blocks.`);
