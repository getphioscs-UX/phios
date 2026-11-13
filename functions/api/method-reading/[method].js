import {onRequestPost as owner} from '../customer-personal-reality.js';
import {scopedMethodReadingR2} from '../../_lib/method-native-request-scope-r2.js';
export const onRequestPost=scopedMethodReadingR2(owner);

export async function onRequestGet(context){const slug=context.params?.method;if(!['bazi','ziwei','astrology','numerology','human-design','phi-configuration'].includes(slug))return Response.json({ok:false,error:'METHOD_ROUTE_INVALID'},{status:404});const mode=context.env?.PHIOS_D1_MAINTENANCE_MODE;return Response.json({ok:true,method:slug,submissionStatus:mode==='OFF'?'OWNER_CHECK_REQUIRED':'TEMPORARILY_UNAVAILABLE'},{headers:{'cache-control':'no-store'}});}
