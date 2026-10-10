const pathsRoot=document.querySelector('[data-cx-academy-paths]');
const lessonRoot=document.querySelector('[data-cx-academy-lesson]');
const zh=()=>document.documentElement.lang.startsWith('zh');
const copy=(en,cn)=>zh()?cn:en;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles={
 'Evidence Distinction Path':'区分证据的学习路径','Bounded Reading Path':'理解读取范围的学习路径','Constraint-aware Navigation Path':'结合限制选择方向的学习路径','Review and Continuity Path':'复盘与持续观察的学习路径','Bounded Professional Formation Path':'专业责任与范围的学习路径',
 'Distinguishing Evidence and Inference':'区分证据与推断','Forming a Bounded Reading':'形成范围清楚的读取','Navigating Options and Constraints':'结合选项与限制寻找方向','Reviewing Outcomes and Continuity':'回看结果与持续变化','Maintaining Professional Boundaries':'保持专业服务边界'
};
const title=v=>zh()?(titles[v]||v):v;
const cache=new Map();
async function get(url){if(!cache.has(url))cache.set(url,fetch(url,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('ACADEMY_SOURCE_UNAVAILABLE');return r.json()}).catch(e=>{cache.delete(url);throw e}));return cache.get(url)}
async function renderPaths(){
 if(!pathsRoot)return;
 try{
  const data=await get('/content/academy/academy-learning-runtime/registries/learning-path-registry-v1.json');
  const items=(data.learningPaths||data.items||[]).filter(x=>x.status==='APPROVED');
  pathsRoot.innerHTML=items.map(x=>`<article class="cx-card cx-stack"><h3 class="cx-heading-2">${esc(title(x.title))}</h3><p class="cx-meta">${copy('View the learning outline; lesson delivery and assessment are not implied.','可查看学习大纲；不代表授课与评估已开放。')}</p><a class="cx-button" href="/academy/lesson/?lesson=${encodeURIComponent((x.moduleCodes||[])[0]||x.learningPathCode)}">${copy('View outline','查看大纲')}</a></article>`).join('')||`<p class="cx-muted">${copy('There are no learning paths to display yet.','目前暂无可查看的学习路径。')}</p>`;
 }catch{pathsRoot.innerHTML=`<p class="cx-muted">${copy('Learning paths could not load. Please try again later.','学习路径暂时无法加载，请稍后重试。')}</p>`}
}
async function renderLesson(){
 if(!lessonRoot)return;const q=new URLSearchParams(location.search).get('lesson');if(!q)return;
 try{
  const [lessons,modules]=await Promise.all([get('/content/academy/academy-learning-runtime/registries/lesson-registry-v1.json'),get('/content/academy/academy-learning-runtime/registries/module-registry-v1.json')]);
  const mod=(modules.modules||modules.items||[]).find(x=>x.moduleCode===q);
  const list=lessons.lessons||lessons.items||[];
  const lesson=list.find(x=>x.lessonCode===q)||list.find(x=>mod&&(mod.lessonCodes||[]).includes(x.lessonCode));if(!lesson)return;
  const heading=lessonRoot.querySelector('[data-cx-lesson-title]'),summary=lessonRoot.querySelector('[data-cx-lesson-summary]'),details=lessonRoot.querySelector('[data-cx-lesson-details]');
  for(const n of [heading,summary]){n.removeAttribute('data-cx-en');n.removeAttribute('data-cx-zh')}
  heading.textContent=title(lesson.title);summary.textContent=copy('This page describes the learning outline. It does not enroll you in a course or award a qualification.','本页介绍学习大纲，不会自动报名课程或授予资格。');
  details.innerHTML=`<article class="cx-card"><h2>${copy('What to explore','可以探索什么')}</h2><p>${esc(title(lesson.title))}</p><a href="/academy/">${copy('Compare learning paths','查看其他学习路径')}</a></article>`;
 }catch{const n=lessonRoot.querySelector('[data-cx-lesson-summary]');if(n)n.textContent=copy('The outline could not load. Return to learning paths and try again.','大纲暂时无法加载，请返回学习路径后重试。')}
}
renderPaths();renderLesson();
new MutationObserver(()=>{renderPaths();renderLesson()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
