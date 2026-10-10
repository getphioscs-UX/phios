import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const W3A_ROOT = 'content/knowledge/production/editorial-packages/kn-preface-001';
export const W3A_FILES = {
  manifest: `${W3A_ROOT}/production-package.json`, draft: `${W3A_ROOT}/draft.md`,
  claims: `${W3A_ROOT}/claim-bindings.json`, sources: `${W3A_ROOT}/source-bindings.json`,
  boundary: `${W3A_ROOT}/boundary-report.json`, figures: `${W3A_ROOT}/figure-bindings.json`,
  metadata: `${W3A_ROOT}/editorial-metadata.json`
};

const json = value => `${JSON.stringify(value, null, 2)}\n`;
const sha = value => `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
const anchor = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function buildEditorialPackage(root) {
  const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  const canonical = read('content/knowledge/editorial/readiness/kn-preface-001-production-readiness.json');
  const coverage = read('content/knowledge/editorial/c3r1/kn-preface-001-claim-coverage.json');
  const evidence = read('content/knowledge/editorial/c3r1/kn-preface-001-evidence-traceability.json');
  const c3 = read('content/knowledge/editorial/c3/assessments/kn-preface-001-production-readiness.json');
  const registry = read('content/knowledge/registry/sources.json');
  if (!c3.productionReady || c3.status !== 'production_ready') throw coded('NODE_NOT_PRODUCTION_READY');
  const sourceMap = new Map(registry.sources.map(source => [source.sourceCode, source]));
  const claims = coverage.claimCoverage;
  const sourceCodes = [...new Set(claims.flatMap(claim => claim.registrySourceCodes))];
  for (const code of sourceCodes) if (!sourceMap.has(code)) throw coded('SOURCE_NOT_IN_REGISTRY');
  const boundary = canonical.articleBoundary;
  const questions = canonical.supportingQuestionBoundary;
  const figure = canonical.figureBoundary;
  const title = canonical.canonicalIdentity.localizedTitle;
  const lead = canonical.canonicalThesis.necessity;
  const thesis = canonical.canonicalThesis.statement;
  const lines = [`# ${title}`, '', '## Lead', '', lead, '', '## Canonical Thesis', '', thesis, '', '## Body', ''];
  claims.forEach((claim, index) => lines.push(`### Paragraph ${index + 1}`, '', claim.claim, '', `> Qualification: ${claim.qualification}`, ''));
  lines.push('## Supporting Questions', '');
  questions.forEach(question => lines.push(`### ${question.questionCode}`, '', question.questionText, '', `Treatment: ${question.articleTreatment}`, ''));
  lines.push('## References', '');
  sourceCodes.forEach(code => { const source = sourceMap.get(code); lines.push(`- ${code} — ${source.title['zh-Hans']} (${source.version})`); });
  lines.push('', '## Boundary Notes', '');
  for (const [label, values] of [['mustEstablish', boundary.mustEstablish], ['mustNotClaim', boundary.mustNotClaim], ['includedScope', boundary.includedScope], ['excludedScope', boundary.excludedScope]]) {
    lines.push(`### ${label}`, ''); values.forEach(value => lines.push(`- ${value}`)); lines.push('');
  }
  const draft = `${lines.join('\n').trim()}\n`;
  const contentHash = sha(draft);
  const version = '1.0.0';
  const claimBindings = {
    schemaVersion: 'PHI-OS-PJA-W3A-CLAIM-BINDINGS-v1.0.0', nodeCode: canonical.nodeCode, editorialVersion: version,
    coverage: { total: claims.length, bound: claims.length, percentage: 100 },
    bindings: claims.map((claim, index) => ({ claimId: claim.claimId, section: 'Body', paragraph: index + 1, claim: claim.claim, sourceCodes: claim.registrySourceCodes, evidenceAuthorityIds: evidence.chains.find(chain => chain.claimId === claim.claimId)?.verificationAuthorityIds || [], coverage: claim.coverage }))
  };
  const sourceBindings = {
    schemaVersion: 'PHI-OS-PJA-W3A-SOURCE-BINDINGS-v1.0.0', nodeCode: canonical.nodeCode, editorialVersion: version,
    registryPath: 'content/knowledge/registry/sources.json', bindings: sourceCodes.map(code => { const source = sourceMap.get(code); return { sourceCode: code, sourceType: source.sourceType, title: source.title['zh-Hans'], version: source.version, accessLevel: source.accessLevel, publicExcerptPolicy: source.publicExcerptPolicy, sections: ['Body', 'References'] }; })
  };
  const boundaryReport = {
    schemaVersion: 'PHI-OS-PJA-W3A-BOUNDARY-REPORT-v1.0.0', nodeCode: canonical.nodeCode, editorialVersion: version, status: 'covered',
    mustEstablish: bindings(boundary.mustEstablish, 'Boundary Notes / mustEstablish'), mustNotClaim: bindings(boundary.mustNotClaim, 'Boundary Notes / mustNotClaim'),
    includedScope: bindings(boundary.includedScope, 'Boundary Notes / includedScope'), excludedScope: bindings(boundary.excludedScope, 'Boundary Notes / excludedScope'), uncovered: []
  };
  const figureBindings = {
    schemaVersion: 'PHI-OS-PJA-W3A-FIGURE-BINDINGS-v1.0.0', nodeCode: canonical.nodeCode, editorialVersion: version,
    decision: figure.figureRequirement, bindings: [...figure.requiredFigures, ...figure.optionalFigures].map(figureCode => ({ figureCode, status: 'decision_only', generated: false, assetRegistryRecord: null, source: 'canonical_figure_decision' }))
  };
  const metadata = {
    schemaVersion: 'PHI-OS-PJA-W3A-EDITORIAL-METADATA-v1.0.0', nodeCode: canonical.nodeCode, language: canonical.locale,
    editorialVersion: version, draftVersion: version, wordCount: draft.replace(/\s+/g, '').length, claimCount: claims.length,
    sourceCount: sourceCodes.length, figureCount: figureBindings.bindings.length, questionCount: questions.length, hash: contentHash, version
  };
  const manifest = {
    schemaVersion: 'PHI-OS-PJA-W3A-PRODUCTION-PACKAGE-v1.0.0', packageVersion: version, nodeCode: canonical.nodeCode,
    language: canonical.locale, editorialVersion: version, draftVersion: version, contentHash, status: 'validated',
    stateMachine: ['draft', 'validated', 'human_review'],
    projection: { mode: 'canonical_projection_only', rewriteAllowed: false, aiExpansionAllowed: false, inputs: ['Canonical Thesis', 'Boundary', 'Claim', 'Source Registry', 'Supporting Question', 'Figure Decision'] },
    files: Object.values(W3A_FILES).filter(file => !file.endsWith('production-package.json')), effects: { productionExportGenerated: false, published: false }
  };
  return new Map([[W3A_FILES.manifest, json(manifest)], [W3A_FILES.draft, draft], [W3A_FILES.claims, json(claimBindings)], [W3A_FILES.sources, json(sourceBindings)], [W3A_FILES.boundary, json(boundaryReport)], [W3A_FILES.figures, json(figureBindings)], [W3A_FILES.metadata, json(metadata)]]);
}

export function validateEditorialPackage(root, overrides = {}) {
  const expected = buildEditorialPackage(root), errors = [];
  for (const [relative, value] of expected) {
    const actual = Object.hasOwn(overrides, relative) ? overrides[relative] : (fs.existsSync(path.join(root, relative)) ? fs.readFileSync(path.join(root, relative), 'utf8') : null);
    if (actual === null) errors.push(`PACKAGE_FILE_MISSING:${relative}`); else if (canonicalText(actual) !== canonicalText(value)) errors.push(`PACKAGE_FILE_MISMATCH:${relative}`);
  }
  return { valid: errors.length === 0, errors };
}

const canonicalText = value => value.replace(/\r\n?/g, '\n');

function bindings(values, section) { return values.map((statement, index) => ({ boundaryId: `${anchor(section)}-${index + 1}`, statement, section, covered: true })); }
function coded(code) { const error = new Error(code); error.code = code; return error; }
