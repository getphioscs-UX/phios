import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const stable=v=>JSON.stringify(v,(k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x,2)+'\n';
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:stable(v)).digest('hex');
const read=async f=>JSON.parse(await fs.readFile(path.join(root,f),'utf8'));
const normalize=v=>String(v??'').normalize('NFKC').toLowerCase();

const FACETS=[
 {code:'knowledge_expression',kind:'formation_condition',terms:['知识','表达','概念','语言','记录','专业分工','knowledge','expression','concept','language','record','specialization']},
 {code:'material_infrastructure',kind:'formation_condition',terms:['能源','材料','芯片','网络','数据中心','基础设施','维护','energy','material','chip','network','data center','infrastructure','maintenance']},
 {code:'organizational_coordination',kind:'coordination_mechanism',terms:['教育','研究','资本','标准','治理','协作','组织','education','research','capital','standard','governance','collaboration','organization']},
 {code:'feedback_scaling',kind:'amplification_mechanism',terms:['反馈','数据','扩展','学习','部署','feedback','data','expansion','learning','deployment']},
 {code:'responsibility_boundary',kind:'governance_boundary',terms:['责任','价值','方向','判断','边界','事实','理论','responsibility','value','direction','judgment','boundary','fact','theory']}
];

const evidenceFor=(fragments,terms)=>fragments.filter(f=>terms.some(t=>normalize(f.text).includes(normalize(t)))).map(f=>f.fragmentCode);

export async function buildRelationshipMechanismExpansion(){
 const [profilesDoc,graph,fragmentsDoc]=await Promise.all([
  read('content/knowledge/intelligence/semantic-profiles/published-semantic-profiles.json'),
  read('content/knowledge/intelligence/graph/published-knowledge-graph.json'),
  read('content/knowledge/public/retrieval/fragments.json')
 ]);
 const records=profilesDoc.profiles.map(profile=>{
  const fragments=fragmentsDoc.records.filter(f=>f.nodeCode===profile.nodeCode&&f.locale===profile.locale).sort((a,b)=>a.ordinal-b.ordinal);
  const explicitRelationships=profile.relationshipTargets.map(r=>({
   type:r.type,targetNodeCode:r.targetNodeCode,targetPublished:r.targetPublished,
   authority:r.targetPublished?'published_relationship':'external_unpublished_boundary'
  })).sort((a,b)=>a.type.localeCompare(b.type)||a.targetNodeCode.localeCompare(b.targetNodeCode));
  const mechanismFacets=FACETS.map(f=>{
   const evidenceFragmentCodes=evidenceFor(fragments,f.terms);
   return evidenceFragmentCodes.length?{facetCode:f.code,facetKind:f.kind,evidenceMode:'controlled_term_match',evidenceFragmentCodes}:null;
  }).filter(Boolean);
  const base={
   expansionCode:`RELMECH-${profile.nodeCode}-${profile.locale.toUpperCase()}`,
   nodeCode:profile.nodeCode,locale:profile.locale,profileDigest:profile.profileDigest,
   explicitRelationships,mechanismFacets,
   unsupportedInferenceAllowed:false,providerUsed:false
  };
  return {...base,expansionDigest:sha(base)};
 }).sort((a,b)=>a.nodeCode.localeCompare(b.nodeCode)||a.locale.localeCompare(b.locale));
 const base={version:'1.0.0',recordCount:records.length,records,sourceProfileDigest:profilesDoc.digest,sourceGraphDigest:graph.digest};
 return {...base,digest:sha(base)};
}

export async function buildCrossDomainExpansion(){
 const [profilesDoc,fragmentsDoc]=await Promise.all([
  read('content/knowledge/intelligence/semantic-profiles/published-semantic-profiles.json'),
  read('content/knowledge/public/retrieval/fragments.json')
 ]);
 const records=[]; const links=[];
 for(const profile of profilesDoc.profiles){
  const fragments=fragmentsDoc.records.filter(f=>f.nodeCode===profile.nodeCode&&f.locale===profile.locale).sort((a,b)=>a.ordinal-b.ordinal);
  const domains=FACETS.map(f=>{
   const evidenceFragmentCodes=evidenceFor(fragments,f.terms);
   return evidenceFragmentCodes.length?{
    domainCode:f.code,domainKind:f.kind,nodeCode:profile.nodeCode,locale:profile.locale,
    evidenceMode:'controlled_term_match',evidenceFragmentCodes
   }:null;
  }).filter(Boolean);
  for(const d of domains){
   const base={crossDomainRecordCode:`DOMAIN-${profile.nodeCode}-${profile.locale.toUpperCase()}-${d.domainCode}`,profileDigest:profile.profileDigest,...d};
   records.push({...base,recordDigest:sha(base)});
  }
  for(let i=0;i<domains.length;i++)for(let j=i+1;j<domains.length;j++){
   const a=domains[i],b=domains[j];
   const base={
    linkCode:`CROSS-${profile.nodeCode}-${profile.locale.toUpperCase()}-${a.domainCode}-${b.domainCode}`,
    nodeCode:profile.nodeCode,locale:profile.locale,sourceDomainCode:a.domainCode,targetDomainCode:b.domainCode,
    linkType:'co_present_in_same_published_node',
    sharedEvidenceFragmentCodes:[...new Set([...a.evidenceFragmentCodes,...b.evidenceFragmentCodes])].sort(),
    causalClaim:false
   };
   links.push({...base,linkDigest:sha(base)});
  }
 }
 records.sort((a,b)=>a.crossDomainRecordCode.localeCompare(b.crossDomainRecordCode));
 links.sort((a,b)=>a.linkCode.localeCompare(b.linkCode));
 const canonicalDomainSummary=[...new Set(records.map(r=>r.domainCode))].sort().map(domainCode=>({
  domainCode,
  canonicalNodeCodes:[...new Set(records.filter(r=>r.domainCode===domainCode).map(r=>r.nodeCode))].sort(),
  locales:[...new Set(records.filter(r=>r.domainCode===domainCode).map(r=>r.locale))].sort()
 }));
 const base={version:'1.0.0',recordCount:records.length,linkCount:links.length,canonicalDomainCount:canonicalDomainSummary.length,records,links,canonicalDomainSummary,sourceProfileDigest:profilesDoc.digest};
 return {...base,digest:sha(base)};
}

export async function writePackageKB(){
 const relationshipMechanism=await buildRelationshipMechanismExpansion();
 const crossDomain=await buildCrossDomainExpansion();
 await fs.mkdir(path.join(root,'content/knowledge/intelligence/expansion'),{recursive:true});
 await fs.writeFile(path.join(root,'content/knowledge/intelligence/expansion/relationship-mechanism-expansion.json'),stable(relationshipMechanism));
 await fs.writeFile(path.join(root,'content/knowledge/intelligence/expansion/cross-domain-expansion.json'),stable(crossDomain));
 return {relationshipMechanism,crossDomain};
}
export {stable,sha,FACETS};
