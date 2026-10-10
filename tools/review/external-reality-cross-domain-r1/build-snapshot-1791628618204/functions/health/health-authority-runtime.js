const normalizeHost = value => String(value || '').trim().toLowerCase().replace(/^www\./, '');
const normalize = value => String(value || '').trim();

export function resolveApprovedAuthority(authorityId, registry = {}) {
  const id = normalize(authorityId).toUpperCase();
  return (Array.isArray(registry.publishers) ? registry.publishers : []).find(item => item.authorityId === id) || null;
}

export function admitHealthSource(source = {}, registry = {}) {
  if (registry.schemaVersion !== 'PHI-OS-HRX-APPROVED-HEALTH-AUTHORITY-v1.0.0') return reject('REJECTED_AUTHORITY', 'APPROVED_AUTHORITY_REGISTRY_REQUIRED');
  const authority = resolveApprovedAuthority(source.authorityId, registry);
  if (!authority) return reject('REJECTED_AUTHORITY', 'UNKNOWN_AUTHORITY');
  let url;
  try { url = new URL(source.url); } catch { return reject('REJECTED_PROVENANCE', 'INVALID_URL'); }
  const admittedHosts = new Set(authority.hosts.map(normalizeHost));
  if (!admittedHosts.has(normalizeHost(url.hostname))) return reject('REJECTED_HOST', 'HOST_NOT_APPROVED');
  if (!normalize(source.sourceId) || !normalize(source.title) || !normalize(source.retrievedAt) || !normalize(source.contentDigest) || !normalize(source.locale)) {
    return reject('REJECTED_PROVENANCE', 'REQUIRED_PROVENANCE_MISSING');
  }
  if (!/^sha256:[a-f0-9]{64}$/i.test(source.contentDigest)) return reject('REJECTED_PROVENANCE', 'CONTENT_DIGEST_INVALID');
  const claimTypes = Array.isArray(source.claimTypes) ? source.claimTypes.map(normalize).filter(Boolean) : [];
  if (!claimTypes.length) return reject('REJECTED_CLAIM_CLASS', 'CLAIM_TYPE_REQUIRED');
  const allowedClasses = new Set(authority.classes);
  if (claimTypes.some(type => !allowedClasses.has(type))) return reject('REJECTED_CLAIM_CLASS', 'CLAIM_CLASS_NOT_APPROVED_FOR_AUTHORITY');
  return {
    schemaVersion: 'PHI-OS-HRX-SOURCE-ADMISSION-v1.0.0', admissionState: 'ADMITTED', admitted: true,
    source: { sourceId:normalize(source.sourceId), authorityId:authority.authorityId, url:url.href, title:normalize(source.title), retrievedAt:normalize(source.retrievedAt), contentDigest:source.contentDigest.toLowerCase(), locale:normalize(source.locale), claimTypes },
    authority: { authorityId:authority.authorityId, name:authority.name, jurisdiction:authority.jurisdiction },
    governance: { publisherApprovalIsNotClaimApproval:true, professionalJudgmentCreated:false, productionHealthFactsAllowed:false }
  };
}
function reject(admissionState, reason) { return { schemaVersion:'PHI-OS-HRX-SOURCE-ADMISSION-v1.0.0', admissionState, reason, admitted:false, healthClaimAuthorityCreated:false }; }
