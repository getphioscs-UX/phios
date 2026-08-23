import assert from 'node:assert/strict';import fs from 'node:fs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));const t=p=>fs.readFileSync(p,'utf8');
const current=j('content/governance/production-capability-matrix/reconciliation/production-capability-current-successor-v5.json');const reg=j(current.currentRegistry);const status=new Map(reg.capabilities.map(x=>[x.methodRuntime.pluginCode,x.capabilityAvailability]));
for(const code of ['AST','BZR','NUM'])assert.equal(status.get(code),'AVAILABLE');for(const code of ['HDR'])assert.equal(status.get(code),'BLOCKED');for(const code of ['ICH','TAR'])assert.notEqual(status.get(code),'AVAILABLE');
const surfaces=[['AST','assets/js/pages/ast-production-meaning.js'],['BZR','assets/js/pages/bzr-production-meaning.js'],['NUM','assets/js/pages/num-production-meaning.js']];for(const [code,p] of surfaces){const s=t(p);assert(/Available/.test(s),`${code} visible available label`);assert.equal(status.get(code),'AVAILABLE',`${code} frontend label must be backed by PCM`);}
const account=t('assets/js/pages/account-method-status.js');assert(account.includes('production-capability-status-projection-v5.json'));assert(!/localStorage|sessionStorage|indexedDB/.test(account));
console.log('✓ No-fake Method availability gate passed.');
