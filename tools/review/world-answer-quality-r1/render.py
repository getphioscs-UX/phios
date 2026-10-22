from pathlib import Path
p=Path('assets/js/pages/civilization-atlas/world-customer-answer.js')
old=p.read_text(encoding='utf-8');prefix=old[:old.index('export function worldCustomerAnswerHTML')]
body=r'''const safeLink=value=>/^https:\/\//.test(value)||/^\/(?!\/)/.test(value)?value:'';
export function worldCustomerAnswerHTML(answer,locale='en'){
 const zh=locale==='zh-Hans',t=(z,e)=>zh?z:e,esc=escWorld,x=answer.explanation;
 const sources=x?.sources||[],observations=answer.observations||[];
 const cite=refs=>(refs||[]).map(id=>{const n=sources.findIndex(s=>s.sourceId===id);return n<0?'':`<button type="button" data-evidence-source="${n}" aria-label="${t('查看来源','View source')} ${n+1}" style="font:inherit;font-size:.85em;padding:3px 7px;min-height:32px">[${n+1}]</button>`;}).join('');
 const direct=x?.directAnswer||answer.directAnswer,segments=x?.segments||[];
 const reasons=segments.length?segments.filter(s=>s.role==='reason'):(x?.reasons?.length?x.reasons:answer.mechanism||[]).map(text=>({text,sourceRefs:[]}));
 const next=(x?.nextSteps||[t('明确你想比较的地点、时期和条件。','Identify the place, period and conditions you want to compare.'),t('把与你有关的条件带回自己的问题。','Bring relevant conditions into your own question.')]).slice(0,2);
 return `<div data-customer-answer><h2>${t('回答你的问题','Answering your question')}</h2><p data-customer-direct>${esc(direct)} ${cite(segments.find(s=>s.role==='direct')?.sourceRefs)}</p>${reasons.length?`<h3>${t('原因与条件','Reasons and conditions')}</h3>${reasons.map(s=>`<p>${esc(s.text)} ${cite(s.sourceRefs)}</p>`).join('')}`:''}<h3>${t('与生活的关系','What this means for everyday life')}</h3><p>${esc(x?.impact||t('这些总体资料帮助理解背景；个人影响仍取决于自己的收入、支出和选择条件。','Aggregate evidence explains context; personal effects still depend on your income, costs and options.'))}</p><h3>${t('接下来可以做什么','What you can do next')}</h3><ol>${next.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p class="small">${esc(x?.boundary||t('资料对应注明时期，不代表实时情况，也不能直接推出个人结果。','Evidence refers to its stated period; it is not real-time or an individual outcome.'))}</p><details data-source-details><summary>${t('查看数据、来源与适用范围','Data, sources and scope')}</summary>${sources.map((s,i)=>`<article data-source-key="${i}"><h4>[${i+1}] <a href="${esc(safeLink(s.href))}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></h4><p>${esc(s.publisher||'PHI OS')}${s.publishedAt?' · '+esc(s.publishedAt):''}</p><blockquote>${esc(s.text)}</blockquote>${s.scope?`<p>${esc(s.scope)}</p>`:''}</article>`).join('')}${observations.map(o=>`<p><a href="${esc(safeLink(o.sourceUrl))}">${esc(o.sourcePublisher)} · ${esc(o.observationPeriod)}</a></p><p>${esc(o.measurementDefinition)}</p>`).join('')}${[...(x?.gaps||[]),...(x?[]:answer.missingEvidence||[]),...(x?[]:answer.limits||[])].length?`<p>${t('尚需核对','Still to verify')}</p><ul>${[...(x?.gaps||[]),...(x?[]:answer.missingEvidence||[]),...(x?[]:answer.limits||[])].map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`:''}</details></div>`;
}
if(typeof document!=='undefined')document.addEventListener('click',event=>{const b=event.target.closest?.('[data-evidence-source]');if(!b)return;const root=b.closest('[data-customer-answer]'),details=root?.querySelector('[data-source-details]');if(details){details.open=true;root.querySelector(`[data-source-key="${b.dataset.evidenceSource}"]`)?.scrollIntoView({block:'nearest'});}});
'''
# Raw string preserves JavaScript regex escapes; only one slash escape is required.
body=body.replace(chr(92)*2,chr(92))
p.write_bytes((prefix+body).encode())
