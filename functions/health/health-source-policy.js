// Publisher identity, live retrieval and claim support remain separate.
const bodies = new WeakMap(), proofs = new WeakSet();
export const healthAuthorityEnabled = env => env?.PHIOS_HEALTH_AUTHORITY_ENABLED === '1';
export function registeredHealthPublisher(authority) {
  if (!authority || authority.authorityId !== 'NIH_US') return authority;
  return {...authority, hosts:[...new Set([...authority.hosts,'niddk.nih.gov','www.niddk.nih.gov','nhlbi.nih.gov','www.nhlbi.nih.gov'])]};
}
export const healthText = s => String(s||'').replace(/\s+/gu,' ').trim();
const decode = s => s.replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(parseInt(n.replace(/^x/i,''),/^x/i.test(n)?16:10))).replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;/g,"'");
export function healthBodyParagraphs(body,type) {
  if (/text\/html/i.test(type)) return [...String(body).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>healthText(decode(m[1].replace(/<[^>]*>/g,' ')))).filter(Boolean);
  if (/text\/plain/i.test(type)) return String(body).split(/\n\s*\n/).map(healthText).filter(Boolean);
  return [];
}
export function retainVerifiedHealthBody(source,paragraphs) { bodies.set(source,{paragraphs:[...paragraphs],identity:JSON.stringify(source),at:Date.now()}); return source; }
export const isVerifiedHealthSource = source => !!source && bodies.has(source) && bodies.get(source).identity===JSON.stringify(source) && Date.now()-bodies.get(source).at<86400000;
export function locateHealthSupport(source,quote) {
  if (!isVerifiedHealthSource(source)) return null;
  const needle=healthText(quote); if(needle.length<20||needle.length>500)return null;
  const paragraphs=bodies.get(source).paragraphs, index=paragraphs.findIndex(p=>p.includes(needle));if(index<0)return null;
  const proof={sourceId:source.sourceId,contentDigest:source.contentDigest,retrievedAt:source.retrievedAt,paragraph:index+1,start:paragraphs[index].indexOf(needle),quote:needle,supportKind:'CONTIGUOUS_SOURCE_EXCERPT_NOT_PARAPHRASE_APPROVAL'};
  proofs.add(proof); return proof;
}
export const isVerifiedHealthSupport = proof => !!proof && proofs.has(proof);
