import {refreshMasterOwnerTruth} from './lib/master-owner-truth.mjs';
const r=refreshMasterOwnerTruth();console.log(JSON.stringify({head:r.currentHead,layers:r.layers,W39:r.W39.totalItems,counts:{...r.W39,items:undefined},stops:r.W38.map(j=>[j.Journey,j.FIRST_STOP_NODE]),build:r.buildIdentity}));
