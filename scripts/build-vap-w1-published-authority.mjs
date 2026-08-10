import { writeVapW1RepairedPublishedKnowledgeAuthority } from './lib/visual-article-production/published-knowledge-integrity-repair-v1.mjs';
const output = writeVapW1RepairedPublishedKnowledgeAuthority();
console.log(`VAP-W1 Published Knowledge Authority repaired: ${output.registry.recordCount} locale publications eligible.`);
console.log(`VAP-W1 repaired authority: ${output.repairResult.targetAuthorityRecordCode} ${output.repairResult.beforeAuthorityDigest} -> ${output.repairResult.afterAuthorityDigest}`);
