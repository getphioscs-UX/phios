import fs from 'node:fs';
import {sources,read,digest,normalize,evidence} from './lib/sks-review-sources.mjs';
import {book4Definitions} from './lib/sks-book4-candidates.mjs';
export const output='functions/_source-material/m1-m4-review/';
const base='content/knowledge/structured/';
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function build(){
 const books=sources(),discovery=read(base+'structured-knowledge-registry-v1.json'),backlinks=read(base+'structured-knowledge-backlinks-v1.json').backlinks;
 const sourcePaths=[...books.map(b=>b.file),...new Set(discovery.objects.map(o=>o.registryPath)),base+'structured-knowledge-registry-v1.json',base+'structured-knowledge-backlinks-v1.json',base+'structured-knowledge-relationships-v1.json',base+'structured-knowledge-conflicts-v1.json','scripts/lib/sks-review-sources.mjs','scripts/lib/sks-book4-candidates.mjs','scripts/build-sks-m1-m4-review.mjs'];
 const decisions=[];
 const mapping=books.map(b=>{
  const rows=b.rows.map(r=>{const old=b.registered.find(x=>x.sectionCode===r.sectionCode),current=r.candidateSpan?b.text.slice(...r.candidateSpan):null;let difference=null;
   if(old&&current){const past=normalize(old.text);let prefix=0;while(prefix<Math.min(past.length,current.length)&&past[prefix]===current[prefix])prefix++;let suffix=0;while(suffix<Math.min(past.length,current.length)-prefix&&past.at(-1-suffix)===current.at(-1-suffix))suffix++;difference={commonPrefixCharacters:prefix,commonSuffixCharacters:suffix,registeredCharacters:past.length,desktopCharacters:current.length,oldWindow:past.slice(Math.max(0,prefix-60),prefix+180),newWindow:current.slice(Math.max(0,prefix-60),prefix+180),interpretation:'Text-layer difference only. Repeated headings may be extraction artifacts; this is not proof of a semantic change.'};}
   return {...r,difference};
  });
  const objects=backlinks.filter(x=>x.bookCode===b.bookCode).map(o=>({objectId:o.objectId,sections:o.manuscriptSections.map(s=>{const r=rows.find(r=>r.sectionCode===s.sectionCode);return {sectionCode:s.sectionCode,registeredPages:[s.startPage,s.endPage],candidatePages:r?.candidatePages||null,status:r?.status||'NOT_MAPPED'};})}));
  decisions.push({id:'M1-'+b.bookCode,stage:'M1',bookCode:b.bookCode,title:b.bookCode+' 正文版本与章节对齐',proposal:'保留已登记来源，桌面新版本作为待审 successor；按映射记录核对正文差异。',details:{sourcePdfSha256:b.pdf.sourcePdfSha256,pageCount:b.pdf.pageCount,rows,objects},needsDecision:true});
  return {bookCode:b.bookCode,sourcePath:b.file,sourcePdfSha256:b.pdf.sourcePdfSha256,segmentation:'Adjacent or same-page repeated heading groups; ambiguous matches never silently selected.',rows,objects};
 });
 const proposals=[1,2,3,4,5].flatMap(i=>{const p=`functions/_source-material/meaning-proposals/meaning-proposals-batch-0${i}.json`;sourcePaths.push(p);return read(p).proposals;});
 const reviewPath='docs/knowledge/structured-successor/meaning-extraction/meaning-semantic-differences-v1.json';sourcePaths.push(reviewPath);const prior=read(reviewPath).records;
 const sentences=text=>text.split(/(?<=[。！？])/u).filter(s=>s.length>20&&s.length<500&&!/[✦❖◈◆]/u.test(s));
 const grams=s=>new Set([...normalize(s).matchAll(/(?=(.{2}))/gu)].map(m=>m[1]));
 function contexts(claim,text){const keys=grams(claim);return sentences(text).map(quote=>({quote,score:[...grams(quote)].filter(k=>keys.has(k)).length/Math.max(1,keys.size)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,2).map(x=>({quote:x.quote,selectionMethod:'LEXICAL_CONTEXT_FOR_REVIEW_NOT_ENTAILMENT',similarity:x.score}));}
 const meaning=proposals.map(p=>{
  const old=prior.find(x=>x.objectId===p.objectId),b=books.find(b=>b.bookCode===p.bookCode),s=b.registered.find(s=>s.sectionCode===p.evidenceQuotes[0].sectionCode),text=normalize(s.text);
  const registeredPath=p.bookCode==='BOOK-2'?'functions/_source-material/books/book-2-registered-reviewed-corpus.json':'functions/_source-material/books/book-3-registered-sections-v1.json';sourcePaths.push(registeredPath);
  const source={path:registeredPath,sectionCode:s.sectionCode,rawTextSha256:digest(s.text),authority:'REGISTERED_SECTION_TEXT',desktopVersionAutomaticallyAccepted:false};
  const scope=p.scopeAndLimits.map((value,i)=>{
   let candidate=value,note='保留候选边界，M8 对照正文确认适用范围。';
   if(p.objectId==='SK-B3-B3-P8-126'&&i===0){candidate='不能仅凭责任存在判定过载；责任成本需要结合边界、资源、权限、替代与退出条件判断。';note='与本轮定义修订对齐，避免把任何责任成本排除在负荷之外。';}
   if(p.objectId==='SK-B3-B3-P8-105'&&i===1){candidate='是否失效取决于关键承载条件是否仍然成立；某项关键依赖变化就可能使运行失去资格。';note='原文明确关键依赖变化可能导致失效；删除“一项依赖变化不足以证明”的过度概括。';}
   if(p.objectId==='SK-B2-B2-P6-016'&&i===0){candidate='本定义描述能力共享与分布式承担；不能仅凭依赖存在判断失能或脆弱，也不能据此否认某些依赖会增加脆弱性。';note='区分依赖的定义与依赖失配风险，避免绝对排除脆弱性。';}
   const policy=i===2&&/^(不把|不得|不将|不由此|不据此|不作为|不建立|不生成|不从|只描述|只区分|只适用)/.test(candidate)&&/(诊断|处方|评分|优劣|人格|个人建议|道德判断|分配|方案|病理)/.test(candidate);
   return {id:`${p.objectId}-SCOPE-${i+1}`,original:value,candidate,note,role:policy?'EDITORIAL_USE_RESTRICTION':'SOURCE_SCOPE_PARAPHRASE',source,context:contexts(candidate,text),supportState:policy?'USE_POLICY_NOT_A_MANUSCRIPT_FACT':'SEMANTIC_REVIEW_REQUIRED'};
  });
  const claims=p.claimEvidenceMap.map((c,i)=>({id:`${p.objectId}-CLAIM-${i+1}`,claim:c.claim,evidence:c.evidenceQuoteIndexes.map(index=>{const q=p.evidenceQuotes[index],section=b.registered.find(s=>s.sectionCode===q.sectionCode);if(!normalize(section.text).includes(normalize(q.quote)))throw Error('REGISTERED_QUOTE_DRIFT');return {sourcePath:registeredPath,sectionCode:q.sectionCode,rawTextSha256:digest(section.text),quote:normalize(q.quote)};}),scope:'Original paraphrase evidence; presence is verified, semantic entailment remains M8.'}));
  const finalCandidate=old.suggestedDefinition||p.definitionZh;
  const finalClaimMap=finalCandidate.split(/[；。]/u).filter(Boolean).map((claim,i)=>({id:`${p.objectId}-FINAL-${i+1}`,claim,source,context:contexts(claim,text),supportState:'PARAPHRASE_CONTEXT_REQUIRES_M8_ENTAILMENT_REVIEW'}));
  const row={objectId:p.objectId,original:p.definitionZh,finalCandidate,revisionReason:old.finding,source,claims,scope,finalClaimMap,finalCandidateContext:contexts(finalCandidate,text),additionalEvidence:old.additionalEvidence||null,reviewState:'PENDING_M8',aiAssisted:true,canonicalAuthority:false};
  decisions.push({id:'M2-'+p.objectId,stage:'M2',bookCode:p.bookCode,title:p.title,proposal:finalCandidate,details:row,needsDecision:true});return row;
 });
 const fields={
  'BOOK-1':{conditions:/只有|如果|当.{2,}(时|后)|需要/,constraints:/约束|限制|边界|不能/,connections:/连接|反馈|转换/},
  'BOOK-2':{triggerConditions:/只有|如果|当.{2,}(时|后)/,participantRoles:/不同运行|多个运行|参与者|家庭|群体/,signals:/讯号|信号|可见性/,responses:/回应|响应|行动/,feedback:/反馈|循环|回路|下一轮/,coordinationEffects:/协调|同步|共同/},
  'BOOK-3':{signals:/讯号|信号|摩擦|变慢|下降/,degradationConditions:/失配|漂移|退化|失稳/,recoveryConditions:/恢复|释放|整合|修复/,continuityConditions:/连续|退出|承接|下一轮/},
  'BOOK-4':{conditions:/只有|如果|当.{2,}(时|后)|需要/,constraints:/边界|约束|限制|瓶颈/,failureConditions:/失效|失去|过载|风险|崩/,threshold:/阈值|临界|超过/}
 };
 const fieldCandidates=discovery.objects.map(o=>{
  const b=books.find(b=>b.bookCode===o.bookCode),link=backlinks.find(x=>x.objectId===o.objectId),sectionCode=link.manuscriptSections[0].sectionCode,row=b.rows.find(x=>x.sectionCode===sectionCode);
  const registry=read(o.registryPath),record=(registry.objects||registry.patterns||registry.entries).find(r=>r.objectId===o.objectId);
  if(!row?.candidateSpan)throw Error('OBJECT_MAPPING_MISSING:'+o.objectId);
  const text=b.text.slice(...row.candidateSpan),ss=sentences(text);
  const relevant3={MAINTENANCE_SIGNAL:['signals'],LOAD:['signals','degradationConditions'],DEGRADATION:['signals','degradationConditions'],FAILURE_MODE:['signals','degradationConditions'],RECOVERY_MODE:['recoveryConditions'],ADAPTATION:['recoveryConditions','continuityConditions'],CONTINUITY_STATE:['continuityConditions']};
  const properties=Object.entries(fields[o.bookCode]).filter(([field])=>o.bookCode!=='BOOK-3'||!relevant3[record.family]||relevant3[record.family].includes(field)).map(([field,pattern])=>{const quotes=ss.filter(s=>pattern.test(s)).slice(0,2);return {field,state:quotes.length?'SOURCE_PASSAGES_SELECTED_FIELD_INTERPRETATION_PENDING':'NOT_ESTABLISHED_IN_THIS_EXTRACTION',proposedValue:quotes.length?quotes:null,reason:quotes.length?'原文片段候选；章节范围已核对，字段归类需 M8 审核，不能当作客户实际状态。':'本次规则未选出明确段落，不等于全文不存在该命题；保留为空并集中复核。',evidence:quotes.map(q=>evidence(b,sectionCode,q))};});
  let definition=null;
  if(o.bookCode==='BOOK-4'){
   const suffix=o.objectId.replace('SK-B4-B4-',''),item=book4Definitions.find(x=>x[0]===(suffix.startsWith('P11')?suffix:suffix.split('-').at(-1)));if(!item)throw Error('BOOK4_DEFINITION_MISSING:'+o.objectId);
   const selected=ss.find(s=>s.includes(item[2]));if(!selected)throw Error('BOOK4_DEFINITION_EVIDENCE_MISSING:'+o.objectId+':'+item[2]);
   const extraAnchors={'216':['运行放大因此既放大能力'],'217':['运行规模不仅取决于'],'223':['下一尺度需要的不是完全独立'],'268':['人工尺度扩展因此最重要的判断'],'242':['会把基础设施视为尺度设计'],'279':['跨世代保存仍然不足','人口规模只有在与制度']}[item[0]]||[];
   const extra=extraAnchors.map(anchor=>ss.find(s=>s.includes(anchor))).filter(Boolean);
   definition={proposedValue:item[1],method:'AI_GROUNDED_PARAPHRASE',evidence:[selected,...extra].map(q=>evidence(b,sectionCode,q)),reviewState:'PENDING_M8',articleSummaryUsedAsDefinition:false};
   if(o.objectId==='SK-B4-B4-P10-219'){
    const q=ss.find(s=>s.includes('增长所带来的复杂度')&&s.includes('新的协调位置'));
    // The opening sentence may carry a repeated heading. Anchor the clause directly.
    const start=text.indexOf('所谓尺度转换,发生在一个更严格的位置'),end=text.indexOf('。',start)+1,quote=q||(start>=0?text.slice(start,end):null);
    properties.push({field:'sourceScaleToTargetScale',state:'QUALITATIVE_TRANSITION_CANDIDATE',proposedValue:{source:'原有组织层级',target:'新的协调位置、接口与承载结构',numericThreshold:null},evidence:quote?[evidence(b,sectionCode,quote)]:[]});
   }else if(['SCALE_SHIFT','SCALE_THRESHOLD','CIVILIZATION_THRESHOLD'].includes(record.family))properties.push({field:'sourceScaleToTargetScale',state:'NOT_ESTABLISHED_IN_THIS_EXTRACTION',proposedValue:null,reason:'不从示例数量或标题推定通用起点、终点或数值阈值。',evidence:[]});
  }
  const result={objectId:o.objectId,bookCode:o.bookCode,title:o.title,sectionCode,sourceFamily:record.family||record.runtimeLevel||record.objectType,fieldSelection:'Book III fields follow the existing candidate family; scale pairs are requested only for scale/threshold families. Classification remains pending M8.',definition,properties,canonicalAuthority:false,reviewState:'PENDING_M8'};
  decisions.push({id:'M3-'+o.objectId,stage:'M3',bookCode:o.bookCode,title:o.title+' · 字段提取',proposal:definition?.proposedValue||'按原文核对下列字段候选，选择片段不代表已确认因果关系。',details:result,needsDecision:true});return result;
 });
 const missing=['压力','阈值'].map((term,i)=>{
  const b=books[0],matches=b.rows.filter(r=>r.candidateSpan&&b.text.slice(...r.candidateSpan).includes(term));
  const selected=matches.filter(r=>i===0?r.partCode==='P1':r.partCode==='P3'||r.partCode==='P4').slice(0,4);
  const refs=selected.map(r=>{const body=b.text.slice(...r.candidateSpan),at=body.indexOf(term),start=Math.max(0,body.lastIndexOf('。',at)+1),end=body.indexOf('。',at)+1;return evidence(b,r.sectionCode,body.slice(start,end));});
  const item={candidateId:i?'CANDIDATE-BOOK1-THRESHOLD':'CANDIDATE-BOOK1-PRESSURE',title:term,admission:'WITHHELD_GENERIC_OBJECT_NOT_ESTABLISHED',reason:i?'正文有激活阈值、体验阈值和领域阈值；不能合并成未经论证的通用 Threshold。':'正文出现物理压力差、环境压力等语境；未找到独立的通用 Pressure 定义，不能自动与 Book III Load 等同。',definition:null,evidence:refs};
  decisions.push({id:'M3-'+item.candidateId,stage:'M3',bookCode:'BOOK-1',title:'待登记对象：'+term,proposal:item.reason,details:item,needsDecision:true});return item;
 });
 const graph=read(base+'structured-knowledge-relationships-v1.json'),conflicts=read(base+'structured-knowledge-conflicts-v1.json');
 const relationships=graph.proposedRelationships.map(r=>({id:'M4-'+r.relationshipId,stage:'M4',bookCode:'CROSS_BOOK',title:r.label,proposal:'保留为建议阅读；不提升为已证实的因果边或检索依据。',details:{original:r,retrievalEligible:false,proposedDisposition:'KEEP_AS_READING_SUGGESTION',reason:'两个主题有可比较的范围，但章节相邻或术语相似不足以确立跨册因果。'},needsDecision:true}));
 const dedup=conflicts.reviewCandidates.map(c=>({id:'M4-'+c.candidateId,stage:'M4',bookCode:'BOOK-4',title:c.evidence.map(e=>e.title).join(' / '),proposal:'保留不同节点；共享文章摘要不构成定义重复或语义冲突，采用各自的正文定义候选继续审核。',details:{original:c,proposedDisposition:'KEEP_DISTINCT_NODES_REPLACE_SUMMARY_AS_DEFINITION',definitions:c.evidence.map(e=>fieldCandidates.find(f=>`EXTRACT-${f.objectId}-V1`===e.candidateId)?.definition||null),confirmedConflict:false,mergeAllowed:false},needsDecision:true}));
 const framing=[['FORMATION_CHAIN','BOOK-1','形成链','保留已证实的局部关系；不宣称固定七步必然因果链。'],['BOOK4_READING_CHAIN','BOOK-4','Book IV 阅读链','保留阅读顺序；未有逐边正文证据时不作为扩展必经阶段。'],['FIGURE_CONTEXT','CROSS_BOOK','文章与图示关系','保留现有文章/Part 导航上下文；同一 Part 不是机制对应证据。'],['ATLAS_BRIDGE','BOOK-4','Book IV → V','保留导航桥，不生成新的文明历史事实、排名或 Atlas 主库。']].map(([id,bookCode,title,proposal])=>({id:'M4-'+id,stage:'M4',bookCode,title,proposal,details:{proposedDisposition:'KEEP_NAVIGATION_WITHOUT_SEMANTIC_PROMOTION',semanticEdgeCreated:false},needsDecision:true}));
 const framePaths={'M4-FORMATION_CHAIN':base+'book-1/book-1-formation-chain-registry-v1.json','M4-BOOK4_READING_CHAIN':base+'book-4/book-4-expansion-chain-registry-v1.json','M4-FIGURE_CONTEXT':base+'article-figure-reconciliation-v1.json','M4-ATLAS_BRIDGE':base+'bridges/book-4-to-book-5-civilization-threshold-v1.json'};
 for(const frame of framing){const path=framePaths[frame.id],data=read(path);sourcePaths.push(path);frame.details.sourcePath=path;frame.details.sourceSha256=digest(fs.readFileSync(path));
  if(frame.id==='M4-FIGURE_CONTEXT'){frame.details.figureFindings=data.figures.map(f=>({...f,proposedDisposition:f.sourceStatus==='source-pending'?'SOURCE_PENDING_NO_SEMANTIC_ADMISSION':'KEEP_PART_CONTEXT_ONLY'}));frame.details.articleProjectionCount=data.matrix.length;}
  else frame.details.currentRecord=data;
 }
 decisions.push(...relationships,...dedup,...framing);
 const sourceDigests=Object.fromEntries([...new Set(sourcePaths)].sort().map(p=>[p,digest(fs.readFileSync(p))]));
 const packet={version:'1.0.0',stage:'M1-M4',role:'REVIEW_ONLY',humanReviewStage:'M8',sourceDigests,sourceDigest:digest(JSON.stringify(sourceDigests)),humanAcceptanceComplete:false,automaticWriteback:false,canonicalAuthority:false,coverage:{books:4,mappedObjects:mapping.flatMap(b=>b.objects).length,meaningCandidates:meaning.length,scopeItems:meaning.flatMap(m=>m.scope).length,claimItems:meaning.flatMap(m=>m.claims).length,fieldObjects:fieldCandidates.length,fieldItems:fieldCandidates.flatMap(f=>f.properties).length,book4Definitions:fieldCandidates.filter(f=>f.definition).length,withheldObjects:missing.length,relationshipItems:relationships.length,duplicatePairs:dedup.length},mapping,meaning,fieldCandidates,missing,decisions};
 return packet;
}
function friendly(d){
 const x=d.details,quote=e=>'<blockquote>'+esc(e.quote)+'<footer>'+esc(e.sectionCode||'')+(e.pages?' · PDF '+e.pages.join('–'):'')+'</footer></blockquote>';
 if(d.stage==='M1')return '<p>新 PDF '+x.pageCount+' 页。下面是候选定位，不是已批准的版本替换。</p><table><tr><th>章节</th><th>旧页</th><th>新页</th><th>结果</th></tr>'+x.rows.map(r=>'<tr><td>'+esc(r.title)+'</td><td>'+r.registeredPages.join('–')+'</td><td>'+(r.candidatePages?.join('–')||'待核对')+'</td><td>'+esc(({NORMALIZED_TEXT_EQUAL:'规范化正文相同',TEXT_DIFFERENCE_REVIEW_REQUIRED:'文本层有差异',TEXT_EQUAL_AFTER_REPEATED_HEADER_NORMALIZATION:'去重复标题后正文相同（非版式验证）',BASELINE_BODY_UNAVAILABLE:'缺旧版正文，未做逐字比较',AMBIGUOUS_HEADING:'多处同名，待定位',HEADING_OR_ANCHORS_NOT_MATCHED:'未匹配'})[r.status])+'</td></tr>').join('')+'</table>';
 if(d.stage==='M2')return '<h3>原提案</h3><p>'+esc(x.original)+'</p><h3>修改理由</h3><p>'+esc(x.revisionReason)+'</p><h3>原提案主张与已核验引文</h3>'+x.claims.map(c=>'<p>'+esc(c.claim)+'</p>'+c.evidence.map(quote).join('')).join('')+'<h3>最终候选逐句对照</h3><p>以下是原文候选上下文；仍需在 M8 判断是否支持对应表述。</p>'+x.finalClaimMap.map(c=>'<p>'+esc(c.claim)+'</p>'+c.context.map(quote).join('')).join('')+'<h3>边界逐条对照</h3>'+x.scope.map(c=>'<p><strong>'+esc(c.candidate)+'</strong></p>'+(c.original!==c.candidate?'<p>原句：'+esc(c.original)+'</p>':'')+'<p>'+esc(c.note)+(c.role==='EDITORIAL_USE_RESTRICTION'?' 此项是使用限制，不作为正文理论事实。':' 下列为待审上下文，检索相似不等于逻辑支持。')+'</p>'+c.context.map(quote).join('')).join('');
 if(d.stage==='M3'&&x.properties){const names={conditions:'条件',constraints:'约束',connections:'连接',triggerConditions:'触发条件',participantRoles:'参与角色',signals:'信号',responses:'响应',feedback:'反馈',coordinationEffects:'协调影响',degradationConditions:'退化条件',recoveryConditions:'恢复条件',continuityConditions:'连续条件',failureConditions:'失效条件',threshold:'阈值',sourceScaleToTargetScale:'起点与目标尺度'};return (x.definition?'<h3>定义来源</h3>'+x.definition.evidence.map(quote).join(''):'')+x.properties.map(f=>'<h3>'+esc(names[f.field]||f.field)+'</h3><p>'+esc(f.reason||'定性转换候选，不设定数值阈值。')+'</p>'+f.evidence.map(quote).join('')).join('');}
 if(d.stage==='M3')return '<p>'+esc(x.reason)+'</p>'+x.evidence.map(quote).join('');
 if(x.definitions)return x.definitions.map(v=>'<p>'+esc(v?.proposedValue||'待补定义')+'</p>'+(v?.evidence||[]).map(quote).join('')).join('');
 return '<p>'+esc(x.reason||d.proposal)+'</p>';
}
export function page(p){return `<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>M1–M4 统一审核包</title><style>body{max-width:1100px;margin:auto;padding:20px;font:17px/1.7 system-ui;background:#faf9f6;color:#222}article{border-top:1px solid #bbb;padding:20px 0}button,select,input,textarea{font:inherit;padding:8px;max-width:100%;box-sizing:border-box}textarea{display:block;width:100%;margin:12px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.6 system-ui;background:#fff;padding:12px}summary,button{cursor:pointer}table{width:100%;border-collapse:collapse;font-size:14px}td,th{border:1px solid #ccc;padding:6px;overflow-wrap:anywhere}blockquote{border-left:3px solid #bbb;margin:12px 0;padding:10px 16px;background:white}footer{font-size:13px;color:#555}#status{white-space:pre-wrap}</style><h1>M1–M4 统一审核包</h1><p>人工审核集中到 M8。此包提供候选文字、字段原文和版本差异，不会自动导入或冻结。来源片段的存在不等于命题已经成立；M3 的自动选段必须审核其字段归类。</p><p>40 条 meaning / ${p.coverage.scopeItems} 条边界 / 20 条 Book IV 定义候选。Pressure/通用 Threshold 仍缺少可直接登记的定义。Book IV 旧版完整正文不在本轮档案内，标题映射不能证明新旧语义相同。</p><label>阶段 <select id="stage"><option value="">全部</option>${['M1','M2','M3','M4'].map(x=>`<option>${x}</option>`).join('')}</select></label> <label>册 <select id="book"><option value="">全部</option>${['BOOK-1','BOOK-2','BOOK-3','BOOK-4','CROSS_BOOK'].map(x=>`<option>${x}</option>`).join('')}</select></label><label>审核人 <input id="reviewer" placeholder="M8 时填写"></label><button id="export">导出审核草稿</button><p id="status" role="status"></p><main>${p.decisions.map(d=>`<article data-stage="${d.stage}" data-book="${d.bookCode}" data-id="${d.id}"><h2>${esc(d.stage+' · '+d.title)}</h2><p>${esc(d.proposal)}</p><details><summary>查看原文、字段、来源与差异</summary>${friendly(d)}<details><summary>原始记录（可选）</summary><pre>${esc(JSON.stringify(d.details,null,2))}</pre></details></details><label>决定 <select data-decision><option value="NOT_REVIEWED">暂不审核</option><option value="APPROVE_PROPOSAL">认可候选</option><option value="REQUEST_CHANGE">需要修改</option><option value="NEEDS_EVIDENCE">需要证据</option><option value="REJECT">不认可</option></select></label><textarea aria-label="${esc(d.title)}审核意见" placeholder="记录修改或待补证内容"></textarea></article>`).join('')}</main><script>const digest=${JSON.stringify(p.sourceDigest)};const rows=[...document.querySelectorAll('article')];const q=id=>document.getElementById(id);function filter(){rows.forEach(r=>r.hidden=!!((q('stage').value&&r.dataset.stage!==q('stage').value)||(q('book').value&&r.dataset.book!==q('book').value)));}q('stage').onchange=q('book').onchange=filter;q('export').onclick=()=>{const result={sourceDigest:digest,reviewer:q('reviewer').value.trim(),humanAcceptanceApplied:false,decisions:rows.map(r=>({id:r.dataset.id,decision:r.querySelector('select').value,note:r.querySelector('textarea').value}))};q('status').textContent=result.reviewer?'草稿已导出；仍需核验版本、处理缺口并正式导入。':'草稿未填写审核人；不能用于正式审核。';const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='M8-review-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};</script></html>`;}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/build-sks-m1-m4-review.mjs')){const p=build();fs.mkdirSync(output,{recursive:true});fs.writeFileSync(output+'m1-m4-review-packet-v1.json',JSON.stringify(p,null,2)+'\n');fs.writeFileSync(output+'M1-M4-UNIFIED-REVIEW.html',page(p));console.log(JSON.stringify(p.coverage));}
