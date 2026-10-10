export const bookReviewCriteria={
 'BOOK-1':['忠于稿件','忠于规范节点','没有过度抽象','没有新增因果','没有重复对象','对探索器有实际价值'],
 'BOOK-2':['互动类型有来源支持且能够区分','没有过度心理化关系模式','集体运行解释没有越界'],
 'BOOK-3':['退化不等于诊断','恢复不等于建议','连续性不等于评分'],
 'BOOK-4':['扩展不等于增长就是好','尺度转换不等于优越性','文明阈值不等于排名']
};
export function buildHumanReviewPacket(extraction,sourceDigest){
 return {version:'1.0.0',sourceDigest,scope:'STRUCTURED_CANDIDATE_ASSEMBLY_ONLY',humanAcceptanceComplete:false,
  records:extraction.candidates.map(c=>({candidateId:c.candidateId,bookCode:c.bookCode,partCode:c.partCode,nodeCode:c.nodeCode,title:c.proposedTitle,meaning:c.proposedMeaning,meaningKind:c.meaningKind,manuscriptRef:c.manuscriptRef,sourceQuoteRefs:c.sourceQuoteRefs,proposedRelationships:c.proposedRelationships,criteria:bookReviewCriteria[c.bookCode],decision:'PENDING',reviewer:'',notes:'',
   blockers:c.proposedMeaning===null?['SOURCE_MEANING_NOT_EXTRACTED']:[],
   reviewBoundary:c.meaningKind==='PUBLISHED_ARTICLE_SUMMARY'?'仅审核文章摘要的结构化装配；不批准为独立节点定义。':'仅审核候选装配；稿件版本准入与生产发布仍由原流程控制。'}))};
}
// Used both by the offline reviewer and the checker. A draft never applies decisions.
export function validateReviewDraft(packet,draft){
 const errors=[];
 if(draft?.sourceDigest!==packet.sourceDigest)errors.push('STALE_REVIEW_SOURCE');
 if(draft?.scope!==packet.scope)errors.push('REVIEW_SCOPE_MISMATCH');
 const rows=Array.isArray(draft?.decisions)?draft.decisions:[];
 if(rows.length!==packet.records.length)errors.push('INCOMPLETE_REVIEW_SET');
 const seen=new Set();
 for(const row of rows){
  if(!row||typeof row!=='object'){errors.push('INVALID_REVIEW_ROW');continue;}
  const record=packet.records.find(r=>r.candidateId===row.candidateId);
  if(!record||seen.has(row.candidateId)){errors.push('UNKNOWN_OR_DUPLICATE_CANDIDATE');continue;}seen.add(row.candidateId);
  if(typeof row.reviewer!=='string'||typeof row.notes!=='string')errors.push('INVALID_REVIEW_TEXT');
  if(!['PENDING','APPROVE_ASSEMBLY','REQUEST_CHANGES','REJECT'].includes(row.decision))errors.push('INVALID_DECISION');
  if(!Array.isArray(row.checks)||row.checks.length!==record.criteria.length||row.checks.some(c=>!['UNREVIEWED','PASS','FAIL','UNSURE'].includes(c)))errors.push('INVALID_CRITERIA');
  if(row.decision!=='PENDING'&&!String(row.reviewer||'').trim())errors.push('REVIEWER_REQUIRED');
  if(['REQUEST_CHANGES','REJECT'].includes(row.decision)&&!String(row.notes||'').trim())errors.push('REASON_REQUIRED');
  if(row.decision==='APPROVE_ASSEMBLY'&&(record.blockers.length||row.checks?.some(c=>c!=='PASS')))errors.push('APPROVAL_BLOCKED');
 }
 return {valid:errors.length===0,errors:[...new Set(errors)],appliesDecisions:false,productionApproved:false};
}
