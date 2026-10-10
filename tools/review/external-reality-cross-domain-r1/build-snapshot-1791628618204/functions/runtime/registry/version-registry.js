/** Contract versions are independent from schema identifiers. */
const versions = [
  ['runtime-entry', '1.0.0'],
  ['reconstruction', '1.0.0'],
  ['reading-input', '1.0.0'],
  ['reality-reading', '1.0.0'],
  ['reading-navigation', '2.0.0'],
  ['navigation-input', '1.0.0'],
  ['navigation', '1.0.0'],
  ['review', '1.0.0'],
  ['runtime-memory', '1.0.0'],
  ['continuity', '1.0.0'],
  ['runtime-transition-execution', '1.0.0'],
  ['reading-revision-request', '1.0.0'],
  ['reading-revision-initialization', '1.0.0'],
  ['entry-continuity-handoff', '1.0.0'],
  ['entry-initialization', '1.0.0'],
  ['runtime-lineage', '1.0.0'],
  ['runtime-snapshot', '1.0.0'],
  ['runtime-recovery-state', '1.0.0'],
  ['runtime-workspace-state', '1.0.0'],
  ['runtime-kernel', '1.0.0']
];

export const RUNTIME_VERSIONS = Object.freeze(
  versions.map(([id, current]) => Object.freeze({
    id,
    current,
    supported: Object.freeze([current]),
    status: 'stable'
  }))
);

const registry = new Map(RUNTIME_VERSIONS.map(item => [item.id, item]));

export function getRuntimeVersion(id) {
  return registry.get(id) || null;
}

export function hasRuntimeVersion(id) {
  return registry.has(id);
}

export function supportsRuntimeVersion(id, version) {
  return Boolean(
    getRuntimeVersion(id)?.supported.includes(String(version || '').trim())
  );
}

export default RUNTIME_VERSIONS;
