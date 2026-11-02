export const MCD6_RENDERER_VERSION = 'MCD-6-DYNAMIC-RENDERER-v1.0.0';
export const MCD6_PRODUCTION_METHOD_CODES = Object.freeze(['ASTROLOGY_PROJECTION', 'BAZI_PROJECTION', 'NUMEROLOGY_PROJECTION']);
export const MCD6_HDR_PUBLIC_METHOD_CODE = 'PERSONAL_RUNTIME_PROJECTION';
export const MCD6_HDR_PUBLIC_LABEL = Object.freeze({ en: 'Personal Runtime Projection', 'zh-Hans': '个人运行投射' });

const RAW_LEAK_KEYS = new Set(['raw','rawResult','rawResults','coreResults','stack','stackTrace','internalServerPath','serverPath','modulePath','secret','secrets','providerPrompt','modelPrompt','pluginCode','methodCode']);

export function escapeHtml(value) {
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
}
export function escapeAttr(value) { return escapeHtml(value).replaceAll('`','&#96;'); }
export function assertNoRawLeakKeys(value, path='$') {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) return value.forEach((item,index)=>assertNoRawLeakKeys(item,`${path}[${index}]`));
  for (const [key,child] of Object.entries(value)) {
    if (RAW_LEAK_KEYS.has(key)) throw Object.assign(new Error(`MCD6_RAW_RUNTIME_LEAK:${path}.${key}`),{code:'MCD6_RAW_RUNTIME_LEAK',path:`${path}.${key}`});
    assertNoRawLeakKeys(child,`${path}.${key}`);
  }
}
export function assertCanonicalRendererInput(canonical) {
  if (!canonical || typeof canonical !== 'object' || Array.isArray(canonical)) throw Object.assign(new Error('MCD6_CANONICAL_PROJECTION_REQUIRED'),{code:'MCD6_CANONICAL_PROJECTION_REQUIRED'});
  if (canonical.schemaVersion !== 'PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0') throw Object.assign(new Error('MCD6_CANONICAL_SCHEMA_VERSION_REQUIRED'),{code:'MCD6_CANONICAL_SCHEMA_VERSION_REQUIRED'});
  for (const key of ['projectionId','method','calculation','projection','unknown','evidence','version','execution','interpretation']) if (!(key in canonical)) throw Object.assign(new Error(`MCD6_CANONICAL_FIELD_REQUIRED:${key}`),{code:'MCD6_CANONICAL_FIELD_REQUIRED',field:key});
  if (!Array.isArray(canonical.unknown) || !Array.isArray(canonical.evidence)) throw Object.assign(new Error('MCD6_CANONICAL_ARRAYS_REQUIRED'),{code:'MCD6_CANONICAL_ARRAYS_REQUIRED'});
  if (canonical.interpretation?.included !== false) throw Object.assign(new Error('MCD6_INTERPRETATION_NOT_RENDERABLE'),{code:'MCD6_INTERPRETATION_NOT_RENDERABLE'});
  assertNoRawLeakKeys(canonical);
  return canonical;
}
export function getPublicMethodCode(canonical) { return canonical?.method?.publicMethodCode ?? null; }
export function getGroup(canonical, codes) { const wanted=new Set(Array.isArray(codes)?codes:[codes]); return (canonical?.calculation?.structures||[]).find(group=>wanted.has(group.code)) ?? null; }
export function valueMap(canonical) { return new Map((canonical?.calculation?.values||[]).map(item=>[item.code,item])); }
export function hasMissingBirthTime(canonical) { return (canonical?.unknown||[]).some(item=>item.category==='MISSING_INPUT' && String(item.scope).toUpperCase().includes('BIRTH_TIME')); }
export function hasRuleEvidence(canonical, token) { const t=String(token).toUpperCase(); return (canonical?.evidence||[]).some(item=>item.type==='RULE_SOURCE' && item.status==='AVAILABLE' && `${item.sourceCode||''} ${item.reference||''}`.toUpperCase().includes(t)); }

