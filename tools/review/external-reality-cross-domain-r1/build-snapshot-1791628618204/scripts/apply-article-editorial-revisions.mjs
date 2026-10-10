import { activeEditorialRevisions } from './lib/article-editorial-revision/article-editorial-revision-v1.mjs';
import { runBfaPublication } from './lib/bilingual-final-approval/bfa-publication-successor-v1.mjs';
import { writePublishedRetrievalIndex } from './lib/knowledge-public/published-retrieval-index-v1.mjs';

const root = process.cwd();
const revisions = activeEditorialRevisions(root);
if (!revisions.length) {
  console.log('✓ No active public article editorial revisions.');
  process.exit(0);
}
const batches = [...new Set(revisions.map(r => r.batchCode).filter(Boolean))].sort();
if (!batches.length) throw new Error('ARTICLE_EDITORIAL_REVISION_BATCH_REQUIRED');
for (const batch of batches) await runBfaPublication(root, batch, { apply: true });
await writePublishedRetrievalIndex();
console.log(`✓ Applied ${revisions.length} governed public editorial revisions across ${batches.length} BFA batch(es) without mutating BFA Publication Packages or TL Final Approval lineage.`);
console.log('✓ Published Knowledge Authority, CPR presentations, public Visual Articles, and multilingual retrieval projections are synchronized.');
