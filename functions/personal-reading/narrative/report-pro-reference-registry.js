export const REPORT_PRO_REFERENCE_REGISTRY_VERSION='PHI-OS-REPORT-PRO-REFERENCE-REGISTRY-v1.0.0';

const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};

export const REPORT_PRO_REFERENCES=freeze({
 BZR:{
  schemaVersion:'PHI-OS-REPORT-PRO-REFERENCE-v1.0.0',
  referenceId:'BAZI-EDITORIAL-REFERENCE-R2',
  methodId:'BZR',
  accepted:true,
  sourceRef:'docs/acceptance/bazi-paid-report/editorial/GEN-01-S01-HUMAN-ACCEPTED.md',
  qualityContract:{
   artifactType:'PERSONAL_PAID_REPORT_SECTION',
   voice:'PERSONAL_PROFESSIONAL',
   essayStyleForbidden:true,
   methodologyMemoForbidden:true,
   customerVisibleProfessionalNote:false,
   sectionIsolation:true,
   technicalGroundingRequired:true,
   genericAdviceCeiling:'LOW',
   repeatedBoundaryLanguageForbidden:true,
   subjectSpecificReferenceCopyForbidden:true
  },
  sectionOwnership:{rule:'Each section owns one primary customer question; later domains must not be pre-consumed.'},
  editorialExemplar:[
   'Directly interpret the customer chart rather than explaining the reporting process.',
   'Use technical BaZi terms as grounding, then translate them into the section’s lived meaning.',
   'Keep paragraphs substantial but section-sized; do not turn one section into a standalone essay.',
   'Avoid repeating career, wealth, relationship or timing material inside personality/capability sections.',
   'Do not append a customer-visible professional note.'
  ]
 },
 ZWR:{
  schemaVersion:'PHI-OS-REPORT-PRO-REFERENCE-v1.0.0',
  referenceId:'ZWR-PRO-GOLD-STANDARD-W0-v1',
  methodId:'ZWR',
  accepted:true,
  sourceRef:'content/professional/ziwei-pro/w0-gold-standard-reference-freeze-v1.json',
  qualityContract:{
   artifactType:'PERSONAL_PAID_REPORT_SECTION',
   voice:'PERSONAL_PROFESSIONAL',
   starDictionaryForbidden:true,
   methodologyMemoForbidden:true,
   sectionIsolation:true,
   palaceNetworkSynthesisRequired:true,
   timingLayersDistinct:true,
   customerVisibleGovernanceJargon:false,
   contentDepthRequired:true,
   customerVoiceRequired:true,
   technicalGroundingRequired:true,
   interpretationToTechnicalRatioRequired:true,
   paragraphRhythmRequired:true,
   subjectSpecificReferenceCopyForbidden:true
  },
  sectionOwnership:{rule:'Each section synthesizes only its governed palace/domain scope and does not duplicate adjacent sections.'},
  editorialExemplar:[
   'Lead with the section thesis, then synthesize palace purpose, star composition, network and timing.',
   'Never write a star-by-star glossary.',
   'Use substantial integrated blocks with clear section ownership and no cross-section repetition.',
   'Match the accepted reference in depth, synthesis density and customer voice without copying its subject-specific facts or sentences.'
  ]
 }
});

export function reportProReference(methodId){
 return REPORT_PRO_REFERENCES[methodId]||null;
}

export default Object.freeze({REPORT_PRO_REFERENCE_REGISTRY_VERSION,REPORT_PRO_REFERENCES,reportProReference});
