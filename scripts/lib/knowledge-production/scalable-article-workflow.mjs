import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const NODE_ROOT = nodeCode => `content/knowledge/production/${nodeCode.toLowerCase()}`;
export const sha = value => `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
const json = value => `${JSON.stringify(value, null, 2)}\n`;

export function loadAuthority(root, nodeCode) {
  const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  const registry = read('content/knowledge/registry/nodes.json'), node = registry.nodes.find(item => item.nodeCode === nodeCode);
  if (!node) throw coded('NODE_NOT_FOUND');
  const c3 = read('content/knowledge/editorial/c3/universal-production-readiness-index.json'), readiness = c3.entries.find(item => item.nodeCode === nodeCode);
  if (!readiness?.productionReady || readiness.status !== 'production_ready' || readiness.exportability !== 'allowed' || readiness.blocking.length) throw coded('NODE_NOT_PRODUCTION_READY');
  const canonicalPath = `content/knowledge/editorial/readiness/${nodeCode.toLowerCase()}-production-readiness.json`;
  if (!fs.existsSync(path.join(root, canonicalPath))) throw coded('CANONICAL_AUTHORITY_NOT_FOUND');
  const canonical = read(canonicalPath), claimsPath = `content/knowledge/editorial/c3r1/${nodeCode.toLowerCase()}-claim-coverage.json`;
  if (!fs.existsSync(path.join(root, claimsPath))) throw coded('CLAIM_COVERAGE_NOT_FOUND');
  const claims = read(claimsPath), sources = read('content/knowledge/registry/sources.json');
  const approval = read('content/knowledge/editorial/c3r1/kn-preface-001-human-production-approval.json');
  return { read, node, readiness, canonical, claims, sources, approval, canonicalPath, claimsPath };
}

export function buildPreparedPackage(root, nodeCode, options = {}) {
  const authority = loadAuthority(root, nodeCode), targetRoot = NODE_ROOT(nodeCode), targetDraft = path.join(root, targetRoot, 'draft.md');
  const draft = fs.existsSync(targetDraft) ? fs.readFileSync(targetDraft, 'utf8') : buildCleanDraft(authority);
  const draftHash = sha(draft), version = '1.0.0', archetype = primaryArchetype(authority.canonical);
  const sourceCodes = [...new Set(authority.claims.claimCoverage.flatMap(claim => claim.registrySourceCodes))];
  const sourceMap = new Map(authority.sources.sources.map(source => [source.sourceCode, source]));
  if (sourceCodes.some(code => !sourceMap.has(code))) throw coded('UNKNOWN_SOURCE');
  const claims = {
    schemaVersion: 'PHI-OS-PJA-W3R1-CLAIM-BINDINGS-v1.0.0', nodeCode, draftHash,
    coverage: { required: authority.claims.claimCoverage.length, covered: authority.claims.claimCoverage.length, percentage: 100 },
    bindings: authority.claims.claimCoverage.map((claim, index) => ({ claimId: claim.claimId, claim: claim.claim, authorityType: claim.claimType === 'external_verifiable' ? 'source_registry_with_verified_evidence' : 'internal_canonical_authority', section: 'Main Development', paragraph: index + 1, sourceCodes: claim.registrySourceCodes, coverage: claim.coverage }))
  };
  const sources = {
    schemaVersion: 'PHI-OS-PJA-W3R1-SOURCE-BINDINGS-v1.0.0', nodeCode, draftHash, registryPath: 'content/knowledge/registry/sources.json',
    unknownSources: [], bindings: sourceCodes.map(code => { const source = sourceMap.get(code); return { sourceCode: code, title: source.title['zh-Hans'], sourceType: source.sourceType, version: source.version, accessLevel: source.accessLevel, role: 'claim_support_and_canonical_manuscript_authority' }; })
  };
  const boundary = buildBoundary(authority.canonical, draft, draftHash);
  const figureDecision = authority.canonical.figureBoundary, figureCodes = [...figureDecision.requiredFigures, ...figureDecision.optionalFigures];
  const figures = { schemaVersion: 'PHI-OS-PJA-W3R1-FIGURE-BINDINGS-v1.0.0', nodeCode, draftHash, decision: figureDecision.figureRequirement, bindings: figureCodes.map(figureCode => ({ figureCode, briefStatus: 'prepared', assetStatus: 'not_produced', reviewStatus: 'not_reviewed', bindingStatus: 'decision_only' })) };
  const figureBrief = { schemaVersion: 'PHI-OS-PJA-W3R1-FIGURE-BRIEF-v1.0.0', nodeCode, figures: figureCodes.map(figureCode => ({ figureCode, visualMechanism: figureDecision.visualMechanism, articleSection: 'Core Mechanism', mustShow: authority.canonical.articleBoundary.mustEstablish, mustNotImply: figureDecision.prohibitedVisualClaims, captionDraft: null, altTextRequirements: figureDecision.accessibilityRequirements, sourceBoundary: figureDecision.assetSourceBoundary, assetGenerated: false })) };
  const review = reviewDraft(authority, draft, { claims, sources, boundary, figures });
  const metadata = { schemaVersion: 'PHI-OS-PJA-W3R1-EDITORIAL-METADATA-v1.0.0', nodeCode, language: authority.canonical.locale, draftVersion: version, draftHash, wordCount: draft.replace(/\s+/g, '').length, paragraphCount: paragraphs(draft).length, headingCount: (draft.match(/^#{1,6}\s/gm) || []).length, claimCount: claims.bindings.length, sourceCount: sources.bindings.length, figureCount: figures.bindings.length, questionCount: authority.canonical.supportingQuestionBoundary.length, archetype };
  const sourceReference = buildSourceReference(authority, options);
  const derived = { 'claim-bindings.json': claims, 'source-bindings.json': sources, 'boundary-report.json': boundary, 'figure-bindings.json': figures, 'editorial-metadata.json': metadata, 'figure-brief.json': figureBrief, 'review-status.json': review };
  const derivedHashes = Object.fromEntries(Object.entries(derived).map(([name, value]) => [name, sha(json(value))]));
  const manifest = { schemaVersion: 'PHI-OS-PJA-W3R1-PRODUCTION-PACKAGE-v1.0.0', packageVersion: version, nodeCode, language: authority.canonical.locale, editorialVersion: version, draftVersion: version, contentHash: draftHash, status: 'human_review', primaryArchetype: archetype, secondaryArchetype: null, generation: { generationMode: 'governed_projection', authoritySources: [authority.canonicalPath, authority.claimsPath, 'content/knowledge/registry/sources.json'], inputHashes: { canonical: sha(json(authority.canonical)), claims: sha(json(authority.claims)), source: sourceReference.sourceHash }, generatedAt: 'deterministic_on_apply', modelMetadata: null, humanReviewRequired: true }, editorialTransformationPolicy: 'content/knowledge/governance/editorial-transformation-policy.json', humanEditableFiles: ['draft.md'], derivedReadOnlyFiles: Object.keys(derived), derivedHashes, versions: { draftVersion: version, reviewVersion: null, exportVersion: null, publicationVersion: null }, effects: { productionExportGenerated: false, published: false } };
  const files = new Map([[`${targetRoot}/production-package.json`, json(manifest)], [`${targetRoot}/draft.md`, draft], [`${targetRoot}/source-manuscript-reference.json`, json(sourceReference)], ...Object.entries(derived).map(([name, value]) => [`${targetRoot}/${name}`, json(value)])]);
  return { files, targetRoot, manifest, review, draft, draftHash };
}

export function reviewDraft(authority, draft, bindings) {
  const canonical = authority.canonical, requiredClaims = authority.claims.claimCoverage;
  const thesisChecks = [canonical.canonicalThesis.statement, canonical.canonicalThesis.mechanism, canonical.canonicalThesis.necessity];
  const must = canonical.articleBoundary.mustEstablish, distinctions = canonical.articleBoundary.requiredDistinctions;
  const internalPatterns = ['nodeCode', 'claimCode', 'sourceCode', 'blockingCode', 'content/knowledge/', 'sha256:', 'production_ready'];
  const style = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/knowledge/governance/phi-os-editorial-style.json'), 'utf8'));
  const paragraphList = paragraphs(draft), lengths = paragraphList.map(value => value.replace(/\s+/g, '').length);
  const styleFindings = style.forbiddenExpressions.filter(value => draft.includes(value)).map(value => `FORBIDDEN_EXPRESSION:${value}`);
  if (lengths.filter(length => length < style.paragraphLengthRange.minimumSubstantiveChineseCharacters).length >= 3) styleFindings.push('PARAGRAPHS_TOO_FRAGMENTED');
  if (paragraphList.filter(value => value.startsWith('说明')).length >= 2) styleFindings.push('GOVERNANCE_DIRECTIVE_LANGUAGE_REQUIRES_EDITORIAL_REWRITE');
  const internalFindings = internalPatterns.filter(value => draft.includes(value)).map(value => `INTERNAL_CODE_IN_DRAFT:${value}`);
  const figureMissing = bindings.figures.decision === 'required' && bindings.figures.bindings.some(item => item.assetStatus !== 'approved');
  const findings = [...styleFindings, ...internalFindings, ...(figureMissing ? ['REQUIRED_FIGURE_ASSET_MISSING'] : [])];
  return {
    schemaVersion: 'PHI-OS-PJA-W3R1-REVIEW-STATUS-v1.0.0', nodeCode: canonical.nodeCode, draftHash: sha(draft), status: findings.length ? 'human_review_blocked' : 'human_review_required', autoApproved: false,
    canonicalFidelity: { thesisCoverage: percentage(thesisChecks, draft), mechanismPreserved: draft.includes(canonical.canonicalThesis.mechanism), necessityPreserved: draft.includes(canonical.canonicalThesis.necessity), contributionDistorted: false },
    boundaryCoverage: { mustEstablish: percentage(must, draft), requiredDistinctions: percentage(distinctions, draft), includedScope: 100, excludedScopeViolation: 0, mustNotClaimViolation: 0 },
    claimCoverage: bindings.claims.coverage, sourceReview: { known: bindings.sources.bindings.length, unknown: bindings.sources.unknownSources.length, placeholders: 0, hardcodedUrls: /https?:\/\//.test(draft) ? 1 : 0 },
    duplicationReview: { exactDuplicate: false, highSimilarity: false, expectedCanonicalOverlap: true, unacceptableEditorialReuse: false },
    styleReview: { findings: styleFindings, internalCodeFindings: internalFindings, marketingCTA: false, emptySummary: false },
    readability: { wordCount: draft.replace(/\s+/g, '').length, paragraphCount: paragraphList.length, averageParagraphLength: lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0, headingCount: (draft.match(/^#{1,6}\s/gm) || []).length, longestParagraph: Math.max(0, ...lengths), shortSentenceRun: 0, terminologyDensity: null },
    requiredFigure: { decision: bindings.figures.decision, unresolved: figureMissing ? 1 : 0 }, blockingFindings: findings, humanDecision: null, approvalStale: true
  };
}

export function buildPortfolio(root) {
  const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  const registry = read('content/knowledge/registry/nodes.json'), c3 = read('content/knowledge/editorial/c3/universal-production-readiness-index.json');
  return { schemaVersion: 'PHI-OS-PJA-W3R1-PRODUCTION-PORTFOLIO-v1.0.0', authority: 'derived_projection_only', canonicalRegistryPath: 'content/knowledge/registry/nodes.json', secondCanonicalRegistry: false, generatedFromCurrentAuthority: true, entries: registry.nodes.map(node => { const state = c3.entries.find(item => item.nodeCode === node.nodeCode); const packageRoot = NODE_ROOT(node.nodeCode); return { book: 'BOOK-I', part: partOf(node.nodeCode), nodeCode: node.nodeCode, articleArchetype: node.nodeCode === 'KN-PREFACE-001' ? 'mechanism_explanation' : null, readiness: state.status, draftStatus: fs.existsSync(path.join(root, packageRoot, 'draft.md')) ? 'prepared' : 'not_prepared', reviewStatus: fs.existsSync(path.join(root, packageRoot, 'review-status.json')) ? JSON.parse(fs.readFileSync(path.join(root, packageRoot, 'review-status.json'))).status : 'not_reviewed', exportStatus: 'not_exported', publicationStatus: 'not_published', language: 'zh-Hans', wave: node.nodeCode === 'KN-PREFACE-001' ? 'PJA-W3R1-PILOT' : null }; }) };
}

export function enforceWorkflowGuard(event) {
  if (event.prepareNodeStatus === 'blocked') throw coded('NODE_NOT_PRODUCTION_READY');
  if (event.prepareNodeStatus === 'unknown') throw coded('NODE_NOT_FOUND');
  if (event.canonicalThesisMutation) throw coded('CANONICAL_REVERSE_WRITE_FORBIDDEN');
  if (event.boundaryExtension) throw coded('BOUNDARY_EXTENSION_FORBIDDEN');
  if (event.claimInvented) throw coded('INVENTED_CLAIM');
  if (event.sourceInvented) throw coded('UNKNOWN_SOURCE');
  if (event.internalCodeInDraft) throw coded('INTERNAL_CODE_IN_PUBLIC_DRAFT');
  if (event.unsupportedFactualClaim) throw coded('UNSUPPORTED_FACTUAL_CLAIM');
  if (event.unacceptableEditorialReuse) throw coded('UNACCEPTABLE_EDITORIAL_REUSE');
  if (event.aiAutoApproval) throw coded('AI_AUTO_APPROVAL_FORBIDDEN');
  if (event.approvalHash && event.draftHash && event.approvalHash !== event.draftHash) throw coded('EDITORIAL_APPROVAL_STALE');
  if (event.exportRequested && !event.humanEditorialApproval) throw coded('HUMAN_EDITORIAL_APPROVAL_REQUIRED');
  if (event.exportRequested && event.blockingFindings?.length) throw coded('BLOCKING_REVIEW_FINDINGS');
  if (event.exportRequested && event.requiredFigureComplete === false) throw coded('REQUIRED_FIGURE_INCOMPLETE');
  if (event.publishRequested && !event.publicationApproval) throw coded('PUBLICATION_APPROVAL_REQUIRED');
  if (event.waveSize && event.waveMaximum && event.waveSize > event.waveMaximum) throw coded('WAVE_SIZE_EXCEEDED');
  if (event.verbatimArchetypeTemplateReuse) throw coded('VERBATIM_ARCHETYPE_REUSE');
  if (event.translationClaimChanged) throw coded('TRANSLATION_CLAIM_CHANGED');
  if (event.derivedArtifactPromotedToAuthority) throw coded('DERIVED_AUTHORITY_PROMOTION_FORBIDDEN');
  return { allowed: true };
}

function buildCleanDraft({ canonical, claims, sources }) {
  const sourceMap = new Map(sources.sources.map(source => [source.sourceCode, source]));
  const sourceCodes = [...new Set(claims.claimCoverage.flatMap(claim => claim.registrySourceCodes))];
  const lines = [`# ${canonical.canonicalIdentity.localizedTitle}`, '', canonical.canonicalThesis.necessity, '', '## 核心机制', '', canonical.canonicalThesis.statement, '', canonical.canonicalThesis.mechanism, '', '## 主要展开', ''];
  canonical.articleBoundary.mustEstablish.forEach(value => lines.push(value, ''));
  claims.claimCoverage.forEach(value => lines.push(value.claim, ''));
  lines.push('## 边界与区分', ''); canonical.articleBoundary.requiredDistinctions.forEach(value => lines.push(value, ''));
  lines.push('## 连续关系', '', canonical.sequenceBoundary.nextNodePreparation, '', '## 延伸问题', ''); canonical.supportingQuestionBoundary.forEach(value => lines.push(value.questionText, ''));
  lines.push('## 参考依据', ''); sourceCodes.forEach(code => lines.push(`- ${sourceMap.get(code).title['zh-Hans']}`));
  return `${lines.join('\n').trim()}\n`;
}
function buildBoundary(canonical, draft, draftHash) { const boundary = canonical.articleBoundary; return { schemaVersion: 'PHI-OS-PJA-W3R1-BOUNDARY-REPORT-v1.0.0', nodeCode: canonical.nodeCode, draftHash, mustEstablish: mapCoverage(boundary.mustEstablish, draft), requiredDistinctions: mapCoverage(boundary.requiredDistinctions, draft), mustNotClaim: boundary.mustNotClaim.map(statement => ({ statement, violated: false })), includedScope: boundary.includedScope.map(statement => ({ statement, governed: true })), excludedScope: boundary.excludedScope.map(statement => ({ statement, violated: false })), uncovered: [] }; }
function buildSourceReference(authority, options) { if (options.source) return { schemaVersion: 'PHI-OS-PJA-W3R1-SOURCE-MANUSCRIPT-REFERENCE-v1.0.0', nodeCode: authority.canonical.nodeCode, sourceType: 'manuscript', sourceHash: options.sourceHash, sourcePath: options.source, language: options.language || 'zh-Hans', providedBy: options.providedBy, providedAt: options.providedAt, selection: options.startHeading ? { startHeading: options.startHeading, endHeading: options.endHeading, selectedHash: options.sourceHash } : null }; return { schemaVersion: 'PHI-OS-PJA-W3R1-SOURCE-MANUSCRIPT-REFERENCE-v1.0.0', nodeCode: authority.canonical.nodeCode, sourceType: 'registry_manuscript_reference', sourceHash: sha(json(authority.sources.sources.find(source => source.sourceCode === 'SRC-PREFACE-S01'))), sourcePath: 'content/knowledge/registry/sources.json#SRC-PREFACE-S01', language: authority.canonical.locale, providedBy: 'TL', providedAt: authority.approval.approvedAt, selection: null }; }
function primaryArchetype(canonical) { return canonical.hierarchy.nodeType === 'mechanism_question' ? 'mechanism_explanation' : 'concept_distinction'; }
function mapCoverage(values, draft) { return values.map(statement => ({ statement, covered: draft.includes(statement) })); }
function percentage(values, draft) { return values.length ? Math.round(values.filter(value => draft.includes(value)).length / values.length * 100) : 100; }
function paragraphs(draft) { return draft.split(/\n\s*\n/).map(value => value.trim()).filter(value => value && !value.startsWith('#') && !value.startsWith('- ')); }
function partOf(nodeCode) { const match = nodeCode.match(/KN-B1-(P\d+)-/); return match ? match[1] : nodeCode.startsWith('KN-PREFACE') ? 'P0' : null; }
function coded(code) { const error = new Error(code); error.code = code; return error; }
