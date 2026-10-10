import Ajv2020 from 'ajv/dist/2020.js';
import {
  ALLOWED_PACKAGE_STATUSES,
  CONTENT_FILES,
  FORBIDDEN_STATUSES,
  MEDIA_BRIEF_SCHEMA_VERSION,
  PACKAGE_FILES,
  PACKAGE_SCHEMA_VERSION,
  SCHEMA_VERSIONS
} from './production-config.mjs';
import { sha256 } from './checksum.mjs';
import {
  loadCanonicalContext,
  loadSchemas
} from './repository-loader.mjs';
import { finding } from './production-errors.mjs';
import { parsePackageJson, readPackage } from './package-reader.mjs';

const exactKeys = (value, keys) => (
  value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).sort().join('|') === [...keys].sort().join('|')
);
const duplicates = values => values.filter((value, index) => values.indexOf(value) !== index);
const hasForbiddenStatus = value => {
  if (typeof value === 'string') return FORBIDDEN_STATUSES.includes(value);
  if (Array.isArray(value)) return value.some(hasForbiddenStatus);
  return value && typeof value === 'object' && Object.values(value).some(hasForbiddenStatus);
};
const dangerous = value => {
  const serialized = JSON.stringify(value).toLowerCase();
  return [
    'rawhtml', '<script', '<iframe', 'javascript:', 'onerror=', 'onclick=',
    'data:text/html', 'base64,'
  ].find(token => serialized.includes(token));
};

function ajvInstance() {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictRequired: false,
    strictTypes: false
  });
  ajv.addFormat('date-time', value => !Number.isNaN(Date.parse(value)));
  ajv.addFormat('uri', value => {
    try {
      const url = new URL(value, 'https://getphios.com');
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  });
  return ajv;
}

