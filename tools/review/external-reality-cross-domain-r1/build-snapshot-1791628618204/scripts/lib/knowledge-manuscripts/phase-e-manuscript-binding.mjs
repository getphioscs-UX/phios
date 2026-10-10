import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadUniversalManuscriptRuntime } from './universal-manuscript-runtime.mjs';
import { loadKnowledgeRegistryAuthorities } from '../knowledge-blueprint/registry-authority.mjs';
import { resolvePublicationContext } from '../knowledge-production/publication-context.mjs';
import { loadSemanticGraphRuntime } from '../knowledge-runtime/semantic-graph.mjs';

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const coded = (code, details = null) => Object.assign(new Error(code), { code, details });
const isSha = value => /^[a-f0-9]{64}$/i.test(value || '');
const forbiddenUrl = value => typeof value === 'string' && /^https?:\/\//i.test(value);
const credentialPattern = /(secret|credential|password|token|api[_-]?key|access[_-]?key)/i;

export const PUBLIC_EXTRACTION_BOUNDARY = Object.freeze({
  maySummarize: true,
  mayParaphrase: true,
  mayQuote: false,
  requiresHumanReview: true,
  mappedDoesNotCreatePublicFragment: true
});

export function validatePrivateManuscriptContract(root = process.cwd()) {
  const runtime = loadUniversalManuscriptRuntime(root);
  const results = [];
  for (const [manuscriptCode, entry] of runtime.manifests) {
    const manifest = entry.manifest;
    if (entry.private !== true) throw coded('MANUSCRIPT_NOT_PRIVATE', { manuscriptCode });
    if (manifest.publicAccess !== 'disabled' || manifest.retrievalEligibility !== 'internal_only') {
      throw coded('MANUSCRIPT_PUBLIC_ACCESS_NOT_DISABLED', { manuscriptCode });
    }
    if (!manifest.r2Bucket || forbiddenUrl(manifest.r2Bucket)) throw coded('PRIVATE_R2_BUCKET_INVALID', { manuscriptCode });
    if (!Array.isArray(manifest.objects) || manifest.objects.length === 0) throw coded('MANUSCRIPT_OBJECT_METADATA_MISSING', { manuscriptCode });
    for (const object of manifest.objects) {
      if (!object.objectKey || forbiddenUrl(object.objectKey)) throw coded('PUBLIC_MANUSCRIPT_URL_FORBIDDEN', { manuscriptCode });
      if (!object.contentType || !Number.isFinite(object.sizeBytes) || !isSha(object.sha256)) throw coded('MANUSCRIPT_OBJECT_METADATA_INVALID', { manuscriptCode, objectKey: object.objectKey });
      for (const [key, value] of Object.entries(object)) {
        if (credentialPattern.test(key) || (typeof value === 'string' && credentialPattern.test(value) && key !== 'objectKey')) {
          throw coded('MANUSCRIPT_CREDENTIAL_FORBIDDEN', { manuscriptCode, key });
        }
      }
    }
    const authoritative = manifest.objects.filter(object => object.authoritative === true);
    if (authoritative.length !== 1 || authoritative[0].sha256 !== manifest.contentHashes?.sourceObjectSha256) {
      throw coded('MANUSCRIPT_SOURCE_HASH_MISMATCH', { manuscriptCode });
    }
    results.push({ manuscriptCode, sourceHash: authoritative[0].sha256, objectCount: manifest.objects.length, valid: true });
  }
  return Object.freeze(results);
}

export function validateSectionInventory(root = process.cwd()) {
  const runtime = loadUniversalManuscriptRuntime(root);
  const results = [];
  for (const [manuscriptCode, inventory] of runtime.inventories) {
    const sections = inventory.sections || [];
    if (!sections.length) throw coded('SECTION_INVENTORY_EMPTY', { manuscriptCode });
    const codes = new Set();
    const hashes = new Set();
    sections.forEach((section, index) => {
      if (!section.sectionCode || codes.has(section.sectionCode)) throw coded('SECTION_DUPLICATE', { manuscriptCode, sectionCode: section.sectionCode });
      codes.add(section.sectionCode);
      if (!section.startHeading || !section.startAnchor || !isSha(section.sourceRangeHash)) throw coded('SECTION_RANGE_INVALID', { manuscriptCode, sectionCode: section.sectionCode });
      if (hashes.has(`${section.partCode}:${section.sourceRangeHash}`)) throw coded('SECTION_HASH_DUPLICATE', { manuscriptCode, sectionCode: section.sectionCode });
      hashes.add(`${section.partCode}:${section.sourceRangeHash}`);
      if (section.sectionOrder !== index) throw coded('SECTION_ORDER_INVALID', { manuscriptCode, sectionCode: section.sectionCode });
      const previous = index === 0 ? null : sections[index - 1].sectionCode;
      const next = index === sections.length - 1 ? null : sections[index + 1].sectionCode;
      if (section.previousSection !== previous || section.nextSection !== next) throw coded('SECTION_LINKAGE_INVALID', { manuscriptCode, sectionCode: section.sectionCode });
    });
    const manifest = runtime.manifests.get(manuscriptCode).manifest;
    for (const part of manifest.parts || []) {
      if (!sections.some(section => section.partCode === part.partCode)) throw coded('SECTION_PART_MISSING', { manuscriptCode, partCode: part.partCode });
    }
    results.push({ manuscriptCode, sectionCount: sections.length, valid: true });
  }
  return Object.freeze(results);
}

