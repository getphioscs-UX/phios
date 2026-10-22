from pathlib import Path
p=Path('functions/customer-projection/ric-world-session.js');s=p.read_text(encoding='utf-8').replace("claimId:version+':published:'+i,statement:p.text,language:locale", "claimId:version+':published:'+i,statement:p.text,language:p.language||locale")
p.write_bytes(s.encode())
p=Path('tools/review/world-answer-quality-r1/browser.mjs');s=p.read_text(encoding='utf-8').replace("assert.equal(selected.sources[0].language,'en');", "assert.equal(selected.sources[0].language,'en');assert.equal(selected.claim.language,'en');")
p.write_bytes(s.encode())