export async function validatePackage(root, nodeCode, packagePath) {
  const errors = [];
  const warnings = [];
  const informationalFindings = [];
  let reader;
  try {
    reader = await readPackage(packagePath);
    for (const required of PACKAGE_FILES) {
      if (!reader.files.has(required)) {
        errors.push(finding('PACKAGE_FILE_MISSING', `Required file is missing: ${required}.`, required));
      }
    }
    if (errors.length) return result(false);
    const manifest = parsePackageJson(reader.files, 'package-manifest.json', 'PACKAGE_MANIFEST_INVALID');
    const articleName = CONTENT_FILES[0];
    const claimsName = CONTENT_FILES[1];
    const sourcesName = CONTENT_FILES[2];
    const reviewName = CONTENT_FILES[3];
    const mediaName = CONTENT_FILES[4];
    const article = parsePackageJson(reader.files, articleName, 'ARTICLE_SCHEMA_INVALID');
    const claimDossier = parsePackageJson(reader.files, claimsName, 'CLAIM_SCHEMA_INVALID');
    const sourceDossier = parsePackageJson(reader.files, sourcesName, 'SOURCE_SCHEMA_INVALID');
    const review = parsePackageJson(reader.files, reviewName, 'REVIEW_SCHEMA_INVALID');
    const media = parsePackageJson(reader.files, mediaName, 'MEDIA_BRIEF_SCHEMA_INVALID');
    const manifestKeys = [
      'packageType', 'packageSchemaVersion', 'nodeCode', 'locale',
      'articleSchemaVersion', 'claimSchemaVersion', 'sourceDossierSchemaVersion',
      'reviewSchemaVersion', 'mediaBriefSchemaVersion', 'files', 'generatedAt',
      'generatorType', 'status'
    ];
    if (
      !exactKeys(manifest, manifestKeys) ||
      manifest.packageType !== 'canonical_article_package' ||
      manifest.packageSchemaVersion !== PACKAGE_SCHEMA_VERSION ||
      !ALLOWED_PACKAGE_STATUSES.includes(manifest.status) ||
      !Array.isArray(manifest.files)
    ) {
      errors.push(finding('PACKAGE_MANIFEST_INVALID', 'Manifest contract is invalid.', 'package-manifest.json'));
    }
    if (manifest.nodeCode !== nodeCode) {
      errors.push(finding('PACKAGE_NODE_MISMATCH', `Manifest node ${manifest.nodeCode} does not match ${nodeCode}.`));
    }
    const locale = manifest.locale;
    const expectedVersions = {
      articleSchemaVersion: SCHEMA_VERSIONS.article,
      claimSchemaVersion: SCHEMA_VERSIONS.claim,
      sourceDossierSchemaVersion: SCHEMA_VERSIONS.source,
      reviewSchemaVersion: SCHEMA_VERSIONS.review,
      mediaBriefSchemaVersion: SCHEMA_VERSIONS.mediaBrief
    };
    for (const [key, version] of Object.entries(expectedVersions)) {
      if (manifest[key] !== version) {
        errors.push(finding('SCHEMA_VERSION_UNSUPPORTED', `${key} is unsupported: ${manifest[key]}.`));
      }
    }
    const listed = new Map((manifest.files || []).map(file => [file.path, file.sha256]));
    if (
      listed.size !== CONTENT_FILES.length ||
      CONTENT_FILES.some(file => !listed.has(file)) ||
      [...listed].some(([file]) => !CONTENT_FILES.includes(file))
    ) {
      errors.push(finding('PACKAGE_MANIFEST_INVALID', 'Manifest file list does not exactly match package content files.'));
    }
    for (const name of CONTENT_FILES) {
      if (listed.has(name) && listed.get(name) !== sha256(reader.files.get(name))) {
        errors.push(finding('PACKAGE_CHECKSUM_MISMATCH', `Checksum mismatch: ${name}.`, name));
      }
    }
    let context = null;
    try {
      context = await loadCanonicalContext(root, nodeCode, locale);
    } catch (error) {
      errors.push(finding(error.code || 'NODE_NOT_PRODUCTION_READY', error.message));
    }
    for (const [name, value] of [
      [articleName, article], [claimsName, claimDossier], [sourcesName, sourceDossier],
      [reviewName, review], [mediaName, media]
    ]) {
      if (value.nodeCode !== nodeCode) {
        errors.push(finding('PACKAGE_NODE_MISMATCH', `${name} nodeCode does not match ${nodeCode}.`, name));
      }
      if (value.locale !== locale) {
        errors.push(finding('PACKAGE_LOCALE_MISMATCH', `${name} locale does not match ${locale}.`, name));
      }
      const token = dangerous(value);
      if (token) errors.push(finding('CROSS_REFERENCE_INVALID', `${name} contains forbidden content: ${token}.`, name));
      if (hasForbiddenStatus(value)) {
        errors.push(finding('PACKAGE_STATUS_FORBIDDEN', `${name} contains approval or publication authority.`, name));
      }
    }
    const schemas = await loadSchemas(root);
    const ajv = ajvInstance();
    const validators = Object.fromEntries(Object.entries(schemas).map(([key, schema]) => (
      [key, ajv.compile(schema)]
    )));
    if (!validators.article(article)) {
      errors.push(finding('ARTICLE_SCHEMA_INVALID', ajv.errorsText(validators.article.errors), articleName));
    }
    if (
      !exactKeys(claimDossier, ['schemaVersion', 'nodeCode', 'locale', 'claimSetVersion', 'claims']) ||
      claimDossier.schemaVersion !== 'PHI-OS-KNOWLEDGE-CLAIM-DOSSIER-v1.0.0' ||
      !Array.isArray(claimDossier.claims)
    ) {
      errors.push(finding('CLAIM_SCHEMA_INVALID', 'Claim dossier wrapper is invalid.', claimsName));
    } else {
      for (const claim of claimDossier.claims) {
        if (!validators.claim(claim)) {
          errors.push(finding('CLAIM_SCHEMA_INVALID', ajv.errorsText(validators.claim.errors), claimsName));
        }
      }
    }
    if (
      !exactKeys(sourceDossier, ['schemaVersion', 'nodeCode', 'locale', 'sourceSetVersion', 'sources']) ||
      sourceDossier.schemaVersion !== 'PHI-OS-KNOWLEDGE-SOURCE-DOSSIER-v1.0.0' ||
      !Array.isArray(sourceDossier.sources)
    ) {
      errors.push(finding('SOURCE_SCHEMA_INVALID', 'Source dossier wrapper is invalid.', sourcesName));
    } else {
      for (const source of sourceDossier.sources) {
        if (!validators.source(source)) {
          errors.push(finding('SOURCE_SCHEMA_INVALID', ajv.errorsText(validators.source.errors), sourcesName));
        }
      }
    }
    if (!validators.review(review)) {
      errors.push(finding('REVIEW_SCHEMA_INVALID', ajv.errorsText(validators.review.errors), reviewName));
    }
    if (
      !exactKeys(media, ['schemaVersion', 'nodeCode', 'locale', 'figures']) ||
      media.schemaVersion !== MEDIA_BRIEF_SCHEMA_VERSION ||
      !Array.isArray(media.figures) ||
      media.figures.some(figure => !exactKeys(figure, [
        'figureCode', 'nodeCode', 'articleBlockCode', 'figureType', 'purpose',
        'visualDescription', 'requiredText', 'altText', 'locale', 'status'
      ]))
    ) {
      errors.push(finding('MEDIA_BRIEF_SCHEMA_INVALID', 'Media Brief contract is invalid.', mediaName));
    }
    const sections = article.sections || [];
    const blocks = sections.flatMap(section => section.blocks || []);
    const blockCodes = blocks.map(block => block.blockCode);
    if (duplicates(blockCodes).length) {
      errors.push(finding('CROSS_REFERENCE_INVALID', 'Article contains duplicate blockCode values.', articleName));
    }
    const claimCodes = claimDossier.claims?.map(claim => claim.claimCode) || [];
    if (duplicates(claimCodes).length) {
      errors.push(finding('CLAIM_SCHEMA_INVALID', 'Claim dossier contains duplicate claimCode values.', claimsName));
    }
    const sourceCodes = sourceDossier.sources?.map(source => source.sourceCode) || [];
    if (duplicates(sourceCodes).length) {
      errors.push(finding('SOURCE_SCHEMA_INVALID', 'Source dossier contains duplicate sourceCode values.', sourcesName));
    }
    for (const source of sourceDossier.sources || []) {
      if (
        source.review?.status === 'not_reviewed' ||
        source.supportEligibility === 'not_eligible_for_claim_support'
      ) {
        warnings.push(finding(
          'UNRESOLVED_SOURCE',
          `Source ${source.sourceCode} remains unresolved and does not count as verified support.`,
          sourcesName
        ));
      }
      const locator = source.locator || {};
      for (const value of Object.values(locator)) {
        if (typeof value === 'string' && (
          /^[A-Za-z]:[\\/]/.test(value) ||
          value.startsWith('/') ||
          /(?:token|password|secret|credential)=/i.test(value) ||
          /github\.com\/[^/]+\/[^/]+(?:\.git)?$/i.test(value) && /private/i.test(value)
        )) {
          errors.push(finding('SOURCE_SCHEMA_INVALID', `Source ${source.sourceCode} exposes a forbidden locator.`, sourcesName));
        }
      }
    }
    for (const claim of claimDossier.claims || []) {
      if (!blockCodes.includes(claim.scope?.articleBlockCode)) {
        errors.push(finding('CROSS_REFERENCE_INVALID', `Claim ${claim.claimCode} references an absent Article Block.`));
      }
      for (const support of claim.sourceSupport || []) {
        if (!sourceCodes.includes(support.sourceCode)) {
          errors.push(finding('CROSS_REFERENCE_INVALID', `Claim ${claim.claimCode} references absent Source ${support.sourceCode}.`));
        }
      }
      if (
        claim.claimType === 'externally_verifiable' &&
        claim.supportRequirement?.sourceRequired !== true
      ) {
        errors.push(finding('CLAIM_SCHEMA_INVALID', `External Claim ${claim.claimCode} cannot waive sources.`));
      }
      if (
        claim.supportRequirement?.sourceRequired &&
        !(claim.sourceSupport?.length)
      ) {
        errors.push(finding('CROSS_REFERENCE_INVALID', `Source-required Claim ${claim.claimCode} has no Source mapping.`));
      }
    }
    const figureBlocks = blocks.filter(block => block.type === 'figure');
    const figures = media.figures || [];
    for (const figure of figures) {
      if (
        figure.nodeCode !== nodeCode ||
        figure.locale !== locale ||
        !blockCodes.includes(figure.articleBlockCode)
      ) {
        errors.push(finding('CROSS_REFERENCE_INVALID', `Media figure ${figure.figureCode} has an invalid Node, locale, or Block reference.`));
      }
    }
    for (const block of figureBlocks) {
      if (!figures.some(figure => (
        figure.figureCode === block.assetCode &&
        figure.articleBlockCode === block.blockCode
      ))) {
        errors.push(finding('CROSS_REFERENCE_INVALID', `Figure Block ${block.blockCode} has no matching Media Brief.`));
      }
    }
    if (context) {
      const expectedPrevious = context.node.relationships.prerequisiteNodeCodes[0] || null;
      const expectedNext = context.node.relationships.nextNodeCodes[0] || null;
      if (
        article.connections?.previousNode !== expectedPrevious ||
        article.connections?.nextNode !== expectedNext
      ) {
        errors.push(finding('REGISTRY_RELATION_MISMATCH', 'Article Previous/Next Node differs from Registry.'));
      }
      if (
        article.slug !== context.localizedIdentity.slug ||
        article.displayQuestion !== context.localizedIdentity.displayQuestion
      ) {
        errors.push(finding('PACKAGE_NODE_MISMATCH', 'Article localized identity differs from Registry.'));
      }
    }
    if (
      review.articleVersion !== article.version ||
      review.claimSetVersion !== claimDossier.claimSetVersion ||
      review.sourceSetVersion !== sourceDossier.sourceSetVersion ||
      review.articleAssetCode !== article.assetCode
    ) {
      errors.push(finding('CROSS_REFERENCE_INVALID', 'Review version binding does not match Article/Claim/Source files.'));
    }
    informationalFindings.push({
      code: 'VALIDATION_BOUNDARY',
      message: 'Validation establishes structural validity and governance-compatible draft status only.'
    });
    return result(errors.length === 0, {
      locale,
      manifest,
      article,
      claimDossier,
      sourceDossier,
      review,
      media
    });
  } catch (error) {
    errors.push(finding(error.code || 'PACKAGE_FORMAT_UNSUPPORTED', error.message));
    return result(false);
  } finally {
    await reader?.cleanup();
  }

  function result(valid, parsed = null) {
    return {
      valid,
      nodeCode,
      locale: parsed?.manifest?.locale ?? null,
      packagePath,
      packageChecksum: reader?.packageChecksum ?? null,
      schemaVersions: parsed?.manifest ? {
        article: parsed.manifest.articleSchemaVersion,
        claim: parsed.manifest.claimSchemaVersion,
        source: parsed.manifest.sourceDossierSchemaVersion,
        review: parsed.manifest.reviewSchemaVersion,
        mediaBrief: parsed.manifest.mediaBriefSchemaVersion
      } : {},
      errors,
      warnings,
      informationalFindings,
      files: reader ? [...reader.files.keys()].sort() : [],
      crossReferences: valid ? 'consistent' : 'invalid',
      statusBoundary: {
        allowed: ALLOWED_PACKAGE_STATUSES,
        meaning: 'Structurally Valid; Governance-compatible Draft',
        notMeaning: ['Editorially Approved', 'Factually Verified', 'Publication Ready', 'Published']
      },
      parsed,
      sourceFiles: reader?.files ?? null
    };
  }
}
