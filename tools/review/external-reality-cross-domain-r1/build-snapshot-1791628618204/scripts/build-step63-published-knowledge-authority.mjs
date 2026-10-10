import { writePublishedKnowledgeAuthority } from './lib/knowledge-public/published-authority-v1.mjs';
const output = writePublishedKnowledgeAuthority();
console.log(`STEP63 Published Knowledge Authority rebuilt: ${output.registry.recordCount} locale publications eligible.`);
