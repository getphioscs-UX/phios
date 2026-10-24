from pathlib import Path
p=Path('assets/customer-ui/js/surfaces/ric-navigation-continuity.js')
s=p.read_text(encoding='utf-8')
anchor=' function render(){const c=data?.case;'
helper=''' function sourceDetail(r){const x=r.source_reference,issue=data.context.sourceIssues?.find(i=>i.id===r.record_id);if(!x)return '';return `<details data-source-detail="${e(r.record_id)}"><summary>${t('来源、解释与重新核对','Source, explanation and reassessment')}</summary><p>${e(x.geography)} · ${e(x.period)} · ${e(x.measurement?.metricId)} · ${e(x.measurement?.value)} ${e(x.measurement?.unit)}</p><p>${t('原始来源版本','Original source version')}: <code>${e(x.sourceVersion)}</code></p><p>${t('转换版本','Transformation version')}: ${e(x.measurement?.transformationVersion)}</p><p>${t('本地核验，非生产准入','Locally validated; not production-admitted')}</p>${x.explanation?`<h4>${t('当时的来源限定说明','The source-bounded explanation')}</h4><p>${e(x.explanation.question)}</p><p>${e(x.explanation.answer)}</p><p>${t('部分回答；个人账单、收入与权重仍待核对。','Partial answer; personal bills, income and spending weights still need checking.')}</p>`:''}<p>${t('保留这条参考的理由','Reason for retaining this reference')}: ${e(x.applicabilityReason)}</p><p>${issue?t('来源已过期或变化，相关理解及旧总结暂不带入；请重新核对。','The source expired or changed. Related understanding and the old checkpoint are withheld pending recheck.'):t('每次恢复核对来源身份及有效期；不是实时重新下载。','Source identity and expiry are checked on resume; this does not mean a live re-download.')}</p><a data-reassess href="/world/?locale=${zh?'zh-Hans':'en'}&r4Geo=${encodeURIComponent(x.measurement?.geographyName||'Malaysia')}&r4Period=latest&r4CaseId=${encodeURIComponent(data.case.case_id)}#world-r4">${t('查看最新已保存观察并重新评估','Review the latest pinned observation and reassess')}</a></details>`;}
'''
assert anchor in s
s=s.replace(anchor,helper+anchor)
old="${r.kind==='EVIDENCE'?`<p><a"
new="${r.kind==='EVIDENCE'?sourceDetail(r)+`<p><a"
assert old in s;s=s.replace(old,new)
s=s.replace("${r.validity!=='ACTIVE'?'disabled':''}>${t('更正','Correct')}","${r.validity!=='ACTIVE'||r.kind==='EVIDENCE'?'disabled':''}>${t('更正','Correct')}")
s=s.replace("SOURCE_RECHECK_REQUIRED:","SOURCE_RECHECK_REQUIRED:") # map added separately below
key="FETCH_FAILED:t('服务暂时无法连接，请重试。','The service is unavailable. Please retry.')"
assert key in s;s=s.replace(key,key+",SOURCE_RECHECK_REQUIRED:t('来源已过期或变化，请重新核对，不能继续确认旧参考。','The source expired or changed. Recheck it before confirming the reference.')")
p.write_text(s,encoding='utf-8')
p=Path('assets/js/pages/civilization-atlas/world-measurement-panel.js');s=p.read_text(encoding='utf-8')
s=s.replace('result=null,seq=0;','result=null,seq=0,explanationId=null;')
s=s.replace('result=null;render();status(', 'result=null;explanationId=null;render();status(')
s=s.replace("state.caseType=x.dataset.case;writeUrl();render();","state.caseType=x.dataset.case;explanationId=null;writeUrl();render();")
s=s.replace('const box=host.querySelector(\'[data-answer]\');box.replaceChildren();','explanationId=x.explanation?.explanationId||null;const box=host.querySelector(\'[data-answer]\');box.replaceChildren();')
s=s.replace("if(state.caseType!=='A')throw Error('NO_MEASUREMENT');const caseId", "if(state.caseType!=='A')throw Error('NO_MEASUREMENT');if(!explanationId)throw Error('EXPLANATION_REQUIRED');const caseId")
s=s.replace('caseId,observationId:o.observationId,expectedVersion:', 'caseId,observationId:o.observationId,explanationId,expectedVersion:')
s=s.replace('select.append(o);}});','select.append(o);}const carried=new URL(location.href).searchParams.get(\'r4CaseId\');if(carried&&x.items.some(r=>r.id===carried))select.value=carried;});')
old="status(e.message==='AUTH_REQUIRED'?"
new="status(e.message==='EXPLANATION_REQUIRED'?t('请先读取这条观察的来源限定说明，再选择保留。','Read the source-bounded explanation before retaining this observation.'):e.message==='AUTH_REQUIRED'?"
assert old in s;s=s.replace(old,new)
s=s.replace('onLocaleChange(()=>render());','onLocaleChange(()=>{explanationId=null;render();});')
p.write_text(s,encoding='utf-8')
print('Updated existing World and Reality consumers; no new product page')
