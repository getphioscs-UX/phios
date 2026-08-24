import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHdr2InternalOperatingLensRuntime } from '../functions/professional/hdr2/operating-lens-runtime.js';

const root=process.cwd();
const compatibility=fs.readFileSync(path.join(root,'professional/human-design/index.html'),'utf8');
assert.match(compatibility,/name="robots" content="noindex"/);
assert.match(compatibility,/url=\/professional\/personal-runtime/);
assert.equal(/Human Design|人类图/.test(compatibility),false,'Legacy compatibility route must not display restricted brand text.');
const apiDir=path.join(root,'functions/api');
const publicHdr2Routes=fs.readdirSync(apiDir).filter(name=>/hdr2|operating[-_]?lens/i.test(name));
assert.deepEqual(publicHdr2Routes,[],'HDR2 must not create public API routes.');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'content/professional/method-client-delivery/fixtures/personal-structure-projection.renderer-fixture.v1.json'),'utf8')).bundle;
const result=createHdr2InternalOperatingLensRuntime().execute({accessContext:{authenticatedSubjectId:'INTERNAL-QA',accessClass:'GOVERNED_INTERNAL_QA',authorizationStatus:'ACTIVE',workspaceAccess:true,operatingLensAccess:true,explicitConsent:true,purpose:'INTERNAL_OPERATING_LENS',publicRequest:false,customerSelfService:false},personalStructureProjection:fixture});
assert.equal(/Human Design|人类图|HUMAN_DESIGN/.test(JSON.stringify(result)),false,'Internal Operating result must use PHI OS vocabulary only.');
assert.equal(result.publicExecutionAllowed,false);
assert.equal(result.publicCapabilityAvailability,'RESTRICTED_INTERNAL');
console.log('✓ HDR2 public brand leak gate passed: no new public route, compatibility route stays noindex/generic, internal result uses PHI OS vocabulary only.');
