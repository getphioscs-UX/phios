import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  deriveBookIBlueprintNodes,
  validateBookINodeMapping,
  validateBookISectionInventory
} from '../../book-i-manuscript.mjs';

export const MAPPING_CANDIDATE_SCHEMA_VERSION =
  'PHI-OS-KNR-W2R1-PART-MAPPING-CANDIDATE-v1.0.0';
export const MAPPING_RELATIVE =
  'content/knowledge/manuscripts/book-1/node-manuscript-mapping.json';
export const INVENTORY_RELATIVE =
  'content/knowledge/manuscripts/book-1/book-1-section-inventory.json';
export const MANIFEST_RELATIVE =
  'content/knowledge/manuscripts/book-1/manuscript-manifest.json';
export const BLUEPRINT_RELATIVE =
  'content/knowledge/blueprints/book-1-knowledge-blueprint.json';

const PART_CODES = Object.freeze(['P1', 'P2', 'P3', 'P4', 'P5']);
const coded = (code, details = null) => Object.assign(new Error(code), { code, details });
const clone = value => JSON.parse(JSON.stringify(value));
const sha256 = value => createHash('sha256').update(value).digest('hex');

function resolveWithin(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relativePath);
  if (!resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw coded('PART_MAPPING_CANDIDATE_PATH_ESCAPE', { path: relativePath });
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

function writeJsonAtomic(file, value) {
  const next = jsonText(value);
  if (fs.readFileSync(file, 'utf8') === next) return false;
  const temporary = `${file}.partial-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(temporary, next, { flag: 'wx', mode: 0o600 });
    fs.renameSync(temporary, file);
  } catch (error) {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    throw error;
  }
  return true;
}

function loadContext(root) {
  const manifest = readJson(
    resolveWithin(root, MANIFEST_RELATIVE),
    'PART_MAPPING_CANDIDATE_MANIFEST_MISSING'
  );
  const inventory = validateBookISectionInventory(
    readJson(resolveWithin(root, INVENTORY_RELATIVE), 'PART_MAPPING_CANDIDATE_INVENTORY_MISSING'),
    manifest
  );
  const blueprint = readJson(
    resolveWithin(root, BLUEPRINT_RELATIVE),
    'PART_MAPPING_CANDIDATE_BLUEPRINT_MISSING'
  );
  const mappingFile = resolveWithin(root, MAPPING_RELATIVE);
  const mappingSource = fs.readFileSync(mappingFile, 'utf8');
  const mapping = validateBookINodeMapping(JSON.parse(mappingSource), {
    manifest,
    blueprint,
    inventory
  });
  return { manifest, inventory, blueprint, mapping, mappingFile, mappingSource };
}

function assertSequentialEligibility(partCode, context) {
  const index = PART_CODES.indexOf(partCode);
  if (index === -1) throw coded('PART_MAPPING_CANDIDATE_PART_INVALID', { partCode });
  const inventoryPart = context.inventory.parts.find(part => part.partCode === partCode);
  const manifestHash = context.manifest.contentHashes?.normalizedParts?.[partCode] ?? null;
  if (
    !inventoryPart ||
    inventoryPart.normalizationStatus !== 'human_verified' ||
    inventoryPart.humanVerified !== true ||
    inventoryPart.stalenessStatus !== 'CURRENT' ||
    !inventoryPart.sectionHash ||
    inventoryPart.sectionHash !== manifestHash
  ) {
    throw coded(`${partCode}_MAPPING_CANDIDATE_MANUSCRIPT_NOT_READY`, {
      normalizationStatus: inventoryPart?.normalizationStatus ?? null,
      humanVerified: inventoryPart?.humanVerified ?? null,
      stalenessStatus: inventoryPart?.stalenessStatus ?? null,
      inventorySectionHash: inventoryPart?.sectionHash ?? null,
      manifestSectionHash: manifestHash
    });
  }
  const previousPartCode = index === 0 ? 'P0' : PART_CODES[index - 1];
  const previousRecords = context.mapping.mappings.filter(record => record.partCode === previousPartCode);
  if (!previousRecords.length || previousRecords.some(record => !['candidate', 'mapped'].includes(record.mappingStatus))) {
    throw coded(`${partCode}_MAPPING_CANDIDATE_PREVIOUS_PART_REQUIRED`, {
      previousPartCode,
      statuses: [...new Set(previousRecords.map(record => record.mappingStatus))]
    });
  }
  return inventoryPart;
}

export function generatePartMappingCandidates({ root, partCode, mode = 'dry-run' }) {
  if (!['dry-run', 'apply'].includes(mode)) {
    throw coded('PART_MAPPING_CANDIDATE_MODE_INVALID', { mode });
  }
  const context = loadContext(root);
  const inventoryPart = assertSequentialEligibility(partCode, context);
  const blueprintNodes = deriveBookIBlueprintNodes(context.blueprint, context.manifest)
    .filter(node => node.partCode === partCode);
  const targetRecords = context.mapping.mappings.filter(record => record.partCode === partCode);
  if (targetRecords.length !== blueprintNodes.length) {
    throw coded(`${partCode}_MAPPING_CANDIDATE_COVERAGE_MISMATCH`, {
      blueprintNodeCount: blueprintNodes.length,
      mappingRecordCount: targetRecords.length
    });
  }
  const statuses = [...new Set(targetRecords.map(record => record.mappingStatus))];
  const alreadyCandidate = statuses.length === 1 && statuses[0] === 'candidate';
  if (!alreadyCandidate && !(statuses.length === 1 && statuses[0] === 'unmapped')) {
    throw coded(`${partCode}_MAPPING_CANDIDATE_STATE_INVALID`, { statuses });
  }

  const next = clone(context.mapping);
  if (!alreadyCandidate) {
    const nodeCodes = new Set(blueprintNodes.map(node => node.nodeCode));
    for (const record of next.mappings) {
      if (!nodeCodes.has(record.nodeCode)) continue;
      record.mappingStatus = 'candidate';
      record.authorityStatus = 'automation_candidate';
      record.ranges = [{
        rangeCode: `${record.nodeCode}-R01`,
        startHeading: inventoryPart.startHeading,
        endHeading: inventoryPart.endHeading,
        startAnchor: inventoryPart.startAnchor,
        endAnchor: inventoryPart.endAnchor,
        sectionHash: inventoryPart.sectionHash,
        rangeRole: 'primary'
      }];
      record.crossSectionReferences = [];
      record.extractionEligibility = 'private_candidate_only';
      record.unresolved = [
        'exact_primary_range_requires_tl_confirmation',
        'supporting_ranges_not_assessed',
        'cross_section_references_not_assessed'
      ];
      record.review = {
        status: 'pending_tl_review',
        reviewerRole: 'TL',
        humanVerified: false,
        reviewedBy: null,
        reviewedAt: null
      };
      record.stalenessStatus = 'CURRENT';
    }
  }

  validateBookINodeMapping(next, {
    manifest: context.manifest,
    blueprint: context.blueprint,
    inventory: context.inventory
  });

  let writes = 0;
  if (mode === 'apply' && !alreadyCandidate) {
    writes = writeJsonAtomic(context.mappingFile, next) ? 1 : 0;
  }
  return {
    schemaVersion: MAPPING_CANDIDATE_SCHEMA_VERSION,
    stage: `KNR-W2R1-T09-${partCode}`,
    command: `generate-map-${partCode.toLowerCase()}`,
    mode,
    status: alreadyCandidate ? 'already_candidate' : mode === 'apply' ? 'candidates_generated' : 'candidate_plan_validated',
    bookCode: context.manifest.bookCode,
    partCode,
    mappingPath: MAPPING_RELATIVE,
    mappingSha256Before: sha256(context.mappingSource),
    mappingSha256After: sha256(jsonText(next)),
    blueprintNodeCount: blueprintNodes.length,
    generatedCandidateCount: alreadyCandidate ? 0 : blueprintNodes.length,
    targetStatusBefore: statuses[0],
    targetStatusAfter: 'candidate',
    authorityStatusAfter: 'automation_candidate',
    extractionEligibilityAfter: 'private_candidate_only',
    priorPartsPreserved: true,
    laterPartsPreserved: true,
    automaticHumanVerification: false,
    automaticMappedStatus: false,
    publicExtractionAllowed: false,
    manuscriptBodyStored: false,
    productionModified: false,
    remoteRequestPerformed: false,
    credentialsRequired: false,
    writes,
    nextAction: `KNR-W2R1-T09-${partCode}_MAPPING_REVIEW_PREPARE`
  };
}
