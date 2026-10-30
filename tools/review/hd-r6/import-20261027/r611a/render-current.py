"""R611A isolated configuration of the existing R611 export owner. No new renderer."""
from pathlib import Path
import subprocess,sys,ast,os,importlib.util
D=Path(__file__).parent
check=subprocess.run(['node','--import','./scripts/lib/pages-json-import-preload.mjs',str(D/'prepare-current.mjs')],check=False)
if check.returncode:sys.exit(check.returncode)
if '--preflight-only' in sys.argv:sys.exit(0)
# The normal owner retains its existing render mutex and per-batch disk guard.
# Guard the small immutable input copy before configuring that owner.
spec=importlib.util.spec_from_file_location('disk_guard','scripts/lib/disk_space_guard.py');guard=importlib.util.module_from_spec(spec);spec.loader.exec_module(guard)
guard.require_disk_space('R611A immutable input preparation',15_000_000)
contract=next((D/'../r611/input').rglob('HD-TOC-CONTRACT.json'))
(D/'input').mkdir(exist_ok=True);target=D/'input/HD-TOC-CONTRACT.json'
if target.exists():assert target.read_bytes()==contract.read_bytes()
else:target.write_bytes(contract.read_bytes())
source=(D/'../r611/render.py').read_text(encoding='utf-8-sig')
source=source.replace('hd-r611','hd-r611a').replace('/r611','/r611a').replace('R611','R611A').replace('R6.11','R6.11A')
# Content selection, calculations, 17 posters and original manuscripts stay owned
# by the existing adapter. New current front plans are read only from D.
exec(compile(source,'R611-existing-owner-configured-for-R611A','exec'),{'__name__':'__main__','__file__':str(D/'render-current.py')})

