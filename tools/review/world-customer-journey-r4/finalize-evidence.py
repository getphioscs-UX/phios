from pathlib import Path
import json,datetime,csv
q=Path('C:/phios/tools/review/world-customer-journey-r4');d=json.loads((q/'PHASE-STATUS.json').read_text());
for x in d['rows']:
 if x['phase']==9:x['reason']='Exact fc5c693c Preview42/42 and actual Home14/14 PASS; TL visual acceptance pending; standalone Ask owner differences retained'
 if x['phase']==11:x['reason']='One existing branch and DraftPR14, CI PASS, exact Preview PASS, sole Master updated; TL acceptance PENDING'
(q/'PHASE-STATUS.json').write_text(json.dumps(d,indent=2),encoding='utf-8');r=json.loads((q/'RESULT.json').read_text());r['r2RenderedHistoryImages']=9;r['productionCurrent']=json.loads((q/'PRODUCTION-CURRENT.json').read_text());start=json.loads((q/'PRODUCTION-READ-ONLY-BASELINE.json').read_text());cur=r['productionCurrent'];r['productionProtectionUnchanged']=all(start[k]==cur[k]for k in ['rollbackCommit','environmentFingerprint','d1Fingerprint','r2Fingerprint','productionMode','automaticProductionDeployment']);assert r['productionProtectionUnchanged'];(q/'RESULT.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
with (q/'COMPLETION-MATRIX.csv').open('w',newline='',encoding='utf-8-sig')as f:
 w=csv.DictWriter(f,fieldnames=['capability','Local','Main','Production','Customer','reason']);w.writeheader();w.writerows(r['matrix'])
with (q/'EXECUTION-RECORD.md').open('a',encoding='utf-8')as f:f.write('\nFinal review: exact Preview rendered and decoded nine existing history images including the selected Roman case; actual screenshots inspected. Start/end production identity, READ_ONLY, environment/D1/R2 fingerprints and automatic-deployment-off match. No production write, main merge or active-worktree cleanup. Root main working copy retains only the local Master review edit plus untracked bounded evidence; product source changes are in Draft PR14.\n')
print('Final matrix and unchanged production protections recorded. All R4 human decisions remain PENDING.')
