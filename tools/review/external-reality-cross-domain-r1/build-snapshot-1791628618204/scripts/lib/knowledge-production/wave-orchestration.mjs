import fs from 'node:fs';
import path from 'node:path';
import { generatePrompt } from './governed-editorial-generation.mjs';
import { NODE_ROOT } from './scalable-article-workflow.mjs';

const json = value => `${JSON.stringify(value, null, 2)}\n`;
const coded = code => Object.assign(new Error(code), { code });
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const exists = file => fs.existsSync(file);
const atomicWrite = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); const temporary = `${file}.tmp`; fs.writeFileSync(temporary, value); fs.renameSync(temporary, file); };
export const REGISTRY_PATH = 'content/knowledge/production/orchestration/wave-registry.json';
export const WAVE_STATES = ['planned', 'active', 'editorial', 'ready_for_export', 'completed', 'archived'];

export function createWave(root, waveCode, options = {}) {
  validateWaveCode(waveCode); const registry = loadRegistry(root), existing = registry.waves.find(item => item.waveCode === waveCode);
  if (existing) return report('create', waveCode, options.apply, 'no_op', 0, { wave: existing });
  const ordinal = registry.waves.length + 1, maximumNodes = ordinal === 1 ? 8 : ordinal === 2 ? 12 : 24, at = options.at || new Date().toISOString();
  const wave = { waveCode, waveVersion: '1.0.0', bookCode: options.bookCode || 'BOOK-I', language: options.language || 'zh-Hans', status: 'planned', maximumNodes, createdAt: at, updatedAt: at, nodeCodes: [], projectionAuthority: false, sourceOfTruth: 'production_planning_membership_only' };
  const next = structuredClone(registry); next.waves.push(wave);
  if (options.apply) { saveRegistry(root, next); saveWave(root, wave); }
  return report('create', waveCode, options.apply, 'changes_planned', options.apply ? 2 : 0, { wave });
}

export function addNode(root, waveCode, nodeCode, options = {}) {
  const registry = loadRegistry(root), wave = requireWave(registry, waveCode); validateEligibility(root, wave, nodeCode);
  const duplicateWave = registry.waves.find(item => item.nodeCodes.includes(nodeCode));
  if (duplicateWave) { if (duplicateWave.waveCode === waveCode) return report('add', waveCode, options.apply, 'no_op', 0, { nodeCode }); throw coded('NODE_ALREADY_ASSIGNED_TO_WAVE'); }
  if (wave.nodeCodes.length >= wave.maximumNodes) throw coded('WAVE_SIZE_EXCEEDED');
  const updated = { ...wave, nodeCodes: [...wave.nodeCodes, nodeCode], updatedAt: options.at || new Date().toISOString() }; replaceWave(registry, updated);
  if (options.apply) { saveRegistry(root, registry); saveWave(root, updated); refreshDerived(root, updated); }
  return report('add', waveCode, options.apply, 'changes_planned', options.apply ? 4 : 0, { nodeCode, nodeCount: updated.nodeCodes.length, maximumNodes: updated.maximumNodes });
}

export function removeNode(root, waveCode, nodeCode, options = {}) {
  const registry = loadRegistry(root), wave = requireWave(registry, waveCode); if (!wave.nodeCodes.includes(nodeCode)) return report('remove', waveCode, options.apply, 'no_op', 0, { nodeCode });
  if (['completed', 'archived'].includes(wave.status)) throw coded('WAVE_MEMBERSHIP_FROZEN');
  const updated = { ...wave, nodeCodes: wave.nodeCodes.filter(code => code !== nodeCode), updatedAt: options.at || new Date().toISOString() }; replaceWave(registry, updated);
  if (options.apply) { saveRegistry(root, registry); saveWave(root, updated); refreshDerived(root, updated); }
  return report('remove', waveCode, options.apply, 'changes_planned', options.apply ? 4 : 0, { nodeCode, nodeCount: updated.nodeCodes.length });
}

export function waveStatus(root, waveCode) { const wave = requireWave(loadRegistry(root), waveCode), projection = buildProjection(root, wave), totals = summarize(projection.nodes); return { command: 'status', waveCode, status: deriveStatus(wave, projection.nodes), recordedStatus: wave.status, bookCode: wave.bookCode, language: wave.language, maximumNodes: wave.maximumNodes, nodeCount: wave.nodeCodes.length, nodes: projection.nodes, totals, effects: { exportGenerated: false, published: false } }; }

