import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const stable = value => JSON.stringify(value, null, 2) + '\n';
const hashValue = value => crypto.createHash('sha256').update(stable(value), 'utf8').digest('hex');
const readJson = (root, rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

const publicationPath = (locale, nodeCode) =>
  `content/knowledge/production/publications/${locale}/${nodeCode}/publication.v1.json`;

export function buildPublishedKnowledgeAuthority(root = process.cwd()) {
  const publicationRegistry = readJson(root, 'content/knowledge/production/registry/publication-registry.json');
  const records = [];

  for (const registryRecord of publicationRegistry.records ?? []) {
    const { locale, nodeCode } = registryRecord;
    const publication = readJson(root, publicationPath(locale, nodeCode));

    const contentReviewed = publication.review?.decision === 'accept';
    const approved = publication.approval?.decision === 'approve';
    const published = publication.decision === 'publish';

    if (!(contentReviewed && approved && published)) continue;

    const base = {
      authorityRecordCode: `PKA-${nodeCode}-${String(locale).toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`,
      nodeCode,
      locale,
      article: {
        articleCode: publication.article.articleCode,
        title: publication.article.title,
        summary: publication.article.summary ?? '',
        bodyMarkdown: publication.article.bodyMarkdown,
        version: publication.article.version,
        ...(publication.article.slug ? { slug: publication.article.slug } : {}),
        ...(publication.article.href ? { href: publication.article.href } : {})
      },
      eligibility: {
        contentReviewed: true,
        approved: true,
        published: true
      },
      lineage: {
        candidateCode: publication.candidate.candidateCode,
        candidateDigest: publication.candidate.candidateDigest,
        reviewCode: publication.review.reviewCode,
        reviewDigest: publication.review.reviewDigest,
        approvalCode: publication.approval.approvalCode,
        approvalDigest: publication.approval.approvalDigest,
        publicationCode: publication.publicationCode,
        publicationDigest: publication.publicationDigest
      },
      publicStatus: 'eligible_for_public_projection'
    };
    records.push({ ...base, authorityDigest: hashValue(base) });
  }

  records.sort((a,b) => a.nodeCode.localeCompare(b.nodeCode) || a.locale.localeCompare(b.locale));

  const registry = {
    authorityCode: 'PHI-OS-PUBLISHED-KNOWLEDGE-AUTHORITY',
    authorityVersion: '1.0.0',
    sourceOfTruth: 'Publication Packages',
    policy: {
      contentReviewedAndApprovedAndPublishedRequired: true,
      registryPresenceEqualsPublicAvailability: false,
      publicationPackageEqualsPublicProjection: false,
      localeAuthorityIndependent: true
    },
    recordCount: records.length,
    records
  };

  const articleFiles = Object.fromEntries(records.map(record => [
    `content/knowledge/public/authority/articles/${record.locale}/${record.nodeCode}.json`,
    record
  ]));

  return { registry, articleFiles };
}

export function writePublishedKnowledgeAuthority(root = process.cwd()) {
  const output = buildPublishedKnowledgeAuthority(root);
  const registryPath = path.join(root, 'content/knowledge/public/authority/published-knowledge-authority.json');
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  fs.writeFileSync(registryPath, stable(output.registry), 'utf8');
  for (const [rel, value] of Object.entries(output.articleFiles)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, stable(value), 'utf8');
  }
  return output;
}

export { stable, hashValue };
