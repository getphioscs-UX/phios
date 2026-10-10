export const PRODUCTION_TOOL_VERSION = 'PJA-W2E-R1-v1.0.0-Frozen';
export const BRIEF_SCHEMA_VERSION = 'PHI-OS-KNOWLEDGE-PRODUCTION-BRIEF-v1.1.0';
export const PACKAGE_SCHEMA_VERSION = 'PHI-OS-KNOWLEDGE-ARTICLE-PACKAGE-v1.0.0';
export const MEDIA_BRIEF_SCHEMA_VERSION = 'PHI-OS-KNOWLEDGE-MEDIA-BRIEF-v1.0.0';
export const DEFAULT_LOCALE = 'zh-Hans';
export const DEFAULT_BRIEF_OUTPUT = 'dist/knowledge-production-briefs';
export const DEFAULT_VALIDATION_OUTPUT = 'dist/knowledge-package-validation';
export const DEFAULT_IMPORT_OUTPUT = 'dist/knowledge-package-imports';

export const PACKAGE_FILES = Object.freeze([
  'article.zh-Hans.json',
  'claims.zh-Hans.json',
  'source-dossier.zh-Hans.json',
  'review.zh-Hans.json',
  'media-brief.zh-Hans.json',
  'package-manifest.json'
]);

export const CONTENT_FILES = Object.freeze(PACKAGE_FILES.filter(
  file => file !== 'package-manifest.json'
));

export const ALLOWED_PACKAGE_STATUSES = Object.freeze([
  'draft',
  'ready_for_human_review',
  'changes_required'
]);

export const FORBIDDEN_STATUSES = Object.freeze([
  'approved',
  'publication_ready',
  'published',
  'human_approved',
  'editorially_approved'
]);

export const ZIP_LIMITS = Object.freeze({
  maximumArchiveBytes: 10 * 1024 * 1024,
  maximumExpandedBytes: 30 * 1024 * 1024,
  maximumFileBytes: 5 * 1024 * 1024,
  maximumFiles: 50,
  maximumDepth: 4
});

export const PROTECTED_PATHS = Object.freeze([
  'content/knowledge/registry',
  'content/knowledge/blueprints',
  'content/knowledge/schemas',
  'content/knowledge/editorial/schemas',
  'content/knowledge/governance',
  'docs/knowledge',
  'docs/pja'
]);

export const SCHEMA_PATHS = Object.freeze({
  article: 'content/knowledge/schemas/article-v2.schema.json',
  claim: 'content/knowledge/schemas/claim.schema.json',
  source: 'content/knowledge/schemas/source.schema.json',
  review: 'content/knowledge/schemas/article-review.schema.json'
});

export const SCHEMA_VERSIONS = Object.freeze({
  article: 'PHI-OS-KNOWLEDGE-ARTICLE-v2.0.0',
  claim: 'PHI-OS-KNOWLEDGE-CLAIM-v1.0.0',
  source: 'PHI-OS-KNOWLEDGE-SOURCE-v1.0.0',
  review: 'PHI-OS-KNOWLEDGE-ARTICLE-REVIEW-v1.0.0',
  mediaBrief: MEDIA_BRIEF_SCHEMA_VERSION
});
