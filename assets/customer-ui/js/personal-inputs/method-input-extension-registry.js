import * as baziInputExtension from '../specialists/bazi/input-extension.js';

export const PPR_R4_METHOD_INPUT_REGISTRY_VERSION='PPR-R4-METHOD-INPUT-REGISTRY-v1.0.0';
const REGISTRY=Object.freeze({
  bazi:Object.freeze({methodKey:'bazi',methodId:'BZR',extensionId:'PPR_R4_BAZI_INPUT_EXTENSION_V1',module:baziInputExtension})
});
export function methodInputExtension(methodKey){return REGISTRY[String(methodKey||'')]||null}
export function registeredMethodInputExtensions(){return Object.freeze(Object.values(REGISTRY).map(({module,...entry})=>Object.freeze({...entry})))}
export default Object.freeze({PPR_R4_METHOD_INPUT_REGISTRY_VERSION,methodInputExtension,registeredMethodInputExtensions});
