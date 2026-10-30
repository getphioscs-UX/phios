from pathlib import Path
import json,sys,hashlib
D=Path(__file__).parent;sys.path.insert(0,str(D.parent.resolve()));from audit import inspect_pdf
from optimize import optimize
sys.path.insert(0,str(Path('scripts/lib').resolve()));from disk_space_guard import require_disk_space,reserve_render_slot
require_disk_space('One accepted-author ECR Q87 successor',800_000_000);release=reserve_render_slot('ECR accepted author Q87 single candidate')
try:
 binding=json.loads((D/'ECR-SOURCE-BINDING.json').read_text(encoding='utf-8'));source=Path(binding['originalPDF']['path']);assert hashlib.sha256(source.read_bytes()).hexdigest()==binding['originalPDF']['sha256'];report=inspect_pdf(source,'ECR-accepted-author-r33','ECR','Exact accepted local owner-case publication, not engineering fixture or commercial admission');target=Path('.tmp/r2-background-ecr-publication-repair/private/ECR-AUTHOR-REPORT-Q87.pdf');assert not target.exists();row=optimize(report,87,output_path=target);assert row['passStructural'];(D/'ECR-Q87-REGRESSION.json').write_text(json.dumps(row,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({'pages':row['pageCount'],'bytes':row['optimizedBytes'],'sourceBytes':row['originalBytes'],'allStructuralChecks':row['passStructural'],'customerPublishable':False}),flush=True)
finally:release()
