import {composeMethodSections} from './method-composer-base.js';

export function composeZiWeiSingleMethodReading(input={}){
  return composeMethodSections({...input,methodId:'ZWR',formula:'palace domain × admitted stars × transformations × life/body × palace network × authorised overlay',coverageMatchers:{palaceDomain:['#PALACE:'],stars:['#STAR:'],transformations:['#TRANSFORMATION:','FOUR-TRANSFORMATION'],lifeBody:['#PALACE:LIFE','#PALACE:BODY'],palaceNetwork:['PALACE-NETWORK'],authorisedOverlay:['OVERLAY','TIMING']}});
}

