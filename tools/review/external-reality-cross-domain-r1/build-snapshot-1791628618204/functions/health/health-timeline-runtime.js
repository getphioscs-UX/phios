const text = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g,' ');
const TYPES = new Set(['SYMPTOM','OBSERVATION','MEASUREMENT','DOCUMENT','CLINICIAN_EVENT','MEDICATION_EVENT','LIFESTYLE_CONTEXT','UNKNOWN']);
const timestamp = value => {
  if (!value) return Number.POSITIVE_INFINITY;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
};

export function buildHealthObservationTimeline(input = {}) {
  const events = (Array.isArray(input.events) ? input.events : []).map((event, index) => {
    const eventType = text(event.eventType || 'UNKNOWN').toUpperCase();
    if (!TYPES.has(eventType)) throw new Error('HRX_TIMELINE_EVENT_TYPE_INVALID');
    return {
      eventId: text(event.eventId || `HRX-TL-${String(index + 1).padStart(3,'0')}`),
      eventType,
      observedAt: text(event.observedAt) || null,
      sourceClass: text(event.sourceClass || 'USER_REPORTED').toUpperCase(),
      summary: text(event.summary || event.label || event.value),
      provenance: event.provenance || 'USER_INPUT',
      establishesCausality: false
    };
  });
  events.sort((a,b) => timestamp(a.observedAt) - timestamp(b.observedAt) || a.eventId.localeCompare(b.eventId));
  return {
    schemaVersion:'PHI-OS-HRX-TIMELINE-v1.0.0',
    caseRef:text(input.caseRef) || null,
    events,
    undatedEventCount:events.filter(e=>!e.observedAt).length,
    governance:{chronologyIsNotCausality:true, sourceClassesPreserved:true}
  };
}
