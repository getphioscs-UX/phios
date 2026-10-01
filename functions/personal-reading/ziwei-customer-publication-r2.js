import {buildZiweiCustomerPublication} from './ziwei-customer-publication.js';
import {bindZiweiReportVisual} from '../canonical-presentation-runtime/ziwei-report-visuals.js';
export function buildZiweiCustomerPublicationR2({r1,sections}){
 const snapshot=buildZiweiCustomerPublication({evidence:{structured:r1.evidence},sections,locale:r1.snapshot.locale,subjectPresentation:r1.subject});
 for(const p of snapshot.pages){p.visualBinding=bindZiweiReportVisual({sectionId:p.sectionId,pageNumber:p.pageNumber,isMaster:p.pageFamily==='SECTION_OPENER_PAGE'});p.heroPlacement=p.visualBinding.placement;p.editorialVersion='ZIWEI-EDITORIAL-R2';}
 return {...snapshot,editorialVersion:'ZIWEI-EDITORIAL-R2',visualRegistryVersion:'ZIWEI-REPORT-VISUAL-R2'};
}
