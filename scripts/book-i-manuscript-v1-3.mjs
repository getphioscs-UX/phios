import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { generatePartMappingCandidates } from './lib/knowledge-manuscripts/part-mapping-candidate-generation.mjs';
import { suggestPartNodeRanges } from './lib/knowledge-manuscripts/mapping-range-suggestion.mjs';
import { reviewP1NodeMapping } from './lib/knowledge-manuscripts/p1-mapping-review.mjs';
import { reviewP2NodeMapping } from './lib/knowledge-manuscripts/p2-mapping-review.mjs';
import { reviewP3NodeMapping } from './lib/knowledge-manuscripts/p3-mapping-review.mjs';
import { reviewP4NodeMapping } from './lib/knowledge-manuscripts/p4-mapping-review.mjs';
import { reviewP5NodeMapping } from './lib/knowledge-manuscripts/p5-mapping-review.mjs';
import { deriveBookIBlueprintNodes } from './book-i-manuscript.mjs';

const ROOT = process.cwd();
const SCHEMA_VERSION = 'PHI-OS-KNR-W2R1-v1.3.0';
const PART_CODES = Object.freeze(['P1', 'P2', 'P3', 'P4', 'P5']);
const reviewers = Object.freeze({
  P1: reviewP1NodeMapping,
  P2: reviewP2NodeMapping,
  P3: reviewP3NodeMapping,
  P4: reviewP4NodeMapping,
  P5: reviewP5NodeMapping
});
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const relative = file => path.relative(ROOT, file).replaceAll('\\', '/');

function authority() {
  const manifest = readJson(path.join(ROOT, 'content/knowledge/manuscripts/book-1/manuscript-manifest.json'));
  const inventory = readJson(path.join(ROOT, 'content/knowledge/manuscripts/book-1/book-1-section-inventory.json'));
  const blueprint = readJson(path.join(ROOT, 'content/knowledge/blueprints/book-1-knowledge-blueprint.json'));
  return { manifest, inventory, blueprint };
}

function rangeAudit(partCode) {
  const { manifest, inventory, blueprint } = authority();
  const inventoryPart = inventory.parts.find(part => part.partCode === partCode);
  if (!inventoryPart) throw new Error(`${partCode}_INVENTORY_PART_MISSING`);
  const nodes = deriveBookIBlueprintNodes(blueprint, manifest).filter(node => node.partCode === partCode);
  return suggestPartNodeRanges({
    root: ROOT,
    partCode,
    blueprintNodes: nodes,
    sectionHash: inventoryPart.sectionHash
  });
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const apply = args.includes('--apply');

  if (command === 'range-audit') {
    const requested = args.find(value => /^P[1-5]$/u.test(value));
    const codes = requested ? [requested] : PART_CODES;
    const parts = codes.map(partCode => ({ partCode, ...rangeAudit(partCode) }));
    console.log(JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      command,
      status: 'candidate_heading_ranges_analyzed',
      automationMaximumStatus: 'candidate',
      mappedStatusRequiresTL: true,
      parts
    }, null, 2));
    return;
  }

  if (command === 'refresh-mapping-candidates') {
    const results = [];
    for (const partCode of PART_CODES) {
      results.push(generatePartMappingCandidates({ root: ROOT, partCode, mode: apply ? 'apply' : 'dry-run' }));
    }
    console.log(JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      command,
      mode: apply ? 'apply' : 'dry-run',
      status: apply ? 'mapping_candidates_refreshed' : 'mapping_candidate_refresh_plan_validated',
      results,
      writes: results.reduce((total, item) => total + (item.writes || 0), 0)
    }, null, 2));
    return;
  }

  if (command === 'prepare-mapping-reviews') {
    if (!apply) {
      const plans = PART_CODES.map(partCode => ({
        partCode,
        reviewPath: `.tmp/knowledge-manuscripts/book-1/${partCode.toLowerCase()}-node-mapping-review.json`,
        staleIdentityPolicy: 'archive_and_regenerate_on_prepare',
        headingAuthority: 'candidate_markdown'
      }));
      console.log(JSON.stringify({ schemaVersion: SCHEMA_VERSION, command, mode: 'dry-run', status: 'review_prepare_plan_validated', plans, writes: 0 }, null, 2));
      return;
    }
    const results = [];
    for (const partCode of PART_CODES) {
      results.push(reviewers[partCode]({ root: ROOT, mode: 'prepare' }));
    }
    console.log(JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      command,
      mode: 'apply',
      status: 'mapping_reviews_prepared',
      headingAuthority: 'candidate_markdown',
      staleReviewPolicy: 'archive_and_regenerate',
      results,
      writes: results.reduce((total, item) => total + (item.writes || 0), 0)
    }, null, 2));
    return;
  }

  if (command === 'refresh-all') {
    if (!apply) {
      console.log(JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        command,
        mode: 'dry-run',
        status: 'full_refresh_plan_validated',
        sequence: ['refresh-mapping-candidates --apply', 'prepare-mapping-reviews --apply'],
        humanApprovalAutomatic: false,
        mappedStatusAutomatic: false,
        writes: 0
      }, null, 2));
      return;
    }
    const candidates = [];
    for (const partCode of PART_CODES) candidates.push(generatePartMappingCandidates({ root: ROOT, partCode, mode: 'apply' }));
    const reviews = [];
    for (const partCode of PART_CODES) reviews.push(reviewers[partCode]({ root: ROOT, mode: 'prepare' }));
    console.log(JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      command,
      mode: 'apply',
      status: 'mapping_candidates_and_reviews_refreshed',
      candidates,
      reviews,
      automationMaximumStatus: 'candidate',
      mappedStatusRequiresTL: true,
      writes: [...candidates, ...reviews].reduce((total, item) => total + (item.writes || 0), 0)
    }, null, 2));
    return;
  }

  throw new Error('COMMAND_REQUIRED: range-audit [P1|P2|P3|P4|P5] | refresh-mapping-candidates [--apply] | prepare-mapping-reviews [--apply] | refresh-all [--apply]');
}

main().catch(error => {
  console.error(JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    status: 'blocked',
    code: error?.code || error?.message || 'UNKNOWN_ERROR',
    details: error?.details || null
  }, null, 2));
  process.exitCode = 2;
});
