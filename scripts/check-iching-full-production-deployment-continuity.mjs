// Current source is validated independently; historical assertions execute unchanged on their exact registered authority.
import './check-iching-stateless-current-r2.mjs';
import {runHistoricalIChingContinuity} from './lib/iching-stateless-source-successor-r2.mjs';
await runHistoricalIChingContinuity();
