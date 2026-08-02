import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolve = relative => path.join(root, relative);
const exists = relative => fs.existsSync(resolve(relative));
const read = relative => fs.readFileSync(resolve(relative), 'utf8');
const readJson = relative => JSON.parse(read(relative));
const jsonFiles = relative => fs.readdirSync(resolve(relative)).filter(name => name.endsWith('.json')).sort();

const inventory = readJson('docs/knr/knowledge-inventory-reconciliation-v1.json');
assert.equal(inventory.stage, 'KNR-W0R');
assert.equal(inventory.status, 'frozen');
assert.equal(inventory.baseline, 'fd402e6b0565430078707a588cc5ae63e675f483');

for (const entry of inventory.activeInventory) assert.equal(exists(entry), true, `Missing active inventory: ${entry}`);
for (const entry of inventory.generatedReadModels) assert.equal(exists(entry), true, `Missing generated read model: ${entry}`);
for (const entry of inventory.historicalGovernedInventory) assert.equal(exists(entry), true, `Missing governed history: ${entry}`);
for (const entry of inventory.removedInventory) assert.equal(exists(entry.path), false, `Deprecated inventory remains: ${entry.path}`);

assert.equal(exists('content/registry/m3c-navigation-operationalization.json'), true);
assert.equal(jsonFiles('content/knowledge/registry').length, 12);
assert.equal(jsonFiles('content/knowledge/registry/schemas').length, 12);
assert.equal(readJson('content/knowledge/registry/nodes.json').nodes.length, 78);
assert.equal(fs.readdirSync(resolve('content/knowledge/editorial/c2/candidates')).filter(name => name.endsWith('.json')).length, 77);
assert.equal(fs.readdirSync(resolve('content/knowledge/editorial/c3/assessments')).filter(name => name.endsWith('.json')).length, 78);

const articleFiles = ['en', 'zh-Hans'].flatMap(locale => fs.readdirSync(resolve(`content/knowledge/articles/${locale}`)).filter(name => name.endsWith('.json')).map(name => `content/knowledge/articles/${locale}/${name}`));
assert.equal(articleFiles.length, 6);
for (const file of articleFiles) assert.equal(readJson(file).publicationStatus, 'published');

const overview = read('docs/knowledge/PKR-v1.0-overview.md');
const instruction = read('docs/knowledge/PKR-content-production-and-chatgpt-instruction.md');
const dataModel = read('docs/knowledge/PKR-canonical-data-model.md');
assert.match(overview, /Knowledge Runtime Registry/);
assert.match(instruction, /PHI OS Knowledge Runtime/);
assert.match(dataModel, /content\/knowledge\/assets\/articles/);
assert.equal(inventory.historicalNaming.meaningAtFreeze, 'PKR Canonical Knowledge Registry');
assert.equal(inventory.historicalNaming.currentRuntimeProgramme, 'KNR');
assert.equal(inventory.historicalNaming.frozenDocumentsRewritten, false);

assert.equal(inventory.preservedInventory.productionHistoryRemoved, false);
assert.equal(inventory.preservedInventory.canonicalKnowledgeChanged, false);
assert.equal(inventory.preservedInventory.publishedArticleContentChanged, false);
for (const value of Object.values(inventory.boundaries)) assert.equal(value, false);

console.log('KNR-W0R Knowledge Inventory Reconciliation passed.');
console.log('Removed: 8 duplicate/obsolete PKR document copies, 2 patch residues, 1 misplaced Navigation registry record.');
console.log('Preserved: 78 Canonical Nodes, 77 C2 candidates, 78 C3 assessments, Production history and 6 published localized articles.');
console.log('Authority: PKR → PJA → Published Knowledge Assets → KNR. KNR-W3 remains deferred.');
