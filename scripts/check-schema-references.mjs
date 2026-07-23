import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const INTERNAL_REGISTRY_SCHEMAS = Object.freeze({
  'content/registry/provider-closure.json':
    'phi-os.provider-closure.v1',
  'content/registry/runtime-bugs.json':
    'phi-os.runtime-bug-register.v1',
  'content/registry/runtime-freeze-audit.json':
    'phi-os.runtime-freeze-audit.v1',
  'content/registry/runtime-freeze-closure.json':
    'phi-os.runtime-freeze-closure.v1',
  'content/registry/runtime-contracts.json':
    'phi-os.runtime-contract-registry.v1',
  'content/registry/runtime-modules.json':
    'phi-os.runtime-module-registry.v1'
});

const BOOK_MANIFESTS = Object.freeze([
  'data/schemas/book-manifest.json',
  'content/registry/book-1-manifest.json'
]);

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);

  try {
    return JSON.parse(
      fs.readFileSync(absolutePath, 'utf8')
    );
  } catch (error) {
    throw new Error(
      `Invalid JSON: ${relativePath}\n${error.message}`
    );
  }
}

function jsonFiles(directory) {
  const output = [];

  for (const entry of fs.readdirSync(directory, {
    withFileTypes: true
  })) {
    if (
      entry.name === '.git' ||
      entry.name === 'node_modules'
    ) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      output.push(...jsonFiles(absolutePath));
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.json')
    ) {
      output.push(absolutePath);
    }
  }

  return output;
}

function isRemoteSchema(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function validateSchemaReference(absolutePath, document) {
  if (!Object.hasOwn(document, '$schema')) return;

  const reference = typeof document.$schema === 'string'
    ? document.$schema.trim()
    : '';
  const relativePath = path.relative(root, absolutePath)
    .replaceAll(path.sep, '/');

  if (!reference) {
    throw new Error(`Empty $schema reference: ${relativePath}`);
  }

  if (reference.startsWith('phi-os.')) {
    throw new Error(
      `Internal Contract ID must use schema_id, not $schema: ${relativePath}`
    );
  }

  if (isRemoteSchema(reference)) return;

  if (path.isAbsolute(reference)) {
    throw new Error(
      `Absolute local $schema reference is forbidden: ${relativePath}`
    );
  }

  const target = path.resolve(
    path.dirname(absolutePath),
    reference
  );

  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    throw new Error(
      `Missing local JSON Schema for ${relativePath}: ${reference}`
    );
  }

  try {
    JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch (error) {
    throw new Error(
      `Referenced JSON Schema is invalid for ${relativePath}: ${reference}\n${error.message}`
    );
  }
}

for (const [relativePath, schemaId] of Object.entries(
  INTERNAL_REGISTRY_SCHEMAS
)) {
  const registry = readJson(relativePath);

  if (Object.hasOwn(registry, '$schema')) {
    throw new Error(
      `Registry still exposes an internal ID through $schema: ${relativePath}`
    );
  }

  if (registry.schema_id !== schemaId) {
    throw new Error(
      `Registry schema_id is missing or changed: ${relativePath}`
    );
  }
}

for (const absolutePath of jsonFiles(root)) {
  const document = readJson(
    path.relative(root, absolutePath)
  );
  validateSchemaReference(absolutePath, document);
}

const manifestSchemaPath =
  'data/schemas/book-manifest.schema.json';
const manifestSchema = readJson(manifestSchemaPath);
const requiredFields = Array.isArray(manifestSchema.required)
  ? manifestSchema.required
  : [];

if (
  manifestSchema.$schema !==
    'https://json-schema.org/draft/2020-12/schema' ||
  manifestSchema.$id !==
    'https://getphios.com/schemas/book-manifest.schema.json'
) {
  throw new Error(
    'Book Manifest Schema identity or draft is invalid.'
  );
}

for (const relativePath of BOOK_MANIFESTS) {
  const manifest = readJson(relativePath);
  const missing = requiredFields.filter(field =>
    !Object.hasOwn(manifest, field)
  );

  if (missing.length > 0) {
    throw new Error(
      `${relativePath} is missing required fields: ${missing.join(', ')}`
    );
  }

  const grammarCodes = Array.isArray(manifest.grammar?.stages)
    ? manifest.grammar.stages.map(stage => stage?.code)
    : [];
  const expectedCodes = Array.from(
    { length: 16 },
    (_, index) => `G${index + 1}`
  );

  if (
    grammarCodes.length !== expectedCodes.length ||
    grammarCodes.some((code, index) => code !== expectedCodes[index])
  ) {
    throw new Error(
      `${relativePath} must preserve the ordered G1–G16 grammar.`
    );
  }

  const figureIds = (manifest.parts || [])
    .flatMap(part => Array.isArray(part?.figures) ? part.figures : []);

  if (
    new Set(figureIds).size !== figureIds.length ||
    manifest.figure_count !== figureIds.length
  ) {
    throw new Error(
      `${relativePath} figure_count does not match unique Part figure references.`
    );
  }
}

console.log(
  '✓ JSON Schema references, internal schema IDs, and Book 1 Manifest Schema checks passed.'
);
