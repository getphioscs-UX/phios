// Exact source spans; classifications are transparent selection hints, not acceptance.
export const BAZI_PUBLICATION_LEAD_SELECTOR_V2='BAZI_PUBLICATION_LEAD_SELECTOR_V2';
export function classifySpan(span,sectionId){const t=span.text;const boundary=/不能|不得|不宜|没有.{0,12}(资料|年份|日期)|缺少|不等同|无法|cannot|not provided|unavailable|does not (prove|mean)|no (specific|luck)|not possible/i.test(t);const role=boundary?'BOUNDARY':/大运|流年|年度|Da Yun|annual|luck pillar/i.test(t)?'TIMING':/恢复|支持|偏印|承载|resource|support|recover/i.test(t)?'COUNTERWEIGHT':/伴侣|亲密|家人|照顾|承诺|收入|成本|客户|工作|学习|partner|intimacy|family|promise|income|cost|work|learn/i.test(t)?'LIVED_EXPRESSION':/伤官|食神|七杀|比肩|正财|偏财|日主|月令|Hurting Officer|Seven Killings|Wealth|Day Master/i.test(t)?'MECHANISM':'DOMAIN_INTERPRETATION';const roles=new Set([role]);if(/伤官|食神|七杀|比肩|偏印|正印|正财|偏财|日主|月令|Hurting Officer|Seven Killings|Resource|Wealth|Day Master|Companion|Seal|Metal|Water|Wood|Fire|Earth|大运|流年|三合|冲|土|金|格局|Da Yun|luck pillar|clash|combination/i.test(t))roles.add('MECHANISM');if(/你|对方|日常|现实|学习|工作|照顾|生活|亲密|you|daily|work|learn|care|intimacy|in practice/i.test(t))roles.add('LIVED_EXPRESSION');if(/恢复|支持|承载|制衡|resource|support|recover|carrying/i.test(t))roles.add('COUNTERWEIGHT');return {...span,role,roles:[...roles],sectionId};}
export function selectPublicationSpans(sentences,text,{sectionId,locale,authorityDigest,compilerVersion,profile,pass=0}){
 const all=sentences.map(s=>({...classifySpan(s,sectionId),locale,authorityDigest,compilerVersion,paragraphIndex:text.slice(0,s.start).split(/\n\s*\n/).length-1}));
 const priority=['DOMAIN_INTERPRETATION','MECHANISM','LIVED_EXPRESSION','COUNTERWEIGHT','TIMING','BOUNDARY'];
 const ranked=[...all].sort((a,b)=>priority.indexOf(a.role)-priority.indexOf(b.role)||a.start-b.start);
 const cap=Math.floor(profile.bodyBudget[locale]*(pass===0?1:pass===1?.85:.72));
 const used=new Set();
 function select(roles,required=[]){const out=[];let size=0;for(const pattern of required){const v=all.find(s=>pattern.test(s.text)&&!used.has(s.start)&&size+s.text.length<=cap);if(v){out.push(v);used.add(v.start);size+=v.text.length;}}for(const role of roles){const candidates=all.filter(s=>s.roles.includes(role)&&!used.has(s.start)).sort((a,b)=>a.text.length-b.text.length||a.start-b.start);const v=candidates.find(s=>size+s.text.length<=cap);if(v){out.push(v);used.add(v.start);size+=v.text.length;}}for(const s of ranked){if(!used.has(s.start)&&size+s.text.length<=cap){out.push(s);used.add(s.start);size+=s.text.length;}}return out.sort((a,b)=>a.start-b.start);}
 let a=select(['MECHANISM','LIVED_EXPRESSION']);let b=select(['COUNTERWEIGHT','TIMING','BOUNDARY']);
 // Cards use exact complete sentences. No hard substring, ellipsis or blind first sentence.
 const cards=[];const cardUsed=new Set();for(const role of ['DOMAIN_INTERPRETATION','LIVED_EXPRESSION','COUNTERWEIGHT']){const s=ranked.find(s=>s.role===role&&s.text.length<=profile.cardBudget[locale]&&!cardUsed.has(s.start))||ranked.find(s=>s.role!=='BOUNDARY'&&s.text.length<=profile.cardBudget[locale]&&!cardUsed.has(s.start));if(s){cards.push(s);cardUsed.add(s.start);}}
 if(pass>=2){const starts=new Set(cards.map(s=>s.start));const dedup=spans=>{const kept=spans.filter(s=>!starts.has(s.start));return kept.length?kept:spans;};a=dedup(a);b=dedup(b);}
 return {excerpts:[a,b],insightCards:cards,fullManuscriptPreserved:true,selectedFrom:BAZI_PUBLICATION_LEAD_SELECTOR_V2,selectionStatus:cards.length===3&&a.length&&b.length?'PASS':'PUBLICATION_REPAIR',sourceRoles:[...new Set(all.map(s=>s.role))]};
}
export function publicationCoverage(sections,locales=['zh-Hans','en']){
 return sections.map(s=>({
  sectionId:s.sectionId,
  locales:Object.fromEntries(
   locales
    .filter(l=>s[l])
    .map(l=>{
     const spans=[
      ...s[l].excerpts.flat(),
      ...s[l].insightCards
     ];

     const text=spans
      .map(v=>v.text)
      .join(' ');

     const roles=[
      ...new Set(
       spans.flatMap(
        v=>v.roles||[v.role]
       )
      )
     ];

     const missing=[];

     /*
       Universal publication contract:
       every visible section needs mechanism,
       lived expression and counterweight.
     */
     for(const role of [
      'MECHANISM',
      'LIVED_EXPRESSION',
      'COUNTERWEIGHT'
     ]){
      if(!roles.includes(role)){
       missing.push(role);
      }
     }

     /*
       Section-specific checks must describe
       the DOMAIN, never one reference chart.

       S04:
       require visible career/work context.
       Do not require Seven Killings,
       hidden Yin, Indirect Resource,
       Companion or any other natal-specific
       configuration.
     */
     if(
      s.sectionId==='S04' &&
      !/事业|职业|工作|责任|标准|期限|career|profession|work|responsibilit|standards|deadline/i.test(text)
     ){
      missing.push('CAREER_DOMAIN');
     }

     /*
       S06:
       require relationship / intimacy domain.
     */
     if(
      s.sectionId==='S06' &&
      !/亲密|信任|情绪|伴侣|关系|intimacy|trust|emotional|partner|relationship/i.test(text)
     ){
      missing.push('RELATIONSHIP_DOMAIN');
     }

     /*
       S07:
       require family / care / support domain.
     */
     if(
      s.sectionId==='S07' &&
      !/家庭|照顾|分担|隐形|支持|family|care|sharing|invisible|support/i.test(text)
     ){
      missing.push('FAMILY_DOMAIN');
     }

     /*
       S10:
       require BOTH timing layers,
       but never hard-code one customer's
       reference-specific timing values.

       Natal/timing identity itself remains
       governed by pack lineage and timingDigest.
     */
     if(s.sectionId==='S10'){
      const hasDaYun=
       /大运|Da Yun|luck pillar/i.test(text);

      const hasAnnual=
       /流年|年度|annual/i.test(text);

      if(!(hasDaYun&&hasAnnual)){
       missing.push('TIMING_LAYERS');
      }
     }

     return [
      l,
      {
       roles,
       missing,
       status:
        missing.length
         ? 'FAIL'
         : 'PASS'
      }
     ];
    })
  )
 }));
}
