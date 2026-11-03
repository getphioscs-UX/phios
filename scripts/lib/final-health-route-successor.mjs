import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
export const HEALTH_VISUAL_PATH='assets/customer-ui/js/surfaces/journey-method-visual-r1.js';
export const HEALTH_VISUAL_OWNER_SHA='de16b2413c2dc2c73db0a54f4c0f6ab05a2a81a4819662d51e5f04d7103d3d81';
export const HEALTH_OLD_GUARD="if(location.pathname!=='/health-reality.html')return;";
export const HEALTH_CURRENT_GUARD="if(!['/health-reality','/health-reality/','/health-reality.html'].includes(location.pathname))return;";
export function healthVisualOwnerBytes(bytes){
 const hash=b=>createHash('sha256').update(b).digest('hex');if(hash(bytes)===HEALTH_VISUAL_OWNER_SHA)return bytes;
 const current=bytes.toString('utf8');assert.equal(current.split(HEALTH_CURRENT_GUARD).length,2,'Exactly one registered Health route guard required');assert(!current.includes(HEALTH_OLD_GUARD));const restored=Buffer.from(current.replace(HEALTH_CURRENT_GUARD,HEALTH_OLD_GUARD));assert.equal(hash(restored),HEALTH_VISUAL_OWNER_SHA,'No R6 visual, input, consent or other behavior may change with this route fix');return restored;
}
export function r6VisualOwnerBytes(file){const bytes=fs.readFileSync(file);return file===HEALTH_VISUAL_PATH?healthVisualOwnerBytes(bytes):bytes;}
