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
// Compatibility cohort only: the frozen public80 binding has SHA256
// d0f59478c67f1510a1d93a9676ea7d54b4836322e1cc85f71fc3a900d4ecde47.
// New identities and boolean flags never acquire publication admission here.
const LEGACY_PUBLIC_RECORD_IDS = new Set([
  "MYS-EARLY",
  "MYS-MARITIME",
  "MYS-MALACCA",
  "MYS-COLONIAL",
  "MYS-INDEPENDENCE",
  "MYS-FORMATION",
  "MYS-REGIONAL",
  "SGP-REGIONAL",
  "IDN-REGIONAL",
  "SGP-CONSTITUTION",
  "SGP-INDEPENDENCE",
  "IDN-EARLY",
  "IDN-INDEPENDENCE",
  "USA-R4-LOCAL-HISTORY",
  "CHN-R4-LOCAL-HISTORY",
  "IND-R4-LOCAL-HISTORY",
  "JPN-R4-LOCAL-HISTORY",
  "KOR-R4-LOCAL-HISTORY",
  "THA-R4-LOCAL-HISTORY",
  "VNM-R4-LOCAL-HISTORY",
  "PHL-R4-LOCAL-HISTORY",
  "PAK-R4-LOCAL-HISTORY",
  "BGD-R4-LOCAL-HISTORY",
  "IRN-R4-LOCAL-HISTORY",
  "TUR-R4-LOCAL-HISTORY",
  "RUS-R4-LOCAL-HISTORY",
  "GBR-R4-LOCAL-HISTORY",
  "FRA-R4-LOCAL-HISTORY",
  "DEU-R4-LOCAL-HISTORY",
  "ITA-R4-LOCAL-HISTORY",
  "ESP-R4-LOCAL-HISTORY",
  "BRA-R4-LOCAL-HISTORY",
  "MEX-R4-LOCAL-HISTORY",
  "NGA-R4-LOCAL-HISTORY",
  "AUS-R5-HISTORY-01",
  "AUS-R5-HISTORY-02",
  "AUS-R5-HISTORY-03",
  "AUS-R5-HISTORY-04",
  "NZL-R5-HISTORY-01",
  "NZL-R5-HISTORY-02",
  "NZL-R5-HISTORY-03",
  "NZL-R5-HISTORY-04",
  "CAN-R5-HISTORY-01",
  "CAN-R5-HISTORY-02",
  "CAN-R5-HISTORY-03",
  "CAN-R5-HISTORY-04",
  "ZAF-R5-HISTORY-01",
  "ZAF-R5-HISTORY-02",
  "ZAF-R5-HISTORY-03",
  "ZAF-R5-HISTORY-04",
  "GRC-R5-HISTORY-01",
  "GRC-R5-HISTORY-02",
  "GRC-R5-HISTORY-03",
  "GRC-R5-HISTORY-04",
  "PRT-R5-HISTORY-01",
  "PRT-R5-HISTORY-02",
  "PRT-R5-HISTORY-03",
  "PRT-R5-HISTORY-04",
  "NLD-R5-HISTORY-01",
  "NLD-R5-HISTORY-02",
  "NLD-R5-HISTORY-03",
  "NLD-R5-HISTORY-04",
  "CHE-R5-HISTORY-01",
  "CHE-R5-HISTORY-02",
  "CHE-R5-HISTORY-03",
  "CHE-R5-HISTORY-04",
  "DNK-R5-HISTORY-01",
  "DNK-R5-HISTORY-02",
  "DNK-R5-HISTORY-03",
  "FIN-R5-HISTORY-01",
  "FIN-R5-HISTORY-02",
  "FIN-R5-HISTORY-03",
  "FIN-R5-HISTORY-04",
  "NOR-R5-HISTORY-01",
  "NOR-R5-HISTORY-02",
  "NOR-R5-HISTORY-03",
  "NOR-R5-HISTORY-04",
  "SWE-R5-HISTORY-01",
  "SWE-R5-HISTORY-02",
  "SWE-R5-HISTORY-03"
]);
const LEGACY_PUBLIC_SOURCE_IDS = new Set([
  "UNESCO_MELAKA",
  "UNESCO_LENGGONG",
  "ARKIB_INDEPENDENCE",
  "MY_CUSTOMS",
  "ASEAN_UN_TREATY",
  "NAS_CONSTITUTION",
  "UNESCO_SANGIRAN",
  "SETNEG_PROCLAMATION",
  "UNESCO_R4_78",
  "UNESCO_R4_439",
  "UNESCO_R4_231",
  "UNESCO_R4_688",
  "UNESCO_R4_738",
  "UNESCO_R4_576",
  "UNESCO_R4_678",
  "UNESCO_R4_502",
  "UNESCO_R4_138",
  "UNESCO_R4_321",
  "UNESCO_R4_114",
  "UNESCO_R4_356",
  "UNESCO_R4_545",
  "UNESCO_R4_426",
  "UNESCO_R4_83",
  "UNESCO_R4_896",
  "UNESCO_R4_91",
  "UNESCO_R4_314",
  "UNESCO_R4_445",
  "UNESCO_R4_412",
  "UNESCO_R4_938",
  "HISTORY_R5_WIKI_AUS",
  "HISTORY_R5_PRIMARY_AUS",
  "HISTORY_R5_WIKI_NZL",
  "HISTORY_R5_PRIMARY_NZL",
  "HISTORY_R5_WIKI_CAN",
  "HISTORY_R5_PRIMARY_CAN",
  "HISTORY_R5_WIKI_ZAF",
  "HISTORY_R5_PRIMARY_ZAF",
  "HISTORY_R5_WIKI_GRC",
  "HISTORY_R5_PRIMARY_GRC",
  "HISTORY_R5_WIKI_PRT",
  "HISTORY_R5_PRIMARY_PRT",
  "HISTORY_R5_WIKI_NLD",
  "HISTORY_R5_PRIMARY_NLD",
  "HISTORY_R5_WIKI_CHE",
  "HISTORY_R5_PRIMARY_CHE",
  "HISTORY_R5_WIKI_DNK",
  "HISTORY_R5_PRIMARY_DNK",
  "HISTORY_R5_WIKI_FIN",
  "HISTORY_R5_PRIMARY_FIN",
  "HISTORY_R5_WIKI_NOR",
  "HISTORY_R5_PRIMARY_NOR",
  "HISTORY_R5_WIKI_SWE",
  "HISTORY_R5_PRIMARY_SWE"
]);
const notExplicitlyDenied = row => !Object.hasOwn(row, 'publicAdmissionGranted') || row.publicAdmissionGranted === true;

