import {esc,tr} from './runtime-ui.js';
const sectionName=key=>({assets:tr('Assets','资产'),liabilities:tr('Liabilities','负债'),guarantees:tr('Contingent guarantees','或有担保')})[key]||tr('Selected information','所选资料');
export function privateSectionPreview(key,section){
 const items=Array.isArray(section)?section:section?.items||[];
 return `<section><h4>${esc(sectionName(key))}</h4>${items.length?'<ul>'+items.map(item=>`<li><strong>${esc(item.label||tr('Unnamed item','未命名项目'))}</strong> · ${esc(item.value==null?tr('Amount not confirmed','金额未确认'):String(item.value))} ${esc(item.currency||'')}${item.instruction?`<p>${esc(item.instruction)}</p>`:''}</li>`).join('')+'</ul>':`<p>${esc(tr('No items in this selected section. This does not establish that no assets or obligations exist.','本次所选章节没有项目；这不代表没有资产或责任。'))}</p>`}</section>`;
}
export function privateImportDiff(change){return `<section><h3>${esc(sectionName(change.section))}</h3><p>${esc(change.changed?tr('Changes to review','有差异，须审核'):tr('No changes in this section','本章节无差异'))}</p><div class="finance-diff-columns"><div><strong>${esc(tr('Before','原资料'))}</strong>${privateSectionPreview(change.section,change.before)}</div><div><strong>${esc(tr('After import','导入后'))}</strong>${privateSectionPreview(change.section,change.after)}</div></div></section>`;}