export function evaluateRendererAuthority(canonical, mode='PRODUCTION', {validationFixture=false}={}) {
  assertCanonicalRendererInput(canonical);
  const methodCode=getPublicMethodCode(canonical); const mpa=canonical.execution?.mpaDecision;
  if (methodCode===MCD6_HDR_PUBLIC_METHOD_CODE) {
    const valid = mode==='VALIDATION' && validationFixture===true && canonical.method?.status==='VALIDATION_ONLY_NOT_CLIENT_DISPATCHABLE' && canonical.projection?.status==='VALIDATION_ONLY_NOT_CLIENT_DISPATCHABLE' && canonical.projection?.productionResult===false && mpa?.authorityOwner==='MPA' && mpa?.dispatchAllowed===false;
    return Object.freeze({allowed:valid,mode:valid?'VALIDATION_ONLY':'BLOCKED',reasonCode:valid?'HDR_VALIDATION_RENDERER_ONLY':'HDR_PRODUCTION_RENDERING_FORBIDDEN',methodCode});
  }
  if (!MCD6_PRODUCTION_METHOD_CODES.includes(methodCode)) return Object.freeze({allowed:false,mode:'BLOCKED',reasonCode:'MCD6_RENDERER_NOT_REGISTERED',methodCode});
  if (mode!=='PRODUCTION') return Object.freeze({allowed:false,mode:'BLOCKED',reasonCode:'MCD6_NON_HDR_VALIDATION_MODE_NOT_PUBLIC_CONTRACT',methodCode});
  if (canonical.method?.status!=='PRODUCTION_BOUND_SCOPE') return Object.freeze({allowed:false,mode:'BLOCKED',reasonCode:'MCD6_METHOD_NOT_PRODUCTION_BOUND_SCOPE',methodCode});
  if (mpa?.authorityOwner!=='MPA' || mpa?.dispatchAllowed!==true) return Object.freeze({allowed:false,mode:'BLOCKED',reasonCode:'MCD6_MPA_DISPATCH_NOT_ALLOWED',methodCode});
  if (canonical.projection?.clientRenderable!==true || canonical.projection?.productionResult!==true) return Object.freeze({allowed:false,mode:'BLOCKED',reasonCode:'MCD6_CANONICAL_PROJECTION_NOT_PRODUCTION_RENDERABLE',methodCode});
  if (!['COMPLETE','PARTIAL'].includes(canonical.projection?.status)) return Object.freeze({allowed:false,mode:'BLOCKED',reasonCode:'MCD6_CANONICAL_PROJECTION_STATUS_NOT_RENDERABLE',methodCode});
  return Object.freeze({allowed:true,mode:'PRODUCTION',reasonCode:'MPA_AND_MCD5_CANONICAL_PROJECTION_ACCEPTED',methodCode});
}

