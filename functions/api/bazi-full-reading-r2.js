import {buildBaziFullReading} from './bazi-full-reading.js';
import {buildCanonicalBaziChartIR} from '../bzr-full-production/bazi-chart-runtime.js';
import {analyzeBaziStrengthSeasonal} from '../bzr-full-production/bazi-strength-seasonal-runtime.js';
import {analyzeBaziRelationships} from '../bzr-full-production/bazi-relationship-runtime.js';
import {analyzeBaziTenGods} from '../bzr-full-production/bazi-ten-god-runtime.js';
import {analyzeBaziPatternCandidates} from '../bzr-full-production/bazi-pattern-runtime.js';
import {analyzeBaziFinalStructuralVerdictR2} from '../bzr-full-production/bazi-final-structural-verdict-r2.js';

export const BAZI_FULL_READING_R2_SCHEMA='PHI-OS-BAZI-FULL-READING-R2-v1.0.0';

export async function buildBaziFullReadingR2(body){
  const legacy=await buildBaziFullReading(body);
  const chart=await buildCanonicalBaziChartIR({canonicalProjection:body.canonicalProjection});
  const strengthSeasonal=await analyzeBaziStrengthSeasonal({chart});
  const relationships=await analyzeBaziRelationships({chart});
  const tenGods=await analyzeBaziTenGods({chart});
  const patterns=await analyzeBaziPatternCandidates({chart,tenGods,relationships});
  const finalStructuralVerdict=await analyzeBaziFinalStructuralVerdictR2({chart,relationships,strengthSeasonal,patterns});
  return Object.freeze({
    schemaVersion:BAZI_FULL_READING_R2_SCHEMA,
    predecessor:'PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0',
    readingIR:legacy.readingIR,
    legacyReport:legacy.report,
    legacyPublicationDecision:legacy.publicationDecision,
    finalStructuralVerdict,
    reportProAuthority:Object.freeze({
      authorityVersion:BAZI_FULL_READING_R2_SCHEMA,
      finalStructuralVerdictDigest:finalStructuralVerdict.verdictDigest,
      primaryPattern:finalStructuralVerdict.pattern,
      dayMasterStrength:finalStructuralVerdict.strength,
      usefulGod:finalStructuralVerdict.usefulGod,
      relationshipVerdicts:finalStructuralVerdict.relationshipVerdicts,
      customerComposer:'REPORT-PRO-COMPOSER-R1',
      deterministicLegacyProseIsNotSuccessorAuthority:true
    })
  });
}

const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
export async function onRequestPost({request}){
  try{
    const body=await request.json();
    const result=await buildBaziFullReadingR2(body);
    return new Response(JSON.stringify({ok:true,...result}),{status:200,headers});
  }catch(error){
    return new Response(JSON.stringify({ok:false,error:error?.code||'BAZI_FULL_READING_R2_FAILED'}),{status:error?.status||422,headers});
  }
}
export async function onRequestGet(){
  return new Response(JSON.stringify({ok:false,error:'POST_ONLY'}),{status:405,headers});
}
export default Object.freeze({buildBaziFullReadingR2});
