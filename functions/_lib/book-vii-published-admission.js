// Projection extension consumed by the existing public retrieval loaders.
export const BOOK_VII_ADMISSION_PATH='content/knowledge/public/successors/book-vii-v2-source-refresh-v1/published-projection.json';
const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(b=>b.toString(16).padStart(2,'0')).join('');
export async function loadBookViiPublishedAdmission(readJson) {
  let release;
  try {release=await readJson(BOOK_VII_ADMISSION_PATH);}catch {return null;}
  const refresh=release?.status==='CURRENT_SOURCE_REFRESH_PENDING_HUMAN_REVIEW'&&release.sourceRefreshAuthorization?.kind==='EXPLICIT_USER_REQUEST_CANONICAL_V2_CUTOVER'&&release.sourceRefreshAuthorization?.sourceVersion==='v2'&&/^[a-f0-9]{64}$/.test(release.sourceRefreshAuthorization?.sourceDigest||'')&&release.sourceRefreshAuthorization?.newHumanAcceptance===null;
  if(!release||(!refresh&&release.status!=='ADMITTED_FOR_PRODUCTION')||release.humanAcceptance?.decision!=='ACCEPT'||release.humanAcceptance?.source!=='EXPLICIT_USER_HUMAN_ACCEPT')return null;
  const nodes=release.projections?.nodes||[],fragments=release.projections?.fragments||[];
  if(!nodes.length||!fragments.length)return null;
  for(const node of nodes){
    const packet=release.packages?.find(p=>p.nodeCode===node.nodeCode&&p.locale===node.locale);
    const authorizedRefresh=refresh&&release.sourceRefreshAuthorization.affectedNodeCodes.includes(node.nodeCode)&&packet?.sourceVersion==='v2'&&packet?.sourceDigest===release.sourceRefreshAuthorization.sourceDigest&&packet?.review?.decision==='pending'&&packet?.approval?.decision==='authorized_source_refresh'&&packet?.publication?.decision==='current_source_refresh';
    const acceptedPredecessor=packet?.review?.decision==='accept'&&packet?.approval?.decision==='approve'&&packet?.publication?.decision==='publish';
    if(node.bookCode!=='BOOK-7'||node.locale!=='zh-Hans'||!/^KN-B7-14-\d{3}$/.test(node.nodeCode)||(!authorizedRefresh&&!acceptedPredecessor)||packet.authorizationRef!==release.humanAcceptance.recordCode||node.title!==packet.title)return null;
    if(node.authorityDigest!==await hash(JSON.stringify(packet)))return null;
  }
  for(const fragment of fragments){
    const packet=release.packages.find(p=>p.nodeCode===fragment.nodeCode&&p.locale===fragment.locale);
    if(!nodes.some(n=>n.nodeCode===fragment.nodeCode&&n.locale===fragment.locale)||!packet?.content.split('\n').includes(fragment.text)||!packet.approvedFragments?.some(f=>JSON.stringify(f)===JSON.stringify(fragment))||fragment.digest!==await hash(fragment.text)||/phios-private-manuscripts|books\/book-7\/source|signedUrl|fixture-a|fixture-b/i.test(fragment.text))return null;
  }
  for(const question of release.projections.questions||[]){const packet=release.packages.find(p=>p.nodeCode===question.nodeCode&&p.locale===question.locale);if(!packet?.approvedQuestions.includes(question.question))return null;}
  for(const alias of release.projections.aliases||[]){const packet=release.packages.find(p=>p.nodeCode===alias.nodeCode&&p.locale===alias.locale);if(!packet?.approvedQuestions.includes(alias.value))return null;}
  return release;
}
export async function appendBookViiProjection(base,name,release) {
  if(!release)return base;
  const additional=release.projections?.[name]||[];
  const records=[...(base.records||[]),...additional];
  return {...base,records,recordCount:records.length,predecessorDigest:base.digest,digest:await hash(JSON.stringify(records)),digestScheme:'SHA256_JSON_RECORDS_V1',additiveSuccessor:release.releaseCode};
}
