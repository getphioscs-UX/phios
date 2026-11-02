from pathlib import Path
import json,hashlib,subprocess
r=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios');q=Path('C:/phios/tools/review/subject-country-spw-fin-r1');p=r/'scripts/refresh-world-country-evidence.py';s=p.read_text(encoding='utf-8');token="write_atomic(checked_path(root,STATUS),{'schemaVersion':'WORLD_COUNTRY_REFRESH_STATUS_V1','status':'UPDATING','automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False});"
while token+token in s:s=s.replace(token+token,token)
assert s.count(token)==1;p.write_bytes(s.encode())
p=q/'update-correction-manifest.py';s=p.read_text(encoding='utf-8');begin=s.index("r=Path(");manifest=s.index("p=r/'content/civilization-atlas/maintenance/book-v-subject-country-successor-v23.json'");s=s[:begin]+"r=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios');"+s[manifest:];p.write_bytes(s.encode())
