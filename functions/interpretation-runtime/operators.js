import { loadInterpretationRegistry } from './registry-loader.js';
export function getDerivationOperator(operatorId){ const r=loadInterpretationRegistry('operators'); return r.operators.find(x=>x.operatorId===operatorId) ?? null; }
export function listDerivationOperators(){ return loadInterpretationRegistry('operators').operators; }
