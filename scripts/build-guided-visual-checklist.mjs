import fs from 'node:fs';
import {REPORT_VISUAL_MASTERS,REPORT_CARD_FAMILIES,REPORT_VISUAL_DESIGN_RULES,baziVisualMaster} from '../functions/canonical-presentation-runtime/report-visual-master-contract.js';
const root='docs/guided-report-successor-r1';
const source=fs.readFileSync(`${root}/reference-visual-attachment.md`,'utf8'),lines=source.split(/\r?\n/);
let fenced=false;const sections=[];
for(let i=0;i<lines.length;i++){
 if(/^```/.test(lines[i]))fenced=!fenced;
 if(!fenced&&/^#{1,3} /.test(lines[i]))sections.push({line:i+1,heading:lines[i].replace(/^#+ /,''),status:'PENDING_RECONCILIATION',humanAcceptance:'PENDING'});
}
const index={source:'reference-visual-attachment.md',sourceLineCount:lines.length,scope:'Every source heading indexed. Source preservation and contract registration are not implementation or visual acceptance.',sections};
fs.writeFileSync(`${root}/visual-requirement-index.json`,JSON.stringify(index,null,2)+'\n');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const gaps={
 M01:'固定 P01 使用三种语言的独立 R2 纵向封面；现有必需路径未能取到图片。不得把商品横图拉伸，也不得将示例出生资料作为默认值。',
 M02:'P02–05 静态图、原文和无障碍文本必须一致。120 个必需图片路径均未验证可用；七种方法的 P05 还缺完整双语原文。',
 M03:'现有四柱图尚未组成完整快照：四柱纵卡、日主／季节、五行与 Primary／Tension／Observe 的组合仍待绑定。',
 M04:'现有结构图可显示来源数据；核心、支撑、张力、表达与条件的专属母版，以及最多三张卡片仍待逐页绑定。',
 M05:'现有数值图组件保留真实数据要求。Donut＋排序条、五行网络、平衡矩阵的完整页面绑定与手机堆叠仍待验证。',
 M06:'关系／事业／资源图仍需分别绑定领域结构、条件、helps／costs／observe，不应只换标题或颜色。',
 M07:'需完整绑定 baseline／timing／period／current evidence，并验证缺数据时 DATA_REQUIRED；不得用示例年份或虚构能量曲线。',
 M08:'需绑定 WHEN／OBSERVE／COUNTER-SIGNAL、Opportunity／Condition／Risk、Notice→Compare→Test→Review 和完整 lineage。'
};
const rows=Object.entries(REPORT_VISUAL_MASTERS).map(([id,m])=>`<tr><th>${id} · ${m.role}</th><td>${Array.from({length:26},(_,i)=>i+1).filter(n=>baziVisualMaster(n)===id).join(', ')}</td><td>${m.slots.map(esc).join(' · ')}</td><td>${m.visualShare.map(n=>Math.round(n*100)).join('–')}%</td><td>${esc(gaps[id])}</td></tr>`).join('');
const html=`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>视觉设计逐项核对</title><style>body{margin:0;background:#fcfaf5;color:#23364a;font:16px/1.7 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:24px}h1,h2{font-family:Georgia,serif}a{color:#285a76}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border:1px solid #cabc9a;padding:12px;text-align:left;vertical-align:top}.table{overflow:auto}details{border-bottom:1px solid #cabc9a;padding:12px 0}summary{cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.65 system-ui}a:focus-visible,summary:focus-visible{outline:3px solid #986536;outline-offset:4px}.notice{border-left:4px solid #986536;padding:12px 18px;background:#f1eadc}button{padding:10px;font:inherit}input{padding:12px;font:inherit;width:min(90%,600px)}@media(max-width:600px){main{padding:16px}th,td{min-width:150px}}</style><main>
<h1>视觉设计逐项核对</h1><p class="notice">状态：实现进行中；人工视觉验收待完成。记录了全部 ${sections.length} 个章节标题，不等于全部实现。测试稿目前沿用既有动态页面，尚不是八字完整 26 页成品。</p>
<p><a href="review.html">查看 24 个语言／方法候选稿</a> · <a href="visual-requirement-index.json">完整需求索引</a> · <a href="reference-visual-attachment.md">完整附件原文</a> · <a href="STATUS.md">实现与阻塞状态</a></p>
<h2>八字 26 页与 M01–M08</h2><p>本表是实现约束。P08 以 M04 为主，允许经审核的 M04／M05 混合。静态 P01–05 遵循当前 L10N-COM-R2 合约；附件示例姓名、数值、四柱、年份不具有计算依据。</p><div class="table"><table><thead><tr><th>母版</th><th>页码</th><th>必需信息槽</th><th>视觉占比目标</th><th>尚需落实与验证</th></tr></thead><tbody>${rows}</tbody></table></div>
<h2>跨页面要求</h2><ul><li>只使用六类卡片：${REPORT_CARD_FAMILIES.join('、')}；标题／2–4 行正文／状态标记。</li><li>锁定页保留图表家族轮廓。当前四类骨架只是候选，需要继续验证与实际付费母版的一致性。</li><li>390／768／1440px；图表不可靠横向溢出维持布局；减少动态效果偏好必须生效。</li><li>A4 15–18mm 边距；同一 Page IR；图表和卡片组不拆页。已调整为 15mm，完整 PDF 尚缺静态页与完整页面绑定。</li><li>商品图、免费版、付费版、PDF 的品质连续性需要人工验收，机器通过不代替该验收。</li></ul>
<h2>全部附件章节</h2><label>搜索标题 <input id="filter" type="search" placeholder="例如 M05、Mobile、W30"></label><p>每节可展开原文；未获具体实现及验收证据的条目保留待核对。</p>
${sections.map((s,i)=>`<details data-heading="${esc(s.heading.toLowerCase())}"><summary>${esc(s.heading)} · 待核对 · 原文第 ${s.line} 行</summary><pre>${esc(lines.slice(s.line-1,(sections[i+1]?.line??lines.length+1)-1).join('\n'))}</pre></details>`).join('')}
</main><script>document.getElementById('filter').addEventListener('input',event=>{const q=event.target.value.toLowerCase();for(const el of document.querySelectorAll('details[data-heading]'))el.hidden=!el.dataset.heading.includes(q);});</script></html>`;
fs.writeFileSync(`${root}/VISUAL-DESIGN-CHECKLIST.html`,html);
fs.writeFileSync(`${root}/visual-master-contract.json`,JSON.stringify({masters:REPORT_VISUAL_MASTERS,cards:REPORT_CARD_FAMILIES,rules:REPORT_VISUAL_DESIGN_RULES,baziPages:Array.from({length:26},(_,i)=>({page:i+1,master:baziVisualMaster(i+1)})),humanAcceptance:'PENDING'},null,2)+'\n');
console.log(`Visual checklist: ${sections.length} source sections; 8 masters; 26 page mappings. Implementation and human acceptance remain separate.`);
