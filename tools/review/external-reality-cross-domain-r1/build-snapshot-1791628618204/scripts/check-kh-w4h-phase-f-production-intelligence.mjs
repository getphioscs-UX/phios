import assert from 'node:assert/strict';
import { loadProductionIntelligenceAuthorities, resolveSupportingNodes, detectDuplicateAndScopeConflicts, planCanonicalAssembly, generateProductionRecommendation, generateProductionBriefV2 } from './lib/knowledge-production/production-intelligence.mjs';

const root = process.cwd();
const authorities = loadProductionIntelligenceAuthorities(root);
assert.equal(authorities.approvedMappings.automaticWritesAllowed, false);
assert.equal(authorities.c2.automaticFreezeAllowed, false);
assert.equal(authorities.c3.automaticPromotionAllowed, false);
assert.equal(authorities.semantic.nodes.size, 716);

const nodeCode = [...authorities.semantic.nodes.keys()][0];
const graph = authorities.semantic.resolve(nodeCode);
const syntheticMapping = { mappingCode: 'MAP-TEST', nodeCode, sectionCode: 'SEC-TEST', authorityStatus: 'approved', approvedBy: 'HUMAN', approvedAt: '2026-08-06T00:00:00Z' };
const syntheticSemantic = { ...authorities.semantic, resolve: () => ({ ...graph, relationships: [{ sourceNodeCode: nodeCode, targetNodeCode: [...authorities.semantic.nodes.keys()][1], relationshipType: 'supports' }] }) };
const resolved = resolveSupportingNodes({ nodeCode, approvedMappings: [syntheticMapping], semantic: syntheticSemantic });
assert.equal(resolved.primaryNode, nodeCode);
assert.equal(resolved.supportingNodes.length, 1);
const conflicts = detectDuplicateAndScopeConflicts({ nodeCode, semantic: authorities.semantic, c2Freezes: [], publicationContext: null });
assert.ok(Array.isArray(conflicts.articleReplacementRisk));
const plan = planCanonicalAssembly({ mapping: syntheticMapping, resolver: resolved, conflicts });
assert.deepEqual(plan.primaryRanges, ['SEC-TEST']);
await assert.rejects(() => generateProductionRecommendation({ root, nodeCode }), /APPROVED_MAPPING_REQUIRED|APPROVED_C2_REQUIRED/);
await assert.rejects(() => generateProductionBriefV2({ root, nodeCode, localeContract: { ready: true }, terminologyContract: { ready: true } }), /APPROVED_MAPPING_REQUIRED|APPROVED_C2_REQUIRED|READINESS_REQUIRED/);
assert.equal(authorities.approvedMappings.mappings.length, 0);
assert.equal(authorities.c2.freezes.length, 0);
assert.equal(authorities.c3.records.length, 0);
console.log('✓ PHASE F Production Intelligence passed.');
console.log('  716 semantic nodes available; all production outputs remain fail-closed without human-approved Mapping, C2 and C3.');
