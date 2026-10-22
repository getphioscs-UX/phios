from pathlib import Path
import json,hashlib
bp=Path('tools/review/knowledge-answer-quality-r1/book-pdf-delivery/BASELINE.json');baseline=json.loads(bp.read_text())
for path in ['functions/api/book-one-checkout.js','functions/api/book-one-product.js']:
 p=Path(path)
 if not any(r['path']==path for r in baseline['files']):baseline['files'].append({'path':path,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'recordedBeforeEdit':True})
bp.write_bytes(json.dumps(baseline,indent=2).encode())
p=Path('functions/api/book-one-checkout.js');s=p.read_bytes().decode();start=s.index('export async function onRequestPost(');end=s.index('export async function onRequest(context)',start)
s=s[:start]+'''// Work-only checkout is retired for new purchases. Existing orders/downloads remain.
export async function onRequestPost() {
  return json({success:false,code:'book_language_version_required',purchaseUrl:'/account#commerce',message:'Choose the Chinese or English full PDF in your account. Each language is RM89.'},409);
}

'''+s[end:];p.write_bytes(s.encode())
p=Path('functions/api/book-one-product.js');s=p.read_bytes().decode().replace('checkoutReady: readiness.checkoutReady,',"checkoutReady: false,\n    purchaseUrl:'/account#commerce',\n    languageVersions:['COM-BOOK-01-ZH','COM-BOOK-01-EN'],")
p.write_bytes(s.encode())