export function publicCountryHistoryBinding(binding) {
  const pendingRecords = new Set(PENDING_R4_RECORD_IDS);
  const pendingSources = new Set(PENDING_R4_SOURCE_IDS);
  if (new Set(binding.records.map(row => row.id)).size !== binding.records.length ||
      new Set(binding.sources.map(row => row.id)).size !== binding.sources.length) {
    throw new Error('PUBLIC_HISTORY_DUPLICATE_ID');
  }
  const eligibleSources = binding.sources.filter(source => LEGACY_PUBLIC_SOURCE_IDS.has(source.id) && !pendingSources.has(source.id) && notExplicitlyDenied(source));
  const availableSources = new Set(eligibleSources.map(source => source.id));
  const references = record => [record.sourceRef, ...(record.corroboratingSourceRefs || [])];
  const records = binding.records.filter(record =>
    LEGACY_PUBLIC_RECORD_IDS.has(record.id) && !pendingRecords.has(record.id) && notExplicitlyDenied(record) &&
    (record.corroboratingSourceRefs == null || Array.isArray(record.corroboratingSourceRefs)) &&
    references(record).every(id => availableSources.has(id))
  );
  const usedSources = new Set(records.flatMap(references));
  return {...binding, records, sources: eligibleSources.filter(source => usedSources.has(source.id))};
}
