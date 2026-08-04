import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  deriveBookIBlueprintNodes,
  validateBookINodeMapping,
  validateBookISectionInventory
} from '../../book-i-manuscript.mjs';
import {
  P5_CANDIDATE_RELATIVE,
  reviewP5Candidate
} from './p5-human-review.mjs';

export const T08_SCHEMA_VERSION = 'PHI-OS-KNR-W2R1-P5-MAPPING-REVIEW-v1.0.0';
export const P5_MAPPING_REVIEW_RELATIVE =
  '.tmp/knowledge-manuscripts/book-1/p5-node-mapping-review.json';
export const P5_MAPPING_RELATIVE =
  'content/knowledge/manuscripts/book-1/node-manuscript-mapping.json';
export const P5_INVENTORY_RELATIVE =
  'content/knowledge/manuscripts/book-1/book-1-section-inventory.json';
export const P5_BLUEPRINT_RELATIVE =
  'content/knowledge/blueprints/book-1-knowledge-blueprint.json';
export const P5_MAPPING_MANIFEST_RELATIVE =
  'content/knowledge/manuscripts/book-1/manuscript-manifest.json';

export const REQUIRED_MAPPING_REVIEW_CHECKS = Object.freeze([
  'primaryRange',
  'supportingRange',
  'crossSectionReferences',
  'rangeSufficiency',
  'conflict',
  'distinction',
  'boundary',
  'paidBookSubstitutionRisk'
]);

const RANGE_ROLES = new Set([
  'primary',
  'supporting',
  'continuity',
  'distinction',
  'example',
  'boundary'
]);
const RANGE_FIELDS = [
  'rangeCode',
  'startHeading',
  'endHeading',
  'startAnchor',
  'endAnchor',
  'sectionHash',
  'rangeRole'
];
const HASH_PATTERN = /^[a-f0-9]{64}$/u;
const clean = value => typeof value === 'string' ? value.trim() : '';
const clone = value => JSON.parse(JSON.stringify(value));
const coded = (code, details = null) => Object.assign(new Error(code), { code, details });
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function resolveWithin(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relativePath);
  if (!resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw coded('P5_MAPPING_REVIEW_PATH_ESCAPE', { path: relativePath });
  }
  return resolved;
}

function readJson(file, code) {
  if (!fs.existsSync(file)) throw coded(code, { path: file });
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    throw coded(`${code}_INVALID_JSON`, { path: file });
  }
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeJsonAtomic(file, value, mode) {
  const next = jsonText(value);
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === next) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.partial-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(temporary, next, { flag: 'wx', mode });
    fs.renameSync(temporary, file);
  } catch (error) {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    throw error;
  }
  return true;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function isoNow(now) {
  const supplied = typeof now === 'function' ? now() : new Date();
  const value = supplied instanceof Date ? supplied : new Date(supplied);
  if (Number.isNaN(value.getTime())) throw coded('P5_MAPPING_REVIEW_TIMESTAMP_INVALID');
  return value.toISOString();
}

