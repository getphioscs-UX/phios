import assert from 'node:assert/strict';import fs from 'node:fs';import {P,ids,read,sha,specPath,sourcePath,manifestPath,svgPath,pngPath,webpPath,carPath,renderSvg,geometryFingerprint,layout} from './figure-lib.mjs';
export {assert,fs,P,ids,read,sha,specPath,sourcePath,manifestPath,svgPath,pngPath,webpPath,carPath,renderSvg,geometryFingerprint,layout};
export const registry=()=>read(P.reg);export const style=()=>read(P.style);export function all(){return ids().map(id=>({id,e:registry().entries.find(x=>x.figureId===id),spec:read(specPath(id)),sb:read(sourcePath(id))}));}
export function rectOverlap(a,b){return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;}
export function pointInsideRect(x,y,r){return x>r.x&&x<r.x+r.width&&y>r.y&&y<r.y+r.height;}
