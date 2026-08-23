export const ASTA_SCOPE_CODE='AST_STRUCTURAL_RUNTIME_V1';
export const ASTA_HOUSE_SYSTEM_CODE='WHOLE_SIGN_V1';
export const ASTA_ANGLE_POLICY_CODE='PHI_OS_AST_ANGLES_MEEUS_V1';
export const ASTA_NODE_POLICY_CODE='PHI_OS_AST_TRUE_NODE_V1';
export const ASTA_ASPECT_SET_CODE='MAJOR_ASPECTS_V1';
export const ASTA_ASPECT_POLICY_CODE='PHI_OS_AST_MAJOR_ASPECT_ORB_V1';
export const ASTA_PRECISION_POLICY_CODE='PHI_OS_AST_DECIMAL_12_V1';
export const ASTA_ZODIAC_POLICY_CODE='PHI_OS_AST_TROPICAL_ZODIAC_V1';
export const ASTA_CORE_BODY_CODES=Object.freeze(['SUN','MOON','MERCURY','VENUS','MARS','JUPITER','SATURN','URANUS','NEPTUNE','PLUTO']);
export const ASTA_NODE_CODES=Object.freeze(['NORTH_NODE','SOUTH_NODE']);
export const ASTA_ASPECT_POLICY=Object.freeze([
  Object.freeze({aspectCode:'CONJUNCTION',angleDegrees:0,orbDegrees:8,priority:0}),
  Object.freeze({aspectCode:'OPPOSITION',angleDegrees:180,orbDegrees:8,priority:1}),
  Object.freeze({aspectCode:'TRINE',angleDegrees:120,orbDegrees:6,priority:2}),
  Object.freeze({aspectCode:'SQUARE',angleDegrees:90,orbDegrees:6,priority:3}),
  Object.freeze({aspectCode:'SEXTILE',angleDegrees:60,orbDegrees:4,priority:4})
]);
