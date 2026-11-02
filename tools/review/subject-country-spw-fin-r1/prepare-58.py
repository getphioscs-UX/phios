from pathlib import Path
q=Path('C:/phios/tools/review/subject-country-spw-fin-r1');p=q/'runtime/preview-current-original-58.mjs';s=p.read_text(encoding='utf-8').replace('await loadWorldPlaywright().chromium.launch','await (await loadWorldPlaywright()).chromium.launch');p.with_name('correction-original-58.mjs').write_bytes(s.encode())
