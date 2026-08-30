import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {assertPprR3GovernedPath,assertPprR3RetiredPath} from '../ppr-r3-governed-successor-support.mjs';

const W21='content/professional/ast-full-production/customer-product-v3/authority/ast-cx-r3-w21-current-shared-baseline-v1.json';
const W24='content/professional/ast-full-production/customer-product-v3/authority/ast-cx-r3-w24-current-shared-baseline-v1.json';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export function assertAstCxR3CurrentSharedBoundary(label='AST-CX-R3'){
  const authority=JSON.parse(fs.readFileSync(fs.existsSync(W24)?W24:W21,'utf8'));
  const allowed=new Set(['CURRENT_SHARED_SUCCESSOR_BASELINE_RECONCILED','CURRENT_MAIN_SHARED_BASELINE_RECONCILED_FOR_W24']);
  assert(allowed.has(authority.status),`${label} unrecognized shared baseline status ${authority.status}`);
  for(const [path,digest] of Object.entries(authority.files||{})){
    if(digest===null){assertPprR3RetiredPath(path,label);continue;}
    assert.equal(fs.existsSync(path),true,`${label} shared path missing: ${path}`);
    if(sha(path)===digest)continue;
    assertPprR3GovernedPath(path,digest,label);
  }
  return authority;
}
export default Object.freeze({assertAstCxR3CurrentSharedBoundary});
