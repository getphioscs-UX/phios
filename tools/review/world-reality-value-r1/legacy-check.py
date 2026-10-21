from pathlib import Path
s=Path('tools/review/reality-information-contract-r1/L1/integration.test.mjs').read_text(encoding='utf-8').replace("from './server.mjs'", "from '../reality-information-contract-r1/L1/server.mjs'").replace("from '../../../../functions/", "from '../../../functions/")
Path('tools/review/world-reality-value-r1/legacy-local.test.mjs').write_text(s,encoding='utf-8')
