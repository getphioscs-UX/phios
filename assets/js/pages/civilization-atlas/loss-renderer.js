const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const loc=(v,l)=>v?.[l]??v?.en??'';
export function renderLossAtlas(root,{registry,casesRegistry,state,locale='en',onFamilySelect=()=>{},onLossSelect=()=>{}}={}){
 const l=locale==='zh-Hans'?'zh-Hans':'en',families=registry?.families||[],family=families.find(x=>x.familyId===state.lossFamilyId)||families[0],types=(registry?.lossTypes||[]).filter(x=>x.familyId===family?.familyId),active=types.find(x=>x.lossTypeId===state.lossTypeId)||types[0];
 const profiles=(registry?.caseProfiles||[]).filter(x=>!active||x.lossTypeId===active.lossTypeId),caseMap=new Map((casesRegistry?.cases||[]).map(c=>[c.caseId,c]));
 root.innerHTML=`<div class="civ-loss">
  ${active?`<article class="civ-loss-reader"><p class="knowledge-eyebrow">${esc(loc(family?.title,l))}</p><h4>${esc(loc(active.title,l))}</h4><p class="civ-loss-lead">${esc(loc(active.definition,l))}</p><p><strong>${esc(l==='zh-Hans'?'它改变的是：':'What changes: ')}</strong>${esc(loc(active.positionShift,l))}</p>${profiles.length?`<details class="civ-loss-examples"><summary>${esc(l==='zh-Hans'?'查看案例与证据强度':'View examples and evidence strength')}</summary><div class="civ-loss-profiles">${profiles.map(p=>{const c=caseMap.get(p.caseId);return `<article><strong>${esc(c?loc(c.title,l):(l==='zh-Hans'?'文明案例':'Civilization case'))}</strong><p>${esc(loc(p.interpretation,l))}</p><small>${esc(l==='zh-Hans'?'证据状态保留在登记层':'Evidence status retained in registry')}</small></article>`}).join('')}</div></details>`:''}</article>`:''}
  <nav class="civ-loss-navigator" aria-label="${esc(l==='zh-Hans'?'切换损失与延续视角':'Change loss and continuity view')}"><p class="civ-atlas-nav-label">${esc(l==='zh-Hans'?'选择观察维度':'Choose a dimension')}</p><div class="civ-loss-families" role="group">${families.map(f=>`<button type="button" aria-pressed="${f.familyId===family?.familyId?'true':'false'}" class="${f.familyId===family?.familyId?'is-active':''}" data-family="${esc(f.familyId)}"><strong>${esc(loc(f.title,l))}</strong><small>${esc(loc(f.description,l))}</small></button>`).join('')}</div><div class="civ-loss-types" aria-label="${esc(l==='zh-Hans'?'当前维度的具体变化':'Changes in this dimension')}">${types.map(t=>`<button type="button" aria-pressed="${t.lossTypeId===active?.lossTypeId?'true':'false'}" class="${t.lossTypeId===active?.lossTypeId?'is-active':''}" data-loss="${esc(t.lossTypeId)}"><span>${esc(loc(t.title,l))}</span></button>`).join('')}</div></nav>
  <p class="civ-atlas-note">${esc(l==='zh-Hans'?'文明损失不是单一崩塌；损失、继任与延续可以同时存在，这里不产生总分或衰落排名。':'Civilizational loss is not a single collapse; loss, succession and continuation can coexist. No total decline score or ranking is produced.')}</p>
 </div>`;
 root.querySelectorAll('[data-family]').forEach(b=>b.addEventListener('click',()=>onFamilySelect(b.dataset.family)));
 root.querySelectorAll('[data-loss]').forEach(b=>b.addEventListener('click',()=>onLossSelect(b.dataset.loss)));
 return {family,active};
}
export function renderLossInspector(root,{selection,locale='en'}={}){
 const l=locale==='zh-Hans'?'zh-Hans':'en'; if(!root||!selection?.family)return;
 root.innerHTML=`<h3>${esc(loc(selection.family.title,l))}</h3><p>${esc(loc(selection.family.description,l))}</p>${selection.active?`<p><strong>${esc(loc(selection.active.title,l))}</strong></p>`:''}<p>${esc(l==='zh-Hans'?'没有文明总分；损失、继任与延续可以同时存在。':'There is no civilization total score; loss, succession, and continuation can coexist.')}</p>`;
}
