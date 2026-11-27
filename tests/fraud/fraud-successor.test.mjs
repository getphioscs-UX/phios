import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateGlobalFraudR5,globalFraudR5Predecessor} from '../../scripts/lib/global-fraud-r5-source-successor.mjs';
test('R5 version seal rejects current-source or record corruption and preserves finite history',()=>{
 const record=validateGlobalFraudR5();assert.equal(record.rows.length,6);
 for(const row of record.rows){const current=fs.readFileSync(row.path);assert.throws(()=>validateGlobalFraudR5({readCurrent:p=>p===row.path?Buffer.concat([current,Buffer.from(' ')]):fs.readFileSync(p)}));const before=globalFraudR5Predecessor(row.path,current);if(row.beforeSHA256===null)assert.equal(before,null);else assert(before.equals(Buffer.from(row.beforeBytesBase64,'base64')));}
 assert.throws(()=>validateGlobalFraudR5({recordBytes:Buffer.from('{}')}));assert.equal(globalFraudR5Predecessor('unrelated',Buffer.from('same')).toString(),'same');
});
