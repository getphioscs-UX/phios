from pathlib import Path
import json
p=Path('assets/customer-ui/js/surfaces/ric-world-session-panel.js');s=p.read_text(encoding='utf-8')
s=s.replace('<label for="ric-year">','<details><summary>${t("统计问题的时期","Period for statistical questions")}</summary><label for="ric-year">')
s=s.replace('<option>1999</option></select><button id="ric-ask">','<option>1999</option></select></details><button id="ric-ask">')
s=s.replace('</details><section><h2>${t(\'我选取的背景资料\'', '</details><section id="ric-context-selected" hidden><h2>${t(\'我选取的背景资料\'')
s=s.replace('const items=r.workspace.currentReality.evidence;', 'const items=r.workspace.currentReality.evidence;$(\'#ric-context-selected\').hidden=!items.length;')
s=s.replace('查询公开资料并回答','查看回答').replace('Query public evidence and answer','See an answer')
p.write_bytes(s.encode())
p=Path('content/world/local-answer-quality-r1.json');d=json.loads(p.read_text(encoding='utf-8'))
titles={'energy-food':'Energy costs and food prices','resource':'Resource revenues and local development','age':'Population ageing, work and care','infrastructure':'Infrastructure reliability and production','rates':'Interest-rate transmission and mortgage pricing','eligibility':'Mortgage eligibility and credit costs'}
for key,title in titles.items():d['sources'][key]['title']=title
d['version']='WORLD-ANSWER-QUALITY-R1-LOCAL-2'
p.write_bytes(json.dumps(d,ensure_ascii=False,indent=2).encode())
