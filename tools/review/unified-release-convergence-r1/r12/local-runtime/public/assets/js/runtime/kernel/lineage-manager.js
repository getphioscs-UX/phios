import { buildRuntimeLineage } from '../../modules/runtime-lineage.js';
import { emitRuntimeEvent } from './event-bus.js';

export function getRuntimeTimeline() {
  const lineage = buildRuntimeLineage();
  emitRuntimeEvent('lineage.built', {
    runtimeEntityId: lineage.runtimeEntityId || '',
    runtimeCount: lineage.runtimeCount || 0
  });
  return lineage;
}

export const RuntimeLineageManager = Object.freeze({
  timeline: getRuntimeTimeline,
  build: getRuntimeTimeline
});
