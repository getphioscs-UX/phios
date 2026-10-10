import fs from 'node:fs/promises';
import path from 'node:path';
import { applyVapW11, VAP_W11_PATHS } from './lib/visual-article-production/publication-handoff-decision-v1.mjs';
const root = process.cwd();
if (!process.argv.slice(2).includes('--apply')) {
  console.error('VAP-W11 is fail-closed. Use --apply only after six explicit per-node TL Human Publication decisions are recorded.');
  process.exit(2);
}
const envelope = JSON.parse(await fs.readFile(path.join(root, VAP_W11_PATHS.decisions), 'utf8'));
const result = await applyVapW11(root, envelope, { apply: true });
console.log(`VAP-W11 HUMAN PUBLICATION DECISIONS: ${result.activation.humanPublicationDecisionCount}`);
console.log(`VAP-W11 PUBLISH AUTHORIZED: ${result.activation.publishAuthorizedCount}`);
console.log(`VAP-W11 PUBLICATION HANDOFFS: ${result.activation.publicationHandoffCount}`);
console.log(`VAP-W11 PJA PUBLICATION RECORDS: ${result.activation.pjaPublicationRecordCountCreatedByW11}`);
console.log(`VAP-W11 PUBLIC PROJECTIONS: ${result.activation.publicProjectionCountCreatedByW11}`);
