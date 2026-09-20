// Presentation-only design constraints. Never a method calculation authority.
export const REPORT_VISUAL_MASTERS = Object.freeze({
 M01:{role:'COVER',slots:['identity','birthDetails','pillars','elements','timingMotif'],visualShare:[.70,.80]},
 M02:{role:'EDITORIAL',slots:['title','question','diagram','threeKnowledgeBlocks','boundary'],visualShare:[.55,.65]},
 M03:{role:'SNAPSHOT',slots:['fourPillars','dayMaster','season','elements','primaryPattern','keyTension','observe'],visualShare:[.75,.85]},
 M04:{role:'STRUCTURE',slots:['core','support','tension','expression','condition'],visualShare:[.60,.75]},
 M05:{role:'DISTRIBUTION',slots:['distribution','rankedBars','relationships','balance','tension'],visualShare:[.60,.75]},
 M06:{role:'DOMAIN',slots:['domain','structure','environment','condition','helps','costs','observe'],visualShare:[.60,.75]},
 M07:{role:'TIMING',slots:['baseline','timingLayer','selectedPeriod','currentEvidence'],visualShare:[.60,.75]},
 M08:{role:'NAVIGATION',slots:['notice','compare','test','review','sourceLineage','boundary'],visualShare:[.45,.55]}
});
export const REPORT_CARD_FAMILIES=Object.freeze(['PRIMARY_INSIGHT','CONDITION','OBSERVATION','CURRENT_EVIDENCE','OPEN_QUESTION','SOURCE_LINEAGE']);
export const REPORT_VISUAL_DESIGN_RULES=Object.freeze({
 source:'docs/guided-report-successor-r1/reference-visual-attachment.md',
 referenceUse:'DESIGN_REFERENCE_ONLY',maxCoreInsights:3,cardBodyLines:[2,4],
 print:{format:'A4',marginMm:[15,18],neverSplit:['chart','primaryDiagram','keyCardGroup']},
 viewports:[390,768,1440],motion:['slowDraw','highlight','reveal','fadeLabel'],respectReducedMotion:true,
 sampleDataAuthority:false,humanVisualAcceptance:'PENDING',
 staticEditorialPrecedence:'PHIOS-GR-MG-VRPT-R1-L10N-COM-R2: exact-locale R2 P01–P05; personalized data starts P06'
});
export function baziVisualMaster(pageNumber){
 if(!Number.isInteger(pageNumber)||pageNumber<1||pageNumber>26)throw Error('BAZI_BLUEPRINT_PAGE_INVALID');
 return pageNumber===1?'M01':pageNumber<=5?'M02':pageNumber===6?'M03':pageNumber<=8?'M04':pageNumber<=11?'M05':pageNumber<=15?'M04':pageNumber<=19?'M06':pageNumber<=22?'M07':'M08';
}
