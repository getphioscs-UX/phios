import {registerHooks} from 'node:module';
import {assertIChingLegacyEntry,createIChingHistoricalResolve} from './iching-stateless-source-successor-r2.mjs';
assertIChingLegacyEntry(process.argv[1]);
registerHooks({resolve:createIChingHistoricalResolve()});
