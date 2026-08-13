import { refreshCarProductionActivation } from './lib/car-production/car-production-v1.mjs';
const activation = await refreshCarProductionActivation();
console.log(JSON.stringify({ status: activation.status, productionCounts: activation.productionCounts }, null, 2));
