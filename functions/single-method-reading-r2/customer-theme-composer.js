const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}
function hash(value){let h=2166136261;for(const ch of String(value)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16).toUpperCase().padStart(8,'0')}
function primaryDomain(claim){return list(claim.customerDomains)[0]||'CORE_STRUCTURE'}
function lineageRefs(claim){return uniq([
  claim.lineage?.productionAdmissionRef,claim.lineage?.readingAuthorityRef,
  ...list(claim.lineage?.interpretationUnitRefs),...list(claim.lineage?.projectionRefs),...list(claim.lineage?.meaningRefs),...list(claim.lineage?.ruleRefs),...list(claim.lineage?.boundaryRefs)
])}
function distinctText(claims,exclude){for(const claim of claims){const text=claim?.structuralMeaning;if(text&&text!==exclude)return text}return null}

export function composeCustomerThemes({priorityResolution}={}){
  if(priorityResolution?.schemaVersion!=='PHI-OS-CUSTOMER-READING-PRIORITY-RESOLUTION-v1.0.0')fail('SMR_R2_PRIORITY_RESOLUTION_REQUIRED');
  const eligible=list(priorityResolution.claims).filter(claim=>!['SUPPRESS','TECHNICAL'].includes(claim.priorityClass));
  if(!eligible.length)fail('SMR_R2_THEME_ELIGIBLE_CLAIMS_REQUIRED');
  const groups=new Map();
  for(const claim of eligible){
    const domain=primaryDomain(claim),key=`${claim.methodId}:${domain}`;
    if(!groups.has(key))groups.set(key,{domain,claims:[]});
    groups.get(key).claims.push(claim);
  }
  const themes=[...groups.values()].map(group=>{
    const claims=[...group.claims].sort((a,b)=>b.priorityScore-a.priorityScore||a.claimId.localeCompare(b.claimId));
    const primary=claims[0];
    const detail=primary.methodId==='AST'?list(primary.conditions).find(c=>c?.kind==='UPSTREAM_INTERPRETATION_DETAIL'&&c.schemaVersion==='PHI-OS-AST-INTERPRETATION-DETAIL-v1.0.0'):null;
    const support=claims.filter(c=>c.claimId!==primary.claimId&&c.claimType==='SUPPORT');
    const tension=claims.filter(c=>c.claimId!==primary.claimId&&['TENSION','TRADEOFF'].includes(c.claimType));
    const condition=claims.filter(c=>c.claimId!==primary.claimId&&['CONDITION','OPEN','TEMPORAL_ACTIVATION'].includes(c.claimType));
    const secondary=claims.filter(c=>c.claimId!==primary.claimId&&!support.includes(c)&&!tension.includes(c)&&!condition.includes(c));
    const clusterSeed=[primary.methodId,group.domain,...claims.map(c=>c.claimId).sort()].join('|');
    const what=primary.structuralMeaning;
    const why=detail?.relationContext||distinctText([...support,...secondary],what);
    const how=detail?.constructiveExpression||distinctText(condition,what)||distinctText(secondary,why||what);
    const differs=detail?.frictionExpression||distinctText(tension,what)||distinctText(condition,how||why||what);
    const refs=uniq(claims.flatMap(lineageRefs));
    const realityQuestionRefs=uniq(claims.flatMap(c=>list(c.conditions).filter(v=>typeof v==='string'&&v.startsWith('QUESTION:'))));
    return freeze({
      schemaVersion:'PHI-OS-CUSTOMER-THEME-IR-v1.0.0',themeId:`SMR2-THEME-${primary.methodId}-${hash(clusterSeed)}`,methodId:primary.methodId,semanticClusterId:`SMR2-SEM-${primary.methodId}-${hash(`${primary.methodId}|${group.domain}`)}`,
      headline:primary.headline,primaryClaimRef:primary.claimId,
      supportClaimRefs:uniq(support.map(c=>c.claimId)),tensionClaimRefs:uniq(tension.map(c=>c.claimId)),conditionClaimRefs:uniq(condition.map(c=>c.claimId)),
      whatStandsOut:what,whyItMatters:why,howItMayShow:how,whenItMayDiffer:differs,realityQuestionRefs,lineageRefs:refs,
      claimRefs:freeze(claims.map(c=>c.claimId)),priorityScore:primary.priorityScore,priorityClass:primary.priorityClass,customerDomain:group.domain,
      boundary:freeze({claimTextOnly:true,newMeaningCreated:false,tensionPreserved:true,conditionsPreserved:true,rendererTheme:false})
    });
  }).sort((a,b)=>b.priorityScore-a.priorityScore||a.themeId.localeCompare(b.themeId));
  return freeze({schemaVersion:'PHI-OS-CUSTOMER-THEME-IR-COLLECTION-v1.0.0',methodId:priorityResolution.methodId,priorityRuleVersion:priorityResolution.priorityRuleVersion,themeCount:themes.length,themes,firstScreenThemeRefs:themes.filter(t=>['PRIMARY','SECONDARY'].includes(t.priorityClass)).slice(0,3).map(t=>t.themeId),boundary:{deterministic:true,claimTextOnly:true,newMeaningCreated:false,rendererTheme:false}});
}
