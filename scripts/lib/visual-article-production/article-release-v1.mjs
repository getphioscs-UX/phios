import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

export const ROOT = process.cwd();
export const RELEASE_ROOT = 'content/production/visual-article/release';
export const releasePath = (nodeCode, locale) => `${RELEASE_ROOT}/candidates/VAC-${nodeCode}-${locale.toUpperCase()}-v1.json`;

const PATHS = Object.freeze({
  article: 'content/knowledge/public/authority/articles/zh-Hans/KN-PREFACE-001.json',
  figure: 'content/production/car/published/PUBLISHED-ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-001.json',
  presentation: 'content/production/cpr/presentations/PRESENTATION-ARTICLE-KN-PREFACE-001-ZH-HANS-v1.json',
  meaningMap: 'content/production/canonical-meaning/authority/CM-KNOWLEDGE-AUTHORITY-KN-PREFACE-001-v1.json',
  carBrief: 'content/production/car/briefs/CAB-KN-PREFACE-001-MECHANISM-ZH-HANS-002.json',
  figureCandidate: 'content/production/car/candidates/CAR-CAND-KN-PREFACE-001-MECHANISM-ZH-HANS-002/candidate.v1.json',
  carActivation: 'content/production/car/activation/vap-w12-w19-car-production-activation-v1.json',
  carBridge: 'content/production/car/authority/car-production-meaning-bridge-v1.json',
  pdsAcceptance: 'content/production/visual-article/acceptance/vap-w22-w24-cpr-pds-production-presentation-acceptance-v1.json'
});