export function generateWave(root, waveCode, options = {}) {
  const registry = loadRegistry(root), wave = requireWave(registry, waveCode); if (!wave.nodeCodes.length) throw coded('WAVE_EMPTY');
  for (const nodeCode of wave.nodeCodes) validateEligibility(root, wave, nodeCode);
  const generation = wave.nodeCodes.map(nodeCode => generatePrompt(root, nodeCode, options.apply));
  const updated = wave.status === 'planned' ? { ...wave, status: 'active', updatedAt: options.at || new Date().toISOString() } : wave, stateChanged = updated !== wave;
  if (options.apply && stateChanged) { replaceWave(registry, updated); saveRegistry(root, registry); saveWave(root, updated); }
  const projection = buildProjection(root, updated), manifest = buildManifest(updated, projection.nodes), manifestPath = path.join(root, waveDirectory(waveCode), 'generation-manifest.json'), value = json(manifest), changed = !exists(manifestPath) || fs.readFileSync(manifestPath, 'utf8') !== value;
  if (options.apply && changed) atomicWrite(manifestPath, value);
  const projectionPath = path.join(root, waveDirectory(waveCode), 'wave-node-projection.json'), projectionValue = json(projection), projectionChanged = !exists(projectionPath) || fs.readFileSync(projectionPath, 'utf8') !== projectionValue; if (options.apply && projectionChanged) atomicWrite(projectionPath, projectionValue);
  const plannedWrites = generation.reduce((sum, item) => sum + (item.status === 'no_op' ? 0 : Math.max(item.changes?.length || 0, 1)), 0) + Number(changed) + Number(projectionChanged) + (stateChanged ? 2 : 0);
  return report('generate', waveCode, options.apply, plannedWrites ? 'changes_planned' : 'no_op', options.apply ? plannedWrites : 0, { nodeCodes: wave.nodeCodes, promptReady: manifest.promptReady, candidateMissing: manifest.candidateMissing, generationManifest: path.relative(root, manifestPath), providerInvocation: 'disabled', candidateGenerated: 0, generation });
}

export function dashboard(root, waveCode) { const status = waveStatus(root, waveCode), used = status.nodeCount, max = status.maximumNodes, filled = max ? Math.round(used / max * 8) : 0, bar = `${'█'.repeat(filled)}${'░'.repeat(8 - filled)}`, priorities = blockingPriorities(status.nodes); return { command: 'dashboard', waveCode, title: waveCode, progress: `${bar} ${used} / ${max}`, totals: status.totals, blockingDashboard: priorities, nextActions: orderActions(priorities), effects: { exportGenerated: false, published: false } }; }

export function completeWave(root, waveCode, options = {}) {
  const registry = loadRegistry(root), wave = requireWave(registry, waveCode), projection = buildProjection(root, wave); if (!wave.nodeCodes.length) throw coded('WAVE_EMPTY');
  if (projection.nodes.some(node => node.exportStatus !== 'exported')) throw coded('WAVE_EXPORT_INCOMPLETE');
  if (wave.status === 'completed') return report('complete', waveCode, options.apply, 'no_op', 0, { nodeCount: wave.nodeCodes.length, publicationRequired: false, publicationTriggered: false });
  const updated = { ...wave, status: 'completed', updatedAt: options.at || new Date().toISOString() }; replaceWave(registry, updated);
  if (options.apply) { saveRegistry(root, registry); saveWave(root, updated); saveProjection(root, { ...projection, waveStatus: 'completed' }); }
  return report('complete', waveCode, options.apply, 'changes_planned', options.apply ? 3 : 0, { nodeCount: wave.nodeCodes.length, publicationRequired: false, publicationTriggered: false });
}

