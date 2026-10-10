import {writePackageKA} from './lib/knowledge-intelligence/package-k-a-v1.mjs';
const {profiles,graph}=await writePackageKA();
console.log(`Package K-A rebuilt: profiles=${profiles.profileCount}, canonicalNodes=${profiles.canonicalNodeCount}, graphNodes=${graph.graphNodeCount}, edges=${graph.edgeCount}.`);
