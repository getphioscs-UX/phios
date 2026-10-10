import fs from 'node:fs';
import path from 'node:path';
import { buildPortfolio, buildPreparedPackage, loadAuthority, NODE_ROOT, sha } from './lib/knowledge-production/scalable-article-workflow.mjs';
import { compareCandidate, generatePrompt, importCandidate, promoteCandidate } from './lib/knowledge-production/governed-editorial-generation.mjs';

const args = process.argv.slice(2), command = args[0], nodeCode = args[1] && !args[1].startsWith('--') ? args[1] : null, root = process.cwd();
const canonicalText = value => value.replace(/\r\n?/g, '\n');
const apply = args.includes('--apply'), dryRun = args.includes('--dry-run') || !apply;
if (!['prepare', 'draft', 'review', 'approve', 'export', 'publish', 'status', 'wave', 'generate', 'import-candidate', 'compare', 'promote-candidate'].includes(command)) stop('UNKNOWN_COMMAND', 2);
if (!nodeCode && command !== 'wave' && !(command === 'generate' && option('--wave'))) stop('NODE_CODE_REQUIRED', 2);

try {
  if (command === 'prepare' || command === 'draft') prepare();
  else if (command === 'review') review();
  else if (command === 'approve') approve();
  else if (command === 'export') exportPackage();
  else if (command === 'publish') publish();
  else if (command === 'status') status();
  else if (command === 'generate') commandGenerate();
  else if (command === 'import-candidate') console.log(JSON.stringify(importCandidate(root, nodeCode, option('--file'), { apply, replace: args.includes('--replace-candidate'), importedAt: option('--imported-at'), importedBy: option('--imported-by'), model: option('--model') }), null, 2));
  else if (command === 'compare') console.log(JSON.stringify(compareCandidate(root, nodeCode, true), null, 2));
  else if (command === 'promote-candidate') console.log(JSON.stringify(promoteCandidate(root, nodeCode, { apply, reviewer: option('--reviewer'), decision: option('--decision'), decidedAt: option('--decided-at'), editedFile: option('--file') }), null, 2));
  else wave();
} catch (error) { stop(error.code || error.message, error.code === 'NODE_NOT_FOUND' ? 2 : 2); }

function prepare() {
  const source = option('--source'), options = source ? validateSource(source) : {};
  const built = buildPreparedPackage(root, nodeCode, options), changes = [];
  for (const [relative, expected] of built.files) {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) changes.push({ path: relative, action: 'create' });
    else if (relative.endsWith('/draft.md')) { if (canonicalText(fs.readFileSync(absolute, 'utf8')) !== canonicalText(expected)) changes.push({ path: relative, action: 'preserve_human_draft' }); }
    else if (canonicalText(fs.readFileSync(absolute, 'utf8')) !== canonicalText(expected)) changes.push({ path: relative, action: 'update_derived' });
  }
  const report = { command, mode: dryRun ? 'dry-run' : 'apply', nodeCode, status: changes.some(item => item.action !== 'preserve_human_draft') ? 'changes_planned' : 'no_op', humanEditableFiles: [`${built.targetRoot}/draft.md`], derivedReadOnlyFiles: built.manifest.derivedReadOnlyFiles, changes, productionExportGenerated: false, published: false };
  console.log(JSON.stringify(report, null, 2)); if (dryRun) return;
  for (const [relative, expected] of built.files) {
    const absolute = path.join(root, relative); fs.mkdirSync(path.dirname(absolute), { recursive: true });
    if (relative.endsWith('/draft.md') && fs.existsSync(absolute)) continue;
    const temporary = `${absolute}.tmp`; fs.writeFileSync(temporary, expected); fs.renameSync(temporary, absolute);
  }
  const portfolioPath = path.join(root, 'content/knowledge/production/production-portfolio.json'), portfolio = `${JSON.stringify(buildPortfolio(root), null, 2)}\n`;
  fs.writeFileSync(`${portfolioPath}.tmp`, portfolio); fs.renameSync(`${portfolioPath}.tmp`, portfolioPath);
  console.log('PJA-W3R1 prepare applied atomically; existing draft.md preserved.');
}

function review() {
  const built = buildPreparedPackage(root, nodeCode), reviewPath = `${built.targetRoot}/review-status.json`, actualDraft = path.join(root, built.targetRoot, 'draft.md');
  if (!fs.existsSync(actualDraft)) throw coded('DRAFT_NOT_FOUND');
  const existingApprovalPath = path.join(root, built.targetRoot, 'editorial-review.json');
  const approval = fs.existsSync(existingApprovalPath) ? JSON.parse(fs.readFileSync(existingApprovalPath)) : null;
  const approvalValid = approval?.decision === 'approved' && approval.draftHash === built.draftHash;
  console.log(JSON.stringify({ command, nodeCode, draftHash: built.draftHash, review: built.review, humanEditorialApproval: approvalValid ? 'valid' : approval ? 'stale' : 'missing', autoApproved: false, reportPath: reviewPath, writes: 0 }, null, 2));
}

