import crypto from 'node:crypto';
import {createHdrInternalValidationReportRuntime} from '../professional/hdr-internal/hdr-internal-validation-report-runtime.js';

export const HDR_INTAKE_CALCULATION_REFERENCE_VERSION='PHI-OS-HDR-INTAKE-CALCULATION-REFERENCE-v1.0.0';
export const HDR_INTAKE_CALCULATION_SOURCE='PHIOS_HDR_INTERNAL_CALCULATION_REFERENCE';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const title=value=>String(value??'').toLowerCase().replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase());
const sectionMap=report=>new Map((report?.sections||[]).map(section=>[section.sectionCode,section.content]));
const candidate=(field,normalizedValue,region)=>freeze({
  field,
  rawValue:normalizedValue,
  normalizedValue,
  sourceType:HDR_INTAKE_CALCULATION_SOURCE,
  sourceRegion:`HDR_INTAKE_CALCULATION:${region||field}`,
  extractionConfidence:'DETERMINISTIC_CALCULATION_REFERENCE',
  extractionRule:'HDR_INTERNAL_BIRTH_DATA_REFERENCE',
  customerConfirmed:false,
  phiosCalculated:true
});

function readableType(code){const map={GENERATOR:'Generator',MANIFESTING_GENERATOR:'Manifesting Generator',MANIFESTOR:'Manifestor',PROJECTOR:'Projector',REFLECTOR:'Reflector'};return map[code]||title(code)}
function readableAuthority(code){const map={EMOTIONAL:'Emotional',SACRAL:'Sacral',SPLENIC:'Splenic',SELF_PROJECTED:'Self Projected',EGO_MANIFESTED:'Ego Manifested',EGO_PROJECTED:'Ego Projected',MENTAL_ENVIRONMENTAL:'Mental / Environmental',LUNAR:'Lunar'};return map[code]||title(code)}
function readableDefinition(value){const code=value?.definitionCode||value?.code||value;if(!code)return null;return title(code)}
function readableProfile(value){return value?.profileCode||value?.code||value||null}
function activationsFromSection(value){return (value?.activations||[]).map(item=>freeze({layer:item.layer,bodyCode:item.bodyCode||null,gateLine:Number.isInteger(item.gate)&&Number.isInteger(item.line)?`${item.gate}.${item.line}`:null})).filter(item=>item.layer&&item.gateLine)}

export async function buildHdrIntakeCalculationReference({canonicalBirthInput,requestId=`HDR-INTAKE-${crypto.randomUUID()}`,runtimeFactory=createHdrInternalValidationReportRuntime,generatedAt=new Date().toISOString()}={}){
  if(!canonicalBirthInput||typeof canonicalBirthInput!=='object')throw new TypeError('HDR_INTAKE_CANONICAL_BIRTH_INPUT_REQUIRED');
  const runtime=runtimeFactory();
  const report=await runtime.generate({
    requestId,
    reportId:`${requestId}:REFERENCE`,
    generatedAt,
    canonicalBirthInput:freeze({...canonicalBirthInput,consent:freeze({...canonicalBirthInput.consent,hdrInternalValidation:true})}),
    professionalContext:freeze({professionalId:'PHIOS_HDR_INTAKE_REFERENCE',professionalName:'PHI OS Human Design Intake Reference',clientId:'EPHEMERAL_CUSTOMER',workspaceId:'EPHEMERAL_INTAKE_REFERENCE',consentReference:canonicalBirthInput.consent?.recordId||'EPHEMERAL',workspaceAccessGranted:true,boundaryAcknowledged:true})
  });
  const sections=sectionMap(report),candidates=[];
  const typeCode=sections.get('type')?.typeCode||null;
  const authorityCode=sections.get('authority')?.authorityCode||null;
  const profile=readableProfile(sections.get('profile')?.profile);
  const definition=readableDefinition(sections.get('definition')?.definition);
  const channels=[...(sections.get('channels')?.channels||[])];
  const definedCenters=[...(sections.get('centers')?.definedCenters||[])];
  const openCenters=[...(sections.get('centers')?.undefinedCenters||[])];
  const activations=activationsFromSection(sections.get('key_gates'));
  if(typeCode)candidates.push(candidate('type',readableType(typeCode),'type'));
  if(authorityCode)candidates.push(candidate('authority',readableAuthority(authorityCode),'authority'));
  if(profile)candidates.push(candidate('profile',String(profile),'profile'));
  if(definition)candidates.push(candidate('definition',definition,'definition'));
  if(channels.length)candidates.push(candidate('channels',freeze(channels),'channels'));
  if(definedCenters.length)candidates.push(candidate('definedCenters',freeze(definedCenters),'definedCenters'));
  if(openCenters.length)candidates.push(candidate('openCenters',freeze(openCenters),'openCenters'));
  if(activations.length)candidates.push(candidate('activations',freeze(activations),'activations'));
  const chartOverview=sections.get('chart_overview')||{};
  return freeze({
    schemaVersion:HDR_INTAKE_CALCULATION_REFERENCE_VERSION,
    status:'AVAILABLE',
    sourceType:HDR_INTAKE_CALCULATION_SOURCE,
    candidates:freeze(candidates),
    calculatedBasicFields:freeze(candidates.filter(item=>['type','authority','profile','definition'].includes(item.field)).map(item=>item.field)),
    calculatedStructuralFields:freeze(candidates.filter(item=>['activations','channels','definedCenters','openCenters'].includes(item.field)).map(item=>item.field)),
    incarnationConfiguration:chartOverview?.incarnationConfiguration?.configurationCode||null,
    calculationReference:freeze({runtimeCode:report.runtimeCode||null,runtimeVersion:report.runtimeVersion||null,calculationId:report.calculationReference?.calculationId||null,outputDigest:report.calculationReference?.outputDigest||null}),
    boundary:freeze({
      exactBirthDataRequired:true,
      customerConfirmationRequired:true,
      uploadedChartStillPrimaryWhenRecognized:true,
      reportNotExposed:true,
      officialBodyGraphNotGenerated:true,
      strategySignatureNotSelfNotInvented:true,
      variableOrPhsNotDerived:true,
      meaningCreated:false,
      interpretationCreated:false,
      persisted:false
    })
  });
}

export default Object.freeze({HDR_INTAKE_CALCULATION_REFERENCE_VERSION,HDR_INTAKE_CALCULATION_SOURCE,buildHdrIntakeCalculationReference});
