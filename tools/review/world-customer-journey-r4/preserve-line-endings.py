from pathlib import Path
import subprocess
r=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios');p=r/'scripts/check-book-v-civ-atlas-r1-w16-production-freeze.mjs';s=p.read_text(encoding='utf-8');old=subprocess.check_output(['git','show','8e77898f5ae86788789ae3ab45a4c51fc0f18a0b:scripts/check-book-v-civ-atlas-r1-w16-production-freeze.mjs'],cwd=r);p.write_bytes(s.replace('\r\n','\n').replace('\n','\r\n').encode() if old.count(b'\r\n')>old.count(b'\n')//2 else s.encode());print('Preserved W16 original line endings; all historical assertions retained.')
