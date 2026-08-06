import {writePublishedRetrievalIndex} from './lib/knowledge-public/published-retrieval-index-v1.mjs';
const m=await writePublishedRetrievalIndex();
console.log(`STEP64 Multilingual Published Retrieval Index rebuilt: ${m.recordCounts.publications} publications, ${m.recordCounts.nodes} locale nodes, ${m.recordCounts.fragments} fragments.`);
