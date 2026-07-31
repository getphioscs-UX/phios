import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const fail = (message) => { throw new Error(message); };
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');

const blueprint = read('content/knowledge/blueprints/book-1-knowledge-blueprint.json');
const registry = read('content/knowledge/registry/nodes.json');
const meanings = read('content/knowledge/meaning/registry/meanings.json');
const rules = read('content/knowledge/meaning/registry/formation-rules.json');
const projections = read('content/knowledge/meaning/registry/projections.json');
const relationships = read('content/knowledge/meaning/registry/meaning-relationships.json');
const inventory = read('content/knowledge/meaning/inventory/book-i-meaning-inventory.json');

if (inventory.contract !== 'PHI-OS-KMR-W1-BOOK-I-MEANING-INVENTORY-v1.0.0') fail('Unexpected KMR-W1 inventory contract.');
if (inventory.scope.bookCode !== 'BOOK-I') fail('Inventory must be scoped to BOOK-I.');
if (inventory.summary.plannedCanonicalNodes !== blueprint.plannedCanonicalNodes) fail('Planned node count must match Blueprint.');
if (inventory.nodes.length !== blueprint.plannedCanonicalNodes) fail('Every Blueprint node must appear exactly once.');

const codes = inventory.nodes.map((node) => node.nodeCode);
if (new Set(codes).size !== codes.length) fail('Inventory contains duplicate node codes.');
const expectedCodes = blueprint.parts.flatMap((part) => part.nodes);
if (JSON.stringify(codes) !== JSON.stringify(expectedCodes)) fail('Inventory order must follow frozen Blueprint part and node order.');

const registeredCodes = new Set(registry.nodes.map((node) => node.nodeCode));
const expectedRegistered = codes.filter((code) => registeredCodes.has(code)).length;
if (inventory.summary.registeredCanonicalNodes !== expectedRegistered) fail('Registered node count does not match Registry.');
if (inventory.summary.blueprintOnlyCanonicalNodes !== codes.length - expectedRegistered) fail('Blueprint-only count is invalid.');

if (inventory.summary.canonicalMeaningRecords !== meanings.records.length) fail('Meaning count must reflect the Meaning Registry.');
if (inventory.summary.formationRuleRecords !== rules.records.length) fail('Formation Rule count must reflect the Registry.');
if (inventory.summary.projectionRecords !== projections.records.length) fail('Projection count must reflect the Registry.');
if (inventory.summary.meaningRelationshipRecords !== relationships.records.length) fail('Relationship count must reflect the Registry.');

for (const node of inventory.nodes) {
  if (node.manuscriptSourcePresence !== 'not_inventoryable_from_repository') fail(`${node.nodeCode} invents a manuscript availability state.`);
  if (node.registryPresence !== registeredCodes.has(node.nodeCode)) fail(`${node.nodeCode} registry presence is incorrect.`);
  if (!node.registryPresence && node.inventoryState !== 'blueprint_only') fail(`${node.nodeCode} must remain blueprint_only.`);
  if (node.meaningPresence && !node.meaningId) fail(`${node.nodeCode} has Meaning presence without an ID.`);
  if (!node.meaningPresence && node.authorityBoundary !== 'no_meaning_authority_created') fail(`${node.nodeCode} implies Meaning authority.`);
}

const summaryFromParts = inventory.parts.reduce((sum, part) => sum + part.plannedCanonicalNodes, 0);
if (summaryFromParts !== inventory.summary.plannedCanonicalNodes) fail('Part totals do not reconcile with Book I total.');
if (inventory.parts.length !== blueprint.parts.length) fail('Every Blueprint part must be inventoried.');

const expectedHash = hash(JSON.stringify({ summary: inventory.summary, parts: inventory.parts, nodes: inventory.nodes }));
if (inventory.inventoryHash !== expectedHash) fail('Inventory hash is stale or non-deterministic.');

const boundaries = inventory.boundaries;
for (const key of ['inventoryOnly']) if (boundaries[key] !== true) fail(`${key} must be true.`);
for (const key of ['createsCanonicalMeaning','createsFormationRules','createsProjectionRecords','changesNodeRegistration','changesPublicationState','changesPublicWebsite']) {
  if (boundaries[key] !== false) fail(`${key} must remain false.`);
}

if (!fs.existsSync(path.join(ROOT, 'docs/kmr/KMR-W1-BOOK-I-MEANING-INVENTORY.md'))) fail('KMR-W1 documentation is missing.');

console.log('✓ KMR-W1 Book I Meaning Inventory passed.');
console.log(`  ${inventory.summary.plannedCanonicalNodes} Book I Blueprint Nodes are inventoried across ${inventory.parts.length} parts.`);
console.log(`  ${inventory.summary.registeredCanonicalNodes} Preface Nodes are registered; ${inventory.summary.blueprintOnlyCanonicalNodes} Nodes remain Blueprint-only.`);
console.log(`  Meaning ${inventory.summary.canonicalMeaningRecords}, Formation Rule ${inventory.summary.formationRuleRecords}, Relationship ${inventory.summary.meaningRelationshipRecords} and Projection ${inventory.summary.projectionRecords} records remain authority-safe.`);
console.log(`  ${inventory.summary.legacyPublishedArticleAssets} legacy Article assets covering ${inventory.summary.nodesWithLegacyPublishedArticles} Nodes remain governed by PJA.`);
console.log('  No manuscript content, Meaning authority, publication state or public website was changed.');
console.log('  State: KMR-W1-v1.0.0-Book-I-Inventory-Complete.');