export function buildProjection(root, wave) { return { schemaVersion: 'PHI-OS-PJA-W3R3-WAVE-NODE-PROJECTION-v1.0.0', authority: 'derived_projection_only', waveCode: wave.waveCode, waveStatus: wave.status, nodes: wave.nodeCodes.map(nodeCode => projectNode(root, nodeCode)) }; }
export function buildManifest(wave, nodes) { return { schemaVersion: 'PHI-OS-PJA-W3R3-GENERATION-MANIFEST-v1.0.0', authority: 'derived_projection_only', waveCode: wave.waveCode, nodeCodes: wave.nodeCodes, promptReady: nodes.filter(node => node.promptReady).map(node => node.nodeCode), candidateMissing: nodes.filter(node => node.candidateStatus === 'missing').map(node => node.nodeCode), candidateImported: nodes.filter(node => node.candidateStatus === 'imported').map(node => node.nodeCode), candidateReviewed: nodes.filter(node => node.reviewStatus !== 'not_reviewed').map(node => node.nodeCode), candidatePromoted: nodes.filter(node => node.editorialStatus === 'candidate_promoted').map(node => node.nodeCode), editorialApproved: nodes.filter(node => node.approvalStatus === 'approved').map(node => node.nodeCode), exportReady: nodes.filter(node => node.exportStatus === 'ready_for_export').map(node => node.nodeCode), published: nodes.filter(node => node.publicationStatus === 'published').map(node => node.nodeCode), providerInvocation: 'disabled' }; }

export function validateEligibility(root, wave, nodeCode) { const registry = read(path.join(root, 'content/knowledge/registry/nodes.json')), node = registry.nodes.find(item => item.nodeCode === nodeCode); if (!node) throw coded('NODE_NOT_FOUND'); const c3 = read(path.join(root, 'content/knowledge/editorial/c3/universal-production-readiness-index.json')), readiness = c3.entries.find(item => item.nodeCode === nodeCode); if (!readiness?.productionReady || readiness.status !== 'production_ready' || readiness.blocking.length) throw coded('NODE_NOT_PRODUCTION_READY'); const authorityPath = path.join(root, `content/knowledge/editorial/readiness/${nodeCode.toLowerCase()}-production-readiness.json`); if (!exists(authorityPath)) throw coded('CANONICAL_AUTHORITY_NOT_FOUND'); const authority = read(authorityPath); if (authority.hierarchy.bookCode !== wave.bookCode) throw coded('WAVE_BOOK_MISMATCH'); if (authority.locale !== wave.language) throw coded('WAVE_LANGUAGE_MISMATCH'); return true; }

