import {adaptAstPersonalRealityProduct} from './adapters/ast-production-adapter.js';
import {adaptBaziPersonalRealityProduct} from './adapters/bazi-production-adapter.js';
import {adaptNumerologyPersonalRealityProduct} from './adapters/numerology-production-adapter.js';
import {adaptZiweiPersonalRealityProduct} from './adapters/ziwei-production-adapter.js';
import {adaptEcrPersonalRealityProduct} from './adapters/ecr-production-adapter.js';
export const PERSONAL_REALITY_PRODUCTION_ADAPTERS=Object.freeze({AST:adaptAstPersonalRealityProduct,BZR:adaptBaziPersonalRealityProduct,NUM:adaptNumerologyPersonalRealityProduct,ZWR:adaptZiweiPersonalRealityProduct,ECR:adaptEcrPersonalRealityProduct});
export function getPersonalRealityProductionAdapter(methodId){return PERSONAL_REALITY_PRODUCTION_ADAPTERS[methodId]||null}
export default PERSONAL_REALITY_PRODUCTION_ADAPTERS;
