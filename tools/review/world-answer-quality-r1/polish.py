from pathlib import Path
p=Path('assets/customer-ui/js/surfaces/ric-world-session-panel.js');s=p.read_text(encoding='utf-8')
where=" const $=id=>host.querySelector(id)"
helper=""" function sourceDisplay(s){return `<p><a href="${esc(s.originalUrlOrCanonicalRef)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a> · ${esc(s.publisher)}</p><p>${esc(s.observationPeriod)}${s.publishedAt?' · '+esc(s.publishedAt):''}</p><p>${esc(s.quoteSpanOrDatasetRow)}</p><p>${esc(s.methodology)}</p>`;}
"""
s=s.replace(where,helper+where)
s=s.replace('<pre>${esc(JSON.stringify({sources:item.sources,unknowns:item.unknowns,limitations:item.limitations,permission:item.permission},null,2))}</pre>', '${item.sources.map(sourceDisplay).join(\'\')}')
s=s.replace('<pre>${esc(JSON.stringify(c.sourceRefs.map(ref=>result.sources[ref]),null,2))}</pre>', '${c.sourceRefs.map(ref=>sourceDisplay(result.sources[ref])).join(\'\')}')
s=s.replace("${t('我的现实：当前会话','My Reality: current session')}","${t('我选取的背景资料','Background I selected')}")
s=s.replace("${t('本地会话候选。公共资料不会变成个人事实；不保存账户资料，不调用模型。','Local session candidate. Public evidence does not become a personal fact. No account saving or model calls.')}","${t('先了解问题，再理清自己的条件与选择。','Understand the question, then clarify your own conditions and choices.')}")
p.write_bytes(s.encode())
p=Path('assets/customer-ui/js/surfaces/ric-reality-workbench.js');s=p.read_text(encoding='utf-8')
s=s.replace("t('回到自己的问题','Bring it back to your own question')","t('我的问题','My question')")
s=s.replace('<form id="reality-start">','<details id="current-condition-editor" open><summary>${t("当前情况","Current situation")}</summary><form id="reality-start">')
s=s.replace('</button></form><p id="reality-message"','</button></form></details><p id="reality-message"',1)
s=s.replace("if(!data.available){$('reality-comparison').innerHTML='';return;}","if(!data.available){$('reality-comparison').innerHTML='';$('current-condition-editor').open=true;return;}$('current-condition-editor').open=false;")
s=s.replace("t('比较你提出的方向','Compare your proposed directions')","t('可以比较的方向','Directions to compare')")
s=s.replace("t('你的选择：','Your choice: ')","t('我的选择：','My choice: ')")
s=s.replace("t('后来你实际观察到了什么？','What did you actually observe later?')","t('之后发生什么？','What happened afterwards?')")
p.write_bytes(s.encode())
# Reuse the exact historical ten questions without changing wording or writing old receipts.
p=Path('tools/review/world-reality-value-r1/verify.mjs');s=p.read_text(encoding='utf-8').replace("const out='tools/review/world-reality-value-r1/'", "const out='tools/review/world-answer-quality-r1/'")
Path('tools/review/world-answer-quality-r1/original-ten.mjs').write_bytes(s.encode())
