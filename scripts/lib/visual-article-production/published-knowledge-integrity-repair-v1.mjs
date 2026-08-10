import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildPublishedKnowledgeAuthority, stable, hashValue } from '../knowledge-public/published-authority-v1.mjs';

const REPAIR_PATH = 'content/production/visual-article/repairs/vap-w1-published-knowledge-integrity-repair-v1.json';
const shaText = value => crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
const readJson = (root, rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const fail = (code, message) => Object.assign(new Error(`${code}: ${message}`), { code });

export function loadVapW1IntegrityRepair(root = process.cwd()) {
  return readJson(root, REPAIR_PATH);
}

export function validateVapW1IntegrityRepair(root = process.cwd(), repair = loadVapW1IntegrityRepair(root)) {
  const errors = [];
  const add = (code, message) => errors.push({ code, message });
  if (repair?.work !== 'VAP-W1') add('VAP_W1_REPAIR_WORK_INVALID', String(repair?.work));
  if (repair?.status !== 'APPLIED_PROJECTION_REPAIR') add('VAP_W1_REPAIR_STATUS_INVALID', String(repair?.status));
  if (repair?.target?.nodeCode !== 'KN-PREFACE-001' || repair?.target?.locale !== 'zh-Hans' || repair?.target?.field !== 'article.summary') add('VAP_W1_TARGET_INVALID', JSON.stringify(repair?.target));
  const publication = readJson(root, repair.target.publicationReference);
  if (publication.publicationDigest !== repair.historicalAuthority.publicationDigest) add('VAP_W1_PUBLICATION_DIGEST_DRIFT', publication.publicationDigest);
  if (publication.candidate?.candidateDigest !== repair.historicalAuthority.candidateDigest) add('VAP_W1_CANDIDATE_DIGEST_DRIFT', String(publication.candidate?.candidateDigest));
  if (publication.review?.reviewDigest !== repair.historicalAuthority.reviewDigest) add('VAP_W1_REVIEW_DIGEST_DRIFT', String(publication.review?.reviewDigest));
  if (publication.approval?.approvalDigest !== repair.historicalAuthority.approvalDigest) add('VAP_W1_APPROVAL_DIGEST_DRIFT', String(publication.approval?.approvalDigest));
  if (`sha256:${shaText(publication.article?.summary ?? '')}` !== repair.finding.originalSummarySha256) add('VAP_W1_ORIGINAL_SUMMARY_DIGEST_DRIFT', 'publication article.summary');
  if (!/^[a-f0-9]{64}\s{2,}\S+/m.test(publication.article?.summary ?? '')) add('VAP_W1_ARTIFACT_PATTERN_NOT_PRESENT', 'historical publication summary no longer matches recorded artifact');
  const replacement = repair.replacement?.summary ?? '';
  if (`sha256:${shaText(replacement)}` !== repair.replacement?.summarySha256) add('VAP_W1_REPLACEMENT_DIGEST_INVALID', 'replacement summary');
  if (`sha256:${shaText(publication.article?.bodyMarkdown ?? '')}` !== repair.replacement?.approvedBodySha256) add('VAP_W1_APPROVED_BODY_DIGEST_DRIFT', 'bodyMarkdown');
  if (!publication.article?.bodyMarkdown?.includes(replacement)) add('VAP_W1_REPLACEMENT_NOT_EXTRACTIVE', 'replacement must be exact substring of approved publication body');
  if (/^[a-f0-9]{64}\s{2,}\S+/m.test(replacement)) add('VAP_W1_REPLACEMENT_STILL_CONTAMINATED', 'replacement summary');
  if (repair.replacement?.newKnowledge !== false || repair.replacement?.newClaim !== false || repair.replacement?.semanticMutation !== false) add('VAP_W1_REPAIR_SEMANTIC_BOUNDARY_INVALID', 'repair must not create knowledge, claims or semantic mutation');
  for (const [relative, expected] of Object.entries(repair.historicalAuthority?.immutableFileDigests ?? {})) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const actual = `sha256:${crypto.createHash('sha256').update(source, 'utf8').digest('hex')}`;
    if (actual !== expected) add('VAP_W1_HISTORICAL_FILE_MUTATED', `${relative}: ${actual}`);
  }
  return { valid: errors.length === 0, errors, publication, repair };
}

export function buildVapW1RepairedPublishedKnowledgeAuthority(root = process.cwd()) {
  const repair = loadVapW1IntegrityRepair(root);
  const validation = validateVapW1IntegrityRepair(root, repair);
  if (!validation.valid) throw fail('VAP_W1_REPAIR_INVALID', JSON.stringify(validation.errors));
  const base = buildPublishedKnowledgeAuthority(root);
  const output = structuredClone(base);
  const target = output.registry.records.find(record => record.nodeCode === repair.target.nodeCode && record.locale === repair.target.locale);
  if (!target) throw fail('VAP_W1_AUTHORITY_TARGET_MISSING', `${repair.target.nodeCode}:${repair.target.locale}`);
  if (`sha256:${shaText(target.article.summary ?? '')}` !== repair.finding.originalSummarySha256) throw fail('VAP_W1_BASE_AUTHORITY_SUMMARY_DRIFT', target.authorityRecordCode);
  const beforeAuthorityDigest = target.authorityDigest;
  target.article.summary = repair.replacement.summary;
  const baseRecord = structuredClone(target);
  delete baseRecord.authorityDigest;
  target.authorityDigest = hashValue(baseRecord);
  const articlePath = `content/knowledge/public/authority/articles/${target.locale}/${target.nodeCode}.json`;
  output.articleFiles[articlePath] = structuredClone(target);
  const index = output.registry.records.findIndex(record => record.authorityRecordCode === target.authorityRecordCode);
  output.registry.records[index] = structuredClone(target);
  return {
    ...output,
    repair,
    repairResult: {
      targetAuthorityRecordCode: target.authorityRecordCode,
      beforeAuthorityDigest,
      afterAuthorityDigest: target.authorityDigest,
      beforeSummarySha256: repair.finding.originalSummarySha256,
      afterSummarySha256: repair.replacement.summarySha256
    }
  };
}

export function writeVapW1RepairedPublishedKnowledgeAuthority(root = process.cwd()) {
  const output = buildVapW1RepairedPublishedKnowledgeAuthority(root);
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

export { REPAIR_PATH, shaText };
