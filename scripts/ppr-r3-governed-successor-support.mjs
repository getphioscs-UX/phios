import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export const PPR_R3_FREEZE_PATH='content/professional/personal-reality/r3/authority/ppr-r3-w10-successor-freeze-v1.json';
export const PPR_R3_AST_INPUT_SUCCESSOR_PATH='content/professional/personal-reality/r3/authority/ppr-r3-w10a-ast-target-context-shared-input-successor-v1.json';
const ECR_SUCCESSOR_PATH='content/embodied-configuration/ecr-customer-mandala-authority-audit-v1.json';

export const PPR_R3_FREEZE=json(PPR_R3_FREEZE_PATH);
export const PPR_R3_AST_INPUT_SUCCESSOR=json(PPR_R3_AST_INPUT_SUCCESSOR_PATH);
const ECR_SUCCESSOR=fs.existsSync(ECR_SUCCESSOR_PATH)?json(ECR_SUCCESSOR_PATH):null;

function retiredRecord(path){return ECR_SUCCESSOR?.baselineRetiredFiles?.[path]||null;}
function ecrSuccessor(path){return ECR_SUCCESSOR?.protectedSuccessors?.[path]||null;}
function astSuccessor(path){return PPR_R3_AST_INPUT_SUCCESSOR?.authorizedFiles?.[path]||null;}

export function assertPprR3GovernedPath(path,predecessorSha256,label='PPR-R3 governed path'){
  if(!fs.existsSync(path)){
    const retired=retiredRecord(path);
    assert(retired,`${label} missing without governed retirement: ${path}`);
    assert.equal(retired.state,'ABSENT_ON_BASELINE',`${label} retirement state mismatch: ${path}`);
    assert.equal(retired.baselineFactOnly,true,`${label} retirement must remain baseline fact: ${path}`);
    assert.equal(retired.createsRetirementAuthority,false,`${label} retirement must not create authority: ${path}`);
    return 'RETIRED_ON_BASELINE';
  }
  const current=sha(path);
  if(current===predecessorSha256)return 'PREDECESSOR_CURRENT';
  const ecr=ecrSuccessor(path);
  if(ecr&&ecr.predecessorSha256===predecessorSha256&&ecr.successorSha256===current)return 'ECR_SUCCESSOR_CURRENT';
  const ast=astSuccessor(path);
  if(ast&&ast.successorSha256===current){
    const allowedPredecessors=new Set([predecessorSha256,ecr?.successorSha256].filter(Boolean));
    assert(allowedPredecessors.has(ast.predecessorSha256),`${label} AST successor predecessor mismatch: ${path}`);
    assert.equal(ast.createsMeaning,false,`${label} AST successor may not create meaning: ${path}`);
    assert.equal(ast.createsCalculation,false,`${label} AST successor may not create calculation: ${path}`);
    assert.equal(ast.createsProjection,false,`${label} AST successor may not create projection: ${path}`);
    assert.equal(ast.createsCurrentReality,false,`${label} AST successor may not create Current Reality: ${path}`);
    return 'AST_TARGET_CONTEXT_SUCCESSOR_CURRENT';
  }
  assert.fail(`${label} drift without governed successor: ${path}`);
}

export function assertPprR3AstInputSuccessorIntegrity(){
  const s=PPR_R3_AST_INPUT_SUCCESSOR;
  assert.equal(s.status,'AUTHORIZED_SHARED_INPUT_SUCCESSOR_IMPLEMENTED');
  assert.equal(s.predecessorFreeze,PPR_R3_FREEZE_PATH);
  assert.equal(s.boundaries.historicalFreezeRecordRewritten,false);
  assert.equal(s.boundaries.newAstCalculator,false);
  assert.equal(s.boundaries.newTransitCalculator,false);
  assert.equal(s.boundaries.browserClockInference,false);
  assert.equal(s.boundaries.serverClockInference,false);
  for(const [path,record] of Object.entries(s.authorizedFiles||{})){
    assert.equal(fs.existsSync(path),true,`PPR-R3 W10A authorized file missing: ${path}`);
    assert.equal(sha(path),record.successorSha256,`PPR-R3 W10A successor digest drift: ${path}`);
  }
  return true;
}