function headingCatalog(candidateText) {
  const headings = candidateText
    .split(/\r?\n/u)
    .map(line => line.match(/^#{1,6}\s+(.+?)\s*$/u)?.[1]?.trim() || null)
    .filter(Boolean);
  return [...new Set(headings)];
}

function anchorPositions(candidateText, anchor) {
  const positions = [];
  if (!clean(anchor)) return positions;
  let offset = 0;
  while (offset <= candidateText.length) {
    const index = candidateText.indexOf(anchor, offset);
    if (index === -1) break;
    positions.push(index);
    offset = index + Math.max(anchor.length, 1);
  }
  return positions;
}

function candidateState(root) {
  const file = resolveWithin(root, P5_CANDIDATE_RELATIVE);
  if (!fs.existsSync(file)) throw coded('P5_MAPPING_REVIEW_CANDIDATE_MISSING');
  const bytes = fs.readFileSync(file);
  if (!bytes.length) throw coded('P5_MAPPING_REVIEW_CANDIDATE_EMPTY');
  const text = bytes.toString('utf8');
  return {
    path: P5_CANDIDATE_RELATIVE,
    sha256: sha256(bytes),
    sizeBytes: bytes.length,
    characterCount: text.length,
    text,
    headings: headingCatalog(text)
  };
}

function loadContext(root) {
  const t05 = reviewP5Candidate({ root, mode: 'dry-run' });
  if (t05.status !== 'human_verified' || t05.humanVerified !== true) {
    throw coded('P5_MAPPING_REVIEW_REQUIRES_T05_HUMAN_VERIFIED');
  }
  const manifest = readJson(
    resolveWithin(root, P5_MAPPING_MANIFEST_RELATIVE),
    'P5_MAPPING_REVIEW_MANIFEST_MISSING'
  );
  const inventory = validateBookISectionInventory(
    readJson(resolveWithin(root, P5_INVENTORY_RELATIVE), 'P5_MAPPING_REVIEW_INVENTORY_MISSING'),
    manifest
  );
  const blueprint = readJson(
    resolveWithin(root, P5_BLUEPRINT_RELATIVE),
    'P5_MAPPING_REVIEW_BLUEPRINT_MISSING'
  );
  const mappingFile = resolveWithin(root, P5_MAPPING_RELATIVE);
  const mappingBytes = fs.readFileSync(mappingFile);
  const mapping = validateBookINodeMapping(JSON.parse(mappingBytes.toString('utf8')), {
    manifest,
    blueprint,
    inventory
  });
  const candidate = candidateState(root);
  const p5 = inventory.parts.find(part => part.partCode === 'P5');
  if (
    !p5 ||
    p5.normalizationStatus !== 'human_verified' ||
    p5.humanVerified !== true ||
    p5.stalenessStatus !== 'CURRENT' ||
    candidate.sha256 !== p5.sectionHash ||
    candidate.sha256 !== manifest.contentHashes?.normalizedParts?.P5
  ) {
    throw coded('P5_MAPPING_REVIEW_MANUSCRIPT_STALE', {
      candidateSha256: candidate.sha256,
      inventorySectionHash: p5?.sectionHash || null,
      manifestSectionHash: manifest.contentHashes?.normalizedParts?.P5 || null
    });
  }
  return {
    root,
    manifest,
    inventory,
    blueprint,
    mapping,
    mappingSha256: sha256(mappingBytes),
    candidate
  };
}

function p5BlueprintNodes(context) {
  return deriveBookIBlueprintNodes(context.blueprint, context.manifest)
    .filter(node => node.partCode === 'P5');
}

export function createP5MappingReviewTemplate(context, { now } = {}) {
  const nodes = p5BlueprintNodes(context);
  const mappingByNode = new Map(context.mapping.mappings.map(record => [record.nodeCode, record]));
  if (nodes.some(node => mappingByNode.get(node.nodeCode)?.mappingStatus !== 'candidate')) {
    throw coded('P5_MAPPING_REVIEW_PREPARE_REQUIRES_CANDIDATES');
  }
  return {
    schemaVersion: T08_SCHEMA_VERSION,
    stage: 'KNR-W2R1-T09-P5',
    bookCode: context.manifest.bookCode,
    partCode: 'P5',
    locale: context.manifest.locale,
    sourceVersion: context.manifest.manuscriptVersion,
    createdAt: isoNow(now),
    candidate: {
      path: context.candidate.path,
      sha256: context.candidate.sha256,
      sizeBytes: context.candidate.sizeBytes,
      characterCount: context.candidate.characterCount,
      headings: [...context.candidate.headings]
    },
    mapping: {
      path: P5_MAPPING_RELATIVE,
      sha256: context.mappingSha256,
      applyPolicy: 'atomic_after_all_p5_nodes_approved'
    },
    requiredChecks: [...REQUIRED_MAPPING_REVIEW_CHECKS],
    reviewerAuthority: {
      requiredRole: 'TL',
      automationMaximumStatus: 'candidate',
      approvedMappingStatus: 'mapped',
      approvedAuthorityStatus: 'human_confirmed'
    },
    publicBoundary: {
      manuscriptBodyStored: false,
      publicExtractionAllowed: false,
      paidBookSubstitutionAllowed: false,
      productionModified: false
    },
    nodes: nodes.map((node, index) => {
      const record = mappingByNode.get(node.nodeCode);
      return {
        sequence: index + 1,
        nodeCode: node.nodeCode,
        titleZhHans: node.titleZhHans,
        decision: 'pending',
        checks: Object.fromEntries(REQUIRED_MAPPING_REVIEW_CHECKS.map(check => [check, false])),
        candidateRanges: clone(record.ranges),
        ranges: [],
        crossSectionReferences: [],
        unresolved: clone(record.unresolved),
        conflict: {
          status: 'not_reviewed',
          resolution: null
        },
        paidBookSubstitutionRisk: {
          status: 'not_reviewed',
          control: 'mapping_metadata_only_no_continuous_body'
        },
        reviewerRole: 'TL',
        reviewedBy: null,
        reviewedAt: null
      };
    }),
    application: {
      status: 'not_applied',
      appliedAt: null,
      originalMappingSha256: context.mappingSha256,
      appliedMappingSha256: null
    }
  };
}

function topLevelReviewIdentity(review, context) {
  if (!review || typeof review !== 'object' || Array.isArray(review)) {
    throw coded('P5_MAPPING_REVIEW_INVALID');
  }
  if (
    review.schemaVersion !== T08_SCHEMA_VERSION ||
    review.stage !== 'KNR-W2R1-T08' ||
    review.bookCode !== context.manifest.bookCode ||
    review.partCode !== 'P5' ||
    review.locale !== context.manifest.locale ||
    review.sourceVersion !== context.manifest.manuscriptVersion
  ) {
    throw coded('P5_MAPPING_REVIEW_IDENTITY_MISMATCH');
  }
  if (
    review.candidate?.path !== context.candidate.path ||
    review.candidate?.sha256 !== context.candidate.sha256 ||
    review.candidate?.sizeBytes !== context.candidate.sizeBytes ||
    review.candidate?.characterCount !== context.candidate.characterCount
  ) {
    throw coded('P5_MAPPING_REVIEW_MANUSCRIPT_STALE');
  }
  const expectedMappingHash = review.application?.status === 'applied'
    ? review.application?.appliedMappingSha256
    : review.mapping?.sha256;
  if (
    review.mapping?.path !== P5_MAPPING_RELATIVE ||
    !HASH_PATTERN.test(clean(expectedMappingHash)) ||
    expectedMappingHash !== context.mappingSha256 ||
    review.mapping?.applyPolicy !== 'atomic_after_all_p5_nodes_approved'
  ) {
    throw coded('P5_MAPPING_REVIEW_MAPPING_STALE', {
      expected: expectedMappingHash || null,
      actual: context.mappingSha256
    });
  }
  if (
    JSON.stringify(review.requiredChecks) !== JSON.stringify(REQUIRED_MAPPING_REVIEW_CHECKS) ||
    review.reviewerAuthority?.requiredRole !== 'TL' ||
    review.reviewerAuthority?.automationMaximumStatus !== 'candidate' ||
    review.reviewerAuthority?.approvedMappingStatus !== 'mapped' ||
    review.reviewerAuthority?.approvedAuthorityStatus !== 'human_confirmed' ||
    review.publicBoundary?.manuscriptBodyStored !== false ||
    review.publicBoundary?.publicExtractionAllowed !== false ||
    review.publicBoundary?.paidBookSubstitutionAllowed !== false ||
    review.publicBoundary?.productionModified !== false
  ) {
    throw coded('P5_MAPPING_REVIEW_AUTHORITY_OR_BOUNDARY_MISMATCH');
  }
}

function rangeBlockers(range, node, context, allNodeCodes) {
  const blockers = [];
  if (!range || typeof range !== 'object' || Array.isArray(range)) return ['range_invalid'];
  const missing = RANGE_FIELDS.filter(field => !hasOwn(range, field));
  if (missing.length) return missing.map(field => `range_field_missing:${field}`);
  if (!clean(range.rangeCode) || !range.rangeCode.startsWith(`${node.nodeCode}-R`)) {
    blockers.push('range_code_invalid');
  }
  if (!clean(range.startHeading) || !context.candidate.headings.includes(range.startHeading)) {
    blockers.push('start_heading_not_found');
  }
  if (
    range.endHeading !== null &&
    !context.candidate.headings.includes(range.endHeading) &&
    range.endHeading !== context.inventory.parts.find(part => part.partCode === 'P5')?.endHeading
  ) {
    blockers.push('end_heading_not_found');
  }
  if (range.sectionHash !== context.candidate.sha256) blockers.push('section_hash_mismatch');
  if (!RANGE_ROLES.has(range.rangeRole)) blockers.push('range_role_invalid');
  const startPositions = anchorPositions(context.candidate.text, range.startAnchor);
  if (startPositions.length !== 1) blockers.push('start_anchor_not_unique');
  const endPositions = range.endAnchor === null
    ? [context.candidate.text.length]
    : anchorPositions(context.candidate.text, range.endAnchor);
  if (endPositions.length !== 1) blockers.push('end_anchor_not_unique');
  if (
    startPositions.length === 1 &&
    endPositions.length === 1 &&
    endPositions[0] <= startPositions[0]
  ) {
    blockers.push('anchor_order_invalid');
  }
  if (range.crossSectionNodeCode && !allNodeCodes.has(range.crossSectionNodeCode)) {
    blockers.push('range_cross_section_node_invalid');
  }
  return blockers;
}

export function evaluateP5MappingReview(review, context) {
  topLevelReviewIdentity(review, context);
  const blueprintNodes = p5BlueprintNodes(context);
  const expectedCodes = blueprintNodes.map(node => node.nodeCode);
  const actualCodes = Array.isArray(review.nodes) ? review.nodes.map(node => node?.nodeCode) : [];
  if (JSON.stringify(actualCodes) !== JSON.stringify(expectedCodes)) {
    throw coded('P5_MAPPING_REVIEW_NODE_SEQUENCE_MISMATCH', {
      expected: expectedCodes,
      actual: actualCodes
    });
  }
  const allNodeCodes = new Set(deriveBookIBlueprintNodes(
    context.blueprint,
    context.manifest
  ).map(node => node.nodeCode));
  const rangeCodes = new Set();
  const nodeResults = review.nodes.map((node, index) => {
    const blockers = [];
    if (node.sequence !== index + 1) blockers.push('sequence_invalid');
    if (node.titleZhHans !== blueprintNodes[index].titleZhHans) blockers.push('title_mismatch');
    if (node.decision !== 'approved') blockers.push('decision_not_approved');
    for (const check of REQUIRED_MAPPING_REVIEW_CHECKS) {
      if (node.checks?.[check] !== true) blockers.push(`check_missing:${check}`);
    }
    if (!Array.isArray(node.ranges) || node.ranges.length === 0) {
      blockers.push('ranges_required');
    } else {
      for (const range of node.ranges) {
        blockers.push(...rangeBlockers(range, node, context, allNodeCodes));
        if (rangeCodes.has(range?.rangeCode)) blockers.push('range_code_duplicate');
        if (clean(range?.rangeCode)) rangeCodes.add(range.rangeCode);
      }
      if (!node.ranges.some(range => range.rangeRole === 'primary')) {
        blockers.push('primary_range_required');
      }
    }
    if (!Array.isArray(node.crossSectionReferences)) {
      blockers.push('cross_section_references_invalid');
    } else {
      const unique = new Set(node.crossSectionReferences);
      if (unique.size !== node.crossSectionReferences.length) {
        blockers.push('cross_section_reference_duplicate');
      }
      for (const reference of node.crossSectionReferences) {
        if (!allNodeCodes.has(reference) || reference === node.nodeCode) {
          blockers.push('cross_section_reference_invalid');
        }
      }
    }
    if (!Array.isArray(node.unresolved) || node.unresolved.length !== 0) {
      blockers.push('unresolved_items_remain');
    }
    if (!['none', 'resolved'].includes(node.conflict?.status)) {
      blockers.push('conflict_not_cleared');
    } else if (
      node.conflict.status === 'resolved' &&
      !clean(node.conflict.resolution)
    ) {
      blockers.push('conflict_resolution_required');
    }
    if (node.paidBookSubstitutionRisk?.status !== 'controlled') {
      blockers.push('paid_book_substitution_risk_not_controlled');
    }
    if (
      node.paidBookSubstitutionRisk?.control !==
      'mapping_metadata_only_no_continuous_body'
    ) {
      blockers.push('paid_book_substitution_control_invalid');
    }
    if (
      node.reviewerRole !== 'TL' ||
      !clean(node.reviewedBy) ||
      !clean(node.reviewedAt) ||
      Number.isNaN(Date.parse(node.reviewedAt))
    ) {
      blockers.push('tl_review_evidence_incomplete');
    }
    return {
      nodeCode: node.nodeCode,
      status: blockers.length ? 'human_review_required' : 'approved',
      blockers: [...new Set(blockers)]
    };
  });
  const blockedNodes = nodeResults.filter(result => result.blockers.length);
  return {
    status: review.application?.status === 'applied'
      ? blockedNodes.length ? 'review_evidence_invalid' : 'mapped'
      : blockedNodes.length ? 'human_review_required' : 'ready_for_atomic_apply',
    nodeCount: nodeResults.length,
    approvedNodeCount: nodeResults.length - blockedNodes.length,
    blockedNodeCount: blockedNodes.length,
    nodeResults,
    readyForApply: blockedNodes.length === 0 && review.application?.status !== 'applied'
  };
}

export function applyApprovedP5Mapping(review, context) {
  const evaluation = evaluateP5MappingReview(review, context);
  if (review.application?.status === 'applied' && evaluation.status === 'mapped') {
    return clone(context.mapping);
  }
  if (!evaluation.readyForApply) {
    throw coded('P5_MAPPING_REVIEW_INCOMPLETE', {
      blockedNodes: evaluation.nodeResults.filter(result => result.blockers.length)
    });
  }
  const approvedByNode = new Map(review.nodes.map(node => [node.nodeCode, node]));
  const nextMapping = clone(context.mapping);
  for (const record of nextMapping.mappings.filter(item => item.partCode === 'P5')) {
    const approved = approvedByNode.get(record.nodeCode);
    record.mappingStatus = 'mapped';
    record.authorityStatus = 'human_confirmed';
    record.ranges = clone(approved.ranges);
    record.crossSectionReferences = clone(approved.crossSectionReferences);
    record.extractionEligibility = 'private_mapped_only';
    record.publicExtractionPolicy = 'prohibited';
    record.unresolved = [];
    record.review = {
      status: 'approved',
      reviewerRole: 'TL',
      humanVerified: true,
      reviewedBy: approved.reviewedBy,
      reviewedAt: approved.reviewedAt,
      confirmations: [...REQUIRED_MAPPING_REVIEW_CHECKS],
      conflictStatus: approved.conflict.status,
      paidBookSubstitutionRisk: {
        status: 'controlled',
        control: 'mapping_metadata_only_no_continuous_body'
      }
    };
    record.stalenessStatus = 'CURRENT';
  }
  return validateBookINodeMapping(nextMapping, {
    manifest: context.manifest,
    blueprint: context.blueprint,
    inventory: context.inventory
  });
}

function common(context, overrides = {}) {
  const p5Nodes = p5BlueprintNodes(context);
  return {
    schemaVersion: T08_SCHEMA_VERSION,
    stage: 'KNR-W2R1-T09-P5',
    bookCode: context.manifest.bookCode,
    partCode: 'P5',
    candidatePath: context.candidate.path,
    candidateSha256: context.candidate.sha256,
    mappingPath: P5_MAPPING_RELATIVE,
    mappingSha256: context.mappingSha256,
    reviewPath: P5_MAPPING_REVIEW_RELATIVE,
    blueprintDerivedNodeCount: p5Nodes.length,
    automationMaximumStatus: 'candidate',
    mappedStatusRequiresTL: true,
    privateReviewEvidence: true,
    manuscriptBodyStoredInGit: false,
    publicExtractionAllowed: false,
    paidBookSubstitutionAllowed: false,
    productionModified: false,
    remoteRequestPerformed: false,
    credentialsRequired: false,
    writes: 0,
    mappingWrites: 0,
    ...overrides
  };
}

export function reviewP5NodeMapping({ root, mode = 'dry-run', now }) {
  if (!['dry-run', 'prepare'].includes(mode)) throw coded('P5_MAPPING_REVIEW_MODE_INVALID');
  const context = loadContext(root);
  const reviewFile = resolveWithin(root, P5_MAPPING_REVIEW_RELATIVE);
  if (!fs.existsSync(reviewFile)) {
    if (mode === 'dry-run') {
      return common(context, {
        command: 'review-map-p5',
        mode,
        status: 'review_template_required',
        reviewFilePresent: false,
        approvedNodeCount: 0,
        blockedNodeCount: p5BlueprintNodes(context).length,
        nextAction: 'PREPARE_PRIVATE_TL_REVIEW_TEMPLATE'
      });
    }
    const template = createP5MappingReviewTemplate(context, { now });
    const written = writeJsonAtomic(reviewFile, template, 0o600);
    return common(context, {
      command: 'review-map-p5',
      mode,
      status: 'human_review_required',
      reviewFilePresent: true,
      approvedNodeCount: 0,
      blockedNodeCount: template.nodes.length,
      writes: Number(written),
      nextAction: 'TL_REVIEW_NODES_SEQUENTIALLY'
    });
  }
  const review = readJson(reviewFile, 'P5_MAPPING_REVIEW_FILE_INVALID');
  const evaluation = evaluateP5MappingReview(review, context);
  return common(context, {
    command: 'review-map-p5',
    mode,
    status: evaluation.status,
    reviewFilePresent: true,
    approvedNodeCount: evaluation.approvedNodeCount,
    blockedNodeCount: evaluation.blockedNodeCount,
    nodeResults: evaluation.nodeResults,
    nextAction: evaluation.readyForApply
      ? 'PRIVATE_REVIEW_APPLY_DRY_RUN'
      : evaluation.status === 'mapped'
        ? 'KNR_W2R1_T09_P5_ACCEPTANCE_CHECK'
        : 'CONTINUE_TL_REVIEW'
  });
}

export function applyP5NodeMappingReview({ root, mode = 'dry-run', now }) {
  if (!['dry-run', 'apply'].includes(mode)) throw coded('P5_MAPPING_APPLY_MODE_INVALID');
  const context = loadContext(root);
  const reviewFile = resolveWithin(root, P5_MAPPING_REVIEW_RELATIVE);
  const review = readJson(reviewFile, 'P5_MAPPING_REVIEW_FILE_MISSING');
  const evaluation = evaluateP5MappingReview(review, context);
  if (evaluation.status === 'mapped') {
    return common(context, {
      command: 'apply-map-p5',
      mode,
      status: 'already_mapped',
      approvedNodeCount: evaluation.approvedNodeCount,
      blockedNodeCount: 0,
      nextAction: 'KNR_W2R1_T09_P5_ACCEPTANCE_CHECK'
    });
  }
  if (!evaluation.readyForApply) {
    throw coded('P5_MAPPING_REVIEW_INCOMPLETE', {
      blockedNodes: evaluation.nodeResults.filter(result => result.blockers.length)
    });
  }
  if (mode === 'dry-run') {
    return common(context, {
      command: 'apply-map-p5',
      mode,
      status: 'ready_for_atomic_apply',
      approvedNodeCount: evaluation.approvedNodeCount,
      blockedNodeCount: 0,
      nextAction: 'APPLY_TL_APPROVED_MAPPING'
    });
  }

  const nextMapping = applyApprovedP5Mapping(review, context);
  const mappingWritten = writeJsonAtomic(
    resolveWithin(root, P5_MAPPING_RELATIVE),
    nextMapping,
    0o644
  );
  const nextMappingSha256 = sha256(Buffer.from(jsonText(nextMapping), 'utf8'));
  const nextReview = clone(review);
  nextReview.application = {
    status: 'applied',
    appliedAt: isoNow(now),
    originalMappingSha256: review.application.originalMappingSha256,
    appliedMappingSha256: nextMappingSha256
  };
  let reviewWritten;
  try {
    reviewWritten = writeJsonAtomic(reviewFile, nextReview, 0o600);
  } catch (error) {
    if (mappingWritten) {
      writeJsonAtomic(resolveWithin(root, P5_MAPPING_RELATIVE), context.mapping, 0o644);
    }
    throw error;
  }
  return common({ ...context, mappingSha256: nextMappingSha256 }, {
    command: 'apply-map-p5',
    mode,
    status: 'mapped',
    approvedNodeCount: evaluation.approvedNodeCount,
    blockedNodeCount: 0,
    writes: Number(mappingWritten) + Number(reviewWritten),
    mappingWrites: Number(mappingWritten),
    nextAction: 'KNR_W2R1_T09_P5_ACCEPTANCE_CHECK'
  });
}
