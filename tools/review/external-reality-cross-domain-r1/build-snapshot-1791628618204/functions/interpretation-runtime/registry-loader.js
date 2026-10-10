import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../..');
const MANIFEST_REL = 'content/interpretation/governance/interpretation-registry-manifest-v1.json';
const ROOT_REL = 'content/interpretation';
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
export function loadInterpretationManifest(){ return readJson(path.join(REPO_ROOT, MANIFEST_REL)); }
export function loadInterpretationRegistry(key){
  const manifest=loadInterpretationManifest();
  const rel=manifest.registries[key];
  if(!rel) throw new Error(`Unknown interpretation registry: ${key}`);
  const abs=path.resolve(REPO_ROOT, rel);
  const allowed=path.resolve(REPO_ROOT, ROOT_REL)+path.sep;
  if(!abs.startsWith(allowed)) throw new Error('Interpretation registry path escapes canonical root');
  return readJson(abs);
}
export function listInterpretationRegistryKeys(){ return Object.keys(loadInterpretationManifest().registries); }
