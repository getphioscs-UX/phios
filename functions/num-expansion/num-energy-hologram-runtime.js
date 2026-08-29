import {freezeDeep,reduceSingle} from './num-expansion-rules.js';

export const NUM_ENERGY_HOLOGRAM_SCHEMA='PHI-OS-NUM-ENERGY-HOLOGRAM-v1.0.0';
export const NUM_ENERGY_HOLOGRAM_AUTHORITY='ENERGY_NUMEROLOGY_LEARNING_RECONSTRUCTED_V1';

function parseBirthDate(value){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));
  if(!m)throw new TypeError('NUM_ENERGY_BIRTH_DATE_REQUIRED');
  const year=Number(m[1]),month=Number(m[2]),day=Number(m[3]);
  const dt=new Date(Date.UTC(year,month-1,day));
  if(dt.getUTCFullYear()!==year||dt.getUTCMonth()!==month-1||dt.getUTCDate()!==day)throw new TypeError('NUM_ENERGY_BIRTH_DATE_INVALID');
  const sourceDigits=`${String(day).padStart(2,'0')}${String(month).padStart(2,'0')}${String(year).padStart(4,'0')}`.split('').map(Number);
  return Object.freeze({year,month,day,sourceDigits:Object.freeze(sourceDigits)});
}
function add(a,b){return reduceSingle(Number(a)+Number(b)).reducedValue}
function code(positions,letters){return letters.split('').map(k=>String(positions[k])).join('')}

export function buildNumEnergyHologram({birthDate}={}){
  const parsed=parseBirthDate(birthDate);
  const [A,B,C,D,E,F,G,H]=parsed.sourceDigits;
  const I=add(A,B),J=add(C,D),K=add(E,F),L=add(G,H);
  const M=add(I,J),N=add(K,L),O=add(M,N);
  const Q=add(N,O),P=add(M,O),R=add(Q,P);
  const W=add(J,M),X=add(I,M),S=add(X,W);
  const V=add(K,N),U=add(L,N),T=add(V,U);
  const positions={A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X};
  const canonicalCodes={
    IJM:code(positions,'IJM'),KLN:code(positions,'KLN'),MNO:code(positions,'MNO'),
    JMW:code(positions,'JMW'),IMX:code(positions,'IMX'),XWS:code(positions,'XWS'),
    NOQ:code(positions,'NOQ'),MOP:code(positions,'MOP'),QPR:code(positions,'QPR'),
    KNV:code(positions,'KNV'),LNU:code(positions,'LNU'),VUT:code(positions,'VUT')
  };
  const physicalExterior={
    leftDisplayCode:code(positions,'WXS'),
    leftCanonicalCode:canonicalCodes.XWS,
    topCode:canonicalCodes.QPR,
    rightCode:canonicalCodes.VUT
  };
  const zeroPositions=Object.entries(positions).filter(([,v])=>v===0).map(([k])=>k);
  return freezeDeep({
    schemaVersion:NUM_ENERGY_HOLOGRAM_SCHEMA,schoolAuthorityId:NUM_ENERGY_HOLOGRAM_AUTHORITY,birthDate,
    sourceOrder:'DDMMYYYY',sourceDigits:parsed.sourceDigits,positions,canonicalCodes,physicalExterior,
    mainNumber:O,zeroPositions,zeroPolicy:zeroPositions.length?'PRESERVE_ZERO_AS_STRUCTURAL_VALUE_NO_SEMANTIC_MEANING':'NOT_APPLICABLE',
    deterministic:true,providerUsed:false,aiUsed:false,meaningCreated:false,fortunePredictionCreated:false,
    state:'CALCULATION_AUTHORITY_ACTIVE'
  });
}

export function buildNumEnergyFlowYear({birthDate,targetYear}={}){
  const parsed=parseBirthDate(birthDate);const year=Number(targetYear);
  if(!Number.isInteger(year)||year<1||year>9999)throw new TypeError('NUM_R15_TARGET_YEAR_INVALID');
  const substituted=`${String(year).padStart(4,'0')}-${String(parsed.month).padStart(2,'0')}-${String(parsed.day).padStart(2,'0')}`;
  const triangle=buildNumEnergyHologram({birthDate:substituted});
  return freezeDeep({schemaVersion:'PHI-OS-NUM-R15-ENERGY-FLOW-YEAR-v1.0.0',workCode:'NUM-R15',schoolAuthorityId:NUM_ENERGY_HOLOGRAM_AUTHORITY,
    birthDate,targetYear:year,substitutedDate:substituted,flowYearCode:triangle.canonicalCodes.MNO,flowYearNumber:triangle.positions.O,
    yearPairCode:triangle.canonicalCodes.KLN,triangle,fortunePredictionCreated:false,state:'CALCULATION_AUTHORITY_ACTIVE'});
}

export default Object.freeze({buildNumEnergyHologram,buildNumEnergyFlowYear});
