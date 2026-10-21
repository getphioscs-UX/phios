from pathlib import Path
p=Path('functions/_lib/world-published-explanation.js');s=p.read_text(encoding='utf-8').replace("anchors.includes('older population')&&!/population|人口|老年/i.test(source.text)","anchors.includes('older population')&&!/older|younger|elderly|age structure|人口|老年/i.test(source.text)")
p.write_bytes(s.encode('utf-8'))
