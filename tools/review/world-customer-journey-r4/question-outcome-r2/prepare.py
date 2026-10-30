from pathlib import Path
import json,hashlib
r=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios');d=json.loads((r/'content/civilization-atlas/geography/world-selection-geometry-r2.json').read_text(encoding='utf-8'));rows=[{k:g[k]for k in ['id','iso2','name']}for g in d['features']];q=Path('C:/phios/tools/review/world-customer-journey-r4/question-outcome-r2');(q/'countries.json').write_text(json.dumps(rows,ensure_ascii=False),encoding='utf-8')
# Controlled local recording: exclude unrelated autocomplete/private prompts.
p=q/'recording-1s.png'
if p.exists():p.unlink()
v=json.loads((q/'VIDEO-EVIDENCE.json').read_text());v['frames']=[f for f in v['frames']if not f['file'].endswith('recording-1s.png')];v['excludedPrivateAutocompleteFrame']=True;(q/'VIDEO-EVIDENCE.json').write_text(json.dumps(v,indent=2),encoding='utf-8')
