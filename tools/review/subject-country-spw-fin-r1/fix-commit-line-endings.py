from pathlib import Path
p=Path('C:/phios/tools/review/subject-country-spw-fin-r1/commit-correction.py');s=p.read_text(encoding='utf-8');s=s.replace("subprocess.run(['git','add','--',*paths]", """for rel in paths:
 p=r/rel
 if p.suffix in ['.js','.mjs','.py','.json','.css','.md','.log'] and p.exists():p.write_bytes(p.read_bytes().replace(b'\\r\\n',b'\\n'))
subprocess.run(['C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',str(q/'update-correction-manifest.py')],check=True)
subprocess.run(['git','add','--',*paths]""");p.write_bytes(s.encode())
