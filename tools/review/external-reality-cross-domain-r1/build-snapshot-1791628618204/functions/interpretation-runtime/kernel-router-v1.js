import * as d from './domain-derivers-v1.js';
const ROUTES=Object.freeze({
 grammar:{activeQuestion:d.deriveActiveQuestion,capability:d.deriveCapabilityState,driverPriority:d.rankDrivers},
 runtime:{coordinate:d.buildCoordinate,motion:d.selectMotionCandidate,state:d.buildRealityState,feedback:d.deriveFeedbackContext},
 conscious:{experience:d.deriveExperienceContext},expression:{expression:d.deriveExpressionContext},agency:{agency:d.deriveAgencyContext},identity:{identity:d.deriveIdentityContext}
});
export function routeInterpretation(route,operation,...args){const fn=ROUTES[route]?.[operation];if(!fn)throw new Error(`UNKNOWN_INTERPRETATION_ROUTE:${route}:${operation}`);return fn(...args);}export function interpretationRoutes(){return Object.keys(ROUTES);}
