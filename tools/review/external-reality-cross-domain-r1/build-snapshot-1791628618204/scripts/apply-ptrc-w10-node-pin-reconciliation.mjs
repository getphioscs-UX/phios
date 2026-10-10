import fs from 'node:fs';
import assert from 'node:assert/strict';

const file='scripts/check-ptrc-w10-consolidation.mjs';
let source=fs.readFileSync(file,'utf8').replace(/\r\n?/g,'\n');

const oldLine=`assert.equal(fs.readFileSync('.node-version', 'utf8').trim(), '24.18.0');`;
const already=`const nodePin = json('content/production-truth/consolidation/ptrc-w10-node-runtime-pin-successor-v1.json');`;

if(!source.includes(already)){
  assert.ok(source.includes(oldLine),'PATCH_CONTEXT_MISMATCH:PTRC-W10 node pin assertion');
  source=source.replace(
    oldLine,
`const nodePin = json('content/production-truth/consolidation/ptrc-w10-node-runtime-pin-successor-v1.json');
assert.equal(nodePin.status, 'ACTIVE_NODE_PIN_RECONCILIATION');
assert.equal(fs.readFileSync('.node-version', 'utf8').trim(), nodePin.currentNodeVersion);
assert.equal(nodePin.currentNodeVersion, '22.16.0');`
  );
}

const workflowAnchor=`const workflow = fs.readFileSync('.github/workflows/ptrc-validation.yml', 'utf8');`;
if(!source.includes(`assert.ok(workflow.includes('node-version-file: .node-version'));`)){
  assert.ok(source.includes(workflowAnchor),'PATCH_CONTEXT_MISMATCH:PTRC-W10 workflow anchor');
  source=source.replace(
    workflowAnchor,
    workflowAnchor + `\nassert.ok(workflow.includes('node-version-file: .node-version'));`
  );
}

fs.writeFileSync(file,source);
console.log('Applied PTRC-W10 governed Node pin reconciliation: .node-version = 22.16.0.');
