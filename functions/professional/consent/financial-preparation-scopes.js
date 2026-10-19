export const PREPARATION_SCOPES=Object.freeze(['preparation.needs','preparation.household','preparation.position','preparation.scenarios','preparation.policiesInvestments','preparation.tax','preparation.will','preparation.sources','preparation.discussion']);
export const PREPARATION_DEPENDENCIES=Object.freeze({
 'preparation.needs':['goals'],'preparation.household':['people','goals'],'preparation.position':['assets','liabilities','incomeStreams','expenses','assumptions'],
 'preparation.scenarios':['assets','liabilities'],'preparation.policiesInvestments':['policies','assets'],'preparation.tax':['incomeStreams','expenses'],
 'preparation.will':[],'preparation.sources':[],'preparation.discussion':[]
});
