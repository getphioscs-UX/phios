import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

export const root = process.cwd();
export const base = 'content/financial/data-runtime';
export const readJson = path => JSON.parse(fs.readFileSync(path, 'utf8'));
export const exists = path => fs.existsSync(path);
export const requireFile = path => assert.ok(exists(path), `Missing FDR file: ${path}`);
export const sorted = values => [...values].sort();
export const requireSet = (actual, expected, label) => assert.deepEqual(sorted(actual), sorted(expected), label);
export const sha256File = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
export const canonicalJson = value => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
};
export const digestObject = value => {
  const copy = structuredClone(value);
  if (copy && typeof copy === 'object' && !Array.isArray(copy)) delete copy.digest;
  return crypto.createHash('sha256').update(canonicalJson(copy)).digest('hex');
};
export const fixtureRegistryPath = `${base}/fixtures/fdr-fixture-registry-v1.json`;
export const getFixtures = () => {
  const registry = readJson(fixtureRegistryPath);
  return registry.fixtures.map(item => ({ ...item, data: readJson(item.path) }));
};
export const walkFacts = (value, fn, path = '$') => {
  if (Array.isArray(value)) return value.forEach((v,i) => walkFacts(v, fn, `${path}[${i}]`));
  if (!value || typeof value !== 'object') return;
  if (typeof value.factId === 'string' && typeof value.factCode === 'string' && Object.prototype.hasOwnProperty.call(value,'disclosureState') && Object.prototype.hasOwnProperty.call(value,'evidence')) fn(value,path);
  for (const [k,v] of Object.entries(value)) walkFacts(v,fn,`${path}.${k}`);
};
export const assertRequired = (obj, fields, label) => {
  for (const field of fields) assert.ok(Object.prototype.hasOwnProperty.call(obj, field), `${label} missing required field ${field}`);
};
export const allSnapshots = () => getFixtures().flatMap(f => f.data.snapshots.map(s => ({scenario:f.scenario,snapshot:s})));
export const allEvents = () => getFixtures().flatMap(f => (f.data.changeEvents || []).map(e => ({scenario:f.scenario,event:e})));
