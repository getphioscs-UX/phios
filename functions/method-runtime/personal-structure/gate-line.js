/** MIR-3 PHI OS Personal Structure Gate/Line resolver. */
import {LINE_SPAN_DEG, resolveGate} from './gate-wheel.js';
const EPS = 1e-10;
function nearInteger(value) { return Math.abs(value - Math.round(value)) <= EPS; }
export function resolveGateLine(longitude) {
  const gate = resolveGate(longitude);
  const ratio = gate.positionWithinGateDeg / LINE_SPAN_DEG;
  let lineIndexZeroBased = Math.floor(ratio + EPS);
  if (lineIndexZeroBased > 5) lineIndexZeroBased = 5;
  if (lineIndexZeroBased < 0) lineIndexZeroBased = 0;
  const positionWithinLineDeg = gate.positionWithinGateDeg - lineIndexZeroBased * LINE_SPAN_DEG;
  const normalizedWithin = Math.abs(positionWithinLineDeg) <= EPS ? 0 : positionWithinLineDeg;
  return Object.freeze({
    ...gate,
    lineIndexZeroBased,
    line: lineIndexZeroBased + 1,
    positionWithinLineDeg: normalizedWithin,
    positionWithinLineRatio: normalizedWithin / LINE_SPAN_DEG,
    boundaryExact: nearInteger(gate.positionWithinGateDeg / LINE_SPAN_DEG),
    intervalConvention: '[start,end)'
  });
}
