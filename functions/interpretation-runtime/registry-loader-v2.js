import { loadInterpretationRegistry as loadV1Registry } from './registry-loader.js';
import { MIR6_REGISTRY_BUNDLE } from './mir6-registry-bundle.generated.js';
export function loadInterpretationRegistryV2(key){
  if(Object.prototype.hasOwnProperty.call(MIR6_REGISTRY_BUNDLE.registries,key)) return MIR6_REGISTRY_BUNDLE.registries[key];
  return loadV1Registry(key);
}
export function listInterpretationRegistryKeysV2(){ return [...new Set([...Object.keys(MIR6_REGISTRY_BUNDLE.registries)])]; }
export function mir6RegistryIntegrity(){ return {manifestSha256:MIR6_REGISTRY_BUNDLE.manifestSha256,registryHashes:{...MIR6_REGISTRY_BUNDLE.registryHashes}}; }
