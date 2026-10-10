import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import Ajv2020 from 'ajv/dist/2020.js';

const root = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const fail = (message) => { console.error(`✗ ${message}`); process.exitCode = 1; };

const indexPath = 'content/books/manuscript-bindings/index.json';
const schemaPath = 'content/books/schemas/canonical-manuscript-binding.schema.json';
const nodesPath = 'content/knowledge/registry/nodes.json';

for (const p of [indexPath, schemaPath, nodesPath]) {
  if (!fs.existsSync(path.join(root, p))) fail(`Missing required file: ${p}`);
}
if (process.exitCode) process.exit();

const index = readJson(indexPath);
const schema = readJson(schemaPath);
const nodesDoc = readJson(nodesPath);
const nodeList = Array.isArray(nodesDoc) ? nodesDoc : (nodesDoc.nodes || nodesDoc.items || []);
const nodeCodes = new Set(nodeList.map((n) => n.nodeCode || n.code).filter(Boolean));
const ajv = new Ajv2020({allErrors: true, strict: false});
const validate = ajv.compile(schema);
const seenNodes = new Set();
const seenPaths = new Set();

if (index?.scope?.hardCodedNodeList !== false || index?.scope?.futureBooksSupported !== true) {
  fail('Binding index must remain universal and future-book compatible.');
}

for (const item of index.bindings || []) {
  if (seenNodes.has(item.nodeCode)) fail(`Duplicate binding nodeCode: ${item.nodeCode}`);
  if (seenPaths.has(item.path)) fail(`Duplicate binding path: ${item.path}`);
  seenNodes.add(item.nodeCode); seenPaths.add(item.path);
  const abs = path.join(root, item.path);
  if (!fs.existsSync(abs)) { fail(`Binding file not found: ${item.path}`); continue; }
  const binding = JSON.parse(fs.readFileSync(abs, 'utf8'));
  if (!validate(binding)) fail(`${item.path}: ${ajv.errorsText(validate.errors, {separator: '; '})}`);
  if (binding.nodeCode !== item.nodeCode) fail(`${item.path}: index nodeCode mismatch`);
  if (binding.bindingStatus !== item.status) fail(`${item.path}: index status mismatch`);
  if (nodeCodes.size && !nodeCodes.has(binding.nodeCode)) fail(`${item.path}: node is not registered: ${binding.nodeCode}`);
  if (binding.range.startAnchor === binding.range.endAnchor) fail(`${item.path}: start and end anchors must differ`);
  if (binding.range.nextNodeAnchor && binding.range.endAnchor.includes(binding.range.nextNodeAnchor)) {
    fail(`${item.path}: next-node anchor must remain outside the bound range`);
  }
}

if (!process.exitCode) {
  console.log(`✓ Canonical Manuscript Binding validation passed (${seenNodes.size} binding${seenNodes.size === 1 ? '' : 's'}).`);
}
