// These exact R4 additions have technical verification, not public-content admission.
// Keep their source evidence intact. A future signed admission needs its own successor.
export const PENDING_R4_RECORD_IDS = Object.freeze([
  'BGR-POST-HANDOFF-R4-HISTORY-01','BGR-POST-HANDOFF-R4-HISTORY-02',
  'BGR-POST-HANDOFF-R4-HISTORY-03','BGR-POST-HANDOFF-R4-HISTORY-04',
  'SRB-POST-HANDOFF-R4-HISTORY-01','SRB-POST-HANDOFF-R4-HISTORY-02',
  'SRB-POST-HANDOFF-R4-HISTORY-03','SRB-POST-HANDOFF-R4-HISTORY-04',
  'ARG-POST-HANDOFF-R4-HISTORY-01','ARG-POST-HANDOFF-R4-HISTORY-02',
  'ARG-POST-HANDOFF-R4-HISTORY-03','ARG-POST-HANDOFF-R4-HISTORY-04',
  'CHL-POST-HANDOFF-R4-HISTORY-01','CHL-POST-HANDOFF-R4-HISTORY-02',
  'CHL-POST-HANDOFF-R4-HISTORY-03','CHL-POST-HANDOFF-R4-HISTORY-04'
]);
export const PENDING_R4_SOURCE_IDS = Object.freeze([
  'HISTORY_POST_HANDOFF_R4_WIKI_BGR','HISTORY_POST_HANDOFF_R4_WIKI_SRB',
  'HISTORY_POST_HANDOFF_R4_WIKI_ARG','HISTORY_POST_HANDOFF_R4_WIKI_CHL'
]);
export function publicCountryHistoryBinding(binding) {
  const pendingRecords = new Set(PENDING_R4_RECORD_IDS);
  const pendingSources = new Set(PENDING_R4_SOURCE_IDS);
  return {...binding,
    records: binding.records.filter(record => !pendingRecords.has(record.id)),
    sources: binding.sources.filter(source => !pendingSources.has(source.id))
  };
}
