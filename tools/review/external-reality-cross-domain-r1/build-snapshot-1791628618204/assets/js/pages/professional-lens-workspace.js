import { buildProfessionalLensWorkspace, createManualProfessionalInput } from '../../../functions/professional/lens-workspace/professional-lens-workspace.js';

const payload = window.__PHIOS_PROFESSIONAL_WORKSPACE_VIEW__ && typeof window.__PHIOS_PROFESSIONAL_WORKSPACE_VIEW__ === 'object'
  ? window.__PHIOS_PROFESSIONAL_WORKSPACE_VIEW__ : null;
const lensPayload = payload?.professional_lens_workspace || {};
const zh = () => String(document.documentElement.lang || '').toLowerCase().startsWith('zh');
const tr = (en, cn) => zh() ? cn : en;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LABELS = {
  AST: ['Astrology','占星'], BZR: ['BaZi','八字'], ZI_WEI: ['Zi Wei','紫微斗数'], NUM: ['Numerology','数字'], HDR_INTERNAL: ['Internal Operating Lens','内部运行视角']
};
const ROLES = {
  AST: ['Function · current dynamics','功能 · 当前动态'], BZR: ['Temporal environment','时间环境'], ZI_WEI: ['Life-domain context','生活领域情境'], NUM: ['Rhythm · cycle','节奏 · 周期'], HDR_INTERNAL: ['Operating · decision process','运行 · 决策过程']
};
let manualDrafts = [];

function renderLenses() {
  const root = document.querySelector('#professionalLensWorkspace'); if (!root) return;
  const projection = buildProfessionalLensWorkspace(lensPayload);
  if (!projection.authorized) {
    root.innerHTML = `<p class="professional-workspace-empty">${esc(tr('No authorised professional Lens payload is loaded. The workspace will not reconstruct Method results from browser data.','目前没有已授权的 Professional Lens payload。工作区不会从浏览器资料自行重建 Method 结果。'))}</p>`;
    return;
  }
  root.innerHTML = `<div class="pro-lens-grid">${projection.lenses.map(lens => {
    const [en,cn]=LABELS[lens.lensCode]||[lens.lensCode,lens.lensCode]; const [re,rzh]=ROLES[lens.lensCode]||['',''];
    return `<article class="pro-lens-card" data-stage17-lens="${esc(lens.lensCode)}"><header><div><small>${esc(tr(re,rzh))}</small><h2>${esc(tr(en,cn))}</h2></div><strong>${esc(lens.state)}</strong></header>${lens.results.length?`<ul>${lens.results.map(r=>`<li><span>${esc(r.capability)}</span><p>${esc(r.summary||tr('Governed result supplied.','已提供受治理结果。'))}</p><small>${esc(r.origin)} · ${esc(r.sourceArtifactId)} · ${esc(r.sourceSchemaVersion)}</small></li>`).join('')}</ul>`:`<p>${esc(tr('No governed result was supplied. This workspace does not calculate a substitute.','没有提供受治理结果；此工作区不会自行计算替代结果。'))}</p>`}</article>`;
  }).join('')}</div><p class="professional-contract-boundary">${esc(tr('Lens results stay separate. No method voting, cross-method mutation or model reconstruction is allowed.','各 Lens 结果保持分离；禁止方法投票、跨方法改写或模型重建计算。'))}</p>`;
}

function renderDrafts() {
  const root=document.querySelector('[data-stage17-manual-drafts]'); if(!root)return;
  root.innerHTML=manualDrafts.length?manualDrafts.map(r=>`<article class="pro-manual-record"><header><strong>${esc(r.extensionCode)}</strong><span>${esc(r.informationClass)}</span></header><p>${esc(r.value)}</p><dl><div><dt>enteredBy</dt><dd>${esc(r.enteredBy)}</dd></div><div><dt>enteredAt</dt><dd>${esc(r.enteredAt)}</dd></div><div><dt>sourceType</dt><dd>${esc(r.sourceType)}</dd></div><div><dt>sourceRef</dt><dd>${esc(r.sourceRef)}</dd></div><div><dt>professionalScope</dt><dd>${esc(r.professionalScope)}</dd></div></dl><small>${esc(tr('Draft only · not persisted · not a calculation fact · not Reality evidence','仅为草稿 · 未持久化 · 不是计算事实 · 不是 Reality evidence'))}</small></article>`).join(''):`<p class="professional-workspace-empty">${esc(tr('No manual professional extension has been entered in this session.','本次会话尚未输入 Manual Professional Extension。'))}</p>`;
}

function bindManual() {
  const form=document.querySelector('[data-stage17-manual-form]'); if(!form)return;
  const allowed = payload && lensPayload.authorized === true && lensPayload.manualExtensionsAllowed === true;
  [...form.elements].forEach(el=>{ if(el.tagName!=='BUTTON') el.disabled=!allowed; });
  const status=document.querySelector('[data-stage17-manual-status]');
  if(!allowed){ status.textContent=tr('Manual extensions are unavailable until an authenticated, consent-gated professional payload explicitly allows them.','只有经过身份验证、同意门控的 Professional payload 明确授权后，Manual Extensions 才可输入。'); }
  form.addEventListener('submit',event=>{
    event.preventDefault(); if(!allowed)return;
    const fd=new FormData(form);
    try{
      const record=createManualProfessionalInput({
        extensionCode:fd.get('extensionCode'), enteredBy:fd.get('enteredBy'), enteredAt:new Date().toISOString(),
        sourceType:'PROFESSIONAL_MANUAL_INPUT', sourceRef:fd.get('sourceRef'), professionalScope:fd.get('professionalScope'), value:fd.get('value')
      });
      manualDrafts=[...manualDrafts,record]; renderDrafts();
      status.textContent=tr('Manual professional context added to this in-memory session only. Nothing was saved.','Manual professional context 已加入本次内存会话；没有任何资料被保存。');
      form.elements.value.value='';
    } catch(error){ status.textContent=error.message; }
  });
  renderDrafts();
}

renderLenses(); bindManual();
