import { defaultPersistenceClock } from
  '../persistence/persistence-contract.js';
import { getRuntimeEventType } from './event-types.js';
import {
  TIMELINE_CONTRACT_ID,
  TIMELINE_ERROR_CODES,
  TimelineContractError
} from './timeline-contract.js';

const copy = Object.freeze({
  en: Object.freeze({
    'runtime.created': ['Journey created', 'A new Runtime journey was created.'],
    'entry.answer_added': ['Entry updated', 'Information was added to the Reality Entry.'],
    'entry.completed': ['Entry completed', 'The Reality Entry became ready for reconstruction.'],
    'reconstruction.generated': ['Reality reconstructed', 'The available sequence, conditions, evidence, and unknowns were organized.'],
    'reconstruction.revised': ['Reconstruction revised', 'The Reality Reconstruction was updated without replacing its earlier history.'],
    'reading.generated': ['Reality Reading prepared', 'A bounded Reading was prepared from the available evidence.'],
    'navigation.generated': ['Navigation prepared', 'Bounded paths and review conditions became available.'],
    'review.completed': ['Review completed', 'The selected path and observed outcome were reviewed.'],
    'memory.committed': ['Runtime Memory committed', 'Confirmed Runtime information was retained for continuity.'],
    'continuity.started': ['Continuity started', 'The current Runtime became a starting point for what follows.'],
    'revision.created': ['Revision created', 'A new revision was added while earlier history remained unchanged.']
  }),
  zh: Object.freeze({
    'runtime.created': ['现实旅程已建立', '新的 Runtime 现实旅程已经建立。'],
    'entry.answer_added': ['现实入口已更新', '新的资料已加入现实入口。'],
    'entry.completed': ['现实入口已完成', '现实入口已经可以进入现实重建。'],
    'reconstruction.generated': ['现实重建已形成', '现有顺序、条件、证据与未知部分已被组织。'],
    'reconstruction.revised': ['现实重建已修订', '现实重建已更新，较早的历史没有被覆盖。'],
    'reading.generated': ['现实读取已准备', '系统根据现有证据形成了一份有边界的现实读取。'],
    'navigation.generated': ['现实导航已准备', '有边界的路径与审阅条件已经建立。'],
    'review.completed': ['现实回顾已完成', '已选择的路径与观察结果已经完成回顾。'],
    'memory.committed': ['运行记忆已保存', '经确认的 Runtime 资料已被保留，以支持连续性。'],
    'continuity.started': ['现实延续已开始', '当前 Runtime 已成为下一阶段现实的起点。'],
    'revision.created': ['新修订已建立', '新的修订已经加入，较早历史保持不变。']
  })
});

function normalizeLocale(value) {
  return String(value || '').toLowerCase().startsWith('zh')
    ? 'zh'
    : 'en';
}

function safeIdentifier(value) {
  return typeof value === 'string'
    ? value.trim().slice(0, 160)
    : '';
}

export function projectRuntimeTimeline(timeline = {}, options = {}) {
  if (!timeline || !Array.isArray(timeline.events)) {
    throw new TimelineContractError(
      TIMELINE_ERROR_CODES.INVALID_INPUT,
      'Timeline Projection requires Timeline Reader output.'
    );
  }
  const locale = normalizeLocale(options.locale);
  const dictionary = copy[locale];
  const entries = timeline.events.flatMap(event => {
    const definition = getRuntimeEventType(event.event_type);
    const text = dictionary[event.event_type];
    if (!definition?.customer_visible || !text) return [];
    const revisionId = event.event_type === 'revision.created'
      ? safeIdentifier(event.payload?.revision_id)
      : '';
    return [Object.freeze({
      event_id: event.event_id,
      type: event.event_type,
      occurred_at: event.created_at,
      stage: definition.stage,
      title: text[0],
      summary: text[1],
      revision_id: revisionId,
      event_version: event.event_version
    })];
  });

  return Object.freeze({
    schema_version: TIMELINE_CONTRACT_ID,
    runtime_id: timeline.runtime_id,
    locale: locale === 'zh' ? 'zh-Hans' : 'en',
    generated_at:
      String(options.generated_at || '').trim() ||
      defaultPersistenceClock(),
    entries: Object.freeze(entries),
    entry_count: entries.length,
    warnings: timeline.warnings || Object.freeze([]),
    guardrails: Object.freeze({
      customer_readable: true,
      raw_payload_exposed: false,
      reported_experience_promoted_to_evidence: false,
      historical_overwrite_allowed: false
    })
  });
}

export default projectRuntimeTimeline;
