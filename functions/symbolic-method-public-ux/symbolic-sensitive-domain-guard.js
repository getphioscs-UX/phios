/** PHI OS PROD-W4 symbolic sensitive-domain guard. Symbolic methods never gain factual/professional authority. */
export const SENSITIVE_DOMAINS=Object.freeze(['MEDICAL','FINANCIAL','LEGAL','DEATH','PREGNANCY','RELATIONSHIP','MENTAL_HEALTH']);
const domainPatterns=Object.freeze({
  MEDICAL:/\b(medical|diagnos(?:e|is)|disease|treatment|medication|doctor|hospital|symptom)\b/i,
  FINANCIAL:/\b(invest|investment|stock|crypto|loan|debt|financial|money|rich)\b/i,
  LEGAL:/\b(legal|lawyer|court|lawsuit|contract|crime|guilty|liable)\b/i,
  DEATH:/\b(death|die|dying|fatal|funeral)\b/i,
  PREGNANCY:/\b(pregnan(?:t|cy)|miscarriage|fertility|conceive|baby)\b/i,
  RELATIONSHIP:/\b(partner|relationship|marry|marriage|divorce|break up|leave partner)\b/i,
  MENTAL_HEALTH:/\b(mental health|depression|anxiety|suicide|psychosis|bipolar|trauma)\b/i
});
const prohibitedSystemClaims=Object.freeze([
 /\byou (?:have|will have)\b/i,/\byou will\b/i,/\bwill (?:die|marry|divorce|get rich|get sick)\b/i,
 /\byou should (?:invest|quit|leave|stop)\b/i,/\bstop (?:treatment|medication)\b/i,
 /\bthis (?:proves|confirms|diagnoses)\b/i,/\blegally you (?:must|should|are)\b/i,
 /\byou are pregnant\b/i,/\byour partner (?:is|was|has been) (?:cheating|unfaithful)\b/i,
 /\b(?:he|she|they) (?:is|are) secretly (?:cheating|lying|in love|planning)\b/i
]);
const clean=v=>String(v??'').normalize('NFKC').trim();
export function detectSensitiveDomains(text){const s=clean(text);return Object.freeze(SENSITIVE_DOMAINS.filter(d=>domainPatterns[d].test(s)));}
export function assertSymbolicSensitiveDomainBoundary({question='',generatedOutput='',authorityClass='SYMBOLIC_REFLECTION'}={}){
  const domains=detectSensitiveDomains(question);
  if(authorityClass!=='SYMBOLIC_REFLECTION') throw new TypeError('SYMBOLIC_AUTHORITY_CLASS_REQUIRED');
  for(const pattern of prohibitedSystemClaims) if(pattern.test(clean(generatedOutput))) throw new TypeError('SYMBOLIC_SENSITIVE_DOMAIN_SYSTEM_AUTHORITY_FORBIDDEN');
  return Object.freeze({domains,authorityClass,createsFact:false,createsDiagnosis:false,createsProfessionalAdvice:false,createsDecisionDirective:false,userDecisionAuthority:true});
}
