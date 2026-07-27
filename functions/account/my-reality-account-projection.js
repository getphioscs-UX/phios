export const MY_REALITY_SECTIONS = Object.freeze([
  'current_journeys',
  'past_journeys',
  'reports',
  'book_access',
  'reading_progress',
  'appointments',
  'shared_access'
]);

export function createMyRealityProjection(payload = {}) {
  return Object.freeze({
    projection_version: 'm4c-w2.v1',
    sections: Object.freeze(Object.fromEntries(
      MY_REALITY_SECTIONS.map(key => [
        key,
        Object.freeze(Array.isArray(payload[key]) ? [...payload[key]] : [])
      ])
    )),
    source: 'authorised_account_projection',
    reads_browser_runtime: false,
    writes_runtime_memory: false
  });
}
