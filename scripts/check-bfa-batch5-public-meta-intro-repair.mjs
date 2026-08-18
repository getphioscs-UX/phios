import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { approvalIsCurrent } from './lib/bilingual-final-approval/bfa-runtime-v1.mjs';
import { activeEditorialRevisions } from './lib/article-editorial-revision/article-editorial-revision-v1.mjs';

const root = process.cwd(), batch = 'BATCH-005';
const read = r => JSON.parse(fs.readFileSync(path.join(root, r), 'utf8')), exists = r => fs.existsSync(path.join(root, r));
const review = read(`content/production/bilingual-final-approval/${batch}/review-data.json`);
const source = read('content/production/bilingual-final-approval/progression-v2/composition-production/BATCH-005-article-composition-content-v1.json');
const packageMap = new Map(review.entries.map(x => [x.nodeCode, x.package]));
const approvedUnits = new Map();
const approvalDir = `content/production/bilingual-final-approval/${batch}/approvals`;
if (exists(approvalDir)) for (const f of fs.readdirSync(path.join(root, approvalDir)).filter(x => x.endsWith('.json'))) {
  const a = read(`${approvalDir}/${f}`), pkg = packageMap.get(a.nodeCode);
  if (pkg && a.decision === 'approve_for_publication' && approvalIsCurrent(a, pkg)) approvedUnits.set(pkg.articleUnitCode, pkg);
}
const revisions = activeEditorialRevisions(root);
const revisionKey = new Set(revisions.map(r => `${r.articleUnitCode}:${r.locale}`));
const forbidden = /(Canonical Nodes?|Article Composition|索引节点|This article composes|depth through composition|one thin article per indexed node)/i;
let cleanSourceUnits = 0, historicalOverlayUnits = 0;
for (const [code, c] of Object.entries(source.content)) {
  const zhDirty = forbidden.test(c.zh.body), enDirty = forbidden.test(c.en.body);
  if (!zhDirty && !enDirty) { cleanSourceUnits++; continue; }
  assert(approvedUnits.has(code), `${code}: dirty source is allowed only as immutable already-approved historical package input`);
  assert.equal(revisionKey.has(`${code}:zh-Hans`), true, `${code}: zh-Hans public editorial revision required`);
  assert.equal(revisionKey.has(`${code}:en`), true, `${code}: en public editorial revision required`);
  historicalOverlayUnits++;
}
for (const r of revisions) {
  const authority = read(`content/knowledge/public/authority/articles/${r.locale}/${r.nodeCode}.json`);
  assert.equal(forbidden.test(authority.article.bodyMarkdown), false, `${r.revisionCode}: authority body still leaks production meta`);
  const visual = read(`content/knowledge/public/visual-articles/${r.locale}/${authority.article.slug}.json`);
  assert.equal(forbidden.test(JSON.stringify(visual.sections)), false, `${r.revisionCode}: public visual article still leaks production meta`);
}
assert.equal(cleanSourceUnits + historicalOverlayUnits, 24);
assert.equal(historicalOverlayUnits, 5);
assert.equal(revisions.length, 10);
console.log(`✓ BATCH-005 public composition meta-purity passed: ${cleanSourceUnits} source units clean; ${historicalOverlayUnits} immutable approved source units corrected by governed bilingual public editorial overlays.`);
console.log('✓ Canonical Node / Article Composition production metadata is absent from all current customer-facing Batch-005 article bodies.');
