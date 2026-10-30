from pathlib import Path
import json,hashlib
r=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios');p=r/'assets/css/world-experience-r2.css';s=p.read_text(encoding='utf-8');s=s[:s.index('/* Keep approved dark diagrams')];s+='''\n/* Keep approved dark diagrams readable inside the light World presentation. */
.world-r1.world-ux-r3 .world-r2{--wr-ink:#143447;--wr-gold:#6d5526}
.world-r1.world-ux-r3 .world-r2 :is(.mapbox,.mapaside,.storystrip,.note,.bookcard,.asset-placeholder,.asset-status,.figdetail,.model-detail,.searchresults,.privacybox,.dialoghead,.toast,.comparison-table th){--bg:#081921;--wr-ink:#f1eee4;--wr-gold:#dfbd7d;--ink:#f1eee4;--muted:#c5d5d8;--gold:#dfbd7d;--panel:#163944;--panel2:#214853;color:var(--ink)}
.world-r1.world-ux-r3 .world-r2 :is(.mapaside,.storystrip,.figdetail,.model-detail,.searchresults,.privacybox) button{color:#143447;background:#fffdfa}
.world-r1.world-ux-r3 .world-r2 .maptoolbar button{color:#f1eee4}
''';p.write_bytes(s.encode());p=r/'content/civilization-atlas/maintenance/book-v-world-customer-journey-successor-v20.json';d=json.loads(p.read_text(encoding='utf-8'))
for c in d['changes']:c['successorSha256']=hashlib.sha256((r/c['path']).read_bytes()).hexdigest()
p.write_bytes((json.dumps(d,indent=2,ensure_ascii=False)+'\n').encode());print('Scoped native light/dark text variables; no map, image, content or calculations changed.')
