export const MIR4_VISUAL_ANGLE_TRANSFORM_VERSION='MIR-4-VISUAL-ANGLE-TRANSFORM-v1.0.0';
function normalize360(x){const n=Number(x);if(!Number.isFinite(n))throw new TypeError('MIR4_FINITE_PROJECTION_ANGLE_REQUIRED');return ((n%360)+360)%360;}
export function projectionAngleToScreenTransform(projectionAngleDeg){
  return Object.freeze({projectionAngleDeg:normalize360(projectionAngleDeg),screenRotationDeg:normalize360(projectionAngleDeg-90),transformVersion:MIR4_VISUAL_ANGLE_TRANSFORM_VERSION});
}
