import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildPublishedKnowledgeAuthority, stable, hashValue } from '../knowledge-public/published-authority-v1.mjs';
import { loadVapW1IntegrityRepair, shaText } from '../visual-article-production/published-knowledge-integrity-repair-v1.mjs';

const fail = (code, message) => Object.assign(new Error(`${code}: ${message}`), { code });
const readJson = (root, rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const normalizedSha = source => `sha256:${crypto.createHash('sha256').update(String(source).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8').digest('hex')}`;

export function buildApsPublishedKnowledgeAuthoritySuccessor(root = process.cwd()) {
  const repair = loadVapW1IntegrityRepair(root);
  if (repair?.work !== 'VAP-W1' || repair?.status !== 'APPLIED_PROJECTION_REPAIR') throw fail('APS7_VAP_W1_REPAIR_CONTRACT_INVALID', String(repair?.status));
  const historicalPublication = readJson(root, repair.target.publicationReference);
  if (historicalPublication.publicationDigest !== repair.historicalAuthority.publicationDigest) throw fail('APS7_VAP_W1_HISTORICAL_PUBLICATION_DRIFT', historicalPublication.publicationDigest);
  if (historicalPublication.candidate?.candidateDigest !== repair.historicalAuthority.candidateDigest) throw fail('APS7_VAP_W1_HISTORICAL_CANDIDATE_DRIFT', String(historicalPublication.candidate?.candidateDigest));
  if (historicalPublication.review?.reviewDigest !== repair.historicalAuthority.reviewDigest) throw fail('APS7_VAP_W1_HISTORICAL_REVIEW_DRIFT', String(historicalPublication.review?.reviewDigest));
  if (historicalPublication.approval?.approvalDigest !== repair.historicalAuthority.approvalDigest) throw fail('APS7_VAP_W1_HISTORICAL_APPROVAL_DRIFT', String(historicalPublication.approval?.approvalDigest));
  if (`sha256:${shaText(historicalPublication.article?.summary ?? '')}` !== repair.finding.originalSummarySha256) throw fail('APS7_VAP_W1_HISTORICAL_SUMMARY_DRIFT', 'article.summary');
  const replacement = repair.replacement?.summary ?? '';
  if (`sha256:${shaText(replacement)}` !== repair.replacement?.summarySha256) throw fail('APS7_VAP_W1_REPLACEMENT_DIGEST_INVALID', 'replacement.summary');
  if (!historicalPublication.article?.bodyMarkdown?.includes(replacement)) throw fail('APS7_VAP_W1_REPLACEMENT_NOT_EXTRACTIVE', 'replacement.summary');

  // The historical repair froze its source evidence. APS successor permits only additive Publication Registry records;
  // every other recorded immutable file remains byte-identical.
  for (const [relative, expected] of Object.entries(repair.historicalAuthority?.immutableFileDigests ?? {})) {
    if (relative === 'content/knowledge/production/registry/publication-registry.json') continue;
    const actual = normalizedSha(fs.readFileSync(path.join(root, relative), 'utf8'));
    if (actual !== expected) throw fail('APS7_VAP_W1_HISTORICAL_FILE_MUTATED', `${relative}:${actual}`);
  }

  const output = buildPublishedKnowledgeAuthority(root);
  const target = output.registry.records.find(record => record.nodeCode === repair.target.nodeCode && record.locale === repair.target.locale);
  if (!target) throw fail('APS7_VAP_W1_AUTHORITY_TARGET_MISSING', `${repair.target.nodeCode}:${repair.target.locale}`);
  if (`sha256:${shaText(target.article.summary ?? '')}` !== repair.finding.originalSummarySha256) throw fail('APS7_VAP_W1_BASE_AUTHORITY_SUMMARY_DRIFT', target.authorityRecordCode);
  const beforeAuthorityDigest = target.authorityDigest;
  target.article.summary = replacement;
  const baseRecord = structuredClone(target); delete baseRecord.authorityDigest;
  target.authorityDigest = hashValue(baseRecord);
  const articlePath = `content/knowledge/public/authority/articles/${target.locale}/${target.nodeCode}.json`;
  output.articleFiles[articlePath] = structuredClone(target);
  const index = output.registry.records.findIndex(record => record.authorityRecordCode === target.authorityRecordCode);
  output.registry.records[index] = structuredClone(target);
  return { ...output, repairResult: { targetAuthorityRecordCode: target.authorityRecordCode, beforeAuthorityDigest, afterAuthorityDigest: target.authorityDigest } };
}

export function writeApsPublishedKnowledgeAuthoritySuccessor(root = process.cwd()) {
  const output = buildApsPublishedKnowledgeAuthoritySuccessor(root);
  const registryPath = path.join(root, 'content/knowledge/public/authority/published-knowledge-authority.json');
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  fs.writeFileSync(registryPath, stable(output.registry), 'utf8');
  for (const [relative, value] of Object.entries(output.articleFiles)) {
    const full = path.join(root, relative);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, stable(value), 'utf8');
  }
  return output;
}