function renderEvidenceRows(evidence){
  if(!evidence.length) return '<p>—</p>';
  return `<ul class="mcd6-list">${evidence.map(item=>`<li><strong>${escapeHtml(item.type)}</strong><span>${escapeHtml(item.status)}</span>${item.sourceCode?`<code>${escapeHtml(item.sourceCode)}</code>`:''}${item.reference?`<small>${escapeHtml(item.reference)}</small>`:''}</li>`).join('')}</ul>`;
}
function renderUnknownRows(items, locale){
  if(!items.length) return `<p>${escapeHtml(locale==='zh-Hans'?'没有声明未知项':'No declared unknowns')}</p>`;
  return `<ul class="mcd6-list">${items.map(item=>`<li><strong>${escapeHtml(item.code)}</strong><span>${escapeHtml(item.category)}</span><small>${escapeHtml(item.scope)}</small>${(item.reasonCodes||[]).length?`<code>${escapeHtml(item.reasonCodes.join(' · '))}</code>`:''}</li>`).join('')}</ul>`;
}
function statusRows(canonical, locale){
  const calculated=['COMPLETE','PARTIAL'].includes(canonical.calculation?.status);
  const projected=['COMPLETE','PARTIAL'].includes(canonical.projection?.status);
  const missing=(canonical.unknown||[]).some(x=>x.category==='MISSING_INPUT'||x.category==='UNCERTAIN_VALUE');
  const rows=[
    {glyph:calculated?'●':'△',code:'CALCULATION',label:canonical.calculation?.status||'UNKNOWN'},
    {glyph:projected?'●':'△',code:'PROJECTION',label:canonical.projection?.status||'UNKNOWN'},
    {glyph:'○',code:'INTERPRETATION',label:canonical.interpretation?.included===true?'INCLUDED':'EXCLUDED'},
    ...(missing?[{glyph:'△',code:'INPUT',label:'INCOMPLETE_OR_UNCERTAIN'}]:[])
  ];
  return `<ul class="mcd6-state-list" aria-label="${escapeAttr(locale==='zh-Hans'?'Canonical 来源状态':'Canonical provenance states')}">${rows.map(r=>`<li data-state="${escapeAttr(r.code)}"><span aria-hidden="true">${r.glyph}</span><strong>${escapeHtml(r.code)}</strong><span>${escapeHtml(r.label)}</span></li>`).join('')}</ul>`;
}
export function renderSharedOverlay(canonical,{locale='en',lineage=[]}={}){
  assertCanonicalRendererInput(canonical);
  const t=locale==='zh-Hans'?{result:'结果',evidence:'证据',calculation:'计算',projection:'投射',uncertainty:'不确定性',source:'来源'}:{result:'Result',evidence:'Evidence',calculation:'Calculation',projection:'Projection',uncertainty:'Uncertainty',source:'Source'};
  const versions=Object.entries(canonical.version||{});
  const calculationCounts={values:(canonical.calculation?.values||[]).length,structures:(canonical.calculation?.structures||[]).length,cycles:(canonical.calculation?.cycles||[]).length,positions:(canonical.calculation?.positions||[]).length};
  return `<aside class="mcd6-overlay" aria-label="${escapeAttr(locale==='zh-Hans'?'结果证据、不确定性与来源':'Result evidence, uncertainty and lineage')}">
    <section class="mcd6-overlay__section"><h4>${t.result}</h4>${statusRows(canonical,locale)}<p><code>${escapeHtml(canonical.projectionId)}</code></p></section>
    <section class="mcd6-overlay__section"><h4>${t.evidence}</h4>${renderEvidenceRows(canonical.evidence||[])}</section>
    <section class="mcd6-overlay__section"><h4>${t.calculation}</h4><dl class="mcd6-kv"><div><dt>Status</dt><dd>${escapeHtml(canonical.calculation?.status)}</dd></div><div><dt>Deterministic</dt><dd>${escapeHtml(canonical.calculation?.deterministic)}</dd></div>${Object.entries(calculationCounts).map(([k,v])=>`<div><dt>${escapeHtml(k)}</dt><dd>${v}</dd></div>`).join('')}</dl></section>
    <section class="mcd6-overlay__section"><h4>${t.projection}</h4><dl class="mcd6-kv"><div><dt>Status</dt><dd>${escapeHtml(canonical.projection?.status)}</dd></div><div><dt>Production result</dt><dd>${escapeHtml(canonical.projection?.productionResult)}</dd></div><div><dt>Client renderable</dt><dd>${escapeHtml(canonical.projection?.clientRenderable)}</dd></div></dl></section>
    <section class="mcd6-overlay__section"><h4>${t.uncertainty}</h4>${renderUnknownRows(canonical.unknown||[],locale)}</section>
    <section class="mcd6-overlay__section"><h4>${t.source}</h4><dl class="mcd6-kv">${versions.map(([k,v])=>`<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}</dl>${lineage.length?`<ul class="mcd6-list">${lineage.map(item=>`<li><strong>${escapeHtml(item.label||item.ref||'Lineage')}</strong>${item.ref?`<code>${escapeHtml(item.ref)}</code>`:''}</li>`).join('')}</ul>`:''}</section>
  </aside>`;
}
export function blockedRenderResult(canonical,authority,{locale='en',lineage=[]}={}){
  const label=locale==='zh-Hans'?'当前不可生成 Production Renderer':'Production rendering unavailable';
  return Object.freeze({status:'BLOCKED',mode:authority.mode,reasonCode:authority.reasonCode,html:`<section class="mcd6-blocked" role="status"><strong>${escapeHtml(label)}</strong><code>${escapeHtml(authority.reasonCode)}</code></section>${canonical?renderSharedOverlay(canonical,{locale,lineage}):''}`,accessibleText:`${label}: ${authority.reasonCode}`,rendererVersion:MCD6_RENDERER_VERSION});
}
export function canonicalLabel(canonical,fallback=''){return canonical?.method?.publicLabel||canonical?.method?.publicLabels?.en||fallback;}
