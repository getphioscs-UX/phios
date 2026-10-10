import {
  ARTICLE_CONTENT_FILES,
  ARTICLE_PACKAGE_FILES,
  ARTICLE_PACKAGE_SCHEMA_VERSION,
  ARTICLE_STATES,
  stableJson
} from './article-package.mjs';
import { sha256 } from './checksum.mjs';

const roles = Object.freeze({
  'article.md': 'reader_draft',
  'article.json': 'structured_article_draft',
  'claim-ledger.json': 'claim_governance',
  'source-ledger.json': 'source_governance',
  'supporting-question-coverage.json': 'supporting_question_governance',
  'media-brief.json': 'media_contract'
});

const mediaTypes = Object.freeze({
  'article.md': 'text/markdown',
  'article.json': 'application/json',
  'claim-ledger.json': 'application/json',
  'source-ledger.json': 'application/json',
  'supporting-question-coverage.json': 'application/json',
  'media-brief.json': 'application/json'
});

export function buildPackageManifest({
  brief,
  articleCode,
  articleVersion,
  packageCode,
  generatorVersion,
  generatedAt,
  content
}) {
  const files = ARTICLE_CONTENT_FILES.map(file => {
    const bytes = Buffer.from(content.get(file));
    return {
      path: file,
      role: roles[file],
      required: true,
      mediaType: mediaTypes[file],
      sha256: sha256(bytes),
      sizeBytes: bytes.length
    };
  });
  return {
    schemaVersion: ARTICLE_PACKAGE_SCHEMA_VERSION,
    packageType: 'canonical_article_package',
    packageSchemaVersion: ARTICLE_PACKAGE_SCHEMA_VERSION,
    packageCode,
    canonicalNodeCode: brief.canonicalIdentity.canonicalNodeCode,
    nodeCode: brief.canonicalIdentity.canonicalNodeCode,
    articleCode,
    locale: brief.canonicalIdentity.locale,
    articleVersion,
    productionBriefVersion: brief.productionBriefVersion,
    productionBriefHash: brief.productionBriefHash,
    packageStatus: ARTICLE_STATES.package,
    status: ARTICLE_STATES.package,
    checksum: {
      algorithm: 'sha256',
      input: 'original_file_bytes'
    },
    requiredFiles: ARTICLE_PACKAGE_FILES,
    files,
    createdAt: generatedAt,
    generatorVersion
  };
}

export function attachManifest(content, manifest) {
  return new Map([
    ...content,
    ['package-manifest.json', stableJson(manifest)]
  ]);
}

