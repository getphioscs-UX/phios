const EVIDENCE_IDS = Object.freeze(['meeting', 'approvals', 'notice']);

export function normalizeEvidenceSelection(value) {
  const selected = Array.isArray(value) ? value : [];
  return EVIDENCE_IDS.filter(id => selected.includes(id));
}

export function deriveEvidenceLab(selection) {
  const selected = normalizeEvidenceSelection(selection);
  const observedCount = selected.filter(id => id !== 'notice').length;
  const unknownBoundary = selected.includes('notice');
  const confidence = Math.max(
    0,
    Math.min(82, observedCount * 32 + (unknownBoundary ? 6 : 0))
  );

  if (!selected.length) {
    return {
      selected,
      confidence: 0,
      readingKey: 'none',
      navigationKey: 'observe',
      unknownKey: 'all'
    };
  }

  return {
    selected,
    confidence,
    readingKey:
      observedCount === 2
        ? 'responsibilityShift'
        : observedCount === 1
          ? 'limitedShift'
          : 'statusUnknown',
    navigationKey:
      observedCount === 2 && unknownBoundary
        ? 'clarify'
        : 'observe',
    unknownKey:
      unknownBoundary
        ? 'intent'
        : 'statusAndIntent'
  };
}

export function createEntryDraftUrl(observedChange) {
  const params = new URLSearchParams();
  params.set('draft', String(observedChange || '').trim());
  return `/reality-entry?${params.toString()}`;
}
