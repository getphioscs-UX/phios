from pathlib import Path
import subprocess
paths=['assets/js/pages/civilization-atlas/world-experience-r2.js','assets/js/pages/civilization-atlas/world-customer-answer.js','functions/_lib/world-published-explanation.js','functions/customer-projection/ric-world-session.js','assets/customer-ui/js/surfaces/ric-world-session-panel.js','assets/customer-ui/js/surfaces/ric-reality-workbench.js','tools/review/reality-information-contract-r1/L1/server.mjs']
for name in paths:
 p=Path(name);original=subprocess.check_output(['git','show','HEAD:'+name]);b=p.read_bytes().replace(bytes([13,10]),bytes([10]));p.write_bytes(b.replace(bytes([10]),bytes([13,10])) if bytes([13,10]) in original else b)
