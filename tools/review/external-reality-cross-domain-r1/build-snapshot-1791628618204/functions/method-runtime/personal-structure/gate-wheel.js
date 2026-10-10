/** MIR-3 PHI OS Personal Structure canonical Gate wheel helpers. Calculation helper only. */
export const GATE_COUNT = 64;
export const GATE_SPAN_DEG = 5.625;
export const LINE_COUNT = 6;
export const LINE_SPAN_DEG = 0.9375;
export const GATE_WHEEL_ECLIPTIC_OFFSET_DEG = 302.0;
export const GATE_SEQUENCE = Object.freeze([
  41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,
  27,24,2,23,8,20,16,35,45,12,15,52,39,53,62,56,
  31,33,7,4,29,59,40,64,47,6,46,18,48,57,32,50,
  28,44,1,43,14,34,9,5,26,11,10,58,38,54,61,60
]);
export function normalize360(value) {
  if (!Number.isFinite(value)) throw new TypeError('FINITE_ANGLE_REQUIRED');
  const n = ((value % 360) + 360) % 360;
  return Math.abs(n - 360) < 1e-12 ? 0 : n;
}
export function eclipticLongitudeToGateWheelAngle(longitude) {
  return normalize360(longitude - GATE_WHEEL_ECLIPTIC_OFFSET_DEG);
}
export function gateWheelAngleToEclipticLongitude(angle) {
  return normalize360(angle + GATE_WHEEL_ECLIPTIC_OFFSET_DEG);
}
export function resolveGate(longitude) {
  const eclipticLongitude = normalize360(longitude);
  const gateWheelAngle = eclipticLongitudeToGateWheelAngle(eclipticLongitude);
  const rawIndex = Math.floor(gateWheelAngle / GATE_SPAN_DEG);
  const gateIndex = Math.min(GATE_COUNT - 1, Math.max(0, rawIndex));
  const positionWithinGateDeg = gateWheelAngle - gateIndex * GATE_SPAN_DEG;
  return Object.freeze({
    eclipticLongitude,
    gateWheelAngle,
    gateIndex,
    gate: GATE_SEQUENCE[gateIndex],
    positionWithinGateDeg
  });
}
