import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';import {base as prior,opts} from './nav-through10-qa-fixture.mjs';import {NAV_BATCH_03_CONTRACT as contracts} from '../../functions/runtime/navigation/nav-accepted-batch-03-contract.js';import {evaluateAcceptedNavigationThrough15 as evaluate,compareNavigationCapacity,projectAcceptedNavigationThrough15,projectAcceptedNavigationAcademyThrough15} from '../../functions/runtime/navigation/nav-accepted-batch-03-runtime.js';
const base=structuredClone(prior),dimensions=Object.fromEntries(['value','cost','capacity','responsibility','futureOptions','timeFit','realityFit'].map(k=>[k,'CURRENT_SUPPORT']));const models={
 'NAV-11':{type:'CONTINUATION_QUALIFIED',originalBasisRef:'synthetic-original',intendedValue:['income'],dimensions},
 'NAV-12':{type:'CURRENT_COST_STATE',costs:[{costBearer:'qa-owner',sourceRef:'synthetic-current'}]},
 'NAV-13':{type:'DEFAULT_DIRECTION_RETAINED',originalBasisRef:'synthetic-original',currentSupportRefs:['synthetic-current']},
 'NAV-14':{type:'NO_PROPAGATION_ESTABLISHED',links:[],affectedDomains:[]},
 'NAV-15':{type:'CAPACITY_SUFFICIENT_WITH_BUFFER',capacityEntries:[{dimension:'financial',unit:'MYR',required:10000,available:{min:20000,max:25000},usable:true,sourceRef:'synthetic-current',capacityBasis:'OWN_CAPACITY'}]}
};for(const c of contracts)base.assessments[c.moduleId]={decisionVersion:'d1',positionVersion:'p1',checks:Object.fromEntries(c.failClosedConditions.map(k=>[k,false])),inputs:Object.fromEntries(c.requiredInputs.map(k=>[k,[]])),model:{...models[c.moduleId],sourceRefs:['synthetic-current']},items:[{ownerId:base.ownerId,personId:base.personId,decisionObjectId:base.decision.id,relevant:true,sourceRef:'synthetic-current',sourceVersion:'v1',asOf:'2026-10-09',currentness:'CURRENT',evidenceState:'USER_REPORTED',sourceClass:'USER_REPORTED',claim:'Controlled synthetic current condition'}]};

export {base,opts};
