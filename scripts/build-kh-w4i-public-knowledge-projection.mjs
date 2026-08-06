import { writePublishedKnowledgeProjection } from './lib/knowledge-public/public-projection.mjs';
const output = writePublishedKnowledgeProjection();
console.log(`KH-W4I public projection rebuilt: ${Object.keys(output).length} read models.`);
