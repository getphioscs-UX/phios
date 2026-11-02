import {composeMethodSections} from './method-composer-base.js';

export function composeBaziSingleMethodReading(input={}){
  return composeMethodSections({...input,methodId:'BZR',formula:'pillar role × stem/branch × day reference × month command/season × admitted relations × authorised timing',coverageMatchers:{pillarRole:['FOUR_PILLARS:'],dayReference:['DAY_STEM','DAY_MASTER'],monthCommand:['MONTH_BRANCH','MONTH_COMMAND'],relations:['PILLAR-DAY-SEASON','RELATION'],authorisedTiming:['TIMING','CYCLE']}});
}

