// Display authority only: astronomical coordinates and Gate order are unchanged.
export const P64_VISUAL_ORIENTATION_CODE = 'PHI-OS-ECR-P64-VISUAL-ORIENTATION-v1';
const normalize360 = value => ((value % 360) + 360) % 360;
export function eclipticLongitudeToP64ScreenAngle(longitude) {
  if (!Number.isFinite(longitude)) throw new TypeError('P64_VISUAL_LONGITUDE_INVALID');
  // Owner's colored reference: tropical 0° is at screen-left (180°).
  // Gate 41's mechanical 302° therefore starts at SVG 238°.
  return normalize360(238 - normalize360(longitude - 302));
}
export function p64VisualSector(startLongitude, endLongitude) {
  const span = normalize360(endLongitude - startLongitude);
  if (!(span > 0 && span < 180)) throw new TypeError('P64_VISUAL_SECTOR_INVALID');
  const mechanicalStartScreen = eclipticLongitudeToP64ScreenAngle(startLongitude);
  // The shared path helper draws clockwise. Reverse geometric endpoints only.
  return {startAngle: mechanicalStartScreen - span, endAngle: mechanicalStartScreen,
    centerAngle: normalize360(mechanicalStartScreen - span / 2)};
}
