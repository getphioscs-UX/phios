const reconciledSection=['S02_PERSONALITY','S03_LIFE_STRUCTURE'].includes(document.documentElement.dataset.section)?document.documentElement.dataset.section:null;
const wealthPage=document.documentElement.dataset.section==='S05_WEALTH';
const status=document.querySelector('#status'),result=document.querySelector('#result'),buttons=[...document.querySelectorAll('[data-locale]')];
function element(tag,text){const node=document.createElement(tag);node.textContent=text;return node;}
document.querySelector('#provider-status').addEventListener('click',async()=>{
 if(location.origin!=='https://qa.phios-github.pages.dev'){status.textContent='请在 QA 站点打开此页。';return;}
 status.textContent='正在检查模型访问…';
 try{const response=await fetch('/api/qa-bazi-t3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'rnt2-s04-provider-status'}),cache:'no-store'});const payload=await response.json();status.textContent=payload.ok?'模型访问检查完成（未生成正文）':`检查未完成：${payload.code||response.status}`;result.replaceChildren(element('pre',JSON.stringify(payload,null,2)));}catch{status.textContent='模型访问检查未完成。';}
});
for(const button of buttons)button.addEventListener('click',async()=>{
 if(location.origin!=='https://qa.phios-github.pages.dev'){status.textContent='请在 QA 站点打开此页。';return;}
 buttons.forEach(b=>b.disabled=true);status.textContent=button.dataset.reverify?'正在独立复核编辑版（不生成正文）…':'正在读取或生成，请保持页面打开…';result.replaceChildren();
 try{
  const response=await fetch('/api/qa-bazi-t3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:reconciledSection?'rnt2-'+reconciledSection.slice(0,3).toLowerCase()+(button.dataset.reverify?'-reverify':''):wealthPage?(button.dataset.reverify?'rnt2-s05-reverify':'rnt2-s05'):button.dataset.reverify?'rnt2-s04-reverify':'rnt2-s04',sectionKey:reconciledSection|| (wealthPage?'S05_WEALTH':'S04_CAREER'),locale:button.dataset.locale,...(button.dataset.profile?{profileId:button.dataset.profile}:{})}),cache:'no-store'});
  const payload=await response.json();
  if(!response.ok||!payload.ok){status.textContent=response.status===401?'请先登录上方审核账户，再返回此页。':`暂未完成：${payload.code||response.status}`;return;}
  const snapshot=payload.result,r=snapshot.result;
  status.textContent=`${payload.cacheHit?'已读取保存结果':'结果已保存'} · ${r.verification?.technicalAccepted?'TECHNICAL_PASS':r.status} · ${r.editorialQuality?.state||''} · OWNER_ACCEPTANCE_PENDING · REVIEW_ONLY${r.reviewAudit?.editorialRevision?' · T2 原稿经助手编辑':''}`;
  const headings={WEALTH_CHARACTER:['你的财富特质','Your approach to earning'],WEALTH_ADVANTAGES:['积累财富的优势','Strengths for building resources'],WEALTH_CHALLENGES:['容易遇到的财富问题','Financial pressure points'],WEALTH_DIRECTIONS:['适合的收入与积累方式','Earning and accumulation'],WEALTH_TIMING:['当前大运与流年','Your current Da Yun and annual cycle'],WEALTH_ADVICE:['财富取舍建议','Choices to consider'],CHART_HIGHLIGHTS:['事业命盘重点','Your career chart'],CAREER_CHARACTER:['你的事业特质','Your career qualities'],CAREER_ADVANTAGES:['事业优势','Career strengths'],CAREER_CHALLENGES:['事业挑战','Career challenges'],CAREER_DIRECTIONS:['适合的发展方向','Directions to consider'],CAREER_TIMING:['当前大运与流年','Your current Da Yun and annual cycle'],CAREER_ADVICE:['事业建议','Career guidance'],CAREER_THESIS:['职业主旨','Career thesis'],STRUCTURE:['事业格局','Career pattern'],MEANING:['工作中的含义','What it means at work'],CONDITIONS:['发挥条件','Role conditions'],COUNTERWEIGHTS:['优势与代价','Advantages and costs'],OBSERVABLE_EXPRESSION:['具体工作情境','Workplace scenarios'],TIMING_RELEVANCE:['当前阶段','Current timing'],NAVIGATION:['职业决策参考','Decision support']};
  if(wealthPage)headings.CHART_HIGHLIGHTS=['财富命盘重点','Your wealth chart'];
  if(reconciledSection)Object.assign(headings,r.brief?.marketContract?.headings||{});
  let previousRole=null;
  for(const block of r.candidate?.blocks||[]){const article=element('article','');if(block.role!==previousRole)article.append(element('h2',headings[block.role]?.[button.dataset.locale==='zh-Hans'?0:1]||block.role));for(const paragraph of block.text.split(/\n\s*\n/))article.append(element('p',paragraph));result.append(article);previousRole=block.role;}
  if(!r.candidate?.blocks?.length)result.append(element('p','尚无可审核正文；请查看验证信息。'));
  const details=element('details','');details.append(element('summary','Technical Evidence'),element('pre',JSON.stringify({artifactDigest:snapshot.artifactDigest,identity:snapshot.identity,verification:r.verification,quality:r.quality,editorialQuality:r.editorialQuality,careerNarrativeIR:r.careerNarrativeIR,wealthNarrativeIR:r.wealthNarrativeIR,internalOnly:r.internalOnly,usageRecord:r.usageRecord,verificationUsageRecords:r.verificationUsageRecords,reviewAudit:r.reviewAudit,ownerAcceptance:snapshot.ownerAcceptance,productionActivated:snapshot.productionActivated},null,2)));result.append(details);
 }catch{status.textContent='请求未完成。可以再次打开；服务端不会自动重复扣费生成。';}
 finally{buttons.forEach(b=>b.disabled=false);}
});