function approve() {
  const decision = option('--decision'), reviewer = option('--reviewer'); if (!decision || !reviewer) throw coded('HUMAN_DECISION_AND_REVIEWER_REQUIRED');
  if (!['approved', 'changes_required', 'rejected'].includes(decision)) throw coded('INVALID_EDITORIAL_DECISION');
  const built = buildPreparedPackage(root, nodeCode); console.log(JSON.stringify({ command, nodeCode, decision, reviewer, draftHash: built.draftHash, claimCoverage: built.review.claimCoverage.percentage, sourceCoverage: built.review.sourceReview.unknown === 0 ? 'passed' : 'failed', boundaryCoverage: built.review.boundaryCoverage, styleFindings: built.review.styleReview, unresolvedFindings: built.review.blockingFindings, canApprove: decision === 'approved' && built.review.blockingFindings.length === 0, mode: apply ? 'apply' : 'dry-run' }, null, 2));
  if (decision === 'approved' && built.review.blockingFindings.length) throw coded('BLOCKING_REVIEW_FINDINGS');
  if (!apply) return; const record = { schemaVersion: 'PHI-OS-PJA-W3R1-HUMAN-EDITORIAL-REVIEW-v1.0.0', nodeCode, draftVersion: built.manifest.draftVersion, draftHash: built.draftHash, reviewer, decision, reviewedAt: option('--reviewed-at'), notes: option('--notes'), approvedSections: [], requiredChanges: decision === 'changes_required' ? built.review.blockingFindings : [] };
  if (!record.reviewedAt) throw coded('REVIEW_TIME_REQUIRED'); const target = path.join(root, built.targetRoot, 'editorial-review.json'); fs.writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`);
}

function exportPackage() {
  const built = buildPreparedPackage(root, nodeCode), approvalPath = path.join(root, built.targetRoot, 'editorial-review.json');
  if (!fs.existsSync(approvalPath)) throw coded('HUMAN_EDITORIAL_APPROVAL_REQUIRED'); const approval = JSON.parse(fs.readFileSync(approvalPath));
  if (approval.decision !== 'approved' || approval.draftHash !== built.draftHash) throw coded('HUMAN_EDITORIAL_APPROVAL_STALE');
  if (built.review.blockingFindings.length) throw coded(built.review.requiredFigure.unresolved ? 'REQUIRED_FIGURE_INCOMPLETE' : 'BLOCKING_REVIEW_FINDINGS');
  console.log(JSON.stringify({ command, nodeCode, status: 'export_contract_satisfied', mode: apply ? 'apply' : 'dry-run', productionExportGenerated: false, published: false }, null, 2));
  if (apply) throw coded('W3R1_EXPORT_FIXTURE_ONLY');
}
function publish() { const exportPath = path.join(root, `content/knowledge/exports/${nodeCode.toLowerCase()}/production-export.json`), approvalPath = path.join(root, `content/knowledge/publication/${nodeCode.toLowerCase()}/publication-approval.json`); if (!fs.existsSync(exportPath)) throw coded('PRODUCTION_EXPORT_REQUIRED'); if (!fs.existsSync(approvalPath)) throw coded('PUBLICATION_APPROVAL_REQUIRED'); throw coded('W3R1_PUBLICATION_DISABLED'); }
function status() { const packageRoot = NODE_ROOT(nodeCode), built = buildPreparedPackage(root, nodeCode), approvalPath = path.join(root, packageRoot, 'editorial-review.json'), approval = fs.existsSync(approvalPath) ? JSON.parse(fs.readFileSync(approvalPath)) : null; const derivedWarnings = []; for (const [name, expectedHash] of Object.entries(built.manifest.derivedHashes)) { const target = path.join(root, packageRoot, name); if (fs.existsSync(target) && sha(fs.readFileSync(target)) !== expectedHash) derivedWarnings.push(`derived_artifact_modified:${name}`); } console.log(JSON.stringify({ command, nodeCode, productionReadiness: 'production_ready', packageStatus: fs.existsSync(path.join(root, packageRoot, 'production-package.json')) ? built.manifest.status : 'not_prepared', draftHash: built.draftHash, editorialApproval: approval?.draftHash === built.draftHash ? approval.decision : approval ? 'stale' : 'missing', exportStatus: 'not_exported', publicationStatus: 'not_published', warnings: derivedWarnings }, null, 2)); }
function wave() { const portfolio = buildPortfolio(root); console.log(JSON.stringify({ command, status: 'portfolio_projection', nodeCount: portfolio.entries.length, secondCanonicalRegistry: false, waveLimits: { pilot: 1, wave1: 8, wave2: 12, mature: 24 }, writes: 0 }, null, 2)); }
function commandGenerate() {
  const waveCode = option('--wave');
  if (!waveCode) return console.log(JSON.stringify(generatePrompt(root, nodeCode, apply), null, 2));
  const candidates = [`content/knowledge/production/waves/${waveCode}.json`, `content/knowledge/production/waves/${waveCode}/wave.json`], wavePath = candidates.map(value => path.join(root, value)).find(fs.existsSync);
  if (!wavePath) throw coded('WAVE_NOT_FOUND'); const waveRecord = JSON.parse(fs.readFileSync(wavePath, 'utf8')), nodeCodes = waveRecord.nodeCodes || waveRecord.nodes?.map(value => value.nodeCode || value) || [];
  if (nodeCodes.length > 24) throw coded('WAVE_SIZE_EXCEEDED'); const results = nodeCodes.map(code => generatePrompt(root, code, apply));
  const state = code => { const base = path.join(root, NODE_ROOT(code)); return { promptReady: fs.existsSync(path.join(base, 'prompt.md')), candidateImported: fs.existsSync(path.join(base, 'candidate.md')), candidatePassed: fs.existsSync(path.join(base, 'candidate-review.json')) && JSON.parse(fs.readFileSync(path.join(base, 'candidate-review.json'))).blockingFindings.length === 0, candidateBlocked: fs.existsSync(path.join(base, 'candidate-review.json')) && JSON.parse(fs.readFileSync(path.join(base, 'candidate-review.json'))).blockingFindings.length > 0, candidatePromoted: fs.existsSync(path.join(base, 'candidate-promotion.json')), humanEditorialApproved: fs.existsSync(path.join(base, 'editorial-review.json')) && JSON.parse(fs.readFileSync(path.join(base, 'editorial-review.json'))).decision === 'approved' }; };
  const states = nodeCodes.map(state), manifest = { schemaVersion: 'PHI-OS-PJA-W3R2-GENERATION-MANIFEST-v1.0.0', authority: 'derived_projection_only', secondProductionRegistry: false, waveCode, nodeCodes, promptReady: states.filter(value => value.promptReady).length, candidateImported: states.filter(value => value.candidateImported).length, candidatePassed: states.filter(value => value.candidatePassed).length, candidateBlocked: states.filter(value => value.candidateBlocked).length, candidatePromoted: states.filter(value => value.candidatePromoted).length, humanEditorialApproved: states.filter(value => value.humanEditorialApproved).length, stale: 0, conflicted: 0, providerInvocation: 'disabled' };
  const manifestPath = path.join(root, `content/knowledge/production/waves/${waveCode}/generation-manifest.json`), manifestValue = `${JSON.stringify(manifest, null, 2)}\n`, manifestChange = !fs.existsSync(manifestPath) || fs.readFileSync(manifestPath, 'utf8') !== manifestValue;
  if (apply && manifestChange) { fs.mkdirSync(path.dirname(manifestPath), { recursive: true }); const temporary = `${manifestPath}.tmp`; fs.writeFileSync(temporary, manifestValue); fs.renameSync(temporary, manifestPath); }
  console.log(JSON.stringify({ command, waveCode, mode: apply ? 'apply' : 'dry-run', nodeCodes, promptReady: results.filter(value => ['applied', 'no_op'].includes(value.status)).map(value => value.nodeCode), candidateMissing: nodeCodes.filter(code => !fs.existsSync(path.join(root, NODE_ROOT(code), 'candidate.md'))), generationManifest: { path: path.relative(root, manifestPath), action: manifestChange ? (apply ? 'written' : 'would_write') : 'no_op' }, results, providerInvocation: 'disabled', candidatesGenerated: 0 }, null, 2));
}
function validateSource(relative) { const absolute = path.resolve(root, relative); if (!absolute.startsWith(`${root}${path.sep}`) || path.extname(absolute) !== '.md' || !fs.existsSync(absolute)) throw coded('INVALID_SOURCE_MANUSCRIPT_PATH'); const providedBy = option('--provided-by'), providedAt = option('--provided-at'); if (!providedBy || !providedAt) throw coded('SOURCE_PROVENANCE_REQUIRED'); const startHeading = option('--start-heading'), endHeading = option('--end-heading'); if (Boolean(startHeading) !== Boolean(endHeading)) throw coded('SOURCE_RANGE_INCOMPLETE'); return { source: relative, sourceHash: sha(fs.readFileSync(absolute)), language: option('--language') || 'zh-Hans', providedBy, providedAt, startHeading, endHeading }; }
function option(name) { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; }
function coded(code) { const error = new Error(code); error.code = code; return error; }
function stop(code, exitCode) { console.error(JSON.stringify({ command, nodeCode, status: 'blocked', code, writes: 0, productionExportGenerated: false, published: false }, null, 2)); process.exit(exitCode); }
