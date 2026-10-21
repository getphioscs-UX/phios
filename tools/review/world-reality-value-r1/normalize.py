from pathlib import Path
import subprocess
root=Path('tools/review/world-reality-value-r1/before')
for before in root.rglob('*'):
 if not before.is_file(): continue
 p=Path(*before.relative_to(root).parts)
 if not p.exists(): continue
 original=subprocess.check_output(['git','show','HEAD:'+p.as_posix()]);current=p.read_bytes().replace(b'\r\n',b'\n')
 p.write_bytes(current.replace(b'\n',b'\r\n') if b'\r\n' in original else current)