const read = (root, relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const exists = (root, relative) => fs.existsSync(path.join(root, relative));
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
export const digest = value => crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export const fileDigest = (root, relative) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');

function productionMeaningMappings(map, nodeCode) {
  if (map.productionStatus !== 'active' && map.productionStatus !== 'production') return [];
  return (map.mappings || []).filter(record => {
    if (record.status !== 'active' && record.status !== 'production') return false;
    const authority = record.knowledgeAuthority || {};
    return [...(authority.primaryNodeCodes || []), ...(authority.supportingNodeCodes || [])].includes(nodeCode);
  });
}

export function buildVisualArticleReleaseCandidate({ root = ROOT, nodeCode = 'KN-PREFACE-001', locale = 'zh-Hans' } = {}) {
  if (nodeCode !== 'KN-PREFACE-001' || locale !== 'zh-Hans') throw new Error('VAP_RELEASE_PILOT_SCOPE_UNSUPPORTED');
  const article = read(root, PATHS.article);
  const figure = read(root, PATHS.figure);
  const presentation = read(root, PATHS.presentation);
  const pds = read(root, PATHS.pdsAcceptance);
  const meaningMap = read(root, PATHS.meaningMap);
  const carBrief = read(root, PATHS.carBrief);
  const figureCandidate = read(root, PATHS.figureCandidate);
  const carActivation = read(root, PATHS.carActivation);
  const bridge = read(root, PATHS.carBridge);
  const mappings = productionMeaningMappings(meaningMap, nodeCode);
  const productionMeaningCodes = mappings.map(record => record.meaningCode).sort();
  const carMeaningCodes = [...carBrief.meaningReferences].sort();
  const fixtureOrBridgeMeaning = bridge.bindings.some(binding => (
    binding.nodeCode === nodeCode &&
    carBrief.meaningReferences.includes(binding.meaningCode) &&
    (binding.sourceMeaningPath.includes('/fixtures/') || binding.authorityMode.includes('bridge'))
  ));
  const blockers = [];
  if (!(article.eligibility?.approved && article.eligibility?.published)) blockers.push('ARTICLE_NOT_APPROVED_AND_PUBLISHED');
  if (figure.publicationState !== 'published') blockers.push('PUBLISHED_FIGURE_MISSING');
  if (presentation.renderState !== 'ready_for_render') blockers.push('CPR_PRESENTATION_NOT_READY');
  if (pds.status !== 'ACCEPTED_CPR_PRODUCTION_PRESENTATION_ACTIVE') blockers.push('PDS_ACCEPTANCE_MISSING');
  if (!/^\/articles\/[a-z0-9-]+$/.test(article.article?.href || '')) blockers.push('PUBLIC_HREF_INVALID');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.article?.slug || '')) blockers.push('PUBLIC_SLUG_INVALID');
  if (meaningMap.productionStatus === 'validation_only') blockers.push('MEANING_KNOWLEDGE_MAP_VALIDATION_ONLY');
  if (mappings.length === 0) blockers.push('PRODUCTION_MEANING_KNOWLEDGE_MAPPING_MISSING');
  if (fixtureOrBridgeMeaning) blockers.push('FIXTURE_OR_LEGACY_BRIDGE_MEANING_FORBIDDEN');
  if (JSON.stringify(productionMeaningCodes) !== JSON.stringify(carMeaningCodes)) blockers.push('CAR_BRIEF_PRODUCTION_MEANING_REFERENCES_STALE');
  const successorCandidateValid = figureCandidate.assetBriefCode === carBrief.briefCode && figureCandidate.assetBriefDigest === carBrief.briefDigest;
  const successorPublished = carActivation.pilot?.publishedAssetCode && carActivation.pilot?.candidateCode === figureCandidate.candidateCode;
  if (!successorCandidateValid) blockers.push('FIGURE_CANDIDATE_MEANING_LINEAGE_INVALID');
  if (successorCandidateValid && carActivation.pilot?.reviewCode === null) blockers.push('HUMAN_ASSET_REVIEW_REQUIRED');
  else if (successorCandidateValid && carActivation.pilot?.approvalCode === null) blockers.push('HUMAN_ASSET_APPROVAL_REQUIRED');
  else if (successorCandidateValid && !successorPublished) blockers.push('SUCCESSOR_PUBLISHED_FIGURE_REQUIRED');
  if (!exists(root, figure.publicSrc.replace(/^\//, ''))) blockers.push('PUBLIC_ASSET_BINARY_MISSING');
  const payload = {
    schemaVersion: 'PHI-OS-VISUAL-ARTICLE-RELEASE-CANDIDATE-v1.0.0',
    releaseCandidateCode: `VAC-${nodeCode}-${locale.toUpperCase()}-v1`,
    work: 'VAP-W25', phase: 'VAP-F_ARTICLE_RELEASE', nodeCode, locale,
    status: blockers.length ? (blockers.includes('HUMAN_ASSET_REVIEW_REQUIRED') ? 'AWAITING_HUMAN_ASSET_REVIEW' : blockers.includes('HUMAN_ASSET_APPROVAL_REQUIRED') ? 'AWAITING_HUMAN_ASSET_APPROVAL' : 'BLOCKED_FIGURE_RELEASE_LINEAGE') : 'READY_FOR_RELEASE',
    gates: {
      articleApproved: article.eligibility?.approved === true,
      articlePublicationReady: article.eligibility?.published === true,
      figureRequired: true,
      publishedAssetExists: figure.publicationState === 'published',
      cprPresentationExists: presentation.renderState === 'ready_for_render',
      pdsValidationPassed: pds.status === 'ACCEPTED_CPR_PRODUCTION_PRESENTATION_ACTIVE',
      localeValid: article.locale === locale && figure.carPublicationRecord?.locale === locale && presentation.locale === locale,
      publicSlugValid: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.article?.slug || ''),
      productionMeaningMappingValid: mappings.length > 0,
      carBriefMeaningReferencesValid: mappings.length > 0 && !fixtureOrBridgeMeaning && JSON.stringify(productionMeaningCodes) === JSON.stringify(carMeaningCodes),
      figureCandidateMeaningLineageValid: successorCandidateValid,
      humanAssetReviewPassed: carActivation.pilot?.reviewDecision === 'accept',
      humanAssetApprovalPassed: carActivation.pilot?.approvalDecision === 'approved',
      publishedFigureMeaningLineageValid: Boolean(successorPublished)
    },
    authorityReferences: {
      article: { path: PATHS.article, digest: fileDigest(root, PATHS.article) },
      figure: { path: PATHS.figure, digest: fileDigest(root, PATHS.figure) },
      presentation: { path: PATHS.presentation, digest: fileDigest(root, PATHS.presentation) },
      pdsAcceptance: { path: PATHS.pdsAcceptance, digest: fileDigest(root, PATHS.pdsAcceptance) },
      meaningKnowledgeMap: { path: PATHS.meaningMap, digest: fileDigest(root, PATHS.meaningMap), productionStatus: meaningMap.productionStatus },
      carBrief: { path: PATHS.carBrief, digest: fileDigest(root, PATHS.carBrief), meaningReferences: carBrief.meaningReferences }
      ,figureCandidate: { path: PATHS.figureCandidate, digest: fileDigest(root, PATHS.figureCandidate), candidateCode: figureCandidate.candidateCode, candidateDigest: figureCandidate.candidateDigest }
    },
    blockers,
    downstream: { w26AuthorityProjectionExecuted: false, w27WebsiteReleaseExecuted: false, w28ProductionAcceptanceExecuted: false, w29FreezeExecuted: false },
    governance: { checkerWritesState: false, fixtureMeaningAllowed: false, legacyBridgeMeaningAllowed: false, humanMeaningSelectionRequired: true }
  };
  return { ...payload, releaseCandidateDigest: digest(payload) };
}

export function validateVisualArticleReleaseCandidate(candidate, { requireReady = false } = {}) {
  const copy = { ...candidate }; delete copy.releaseCandidateDigest;
  if (candidate.releaseCandidateDigest !== digest(copy)) throw new Error('VAP_RELEASE_CANDIDATE_DIGEST_INVALID');
  if (candidate.governance?.fixtureMeaningAllowed !== false || candidate.governance?.legacyBridgeMeaningAllowed !== false) throw new Error('VAP_RELEASE_MEANING_BOUNDARY_INVALID');
  if (candidate.status === 'READY_FOR_RELEASE' && !Object.values(candidate.gates).every(Boolean)) throw new Error('VAP_RELEASE_READY_WITH_FAILED_GATE');
  if (requireReady && candidate.status !== 'READY_FOR_RELEASE') {
    const error = new Error(`VAP_RELEASE_BLOCKED:${candidate.blockers.join(',')}`); error.code = 'VAP_RELEASE_BLOCKED'; throw error;
  }
  return candidate;
}

export async function writeVisualArticleReleaseCandidate({ root = ROOT, ...scope } = {}) {
  const candidate = buildVisualArticleReleaseCandidate({ root, ...scope });
  const relative = releasePath(candidate.nodeCode, candidate.locale);
  const target = path.join(root, relative); await fsp.mkdir(path.dirname(target), { recursive: true });
  await fsp.writeFile(target, `${JSON.stringify(candidate, null, 2)}\n`, 'utf8');
  return { candidate, path: relative };
}

export function releaseVisualArticle(options = {}) {
  const candidate = buildVisualArticleReleaseCandidate(options);
  validateVisualArticleReleaseCandidate(candidate, { requireReady: true });
  throw new Error('VAP_RELEASE_WRITER_NOT_ACTIVATED_UNTIL_W25_READY');
}
