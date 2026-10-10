import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const stableObject=value=>Array.isArray(value)?value.map(stableObject):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b)).map(k=>[k,stableObject(value[k])])):value;
const stableText=value=>JSON.stringify(stableObject(value),null,2)+'\n';
const digest=value=>crypto.createHash('sha256').update(typeof value==='string'?value:stableText(value)).digest('hex');
const readJson=async(root,file)=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const cjkCount=value=>(String(value||'').match(/[\u3400-\u9fff]/g)||[]).length;
const latinCount=value=>(String(value||'').match(/[A-Za-z]/g)||[]).length;
const finding=(code,severity,dimension,message,record={})=>({code,severity,dimension,message,...record});
export async function evaluatePublishedKnowledgeQuality(root=process.cwd()){
 const names=['published-retrieval-index','nodes','fragments','aliases','relationships','questions','publications','locale-availability','books','parts'];
 const data=Object.fromEntries(await Promise.all(names.map(async n=>[n,await readJson(root,`content/knowledge/public/retrieval/${n}.json`)])));
 const authority=await readJson(root,'content/knowledge/public/authority/published-knowledge-authority.json');
 const findings=[];
 const index=data['published-retrieval-index'];
 if(index.authorityDigest!==digest(authority))findings.push(finding('AUTHORITY_DIGEST_MISMATCH','critical','authority_integrity','STEP64 authority digest does not match STEP63 authority.'));
 for(const [name,projection] of Object.entries(data)){
  if(name==='published-retrieval-index')continue;
  const expected=index.projectionDigests[name];
  if(expected!==projection.digest)findings.push(finding('PROJECTION_DIGEST_MISMATCH','critical','retrieval_integrity',`${name} projection digest mismatch.`,{projection:name}));
  if(index.recordCounts[name]!==projection.recordCount)findings.push(finding('PROJECTION_COUNT_MISMATCH','error','retrieval_integrity',`${name} projection record count mismatch.`,{projection:name}));
 }
 const publicationKeys=new Set(data.publications.records.map(x=>`${x.nodeCode}|${x.locale}`));
 for(const node of data.nodes.records){
  const key=`${node.nodeCode}|${node.locale}`;
  if(!publicationKeys.has(key))findings.push(finding('NODE_WITHOUT_PUBLICATION','error','authority_integrity','Published node has no publication projection.',{nodeCode:node.nodeCode,locale:node.locale}));
  const nodeFragments=data.fragments.records.filter(x=>x.nodeCode===node.nodeCode&&x.locale===node.locale);
  if(!nodeFragments.length)findings.push(finding('NODE_WITHOUT_FRAGMENTS','error','projection_integrity','Published node has no fragments.',{nodeCode:node.nodeCode,locale:node.locale}));
  if(node.locale==='en'){
   const fields=[['title',node.title],['summary',node.summary]];
   for(const [field,value] of fields){const c=cjkCount(value),l=latinCount(value);if(c>=4&&c>l/4)findings.push(finding('EN_LOCALE_CJK_CONTAMINATION','warning','locale_integrity',`English ${field} contains substantial CJK text.`,{nodeCode:node.nodeCode,locale:'en',field,cjkCharacters:c}));}
   for(const fragment of nodeFragments.filter(x=>x.kind==='heading')){const c=cjkCount(fragment.text),l=latinCount(fragment.text);if(c>=4&&c>l/4)findings.push(finding('EN_HEADING_CJK_CONTAMINATION','warning','locale_integrity','English heading fragment contains substantial CJK text.',{nodeCode:node.nodeCode,locale:'en',fragmentCode:fragment.fragmentCode,cjkCharacters:c}));}
   const body=nodeFragments.map(x=>x.text).join('\n');const bc=cjkCount(body),bl=latinCount(body);if(bc>=50&&bc>bl)findings.push(finding('EN_BODY_CJK_CONTAMINATION','error','locale_integrity','English article body is predominantly CJK and is not suitable for English public projection.',{nodeCode:node.nodeCode,locale:'en',cjkCharacters:bc,latinCharacters:bl}));
  }
  if(node.locale==='zh-Hans'&&/^[a-f0-9]{64}\s{2,}\S+/m.test(String(node.summary||'')))findings.push(finding('ZH_SUMMARY_ARTIFACT_CONTAMINATION','error','projection_integrity','Chinese summary contains file-digest artifact content instead of an article summary.',{nodeCode:node.nodeCode,locale:'zh-Hans',field:'summary'}));
 }
 for(const rel of data.relationships.records){if(!rel.targetPublished&&rel.targetNodeCode){const promoted=data.nodes.records.some(x=>x.nodeCode===rel.targetNodeCode&&x.locale===rel.locale);if(promoted)findings.push(finding('UNPUBLISHED_RELATIONSHIP_PROMOTED','critical','reading_path_integrity','Unpublished relationship target was promoted into node projection.',{targetNodeCode:rel.targetNodeCode,locale:rel.locale}));}}
 const counts={info:0,warning:0,error:0,critical:0};for(const f of findings)counts[f.severity]++;
 const score=Math.max(0,100-counts.warning*8-counts.error*20-counts.critical*50);
 const status=counts.critical||counts.error?'blocked':counts.warning?'attention_required':'ready';
 const report={reportCode:'KNR-PACKAGE-D-QUALITY-REPORT',reportVersion:'1.0.0',source:{authorityDigest:digest(authority),indexDigest:index.indexDigest},summary:{status,score,findings:findings.length,severityCounts:counts,publishedLocaleRecords:data.nodes.recordCount,publishedCanonicalNodes:new Set(data.nodes.records.map(x=>x.nodeCode)).size},findings};
 report.reportDigest=digest(report);return report;
}
export function buildProductionIntegrationReport(quality){
 const outcome=quality.summary.status==='ready'?'ready_for_scale':quality.summary.status==='attention_required'?'attention_required':'blocked';
 const actions=quality.findings.map(f=>({findingCode:f.code,severity:f.severity,action:f.dimension==='locale_integrity'?'review_locale_source_and_rebuild_published_projections':'inspect_and_rebuild_governed_projection',automatic:false}));
 const report={reportCode:'KNR-PACKAGE-D-PRODUCTION-INTEGRATION',reportVersion:'1.0.0',qualityReportDigest:quality.reportDigest,outcome,productionEffects:{candidateMutation:false,reviewMutation:false,approvalMutation:false,publicationMutation:false,registryMutation:false,automaticRepublish:false},recommendedActions:actions};
 report.reportDigest=digest(report);return report;
}
export async function writePackageDReports(root=process.cwd()){
 const quality=await evaluatePublishedKnowledgeQuality(root);const integration=buildProductionIntegrationReport(quality);
 const targets=[['content/knowledge/public/quality/published-quality-evaluation.json',quality],['content/knowledge/production/integration/published-production-integration.json',integration]];
 for(const [file,value] of targets){const full=path.join(root,file);await fs.mkdir(path.dirname(full),{recursive:true});await fs.writeFile(full,JSON.stringify(value,null,2)+'\n','utf8');}
 return {quality,integration};
}
export {digest,cjkCount};
