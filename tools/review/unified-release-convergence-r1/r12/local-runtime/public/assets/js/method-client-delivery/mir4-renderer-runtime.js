import {renderCanonicalMethodProjection,renderCrossMethodCanonicalComposition} from './dynamic-renderer-runtime.js';
import {renderPersonalStructureProjection} from './renderers/personal-structure-renderer.js';
export const MIR4_RENDERER_RUNTIME_VERSION='MIR-4-RENDERER-RUNTIME-v1.0.0';
export function renderMir4MethodProjection(canonical,options={}){return renderCanonicalMethodProjection(canonical,options);}
export function renderMir4CrossMethodComposition(composition,options={}){return renderCrossMethodCanonicalComposition(composition,options);}
export function renderMir4PersonalStructureProjection(bundle,options={}){return renderPersonalStructureProjection(bundle,options);}
