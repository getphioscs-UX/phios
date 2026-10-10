import {resolveConsolidationRedirect} from '../public/page-consolidation.js';
export function onRequest(context){return resolveConsolidationRedirect(context)||context.next();}