export function loadRegistry(root) { const file = path.join(root, REGISTRY_PATH); return exists(file) ? read(file) : { schemaVersion: 'PHI-OS-PJA-W3R3-WAVE-REGISTRY-v1.0.0', authority: 'production_planning_only', secondCanonicalRegistry: false, allowedStatuses: WAVE_STATES, waves: [] }; }
function projectNode(root, nodeCode) { const base = path.join(root, NODE_ROOT(nodeCode)), has = name => exists(path.join(base, name)), candidateReview = has('candidate-review.json') ? read(path.join(base, 'candidate-review.json')) : null, approval = has('editorial-review.json') ? read(path.join(base, 'editorial-review.json')) : null, pkg = has('production-package.json') ? read(path.join(base, 'production-package.json')) : null, review = has('review-status.json') ? read(path.join(base, 'review-status.json')) : null, exportPath = path.join(root, `content/knowledge/exports/${nodeCode.toLowerCase()}/production-export.json`), publicationPath = path.join(root, `content/knowledge/publication/${nodeCode.toLowerCase()}/publication-record.json`), exported = exists(exportPath), published = exists(publicationPath); return { nodeCode, candidateStatus: has('candidate.md') ? 'imported' : 'missing', editorialStatus: has('candidate-promotion.json') ? 'candidate_promoted' : has('draft.md') ? 'draft_present' : 'not_started', reviewStatus: candidateReview ? (candidateReview.blockingFindings.length ? 'blocked' : 'passed') : 'not_reviewed', approvalStatus: approval?.decision === 'approved' && approval.draftHash === pkg?.contentHash ? 'approved' : approval ? 'stale_or_not_approved' : 'missing', exportStatus: exported ? 'exported' : approval?.decision === 'approved' && !(review?.blockingFindings?.length) ? 'ready_for_export' : 'not_exported', publicationStatus: published ? 'published' : 'not_published', promptReady: has('prompt.md'), figureMissing: Boolean(review?.blockingFindings?.includes('REQUIRED_FIGURE_ASSET_MISSING')), blocking: [...(candidateReview?.blockingFindings || []), ...(review?.blockingFindings || []), ...(!has('candidate.md') ? ['CANDIDATE_MISSING'] : []), ...(!approval ? ['HUMAN_EDITORIAL_APPROVAL_MISSING'] : [])] }; }
function summarize(nodes) { return { candidate: nodes.filter(node => node.candidateStatus === 'imported').length, draft: nodes.filter(node => node.editorialStatus !== 'not_started').length, review: nodes.filter(node => node.reviewStatus !== 'not_reviewed').length, approved: nodes.filter(node => node.approvalStatus === 'approved').length, exported: nodes.filter(node => node.exportStatus === 'exported').length, published: nodes.filter(node => node.publicationStatus === 'published').length, blocked: nodes.filter(node => node.blocking.length).length, figureMissing: nodes.filter(node => node.figureMissing).length, ready: nodes.filter(node => node.exportStatus === 'ready_for_export').length }; }
function blockingPriorities(nodes) { return { figureMissing: nodes.filter(node => node.figureMissing).length, humanReview: nodes.filter(node => node.approvalStatus !== 'approved').length, boundary: nodes.filter(node => node.blocking.some(code => code.includes('BOUNDARY'))).length, candidateMissing: nodes.filter(node => node.candidateStatus === 'missing').length, reviewBlocked: nodes.filter(node => node.reviewStatus === 'blocked').length, ready: nodes.filter(node => node.exportStatus === 'ready_for_export').length }; }
function orderActions(p) { const actions = []; if (p.candidateMissing) actions.push(`Generate/import ${p.candidateMissing} missing Candidate`); if (p.reviewBlocked) actions.push(`Resolve ${p.reviewBlocked} blocked Candidate review`); if (p.figureMissing) actions.push(`Complete ${p.figureMissing} required Figure`); if (p.humanReview) actions.push(`Complete ${p.humanReview} human editorial decision`); if (p.ready) actions.push(`${p.ready} node ready for later Export stage`); return actions; }
function deriveStatus(wave, nodes) { if (['completed', 'archived'].includes(wave.status)) return wave.status; if (nodes.length && nodes.every(node => ['ready_for_export', 'exported'].includes(node.exportStatus))) return 'ready_for_export'; if (nodes.some(node => node.candidateStatus === 'imported' || node.reviewStatus !== 'not_reviewed' || node.editorialStatus === 'candidate_promoted')) return 'editorial'; return wave.status; }
function loadWaveFile(root, code) { const file = path.join(root, waveDirectory(code), 'wave.json'); return exists(file) ? read(file) : null; }
function saveRegistry(root, registry) { atomicWrite(path.join(root, REGISTRY_PATH), json(registry)); }
function saveWave(root, wave) { atomicWrite(path.join(root, waveDirectory(wave.waveCode), 'wave.json'), json({ schemaVersion: 'PHI-OS-PJA-W3R3-WAVE-v1.0.0', ...wave })); }
function saveProjection(root, projection) { atomicWrite(path.join(root, waveDirectory(projection.waveCode), 'wave-node-projection.json'), json(projection)); }
function refreshDerived(root, wave) { const projection = buildProjection(root, wave); saveProjection(root, projection); atomicWrite(path.join(root, waveDirectory(wave.waveCode), 'generation-manifest.json'), json(buildManifest(wave, projection.nodes))); }
function requireWave(registry, code) { const wave = registry.waves.find(item => item.waveCode === code); if (!wave) throw coded('WAVE_NOT_FOUND'); return wave; }
function replaceWave(registry, wave) { registry.waves = registry.waves.map(item => item.waveCode === wave.waveCode ? wave : item); }
function validateWaveCode(code) { if (!/^WAVE-[A-Z0-9][A-Z0-9-]*$/.test(code || '')) throw coded('INVALID_WAVE_CODE'); }
function waveDirectory(code) { return `content/knowledge/production/waves/${code}`; }
function report(command, waveCode, apply, status, writes, extra) { return { command, waveCode, mode: apply ? 'apply' : 'dry-run', status, writes, authorityWrites: 0, productionExportGenerated: false, published: false, ...extra }; }
