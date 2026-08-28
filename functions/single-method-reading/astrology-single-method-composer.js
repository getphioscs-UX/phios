import {composeMethodSections} from './method-composer-base.js';

export function composeAstrologySingleMethodReading(input={}){
  return composeMethodSections({...input,methodId:'AST',formula:'planet function × sign expression × actual house × aspects × whole-chart priority',coverageMatchers:{planetFunction:['#POSITION:'],actualHouse:['#HOUSE_SYSTEM:','HOUSE_'],aspects:['#ASPECT:'],wholeChartPriority:['SHARED_PROJECTION_NETWORK','PRIMARY']}});
}

