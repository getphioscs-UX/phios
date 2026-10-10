export const RUNTIME_EVENT_VERSION = '1.0.0';
export const LEGACY_RUNTIME_EVENT_VERSION = '0.9.0';

const definitions = [
  ['runtime.created', 'runtime', 'entry_collecting', true],
  ['entry.answer_added', 'entry', 'entry_collecting', true],
  ['entry.completed', 'entry', 'entry_complete', true],
  ['reconstruction.generated', 'reconstruction', 'reconstruction_ready', true],
  ['reconstruction.revised', 'reconstruction', 'reconstruction_ready', true],
  ['reading.generated', 'reading', 'reading_ready', true],
  ['navigation.generated', 'navigation', 'navigation_ready', true],
  ['review.completed', 'review', 'review_ready', true],
  ['memory.committed', 'memory', 'continuity_active', true],
  ['continuity.started', 'continuity', 'continuity_active', true],
  ['revision.created', 'revision', '', true],
  ['runtime.partial_write_recovered', 'recovery', '', false],
  ['provider.completed', 'provider', '', false],
  ['provider.failed', 'provider', '', false]
];

export const RUNTIME_EVENT_TYPES = Object.freeze(
  definitions.map(([type, category, stage, customerVisible]) =>
    Object.freeze({
      type,
      category,
      stage,
      customer_visible: customerVisible,
      current_version: RUNTIME_EVENT_VERSION,
      supported_versions: Object.freeze([
        LEGACY_RUNTIME_EVENT_VERSION,
        RUNTIME_EVENT_VERSION
      ])
    })
  )
);

const byType = new Map(
  RUNTIME_EVENT_TYPES.map(definition => [
    definition.type,
    definition
  ])
);

export function getRuntimeEventType(type) {
  return byType.get(String(type || '').trim()) || null;
}

export function hasRuntimeEventType(type) {
  return byType.has(String(type || '').trim());
}

export function isRuntimeEventVersionSupported(type, version) {
  return Boolean(
    getRuntimeEventType(type)?.supported_versions.includes(
      String(version || '').trim()
    )
  );
}

export function listRuntimeEventTypes(options = {}) {
  return RUNTIME_EVENT_TYPES.filter(definition =>
    options.customer_visible === undefined ||
    definition.customer_visible === options.customer_visible
  );
}

export default RUNTIME_EVENT_TYPES;