export async function validateApprovedMappings(root = process.cwd()) {
  const runtime = loadUniversalManuscriptRuntime(root);
  const authorities = await loadKnowledgeRegistryAuthorities(root);
  const graph = loadSemanticGraphRuntime(root);
  const mappings = runtime.approvedRegistry.mappings || [];
  const identities = new Set();
  const validated = [];
  for (const mapping of mappings) {
    if (!mapping.mappingCode || identities.has(mapping.mappingCode)) throw coded('APPROVED_MAPPING_IDENTITY_INVALID', { mappingCode: mapping.mappingCode });
    identities.add(mapping.mappingCode);
    if (mapping.authorityStatus !== 'approved' || !mapping.approvedBy || !mapping.approvedAt) throw coded('APPROVED_MAPPING_HUMAN_AUTHORITY_REQUIRED', { mappingCode: mapping.mappingCode });
    if (!authorities.byNodeCode.has(mapping.nodeCode)) throw coded('APPROVED_MAPPING_NODE_UNKNOWN', { mappingCode: mapping.mappingCode });
    const resolved = runtime.resolveSection(mapping.sectionCode);
    if (mapping.sourceRangeHash !== resolved.section.sourceRangeHash) throw coded('APPROVED_MAPPING_RANGE_HASH_STALE', { mappingCode: mapping.mappingCode });
    if (mapping.stale === true) throw coded('APPROVED_MAPPING_STALE', { mappingCode: mapping.mappingCode });
    const publicationContext = await resolvePublicationContext(root, mapping.nodeCode, { authorities });
    const semantic = graph.resolve(mapping.nodeCode);
    if (!semantic.semanticProfile) throw coded('APPROVED_MAPPING_SEMANTIC_PROFILE_MISSING', { mappingCode: mapping.mappingCode });
    validated.push({ ...mapping, publicationContext, semanticCompatibility: 'profile_present', stale: false });
  }
  return Object.freeze(validated);
}

export function createExtractionCandidate({ mapping, section, sourceHash, content = null }) {
  if (!mapping || mapping.authorityStatus !== 'approved' || !mapping.approvedBy) throw coded('EXTRACTION_REQUIRES_APPROVED_MAPPING');
  if (!section || mapping.sourceRangeHash !== section.sourceRangeHash) throw coded('EXTRACTION_RANGE_HASH_MISMATCH');
  return Object.freeze({
    extractionCode: `EX-${mapping.mappingCode}`,
    mappingCode: mapping.mappingCode,
    nodeCode: mapping.nodeCode,
    sectionCode: mapping.sectionCode,
    sourceHash,
    sourceRangeHash: section.sourceRangeHash,
    content,
    boundary: PUBLIC_EXTRACTION_BOUNDARY,
    status: 'candidate',
    humanReviewRequired: true,
    humanReviewed: false,
    approved: false,
    publicFragmentAllowed: false,
    productionReady: false,
    published: false
  });
}

export function bindPjaC1({ mapping, extractionCandidate }) {
  if (mapping.authorityStatus !== 'approved') throw coded('PJA_C1_APPROVED_MAPPING_REQUIRED');
  if (extractionCandidate.status !== 'candidate' || extractionCandidate.approved === true) throw coded('PJA_C1_CANDIDATE_STATE_INVALID');
  return Object.freeze({
    bindingCode: `C1-${mapping.mappingCode}`,
    mappingCode: mapping.mappingCode,
    extractionCode: extractionCandidate.extractionCode,
    nodeCode: mapping.nodeCode,
    sectionCode: mapping.sectionCode,
    sourceHash: extractionCandidate.sourceHash,
    sourceRangeHash: extractionCandidate.sourceRangeHash,
    stale: false,
    authority: 'human_approved_mapping',
    readinessChanged: false,
    status: 'bound'
  });
}

export function freezePjaC2({ c1, extraction }) {
  if (!c1 || c1.status !== 'bound') throw coded('PJA_C2_C1_REQUIRED');
  if (!extraction || extraction.status !== 'approved' || extraction.humanReviewed !== true) throw coded('PJA_C2_HUMAN_APPROVED_EXTRACTION_REQUIRED');
  const required = ['canonicalThesis','mechanism','mustEstablish','distinctions','includedScope','excludedScope','mustNotClaim','publicBoundary'];
  for (const key of required) if (!(key in extraction)) throw coded('PJA_C2_FIELD_MISSING', { key });
  return Object.freeze({ freezeCode: `C2-${c1.nodeCode}`, nodeCode: c1.nodeCode, c1BindingCode: c1.bindingCode, ...Object.fromEntries(required.map(key => [key, extraction[key]])), status: 'human_frozen' });
}

export function evaluatePjaC3(input) {
  const gates = {
    mappingExists: Boolean(input.mapping),
    mappingApproved: input.mapping?.authorityStatus === 'approved',
    mappingNotStale: input.mapping?.stale !== true,
    extractionAllowed: input.extraction?.status === 'approved' && input.extraction?.publicFragmentAllowed === true,
    replacementRiskReviewed: input.replacementRiskReviewed === true,
    humanReviewComplete: input.extraction?.humanReviewed === true,
    blueprintContextValid: input.blueprintContextValid === true,
    publicationOwnershipValid: input.publicationOwnershipValid === true,
    localeReady: input.localeReady === true,
    terminologyReady: input.terminologyReady === true,
    translationBoundaryValid: input.translationBoundaryValid === true
  };
  const productionReady = Object.values(gates).every(Boolean);
  return Object.freeze({ gates, productionReady, status: productionReady ? 'production_ready' : 'blocked' });
}

export function digestJson(value) {
  return sha256(JSON.stringify(value));
}
