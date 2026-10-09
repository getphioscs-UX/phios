// Prevent a consumer from mutating accepted source guard lists at runtime.
export function freezeNavContract(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freezeNavContract(child);Object.freeze(value);}return value;}
