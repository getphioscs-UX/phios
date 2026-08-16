import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const batchesRoot = path.join(root, 'content/production/article-simplification/batches');
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const allowedPublicationDecisions = new Set(['publish', 'defer', 'do_not_publish']);

if (!fs.existsSync(batchesRoot)) process.exit(0);

let bomNormalized = 0;
let stateNormalized = 0;

for (const entry of fs.readdirSync(batchesRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const target = path.join(batchesRoot, entry.name, 'human-decisions.v1.json');
  if (!fs.existsSync(target)) continue;

  let bytes = fs.readFileSync(target);
  let changed = false;
  if (bytes.length >= 3 && bytes.subarray(0, 3).equals(UTF8_BOM)) {
    bytes = bytes.subarray(3);
    bomNormalized += 1;
    changed = true;
    console.log(`✓ APS JSON encoding normalization removed UTF-8 BOM: ${path.relative(root, target)}`);
  }

  const text = bytes.toString('utf8');
  const document = JSON.parse(text);
  if (Array.isArray(document?.entries)) {
    for (const decision of document.entries) {
      const complete =
        allowedPublicationDecisions.has(decision?.publicationDecision) &&
        decision?.publisherCode === 'TL' &&
        typeof decision?.decidedAt === 'string' &&
        !Number.isNaN(Date.parse(decision.decidedAt)) &&
        typeof decision?.summary === 'string' &&
        decision.summary.trim().length > 0;
      const untouched =
        decision?.publicationDecision === null &&
        decision?.publisherCode === null &&
        decision?.decidedAt === null &&
        decision?.summary === null;

      if (complete && decision.decisionState !== 'human_decided' && decision.decisionState !== 'existing_authority_reused') {
        decision.decisionState = 'human_decided';
        stateNormalized += 1;
        changed = true;
      } else if (untouched && decision.decisionState !== 'pending_human' && decision.decisionState !== 'existing_authority_reused') {
        decision.decisionState = 'pending_human';
        stateNormalized += 1;
        changed = true;
      }
    }
  }

  if (changed) fs.writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
}

if (bomNormalized === 0) console.log('✓ APS JSON encoding normalization: no UTF-8 BOM found.');
if (stateNormalized > 0) console.log(`✓ APS Human decision-state normalization synchronized ${stateNormalized} derived decisionState value(s).`);
else console.log('✓ APS Human decision-state normalization: no derived decisionState changes required.');
