import { MIR7_REGISTRY_BUNDLE } from './mir7-registry-bundle.generated.js';
export function loadInterpretationRegistryV3(key){if(!Object.prototype.hasOwnProperty.call(MIR7_REGISTRY_BUNDLE.registries,key))throw new TypeError(`UNKNOWN_MIR7_REGISTRY:${key}`);return MIR7_REGISTRY_BUNDLE.registries[key];}
export function listInterpretationRegistryKeysV3(){return Object.keys(MIR7_REGISTRY_BUNDLE.registries);}
export function mir7RegistryIntegrity(){return {manifestSha256:MIR7_REGISTRY_BUNDLE.manifestSha256,registryHashes:{...MIR7_REGISTRY_BUNDLE.registryHashes}};}
