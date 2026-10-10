import {accountReportsApi} from '../account/account-reports-api.js';
export const onRequest=context=>accountReportsApi(context,'download');
