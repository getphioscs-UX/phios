import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {base as prior,opts} from './nav-through20-qa-fixture.mjs';import {NAV_BATCH_05_CONTRACT as contracts} from '../../functions/runtime/navigation/nav-accepted-batch-05-contract.js';import {evaluateAcceptedNavigationThrough25 as evaluate,projectAcceptedNavigationThrough25,projectAcceptedNavigationAcademyThrough25} from '../../functions/runtime/navigation/nav-accepted-batch-05-runtime.js';import {internalPublicationFile} from './publication-boundary.mjs';
const base=structuredClone(prior),scope={decisionId:base.decision.id,personId:base.personId,timeHorizon:'one month'},confirmation={explicitConfirmation:true,confirmationRef:'synthetic-confirmation',decisionVersion:'d1',confirmedBy:[base.ownerId]},condition={description:'income continuity',state:'NON_EXCHANGEABLE',authority:'USER_CONFIRMED_NON_NEGOTIABLE',scope,sourceRef:'synthetic-current',threshold:null,...confirmation},scenario={optionId:'option1',timeHorizon:'one month',assumptions:[],unknowns:[],minimumState:'ABOVE_MINIMUM',variableIds:['income']};
const models={
'NAV-21':{type:'NON_EXCHANGEABLE',conditions:[condition]},
'NAV-22':{type:'FUNCTIONAL_MINIMUM',conditions:[{...condition,state:'FUNCTIONAL_MINIMUM'}]},
'NAV-23':{type:'PLAUSIBLE_SCENARIO',scenarios:[scenario],minimumApplied:true,continuationIncluded:true},
'NAV-24':{type:'ABOVE_MINIMUM',scenarios:['BASELINE','UPSIDE','DOWNSIDE'].map(kind=>({...scenario,kind})),baseline:{sourceRef:'synthetic-current'},minimumApplied:true,continuationIncluded:true},
'NAV-25':{type:'EXIT_ROUTE_AVAILABLE_WITH_COST',triggers:[{kind:'STATE',sourceRef:'synthetic-current',...confirmation}],exitRoutes:[{sourceRef:'synthetic-current',dependencies:[]}],recoveryRoutes:[],minimumStateRef:'synthetic-minimum'}
};for(const c of contracts)base.assessments[c.moduleId]={decisionVersion:'d1',positionVersion:'p1',checks:Object.fromEntries(c.failClosedConditions.map(k=>[k,false])),inputs:Object.fromEntries(c.requiredInputs.map(k=>[k,[]])),model:{...models[c.moduleId],sourceRefs:['synthetic-current']},items:structuredClone(base.assessments['NAV-20'].items)};

export {base,opts};
