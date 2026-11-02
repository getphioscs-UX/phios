from pathlib import Path
p=Path('C:/phios/tools/review/subject-country-spw-fin-r1/browser-journeys.mjs');s=p.read_text(encoding='utf-8').replace("'[data-cp-dim='+d+']'","'[data-cp-wheel] [data-prf-lens='+d+']'").replace("'[data-cp-dim=","'[data-cp-wheel] [data-prf-lens=")
p.with_name('browser-journeys-correction.mjs').write_bytes(s.encode())
