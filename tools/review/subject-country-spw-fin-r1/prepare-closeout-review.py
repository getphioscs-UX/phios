from pathlib import Path
import json,html
q=Path('C:/phios/tools/review/subject-country-spw-fin-r1');p=q/'CORRECTION-SUPERSEDED-CI-FAILURE.json';v=json.loads(p.read_text());v['status']='FIX_VALIDATED_FINAL_SHA_CI_PASS';p.write_bytes((json.dumps(v,indent=2)+'\n').encode())
p=q/'finalize-correction-review.py';s=p.read_text(encoding='utf-8').replace('Stable browser command: WORLD_REVIEW_URL=&lt;local-or-preview&gt; node','PowerShell: $env:WORLD_REVIEW_URL=&quot;&lt;local-or-preview&gt;&quot;; node');p.write_bytes(s.encode())
