import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const AUTHORITY_PATH='content/professional/ast-full-production/customer-product-v3/authority/ast-cx-r3-w21-current-shared-baseline-v1.json';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export function assertAstCxR3CurrentSharedBoundary(label='AST-CX-R3'){
  const authority=JSON.parse(fs.readFileSync(AUTHORITY_PATH,'utf8'));
  assert.equal(authority.status,'CURRENT_SHARED_SUCCESSOR_BASELINE_RECONCILED');
  for(const [path,digest] of Object.entries(authority.files||{})){
    if(digest===null){assert.equal(fs.existsSync(path),false,`${label} retired shared path unexpectedly restored: ${path}`);continue}
    assert.equal(fs.existsSync(path),true,`${label} shared path missing: ${path}`);
    assert.equal(sha(path),digest,`${label} shared baseline drift: ${path}`);
  }
  return authority;
}
export default Object.freeze({assertAstCxR3CurrentSharedBoundary});
